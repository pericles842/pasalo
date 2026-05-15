import { Component, Input } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { NbInputModule } from '@nebular/theme';

@Component({
  selector: 'app-global-input',
  imports: [ReactiveFormsModule, NbInputModule],
  templateUrl: './global-input.html',
  styleUrl: './global-input.scss',
})
export class GlobalInput {
  @Input({ required: true }) control!: FormControl<string | number>;
  @Input({ required: true }) label!: string;
  @Input({ required: true }) name!: string;
  @Input() placeholder = '';
  @Input() hint = '';
  @Input() type: 'text' | 'number' | 'email' = 'text';

  get isInvalid(): boolean {
    return this.control.invalid && (this.control.touched || this.control.dirty);
  }

  get status(): 'primary' | 'danger' {
    return this.isInvalid ? 'danger' : 'primary';
  }
}
