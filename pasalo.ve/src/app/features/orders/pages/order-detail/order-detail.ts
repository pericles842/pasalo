import { DatePipe, isPlatformBrowser } from '@angular/common';
import { Component, OnInit, PLATFORM_ID, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { NbButtonModule, NbCardModule, NbIconModule } from '@nebular/theme';
import { NbEvaIconsModule } from '@nebular/eva-icons';
import { ToastService } from '@shared/services/toast.service';
import { ExchangeRateService } from '@shared/services/exchange-rate.service';
import { BsAmountPipe } from '@shared/pipes/bs-amount.pipe';
import { AuthService } from 'src/app/features/auth/auth.service';
import { OrderDetail as OrderDetailModel } from '../../interfaces/order';
import { OrdersService } from '../../orders.service';

const STATUS_LABELS: Record<number, string> = { 1: 'En espera', 2: 'Pagado', 3: 'Atrasado', 4: 'Rechazado' };

@Component({
  selector: 'app-order-detail',
  imports: [NbCardModule, NbButtonModule, NbIconModule, NbEvaIconsModule, RouterLink, BsAmountPipe, DatePipe],
  templateUrl: './order-detail.html',
})
export class OrderDetail implements OnInit {

  private route = inject(ActivatedRoute);
  private ordersService = inject(OrdersService);
  private toast = inject(ToastService);
  private auth = inject(AuthService);
  protected exchangeRate = inject(ExchangeRateService);
  private is_browser = isPlatformBrowser(inject(PLATFORM_ID));

  is_loading = signal(true);
  is_confirming = signal(false);
  data = signal<OrderDetailModel | null>(null);

  ngOnInit(): void {
    if (!this.is_browser) return;

    const id = this.route.snapshot.paramMap.get('id');
    if (!id) return;

    this.ordersService.getOrderById(id).subscribe({
      next: (data) => {
        this.data.set(data);
        this.is_loading.set(false);
      },
      error: (err) => {
        this.toast.error(err?.error?.error ?? 'No pudimos cargar la orden.');
        this.is_loading.set(false);
      }
    });
  }

  statusLabel(status_id: number): string {
    return STATUS_LABELS[status_id] ?? '—';
  }

  statusBadgeClass(status_id: number): string {
    switch (status_id) {
      case 2: return 'bg-green-100 text-green-700';
      case 3: return 'bg-orange-100 text-orange-700';
      case 4: return 'bg-red-100 text-red-700';
      default: return 'bg-amber-100 text-amber-700';
    }
  }

  /** Reconstruye el link publico para volver a compartirlo */
  payUrl(): string {
    const order = this.data()?.order;
    const tenant_id = this.auth.session()?.company?.tenant_id;
    if (!order || !tenant_id || !this.is_browser) return '';

    return `${window.location.origin}/p/${tenant_id}/${order.pay_url_token}`;
  }

  copyPayUrl(): void {
    const url = this.payUrl();
    if (!url) return;

    navigator.clipboard.writeText(url).then(
      () => this.toast.success('Link de pago copiado.'),
      () => this.toast.error('No pudimos copiar el link.')
    );
  }

  confirmPayment(): void {
    const order = this.data()?.order;
    if (!order || this.is_confirming()) return;

    this.is_confirming.set(true);

    this.ordersService.updateStatus(order.id, 2).subscribe({
      next: () => {
        this.is_confirming.set(false);
        this.data.update((current) => current && { ...current, order: { ...current.order, status_id: 2 } });
        this.toast.success('Pago confirmado.');
      },
      error: (err) => {
        this.is_confirming.set(false);
        this.toast.error(err?.error?.error ?? 'No pudimos confirmar el pago.');
      }
    });
  }
}
