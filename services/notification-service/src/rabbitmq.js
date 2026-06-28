// src/rabbitmq.js
const amqp = require('amqplib');

const EXCHANGE_NAME = 'app_events';

/**
 * RabbitMQ'ya bağlanır, app_events exchange'ine bağlı KENDİ kuyruğunu oluşturur,
 * ve gelen her mesajda verilen callback'i çalıştırır.
 * @param {function} onEvent - (eventName, data) => void
 */
async function consumeEvents(onEvent) {
    try {
        const connection = await amqp.connect(process.env.RABBITMQ_URL);
        const channel = await connection.createChannel();

        await channel.assertExchange(EXCHANGE_NAME, 'fanout', { durable: true });

        // '' (boş isim) verince RabbitMQ otomatik, rastgele isimli bir kuyruk oluşturur.
        // exclusive: true -> bu kuyruk sadece bu bağlantıya ait, bağlantı kopunca silinir.
        // Bu, "bu servisin kendi özel dinleme noktası" anlamına geliyor.
        const q = await channel.assertQueue('', { exclusive: true });

        // Bu kuyruğu, fanout exchange'e bağla (bind) - artık exchange'e gelen HER mesaj bu kuyruğa da kopyalanır
        await channel.bindQueue(q.queue, EXCHANGE_NAME, '');

        console.log('✅ RabbitMQ dinleniyor (notification-service)');

        channel.consume(q.queue, (msg) => {
            if (msg) {
                const { eventName, data } = JSON.parse(msg.content.toString());
                console.log(`📥 Event alındı: ${eventName}`);
                onEvent(eventName, data);
                channel.ack(msg); // mesajı "işlendi" olarak işaretle
            }
        });
    } catch (err) {
        console.error('❌ RabbitMQ bağlantı hatası:', err.message);
    }
}

module.exports = { consumeEvents };