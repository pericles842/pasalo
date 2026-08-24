import { isPlatformBrowser } from '@angular/common';
import { Component, OnInit, PLATFORM_ID, computed, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { NbButtonModule, NbCardModule, NbSelectModule } from '@nebular/theme';
import { GlobalInput } from '@shared/components/global-input/global-input';
import { CardSubscriptionPlanComponent } from '@shared/components/card-subscription-plan/card-subscription-plan';
import { ToastService } from '@shared/services/toast.service';
import { ConfirmService } from '@shared/services/confirm.service';
import { PlanInterface } from 'src/app/services/http/plan/plan';
import { PlanService } from 'src/app/services/http/plan/plan.service';
import {
  CreatePaymentMethodPayload,
  PaymentMethod,
  PaymentMethodForm,
  PaymentMethodsPlan,
  PaymentMethodsPlanUsage,
  PaymentMethodType,
} from '../../interfaces/payment-method';
import { PaymentMethodsService } from '../../payment-methods.service';

const TYPE_LABELS: Record<PaymentMethodType, string> = {
  pagomovil: 'Pago Móvil',
  transferencia: 'Transferencia bancaria',
  billetera_digital: 'Billetera digital (Zelle, Binance...)'
};

@Component({
  selector: 'app-payment-methods-page',
  imports: [
    ReactiveFormsModule,
    NbCardModule,
    NbButtonModule,
    NbSelectModule,
    GlobalInput,
    CardSubscriptionPlanComponent,
  ],
  templateUrl: './payment-methods-page.html',
})
export class PaymentMethodsPage implements OnInit {

  private paymentMethodsService = inject(PaymentMethodsService);
  private planService = inject(PlanService);
  private toast = inject(ToastService);
  private confirm = inject(ConfirmService);
  private is_browser = isPlatformBrowser(inject(PLATFORM_ID));

  methods = signal<PaymentMethod[]>([]);
  usage = signal<PaymentMethodsPlanUsage | null>(null);
  current_plan = signal<PaymentMethodsPlan | null>(null);
  plans = signal<PlanInterface[]>([]);
  show_plans = signal(false);
  is_loading = signal(true);
  is_saving = signal(false);
  is_changing_plan = signal(false);
  deleting_id = signal<number | null>(null);

  /** Sin cupo disponible no se puede crear: hay que cambiar de plan */
  has_room = computed(() => (this.usage()?.available ?? 0) > 0);

  usage_percent = computed(() => {
    const u = this.usage();
    if (!u || u.limit <= 0) return 100;
    return Math.min(100, Math.round((u.used / u.limit) * 100));
  });

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

  // FormControl.value no es una signal: sin esto, el computed de abajo
  // se calcula una sola vez y nunca reacciona a que el usuario cambie el tipo
  private selected_type = signal<PaymentMethodType | null>(null);

  /** Que campos de "datos" pedirle al usuario segun el tipo elegido */
  visibleFields = computed((): ('banco' | 'telefono' | 'numero_cuenta' | 'cedula' | 'correo')[] => {
    switch (this.selected_type()) {
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

    this.form.controls.type.valueChanges.subscribe((type) => this.selected_type.set(type));

    this.load();
    this.planService.getFullPlan().subscribe((plans) => this.plans.set(plans));
  }

  load(): void {
    this.is_loading.set(true);

    this.paymentMethodsService.getPaymentMethods().subscribe({
      next: ({ methods, plan, usage }) => {
        this.methods.set(methods);
        this.current_plan.set(plan);
        this.usage.set(usage);
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

  togglePlans(): void {
    this.show_plans.update((value) => !value);
  }

  changePlan(plan: PlanInterface): void {
    if (this.is_changing_plan() || plan.id === this.current_plan()?.id) return;

    this.is_changing_plan.set(true);

    this.paymentMethodsService.changePlan(plan.id).subscribe({
      next: () => {
        this.is_changing_plan.set(false);
        this.show_plans.set(false);
        this.toast.success(`Ahora tienes el ${plan.name}: hasta ${plan.payment_methods_limit} métodos de pago.`);
        // El endpoint de cambio de plan devuelve el consumo de usuarios, no el
        // de metodos de pago: se recarga para reflejar el cupo correcto.
        this.load();
      },
      error: (err) => {
        this.is_changing_plan.set(false);
        this.toast.error(err?.error?.error ?? 'No pudimos cambiar el plan.');
      }
    });
  }

  submit(): void {
    if (this.is_saving()) return;

    if (!this.has_room()) {
      this.toast.error('Ya alcanzaste el límite de métodos de pago de tu plan. Cambia de plan para agregar más.');
      return;
    }

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
      next: ({ usage }) => {
        this.is_saving.set(false);
        this.usage.set(usage);
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

    this.confirm.ask({
      title: 'Eliminar método de pago',
      message: `¿Eliminar "${method.name}"? Los clientes ya no podrán elegirlo para pagar.`,
      confirmLabel: 'Eliminar',
    }).subscribe((confirmed) => {
      if (confirmed) this.doRemove(method);
    });
  }

  private doRemove(method: PaymentMethod): void {
    this.deleting_id.set(method.id);

    this.paymentMethodsService.deletePaymentMethod(method.id).subscribe({
      next: ({ usage }) => {
        this.deleting_id.set(null);
        this.methods.update((methods) => methods.filter((m) => m.id !== method.id));
        this.usage.set(usage);
        this.toast.success('Método de pago eliminado.');
      },
      error: (err) => {
        this.deleting_id.set(null);
        this.toast.error(err?.error?.error ?? 'No pudimos eliminar el método de pago.');
      }
    });
  }
}
