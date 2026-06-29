// src/rabbitmq.js
const amqp = require('amqplib');
const Courier = require('./models/Courier');

const EXCHANGE_NAME = 'app_events';
let channel = null;

async function connectRabbitMQ() {
    const connection = await amqp.connect(process.env.RABBITMQ_URL);
    channel = await connection.createChannel();
    await channel.assertExchange(EXCHANGE_NAME, 'fanout', { durable: true });
    console.log('✅ RabbitMQ bağlantısı başarılı (courier-service)');
}

async function publishEvent(eventName, data) {
    if (!channel) return;
    const message = JSON.stringify({ eventName, data, timestamp: Date.now() });
    channel.publish(EXCHANGE_NAME, '', Buffer.from(message));
    console.log(`📤 Event gönderildi: ${eventName}`);
}

/**
 * order.status_changed event'ini dinler, status "READY" ise otomatik kurye atar.
 */
async function consumeOrderEvents() {
    const connection = await amqp.connect(process.env.RABBITMQ_URL);
    const consumeChannel = await connection.createChannel();
    await consumeChannel.assertExchange(EXCHANGE_NAME, 'fanout', { durable: true });

    const q = await consumeChannel.assertQueue('', { exclusive: true });
    await consumeChannel.bindQueue(q.queue, EXCHANGE_NAME, '');

    console.log('✅ RabbitMQ dinleniyor (courier-service)');

    consumeChannel.consume(q.queue, async (msg) => {
        if (!msg) return;

        const { eventName, data } = JSON.parse(msg.content.toString());

        if (eventName === 'order.status_changed' && data.status === 'READY') {
            console.log(`📥 Sipariş hazır, kurye atanıyor: ${data.orderId}`);
            await assignCourierToOrder(data.orderId);
        }

        consumeChannel.ack(msg);
    });
}

async function assignCourierToOrder(orderId) {
    // Boşta olan ilk kuryeyi bul
    const courier = await Courier.findOne({ isAvailable: true });

    if (!courier) {
        console.warn('⚠️ Boşta kurye yok, sipariş atanamadı:', orderId);
        return;
    }

    courier.isAvailable = false;
    courier.currentOrderId = orderId;
    await courier.save();

    console.log(`🛵 Kurye atandı: ${courier.name} -> sipariş ${orderId}`);

    await publishEvent('courier.assigned', {
        orderId,
        courierId: courier._id,
        courierName: courier.name,
    });
}

module.exports = { connectRabbitMQ, publishEvent, consumeOrderEvents };