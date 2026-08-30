import { DatePipe, isPlatformBrowser } from '@angular/common';
import { Component, OnInit, PLATFORM_ID, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { NbButtonModule, NbCardModule, NbCheckboxModule } from '@nebular/theme';
import { GlobalInput } from '@shared/components/global-input/global-input';
import { CiInput } from '@shared/components/ci-input/ci-input';
import { Avatar } from '@shared/components/avatar/avatar';
import { ToastService } from '@shared/services/toast.service';
import { domainFormatValidator } from '@shared/validators/domain-format.validator';
import { compressImage } from '@shared/utils/compress-image';
import { AuthService } from 'src/app/features/auth/auth.service';
import { CompanyService } from '../../company-repository.service';
import { SubscriptionService } from '../../subscription.service';
import { SubscriptionStatus } from '../../interfaces/subscription';

interface CompanyEditForm {
  name: FormControl<string | null>;
  rif: FormControl<string | null>;
  domain: FormControl<string | null>;
  link_expiration_minutes: FormControl<number | null>;
  default_rate_type: FormControl<'bcv' | 'eur' | 'promedio' | null>;
}

/** Marcados por defecto para una empresa nueva; el admin puede desmarcarlos */
export const DEFAULT_REQUIRED_BUYER_FIELDS = ['first_name', 'email'];

export const BUYER_FIELD_OPTIONS: { key: string; label: string }[] = [
  { key: 'first_name', label: 'Nombre' },
  { key: 'last_name', label: 'Apellido' },
  { key: 'email', label: 'Correo' },
  { key: 'ci', label: 'Cédula' },
  { key: 'phone', label: 'Teléfono' },
  { key: 'address', label: 'Ubicación' },
];

@Component({
  selector: 'app-company-page',
  imports: [ReactiveFormsModule, NbCardModule, NbButtonModule, NbCheckboxModule, GlobalInput, CiInput, Avatar, RouterLink, DatePipe],
  templateUrl: './company-page.html',
})
export class CompanyPage implements OnInit {

  protected auth = inject(AuthService);
  private companyService = inject(CompanyService);
  private subscriptionService = inject(SubscriptionService);
  private toast = inject(ToastService);
  private is_browser = isPlatformBrowser(inject(PLATFORM_ID));

  is_saving = signal(false);
  logo_file = signal<File | null>(null);
  logo_preview = signal<string | null>(null);
  subscription = signal<SubscriptionStatus | null>(null);
  buyerFieldOptions = BUYER_FIELD_OPTIONS;
  required_fields = signal<Set<string>>(new Set(DEFAULT_REQUIRED_BUYER_FIELDS));

  form: FormGroup<CompanyEditForm> = new FormGroup<CompanyEditForm>({
    name: new FormControl<string | null>(null, [Validators.required]),
    rif: new FormControl<string | null>(null),
    domain: new FormControl<string | null>(null, [domainFormatValidator()]),
    link_expiration_minutes: new FormControl<number | null>(30, [
      Validators.required,
      Validators.min(1),
      Validators.max(120),
    ]),
    default_rate_type: new FormControl<'bcv' | 'eur' | 'promedio' | null>('bcv', [Validators.required]),
  });

  ngOnInit(): void {
    if (!this.is_browser) return;

    const company = this.auth.session()?.company;
    if (!company) return;

    this.form.patchValue({
      name: company.name,
      rif: company.rif,
      domain: company.domain,
      // Sesiones guardadas antes de esta funcionalidad no traen el campo: se asume el default del backend
      link_expiration_minutes: company.link_expiration_minutes ?? 30,
      default_rate_type: company.default_rate_type ?? 'bcv'
    });

    this.required_fields.set(new Set(company.required_buyer_fields ?? DEFAULT_REQUIRED_BUYER_FIELDS));

    this.subscriptionService.getStatus().subscribe({
      next: (status) => this.subscription.set(status),
      error: () => { }
    });
  }

  toggleRequiredField(key: string): void {
    this.required_fields.update((current) => {
      const next = new Set(current);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  isFieldRequired(key: string): boolean {
    return this.required_fields().has(key);
  }

  async onLogoSelected(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;

    const compressed = file ? await compressImage(file) : null;

    this.logo_file.set(compressed);
    this.logo_preview.set(compressed ? URL.createObjectURL(compressed) : null);
  }

  save(): void {
    if (this.is_saving()) return;

    this.form.markAllAsTouched();

    if (this.form.invalid) {
      this.toast.error('Revisa los datos de la empresa antes de guardarlos.');
      return;
    }

    const { name, rif, domain, link_expiration_minutes, default_rate_type } = this.form.getRawValue();

    this.is_saving.set(true);

    this.companyService.updateCompany({
      name: name!,
      rif: rif?.trim() || null,
      domain: domain?.trim() || null,
      logo: this.logo_file(),
      link_expiration_minutes: link_expiration_minutes!,
      default_rate_type: default_rate_type!,
      required_buyer_fields: Array.from(this.required_fields())
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
