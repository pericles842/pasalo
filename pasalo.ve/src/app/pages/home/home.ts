import { isPlatformBrowser } from '@angular/common';
import { Component, OnInit, PLATFORM_ID, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { NbButtonModule } from '@nebular/theme';
import { CardSubscriptionPlanComponent } from 'src/app/shared/components/card-subscription-plan/card-subscription-plan';
import { BillingCycleToggle } from '@shared/components/billing-cycle-toggle/billing-cycle-toggle';
import { BillingCycle } from '@shared/utils/billing';
import { PlanInterface } from 'src/app/services/http/plan/plan';
import { PlanService } from 'src/app/services/http/plan/plan.service';

interface Benefit {
  number: string;
  title: string;
  text: string;
}

interface Step {
  title: string;
  text: string;
}

@Component({
  selector: 'app-home',
  imports: [RouterLink, NbButtonModule, CardSubscriptionPlanComponent, BillingCycleToggle],
  templateUrl: './home.html',
  styleUrl: './home.scss',
})
export class Home implements OnInit {

  private planService = inject(PlanService);
  private router = inject(Router);
  private is_browser = isPlatformBrowser(inject(PLATFORM_ID));

  plans = signal<PlanInterface[]>([]);
  billing_cycle = signal<BillingCycle>('monthly');
  is_loading = signal(true);

  readonly benefits: Benefit[] = [
    {
      number: '01',
      title: 'Crea tu link de pago',
      text: 'Genera un link de pago para lo que vendes y compártelo por WhatsApp, redes o donde ya hablas con tus clientes.',
    },
    {
      number: '02',
      title: 'Cobra sin fricción',
      text: 'Tu cliente elige el método de pago, paga y sube su comprobante sin salir del chat.',
    },
    {
      number: '03',
      title: 'Controla cada orden',
      text: 'Valida comprobantes, revisa el estado de cada orden y mide tus ventas desde un solo panel.',
    },
  ];

  readonly steps: Step[] = [
    { title: 'Crea', text: 'Genera un link de pago para tu producto o servicio en segundos.' },
    { title: 'Comparte', text: 'Envíalo por WhatsApp, Instagram o donde ya vendes.' },
    { title: 'Cobra', text: 'Tu cliente paga y sube su comprobante; tú lo validas y listo.' },
  ];

  ngOnInit(): void {
    if (!this.is_browser) return;

    this.planService.getFullPlan().subscribe({
      next: (plans) => {
        this.plans.set(plans);
        this.is_loading.set(false);
      },
      error: () => this.is_loading.set(false),
    });
  }

  /** El login tiene "Iniciar con Google": ahi se decide si es cliente nuevo (va a registrar su empresa) o ya tiene cuenta */
  goToStart(): void {
    this.router.navigate(['/login']);
  }
}
