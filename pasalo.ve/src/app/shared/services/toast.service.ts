import { Injectable, inject } from '@angular/core';
import { NbToastrService } from '@nebular/theme';

/**
 * Envuelve NbToastrService para no repetir titulo/duracion en cada pantalla.
 * https://akveo.github.io/nebular/docs/components/toastr/overview#nbtoastrservice
 */
@Injectable({ providedIn: 'root' })
export class ToastService {

  private toastr = inject(NbToastrService);

  success(message: string, title = 'Listo'): void {
    this.toastr.success(message, title, { duration: 4000 });
  }

  warning(message: string, title = 'Atención'): void {
    this.toastr.warning(message, title, { duration: 6000 });
  }

  error(message: string, title = 'Error'): void {
    this.toastr.danger(message, title, { duration: 6000 });
  }
}
