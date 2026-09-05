export const environment = {
  production: false,
  qa: true,
  host: 'http://localhost:3000/api',
  socketHost: 'http://localhost:3000',
  googleClientId: '928643772215-9uhat1kqvibt48mt52uktbsfui6123vc.apps.googleusercontent.com',
  // Misma API que environment.ts (localhost:3000), misma clave VAPID
  vapidPublicKey: 'BOoOLchoT1RVDL6hAwEj8Rv7EWtK7S65OSaiXmo-kqyGSk7uecJ3_elHPNzjADV34h14ysd2P1MswdvltA1ORLc',
  mapTileUrl: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
  mapAttribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
};
