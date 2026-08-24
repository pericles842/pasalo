import { DatePipe, DecimalPipe, isPlatformBrowser } from '@angular/common';
import { Component, OnDestroy, OnInit, PLATFORM_ID, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NbButtonModule, NbCardModule, NbIconModule, NbSelectModule } from '@nebular/theme';
import { NbEvaIconsModule } from '@nebular/eva-icons';
import { AuthService } from 'src/app/features/auth/auth.service';
import { UsersService } from 'src/app/features/users/users.service';
import { CompanyUser } from 'src/app/features/users/interfaces/company-user';
import { ToastService } from '@shared/services/toast.service';
import { ConfirmService } from '@shared/services/confirm.service';
import { ExchangeRateService } from '@shared/services/exchange-rate.service';
import { BsAmountPipe } from '@shared/pipes/bs-amount.pipe';
import { OrderPaidNotification, SocketService } from 'src/app/features/notifications/socket.service';
import { Order, OrderStatus } from '../../interfaces/order';
import { OrdersService } from '../../orders.service';

@Component({
  selector: 'app-orders-list',
  imports: [NbCardModule, NbSelectModule, NbButtonModule, NbIconModule, NbEvaIconsModule, DatePipe, DecimalPipe, RouterLink, BsAmountPipe],
  templateUrl: './orders-list.html',
})
export class OrdersList implements OnInit, OnDestroy {

  private ordersService = inject(OrdersService);
  private usersService = inject(UsersService);
  protected auth = inject(AuthService);
  protected exchangeRate = inject(ExchangeRateService);
  private toast = inject(ToastService);
  private confirm = inject(ConfirmService);
  private socket = inject(SocketService);
  private is_browser = isPlatformBrowser(inject(PLATFORM_ID));

  orders = signal<Order[]>([]);
  statuses = signal<OrderStatus[]>([]);
  sellers = signal<CompanyUser[]>([]);

  is_loading = signal(true);
  updating_order_id = signal<string | null>(null);

  /** Paginado: 10 ordenes por pagina */
  readonly page_size = 10;
  page = signal(1);
  total_pages = signal(1);
  total = signal(0);

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
      .getOrders({
        seller_id: this.filter_seller_id(),
        status_id: this.filter_status_id(),
        page: this.page(),
        limit: this.page_size
      })
      .subscribe({
        next: (response) => {
          this.orders.set(response.orders);
          this.total.set(response.total);
          this.total_pages.set(response.total_pages);
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
    this.page.set(1);
    this.loadOrders();
  }

  onStatusFilterChange(status_id: number | null): void {
    this.filter_status_id.set(status_id);
    this.page.set(1);
    this.loadOrders();
  }

  goToPage(page: number): void {
    if (page < 1 || page > this.total_pages() || page === this.page()) return;
    this.page.set(page);
    this.loadOrders();
  }

  /** Paginas a mostrar en el paginador: siempre primera/ultima y un rango alrededor de la actual */
  visible_pages = computed<(number | '...')[]>(() => {
    const total = this.total_pages();
    const current = this.page();
    const pages: (number | '...')[] = [];

    let previous = 0;
    for (let i = 1; i <= total; i++) {
      if (i === 1 || i === total || Math.abs(i - current) <= 1) {
        if (previous && i - previous > 1) pages.push('...');
        pages.push(i);
        previous = i;
      }
    }

    return pages;
  });

  statusName(status_id: number): string {
    return this.statusMap().get(status_id)?.name ?? '—';
  }

  /**
   * "Verificado" solo se puede elegir desde el selector si la orden ya esta
   * en "Pagado" (o ya esta verificada, para que la opcion actual siga
   * apareciendo). Nunca se ofrece saltar directo desde En espera/Atrasado/
   * Rechazado: eso solo se hace a mano desde la pantalla de la orden.
   */
  selectableStatuses(order: Order): OrderStatus[] {
    return this.statuses().filter(
      (status) => status.id !== this.VERIFIED_STATUS_ID || order.status_id === 2 || order.status_id === this.VERIFIED_STATUS_ID
    );
  }

  /** Fondo del renglon: sospechoso manda; si no, depende del estado */
  rowClass(order: Order): string {
    if (order.is_suspicious && order.status_id === 1) return 'bg-amber-50';

    switch (order.status_id) {
      case 2: return 'bg-blue-50';
      case 4: return 'bg-red-50';
      case 5: return 'bg-green-50';
      default: return '';
    }
  }

  /** Color del texto: mismo tono del fondo pero mas oscuro, para que contraste */
  rowTextClass(order: Order): string {
    if (order.is_suspicious && order.status_id === 1) return 'text-amber-800';

    switch (order.status_id) {
      case 2: return 'text-blue-800';
      case 4: return 'text-red-800';
      case 5: return 'text-green-800';
      default: return '';
    }
  }

  /** El comprobante trae Bs si el metodo es en bolivares; si no, ya viene en USD */
  isBsMethod(order: Order): boolean {
    return order.payment_method_type === 'pagomovil' || order.payment_method_type === 'transferencia';
  }

  /** Pasar a "Verificado" (id 5) es sensible: no se puede deshacer desde aca */
  private readonly VERIFIED_STATUS_ID = 5;

  changeStatus(order: Order, status_id: number): void {
    if (status_id === order.status_id) return;

    if (status_id === this.VERIFIED_STATUS_ID) {
      this.confirm.ask({
        title: 'Verificar pago',
        message: `¿Confirmas que verificaste el pago de ${order.first_name_client} ${order.last_name_client}? Esta acción no se puede deshacer.`,
        confirmLabel: 'Verificar pago',
        status: 'success',
      }).subscribe((confirmed) => {
        if (confirmed) this.applyStatusChange(order, status_id);
      });
      return;
    }

    this.applyStatusChange(order, status_id);
  }

  private applyStatusChange(order: Order, status_id: number): void {
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
