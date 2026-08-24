import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-copyright',
  standalone: true,
  imports: [],
  templateUrl: './copyright.html',
})
export class Copyright {
  /**
   * "dark": barra azul de marca, para ir pegada al Footer en las paginas publicas.
   * "subtle": fondo azul muy tenue con texto primary, para login y el dashboard.
   */
  @Input() variant: 'dark' | 'subtle' = 'dark';

  protected readonly current_year = new Date().getFullYear();
}
