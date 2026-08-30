import { DecimalPipe, isPlatformBrowser } from '@angular/common';
import { Component, OnInit, PLATFORM_ID, computed, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { NbButtonModule, NbCardModule, NbIconModule, NbTooltipModule } from '@nebular/theme';
import { NbEvaIconsModule } from '@nebular/eva-icons';
import { ToastService } from '@shared/services/toast.service';
import { Copyright } from '@shared/components/copyright/copyright';
import { Avatar } from '@shared/components/avatar/avatar';
import { GlobalInput } from '@shared/components/global-input/global-input';
import { CiInput } from '@shared/components/ci-input/ci-input';
import { PhoneInput } from '@shared/components/phone-input/phone-input';
import { getInitials } from '@shared/utils/initials';
import { compressImage } from '@shared/utils/compress-image';
import { BuyerForm, PublicOrderSummary } from '../../interfaces/order';
import { PublicOrderService } from '../../public-order.service';

/** 1 = tus datos, 2 = metodo de pago + comprobante */
type WizardStep = 1 | 2;

@Component({
  selector: 'app-public-payment',
  imports: [NbCardModule, NbButtonModule, NbIconModule, NbEvaIconsModule, NbTooltipModule, DecimalPipe, Copyright, Avatar, ReactiveFormsModule, GlobalInput, CiInput, PhoneInput],
  templateUrl: './public-payment.html',
})
export class PublicPayment implements OnInit {

  private route = inject(ActivatedRoute);
  private publicOrderService = inject(PublicOrderService);
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

  /** Paso 1: sus propios datos. Que campos son obligatorios lo define la empresa (ver applyRequiredFields) */
  buyer_form = new FormGroup<BuyerForm>({
    first_name: new FormControl(null),
    last_name: new FormControl(null),
    email: new FormControl(null, [Validators.email]),
    ci: new FormControl(null),
    phone: new FormControl(null),
    address: new FormControl(null),
  });
  is_submitting_buyer = signal(false);

  /** Paso 2: metodo de pago + comprobante */
  selected_method_id = signal<number | null>(null);
  receipt_file = signal<File | null>(null);
  receipt_preview = signal<string | null>(null);

  submitted = signal(false);
  extracted_reference = signal<string | null>(null);

  /** El pago ya fue registrado antes de que este cliente entrara al link (2 = pagado, 5 = verificado) */
  already_paid = computed(() => {
    const status_id = this.summary()?.order.status_id;
    return status_id === 2 || status_id === 5;
  });

  /** El backend ya descuenta las ordenes pagadas: nunca aparecen como vencidas */
  is_expired = computed(() => this.summary()?.order.is_expired ?? false);

  can_submit = computed(() => !!this.selected_method_id() && !!this.receipt_file() && !this.is_submitting());

  ngOnInit(): void {
    if (!this.is_browser) return;

    this.tenant_id = this.route.snapshot.paramMap.get('tenant_id') ?? '';
    this.token = this.route.snapshot.paramMap.get('token') ?? '';

    this.publicOrderService.getSummary(this.tenant_id, this.token).subscribe({
      next: (summary) => {
        this.summary.set(summary);
        this.applyRequiredFields(summary.order.required_fields);
        if (summary.payment_methods.length > 0) this.selected_method_id.set(summary.payment_methods[0].id);

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

  /** Aplica los Validators.required segun lo que la empresa configuro para su comprador */
  private applyRequiredFields(required_fields: string[]): void {
    (Object.keys(this.buyer_form.controls) as (keyof BuyerForm)[]).forEach((field) => {
      const control = this.buyer_form.controls[field];
      const base = field === 'email' ? [Validators.email] : [];

      control.setValidators(required_fields.includes(field) ? [Validators.required, ...base] : base);
      control.updateValueAndValidity({ emitEvent: false });
    });
  }

  isRequired(field: keyof BuyerForm): boolean {
    return (this.summary()?.order.required_fields ?? []).includes(field);
  }

  parseDatos(datos: Record<string, string> | string): { label: string; value: string }[] {
    if (!datos) return [];

    // MySQL real (produccion) autoparsea la columna JSON a objeto; algunos
    // motores locales (ej. MariaDB) la devuelven como texto: se soportan ambos
    let parsed: Record<string, string>;
    if (typeof datos === 'string') {
      try {
        parsed = JSON.parse(datos);
      } catch {
        return [];
      }
    } else {
      parsed = datos;
    }

    return Object.entries(parsed).map(([key, value]) => ({
      label: key.charAt(0).toUpperCase() + key.slice(1),
      value: String(value)
    }));
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
        first_name: buyer.first_name,
        last_name: buyer.last_name,
        email: buyer.email,
        ci: buyer.ci,
        phone: buyer.phone,
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
          this.markExpiredIfNeeded(err);
          this.toast.error(err?.error?.error ?? 'No pudimos guardar tus datos, intenta de nuevo.');
        }
      });
  }

  /** El link pudo vencer justo mientras el cliente llenaba el paso 1/2: se refleja al toque */
  private markExpiredIfNeeded(err: { status?: number }): void {
    if (err?.status !== 410) return;
    this.summary.update((current) => current && { ...current, order: { ...current.order, is_expired: true } });
  }

  backToStep(step: WizardStep): void {
    this.step.set(step);
  }

  selectMethod(id: number): void {
    this.selected_method_id.set(id);
  }

  /** Copia un solo dato (banco, teléfono, monto, etc.) para pegarlo directo en la app del banco */
  copyValue(value: string, label: string): void {
    if (!this.is_browser) return;

    navigator.clipboard.writeText(value).then(
      () => this.toast.success(`${label} copiado.`),
      () => this.toast.error('No pudimos copiar.')
    );
  }

  async onFileSelected(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;

    const compressed = file ? await compressImage(file) : null;

    this.receipt_file.set(compressed);
    this.receipt_preview.set(compressed ? URL.createObjectURL(compressed) : null);
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
          this.markExpiredIfNeeded(err);
          this.toast.error(err?.error?.error ?? 'No pudimos registrar tu pago, intenta de nuevo.');
        }
      });
  }
}
