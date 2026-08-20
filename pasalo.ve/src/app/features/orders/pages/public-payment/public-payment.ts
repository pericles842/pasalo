import { isPlatformBrowser } from '@angular/common';
import { Component, OnInit, PLATFORM_ID, computed, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { NbButtonModule, NbCardModule } from '@nebular/theme';
import { ToastService } from '@shared/services/toast.service';
import { ExchangeRateService } from '@shared/services/exchange-rate.service';
import { BsAmountPipe } from '@shared/pipes/bs-amount.pipe';
import { PublicOrderSummary } from '../../interfaces/order';
import { PublicOrderService } from '../../public-order.service';

@Component({
  selector: 'app-public-payment',
  imports: [NbCardModule, NbButtonModule, BsAmountPipe],
  templateUrl: './public-payment.html',
})
export class PublicPayment implements OnInit {

  private route = inject(ActivatedRoute);
  private publicOrderService = inject(PublicOrderService);
  protected exchangeRate = inject(ExchangeRateService);
  private toast = inject(ToastService);
  private is_browser = isPlatformBrowser(inject(PLATFORM_ID));

  private tenant_id = '';
  private token = '';

  is_loading = signal(true);
  is_submitting = signal(false);
  not_found = signal(false);

  summary = signal<PublicOrderSummary | null>(null);

  selected_method_id = signal<number | null>(null);
  receipt_file = signal<File | null>(null);
  receipt_preview = signal<string | null>(null);

  submitted = signal(false);
  extracted_reference = signal<string | null>(null);

  /** El pago ya fue registrado antes de que este cliente entrara al link */
  already_paid = computed(() => this.summary()?.order.status_id === 2);

  can_submit = computed(() => !!this.selected_method_id() && !!this.receipt_file() && !this.is_submitting());

  ngOnInit(): void {
    if (!this.is_browser) return;

    this.tenant_id = this.route.snapshot.paramMap.get('tenant_id') ?? '';
    this.token = this.route.snapshot.paramMap.get('token') ?? '';

    this.publicOrderService.getSummary(this.tenant_id, this.token).subscribe({
      next: (summary) => {
        this.summary.set(summary);
        if (summary.payment_methods.length === 1) this.selected_method_id.set(summary.payment_methods[0].id);
        this.is_loading.set(false);
      },
      error: () => {
        this.not_found.set(true);
        this.is_loading.set(false);
      }
    });
  }

  parseDatos(datos: string): { label: string; value: string }[] {
    try {
      const parsed = JSON.parse(datos);
      return Object.entries(parsed).map(([key, value]) => ({
        label: key.charAt(0).toUpperCase() + key.slice(1),
        value: String(value)
      }));
    } catch {
      return [];
    }
  }

  selectMethod(id: number): void {
    this.selected_method_id.set(id);
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;

    this.receipt_file.set(file);
    this.receipt_preview.set(file ? URL.createObjectURL(file) : null);
  }

  submit(): void {
    if (!this.can_submit()) return;

    this.is_submitting.set(true);

    this.publicOrderService
      .submitPayment(this.tenant_id, this.token, this.selected_method_id()!, this.receipt_file()!)
      .subscribe({
        next: (response) => {
          this.is_submitting.set(false);
          this.submitted.set(true);
          this.extracted_reference.set(response.extracted_reference);
        },
        error: (err) => {
          this.is_submitting.set(false);
          this.toast.error(err?.error?.error ?? 'No pudimos registrar tu pago, intenta de nuevo.');
        }
      });
  }
}
