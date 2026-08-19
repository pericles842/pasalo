import { Component, inject } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { NbButtonModule, NbCardModule } from '@nebular/theme';
import { GlobalInput } from '@shared/components/global-input/global-input';
import { AuthService } from '../../auth.service';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, NbCardModule, NbButtonModule, GlobalInput, RouterLink],
  templateUrl: './login.html',
})
export class Login {

  private auth = inject(AuthService);
  private router = inject(Router);

  is_saving = false;

  error_message: string | null = null;

  login_form = new FormGroup({
    email: new FormControl<string | null>(null, [Validators.required, Validators.email]),
    password: new FormControl<string | null>(null, [Validators.required])
  });

  submit(): void {
    if (this.is_saving) return;

    this.login_form.markAllAsTouched();

    if (this.login_form.invalid) {
      this.error_message = 'Ingresa tu correo y tu contraseña.';
      return;
    }

    const { email, password } = this.login_form.getRawValue();

    this.is_saving = true;
    this.error_message = null;

    this.auth.login(email!, password!).subscribe({
      next: () => {
        this.is_saving = false;
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        this.is_saving = false;
        this.error_message = err?.error?.error ?? 'No pudimos iniciar sesión, intenta nuevamente.';
      }
    });
  }
}
