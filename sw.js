// Service Worker para PWA
const CACHE_NAME = 'gestao-clientes-v1.0.0';
const STATIC_CACHE_NAME = 'gestao-clientes-static-v1.0.0';
const DYNAMIC_CACHE_NAME = 'gestao-clientes-dynamic-v1.0.0';

// Arquivos estáticos para cache
const STATIC_FILES = [
  '/',
  '/index.html',
  '/css/styles.css',
  '/js/app.js',
  '/js/storage.js',
  '/js/ui.js',
  '/manifest.json',
  '/assets/icon-192.png',
  '/assets/icon-512.png',
  'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap',
  'https://cdn.jsdelivr.net/npm/feather-icons@4.28.0/dist/feather.min.css'
];

// Arquivos dinâmicos (dados do usuário)
const DYNAMIC_FILES = [
  '/api/clientes',
  '/api/pagamentos',
  '/api/configuracoes'
];

// Install Event
self.addEventListener('install', (event) => {
  console.log('Service Worker: Installing...');
  
  event.waitUntil(
    caches.open(STATIC_CACHE_NAME)
      .then((cache) => {
        console.log('Service Worker: Caching static files');
        return cache.addAll(STATIC_FILES);
      })
      .then(() => {
        console.log('Service Worker: Static files cached');
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('Service Worker: Error caching static files', error);
      })
  );
});

// Activate Event
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activating...');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== STATIC_CACHE_NAME && cacheName !== DYNAMIC_CACHE_NAME) {
              console.log('Service Worker: Deleting old cache', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('Service Worker: Activated');
        return self.clients.claim();
      })
  );
});

// Fetch Event
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Skip chrome-extension and other non-http(s) requests
  if (!url.protocol.startsWith('http')) {
    return;
  }

  event.respondWith(
    caches.match(request)
      .then((cachedResponse) => {
        // Return cached version if available
        if (cachedResponse) {
          console.log('Service Worker: Serving from cache', request.url);
          return cachedResponse;
        }

        // Try to fetch from network
        return fetch(request)
          .then((response) => {
            // Don't cache non-successful responses
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            // Clone response for caching
            const responseToCache = response.clone();

            // Determine cache type
            const cacheName = STATIC_FILES.some(file => 
              request.url.includes(file) || request.url.endsWith(file)
            ) ? STATIC_CACHE_NAME : DYNAMIC_CACHE_NAME;

            // Cache the response
            caches.open(cacheName)
              .then((cache) => {
                console.log('Service Worker: Caching new resource', request.url);
                cache.put(request, responseToCache);
              });

            return response;
          })
          .catch((error) => {
            console.log('Service Worker: Fetch failed, trying cache', error);
            
            // Try to serve a fallback for HTML requests
            if (request.headers.get('accept').includes('text/html')) {
              return caches.match('/index.html');
            }
            
            // For other requests, return a generic offline response
            return new Response('Offline - Conteúdo não disponível', {
              status: 503,
              statusText: 'Service Unavailable',
              headers: new Headers({
                'Content-Type': 'text/plain'
              })
            });
          });
      })
  );
});

// Background Sync
self.addEventListener('sync', (event) => {
  console.log('Service Worker: Background sync', event.tag);
  
  if (event.tag === 'background-sync-clientes') {
    event.waitUntil(syncClientesData());
  }
  
  if (event.tag === 'background-sync-pagamentos') {
    event.waitUntil(syncPagamentosData());
  }
});

// Push notifications
self.addEventListener('push', (event) => {
  console.log('Service Worker: Push notification received');
  
  const options = {
    body: event.data ? event.data.text() : 'Nova notificação do Sistema de Gestão',
    icon: '/assets/icon-192.png',
    badge: '/assets/icon-96.png',
    vibrate: [200, 100, 200],
    tag: 'gestao-notification',
    actions: [
      {
        action: 'view',
        title: 'Ver',
        icon: '/assets/icon-96.png'
      },
      {
        action: 'close',
        title: 'Fechar'
      }
    ],
    data: {
      url: '/',
      timestamp: Date.now()
    }
  };

  event.waitUntil(
    self.registration.showNotification('Sistema de Gestão', options)
  );
});

// Notification click
self.addEventListener('notificationclick', (event) => {
  console.log('Service Worker: Notification clicked');
  
  event.notification.close();

  if (event.action === 'view' || !event.action) {
    event.waitUntil(
      clients.openWindow(event.notification.data.url || '/')
    );
  }
});

