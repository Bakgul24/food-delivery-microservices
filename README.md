# Mini Yemeksepeti — Event-Driven Microservices

Node.js ile yazılmış, RabbitMQ üzerinden olay tabanlı (event-driven) iletişim kuran,
her biri kendi MongoDB veritabanına sahip 6 mikroservisten oluşan bir yemek sipariş
platformu simülasyonu. Canlı kurye konum takibi ve anlık bildirimler için WebSocket
kullanılıyor.

## Mimari

```
                          ┌─────────────────┐
                          │   API Gateway    │  :4000
                          │  (reverse proxy) │
                          └────────┬─────────┘
                                   │
        ┌──────────────┬──────────┼──────────┬──────────────┐
        │              │          │          │              │
   ┌────▼────┐   ┌─────▼────┐ ┌───▼────┐ ┌────▼─────┐  ┌─────▼─────┐
   │  Auth   │   │Restaurant│ │ Order  │ │ Payment  │  │  Courier  │
   │ :4001   │   │  :4002   │ │ :4003  │ │  :4004   │  │   :4005   │
   └────┬────┘   └────┬─────┘ └───┬────┘ └────┬─────┘  └─────┬─────┘
        │             │           │           │              │
        │             │           │ (REST,    │              │
        │             │           │  senkron) │              │
        │             │           └───────────┘              │
        │             │                                       │
        └─────────────┴───────────────┬───────────────────────┘
                                       │ (event, asenkron)
                                ┌──────▼──────┐
                                │  RabbitMQ    │
                                │ (app_events) │
                                └──────┬───────┘
                                       │
                              ┌────────▼─────────┐
                              │ Notification     │  :4006
                              │ (WebSocket yayın) │
                              └──────────────────┘
```

## Servisler

| Servis | Port | Görev | Veritabanı |
|---|---|---|---|
| **api-gateway** | 4000 | Tüm servislere tek giriş noktası (reverse proxy) | — |
| **auth-service** | 4001 | Kullanıcı kayıt/giriş, JWT üretimi | `auth-db` |
| **restaurant-service** | 4002 | Restoran ve menü yönetimi | `restaurant-db` |
| **order-service** | 4003 | Sipariş oluşturma, durum yönetimi, ödeme entegrasyonu | `order-db` |
| **payment-service** | 4004 | Ödeme işleme (simüle edilmiş) | `payment-db` |
| **courier-service** | 4005 | Kurye atama, canlı konum takibi (WebSocket) | `courier-db` |
| **notification-service** | 4006 | RabbitMQ event'lerini dinleyip WebSocket ile yayınlama | — |

## Servisler Arası İletişim

İki farklı iletişim şekli **bilinçli olarak** bir arada kullanılıyor:

- **Senkron (REST):** `order-service` ↔ `payment-service` — kullanıcıya "ödeme
  onaylandı mı?" cevabını anında vermek gerektiği için.
- **Asenkron (RabbitMQ, fanout exchange):** Tüm durum değişiklikleri
  (`user.registered`, `order.created`, `order.status_changed`, `courier.assigned`)
  — anında cevap gerekmediği, "bu oldu, ilgilenen dinlesin" mantığıyla çalışan olaylar.

## WebSocket Kullanımı

İki farklı senaryoda, iki farklı yayın deseniyle:

1. **notification-service** — genel yayın (broadcast): RabbitMQ'dan gelen her event,
   bağlı **tüm** client'lara gönderilir.
2. **courier-service** — hedefli yayın: kurye konum gönderdiğinde, **sadece o
   siparişi takip eden** müşterilere iletilir (`Map<orderId, Set<WebSocket>>` ile
   abonelik takibi, bağlantı kapanınca otomatik temizlenir).

## Kurulum

### Gereksinimler
- Node.js v18+
- Docker Desktop

### 1. Altyapıyı başlat (MongoDB + RabbitMQ)
```bash
docker-compose up -d
```

### 2. Her servisin bağımlılıklarını kur
```bash
cd services/auth-service && npm install
cd services/restaurant-service && npm install
cd services/order-service && npm install
cd services/payment-service && npm install
cd services/courier-service && npm install
cd services/notification-service && npm install
cd services/api-gateway && npm install
```

### 3. Her servis için `.env` dosyası oluştur
Her servis klasöründe `.env.example` dosyasını `.env` olarak kopyala, gerekirse
değerleri güncelle.

### 4. Servisleri başlat
Her servis için ayrı bir terminalde:
```bash
npm start
```

## Test Akışı (örnek senaryo)

1. **Kayıt ol:** `POST /api/auth/register`
2. **Restoran oluştur:** `POST http://localhost:4002/restaurants`
3. **Kurye oluştur:** `POST http://localhost:4005/couriers`
4. **Sipariş ver:** `POST http://localhost:4003/orders` (otomatik olarak
   payment-service'e REST isteği gider, ödeme onaylanırsa sipariş `CONFIRMED` olur)
5. **Siparişi hazır yap:** `PATCH http://localhost:4003/orders/:id/status`
   `{ "status": "READY" }` → courier-service otomatik boşta kurye atar
6. **Canlı konum takibi:** WebSocket ile `courier-service`'e bağlanıp kurye
   konumunu anlık izle

## Bilinçli Tasarım Kararları ve Sınırlamalar

- **Her servisin kendi veritabanı vardır** — mikroservis prensiplerine uygun, ama
  bu nedenle servisler arası "join" yapılamaz, sadece ID referansı tutulur.
- **WebSocket servisleri (notification, courier) API Gateway üzerinden
  proxy'lenmiyor** — doğrudan bağlanılıyor, basitlik için kapsam dışı bırakıldı.
- **Service discovery (Consul/Eureka benzeri) kullanılmadı** — servis adresleri
  `.env` dosyalarında sabit. Bu proje ölçeğinde gerekli değil, servis sayısı/instance
  sayısı dinamik olarak ölçeklendiğinde (örn. Kubernetes) değer kazanır.
- **Komisyon/fee hesaplama, kısmi ödeme, retry mekanizmaları** eklenmedi —
  gerçek bir production sisteminde olması gerekirdi, bu proje öğrenme amaçlı
  olduğu için kapsam dışı tutuldu.

## Kullanılan Teknolojiler

Node.js, Express, MongoDB (Mongoose), RabbitMQ (amqplib), WebSocket (ws), JWT,
bcrypt, Docker, http-proxy-middleware
