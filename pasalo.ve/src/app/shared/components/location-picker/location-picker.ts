import { isPlatformBrowser } from '@angular/common';
import {
  AfterViewInit,
  Component,
  ElementRef,
  EventEmitter,
  Injector,
  Input,
  OnDestroy,
  Output,
  PLATFORM_ID,
  ViewChild,
  afterNextRender,
  inject,
  signal,
} from '@angular/core';
import { NbButtonModule, NbFormFieldModule, NbIconModule, NbInputModule } from '@nebular/theme';
import { NbEvaIconsModule } from '@nebular/eva-icons';
import { ToastService } from '@shared/services/toast.service';
import { environment } from 'src/environments/environment';

/** Centro por defecto cuando el navegador todavia no dio ninguna posicion: Caracas */
const DEFAULT_CENTER: [number, number] = [10.4806, -66.9036];
const DEFAULT_ZOOM = 13;
const PIN_ZOOM = 16;

/**
 * Los iconos default de Leaflet traen rutas relativas que se rompen con el
 * bundler de Angular; se apuntan una sola vez a los que se copiaron a
 * public/leaflet/. mergeOptions es idempotente, pero el flag evita
 * reescribirlo cada vez que se crea un mapa nuevo en la misma pagina.
 */
let icons_configured = false;

/** Resultado crudo de Nominatim /search, solo los campos que se usan */
interface NominatimSuggestion {
  display_name: string;
  lat: string;
  lon: string;
}

/**
 * Selector de ubicacion de entrega con Leaflet + OpenStreetMap (sin Google).
 * Dos modos:
 *  - Edicion (viewOnly=false, paso 1 del pago publico): buscador de
 *    direcciones estilo Google Maps (Nominatim /search con sugerencias) mas
 *    dos botones, "Usar mi ubicacion actual" (geolocalizacion del navegador)
 *    y "Elegir en el mapa" (clic o arrastre del pin). El mapa no se carga
 *    hasta que el comprador elige una sugerencia o presiona alguno de los
 *    botones, para no sumar peso de entrada al flujo de pago.
 *  - Solo lectura (viewOnly=true, detalle de la orden del vendedor): mapa
 *    chico con el pin ya puesto, sin controles de edicion.
 *
 * Leaflet toca `window`/`document` y no tiene modo SSR-safe, asi que sigue el
 * mismo patron de guard que el resto del repo (is_browser + inicializacion
 * diferida a despues del render, ver public-payment.ts/order-detail.ts) y
 * carga la libreria con import() dinamico para que nunca se evalue en el
 * bundle de servidor.
 */
@Component({
  selector: 'app-location-picker',
  imports: [NbButtonModule, NbIconModule, NbEvaIconsModule, NbFormFieldModule, NbInputModule],
  templateUrl: './location-picker.html',
})
export class LocationPicker implements AfterViewInit, OnDestroy {

  @Input() lat: number | null = null;
  @Input() lng: number | null = null;
  @Input() viewOnly = false;
  @Output() locationChange = new EventEmitter<{ lat: number; lng: number }>();
  /** Nombre de la zona resuelto por geocoding inverso (ver reverseGeocode) */
  @Output() addressResolved = new EventEmitter<string>();

  @ViewChild('mapContainer') private mapContainerRef?: ElementRef<HTMLDivElement>;

  private is_browser = isPlatformBrowser(inject(PLATFORM_ID));
  private injector = inject(Injector);
  private toast = inject(ToastService);

  private map: import('leaflet').Map | null = null;
  private marker: import('leaflet').Marker | null = null;
  private leaflet?: typeof import('leaflet');

  map_visible = signal(false);
  is_locating = signal(false);
  has_location = signal(false);

  /** Buscador de direcciones (estilo Google Maps) via Nominatim /search */
  search_query = signal('');
  suggestions = signal<NominatimSuggestion[]>([]);
  show_suggestions = signal(false);
  is_searching = signal(false);
  private search_debounce?: ReturnType<typeof setTimeout>;

  ngAfterViewInit(): void {
    if (!this.is_browser) return;

    this.has_location.set(this.lat != null && this.lng != null);

    if (this.viewOnly && this.lat != null && this.lng != null) {
      this.map_visible.set(true);
      this.scheduleInit();
    }
  }

