// src/rabbitmq.js
const amqp = require('amqplib');

let channel = null;

async function connectRabbitMQ() {
    try {
        const connection = await amqp.connect(process.env.RABBITMQ_URL);
        channel = await connection.createChannel();
        console.log('✅ RabbitMQ bağlantısı başarılı (auth-service)');
    } catch (err) {
        console.error('❌ RabbitMQ bağlantı hatası:', err.message);
    }
}

/**
 * Bir event'i RabbitMQ'ya "exchange" üzerinden yayınlar.
 * Exchange tipi 'fanout' -> bu event'i dinleyen TÜM servislere kopyalanarak gider.
 */
async function publishEvent(eventName, data) {
    if (!channel) {
        console.warn('⚠️ RabbitMQ kanalı yok, event gönderilemedi:', eventName);
        return;
    }

    const exchangeName = 'app_events';
    await channel.assertExchange(exchangeName, 'fanout', { durable: true });

    const message = JSON.stringify({ eventName, data, timestamp: Date.now() });
    channel.publish(exchangeName, '', Buffer.from(message));

    console.log(`📤 Event gönderildi: ${eventName}`);
}

module.exports = { connectRabbitMQ, publishEvent };