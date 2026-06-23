const { Client } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');

const client = new Client();

client.on('qr', qr => {
    qrcode.generate(qr, {small: true});
});

client.on('ready', () => {
    console.log('WhatsApp bot ready');
});

client.on('message', async msg => {
    if(msg.body.startsWith("ai")) {
        msg.reply("AI is thinking...");
    }
});

client.initialize();