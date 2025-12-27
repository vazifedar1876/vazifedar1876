const CACHE_NAME = 'nur-kasifleri-v6';
const urlsToCache = [
    '/',
    '/index.html',
    '/muzakere.html',
    '/intizam.html',
    '/vahdet.html',
    '/tefekkur.html',
    '/istikamet.html',
    '/manifest.json',
    
    // Core scripts
    '/js/core/firebase.js',
    '/js/core/auth.js',
    '/js/core/database.js',
    '/js/core/utils.js',
    
    // Components
    '/js/components/header.js',
    '/js/components/game-grid.js',
    
    // Assets
    '/assets/icon-192.png',
    '/assets/icon-512.png'
];

// Install event - BASİT VERSİYON
self.addEventListener('install', event => {
    console.log('Service Worker installing...');
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('Cache açıldı, dosyalar ekleniyor...');
                return cache.addAll(urlsToCache);
            })
            .then(() => {
                console.log('Cache tamamlandı');
                return self.skipWaiting();
            })
            .catch(error => {
                console.error('Cache ekleme hatası:', error);
            })
    );
});

// Activate event - BASİT VERSİYON
self.addEventListener('activate', event => {
    console.log('Service Worker aktifleştiriliyor...');
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('Eski cache siliniyor:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => {
            console.log('Service Worker aktif');
            return self.clients.claim();
        })
    );
});

// Fetch event - ÇOK BASİT VERSİYON
self.addEventListener('fetch', event => {
    // Analytics isteklerini ignore et
    if (event.request.url.includes('google-analytics.com') || 
        event.request.url.includes('googletagmanager.com')) {
        return; // Bu istekleri Service Worker işlemez
    }
    
    // Sadece GET istekleri için cache
    if (event.request.method !== 'GET') return;
    
    event.respondWith(
        caches.match(event.request)
            .then(response => {
                // Cache'de varsa döndür
                if (response) {
                    return response;
                }
                
                // Cache'de yoksa network'ten getir
                return fetch(event.request)
                    .then(response => {
                        // Sadece başarılı ve same-origin response'ları cache'le
                        if (!response || response.status !== 200 || 
                            response.type !== 'basic' ||
                            !event.request.url.startsWith(self.location.origin)) {
                            return response;
                        }
                        
                        // Response'u clone et çünkü bir kere kullanılabilir
                        const responseToCache = response.clone();
                        
                        caches.open(CACHE_NAME)
                            .then(cache => {
                                cache.put(event.request, responseToCache);
                            });
                        
                        return response;
                    })
                    .catch(() => {
                        // Offline durumda fallback
                        if (event.request.destination === 'document') {
                            return caches.match('/index.html');
                        }
                        // Diğer durumlarda boş response
                        return new Response('', {
                            status: 408,
                            statusText: 'Offline'
                        });
                    });
            })
    );
});

// Push notification - GÜVENLİ VERSİYON
self.addEventListener('push', event => {
    if (!event.data) return;
    
    let data;
    try {
        data = event.data.json();
    } catch (e) {
        data = {
            title: 'Nur Kaşifleri',
            body: 'Yeni bildirim!'
        };
    }
    
    const options = {
        body: data.body || 'Nur Kaşiflerinden yeni bir bildirim!',
        icon: '/assets/icon-192.png',
        badge: '/assets/icon-192.png',
        vibrate: [100, 50, 100],
        data: {
            url: data.url || '/',
            timestamp: Date.now()
        }
    };
    
    event.waitUntil(
        self.registration.showNotification(
            data.title || 'Nur Kaşifleri', 
            options
        )
    );
});

self.addEventListener('notificationclick', event => {
    event.notification.close();
    
    event.waitUntil(
        clients.openWindow(event.notification.data.url || '/')
    );
});