  ngOnDestroy(): void {
    this.map?.remove();
    if (this.search_debounce) clearTimeout(this.search_debounce);
  }

  useCurrentLocation(): void {
    if (!this.is_browser || !navigator.geolocation) {
      this.toast.error('Tu navegador no soporta geolocalización.');
      return;
    }

    this.is_locating.set(true);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        this.is_locating.set(false);
        this.setLocation(position.coords.latitude, position.coords.longitude);
      },
      () => {
        this.is_locating.set(false);
        this.toast.error('No pudimos obtener tu ubicación. Prueba eligiendo el punto en el mapa.');
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  showMap(): void {
    this.map_visible.set(true);
    this.scheduleInit();
  }

  private scheduleInit(): void {
    afterNextRender(() => this.initMap(), { injector: this.injector });
  }

  private async initMap(): Promise<void> {
    if (!this.mapContainerRef) return;

    if (this.map) {
      this.map.invalidateSize();
      return;
    }

    // Leaflet es un modulo UMD (sin build ESM propio): bajo el bundle de
    // produccion de Angular (esbuild), la interop CJS->ESM de un import()
    // dinamico a veces solo expone `.default` en vez de las propiedades con
    // nombre (Icon, map, tileLayer...) directamente sobre el namespace. Se
    // normaliza aqui para que funcione con las dos formas.
    const imported = await import('leaflet');
    const L = ('Icon' in imported ? imported : (imported as unknown as { default: typeof imported }).default);
    this.leaflet = L;

    if (!icons_configured) {
      // Bug conocido de Leaflet con bundlers (Webpack/esbuild/Vite): el
      // metodo interno _getIconUrl del icono default arrastra las rutas que
      // Leaflet calculo para SU PROPIO build, no las nuestras, y gana por
      // encima de las urls de mergeOptions de abajo -> el marcador se crea
      // pero con una imagen rota, invisible. Hay que borrarlo para que use
      // directo las urls que le pasamos.
      delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: unknown })._getIconUrl;

      L.Icon.Default.mergeOptions({
        iconUrl: '/leaflet/marker-icon.png',
        iconRetinaUrl: '/leaflet/marker-icon-2x.png',
        shadowUrl: '/leaflet/marker-shadow.png',
      });
      icons_configured = true;
    }

    const center: [number, number] = this.lat != null && this.lng != null ? [this.lat, this.lng] : DEFAULT_CENTER;

    this.map = L.map(this.mapContainerRef.nativeElement, {
      center,
      zoom: this.lat != null ? PIN_ZOOM : DEFAULT_ZOOM,
      dragging: !this.viewOnly,
      scrollWheelZoom: !this.viewOnly,
      zoomControl: !this.viewOnly,
      touchZoom: !this.viewOnly,
      doubleClickZoom: !this.viewOnly,
      boxZoom: !this.viewOnly,
    });

    L.tileLayer(environment.mapTileUrl, { attribution: environment.mapAttribution, maxZoom: 19 }).addTo(this.map);

    if (this.lat != null && this.lng != null) {
      this.placeMarker(this.lat, this.lng);
    }

