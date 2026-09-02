import { CommonModule, isPlatformBrowser } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Component, OnInit, PLATFORM_ID, computed, inject, signal, ViewChild } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import {
  NbButtonModule,
  NbCardModule,
  NbInputModule,
  NbStepChangeEvent,
  NbStepperComponent,
  NbStepperModule,
} from '@nebular/theme';
import { CardSubscriptionPlanComponent } from "@shared/components/card-subscription-plan/card-subscription-plan";
import { GeneralTitleForm } from "@shared/elements/general-title-form/general-title-form";
import { passwordMatchValidator } from '@shared/validators/password-match.validator';
import { domainFormatValidator } from '@shared/validators/domain-format.validator';
import { ToastService } from '@shared/services/toast.service';
import { ExchangeRateService } from '@shared/services/exchange-rate.service';
import { AuthService } from 'src/app/features/auth/auth.service';
import { GoogleIdentity } from 'src/app/features/auth/interfaces/auth';
import { CompanyService } from "src/app/features/company/company-repository.service";
import { CompanyForm } from "src/app/features/company/components/company-form/company-form";
import { UsersInfoForm } from "src/app/features/company/components/users-info-form/users-info-form";
import { CompanyControls } from 'src/app/features/company/interfaces/company';
import { UserCompany, UserCompanyForm } from "src/app/features/company/interfaces/user";
import { PlanInterface } from 'src/app/services/http/plan/plan';
import { PlanService } from 'src/app/services/http/plan/plan.service';
import { SubscriptionService } from 'src/app/features/company/subscription.service';

@Component({
  selector: 'app-register-company',
  imports: [
    GeneralTitleForm,
    CompanyForm,
    NbStepperModule,
    NbButtonModule,
    NbCardModule,
    NbInputModule,
    ReactiveFormsModule,
    CommonModule,
    CardSubscriptionPlanComponent,
    UsersInfoForm,
    RouterLink
  ],
  templateUrl: './register-company.html',
  styleUrl: './register-company.scss',
})
export class RegisterCompany implements OnInit {

  // El límite de usuarios no se captura aquí: lo define el plan seleccionado
  company_form: FormGroup<CompanyControls> = new FormGroup<CompanyControls>({
    name: new FormControl(null, [Validators.required, Validators.minLength(5)]),
    logo: new FormControl(null),
    rif: new FormControl(null),
    email: new FormControl(null, [Validators.required, Validators.email]),
    domain: new FormControl(null, [domainFormatValidator()])
  });

  // Usuario master de la empresa: siempre se registra con el rol de administrador
  company_user: FormGroup<UserCompanyForm> = new FormGroup<UserCompanyForm>({
    first_name: new FormControl(null, [Validators.required]),
    middle_name: new FormControl(null, [Validators.required]),
    photo_url: new FormControl(null),
    ci: new FormControl(null, [Validators.required]),
    email: new FormControl(null, [Validators.required, Validators.email]),
    password: new FormControl(null, [Validators.required, Validators.minLength(8)]),
    password_confirmation: new FormControl(null, [Validators.required])
  }, { validators: passwordMatchValidator() });

  /** Si el usuario master se registro con "Continuar con Google" en el login,
   * el paso de Usuario llega precargado con estos datos y sin pedir contraseña. */
  google_identity = signal<(GoogleIdentity & { id_token: string }) | null>(null);

  plans = signal<PlanInterface[]>([]);

  selected_plan_index = signal<number | null>(null);

  is_saving = signal(false);

  company_registered = signal(false);

  @ViewChild('stepper') stepper!: NbStepperComponent;

  /** Los pasos del stepper: en telefono se navega con la barra fija de abajo */
  step_labels = ['Empresa', 'Usuario', 'Plan', 'Confirmar'];

  current_step_index = signal(0);

  private is_browser = isPlatformBrowser(inject(PLATFORM_ID));

  /** Link de WhatsApp con el plan pedido y su precio, listo para reabrirlo si el popup se bloqueó */
  whatsapp_url = computed(() => {
    const plan = this.selected_plan;
    if (!plan || plan.id === 1) return '';

    const rate = this.exchangeRate.rateBcv();
    const amount_bs = rate ? Math.round(plan.price * rate * 100) / 100 : null;
    const company_name = this.company_form.controls.name.value ?? 'mi empresa';

    return this.subscriptionService.buildWhatsAppUrl(company_name, {
      status: 'pending_verification',
      plan: { id: plan.id, name: plan.name, price: plan.price },
      amount_usd: plan.price,
      amount_bs
    });
  });

