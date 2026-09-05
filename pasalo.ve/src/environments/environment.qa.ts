export const environment = {
  production: false,
  qa: true,
  host: 'http://localhost:3000/api',
  socketHost: 'http://localhost:3000',
  googleClientId: '928643772215-9uhat1kqvibt48mt52uktbsfui6123vc.apps.googleusercontent.com',
  // Misma API que environment.ts (localhost:3000), misma clave VAPID
  vapidPublicKey: 'BNILcgqQJy2CPR8Q2YomKJq-iUzZq5GpBLotAcHbl7ZU7yRhPkSjCZXj7HPYU5KTnEdCjYdjEXeTUjR9PemZbys',
  mapTileUrl: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
  mapAttribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
};
