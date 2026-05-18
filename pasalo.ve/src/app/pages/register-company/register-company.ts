import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { NbStepperModule } from '@nebular/theme';
import { GeneralTitleForm } from "@shared/elements/general-title-form/general-title-form";
import { CompanyForm } from "src/app/features/company/components/company-form/company-form";
import { CompanyControls } from 'src/app/features/company/interfaces/company';

@Component({
  selector: 'app-register-company',
  imports: [GeneralTitleForm, CompanyForm, NbStepperModule, CommonModule],
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

}
