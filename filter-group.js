const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');

// Function Konversi Angka ribuan atau K
function convertToNumber(text) {
    // Ambil semua angka + huruf di belakangnya
    const matches = text.match(/(\d+[\.,]?\d*)\s?(k|jt|m|rb|t)?/gi);
    if (!matches) return [];

    return matches.map(match => {
        let num = parseFloat(match.replace(",", ".")); // Ganti koma dengan titik untuk angka desimal
        if (match.toLowerCase().includes("k") || match.toLowerCase().includes("rb")) {
            num *= 1000; // 20k -> 20000, 15rb -> 15000
        } else if (match.toLowerCase().includes("jt")) {
            num *= 1000000; // 3.5jt -> 3500000
        } else if (match.toLowerCase().includes("m")) {
            num *= 1000000; // 1,2M -> 1200000
        }
        return Math.round(num); // Bulatkan angka
    });
}

// Inisialisasi client Whatsapp
const client = new Client({
    authStrategy: new LocalAuth()
});

// Menampilkan QR Code untuk login pertama kali
client.on('qr', (qr) => {
    console.log('Scan QR Code ini dengan WhatsApp:');
    qrcode.generate(qr, { small: true });
});

// Jika berhasil terhubung ke WhatsApp
client.on('ready', () => {
    console.log('✅ WhatsApp Web sudah terhubung dan siap digunakan!');
});

// ** DAFTAR KATA KUNCI YANG DICARI **
const keywords = ["harga", "stok", "total", "biaya"];

// ** RENTANG ANGKA YANG DIPERBOLEHKAN **
const minRange = 1000;
const maxRange = 30000;

// ** ID GRUP YANG DIPANTAU ** (Ubah sesuai kebutuhan)
const groupIds = [
    "120363025736308303@g.us", // Ganti dengan ID grup yang ingin dipantau
];

// ** NOMOR ADMIN YANG AKAN MENERIMA NOTIFIKASI **
const adminNumber = "6281234567890"; // Ganti dengan nomor admin

// Fungsi untuk mengirim notifikasi ke admin
function sendNotification(targetNumber, message) {
    const formattedNumber = targetNumber + "@c.us"; // Format nomor untuk WhatsApp Web API
    client.sendMessage(formattedNumber, message)
        .then(response => {
            console.log('✅ Notifikasi terkirim:', response.id.id);
        })
        .catch(error => {
            console.error('❌ Gagal mengirim notifikasi:', error);
        });
}

// ** EVENT UNTUK MENGAWASI PESAN MASUK DARI GRUP **
client.on('message', async (message) => {
    if (groupIds.includes(message.from) && message.fromMe === false) { // Hanya pesan dari anggota lain
        const sender = await message.getContact(); // Ambil info pengirim
        const senderNumber = sender.number; // Nomor pengirim
        const messageText = message.body.toLowerCase(); // Isi pesan
        console.log(`📩 Pesan dari ${senderNumber}: "${message.body}"`);

        // Cek apakah pesan mengandung kata kunci
        const foundKeyword = keywords.find(keyword => messageText.includes(keyword));

        if (foundKeyword) {
            // Ekstrak angka dari pesan
            const numbers = convertToNumber(messageText);

            // Cek apakah ada angka dalam rentang yang diizinkan
            const validNumbers = numbers.filter(num => num >= minRange && num <= maxRange);

            if (validNumbers.length > 0) {
                console.log(`🚀 Kata kunci "${foundKeyword}" dengan angka dalam rentang terdeteksi dari ${senderNumber}`);

                // Format pesan notifikasi ke admin
                const notificationMessage = 
                    `⚠️ Notifikasi dari grup!\n` +
                    `🔑 Kata kunci: "${foundKeyword}"\n` +
                    `👤 Pengirim: +${senderNumber}\n` +
                    `📩 Pesan: "${message.body}"\n` +
                    `🔢 Angka yang sesuai: ${validNumbers.join(", ")}`;

                // Kirim notifikasi ke admin
                sendNotification(adminNumber, notificationMessage);
            }
        }
    }
});

// Inisialisasi client
client.initialize();