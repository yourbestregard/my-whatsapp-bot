require('dotenv').config();
const { Client, LocalAuth } = require('whatsapp-web.js');
const msgHandler = require('./messageHandler');

const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: { 
        args: ['--no-sandbox'],
    }
});

console.log('Menyalakan bot...');

// Event saat Bot meminta Pairing Code (bukan QR)
client.on('qr', async (qr) => {
    // Kita override event QR agar tidak generate QR, tapi minta Pairing Code
    // Cek apakah nomor sudah diset di .env
    const phoneNumber = process.env.BOT_NUMBER;
    
    if (!phoneNumber) {
        console.error('ERROR: Nomor HP belum diisi di file .env!');
        process.exit(1);
    }

    console.log(`Meminta Pairing Code untuk nomor: ${phoneNumber}...`);
    
    try {
        // Request code
        let code = await client.requestPairingCode(phoneNumber);
        console.log(`\n================================`);
        console.log(`CODE LOGIN ANDA: ${code}`);
        console.log(`================================\n`);
        console.log(`Silakan buka WhatsApp di HP > Perangkat Tertaut > Tautkan dengan No. HP`);
    } catch (err) {
        console.error('Gagal meminta pairing code:', err);
    }
});

client.on('ready', () => {
    console.log('✅ Bot berhasil login dan siap digunakan!');
});

client.on('authenticated', () => {
    console.log('✅ Autentikasi berhasil.');
});

// Mengarahkan pesan masuk ke file messageHandler.js
client.on('message', msgHandler);

client.initialize();