import { DatePipe, isPlatformBrowser } from '@angular/common';
import { Component, OnDestroy, OnInit, PLATFORM_ID, computed, inject, signal } from '@angular/core';
import { NbButtonModule, NbCardModule, NbIconModule, NbSelectModule } from '@nebular/theme';
import { NbEvaIconsModule } from '@nebular/eva-icons';
import { AuthService } from 'src/app/features/auth/auth.service';
import { UsersService } from 'src/app/features/users/users.service';
import { CompanyUser } from 'src/app/features/users/interfaces/company-user';
import { ExchangeRateService } from '@shared/services/exchange-rate.service';
import { BsAmountPipe } from '@shared/pipes/bs-amount.pipe';
import { ToastService } from '@shared/services/toast.service';
import { ConfirmService } from '@shared/services/confirm.service';
import { AppNotification } from '../../interfaces/notification';
import { NotificationsService } from '../../notifications.service';
import { OrderPaidNotification, SocketService } from '../../socket.service';

@Component({
  selector: 'app-notifications-page',
  imports: [NbCardModule, NbSelectModule, NbButtonModule, NbIconModule, NbEvaIconsModule, DatePipe, BsAmountPipe],
  templateUrl: './notifications-page.html',
})
export class NotificationsPage implements OnInit, OnDestroy {

  private notificationsService = inject(NotificationsService);
  private usersService = inject(UsersService);
  private toast = inject(ToastService);
  private confirm = inject(ConfirmService);
  private socket = inject(SocketService);
  protected auth = inject(AuthService);
  protected exchangeRate = inject(ExchangeRateService);
  private is_browser = isPlatformBrowser(inject(PLATFORM_ID));

  notifications = signal<AppNotification[]>([]);
  sellers = signal<CompanyUser[]>([]);
  is_loading = signal(true);
  deleting_id = signal<string | null>(null);

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

  remove(notification: AppNotification): void {
    if (this.deleting_id()) return;

    this.deleting_id.set(notification.id);

    this.notificationsService.deleteNotification(notification.id).subscribe({
      next: () => {
        this.deleting_id.set(null);
        this.notifications.update((list) => list.filter((n) => n.id !== notification.id));
      },
      error: (err) => {
        this.deleting_id.set(null);
        this.toast.error(err?.error?.error ?? 'No pudimos eliminar la notificación.');
      }
    });
  }

  clearAll(): void {
    if (this.notifications().length === 0) return;

    this.confirm.ask({
      title: 'Eliminar notificaciones',
      message: '¿Eliminar todas estas notificaciones? Esta acción no se puede deshacer.',
      confirmLabel: 'Eliminar todas',
    }).subscribe((confirmed) => {
      if (!confirmed) return;

      this.notificationsService.deleteAll().subscribe({
        next: () => {
          this.notifications.set([]);
          this.toast.success('Notificaciones eliminadas.');
        },
        error: (err) => this.toast.error(err?.error?.error ?? 'No pudimos eliminar las notificaciones.')
      });
    });
  }
}
