import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { NgClass } from '@angular/common';
import { FormGroup } from '@angular/forms';
import { NbBadgeModule, NbButtonModule, NbCardModule } from '@nebular/theme';
import { CardSubscriptionPlanControls } from './card-subscription-plan.d';

@Component({
  selector: 'app-card-subscription-plan',
  imports: [NgClass, NbCardModule, NbButtonModule, NbBadgeModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './card-subscription-plan.html',
  styleUrl: './card-subscription-plan.scss',
})
export class CardSubscriptionPlanComponent {
  @Input() plan!: FormGroup<CardSubscriptionPlanControls>;
  @Input() isSelected: boolean = false;
  @Output() planSelected = new EventEmitter<void>();
}