    if (!this.viewOnly) {
      this.map.on('click', (e: import('leaflet').LeafletMouseEvent) => {
        this.setLocation(e.latlng.lat, e.latlng.lng);
      });
    }
  }

  /** Punto elegido a mano/GPS/arrastre: no hay texto de direccion todavia, se resuelve por geocoding inverso */
  private setLocation(lat: number, lng: number): void {
    this.applyLocation(lat, lng);
    this.reverseGeocode(lat, lng);
  }

  /** Nucleo comun para marcar un punto en el mapa, venga de donde venga (click, drag, GPS o buscador) */
  private applyLocation(lat: number, lng: number): void {
    this.lat = lat;
    this.lng = lng;
    this.has_location.set(true);
    this.locationChange.emit({ lat, lng });

    if (!this.map_visible()) this.map_visible.set(true);

    if (this.map) {
      this.map.setView([lat, lng], PIN_ZOOM);
      this.placeMarker(lat, lng);
    } else {
      this.scheduleInit();
    }
  }

  /** Texto tecleado en el buscador; dispara la busqueda con debounce a partir de 3 caracteres */
  onSearchInput(value: string): void {
    this.search_query.set(value);
    this.show_suggestions.set(true);

    if (this.search_debounce) clearTimeout(this.search_debounce);

    const query = value.trim();
    if (query.length < 3) {
      this.suggestions.set([]);
      return;
    }

    this.search_debounce = setTimeout(() => this.searchAddress(query), 400);
  }

  /** Cierra la lista de sugerencias al salir del input, con margen para que el click en una opcion registre antes */
  onSearchBlur(): void {
    setTimeout(() => this.show_suggestions.set(false), 150);
  }

  /** Autocompletado de direcciones (estilo Google Maps) via Nominatim /search, acotado a Venezuela */
  private async searchAddress(query: string): Promise<void> {
    if (!this.is_browser) return;

    this.is_searching.set(true);

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=jsonv2&q=${encodeURIComponent(query)}&limit=5&countrycodes=ve`,
        { headers: { 'Accept-Language': 'es' } }
      );
      this.suggestions.set(response.ok ? await response.json() : []);
    } catch {
      this.suggestions.set([]);
    } finally {
      this.is_searching.set(false);
    }
  }

  /**
   * El comprador eligio una sugerencia de la lista: ya trae su propio texto,
   * asi que se emite directo (evita el viaje redundante a /reverse). Igual
   * puede seguir refinando el punto arrastrando el pin o buscando de nuevo.
   */
  selectSuggestion(item: NominatimSuggestion): void {
    this.search_query.set(item.display_name);
    this.suggestions.set([]);
    this.show_suggestions.set(false);

    this.addressResolved.emit(item.display_name);
    this.applyLocation(parseFloat(item.lat), parseFloat(item.lon));
  }

  /**
   * Convierte lat/lng en el nombre de la zona usando Nominatim (el geocoder
   * abierto de OpenStreetMap, sin API key). Se dispara tanto al usar la
   * ubicacion precisa como al elegir/arrastrar el pin en el mapa: las tres
   * formas de marcar un punto pasan por setLocation().
   *
   * Nominatim tiene politica de uso liviana (~1 req/seg, uso personal/bajo
   * volumen): si el trafico crece, cambiar de proveedor es solo cambiar esta
   * URL, igual que con los tiles (ver environment.mapTileUrl).
   */
  private async reverseGeocode(lat: number, lng: number): Promise<void> {
    if (!this.is_browser) return;

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&zoom=16&addressdetails=1`,
        { headers: { 'Accept-Language': 'es' } }
      );
      if (!response.ok) return;

      const data = await response.json();
      const zone = this.extractZoneName(data);
      if (zone) {
        this.addressResolved.emit(zone);
        this.search_query.set(zone);
      }
    } catch {
      // Sin internet o Nominatim caido: el comprador sigue pudiendo escribir
      // la direccion a mano, no vale la pena avisarle con un toast por esto.
    }
  }

  /** Arma "Sector, Ciudad" a partir del desglose de Nominatim; si no hay desglose usable, cae al nombre completo */
  private extractZoneName(data: {
    display_name?: string;
    address?: Record<string, string>;
  }): string | null {
    const address = data.address;
    if (!address) return data.display_name ?? null;

    const zone = address['suburb'] ?? address['neighbourhood'] ?? address['quarter']
      ?? address['city_district'] ?? address['town'] ?? address['village'];
    const city = address['city'] ?? address['municipality'] ?? address['county'];

    const parts = [zone, city].filter((part): part is string => !!part);
    return parts.length > 0 ? parts.join(', ') : (data.display_name ?? null);
  }

  private placeMarker(lat: number, lng: number): void {
    if (!this.map || !this.leaflet) return;

    if (this.marker) {
      this.marker.setLatLng([lat, lng]);
      return;
    }

    this.marker = this.leaflet.marker([lat, lng], { draggable: !this.viewOnly }).addTo(this.map);

    if (!this.viewOnly) {
      this.marker.on('dragend', () => {
        const pos = this.marker!.getLatLng();
        this.setLocation(pos.lat, pos.lng);
      });
    }
  }
}
