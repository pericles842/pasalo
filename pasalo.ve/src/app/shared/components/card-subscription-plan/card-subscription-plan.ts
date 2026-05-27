import { NgClass, NgStyle } from '@angular/common';
import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { NbBadgeModule, NbButtonModule, NbCardModule } from '@nebular/theme';
import { PlanInterface } from 'src/app/services/http/plan/plan';

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
  @Output() planSelected = new EventEmitter<void>();

}
