import { DatePipe, isPlatformBrowser } from '@angular/common';
import { Component, OnDestroy, OnInit, PLATFORM_ID, computed, inject, signal } from '@angular/core';
import { NbCardModule, NbSelectModule } from '@nebular/theme';
import { AuthService } from 'src/app/features/auth/auth.service';
import { UsersService } from 'src/app/features/users/users.service';
import { CompanyUser } from 'src/app/features/users/interfaces/company-user';
import { ExchangeRateService } from '@shared/services/exchange-rate.service';
import { BsAmountPipe } from '@shared/pipes/bs-amount.pipe';
import { ToastService } from '@shared/services/toast.service';
import { AppNotification } from '../../interfaces/notification';
import { NotificationsService } from '../../notifications.service';
import { OrderPaidNotification, SocketService } from '../../socket.service';

@Component({
  selector: 'app-notifications-page',
  imports: [NbCardModule, NbSelectModule, DatePipe, BsAmountPipe],
  templateUrl: './notifications-page.html',
})
export class NotificationsPage implements OnInit, OnDestroy {

  private notificationsService = inject(NotificationsService);
  private usersService = inject(UsersService);
  private toast = inject(ToastService);
  private socket = inject(SocketService);
  protected auth = inject(AuthService);
  protected exchangeRate = inject(ExchangeRateService);
  private is_browser = isPlatformBrowser(inject(PLATFORM_ID));

  notifications = signal<AppNotification[]>([]);
  sellers = signal<CompanyUser[]>([]);
  is_loading = signal(true);

  filter_seller_id = signal<string | null>(null);

  is_admin = computed(() => this.auth.session()?.role?.slug === 'admin');

  private handleOrderPaid = (_payload: OrderPaidNotification) => this.load();

  ngOnInit(): void {
    if (!this.is_browser) return;

    if (this.is_admin()) {
      this.usersService.getCompanyUsers().subscribe((response) => this.sellers.set(response.users));
    }

    this.load();
    this.socket.onOrderPaid(this.handleOrderPaid);
  }

  ngOnDestroy(): void {
    this.socket.offOrderPaid(this.handleOrderPaid);
  }

  load(): void {
    this.is_loading.set(true);

    this.notificationsService.getNotifications({ seller_id: this.filter_seller_id() }).subscribe({
      next: (notifications) => {
        this.notifications.set(notifications);
        this.is_loading.set(false);
      },
      error: (err) => {
        this.toast.error(err?.error?.error ?? 'No pudimos cargar las notificaciones.');
        this.is_loading.set(false);
      }
    });
  }

  onSellerFilterChange(seller_id: string | null): void {
    this.filter_seller_id.set(seller_id);
    this.load();
  }
}
