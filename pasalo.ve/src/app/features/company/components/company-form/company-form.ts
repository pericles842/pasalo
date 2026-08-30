import { Component, Input } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CompanyControls } from '../../interfaces/company';
import { GlobalInput } from '@shared/components/global-input/global-input';
import { CiInput } from '@shared/components/ci-input/ci-input';
import { NbEvaIconsModule } from '@nebular/eva-icons';
import { NbButtonModule, NbIconModule } from '@nebular/theme';

@Component({
  selector: 'app-company-form',
  imports: [ReactiveFormsModule, NbButtonModule, GlobalInput, CiInput, NbEvaIconsModule, NbIconModule],
  templateUrl: './company-form.html',
  styleUrl: './company-form.scss',
})
export class CompanyForm {

  @Input({ required: true })form!: FormGroup<CompanyControls>

}
