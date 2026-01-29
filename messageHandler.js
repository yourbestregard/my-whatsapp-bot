const { bitch } = require('btch-downloader');

// Memory Giveaway
let giveawayData = { isActive: false, participants: [], mode: null };

module.exports = async (sock, msg) => {
    try {
        // Normalisasi Pesan (Agar mudah dibaca)
        const content = JSON.stringify(msg.message);
        const from = msg.key.remoteJid;
        const type = Object.keys(msg.message)[0];
        const body = (type === 'conversation') ? msg.message.conversation :
                     (type === 'imageMessage') ? msg.message.imageMessage.caption :
                     (type === 'videoMessage') ? msg.message.videoMessage.caption :
                     (type === 'extendedTextMessage') ? msg.message.extendedTextMessage.text : '';
        
        const isGroup = from.endsWith('@g.us');
        const sender = isGroup ? msg.key.participant : from;
        const args = body.trim().split(/ +/);
        const command = args.shift().toLowerCase();

        // Self-ignore
        if (msg.key.fromMe) return;

        // --- FITUR 1: STIKER (!sticker) ---
        // (Baileys butuh library tambahan untuk stiker yg kompleks, 
        // tapi ini logika dasarnya. Untuk pemula saya sarankan skip dulu atau pakai library 'wa-sticker-formatter')
        
        // --- FITUR 2: DOWNLOADER (!tiktok) ---
        if (['!tiktok', '!ig'].includes(command)) {
            const url = args[0];
            if (!url) return sock.sendMessage(from, { text: 'Mana link-nya?' }, { quoted: msg });
            
            await sock.sendMessage(from, { text: '⏳ Sedang memproses...' }, { quoted: msg });
            
            try {
                const data = await bitch(url);
                if (data && data.url) {
                    // Kirim Video
                    await sock.sendMessage(from, { 
                        video: { url: data.url[0] }, 
                        caption: 'Selesai!' 
                    }, { quoted: msg });
                }
            } catch (e) {
                console.error(e);
                await sock.sendMessage(from, { text: 'Gagal download.' }, { quoted: msg });
            }
        }

        // --- FITUR 3: PING (Test) ---
        if (command === '!ping') {
            await sock.sendMessage(from, { text: 'Pong! 🚀' }, { quoted: msg });
        }

    } catch (error) {
        console.log("Error handler:", error);
    }
};