import { isPlatformBrowser } from '@angular/common';
import { Component, OnInit, PLATFORM_ID, computed, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { NbButtonModule, NbCardModule, NbSelectModule } from '@nebular/theme';
import { GlobalInput } from '@shared/components/global-input/global-input';
import { ToastService } from '@shared/services/toast.service';
import { CreatePaymentMethodPayload, PaymentMethod, PaymentMethodForm, PaymentMethodType } from '../../interfaces/payment-method';
import { PaymentMethodsService } from '../../payment-methods.service';

const TYPE_LABELS: Record<PaymentMethodType, string> = {
  pagomovil: 'Pago Móvil',
  transferencia: 'Transferencia bancaria',
  billetera_digital: 'Billetera digital (Zelle, Binance...)'
};

@Component({
  selector: 'app-payment-methods-page',
  imports: [ReactiveFormsModule, NbCardModule, NbButtonModule, NbSelectModule, GlobalInput],
  templateUrl: './payment-methods-page.html',
})
export class PaymentMethodsPage implements OnInit {

  private paymentMethodsService = inject(PaymentMethodsService);
  private toast = inject(ToastService);
  private is_browser = isPlatformBrowser(inject(PLATFORM_ID));

  methods = signal<PaymentMethod[]>([]);
  is_loading = signal(true);
  is_saving = signal(false);
  deleting_id = signal<number | null>(null);

  typeLabels = TYPE_LABELS;

  form = new FormGroup<PaymentMethodForm>({
    name: new FormControl(null, [Validators.required]),
    type: new FormControl(null, [Validators.required]),
    titular: new FormControl(null),
    banco: new FormControl(null),
    telefono: new FormControl(null),
    numero_cuenta: new FormControl(null),
    cedula: new FormControl(null),
    correo: new FormControl(null),
  });

  /** Que campos de "datos" pedirle al usuario segun el tipo elegido */
  visibleFields = computed((): ('banco' | 'telefono' | 'numero_cuenta' | 'cedula' | 'correo')[] => {
    switch (this.form.controls.type.value) {
      case 'pagomovil':
        return ['banco', 'telefono', 'cedula'];
      case 'transferencia':
        return ['banco', 'numero_cuenta', 'cedula'];
      case 'billetera_digital':
        return ['correo'];
      default:
        return [];
    }
  });

  ngOnInit(): void {
    if (!this.is_browser) return;
    this.load();
  }

  load(): void {
    this.is_loading.set(true);

    this.paymentMethodsService.getPaymentMethods().subscribe({
      next: (methods) => {
        this.methods.set(methods);
        this.is_loading.set(false);
      },
      error: (err) => {
        this.toast.error(err?.error?.error ?? 'No pudimos cargar los métodos de pago.');
        this.is_loading.set(false);
      }
    });
  }

  parseDatos(datos: string): { label: string; value: string }[] {
    try {
      const parsed = JSON.parse(datos);
      return Object.entries(parsed).map(([key, value]) => ({
        label: key.charAt(0).toUpperCase() + key.slice(1).replace('_', ' '),
        value: String(value)
      }));
    } catch {
      return [];
    }
  }

  submit(): void {
    if (this.is_saving()) return;

    this.form.markAllAsTouched();

    if (this.form.invalid) {
      this.toast.error('Completa el nombre y el tipo del método de pago.');
      return;
    }

    const raw = this.form.getRawValue();
    const fields = this.visibleFields();
    const datos: Record<string, string> = {};

    for (const field of fields) {
      const value = raw[field];
      if (!value) {
        this.toast.error('Completa todos los datos del método de pago.');
        return;
      }
      datos[field] = value;
    }

    const payload: CreatePaymentMethodPayload = {
      name: raw.name!,
      type: raw.type!,
      titular: raw.titular,
      datos
    };

    this.is_saving.set(true);

    this.paymentMethodsService.createPaymentMethod(payload).subscribe({
      next: () => {
        this.is_saving.set(false);
        this.toast.success('Método de pago agregado.');
        this.form.reset();
        this.load();
      },
      error: (err) => {
        this.is_saving.set(false);
        this.toast.error(err?.error?.error ?? 'No pudimos guardar el método de pago.');
      }
    });
  }

  remove(method: PaymentMethod): void {
    if (this.deleting_id()) return;

    const confirmed = confirm(`¿Eliminar "${method.name}"? Los clientes ya no podrán elegirlo para pagar.`);
    if (!confirmed) return;

    this.deleting_id.set(method.id);

    this.paymentMethodsService.deletePaymentMethod(method.id).subscribe({
      next: () => {
        this.deleting_id.set(null);
        this.methods.update((methods) => methods.filter((m) => m.id !== method.id));
        this.toast.success('Método de pago eliminado.');
      },
      error: (err) => {
        this.deleting_id.set(null);
        this.toast.error(err?.error?.error ?? 'No pudimos eliminar el método de pago.');
      }
    });
  }
}
