import { isPlatformBrowser } from '@angular/common';
import { Component, OnDestroy, OnInit, PLATFORM_ID, computed, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { NbButtonModule, NbIconModule } from '@nebular/theme';
import { NbEvaIconsModule } from '@nebular/eva-icons';
import { ExchangeRateService } from '@shared/services/exchange-rate.service';
import { BsAmountPipe } from '@shared/pipes/bs-amount.pipe';
import { ToastService } from '@shared/services/toast.service';
import { ConfirmService } from '@shared/services/confirm.service';
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
  private router = inject(Router);
  private toast = inject(ToastService);
  private confirm = inject(ConfirmService);
  protected exchangeRate = inject(ExchangeRateService);
  private is_browser = isPlatformBrowser(inject(PLATFORM_ID));

  notifications = signal<AppNotification[]>([]);
  is_open = signal(false);
  deleting_id = signal<string | null>(null);

  /**
   * Un pago sospechoso deja de mostrarse aca en cuanto su orden se aprueba
   * (status_id !== 1): ya no necesita atencion, pero sigue en el historial
   * completo (no se elimina, solo se quita de esta vista rapida).
   */
  visibleNotifications = computed(() =>
    this.notifications().filter((n) => !n.is_suspicious || n.order_status_id === 1)
  );

  private handleOrderPaid = (_payload: OrderPaidNotification) => this.load();
  private handleOrderStatusChanged = () => this.load();

  ngOnInit(): void {
    if (!this.is_browser) return;

    this.load();
    this.socket.onOrderPaid(this.handleOrderPaid);
    this.socket.onOrderStatusChanged(this.handleOrderStatusChanged);
  }

  ngOnDestroy(): void {
    this.socket.offOrderPaid(this.handleOrderPaid);
    this.socket.offOrderStatusChanged(this.handleOrderStatusChanged);
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

  goToOrder(notification: AppNotification): void {
    this.close();
    this.router.navigate(['/dashboard', notification.order_id]);
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

    this.confirm.ask({
      title: 'Eliminar notificaciones',
      message: '¿Eliminar todas tus notificaciones? Esta acción no se puede deshacer.',
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
