import { isPlatformBrowser } from '@angular/common';
import { Component, OnInit, PLATFORM_ID, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { NbButtonModule, NbCardModule } from '@nebular/theme';
import { GlobalInput } from '@shared/components/global-input/global-input';
import { Avatar } from '@shared/components/avatar/avatar';
import { ToastService } from '@shared/services/toast.service';
import { AuthService } from 'src/app/features/auth/auth.service';
import { CompanyService } from '../../company-repository.service';

interface CompanyEditForm {
  name: FormControl<string | null>;
  rif: FormControl<string | null>;
  domain: FormControl<string | null>;
}

@Component({
  selector: 'app-company-page',
  imports: [ReactiveFormsModule, NbCardModule, NbButtonModule, GlobalInput, Avatar],
  templateUrl: './company-page.html',
})
export class CompanyPage implements OnInit {

  protected auth = inject(AuthService);
  private companyService = inject(CompanyService);
  private toast = inject(ToastService);
  private is_browser = isPlatformBrowser(inject(PLATFORM_ID));

  is_saving = signal(false);
  logo_file = signal<File | null>(null);
  logo_preview = signal<string | null>(null);

  form: FormGroup<CompanyEditForm> = new FormGroup<CompanyEditForm>({
    name: new FormControl<string | null>(null, [Validators.required]),
    rif: new FormControl<string | null>(null),
    domain: new FormControl<string | null>(null, [Validators.required])
  });

  ngOnInit(): void {
    if (!this.is_browser) return;

    const company = this.auth.session()?.company;
    if (!company) return;

    this.form.patchValue({
      name: company.name,
      rif: company.rif,
      domain: company.domain
    });
  }

  onLogoSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;

    this.logo_file.set(file);
    this.logo_preview.set(file ? URL.createObjectURL(file) : null);
  }

  save(): void {
    if (this.is_saving()) return;

    this.form.markAllAsTouched();

    if (this.form.invalid) {
      this.toast.error('Revisa los datos de la empresa antes de guardarlos.');
      return;
    }

    const { name, rif, domain } = this.form.getRawValue();

    this.is_saving.set(true);

    this.companyService.updateCompany({
      name: name!,
      rif: rif?.trim() || null,
      domain: domain!,
      logo: this.logo_file()
    }).subscribe({
      next: (response) => {
        this.is_saving.set(false);
        this.auth.refreshSession(response.user, response.role, response.company);
        this.logo_file.set(null);
        this.logo_preview.set(null);
        this.toast.success('Los datos de la empresa se actualizaron correctamente.');
      },
      error: (err) => {
        this.is_saving.set(false);
        this.toast.error(err?.error?.error ?? 'No pudimos actualizar la empresa.');
      }
    });
  }
}
