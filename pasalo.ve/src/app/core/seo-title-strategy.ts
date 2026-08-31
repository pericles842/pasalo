import { DOCUMENT } from '@angular/common';
import { Injectable, inject } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { RouterStateSnapshot, TitleStrategy } from '@angular/router';

const SITE_NAME = 'Pásalo';
const SITE_URL = 'https://pasalo.co.ve';
const DEFAULT_DESCRIPTION =
  'Pásalo es la plataforma venezolana para gestionar tu negocio: administra pedidos y clientes, y cobra pago móvil, transferencia u otros métodos en bolívares o dólares desde un solo lugar.';
const DEFAULT_IMAGE = `${SITE_URL}/hero-app-preview.png`;

/**
 * Reemplaza el TitleStrategy por defecto de Angular: ademas de poner el
 * `<title>` (lo que Angular ya hace solo leyendo `route.title`), setea
 * meta description, Open Graph, Twitter Card y el <link rel="canonical">
 * en cada navegacion, leyendo `route.data.description`/`route.data.ogImage`
 * de la ruta hoja. Al correr dentro de Angular (SSR incluido), estas tags
 * quedan en el HTML que recibe un crawler, no dependen de que se ejecute JS.
 */
@Injectable({ providedIn: 'root' })
export class SeoTitleStrategy extends TitleStrategy {
  private titleService = inject(Title);
  private meta = inject(Meta);
  private document = inject(DOCUMENT);

  override updateTitle(snapshot: RouterStateSnapshot): void {
    const title = this.buildTitle(snapshot) ?? SITE_NAME;
    this.titleService.setTitle(title);

    let route = snapshot.root;
    while (route.firstChild) route = route.firstChild;

    const description: string = route.data['description'] ?? DEFAULT_DESCRIPTION;
    const image = this.absoluteUrl(route.data['ogImage'] ?? DEFAULT_IMAGE);
    const url = `${SITE_URL}${snapshot.url}`;

    this.meta.updateTag({ name: 'description', content: description });
    this.meta.updateTag({ property: 'og:site_name', content: SITE_NAME });
    this.meta.updateTag({ property: 'og:locale', content: 'es_VE' });
    this.meta.updateTag({ property: 'og:type', content: 'website' });
    this.meta.updateTag({ property: 'og:title', content: title });
    this.meta.updateTag({ property: 'og:description', content: description });
    this.meta.updateTag({ property: 'og:image', content: image });
    this.meta.updateTag({ property: 'og:url', content: url });
    this.meta.updateTag({ name: 'twitter:card', content: 'summary_large_image' });
    this.meta.updateTag({ name: 'twitter:title', content: title });
    this.meta.updateTag({ name: 'twitter:description', content: description });
    this.meta.updateTag({ name: 'twitter:image', content: image });

    this.updateCanonical(url);
  }

  private absoluteUrl(path: string): string {
    return path.startsWith('http') ? path : `${SITE_URL}${path}`;
  }

  private updateCanonical(url: string): void {
    let link = this.document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!link) {
      link = this.document.createElement('link');
      link.setAttribute('rel', 'canonical');
      this.document.head.appendChild(link);
    }
    link.setAttribute('href', url);
  }
}
