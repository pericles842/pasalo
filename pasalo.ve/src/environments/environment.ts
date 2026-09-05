export const environment = {
  production: false,
  qa: false,
  host: 'http://localhost:3000/api',
  socketHost: 'http://localhost:3000',
  googleClientId: '928643772215-9uhat1kqvibt48mt52uktbsfui6123vc.apps.googleusercontent.com',
  // Clave publica VAPID: debe coincidir con VAPID_PUBLIC_KEY del backend
  // apuntado por `host` (generada con `npx web-push generate-vapid-keys`).
  vapidPublicKey: 'BNILcgqQJy2CPR8Q2YomKJq-iUzZq5GpBLotAcHbl7ZU7yRhPkSjCZXj7HPYU5KTnEdCjYdjEXeTUjR9PemZbys',
  // Tiles de CARTO Voyager (basados en datos de OpenStreetMap): estilo claro
  // y con pocos colores, similar a Google Maps. No se usan tiles de Google
  // directo (google.com/vt/...) porque esa URL no es una API publica: es de
  // uso interno de Google Maps y usarla sin pasar por su API oficial viola
  // sus Terminos de Servicio. Uso publico no pensado para trafico alto de
  // produccion; si el volumen crece, cambiar por un proveedor con mas
  // capacidad (ej. MapTiler/Stadia) es solo cambiar esta URL, sin tocar
  // codigo.
  mapTileUrl: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
  mapAttribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
};
