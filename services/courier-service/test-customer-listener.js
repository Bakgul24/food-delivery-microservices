const WebSocket = require('ws');

const ORDER_ID = '6a42378af252095297239734'; // daha önce READY yaptığın sipariş ID'si

const ws = new WebSocket('ws://localhost:4005');

ws.on('open', () => {
    console.log('✅ Bağlandı, sipariş dinleniyor:', ORDER_ID);
    ws.send(JSON.stringify({ role: 'customer', orderId: ORDER_ID }));
});

ws.on('message', (data) => {
    console.log('📍 Konum güncellemesi geldi:', JSON.parse(data));
});

ws.on('error', (err) => console.error('❌ Hata:', err.message));