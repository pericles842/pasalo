import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { NbButtonModule, NbCardModule, NbInputModule, NbStepperModule } from '@nebular/theme';
import { CardSubscriptionPlanComponent } from "@shared/components/card-subscription-plan/card-subscription-plan";
import { GeneralTitleForm } from "@shared/elements/general-title-form/general-title-form";
import { passwordMatchValidator } from '@shared/validators/password-match.validator';
import { ToastService } from '@shared/services/toast.service';
import { CompanyService } from "src/app/features/company/company-repository.service";
import { CompanyForm } from "src/app/features/company/components/company-form/company-form";
import { UsersInfoForm } from "src/app/features/company/components/users-info-form/users-info-form";
import { CompanyControls } from 'src/app/features/company/interfaces/company';
import { UserCompanyForm } from "src/app/features/company/interfaces/user";
import { PlanInterface } from 'src/app/services/http/plan/plan';
import { PlanService } from 'src/app/services/http/plan/plan.service';

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
    rif: new FormControl(null, [Validators.required]),
    email: new FormControl(null, [Validators.required, Validators.email]),
    domain: new FormControl(null, [Validators.required])
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

  plans: PlanInterface[] = []

  selected_plan_index: number | null = null;

  is_saving = false;

  company_registered = false;

  payment_form = new FormGroup({
    cardholder_name: new FormControl('', [Validators.required]),
    card_number: new FormControl('', [Validators.required, Validators.pattern(/^\d{16}$/)]),
    expiry: new FormControl('', [Validators.required, Validators.pattern(/^\d{2}\/\d{2}$/)]),
    cvv: new FormControl('', [Validators.required, Validators.pattern(/^\d{3,4}$/)]),
  });

  constructor(
    private planService: PlanService,
    private companyService: CompanyService,
    private toast: ToastService
  ) { }

  get selected_plan() {
    return this.selected_plan_index !== null ? this.plans[this.selected_plan_index] : null;
  }

  get is_free_plan(): boolean {
    return this.selected_plan?.id == 1
  }

  selectPlan(index: number): void {
    this.selected_plan_index = index;
  }

  ngOnInit() {
    this.planService.getFullPlan().subscribe((plans) => this.plans = plans)
  }

  /**
   * Con el plan gratuito la empresa se registra de una vez;
   * con un plan pago primero se cobra y luego se registra.
   */
  continueFromPlan(): void {
    if (this.is_free_plan) this.registerCompany();
  }

  registerCompany(): void {
    if (!this.selected_plan || this.is_saving || this.company_registered) return;

    this.company_form.markAllAsTouched();
    this.company_user.markAllAsTouched();

    if (this.company_form.invalid || this.company_user.invalid) {
      this.toast.error('Revisa los datos de la empresa y del usuario antes de continuar.');
      return;
    }

    this.is_saving = true;

    this.companyService
      .createCompany(this.company_form.getRawValue(), this.company_user.getRawValue(), this.selected_plan.id)
      .subscribe({
        next: () => {
          this.company_registered = true;
          this.is_saving = false;
        },
        error: (err) => {
          this.toast.error(err?.error?.error ?? 'No pudimos registrar la empresa, intenta nuevamente.');
          this.is_saving = false;
        }
      });
  }

}
