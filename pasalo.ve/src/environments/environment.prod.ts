  export const environment = {
    production: true,
    qa: false,
    host: 'https://api.pasalo.co.ve/api',
    socketHost: 'https://api.pasalo.co.ve',
    googleClientId: '928643772215-9uhat1kqvibt48mt52uktbsfui6123vc.apps.googleusercontent.com',
    // Debe ser la MISMA llave publica que tenga VAPID_PUBLIC_KEY en el .env
    // del servidor de api.pasalo.co.ve (y ese .env necesita ademas la privada).
    // Si las llaves no coinciden, el navegador rechaza la suscripcion.
    vapidPublicKey: 'BNILcgqQJy2CPR8Q2YomKJq-iUzZq5GpBLotAcHbl7ZU7yRhPkSjCZXj7HPYU5KTnEdCjYdjEXeTUjR9PemZbys',
    mapTileUrl: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
    mapAttribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
  };
