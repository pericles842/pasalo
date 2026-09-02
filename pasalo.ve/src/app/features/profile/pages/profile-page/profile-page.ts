import { isPlatformBrowser } from '@angular/common';
import { Component, OnInit, PLATFORM_ID, computed, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { NbButtonModule } from '@nebular/theme';
import { GlobalInput } from '@shared/components/global-input/global-input';
import { Avatar } from '@shared/components/avatar/avatar';
import { ToastService } from '@shared/services/toast.service';
import { compressImage } from '@shared/utils/compress-image';
import { passwordMatchValidator } from '@shared/validators/password-match.validator';
import { AuthService } from 'src/app/features/auth/auth.service';
import { ProfileService } from '../../profile.service';

interface ProfileForm {
  first_name: FormControl<string | null>;
  middle_name: FormControl<string | null>;
  current_password: FormControl<string | null>;
  new_password: FormControl<string | null>;
  new_password_confirmation: FormControl<string | null>;
}

@Component({
  selector: 'app-profile-page',
  imports: [ReactiveFormsModule, NbButtonModule, GlobalInput, Avatar],
  templateUrl: './profile-page.html',
})
export class ProfilePage implements OnInit {

  protected auth = inject(AuthService);
  private profileService = inject(ProfileService);
  private toast = inject(ToastService);
  private is_browser = isPlatformBrowser(inject(PLATFORM_ID));

  is_saving = signal(false);
  photo_file = signal<File | null>(null);
  photo_preview = signal<string | null>(null);

  /** false en cuentas creadas solo por Google: ahi se ofrece "agregar" contraseña, no "cambiarla" */
  has_password = computed(() => this.auth.session()?.user?.has_password ?? true);

  form: FormGroup<ProfileForm> = new FormGroup<ProfileForm>({
    first_name: new FormControl<string | null>(null, [Validators.required]),
    middle_name: new FormControl<string | null>(null),
    current_password: new FormControl<string | null>(null),
    new_password: new FormControl<string | null>(null, [Validators.minLength(8)]),
    new_password_confirmation: new FormControl<string | null>(null)
  }, { validators: passwordMatchValidator('new_password', 'new_password_confirmation') });

  ngOnInit(): void {
    if (!this.is_browser) return;

    const user = this.auth.session()?.user;
    if (user) {
      this.form.patchValue({
        first_name: user.first_name,
        middle_name: user.middle_name
      });
    }

    // La sesion guardada en el navegador puede venir de un login anterior a
    // este cambio y no traer has_password: se refresca contra el backend
    // para que "Cambiar" vs "Agregar" contraseña siempre sea el correcto.
    this.auth.me().subscribe({
      next: (session) => this.form.patchValue({
        first_name: session.user.first_name,
        middle_name: session.user.middle_name
      }),
      error: () => { /* se sigue mostrando con la sesion cacheada */ }
    });
  }

  async onPhotoSelected(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;

    const compressed = file ? await compressImage(file) : null;

    this.photo_file.set(compressed);
    this.photo_preview.set(compressed ? URL.createObjectURL(compressed) : null);
  }

  save(): void {
    if (this.is_saving()) return;

    this.form.markAllAsTouched();

    if (this.form.invalid) {
      this.toast.error('Revisa los datos de tu perfil antes de guardarlos.');
      return;
    }

    const { first_name, middle_name, current_password, new_password, new_password_confirmation } = this.form.getRawValue();
    const has_password = this.has_password();

    // El cambio (o alta) de contraseña es opcional: solo se envía si el usuario llenó los campos.
    // Sin contraseña previa (cuenta de Google) no hace falta la actual para confirmarla.
    const wants_password_change = has_password
      ? !!(current_password || new_password || new_password_confirmation)
      : !!(new_password || new_password_confirmation);

    if (wants_password_change) {
      if (has_password && !current_password) {
        this.toast.error('Ingresa tu contraseña actual para cambiarla.');
        return;
      }

      if (!new_password || !new_password_confirmation) {
        this.toast.error('Completa la nueva contraseña y su confirmación.');
        return;
      }
    }

    this.is_saving.set(true);

    this.profileService.updateProfile({
      first_name: first_name!,
      middle_name: middle_name ?? null,
      current_password: wants_password_change && has_password ? current_password : null,
      new_password: wants_password_change ? new_password : null,
      new_password_confirmation: wants_password_change ? new_password_confirmation : null,
      photo: this.photo_file()
    }).subscribe({
      next: (response) => {
        this.is_saving.set(false);
        this.auth.refreshSession(response.user, response.role, response.company);
        this.photo_file.set(null);
        this.photo_preview.set(null);
        this.form.patchValue({ current_password: null, new_password: null, new_password_confirmation: null });
        this.toast.success('Tu perfil se actualizó correctamente.');
      },
      error: (err) => {
        this.is_saving.set(false);
        this.toast.error(err?.error?.error ?? 'No pudimos actualizar tu perfil.');
      }
    });
  }
}
