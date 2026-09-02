import { AfterViewInit, Component, ElementRef, ViewChild, inject } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { NbButtonModule, NbCardModule } from '@nebular/theme';
import { GlobalInput } from '@shared/components/global-input/global-input';
import { Copyright } from '@shared/components/copyright/copyright';
import { ToastService } from '@shared/services/toast.service';
import { GoogleAuthService } from '@shared/services/google-auth.service';
import { AuthService } from '../../auth.service';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, NbCardModule, NbButtonModule, GlobalInput, RouterLink, Copyright],
  templateUrl: './login.html',
})
export class Login implements AfterViewInit {

  private auth = inject(AuthService);
  private router = inject(Router);
  private toast = inject(ToastService);
  private googleAuth = inject(GoogleAuthService);

  @ViewChild('googleButton') private googleButtonRef?: ElementRef<HTMLDivElement>;

  is_saving = false;

  login_form = new FormGroup({
    email: new FormControl<string | null>(null, [Validators.required, Validators.email]),
    password: new FormControl<string | null>(null, [Validators.required])
  });

  ngAfterViewInit(): void {
    if (this.googleButtonRef) {
      this.googleAuth.renderButton(this.googleButtonRef.nativeElement, (id_token) => this.onGoogleCredential(id_token));
    }
  }

  private onGoogleCredential(id_token: string): void {
    this.is_saving = true;

    this.auth.loginWithGoogle(id_token).subscribe({
      next: (response) => {
        this.is_saving = false;

        if (response.is_new) {
          // Ese correo de Google todavia no tiene empresa: se lleva la identidad
          // ya verificada al registro para que solo falte llenar la empresa.
          this.auth.pending_google_identity.set({ ...response.google, id_token });
          this.toast.success('Ese correo de Google no tiene empresa todavía. Sigamos con el registro.');
          this.router.navigate(['/create-company']);
          return;
        }

        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        this.is_saving = false;
        this.toast.error(err?.error?.error ?? 'No pudimos iniciar sesión con Google, intenta nuevamente.');
      }
    });
  }

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
