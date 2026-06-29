// src/rabbitmq.js
const amqp = require('amqplib');

let channel = null;
const EXCHANGE_NAME = 'app_events';

async function connectRabbitMQ() {
    try {
        const connection = await amqp.connect(process.env.RABBITMQ_URL);
        channel = await connection.createChannel();
        await channel.assertExchange(EXCHANGE_NAME, 'fanout', { durable: true });
        console.log('✅ RabbitMQ bağlantısı başarılı (order-service)');
    } catch (err) {
        console.error('❌ RabbitMQ bağlantı hatası:', err.message);
    }
}

async function publishEvent(eventName, data) {
    if (!channel) {
        console.warn('⚠️ RabbitMQ kanalı yok, event gönderilemedi:', eventName);
        return;
    }
    const message = JSON.stringify({ eventName, data, timestamp: Date.now() });
    channel.publish(EXCHANGE_NAME, '', Buffer.from(message));
    console.log(`📤 Event gönderildi: ${eventName}`);
}

module.exports = { connectRabbitMQ, publishEvent };