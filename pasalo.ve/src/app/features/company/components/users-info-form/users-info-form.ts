import { Component, Input } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { GlobalInput } from "@shared/components/global-input/global-input";
import { CiInput } from '@shared/components/ci-input/ci-input';
import { UserCompanyForm } from '../../interfaces/user';

@Component({
  selector: 'app-users-info-form',
  imports: [
    GlobalInput,
    CiInput,
    ReactiveFormsModule
  ],
  templateUrl: './users-info-form.html',
})
export class UsersInfoForm {
  // El usuario que registra la empresa siempre es administrador,
  // por eso no se selecciona el cargo en este formulario.
  @Input({ required: true }) form!: FormGroup<UserCompanyForm>

  /** El usuario se identificó con Google: ya no hace falta pedirle contraseña */
  @Input() hidePassword = false;
}
