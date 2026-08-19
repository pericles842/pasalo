import { isPlatformBrowser } from '@angular/common';
import { Component, OnInit, PLATFORM_ID, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { NbButtonModule, NbCardModule } from '@nebular/theme';
import { ToastService } from '@shared/services/toast.service';
import { AuthService } from 'src/app/features/auth/auth.service';
import { OrderDetail as OrderDetailModel } from '../../interfaces/order';
import { OrdersService } from '../../orders.service';

const STATUS_LABELS: Record<number, string> = { 1: 'En espera', 2: 'Pagado', 3: 'Atrasado' };

@Component({
  selector: 'app-order-detail',
  imports: [NbCardModule, NbButtonModule, RouterLink],
  templateUrl: './order-detail.html',
})
export class OrderDetail implements OnInit {

  private route = inject(ActivatedRoute);
  private ordersService = inject(OrdersService);
  private toast = inject(ToastService);
  private auth = inject(AuthService);
  private is_browser = isPlatformBrowser(inject(PLATFORM_ID));

  is_loading = signal(true);
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
}
