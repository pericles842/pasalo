  export const environment = {
    production: true,
    qa: false,
    host: 'https://api.pasalo.co.ve/api',
    socketHost: 'https://api.pasalo.co.ve',
    googleClientId: '928643772215-9uhat1kqvibt48mt52uktbsfui6123vc.apps.googleusercontent.com',
    // Debe ser la MISMA llave publica que tenga VAPID_PUBLIC_KEY en el .env
    // del servidor de api.pasalo.co.ve (y ese .env necesita ademas la privada).
    // Si las llaves no coinciden, el navegador rechaza la suscripcion.
    vapidPublicKey: 'BOoOLchoT1RVDL6hAwEj8Rv7EWtK7S65OSaiXmo-kqyGSk7uecJ3_elHPNzjADV34h14ysd2P1MswdvltA1ORLc',
    mapTileUrl: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
    mapAttribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
  };
