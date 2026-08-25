import { isPlatformBrowser } from '@angular/common';
import { Component, OnInit, PLATFORM_ID, computed, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { NbButtonModule, NbCardModule } from '@nebular/theme';
import { ToastService } from '@shared/services/toast.service';
import { ExchangeRateService } from '@shared/services/exchange-rate.service';
import { BsAmountPipe } from '@shared/pipes/bs-amount.pipe';
import { Copyright } from '@shared/components/copyright/copyright';
import { Avatar } from '@shared/components/avatar/avatar';
import { GlobalInput } from '@shared/components/global-input/global-input';
import { getInitials } from '@shared/utils/initials';
import { BuyerForm, PublicOrderSummary } from '../../interfaces/order';
import { PublicOrderService } from '../../public-order.service';

/** 1 = tus datos, 2 = metodo de pago, 3 = comprobante */
type WizardStep = 1 | 2 | 3;

@Component({
  selector: 'app-public-payment',
  imports: [NbCardModule, NbButtonModule, BsAmountPipe, Copyright, Avatar, ReactiveFormsModule, GlobalInput],
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

  /** En que paso del wizard esta el cliente */
  step = signal<WizardStep>(1);

  /** Paso 1: sus propios datos. Mismas validaciones que antes llenaba el vendedor */
  buyer_form = new FormGroup<BuyerForm>({
    first_name: new FormControl(null, [Validators.required]),
    last_name: new FormControl(null, [Validators.required]),
    email: new FormControl(null, [Validators.required, Validators.email]),
    ci: new FormControl(null, [Validators.required]),
    phone: new FormControl(null, [Validators.required]),
    address: new FormControl(null),
  });
  is_submitting_buyer = signal(false);

  /** Paso 2: metodo de pago */
  selected_method_id = signal<number | null>(null);

  /** Paso 3: comprobante */
  receipt_file = signal<File | null>(null);
  receipt_preview = signal<string | null>(null);

  submitted = signal(false);
  extracted_reference = signal<string | null>(null);

  /** El pago ya fue registrado antes de que este cliente entrara al link (2 = pagado, 5 = verificado) */
  already_paid = computed(() => {
    const status_id = this.summary()?.order.status_id;
    return status_id === 2 || status_id === 5;
  });

  can_submit = computed(() => !!this.selected_method_id() && !!this.receipt_file() && !this.is_submitting());

  ngOnInit(): void {
    if (!this.is_browser) return;

    this.tenant_id = this.route.snapshot.paramMap.get('tenant_id') ?? '';
    this.token = this.route.snapshot.paramMap.get('token') ?? '';

    this.publicOrderService.getSummary(this.tenant_id, this.token).subscribe({
      next: (summary) => {
        this.summary.set(summary);
        if (summary.payment_methods.length === 1) this.selected_method_id.set(summary.payment_methods[0].id);

        // Si el cliente ya habia llenado sus datos antes (recargo la pagina,
        // o volvio despues de abandonar), no se le vuelve a pedir el paso 1
        if (summary.order.first_name_client) this.step.set(2);

        this.is_loading.set(false);
      },
      error: () => {
        this.not_found.set(true);
        this.is_loading.set(false);
      }
    });
  }

  getInitials(text: string | null | undefined): string {
    return getInitials(text);
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

  /** Paso 1 -> 2: guarda los datos del cliente en la orden */
  submitBuyer(): void {
    if (this.is_submitting_buyer()) return;

    this.buyer_form.markAllAsTouched();

    if (this.buyer_form.invalid) {
      this.toast.error('Revisa tus datos.');
      return;
    }

    this.is_submitting_buyer.set(true);
    const buyer = this.buyer_form.getRawValue();

    this.publicOrderService
      .submitBuyerData(this.tenant_id, this.token, {
        first_name: buyer.first_name!,
        last_name: buyer.last_name!,
        email: buyer.email!,
        ci: buyer.ci!,
        phone: buyer.phone!,
        address: buyer.address,
      })
      .subscribe({
        next: () => {
          this.is_submitting_buyer.set(false);
          this.summary.update((current) => current && {
            ...current,
            order: { ...current.order, first_name_client: buyer.first_name, last_name_client: buyer.last_name }
          });
          this.step.set(2);
        },
        error: (err) => {
          this.is_submitting_buyer.set(false);
          this.toast.error(err?.error?.error ?? 'No pudimos guardar tus datos, intenta de nuevo.');
        }
      });
  }

  /** Paso 2 -> 3: ya eligio con que va a pagar */
  continueToReceipt(): void {
    if (!this.selected_method_id()) return;
    this.step.set(3);
  }

  backToStep(step: WizardStep): void {
    this.step.set(step);
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
