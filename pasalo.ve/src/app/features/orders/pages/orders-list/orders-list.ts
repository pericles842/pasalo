import { DatePipe, DecimalPipe, isPlatformBrowser } from '@angular/common';
import { Component, OnDestroy, OnInit, PLATFORM_ID, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NbButtonModule, NbCardModule, NbIconModule, NbSelectModule } from '@nebular/theme';
import { NbEvaIconsModule } from '@nebular/eva-icons';
import { forkJoin, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import JSZip from 'jszip';
import { AuthService } from 'src/app/features/auth/auth.service';
import { UsersService } from 'src/app/features/users/users.service';
import { CompanyUser } from 'src/app/features/users/interfaces/company-user';
import { ToastService } from '@shared/services/toast.service';
import { ConfirmService } from '@shared/services/confirm.service';
import { ExchangeRateService } from '@shared/services/exchange-rate.service';
import { OrderPaidNotification, SocketService } from 'src/app/features/notifications/socket.service';
import { Order, OrderStatus } from '../../interfaces/order';
import { OrdersService } from '../../orders.service';

@Component({
  selector: 'app-orders-list',
  imports: [NbCardModule, NbSelectModule, NbButtonModule, NbIconModule, NbEvaIconsModule, DatePipe, DecimalPipe, RouterLink],
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
  is_downloading_receipts = signal(false);

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

  /** Solo cuentan las ordenes con comprobante ya subido, de las que estan visibles en esta pagina */
  ordersWithReceipt = computed(() =>
    this.orders().filter((o): o is Order & { receipt_url: string } => !!o.receipt_url)
  );

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

  /** Bs fijado por el vendedor al crear la orden; si es una orden vieja sin ese dato, se calcula con la tasa activa */
  resolvedBsAmount(order: Order): number | null {
    if (order.bs_amount !== null && order.bs_amount !== undefined) return order.bs_amount;

    const rate = this.exchangeRate.activeRate();
    return rate ? order.amount * rate : null;
  }

  /** Pasar a "Verificado" (id 5) es sensible: no se puede deshacer desde aca */
  private readonly VERIFIED_STATUS_ID = 5;

  changeStatus(order: Order, status_id: number): void {
    if (status_id === order.status_id) return;

    if (status_id === this.VERIFIED_STATUS_ID) {
      const buyer_name = order.first_name_client ? `${order.first_name_client} ${order.last_name_client}` : 'el cliente';

      this.confirm.ask({
        title: 'Verificar pago',
        message: `¿Confirmas que verificaste el pago de ${buyer_name}? Esta acción no se puede deshacer.`,
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

  /**
   * Descarga en un solo .zip los comprobantes de las ordenes visibles en la
   * pagina actual (no de todo el listado: eso obligaria a traer paginas que
   * el usuario ni pidio ver). Cada comprobante se pide con el mismo endpoint
   * de descarga individual, en paralelo.
   */
  downloadAllReceipts(): void {
    const ordersWithReceipt = this.ordersWithReceipt();
    if (!ordersWithReceipt.length || this.is_downloading_receipts()) return;

    this.is_downloading_receipts.set(true);

    const downloads = ordersWithReceipt.map((order) =>
      this.ordersService.downloadReceipt(order.id).pipe(
        map((blob) => ({ order, blob })),
        catchError(() => of(null))
      )
    );

    forkJoin(downloads).subscribe(async (results) => {
      const ok: { order: Order & { receipt_url: string }; blob: Blob }[] = [];
      const failed: (Order & { receipt_url: string })[] = [];

      results.forEach((result, i) => (result ? ok.push(result) : failed.push(ordersWithReceipt[i])));

      if (ok.length) {
        const zip = new JSZip();
        ok.forEach(({ order, blob }) => {
          const extension = order.receipt_url.split('.').pop() || 'jpg';
          zip.file(`comprobante-${order.id}.${extension}`, blob);
        });

        const zipBlob = await zip.generateAsync({ type: 'blob' });

        const url = URL.createObjectURL(zipBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `comprobantes-pagina-${this.page()}.zip`;
        link.click();
        URL.revokeObjectURL(url);

        this.toast.success(`Se descargaron ${ok.length} comprobante(s): ${ok.map((r) => this.orderLabel(r.order)).join(', ')}`);
      }

      if (failed.length) {
        this.toast.error(`No se pudieron descargar ${failed.length} comprobante(s): ${failed.map((o) => this.orderLabel(o)).join(', ')}`);
      }

      this.is_downloading_receipts.set(false);
    });
  }

  /** Nombre del comprador si ya lo lleno, o el id corto de la orden como respaldo */
  private orderLabel(order: Order): string {
    if (order.first_name_client) return `${order.first_name_client} ${order.last_name_client}`.trim();
    return `orden #${order.id.slice(0, 8)}`;
  }
}
