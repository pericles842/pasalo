import { isPlatformBrowser } from '@angular/common';
import { Component, OnInit, PLATFORM_ID, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { CardSubscriptionPlanComponent } from 'src/app/shared/components/card-subscription-plan/card-subscription-plan';
import { PlanInterface } from 'src/app/services/http/plan/plan';
import { PlanService } from 'src/app/services/http/plan/plan.service';

@Component({
  selector: 'app-pricing',
  imports: [RouterLink, CardSubscriptionPlanComponent],
  templateUrl: './pricing.html',
})
export class Pricing implements OnInit {

  private planService = inject(PlanService);
  private router = inject(Router);
  private is_browser = isPlatformBrowser(inject(PLATFORM_ID));

  plans = signal<PlanInterface[]>([]);
  is_loading = signal(true);

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

  goToRegister(): void {
    this.router.navigate(['/create-company']);
  }
}
