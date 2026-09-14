import { isPlatformBrowser } from '@angular/common';
import {
  DestroyRef,
  Directive,
  ElementRef,
  PLATFORM_ID,
  afterNextRender,
  inject,
  input,
  signal,
} from '@angular/core';

/**
 * Desde donde entra el elemento. Los estilos de cada variante estan en
 * styles.scss (bloque "Animaciones de entrada"), no aca: asi el HTML del SSR
 * ya se ve bien aunque el JS todavia no haya arrancado.
 */
export type RevealFrom = 'up' | 'down' | 'left' | 'right' | 'fade' | 'zoom';

/**
 * Anima un elemento la primera vez que entra en pantalla (landing).
 *
 * <div appReveal="left" [revealDelay]="150"> ... </div>
 *
 * Tres decisiones a proposito:
 *
 * 1. El estado escondido (.reveal) lo pone la directiva en el navegador, no el
 *    CSS. Si el JS falla, se bloquea o el usuario pidio menos movimiento, el
 *    contenido se ve igual: nunca queda una pagina en blanco por una animacion.
 *
 * 2. Lo que ya estaba en pantalla en el primer pintado no se anima. Esa parte
 *    la pinto el SSR antes de que hidratara Angular; esconderla para volver a
 *    mostrarla seria un parpadeo, no una entrada.
 *
 * 3. Se usa IntersectionObserver y no el evento scroll: el navegador lo
 *    resuelve fuera del hilo del scroll y, como la app es zoneless, el callback
 *    nativo no dispara change detection (la dispara el signal, una sola vez).
 */
@Directive({
  selector: '[appReveal]',
  host: {
    '[class.reveal]': 'armed()',
    '[class.reveal-in]': 'shown()',
    '[attr.data-reveal]': 'armed() ? appReveal() : null',
    '[style.transitionDelay]': 'armed() ? revealDelay() + "ms" : null',
  },
})
export class Reveal {

  /** Direccion de entrada. Por defecto sube unos pixeles mientras aparece. */
  readonly appReveal = input<RevealFrom>('up');

  /** Retraso en ms. Sirve para encadenar hermanos (tarjetas, pasos, planes). */
  readonly revealDelay = input(0);

  private host = inject(ElementRef<HTMLElement>);
  private destroy_ref = inject(DestroyRef);
  private is_browser = isPlatformBrowser(inject(PLATFORM_ID));

  /** El elemento esta escondido esperando su turno */
  protected armed = signal(false);

  /** Ya entro en pantalla: se deja ver */
  protected shown = signal(false);

  constructor() {
    if (!this.is_browser) return;

    afterNextRender(() => {
      const element = this.host.nativeElement;
      const reduced_motion = matchMedia('(prefers-reduced-motion: reduce)').matches;

      // Ya visible (o el usuario no quiere movimiento): se muestra tal cual
      if (reduced_motion || element.getBoundingClientRect().top < innerHeight) {
        this.shown.set(true);
        return;
      }

      this.armed.set(true);

      const observer = new IntersectionObserver(
        ([entry]) => {
          if (!entry.isIntersecting) return;
          this.shown.set(true);
          observer.disconnect();

          // Terminada la entrada se sueltan las clases y el elemento vuelve a
          // su CSS de siempre: sin capa de compositor reservada (will-change)
          // ni un transition-delay heredado que despues retrase sus hovers.
          element.addEventListener('transitionend', () => {
            this.armed.set(false);
            this.shown.set(false);
          }, { once: true });
        },
        // El -12% de abajo hace que la animacion arranque cuando el elemento ya
        // subio un poco, y no apenas asoma el primer pixel
        { threshold: 0, rootMargin: '0px 0px -12% 0px' },
      );

      observer.observe(element);
      this.destroy_ref.onDestroy(() => observer.disconnect());
    });
  }
}