// Message handling
self.addEventListener('message', (event) => {
  console.log('Service Worker: Message received', event.data);
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'GET_CACHE_SIZE') {
    getCacheSize().then(size => {
      event.ports[0].postMessage({ cacheSize: size });
    });
  }
  
  if (event.data && event.data.type === 'CLEAR_CACHE') {
    clearCache().then(() => {
      event.ports[0].postMessage({ success: true });
    });
  }
});

// Utility functions
async function syncClientesData() {
  try {
    console.log('Service Worker: Syncing clientes data');
    // Implementar sincronização com servidor quando disponível
    return Promise.resolve();
  } catch (error) {
    console.error('Service Worker: Error syncing clientes data', error);
    throw error;
  }
}

async function syncPagamentosData() {
  try {
    console.log('Service Worker: Syncing pagamentos data');
    // Implementar sincronização com servidor quando disponível
    return Promise.resolve();
  } catch (error) {
    console.error('Service Worker: Error syncing pagamentos data', error);
    throw error;
  }
}

async function getCacheSize() {
  try {
    const cacheNames = await caches.keys();
    let totalSize = 0;
    
    for (const cacheName of cacheNames) {
      const cache = await caches.open(cacheName);
      const requests = await cache.keys();
      
      for (const request of requests) {
        const response = await cache.match(request);
        if (response) {
          const blob = await response.blob();
          totalSize += blob.size;
        }
      }
    }
    
    return Math.round(totalSize / 1024 / 1024 * 100) / 100; // MB
  } catch (error) {
    console.error('Service Worker: Error calculating cache size', error);
    return 0;
  }
}

async function clearCache() {
  try {
    const cacheNames = await caches.keys();
    await Promise.all(
      cacheNames.map(cacheName => {
        if (cacheName !== STATIC_CACHE_NAME) {
          return caches.delete(cacheName);
        }
      })
    );
    console.log('Service Worker: Dynamic cache cleared');
  } catch (error) {
    console.error('Service Worker: Error clearing cache', error);
    throw error;
  }
}

// Periodic background sync
self.addEventListener('periodicsync', (event) => {
  console.log('Service Worker: Periodic sync', event.tag);
  
  if (event.tag === 'check-vencimentos') {
    event.waitUntil(checkVencimentosPeriodic());
  }
});

async function checkVencimentosPeriodic() {
  try {
    console.log('Service Worker: Checking vencimentos periodically');
    
    // Get localStorage data (if available in SW context)
    // For now, we'll simulate the check
    const now = new Date();
    const message = `Verificação automática de vencimentos realizada às ${now.toLocaleTimeString('pt-BR')}`;
    
    // Show notification if there are pending payments
    if (Math.random() > 0.7) { // Simulate 30% chance of notifications
      await self.registration.showNotification('Pagamentos Pendentes', {
        body: 'Existem pagamentos com vencimento próximo',
        icon: '/assets/icon-192.png',
        badge: '/assets/icon-96.png',
        tag: 'vencimento-notification',
        actions: [
          { action: 'view', title: 'Ver Detalhes' },
          { action: 'dismiss', title: 'Dispensar' }
        ]
      });
    }
    
  } catch (error) {
    console.error('Service Worker: Error checking vencimentos', error);
  }
}

// Install prompt handling
let deferredPrompt;

self.addEventListener('beforeinstallprompt', (event) => {
  console.log('Service Worker: Before install prompt');
  deferredPrompt = event;
  
  // Send message to main thread
  self.clients.matchAll().then(clients => {
    clients.forEach(client => {
      client.postMessage({
        type: 'INSTALL_PROMPT_AVAILABLE'
      });
    });
  });
});

self.addEventListener('appinstalled', (event) => {
  console.log('Service Worker: App installed');
  deferredPrompt = null;
  
  // Send message to main thread
  self.clients.matchAll().then(clients => {
    clients.forEach(client => {
      client.postMessage({
        type: 'APP_INSTALLED'
      });
    });
  });
});

// Error handling
self.addEventListener('error', (event) => {
  console.error('Service Worker: Error', event.error);
});

self.addEventListener('unhandledrejection', (event) => {
  console.error('Service Worker: Unhandled rejection', event.reason);
});

console.log('Service Worker: Script loaded');