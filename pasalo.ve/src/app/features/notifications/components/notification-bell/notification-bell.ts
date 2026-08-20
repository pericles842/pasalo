import { isPlatformBrowser } from '@angular/common';
import { Component, OnDestroy, OnInit, PLATFORM_ID, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NbButtonModule, NbIconModule } from '@nebular/theme';
import { NbEvaIconsModule } from '@nebular/eva-icons';
import { ExchangeRateService } from '@shared/services/exchange-rate.service';
import { BsAmountPipe } from '@shared/pipes/bs-amount.pipe';
import { ToastService } from '@shared/services/toast.service';
import { AppNotification } from '../../interfaces/notification';
import { NotificationsService } from '../../notifications.service';
import { OrderPaidNotification, SocketService } from '../../socket.service';

const BELL_PREVIEW_LIMIT = 5;

@Component({
  selector: 'app-notification-bell',
  imports: [NbButtonModule, NbIconModule, NbEvaIconsModule, RouterLink, BsAmountPipe],
  templateUrl: './notification-bell.html',
})
export class NotificationBell implements OnInit, OnDestroy {

  private notificationsService = inject(NotificationsService);
  private socket = inject(SocketService);
  private toast = inject(ToastService);
  protected exchangeRate = inject(ExchangeRateService);
  private is_browser = isPlatformBrowser(inject(PLATFORM_ID));

  notifications = signal<AppNotification[]>([]);
  is_open = signal(false);
  deleting_id = signal<string | null>(null);

  private handleOrderPaid = (_payload: OrderPaidNotification) => this.load();

  ngOnInit(): void {
    if (!this.is_browser) return;

    this.load();
    this.socket.onOrderPaid(this.handleOrderPaid);
  }

  ngOnDestroy(): void {
    this.socket.offOrderPaid(this.handleOrderPaid);
  }

  private load(): void {
    this.notificationsService.getNotifications({ limit: BELL_PREVIEW_LIMIT }).subscribe({
      next: (notifications) => this.notifications.set(notifications),
      error: () => { }
    });
  }

  toggle(): void {
    this.is_open.update((value) => !value);
  }

  close(): void {
    this.is_open.set(false);
  }

  remove(notification: AppNotification, event: Event): void {
    event.stopPropagation();
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

  clearAll(event: Event): void {
    event.stopPropagation();
    if (this.notifications().length === 0) return;

    const confirmed = confirm('¿Eliminar todas tus notificaciones? Esta acción no se puede deshacer.');
    if (!confirmed) return;

    this.notificationsService.deleteAll().subscribe({
      next: () => {
        this.notifications.set([]);
        this.toast.success('Notificaciones eliminadas.');
      },
      error: (err) => this.toast.error(err?.error?.error ?? 'No pudimos eliminar las notificaciones.')
    });
  }
}
