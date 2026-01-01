const CACHE_NAME = 'condofacil-v1';
const STATIC_CACHE = 'condofacil-static-v1';

const STATIC_ASSETS = [
    '/',
    '/dashboard',
    '/manifest.json',
    '/icons/icon-192x192.png',
    '/icons/icon-512x512.png',
];

// Install event
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(STATIC_CACHE).then((cache) => {
            return cache.addAll(STATIC_ASSETS);
        })
    );
    self.skipWaiting();
});

// Activate event
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames
                    .filter((name) => name !== CACHE_NAME && name !== STATIC_CACHE)
                    .map((name) => caches.delete(name))
            );
        })
    );
    self.clients.claim();
});

// Fetch event - Network first, fallback to cache
self.addEventListener('fetch', (event) => {
    // Skip non-GET requests
    if (event.request.method !== 'GET') return;

    // Skip API calls
    if (event.request.url.includes('/api/')) return;

    event.respondWith(
        fetch(event.request)
            .then((response) => {
                // Clone the response
                const responseClone = response.clone();

                // Cache successful responses - only for http/https to avoid chrome-extension errors
                if (response.status === 200) {
                    const protocol = new URL(event.request.url).protocol;
                    if (protocol.startsWith('http')) {
                        caches.open(CACHE_NAME).then((cache) => {
                            cache.put(event.request, responseClone);
                        });
                    }
                }

                return response;
            })
            .catch(() => {
                // Fallback to cache
                return caches.match(event.request).then((response) => {
                    if (response) return response;

                    // Return offline page for navigation requests
                    if (event.request.mode === 'navigate') {
                        return caches.match('/');
                    }

                    return new Response('Offline', { status: 503 });
                });
            })
    );
});

// Push notification event
self.addEventListener('push', (event) => {
    const data = event.data?.json() || {};

    const options = {
        body: data.body || 'Nova notificação do Condomínio Fácil',
        icon: '/icons/icon-192x192.png',
        badge: '/icons/icon-72x72.png',
        vibrate: [100, 50, 100],
        data: {
            url: data.url || '/dashboard',
        },
        actions: [
            { action: 'open', title: 'Abrir' },
            { action: 'close', title: 'Fechar' },
        ],
    };

    event.waitUntil(
        self.registration.showNotification(data.title || 'Condomínio Fácil', options)
    );
});

// Notification click event
self.addEventListener('notificationclick', (event) => {
    event.notification.close();

    if (event.action === 'open' || !event.action) {
        const url = event.notification.data?.url || '/dashboard';
        event.waitUntil(
            clients.openWindow(url)
        );
    }
});
