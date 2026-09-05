// Genera los iconos de PWA a partir del isotipo cuadrado de Pasalo.
// Correr con: node scripts/generate-pwa-icons.js
const path = require('path');
const sharp = require('sharp');

const SOURCE = path.resolve(__dirname, '../public/pasalo-iso.png');
const OUT_DIR = path.resolve(__dirname, '../public/icons');
const BRAND_COLOR = '#045fde';

async function main() {
  await sharp(SOURCE)
    .resize(192, 192, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toFile(path.join(OUT_DIR, 'icon-192.png'));

  await sharp(SOURCE)
    .resize(512, 512, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toFile(path.join(OUT_DIR, 'icon-512.png'));

  // Maskable: el arte se reduce para sobrevivir el recorte de "safe zone"
  // que hacen los launchers (circulo/squircle) sobre un fondo solido.
  const maskableArt = await sharp(SOURCE)
    .resize(410, 410, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .toBuffer();

  await sharp({
    create: { width: 512, height: 512, channels: 4, background: BRAND_COLOR }
  })
    .composite([{ input: maskableArt, gravity: 'center' }])
    .png()
    .toFile(path.join(OUT_DIR, 'icon-maskable-512.png'));

  // apple-touch-icon: iOS no respeta transparencia (se ve negro), asi que
  // se compone sobre el color de marca.
  const appleArt = await sharp(SOURCE)
    .resize(160, 160, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .toBuffer();

  await sharp({
    create: { width: 180, height: 180, channels: 4, background: BRAND_COLOR }
  })
    .composite([{ input: appleArt, gravity: 'center' }])
    .flatten({ background: BRAND_COLOR })
    .png()
    .toFile(path.join(OUT_DIR, 'apple-touch-icon.png'));

  console.log('Iconos PWA generados en public/icons/');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
