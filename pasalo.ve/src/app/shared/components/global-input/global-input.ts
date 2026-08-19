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
  @Input() control!: FormControl<any>;
  @Input({ required: true }) label!: string;
  @Input({ required: true }) name!: string;
  // Eliminado formControlName, solo se usará control
  @Input() placeholder = '';
  @Input() hint = '';
  // Mensaje que reemplaza al hint cuando el campo es inválido
  @Input() error = '';
  @Input() type: 'text' | 'number' | 'email' | 'file' | 'password' = 'text';

  get isInvalid(): boolean {
    return this.control.invalid && (this.control.touched || this.control.dirty);
  }

  get status(): 'primary' | 'danger' {
    return this.isInvalid ? 'danger' : 'primary';
  }

  get message(): string {
    return this.isInvalid && this.error ? this.error : this.hint;
  }
}
