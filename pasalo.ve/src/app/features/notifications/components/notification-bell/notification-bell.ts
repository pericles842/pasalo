import { isPlatformBrowser } from '@angular/common';
import { Component, OnDestroy, OnInit, PLATFORM_ID, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NbButtonModule, NbIconModule } from '@nebular/theme';
import { NbEvaIconsModule } from '@nebular/eva-icons';
import { ExchangeRateService } from '@shared/services/exchange-rate.service';
import { BsAmountPipe } from '@shared/pipes/bs-amount.pipe';
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
  protected exchangeRate = inject(ExchangeRateService);
  private is_browser = isPlatformBrowser(inject(PLATFORM_ID));

  notifications = signal<AppNotification[]>([]);
  is_open = signal(false);

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
}
