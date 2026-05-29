import { Component, Input } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { NbSelectModule } from '@nebular/theme';
import { GlobalInput } from "@shared/components/global-input/global-input";
import { UserCompanyForm } from '../../interfaces/user';

@Component({
  selector: 'app-users-info-form',
  imports: [
    GlobalInput,
    ReactiveFormsModule,
    NbSelectModule
  ],
  templateUrl: './users-info-form.html',
})
export class UsersInfoForm {
  @Input() form!: FormGroup<UserCompanyForm>
}
