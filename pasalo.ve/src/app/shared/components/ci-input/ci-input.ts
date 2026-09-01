import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { NbInputModule, NbSelectModule } from '@nebular/theme';

/**
 * Documento de identidad: prefijo (V/E para persona natural, J para juridica,
 * segun lo que reciba en `prefixes`) + numero, solo digitos. El valor
 * combinado ("V12345678") es lo que se escribe en `control`.
 *
 * Usa dos FormControl internos (en vez de manejar el value del input a mano)
 * para que la sincronizacion con el DOM la haga el propio Reactive Forms de
 * Angular, no un binding [value] + (input) casero.
 */
@Component({
  selector: 'app-ci-input',
  imports: [ReactiveFormsModule, NbInputModule, NbSelectModule],
  templateUrl: './ci-input.html',
})
export class CiInput implements OnInit, OnDestroy {
  @Input({ required: true }) control!: FormControl<string | null>;
  @Input({ required: true }) label!: string;
  @Input({ required: true }) name!: string;
  @Input() prefixes: string[] = ['V', 'E'];
  @Input() hint = '';
  @Input() error = '';

  prefixControl = new FormControl<string>('V', { nonNullable: true });
  numberControl = new FormControl<string>('', { nonNullable: true });

  private subscription?: Subscription;

  ngOnInit(): void {
    this.prefixControl.setValue(this.prefixes[0] ?? 'V', { emitEvent: false });

    const value = this.control.value ?? '';
    const match = value.match(/^([A-Za-z])(\d*)$/);

    if (match && this.prefixes.includes(match[1].toUpperCase())) {
      this.prefixControl.setValue(match[1].toUpperCase(), { emitEvent: false });
      this.numberControl.setValue(match[2], { emitEvent: false });
    }

    this.subscription = this.prefixControl.valueChanges.subscribe(() => this.emit());

    this.subscription.add(
      this.numberControl.valueChanges.subscribe((raw) => {
        const digits = raw.replace(/\D/g, '');
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
