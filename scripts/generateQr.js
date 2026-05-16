import QRCode from 'qrcode';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const targetDomain = process.env.FRONTEND_URL || 'https://domain.com';
const verifyUrl = `${targetDomain}/verify`;

const publicDir = path.join(__dirname, '../../EarthAssociation/public');

// Ensure public directory exists
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

const qrPath = path.join(publicDir, 'ngo-verification-qr.png');

QRCode.toFile(
  qrPath,
  verifyUrl,
  {
    width: 1000, // High resolution
    margin: 2,
    color: {
      dark: '#000000',
      light: '#ffffff'
    }
  },
  (err) => {
    if (err) throw err;
    console.log(`✅ Permanent QR Code successfully generated at: ${qrPath}`);
    console.log(`URL encoded: ${verifyUrl}`);
  }
);
