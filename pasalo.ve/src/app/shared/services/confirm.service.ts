import { Injectable, inject } from '@angular/core';
import { NbDialogService } from '@nebular/theme';
import { Observable, map } from 'rxjs';
import { ConfirmDialog, ConfirmStatus } from '../components/confirm-dialog/confirm-dialog';

export interface ConfirmOptions {
  title?: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  status?: ConfirmStatus;
}

/**
 * Reemplaza el confirm() nativo del navegador por un dialogo de Nebular, para
 * que las alertas de confirmacion tengan la misma identidad visual que el
 * resto de la app (mismos botones, mismos colores por status).
 */
@Injectable({ providedIn: 'root' })
export class ConfirmService {

  private dialogService = inject(NbDialogService);

  /** Emite true si el usuario confirma, false si cancela o cierra el dialogo */
  ask(options: ConfirmOptions): Observable<boolean> {
    const dialogRef = this.dialogService.open(ConfirmDialog, {
      closeOnBackdropClick: false,
      context: {
        title: options.title ?? 'Confirmar',
        message: options.message,
        confirmLabel: options.confirmLabel ?? 'Confirmar',
        cancelLabel: options.cancelLabel ?? 'Cancelar',
        status: options.status ?? 'danger',
      },
    });

    return dialogRef.onClose.pipe(map((result) => result === true));
  }
}
