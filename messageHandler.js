const { MessageMedia } = require('whatsapp-web.js');
const fs = require('fs');
const { exec } = require('child_process');
const { bitch } = require('btch-downloader'); 

// Variabel memori untuk Giveaway
let giveawayData = {
    isActive: false,
    participants: [],
    mode: null 
};

module.exports = async (msg) => {
    const chat = await msg.getChat();
    const isGroup = chat.isGroup;
    const args = msg.body.trim().split(/ +/);
    const command = args.shift().toLowerCase();
    
    // Agar bot tidak merespon dirinya sendiri
    if (msg.fromMe) return;

    try {
        // --- FITUR 1: STIKER (!sticker) ---
        if (command === '!sticker' || command === '!s') {
            if (msg.hasMedia) {
                const media = await msg.downloadMedia();
                msg.reply(media, null, { 
                    sendMediaAsSticker: true,
                    stickerAuthor: 'Bot GitHub',
                    stickerName: 'Sticker'
                });
            }
        }

        // --- FITUR 2: MEDIA DOWNLOADER (!tiktok / !ig) ---
        if (['!tiktok', '!ig'].includes(command)) {
            const url = args[0];
            if (!url) return msg.reply('Mana link-nya?');
            msg.reply('⏳ Sedang memproses...');
            
            try {
                const data = await bitch(url);
                if (data && data.url) {
                    const media = await MessageMedia.fromUrl(data.url[0], { unsafeMime: true });
                    msg.reply(media, null, { caption: 'Selesai!' });
                } else {
                    msg.reply('Gagal mengambil media.');
                }
            } catch (e) {
                console.error(e);
                msg.reply('Terjadi error saat download.');
            }
        }

        // --- FITUR 3: GIVEAWAY ---
        if (command === '!ga' && isGroup) {
            const subCmd = args[0];
            
            if (subCmd === 'start') {
                const mode = args[1];
                if (!['register', 'random'].includes(mode)) return msg.reply('Mode: register / random');
                giveawayData = { isActive: true, participants: [], mode: mode };
                msg.reply(`🎉 Giveaway mode ${mode} dimulai!`);
            }
            
            if (subCmd === 'roll' && giveawayData.isActive) {
                let pool = giveawayData.mode === 'register' ? giveawayData.participants : chat.participants.map(p => p.id._serialized);
                if (pool.length < 1) return msg.reply('Peserta kurang!');
                
                const winnerId = pool[Math.floor(Math.random() * pool.length)];
                // Mendapatkan object contact agar bisa di-mention
                const winnerContact = await msg.client.getContactById(winnerId);
                
                chat.sendMessage(`Selamat @${winnerContact.id.user} kamu menang!`, { mentions: [winnerContact] });
                giveawayData = { isActive: false, participants: [], mode: null }; // Reset
            }
        }

        if (command === '!join' && giveawayData.isActive && giveawayData.mode === 'register') {
            const userId = msg.author || msg.from;
            if (!giveawayData.participants.includes(userId)) {
                giveawayData.participants.push(userId);
                msg.reply('Terdaftar!');
            }
        }

    } catch (error) {
        console.error("Error pada handler:", error);
    }
};