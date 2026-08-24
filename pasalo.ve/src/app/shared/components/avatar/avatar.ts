import { Component, Input } from '@angular/core';

/**
 * Burbuja de avatar: muestra la foto si hay una, o las iniciales cuando no.
 * Se usa tanto para la foto del usuario como para el logo de la empresa.
 */
@Component({
  selector: 'app-avatar',
  imports: [],
  templateUrl: './avatar.html',
})
export class Avatar {
  @Input() photoUrl: string | null = null;
  @Input() initialsText = '';
  @Input() sizeClass = 'h-9 w-9 text-sm';
  @Input() bubbleClass = 'bg-white text-blue-700';
}
