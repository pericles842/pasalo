import { CdkObserveContent } from "@angular/cdk/observers";
import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { NbButtonModule, NbCardModule, NbInputModule, NbStepperModule } from '@nebular/theme';
import { CardSubscriptionPlanComponent } from "@shared/components/card-subscription-plan/card-subscription-plan";
import { GeneralTitleForm } from "@shared/elements/general-title-form/general-title-form";
import { CompanyService } from "src/app/features/company/company-repository.service";
import { CompanyForm } from "src/app/features/company/components/company-form/company-form";
import { CompanyControls } from 'src/app/features/company/interfaces/company';
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
    CardSubscriptionPlanComponent
  ],
  templateUrl: './register-company.html',
  styleUrl: './register-company.scss',
})
export class RegisterCompany {

  company_form: FormGroup<CompanyControls> = new FormGroup<CompanyControls>({
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

  plans: PlanInterface[] = []

  selected_plan_index: number | null = null;

  payment_form = new FormGroup({
    cardholder_name: new FormControl('', [Validators.required]),
    card_number: new FormControl('', [Validators.required, Validators.pattern(/^\d{16}$/)]),
    expiry: new FormControl('', [Validators.required, Validators.pattern(/^\d{2}\/\d{2}$/)]),
    cvv: new FormControl('', [Validators.required, Validators.pattern(/^\d{3,4}$/)]),
  });

  constructor(
    private planService: PlanService,
    private companyService: CompanyService
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

  registerCompany() {
    const COMPANY = this.company_form.getRawValue();

    if (this.selected_plan?.id == 1) {
      this.companyService.createCompany(COMPANY, this.selected_plan.id).subscribe({

      })
    }
  }

}
