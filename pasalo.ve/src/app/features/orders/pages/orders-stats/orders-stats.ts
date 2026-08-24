import { CurrencyPipe, DecimalPipe, isPlatformBrowser } from '@angular/common';
import { Component, OnInit, PLATFORM_ID, inject, signal } from '@angular/core';
import { NbButtonModule } from '@nebular/theme';
import { StatCard } from '@shared/components/stat-card/stat-card';
import { ToastService } from '@shared/services/toast.service';
import { OrderStats, OrdersService } from '../../orders.service';

@Component({
  selector: 'app-orders-stats',
  imports: [NbButtonModule, StatCard, CurrencyPipe, DecimalPipe],
  templateUrl: './orders-stats.html',
})
export class OrdersStats implements OnInit {

  private ordersService = inject(OrdersService);
  private toast = inject(ToastService);
  private is_browser = isPlatformBrowser(inject(PLATFORM_ID));

  is_loading = signal(true);
  stats = signal<OrderStats | null>(null);

  date_from = signal<string | null>(null);
  date_to = signal<string | null>(null);

  ngOnInit(): void {
    if (!this.is_browser) return;

    this.load();
  }

  onDateFromChange(event: Event): void {
    this.date_from.set((event.target as HTMLInputElement).value || null);
    this.load();
  }

  onDateToChange(event: Event): void {
    this.date_to.set((event.target as HTMLInputElement).value || null);
    this.load();
  }

  clearFilter(): void {
    this.date_from.set(null);
    this.date_to.set(null);
    this.load();
  }

  private load(): void {
    this.is_loading.set(true);

    this.ordersService.getStats(this.date_from(), this.date_to()).subscribe({
      next: (stats) => {
        this.stats.set(stats);
        this.is_loading.set(false);
      },
      error: (err) => {
        this.toast.error(err?.error?.error ?? 'No pudimos cargar las estadísticas.');
        this.is_loading.set(false);
      }
    });
  }
}
