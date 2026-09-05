import { isPlatformBrowser } from '@angular/common';
import { Component, OnInit, PLATFORM_ID, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { NbButtonModule, NbCardModule, NbSelectModule } from '@nebular/theme';
import { GlobalInput } from '@shared/components/global-input/global-input';
import { CardSubscriptionPlanComponent } from '@shared/components/card-subscription-plan/card-subscription-plan';
import { BillingCycleToggle } from '@shared/components/billing-cycle-toggle/billing-cycle-toggle';
import { BillingCycle } from '@shared/utils/billing';
import { CiInput } from '@shared/components/ci-input/ci-input';
import { PhoneInput } from '@shared/components/phone-input/phone-input';
import { VENEZUELA_BANKS } from '@shared/utils/venezuela-banks';
import { ToastService } from '@shared/services/toast.service';
import { ConfirmService } from '@shared/services/confirm.service';
import { PlanInterface } from 'src/app/services/http/plan/plan';
import { PlanService } from 'src/app/services/http/plan/plan.service';
import { SubscriptionService } from 'src/app/features/company/subscription.service';
import { AuthService } from 'src/app/features/auth/auth.service';
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
    BillingCycleToggle,
    CiInput,
    PhoneInput,
  ],
  templateUrl: './payment-methods-page.html',
})
export class PaymentMethodsPage implements OnInit {

  private paymentMethodsService = inject(PaymentMethodsService);
  private router = inject(Router);
  private planService = inject(PlanService);
  private subscriptionService = inject(SubscriptionService);
  private auth = inject(AuthService);
  private toast = inject(ToastService);
  private confirm = inject(ConfirmService);
  private is_browser = isPlatformBrowser(inject(PLATFORM_ID));

  methods = signal<PaymentMethod[]>([]);
  usage = signal<PaymentMethodsPlanUsage | null>(null);
  current_plan = signal<PaymentMethodsPlan | null>(null);
  plans = signal<PlanInterface[]>([]);
  billing_cycle = signal<BillingCycle>('monthly');
  show_plans = signal(false);
  is_loading = signal(true);
  is_saving = signal(false);
  is_changing_plan = signal(false);
  deleting_id = signal<number | null>(null);

  /** id del metodo que se esta editando; null = formulario en modo "crear" */
  editing_id = signal<number | null>(null);

  /** Sin cupo disponible no se puede crear: hay que cambiar de plan */
  has_room = computed(() => (this.usage()?.available ?? 0) > 0);

  usage_percent = computed(() => {
    const u = this.usage();
    if (!u || u.limit <= 0) return 100;
    return Math.min(100, Math.round((u.used / u.limit) * 100));
  });

  typeLabels = TYPE_LABELS;
  venezuelaBanks = VENEZUELA_BANKS;

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
  protected selected_type = signal<PaymentMethodType | null>(null);

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
      label: key.charAt(0).toUpperCase() + key.slice(1).replace('_', ' '),
      value: String(value)
    }));
  }

  togglePlans(): void {
    this.show_plans.update((value) => !value);
  }

  changePlan(plan: PlanInterface): void {
    if (this.is_changing_plan() || plan.id === this.current_plan()?.id) return;

    this.is_changing_plan.set(true);

    this.subscriptionService.changePlan(plan.id).subscribe({
      next: (response) => {
        this.is_changing_plan.set(false);
        this.show_plans.set(false);

        if (response.status === 'pending_verification') {
          const company_name = this.auth.session()?.company?.name ?? 'mi empresa';
          window.open(this.subscriptionService.buildWhatsAppUrl(company_name, response, this.billing_cycle()), '_blank');
          this.toast.success(`Solicitud enviada. Te escribiremos por WhatsApp para coordinar el pago del ${response.plan.name}.`);
          return;
        }

        this.toast.success(`Ahora tienes el ${response.plan.name}.`);
        // El plan gratuito ya esta activo: se recarga para reflejar el cupo correcto
        this.load();
      },
      error: (err) => {
        this.is_changing_plan.set(false);
        this.toast.error(err?.error?.error ?? 'No pudimos cambiar el plan.');
      }
    });
  }

  /** Carga un metodo existente en el formulario para editarlo */
  edit(method: PaymentMethod): void {
    const datos = typeof method.datos === 'string' ? this.safeParseDatos(method.datos) : method.datos;

    this.editing_id.set(method.id);

    // Los campos de "datos" se llenan en silencio, antes de disparar el
    // cambio de tipo: CiInput/PhoneInput leen el value inicial en su ngOnInit,
    // asi que deben tener el dato correcto ya puesto cuando se instancian
    this.form.patchValue({
      name: method.name,
      titular: method.titular,
      banco: datos?.['banco'] ?? null,
      telefono: datos?.['telefono'] ?? null,
      numero_cuenta: datos?.['numero_cuenta'] ?? null,
      cedula: datos?.['cedula'] ?? null,
      correo: datos?.['correo'] ?? null,
    }, { emitEvent: false });

    this.form.controls.type.setValue(method.type);
  }

  cancelEdit(): void {
    this.editing_id.set(null);
    this.form.reset();
  }

  private safeParseDatos(raw: string): Record<string, string> | null {
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }

  submit(): void {
    if (this.is_saving()) return;

    const editing_id = this.editing_id();

    if (!editing_id && !this.has_room()) {
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

    // Sin metodos previos: este va a ser el primero, asi que al terminar se
    // manda al usuario directo a crear su primera orden en vez de dejarlo aqui
    const is_first_method = !editing_id && this.methods().length === 0;

    if (editing_id) {
      this.paymentMethodsService.updatePaymentMethod(editing_id, payload).subscribe({
        next: ({ method }) => {
          this.is_saving.set(false);
          this.methods.update((methods) => methods.map((m) => (m.id === editing_id ? method : m)));
          this.toast.success('Método de pago actualizado.');
          this.editing_id.set(null);
          this.form.reset();
        },
        error: (err) => {
          this.is_saving.set(false);
          this.toast.error(err?.error?.error ?? 'No pudimos actualizar el método de pago.');
        }
      });
      return;
    }

    this.paymentMethodsService.createPaymentMethod(payload).subscribe({
      next: ({ usage }) => {
        this.is_saving.set(false);
        this.usage.set(usage);
        this.toast.success('Método de pago agregado.');
        this.form.reset();

        if (is_first_method) {
          this.router.navigateByUrl('/dashboard/form');
          return;
        }

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
        if (this.editing_id() === method.id) this.cancelEdit();
        this.toast.success('Método de pago eliminado.');
      },
      error: (err) => {
        this.deleting_id.set(null);
        this.toast.error(err?.error?.error ?? 'No pudimos eliminar el método de pago.');
      }
    });
  }
}
