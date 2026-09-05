  export const environment = {
    production: true,
    qa: false,
    host: 'https://api.pasalo.co.ve/api',
    socketHost: 'https://api.pasalo.co.ve',
    googleClientId: '928643772215-9uhat1kqvibt48mt52uktbsfui6123vc.apps.googleusercontent.com',
    // IMPORTANTE: api.pasalo.co.ve es un deploy distinto al de dev/qa, asi
    // que necesita su propio par de llaves VAPID (generarlas en ese server
    // con `npx web-push generate-vapid-keys` y poner la publica aca).
    vapidPublicKey: 'REEMPLAZAR_CON_VAPID_PUBLIC_KEY_DE_PRODUCCION',
    mapTileUrl: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
    mapAttribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
  };
