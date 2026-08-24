import { Component, HostListener, Input } from '@angular/core';
import { NbButtonModule, NbDialogRef, NbIconModule } from '@nebular/theme';

const MIN_SCALE = 1;
const MAX_SCALE = 4;
const SCALE_STEP = 0.5;

/**
 * Visor de imagen en pantalla completa (comprobantes de pago): zoom, rotacion
 * y arrastre, dentro de un dialogo de Nebular.
 */
@Component({
  selector: 'app-image-viewer-dialog',
  standalone: true,
  imports: [NbButtonModule, NbIconModule],
  templateUrl: './image-viewer-dialog.html',
})
export class ImageViewerDialog {
  @Input() src = '';
  @Input() alt = 'Imagen';

  scale = 1;
  rotation = 0;
  translateX = 0;
  translateY = 0;

  private dragging = false;
  private dragStartX = 0;
  private dragStartY = 0;

  constructor(protected dialogRef: NbDialogRef<ImageViewerDialog>) { }

  get transform(): string {
    return `translate(${this.translateX}px, ${this.translateY}px) scale(${this.scale}) rotate(${this.rotation}deg)`;
  }

  get canZoomIn(): boolean {
    return this.scale < MAX_SCALE;
  }

  get canZoomOut(): boolean {
    return this.scale > MIN_SCALE;
  }

  zoomIn(): void {
    this.scale = Math.min(this.scale + SCALE_STEP, MAX_SCALE);
  }

  zoomOut(): void {
    this.scale = Math.max(this.scale - SCALE_STEP, MIN_SCALE);
    if (this.scale <= MIN_SCALE) this.resetPosition();
  }

  /** "Voltear" la foto cuando el comprobante viene de lado */
  rotate(): void {
    this.rotation = (this.rotation + 90) % 360;
  }

  reset(): void {
    this.scale = 1;
    this.rotation = 0;
    this.resetPosition();
  }

  close(): void {
    this.dialogRef.close();
  }

  onWheel(event: WheelEvent): void {
    event.preventDefault();
    if (event.deltaY < 0) this.zoomIn();
    else this.zoomOut();
  }

  onPointerDown(event: PointerEvent): void {
    if (this.scale <= MIN_SCALE) return;
    this.dragging = true;
    this.dragStartX = event.clientX - this.translateX;
    this.dragStartY = event.clientY - this.translateY;
  }

  @HostListener('window:pointermove', ['$event'])
  onPointerMove(event: PointerEvent): void {
    if (!this.dragging) return;
    this.translateX = event.clientX - this.dragStartX;
    this.translateY = event.clientY - this.dragStartY;
  }

  @HostListener('window:pointerup')
  onPointerUp(): void {
    this.dragging = false;
  }

  private resetPosition(): void {
    this.translateX = 0;
    this.translateY = 0;
  }
}
