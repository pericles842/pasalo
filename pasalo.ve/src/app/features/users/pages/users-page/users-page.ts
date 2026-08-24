import { Component, OnInit, PLATFORM_ID, computed, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { NbButtonModule, NbCardModule } from '@nebular/theme';
import { CardSubscriptionPlanComponent } from '@shared/components/card-subscription-plan/card-subscription-plan';
import { passwordMatchValidator } from '@shared/validators/password-match.validator';
import { ToastService } from '@shared/services/toast.service';
import { ConfirmService } from '@shared/services/confirm.service';
import { AuthService } from 'src/app/features/auth/auth.service';
import { PlanInterface } from 'src/app/services/http/plan/plan';
import { PlanService } from 'src/app/services/http/plan/plan.service';
import { SubscriptionService } from 'src/app/features/company/subscription.service';
import { NewUserForm } from '../../components/new-user-form/new-user-form';
import { CompanyUser, CreateUserForm, PlanUsage } from '../../interfaces/company-user';
import { UsersService } from '../../users.service';

@Component({
  selector: 'app-users-page',
  imports: [
    ReactiveFormsModule,
    NbCardModule,
    NbButtonModule,
    CardSubscriptionPlanComponent,
    NewUserForm
  ],
  templateUrl: './users-page.html',
})
export class UsersPage implements OnInit {

  private usersService = inject(UsersService);
  private planService = inject(PlanService);
  private subscriptionService = inject(SubscriptionService);
  private auth = inject(AuthService);
  private toast = inject(ToastService);
  private confirm = inject(ConfirmService);
  private is_browser = isPlatformBrowser(inject(PLATFORM_ID));

  // Estado en signals: la app corre en zoneless y asi la vista se refresca sola
  users = signal<CompanyUser[]>([]);
  plans = signal<PlanInterface[]>([]);
  current_plan = signal<PlanInterface | null>(null);
  usage = signal<PlanUsage>({ used: 0, limit: 0, available: 0 });

  is_loading = signal(true);
  is_saving = signal(false);
  is_changing_plan = signal(false);
  show_plans = signal(false);

  /** uuid del usuario que se esta eliminando, para deshabilitar solo su fila */
  deleting_uuid = signal<string | null>(null);

  /** Solo el usuario master puede administrar usuarios */
  is_admin = computed(() => this.auth.session()?.role?.slug === 'admin');

  /** Sin cupo disponible no se puede crear: hay que cambiar de plan */
  has_room = computed(() => this.usage().available > 0);

  usage_percent = computed(() => {
    const { used, limit } = this.usage();
    return limit > 0 ? Math.min(100, Math.round((used / limit) * 100)) : 100;
  });

  user_form: FormGroup<CreateUserForm> = new FormGroup<CreateUserForm>({
    role_id: new FormControl<number | null>(null, [Validators.required]),
    first_name: new FormControl<string | null>(null, [Validators.required]),
    middle_name: new FormControl<string | null>(null),
    email: new FormControl<string | null>(null, [Validators.required, Validators.email]),
    password: new FormControl<string | null>(null, [Validators.required, Validators.minLength(8)]),
    password_confirmation: new FormControl<string | null>(null, [Validators.required])
  }, { validators: passwordMatchValidator() });

  ngOnInit(): void {
    // En SSR no hay token: los datos se piden al hidratar en el navegador
    if (!this.is_browser) return;

    this.loadUsers();
    this.planService.getFullPlan().subscribe((plans) => this.plans.set(plans));
  }

  loadUsers(): void {
    this.is_loading.set(true);

    this.usersService.getCompanyUsers().subscribe({
      next: (response) => {
        this.users.set(response.users);
        this.current_plan.set(response.plan);
        this.usage.set(response.usage);
        this.is_loading.set(false);
      },
      error: (err) => {
        this.toast.error(err?.error?.error ?? 'No pudimos cargar los usuarios.');
        this.is_loading.set(false);
      }
    });
  }

  togglePlans(): void {
    this.show_plans.update((value) => !value);
  }

  createUser(): void {
    if (this.is_saving()) return;

    this.user_form.markAllAsTouched();

    if (this.user_form.invalid) {
      this.toast.error('Revisa los datos del usuario antes de guardarlo.');
      return;
    }

    this.is_saving.set(true);

    this.usersService.createUser(this.user_form.getRawValue()).subscribe({
      next: (response) => {
        this.is_saving.set(false);
        this.toast.success(`Usuario ${response.user.first_name} creado como ${response.role.name}.`);
        this.user_form.reset();
        this.loadUsers();
      },
      error: (err) => {
        this.is_saving.set(false);
        this.toast.error(err?.error?.error ?? 'No pudimos crear el usuario.');

        // La API devuelve el consumo actualizado cuando rechaza por limite
        if (err?.error?.usage) this.usage.set(err.error.usage);
      }
    });
  }

  changePlan(plan: PlanInterface): void {
    if (this.is_changing_plan() || plan.id === this.current_plan()?.id) return;

    this.is_changing_plan.set(true);

    this.subscriptionService.changePlan(plan.id).subscribe({
      next: (response) => {
        this.is_changing_plan.set(false);
        this.show_plans.set(false);

        if (response.status === 'pending_verification') {
          const company_name = this.auth.session()?.company?.name ?? 'mi empresa';
          window.open(this.subscriptionService.buildWhatsAppUrl(company_name, response), '_blank');
          this.toast.success(`Solicitud enviada. Te escribiremos por WhatsApp para coordinar el pago del ${response.plan.name}.`);
          return;
        }

        // Plan gratuito: se aplico al instante, se recarga todo para reflejarlo
        this.loadUsers();
        this.toast.success(`Ahora tienes el ${response.plan.name}.`);
      },
      error: (err) => {
        this.is_changing_plan.set(false);
        this.toast.error(err?.error?.error ?? 'No pudimos cambiar el plan.');
      }
    });
  }

  deleteUser(user: CompanyUser): void {
    if (this.deleting_uuid()) return;

    this.confirm.ask({
      title: 'Eliminar usuario',
      message: `¿Eliminar a ${user.first_name} ${user.middle_name ?? ''}? Esta acción no se puede deshacer.`,
      confirmLabel: 'Eliminar',
    }).subscribe((confirmed) => {
      if (!confirmed) return;

      this.deleting_uuid.set(user.uuid);

      this.usersService.deleteUser(user.uuid).subscribe({
        next: (response) => {
          this.deleting_uuid.set(null);
          this.users.update((users) => users.filter((u) => u.uuid !== user.uuid));
          this.usage.set(response.usage);
          this.toast.success(`${user.first_name} fue eliminado de la empresa.`);
        },
        error: (err) => {
          this.deleting_uuid.set(null);
          this.toast.error(err?.error?.error ?? 'No pudimos eliminar el usuario.');
        }
      });
    });
  }

  /** Pendiente: aun no tiene funcionalidad, solo la referencia visual del boton */
  deactivateUser(user: CompanyUser): void { }
}
