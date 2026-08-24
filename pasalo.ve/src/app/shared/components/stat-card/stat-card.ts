import { Component, Input } from '@angular/core';
import { NbIconModule } from '@nebular/theme';

@Component({
  selector: 'app-stat-card',
  standalone: true,
  imports: [NbIconModule],
  templateUrl: './stat-card.html',
})
export class StatCard {
  @Input({ required: true }) label!: string;
  @Input({ required: true }) value!: string;
  @Input({ required: true }) icon!: string;
  @Input() iconBgClass = 'bg-blue-50 text-blue-600';
}
