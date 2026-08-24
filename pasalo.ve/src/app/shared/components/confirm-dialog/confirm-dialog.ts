import { Component, Input } from '@angular/core';
import { NbButtonModule, NbCardModule, NbDialogRef, NbIconModule } from '@nebular/theme';

export type ConfirmStatus = 'danger' | 'warning' | 'primary' | 'success';

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [NbCardModule, NbButtonModule, NbIconModule],
  templateUrl: './confirm-dialog.html',
})
export class ConfirmDialog {
  @Input() title = 'Confirmar';
  @Input() message = '¿Estás seguro?';
  @Input() confirmLabel = 'Confirmar';
  @Input() cancelLabel = 'Cancelar';
  @Input() status: ConfirmStatus = 'danger';

  constructor(protected dialogRef: NbDialogRef<ConfirmDialog>) { }

  confirm(): void {
    this.dialogRef.close(true);
  }

  cancel(): void {
    this.dialogRef.close(false);
  }
}
