import { NgClass, NgStyle } from '@angular/common';
import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { NbBadgeModule, NbButtonModule, NbCardModule } from '@nebular/theme';
import { PlanInterface } from 'src/app/services/http/plan/plan';
import { BillingCycle, annualMonthlyEquivalent, annualPrice, annualSavings } from '@shared/utils/billing';

@Component({
  selector: 'app-card-subscription-plan',
  imports: [NgClass, NbCardModule, NbButtonModule, NbBadgeModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './card-subscription-plan.html',
  styleUrl: './card-subscription-plan.scss',
})
export class CardSubscriptionPlanComponent {
  @Input() plan!: PlanInterface;
  @Input() isSelected: boolean = false;
  /** Ciclo de facturación elegido en el listado; el plan gratuito lo ignora. */
  @Input() billingCycle: BillingCycle = 'monthly';
  @Output() planSelected = new EventEmitter<void>();

  get is_annual(): boolean {
    return this.billingCycle === 'annual';
  }

  /** Precio total del año con el 20% de descuento. */
  get annual_price(): number {
    return annualPrice(this.plan.price);
  }

  /** Equivalente mensual pagando anual, para el comparativo. */
  get monthly_equivalent(): number {
    return annualMonthlyEquivalent(this.plan.price);
  }

  /** Ahorro anual frente a pagar 12 meses sueltos. */
  get annual_savings(): number {
    return annualSavings(this.plan.price);
  }
}
