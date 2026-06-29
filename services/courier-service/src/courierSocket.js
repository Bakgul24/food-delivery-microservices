// src/courierSocket.js
//
// İki tür client bağlanabilir:
// 1) KURYE -> konum gönderir: { role: 'courier', courierId, lat, lng }
// 2) MÜŞTERİ -> belirli bir siparişin kuryesini dinler: { role: 'customer', orderId }
//
// Bir kurye konum gönderdiğinde, o kuryeyle eşleşen siparişi dinleyen
// müşterilere SADECE onlara iletiyoruz (herkese değil, hedefli yayın).

const WebSocket = require('ws');
const Courier = require('./models/Courier');

function setupCourierSocket(httpServer) {
    const wss = new WebSocket.Server({ server: httpServer });

    // orderId -> bu siparişi dinleyen müşteri WebSocket bağlantılarının listesi
    const customerSubscriptions = new Map();

    wss.on('connection', (ws) => {
        ws.on('message', async (raw) => {
            let msg;
            try {
                msg = JSON.parse(raw);
            } catch {
                return ws.send(JSON.stringify({ error: 'Geçersiz JSON' }));
            }

            // ---- MÜŞTERİ: bir siparişi dinlemek istiyor ----
            if (msg.role === 'customer' && msg.orderId) {
                ws.subscribedOrderId = msg.orderId; // bu bağlantıya etiket koyuyoruz

                if (!customerSubscriptions.has(msg.orderId)) {
                    customerSubscriptions.set(msg.orderId, new Set());
                }
                customerSubscriptions.get(msg.orderId).add(ws);

                console.log(`👀 Müşteri, sipariş ${msg.orderId} için konum dinlemeye başladı`);
                ws.send(JSON.stringify({ message: `Sipariş ${msg.orderId} dinleniyor` }));
                return;
            }

            // ---- KURYE: konum güncelliyor ----
            if (msg.role === 'courier' && msg.courierId && msg.lat !== undefined && msg.lng !== undefined) {
                // Veritabanında konumu güncelle (kalıcı kayıt için)
                const courier = await Courier.findByIdAndUpdate(
                    msg.courierId,
                    { currentLocation: { lat: msg.lat, lng: msg.lng } },
                    { new: true }
                );

                if (!courier) {
                    return ws.send(JSON.stringify({ error: 'Kurye bulunamadı' }));
                }

                console.log(`📍 Kurye ${msg.courierId} konum güncelledi: ${msg.lat}, ${msg.lng}`);

                // Bu kuryenin taşıdığı siparişi dinleyen müşteriler varsa, onlara ilet
                if (courier.currentOrderId) {
                    const subscribers = customerSubscriptions.get(courier.currentOrderId);
                    if (subscribers) {
                        const locationUpdate = JSON.stringify({
                            type: 'courier_location',
                            orderId: courier.currentOrderId,
                            lat: msg.lat,
                            lng: msg.lng,
                            timestamp: Date.now(),
                        });

                        for (const subscriberWs of subscribers) {
                            if (subscriberWs.readyState === WebSocket.OPEN) {
                                subscriberWs.send(locationUpdate);
                            }
                        }
                    }
                }
                return;
            }

            ws.send(JSON.stringify({ error: 'Tanınmayan mesaj formatı' }));
        });

        ws.on('close', () => {
            // Bağlantı kapanınca, eğer bir müşteri aboneliği varsa temizle (memory leak önle)
            if (ws.subscribedOrderId) {
                const subscribers = customerSubscriptions.get(ws.subscribedOrderId);
                if (subscribers) {
                    subscribers.delete(ws);
                    if (subscribers.size === 0) {
                        customerSubscriptions.delete(ws.subscribedOrderId);
                    }
                }
            }
        });
    });

    return wss;
}

module.exports = { setupCourierSocket };