import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { NbButtonModule, NbCardModule, NbInputModule, NbStepperModule } from '@nebular/theme';
import { CardSubscriptionPlanComponent } from "@shared/components/card-subscription-plan/card-subscription-plan";
import { CardSubscriptionPlanControls } from '@shared/components/card-subscription-plan/card-subscription-plan.d';
import { GeneralTitleForm } from "@shared/elements/general-title-form/general-title-form";
import { PLANS } from 'src/app/data/plans';
import { CompanyForm } from "src/app/features/company/components/company-form/company-form";
import { CompanyControls } from 'src/app/features/company/interfaces/company';

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
  ],
  templateUrl: './register-company.html',
  styleUrl: './register-company.scss',
})
export class RegisterCompany {

  company_form: FormGroup<CompanyControls> = new FormGroup<CompanyControls>({
    uuid: new FormControl(null),
    name: new FormControl(null, [Validators.required, Validators.minLength(5)]),
    logo: new FormControl(null),
    rif: new FormControl(null),
    email: new FormControl(null, [Validators.required, Validators.email]),
    domain: new FormControl(null),
    user_limits: new FormControl(0, {
      nonNullable: true,
      validators: [Validators.required, Validators.min(1), Validators.max(5)],
    })
  });

  plans: FormGroup<CardSubscriptionPlanControls>[] = PLANS.map(plan =>
    new FormGroup<CardSubscriptionPlanControls>({
      title: new FormControl(plan.title, { nonNullable: true }),
      description: new FormControl(plan.description, { nonNullable: true }),
      full_description: new FormControl(plan.full_description, { nonNullable: true }),
      price: new FormControl(plan.price, { nonNullable: true }),
      status: new FormControl(plan.status, { nonNullable: true }),
      is_free: new FormControl(plan.is_free, { nonNullable: true }),
    })
  );

  selected_plan_index: number | null = null;

  payment_form = new FormGroup({
    cardholder_name: new FormControl('', [Validators.required]),
    card_number: new FormControl('', [Validators.required, Validators.pattern(/^\d{16}$/)]),
    expiry: new FormControl('', [Validators.required, Validators.pattern(/^\d{2}\/\d{2}$/)]),
    cvv: new FormControl('', [Validators.required, Validators.pattern(/^\d{3,4}$/)]),
  });

  get selected_plan() {
    return this.selected_plan_index !== null ? this.plans[this.selected_plan_index] : null;
  }

  get is_free_plan(): boolean {
    return this.selected_plan?.controls.is_free.value ?? false;
  }

  selectPlan(index: number): void {
    this.selected_plan_index = index;
  }
}
