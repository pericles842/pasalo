import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

const DOMAIN_PATTERN = /^(https?:\/\/)?(www\.)?[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+$/i;

/**
 * El dominio es opcional (si no se da, el tenant_id sale del nombre de la
 * empresa), pero si se escribe algo, debe tener forma de dominio valido.
 */
export function domainFormatValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = (control.value ?? '').trim();
    if (!value) return null;

    return DOMAIN_PATTERN.test(value) ? null : { domainFormat: true };
  };
}
