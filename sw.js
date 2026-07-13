// Bu uygulama zaten canlı internet bağlantısı (Firebase) gerektiriyor, bu yüzden
// çevrimdışı önbellekleme faydadan çok zarar getiriyordu (eski dosyaları gösterip
// kafa karıştırıyordu). Bu service worker HİÇBİR ŞEYİ önbelleğe almaz; sayfayı
// her zaman doğrudan ağdan (network) getirir.
//
// ÖNEMLİ: Artık kendini SİLMİYOR (eskiden öyleydi). Çünkü bildirimleri Android
// Chrome'da göstermek için (new Notification() artık desteklenmiyor; sadece
// ServiceWorkerRegistration.showNotification() çalışıyor) bu service worker'ın
// SÜREKLİ KAYITLI ve AKTİF kalması gerekiyor.
self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.map((key) => caches.delete(key)));
      await self.clients.claim();
    })()
  );
});

// Önbellek YOK: her isteği doğrudan ağdan getir, böylece güncellemeler her zaman anında yansır.
self.addEventListener('fetch', (event) => {
  event.respondWith(fetch(event.request));
});

// Bildirime dokununca: açık bir sekme varsa ona odaklan ve hangi sohbetin
// açılması gerektiğini sayfaya ilet (sayfa 'message' olayını dinliyor).
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const groupId = event.notification.data && event.notification.data.groupId;
  event.waitUntil(
    (async () => {
      const allClients = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
      if (allClients.length > 0) {
        const client = allClients[0];
        client.postMessage({ type: 'open-chat', groupId });
        if ('focus' in client) client.focus();
      } else if (self.clients.openWindow) {
        self.clients.openWindow('./');
      }
    })()
  );
});
