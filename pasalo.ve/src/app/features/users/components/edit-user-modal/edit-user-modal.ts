import { Component, Input, OnInit, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { NbButtonModule, NbCardModule, NbDialogRef, NbSelectModule } from '@nebular/theme';
import { GlobalInput } from '@shared/components/global-input/global-input';
import { ToastService } from '@shared/services/toast.service';
import { CompanyUser, EditUserForm, Role } from '../../interfaces/company-user';
import { UsersService } from '../../users.service';

/**
 * Modal para editar nombre/apellido/cargo de un usuario interno.
 * El correo no se edita aqui: es la credencial de acceso.
 */
@Component({
  selector: 'app-edit-user-modal',
  imports: [ReactiveFormsModule, NbCardModule, NbButtonModule, NbSelectModule, GlobalInput],
  templateUrl: './edit-user-modal.html',
})
export class EditUserModal implements OnInit {
  @Input({ required: true }) user!: CompanyUser;
  @Input({ required: true }) roles!: Role[];

  private usersService = inject(UsersService);
  private toast = inject(ToastService);

  is_saving = signal(false);

  form = new FormGroup<EditUserForm>({
    first_name: new FormControl<string | null>(null, [Validators.required]),
    middle_name: new FormControl<string | null>(null),
    role_id: new FormControl<number | null>(null, [Validators.required]),
  });

  constructor(protected dialogRef: NbDialogRef<EditUserModal>) { }

  ngOnInit(): void {
    this.form.patchValue({
      first_name: this.user.first_name,
      middle_name: this.user.middle_name,
      role_id: this.user.role_id,
    });
  }

  save(): void {
    if (this.is_saving()) return;

    this.form.markAllAsTouched();

    if (this.form.invalid) {
      this.toast.error('Completa el nombre y el cargo del usuario.');
      return;
    }

    const raw = this.form.getRawValue();
    this.is_saving.set(true);

    this.usersService.updateUser(this.user.uuid, {
      first_name: raw.first_name,
      middle_name: raw.middle_name,
      role_id: raw.role_id,
    }).subscribe({
      next: (response) => {
        this.is_saving.set(false);
        this.toast.success(`${response.user.first_name} fue actualizado.`);
        this.dialogRef.close(response);
      },
      error: (err) => {
        this.is_saving.set(false);
        this.toast.error(err?.error?.error ?? 'No pudimos actualizar el usuario.');
      }
    });
  }

  close(): void {
    this.dialogRef.close();
  }
}
