import { DatePipe, isPlatformBrowser } from '@angular/common';
import { Component, OnInit, PLATFORM_ID, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { NbButtonModule, NbCardModule, NbDialogService, NbIconModule, NbTooltipModule } from '@nebular/theme';
import { NbEvaIconsModule } from '@nebular/eva-icons';
import { ToastService } from '@shared/services/toast.service';
import { ConfirmService } from '@shared/services/confirm.service';
import { ExchangeRateService } from '@shared/services/exchange-rate.service';
import { BsAmountPipe } from '@shared/pipes/bs-amount.pipe';
import { ImageViewerDialog } from '@shared/components/image-viewer-dialog/image-viewer-dialog';
import { LocationPicker } from '@shared/components/location-picker/location-picker';
import { AuthService } from 'src/app/features/auth/auth.service';
import { OrderDetail as OrderDetailModel } from '../../interfaces/order';
import { OrdersService } from '../../orders.service';

const STATUS_LABELS: Record<number, string> = { 1: 'En espera', 2: 'Pagado', 3: 'Atrasado', 4: 'Rechazado', 5: 'Verificado' };

@Component({
  selector: 'app-order-detail',
  imports: [NbCardModule, NbButtonModule, NbIconModule, NbEvaIconsModule, NbTooltipModule, RouterLink, BsAmountPipe, DatePipe, LocationPicker],
  templateUrl: './order-detail.html',
})
export class OrderDetail implements OnInit {

  private route = inject(ActivatedRoute);
  private ordersService = inject(OrdersService);
  private toast = inject(ToastService);
  private confirm = inject(ConfirmService);
  private dialogService = inject(NbDialogService);
  private auth = inject(AuthService);
  protected exchangeRate = inject(ExchangeRateService);
  private is_browser = isPlatformBrowser(inject(PLATFORM_ID));

  is_loading = signal(true);
  is_confirming = signal(false);
  is_verifying = signal(false);
  is_downloading = signal(false);
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

  isLinkExpired(expires_at: string): boolean {
    return new Date(expires_at).getTime() < Date.now();
  }

  statusLabel(status_id: number): string {
    return STATUS_LABELS[status_id] ?? '—';
  }

  statusBadgeClass(status_id: number): string {
    switch (status_id) {
      case 2: return 'bg-blue-100 text-blue-700';
      case 3: return 'bg-orange-100 text-orange-700';
      case 4: return 'bg-red-100 text-red-700';
      case 5: return 'bg-green-100 text-green-700';
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

    this.copyToClipboard(url, 'Link de pago copiado.');
  }

  copyBuyerData(): void {
    const order = this.data()?.order;
    if (!order || !order.first_name_client) return;

    const lines = [
      `Nombre: ${order.first_name_client} ${order.last_name_client}`,
      `Correo: ${order.email_client}`,
      `Cédula: ${order.ci_client}`,
      `Teléfono: ${order.phone_client}`,
      `Ubicación: ${order.address_client ?? '—'}`,
    ];
    if (order.lat != null && order.lng != null) {
      lines.push(`Ubicación (mapa): ${this.mapUrl(order.lat, order.lng)}`);
    }
    if (order.notes) lines.push(`Observaciones: ${order.notes}`);

    this.copyToClipboard(lines.join('\n'), 'Datos del comprador copiados.');
  }

  /** Link para abrir el punto marcado directo en Google Maps */
  mapUrl(lat: number, lng: number): string {
    return `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
  }

  /** Link de ruta en Google Maps, listo para que el delivery navegue hasta el punto */
  private routeUrl(lat: number, lng: number): string {
    return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
  }

  copyDeliveryRoute(): void {
    const order = this.data()?.order;
    if (!order || order.lat == null || order.lng == null) return;

    this.copyToClipboard(this.routeUrl(order.lat, order.lng), 'Ruta copiada para el delivery.');
  }

  copyProductsData(): void {
    const result = this.data();
    if (!result) return;

    const lines = result.items.map((item) => `${item.name} (Ref: ${item.reference ?? '—'}) - $${item.price}`);
    lines.push(`Total: $${result.order.amount}`);

    this.copyToClipboard(lines.join('\n'), 'Productos copiados.');
  }

  private copyToClipboard(text: string, successMessage: string): void {
    if (!this.is_browser) return;

    navigator.clipboard.writeText(text).then(
      () => this.toast.success(successMessage),
      () => this.toast.error('No pudimos copiar.')
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

  /**
   * Segundo chequeo del vendedor sobre un pago ya marcado como "Pagado":
   * pasa a "Verificado". Es un proceso sensible (no se puede deshacer desde
   * la pantalla), por eso pide confirmación antes de aplicarlo.
   */
  verifyPayment(): void {
    const order = this.data()?.order;
    if (!order || this.is_verifying()) return;

    const buyer_name = order.first_name_client ? `${order.first_name_client} ${order.last_name_client}` : 'el cliente';

    this.confirm.ask({
      title: 'Verificar pago',
      message: `¿Confirmas que verificaste el pago de ${buyer_name}? Esta acción no se puede deshacer.`,
      confirmLabel: 'Verificar pago',
      status: 'success',
    }).subscribe((confirmed) => {
      if (confirmed) this.doVerifyPayment(order.id);
    });
  }

  private doVerifyPayment(order_id: string): void {
    this.is_verifying.set(true);

    this.ordersService.updateStatus(order_id, 5).subscribe({
      next: () => {
        this.is_verifying.set(false);
        this.data.update((current) => current && { ...current, order: { ...current.order, status_id: 5 } });
        this.toast.success('Pago verificado.');
      },
      error: (err) => {
        this.is_verifying.set(false);
        this.toast.error(err?.error?.error ?? 'No pudimos verificar el pago.');
      }
    });
  }

  /** Abre el comprobante en un visor con zoom, rotacion y arrastre */
  openReceiptViewer(): void {
    const url = this.data()?.order?.receipt_url;
    if (!url) return;

    this.dialogService.open(ImageViewerDialog, {
      context: { src: url, alt: 'Comprobante de pago' },
      closeOnBackdropClick: true,
      hasScroll: false,
    });
  }

  /** Descarga el comprobante como archivo en vez de solo mostrarlo */
  downloadReceipt(): void {
    const order = this.data()?.order;
    const receipt_url = order?.receipt_url;
    if (!order || !receipt_url || this.is_downloading()) return;

    this.is_downloading.set(true);

    this.ordersService.downloadReceipt(order.id).subscribe({
      next: (blob) => {
        this.is_downloading.set(false);

        const extension = receipt_url.split('.').pop() || 'jpg';
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `comprobante-orden-${order.id}.${extension}`;
        link.click();
        URL.revokeObjectURL(url);
      },
      error: () => {
        this.is_downloading.set(false);
        this.toast.error('No pudimos descargar el comprobante.');
      }
    });
  }
}