  constructor(
    private planService: PlanService,
    private companyService: CompanyService,
    private subscriptionService: SubscriptionService,
    protected exchangeRate: ExchangeRateService,
    private toast: ToastService,
    private auth: AuthService
  ) { }

  onStepChange(event: NbStepChangeEvent): void {
    this.current_step_index.set(event.index);
  }

  /** Habilita el boton "Siguiente" de la barra fija segun el paso actual */
  canGoToNextStep(): boolean {
    switch (this.current_step_index()) {
      case 0: return !this.company_form.invalid;
      case 1: return !this.company_user.invalid;
      case 2: return this.selected_plan_index() !== null && !this.is_saving();
      default: return true;
    }
  }

  /** Boton "Siguiente" de la barra fija movil: replica el click del boton de escritorio */
  goToNextStep(): void {
    if (this.current_step_index() === 2) this.continueFromPlan();
    this.stepper.next();
  }

  get selected_plan() {
    const index = this.selected_plan_index();
    return index !== null ? this.plans()[index] : null;
  }

  get is_free_plan(): boolean {
    return this.selected_plan?.id == 1
  }

  selectPlan(index: number): void {
    this.selected_plan_index.set(index);
  }

  ngOnInit() {
    // En SSR no hay backend garantizado en ese instante: los planes se piden al hidratar en el navegador
    if (!this.is_browser) return;

    this.planService.getFullPlan().subscribe((plans) => this.plans.set(plans));

    // Si se llega aca desde "Continuar con Google" en el login (ese correo no
    // tenia empresa todavia), la identidad ya viene resuelta: se precargan
    // los campos del paso "Usuario" para que el cliente solo los revise/ajuste.
    const pending = this.auth.pending_google_identity();
    if (pending) {
      this.google_identity.set(pending);
      this.auth.pending_google_identity.set(null);
      this.prefillFromGoogle(pending);
    }
  }

  /**
   * Precarga el paso "Usuario" con lo que Google ya verifico. El correo se
   * bloquea (es la identidad verificada, no se deja editar) y la contraseña
   * deja de ser obligatoria porque ese paso se resuelve con Google.
   */
  private prefillFromGoogle(identity: GoogleIdentity): void {
    this.company_user.patchValue({
      first_name: identity.first_name,
      middle_name: identity.last_name,
      email: identity.email,
      photo_url: identity.photo_url
    });

    this.company_user.controls.email.disable();
    this.company_user.controls.password.clearValidators();
    this.company_user.controls.password.updateValueAndValidity();
    this.company_user.controls.password_confirmation.clearValidators();
    this.company_user.controls.password_confirmation.updateValueAndValidity();
  }

  /**
   * La empresa se registra de una vez sin importar el plan: no se pide
   * tarjeta ni se cobra nada en la app. Si el plan es pago, el pago se
   * coordina por WhatsApp y la empresa queda pendiente de verificación
   * (ver CompanyModel.createSubscription en el backend).
   */
  continueFromPlan(): void {
    this.registerCompany();
  }

  registerCompany(): void {
    if (!this.selected_plan || this.is_saving() || this.company_registered()) return;

    this.company_form.markAllAsTouched();
    this.company_user.markAllAsTouched();

    if (this.company_form.invalid || this.company_user.invalid) {
      this.toast.error('Revisa los datos de la empresa y del usuario antes de continuar.');
      return;
    }

    const google = this.google_identity();

    // getRawValue() incluye el correo aunque su control este deshabilitado
    // (bloqueado cuando viene de Google). El backend igual vuelve a verificar
    // el id_token y usa el correo confirmado por Google, nunca este valor.
    const user_payload: UserCompany = {
      ...this.company_user.getRawValue(),
      ...(google ? { id_token: google.id_token } : {})
    };

    this.is_saving.set(true);

    this.companyService
      .createCompany(this.company_form.getRawValue(), user_payload, this.selected_plan.id)
      .subscribe({
        next: () => {
          this.company_registered.set(true);
          this.is_saving.set(false);

          // Plan pago: se manda a WhatsApp de una vez con el monto ya calculado
          if (!this.is_free_plan) {
            const url = this.whatsapp_url();
            if (url) window.open(url, '_blank');
          }
        },
        error: (err) => {
          this.toast.error(err?.error?.error ?? 'No pudimos registrar la empresa, intenta nuevamente.');
          this.is_saving.set(false);
        }
      });
  }

}
