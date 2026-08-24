import { Component, Input } from '@angular/core';

type Variant = 'dark' | 'subtle' | 'light';

const CONTAINER_CLASS: Record<Variant, string> = {
  dark: 'border-t border-white/10 bg-blue-600 px-6 py-4 lg:px-8',
  subtle: 'border-t border-blue-100 bg-blue-50 px-6 py-3',
  light: 'border-t border-blue-100 bg-white px-6 py-3',
};

const TEXT_CLASS: Record<Variant, string> = {
  dark: 'text-white',
  subtle: 'text-blue-600',
  light: 'text-blue-600',
};

const LINK_CLASS: Record<Variant, string> = {
  dark: 'font-semibold text-white! no-underline! hover:opacity-80!',
  subtle: 'font-semibold text-blue-600! no-underline! hover:opacity-80!',
  light: 'font-semibold text-blue-600! no-underline! hover:opacity-80!',
};

@Component({
  selector: 'app-copyright',
  standalone: true,
  imports: [],
  templateUrl: './copyright.html',
})
export class Copyright {
  /**
   * "dark": barra azul de marca, para ir pegada al Footer en las paginas publicas.
   * "subtle": fondo azul muy tenue con texto primary, para login y el pago publico.
   * "light": fondo blanco con texto azul, para el dashboard.
   */
  @Input() variant: Variant = 'dark';

  protected readonly current_year = new Date().getFullYear();

  protected get container_class(): string {
    return CONTAINER_CLASS[this.variant];
  }

  protected get text_class(): string {
    return TEXT_CLASS[this.variant];
  }

  protected get link_class(): string {
    return LINK_CLASS[this.variant];
  }
}
