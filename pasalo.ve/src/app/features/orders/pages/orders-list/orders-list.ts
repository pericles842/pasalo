import { DatePipe, isPlatformBrowser } from '@angular/common';
import { Component, OnDestroy, OnInit, PLATFORM_ID, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NbButtonModule, NbCardModule, NbIconModule, NbSelectModule } from '@nebular/theme';
import { NbEvaIconsModule } from '@nebular/eva-icons';
import { AuthService } from 'src/app/features/auth/auth.service';
import { UsersService } from 'src/app/features/users/users.service';
import { CompanyUser } from 'src/app/features/users/interfaces/company-user';
import { ToastService } from '@shared/services/toast.service';
import { ExchangeRateService } from '@shared/services/exchange-rate.service';
import { BsAmountPipe } from '@shared/pipes/bs-amount.pipe';
import { OrderPaidNotification, SocketService } from 'src/app/features/notifications/socket.service';
import { Order, OrderStatus } from '../../interfaces/order';
import { OrdersService } from '../../orders.service';

@Component({
  selector: 'app-orders-list',
  imports: [NbCardModule, NbSelectModule, NbButtonModule, NbIconModule, NbEvaIconsModule, DatePipe, RouterLink, BsAmountPipe],
  templateUrl: './orders-list.html',
})
export class OrdersList implements OnInit, OnDestroy {

  private ordersService = inject(OrdersService);
  private usersService = inject(UsersService);
  protected auth = inject(AuthService);
  protected exchangeRate = inject(ExchangeRateService);
  private toast = inject(ToastService);
  private socket = inject(SocketService);
  private is_browser = isPlatformBrowser(inject(PLATFORM_ID));

  orders = signal<Order[]>([]);
  statuses = signal<OrderStatus[]>([]);
  sellers = signal<CompanyUser[]>([]);

  is_loading = signal(true);
  updating_order_id = signal<string | null>(null);

  /** Filtrado simple: por vendedor (solo admin) y por estado */
  filter_seller_id = signal<string | null>(null);
  filter_status_id = signal<number | null>(null);

  is_admin = computed(() => this.auth.session()?.role?.slug === 'admin');

  statusMap = computed(() => new Map(this.statuses().map((s) => [s.id, s])));

  /** Guardada para poder quitar el listener al salir de la pantalla */
  private handleOrderPaid = (_payload: OrderPaidNotification) => this.loadOrders();

  ngOnInit(): void {
    if (!this.is_browser) return;

    this.ordersService.getStatuses().subscribe((statuses) => this.statuses.set(statuses));

    if (this.is_admin()) {
      this.usersService.getCompanyUsers().subscribe((response) => this.sellers.set(response.users));
    }

    this.loadOrders();

    // El vendedor/admin ve la orden pasar a "Pagado" sin tener que recargar la pantalla
    this.socket.onOrderPaid(this.handleOrderPaid);
  }

  ngOnDestroy(): void {
    this.socket.offOrderPaid(this.handleOrderPaid);
  }

  loadOrders(): void {
    this.is_loading.set(true);

    this.ordersService
      .getOrders({ seller_id: this.filter_seller_id(), status_id: this.filter_status_id() })
      .subscribe({
        next: (orders) => {
          this.orders.set(orders);
          this.is_loading.set(false);
        },
        error: (err) => {
          this.toast.error(err?.error?.error ?? 'No pudimos cargar las órdenes.');
          this.is_loading.set(false);
        }
      });
  }

  onSellerFilterChange(seller_id: string | null): void {
    this.filter_seller_id.set(seller_id);
    this.loadOrders();
  }

  onStatusFilterChange(status_id: number | null): void {
    this.filter_status_id.set(status_id);
    this.loadOrders();
  }

  statusName(status_id: number): string {
    return this.statusMap().get(status_id)?.name ?? '—';
  }

  changeStatus(order: Order, status_id: number): void {
    if (status_id === order.status_id) return;

    this.updating_order_id.set(order.id);

    this.ordersService.updateStatus(order.id, status_id).subscribe({
      next: () => {
        this.updating_order_id.set(null);
        this.orders.update((orders) => orders.map((o) => (o.id === order.id ? { ...o, status_id } : o)));
        this.toast.success(`Orden marcada como ${this.statusName(status_id)}.`);
      },
      error: (err) => {
        this.updating_order_id.set(null);
        this.toast.error(err?.error?.error ?? 'No pudimos actualizar el estado.');
      }
    });
  }
}
