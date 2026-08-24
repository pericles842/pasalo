import { Component, inject } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { NbButtonModule, NbCardModule } from '@nebular/theme';
import { GlobalInput } from '@shared/components/global-input/global-input';
import { Copyright } from '@shared/components/copyright/copyright';
import { ToastService } from '@shared/services/toast.service';
import { AuthService } from '../../auth.service';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, NbCardModule, NbButtonModule, GlobalInput, RouterLink, Copyright],
  templateUrl: './login.html',
})
export class Login {

  private auth = inject(AuthService);
  private router = inject(Router);
  private toast = inject(ToastService);

  is_saving = false;

  login_form = new FormGroup({
    email: new FormControl<string | null>(null, [Validators.required, Validators.email]),
    password: new FormControl<string | null>(null, [Validators.required])
  });

  submit(): void {
    if (this.is_saving) return;

    this.login_form.markAllAsTouched();

    if (this.login_form.invalid) {
      this.toast.error('Ingresa tu correo y tu contraseña.');
      return;
    }

    const { email, password } = this.login_form.getRawValue();

    this.is_saving = true;

    this.auth.login(email!, password!).subscribe({
      next: () => {
        this.is_saving = false;
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        this.is_saving = false;
        this.toast.error(err?.error?.error ?? 'No pudimos iniciar sesión, intenta nuevamente.');
      }
    });
  }
}
