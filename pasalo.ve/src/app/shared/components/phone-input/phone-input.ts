import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { NbInputModule } from '@nebular/theme';

const PHONE_PREFIXES = ['0414', '0424', '0412', '0416', '0426'];

/**
 * Telefono venezolano: prefijo de operadora + 7 digitos. El valor combinado
 * ("04141234567") es lo que se escribe en `control`.
 *
 * Usa dos FormControl internos (en vez de manejar el value del input a mano)
 * para que la sincronizacion con el DOM la haga el propio Reactive Forms de
 * Angular, no un binding [value] + (input) casero.
 */
@Component({
  selector: 'app-phone-input',
  imports: [ReactiveFormsModule, NbInputModule],
  templateUrl: './phone-input.html',
})
export class PhoneInput implements OnInit, OnDestroy {
  @Input({ required: true }) control!: FormControl<string | null>;
  @Input({ required: true }) label!: string;
  @Input({ required: true }) name!: string;
  @Input() hint = '';
  @Input() error = '';

  prefixes = PHONE_PREFIXES;
  prefixControl = new FormControl<string>(PHONE_PREFIXES[0], { nonNullable: true });
  numberControl = new FormControl<string>('', { nonNullable: true });

  private subscription?: Subscription;

  ngOnInit(): void {
    const value = this.control.value ?? '';
    const match = value.match(/^(\d{4})(\d*)$/);

    if (match && this.prefixes.includes(match[1])) {
      this.prefixControl.setValue(match[1], { emitEvent: false });
      this.numberControl.setValue(match[2], { emitEvent: false });
    }

    this.subscription = this.prefixControl.valueChanges.subscribe(() => this.emit());

    this.subscription.add(
      this.numberControl.valueChanges.subscribe((raw) => {
        const digits = raw.replace(/\D/g, '').slice(0, 7);
        if (digits !== raw) {
          this.numberControl.setValue(digits, { emitEvent: false });
        }
        this.emit();
      })
    );
  }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
  }

  get isInvalid(): boolean {
    return this.control.invalid && (this.control.touched || this.control.dirty);
  }

  get status(): 'primary' | 'danger' {
    return this.isInvalid ? 'danger' : 'primary';
  }

  get message(): string {
    return this.isInvalid && this.error ? this.error : this.hint;
  }

  onBlur(): void {
    this.control.markAsTouched();
  }

  private emit(): void {
    const number = this.numberControl.value;
    this.control.setValue(number ? `${this.prefixControl.value}${number}` : null);
    this.control.markAsDirty();
  }
}
