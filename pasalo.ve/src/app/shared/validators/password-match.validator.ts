import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

/**
 * Valida que la confirmación de contraseña coincida.
 * El error se marca sobre el control de confirmación para poder mostrarlo en el input.
 */
export function passwordMatchValidator(
  password_key = 'password',
  confirmation_key = 'password_confirmation'
): ValidatorFn {
  return (group: AbstractControl): ValidationErrors | null => {
    const password = group.get(password_key);
    const confirmation = group.get(confirmation_key);

    if (!password || !confirmation) return null;

    const mismatch = !!confirmation.value && password.value !== confirmation.value;
    const errors = { ...(confirmation.errors ?? {}) };

    if (mismatch) {
      errors['passwordMismatch'] = true;
    } else {
      delete errors['passwordMismatch'];
    }

    confirmation.setErrors(Object.keys(errors).length ? errors : null);

    return mismatch ? { passwordMismatch: true } : null;
  };
}
