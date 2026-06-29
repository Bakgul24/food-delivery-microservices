const WebSocket = require('ws');

const COURIER_ID = '6a4237092ae496e21b9c1f76'; // Adım 1'den aldığın ID

const ws = new WebSocket('ws://localhost:4005');

let lat = 41.015137;
let lng = 28.97953;

ws.on('open', () => {
    console.log('✅ Bağlandı, konum gönderiliyor (kurye rolünde)');

    setInterval(() => {
        lat += (Math.random() - 0.5) * 0.001;
        lng += (Math.random() - 0.5) * 0.001;

        ws.send(JSON.stringify({ role: 'courier', courierId: COURIER_ID, lat, lng }));
        console.log(`📤 Konum gönderildi: ${lat.toFixed(6)}, ${lng.toFixed(6)}`);
    }, 3000);
});

ws.on('message', (data) => console.log('Sunucudan cevap:', data.toString()));
ws.on('error', (err) => console.error('❌ Hata:', err.message));