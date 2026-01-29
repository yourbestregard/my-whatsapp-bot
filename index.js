require('dotenv').config();
const { makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys');
const pino = require('pino');
const msgHandler = require('./messageHandler'); // Kita pakai handler yang terpisah

async function connectToWhatsApp() {
    const { state, saveCreds } = await useMultiFileAuthState('auth_info_baileys');

    const sock = makeWASocket({
        auth: state,
        printQRInTerminal: true, // Ubah false jika ingin full pairing code
        logger: pino({ level: 'silent' }), // Supaya log bersih
        browser: ['Ubuntu', 'Chrome', '20.0.04'] // Browser samaran
    });

    // --- LOGIKA PAIRING CODE ---
    if (!sock.authState.creds.registered) {
        const phoneNumber = process.env.BOT_NUMBER; // Pastikan format 628xxx
        if (!phoneNumber) {
            console.log('❌ Nomor HP belum diset di .env!');
            process.exit(1);
        }
        
        setTimeout(async () => {
            try {
                let code = await sock.requestPairingCode(phoneNumber);
                code = code?.match(/.{1,4}/g)?.join("-") || code;
                console.log(`\n=============================`);
                console.log(`CODE LOGIN ANDA: ${code}`);
                console.log(`=============================\n`);
            } catch (err) {
                console.log('Gagal request code:', err);
            }
        }, 3000);
    }

    // --- HANDLER KONEKSI ---
    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect } = update;
        if (connection === 'close') {
            const shouldReconnect = lastDisconnect.error?.output?.statusCode !== DisconnectReason.loggedOut;
            console.log('Koneksi terputus, mencoba reconnect...', shouldReconnect);
            if (shouldReconnect) connectToWhatsApp();
        } else if (connection === 'open') {
            console.log('✅ Bot Berhasil Terhubung!');
        }
    });

    sock.ev.on('creds.update', saveCreds);

    // --- HANDLER PESAN ---
    sock.ev.on('messages.upsert', async ({ messages, type }) => {
        if (type !== 'notify') return;
        const msg = messages[0];
        if (!msg.message) return;
        
        // Panggil logic fitur (kita sesuaikan sedikit formatnya)
        await msgHandler(sock, msg);
    });
}

connectToWhatsApp();