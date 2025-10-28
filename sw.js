// Service Worker - PWA v2.2.0
// Sistema de Gestão de Clientes - SENAI - Offline Support

const CACHE_NAME = 'gestao-clientes-v2-2-0';
const STATIC_CACHE = 'static-cache-v2-2-0';
const DYNAMIC_CACHE = 'dynamic-cache-v2-2-0';
const API_CACHE = 'api-cache-v2-2-0';

// Static assets to cache
const STATIC_ASSETS = [
    '/',
    '/index.html',
    '/index-complete.html',
    '/dashboard-complete.html',
    '/export-complete.html',
    '/import-complete.html',
    '/backup-complete.html',
    '/assets/css/style.css',
    '/assets/js/client-manager.js',
    '/assets/js/dashboard-manager.js',
    '/assets/js/export-manager.js',
    '/assets/js/import-manager.js',
    '/assets/js/backup-manager.js',
    '/assets/images/logo.png',
    '/assets/images/icon-192.png',
    '/assets/images/icon-512.png',
    '/manifest.json',
    // External CDN resources (cached when accessed)
    'https://cdn.tailwindcss.com',
    'https://cdn.jsdelivr.net/npm/chart.js',
    'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js',
    'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.mini.min.js'
];

// Firebase URLs to cache
const FIREBASE_URLS = [
    'https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js',
    'https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js',
    'https://www.gstatic.com/firebasejs/11.6.1/firebase-storage.js',
    'https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js'
];

// URLs that should always fetch from network
const NETWORK_FIRST_URLS = [
    '/api/',
    'firestore.googleapis.com',
    'firebase.googleapis.com',
    'identitytoolkit.googleapis.com'
];

// Install Event - Cache static assets
self.addEventListener('install', event => {
    console.log('[SW] Installing Service Worker...', CACHE_NAME);
    
    event.waitUntil(
        Promise.all([
            // Cache static assets
            caches.open(STATIC_CACHE).then(cache => {
                console.log('[SW] Caching static assets');
                return cache.addAll(STATIC_ASSETS.concat(FIREBASE_URLS));
            }),
            // Cache shell
            caches.open(CACHE_NAME).then(cache => {
                console.log('[SW] Caching app shell');
                return cache.addAll([
                    '/',
                    '/index.html',
                    '/index-complete.html'
                ]);
            })
        ]).then(() => {
            console.log('[SW] Installation complete');
            // Force activation
            return self.skipWaiting();
        }).catch(error => {
            console.error('[SW] Installation failed:', error);
        })
    );
});

// Activate Event - Clean up old caches
self.addEventListener('activate', event => {
    console.log('[SW] Activating Service Worker...', CACHE_NAME);
    
    event.waitUntil(
        Promise.all([
            // Clean up old caches
            caches.keys().then(cacheNames => {
                return Promise.all(
                    cacheNames.map(cacheName => {
                        if (cacheName !== CACHE_NAME && 
                            cacheName !== STATIC_CACHE && 
                            cacheName !== DYNAMIC_CACHE && 
                            cacheName !== API_CACHE) {
                            console.log('[SW] Deleting old cache:', cacheName);
                            return caches.delete(cacheName);
                        }
                    })
                );
            }),
            // Take control of all clients
            self.clients.claim()
        ]).then(() => {
            console.log('[SW] Activation complete, now controlling all clients');
            
            // Notify clients about the new service worker
            self.clients.matchAll().then(clients => {
                clients.forEach(client => {
                    client.postMessage({
                        type: 'SW_ACTIVATED',
                        version: CACHE_NAME
                    });
                });
            });
        })
    );
});

// Fetch Event - Handle network requests
self.addEventListener('fetch', event => {
    const request = event.request;
    const url = new URL(request.url);
    
    // Skip non-GET requests
    if (request.method !== 'GET') {
        return;
    }
    
    // Skip chrome-extension and other non-http requests
    if (!request.url.startsWith('http')) {
        return;
    }
    
    event.respondWith(handleFetch(request, url));
});

// Handle different types of fetch requests
async function handleFetch(request, url) {
    try {
        // Network first for critical APIs
        if (shouldUseNetworkFirst(url)) {
            return await networkFirstStrategy(request);
        }
        
        // Cache first for static assets
        if (isStaticAsset(url)) {
            return await cacheFirstStrategy(request);
        }
        
        // Stale while revalidate for Firebase APIs
        if (isFirebaseAPI(url)) {
            return await staleWhileRevalidateStrategy(request);
        }
        
        // Cache first for HTML pages with network fallback
        if (isHTMLRequest(request)) {
            return await cacheFirstWithNetworkFallback(request);
        }
        
        // Default: Network first with cache fallback
        return await networkFirstWithCacheFallback(request);
        
    } catch (error) {
        console.error('[SW] Fetch error:', error);
        return await handleOfflineFallback(request);
    }
}

// Caching strategies
async function networkFirstStrategy(request) {
    try {
        const networkResponse = await fetch(request);
        
        // Cache successful responses
        if (networkResponse.ok) {
            const cache = await caches.open(API_CACHE);
            cache.put(request.url, networkResponse.clone());
        }
        
        return networkResponse;
    } catch (error) {
        console.log('[SW] Network failed, trying cache:', request.url);
        const cachedResponse = await caches.match(request);
        
        if (cachedResponse) {
            return cachedResponse;
        }
        
        throw error;
    }
}

async function cacheFirstStrategy(request) {
    const cachedResponse = await caches.match(request);
    
    if (cachedResponse) {
        return cachedResponse;
    }
    
    try {
        const networkResponse = await fetch(request);
        
        if (networkResponse.ok) {
            const cache = await caches.open(STATIC_CACHE);
            cache.put(request.url, networkResponse.clone());
        }
        
        return networkResponse;
    } catch (error) {
        console.error('[SW] Cache first failed:', error);
        throw error;
    }
}

async function staleWhileRevalidateStrategy(request) {
    const cachedResponse = await caches.match(request);
    
    // Always try to fetch fresh data in background
    const fetchPromise = fetch(request).then(networkResponse => {
        if (networkResponse.ok) {
            const cache = caches.open(DYNAMIC_CACHE);
            cache.then(c => c.put(request.url, networkResponse.clone()));
        }
        return networkResponse;
    }).catch(error => {
        console.log('[SW] Background fetch failed:', error);
    });
    
    // Return cached version immediately if available
    if (cachedResponse) {
        return cachedResponse;
    }
    
    // If no cache, wait for network
    return await fetchPromise;
}

async function cacheFirstWithNetworkFallback(request) {
    const cachedResponse = await caches.match(request);
    
    if (cachedResponse) {
        return cachedResponse;
    }
    
    try {
        const networkResponse = await fetch(request);
        
        if (networkResponse.ok) {
            const cache = await caches.open(CACHE_NAME);
            cache.put(request.url, networkResponse.clone());
        }
        
        return networkResponse;
    } catch (error) {
        // Return offline page for HTML requests
        if (isHTMLRequest(request)) {
            const offlinePage = await caches.match('/index-complete.html');
            if (offlinePage) {
                return offlinePage;
            }
        }
        
        throw error;
    }
}

async function networkFirstWithCacheFallback(request) {
    try {
        const networkResponse = await fetch(request);
        
        if (networkResponse.ok) {
            const cache = await caches.open(DYNAMIC_CACHE);
            cache.put(request.url, networkResponse.clone());
        }
        
        return networkResponse;
    } catch (error) {
        const cachedResponse = await caches.match(request);
        
        if (cachedResponse) {
            return cachedResponse;
        }
        
        throw error;
    }
}

// Handle offline fallbacks
async function handleOfflineFallback(request) {
    // For HTML requests, return the offline page
    if (isHTMLRequest(request)) {
        const offlinePage = await caches.match('/index-complete.html');
        if (offlinePage) {
            return offlinePage;
        }
    }
    
    // For API requests, return a custom offline response
    if (request.url.includes('/api/')) {
        return new Response(
            JSON.stringify({
                error: 'offline',
                message: 'Você está offline. Alguns recursos podem não estar disponíveis.',
                timestamp: new Date().toISOString()
            }),
            {
                status: 503,
                headers: {
                    'Content-Type': 'application/json',
                    'Cache-Control': 'no-cache'
                }
            }
        );
    }
    
    // For other requests, return a generic offline response
    return new Response('Você está offline', {
        status: 503,
        headers: {
            'Content-Type': 'text/plain'
        }
    });
}

// Helper functions
function shouldUseNetworkFirst(url) {
    return NETWORK_FIRST_URLS.some(pattern => url.href.includes(pattern));
}

function isStaticAsset(url) {
    const staticExtensions = ['.css', '.js', '.png', '.jpg', '.jpeg', '.gif', '.svg', '.woff', '.woff2'];
    return staticExtensions.some(ext => url.pathname.endsWith(ext)) ||
           url.href.includes('cdn.') ||
           url.href.includes('cdnjs.') ||
           url.href.includes('jsdelivr.');
}

function isFirebaseAPI(url) {
    return url.href.includes('firestore.googleapis.com') ||
           url.href.includes('firebase.googleapis.com') ||
           url.href.includes('gstatic.com/firebasejs');
}

function isHTMLRequest(request) {
    return request.headers.get('accept')?.includes('text/html') ||
           request.url.endsWith('.html') ||
           (!request.url.includes('.') && !request.url.includes('/api/'));
}

// Background sync for offline actions
self.addEventListener('sync', event => {
    console.log('[SW] Background sync:', event.tag);
    
    if (event.tag === 'client-sync') {
        event.waitUntil(syncOfflineClients());
    } else if (event.tag === 'backup-sync') {
        event.waitUntil(syncOfflineBackups());
    }
});

// Sync offline client data
async function syncOfflineClients() {
    try {
        console.log('[SW] Syncing offline clients...');
        
        // Get offline data from IndexedDB or localStorage
        const offlineData = await getOfflineData('clients');
        
        if (offlineData && offlineData.length > 0) {
            // Send to server when online
            for (const client of offlineData) {
                try {
                    const response = await fetch('/api/clients', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify(client)
                    });
                    
                    if (response.ok) {
                        // Remove from offline storage
                        await removeOfflineData('clients', client.id);
                    }
                } catch (error) {
                    console.error('[SW] Failed to sync client:', error);
                }
            }
        }
        
        // Notify clients about sync completion
        self.clients.matchAll().then(clients => {
            clients.forEach(client => {
                client.postMessage({
                    type: 'SYNC_COMPLETE',
                    data: 'clients'
                });
            });
        });
        
    } catch (error) {
        console.error('[SW] Sync failed:', error);
    }
}

// Sync offline backups
async function syncOfflineBackups() {
    try {
        console.log('[SW] Syncing offline backups...');
        
        const offlineBackups = await getOfflineData('backups');
        
        if (offlineBackups && offlineBackups.length > 0) {
            for (const backup of offlineBackups) {
                try {
                    // Upload backup to Firebase Storage
                    const response = await fetch('/api/backups', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify(backup)
                    });
                    
                    if (response.ok) {
                        await removeOfflineData('backups', backup.id);
                    }
                } catch (error) {
                    console.error('[SW] Failed to sync backup:', error);
                }
            }
        }
        
        // Notify clients
        self.clients.matchAll().then(clients => {
            clients.forEach(client => {
                client.postMessage({
                    type: 'SYNC_COMPLETE',
                    data: 'backups'
                });
            });
        });
        
    } catch (error) {
        console.error('[SW] Backup sync failed:', error);
    }
}

// IndexedDB helpers (simplified)
async function getOfflineData(store) {
    // In a real implementation, you would use IndexedDB
    // For now, using localStorage as fallback
    try {
        const data = localStorage.getItem(`offline_${store}`);
        return data ? JSON.parse(data) : [];
    } catch (error) {
        console.error('[SW] Failed to get offline data:', error);
        return [];
    }
}

async function removeOfflineData(store, id) {
    try {
        const data = await getOfflineData(store);
        const filtered = data.filter(item => item.id !== id);
        localStorage.setItem(`offline_${store}`, JSON.stringify(filtered));
    } catch (error) {
        console.error('[SW] Failed to remove offline data:', error);
    }
}

// Handle push notifications
self.addEventListener('push', event => {
    if (!event.data) return;
    
    try {
        const payload = event.data.json();
        console.log('[SW] Push notification received:', payload);
        
        const options = {
            body: payload.body || 'Nova notificação do sistema',
            icon: '/assets/images/icon-192.png',
            badge: '/assets/images/icon-192.png',
            tag: payload.tag || 'default',
            data: payload.data || {},
            actions: payload.actions || [],
            requireInteraction: payload.requireInteraction || false,
            silent: payload.silent || false
        };
        
        event.waitUntil(
            self.registration.showNotification(
                payload.title || 'Gestão de Clientes',
                options
            )
        );
        
    } catch (error) {
        console.error('[SW] Push notification error:', error);
        
        // Fallback notification
        event.waitUntil(
            self.registration.showNotification('Gestão de Clientes', {
                body: 'Nova notificação disponível',
                icon: '/assets/images/icon-192.png'
            })
        );
    }
});

// Handle notification clicks
self.addEventListener('notificationclick', event => {
    console.log('[SW] Notification clicked:', event.notification);
    
    event.notification.close();
    
    const notificationData = event.notification.data || {};
    const action = event.action;
    
    event.waitUntil(
        clients.matchAll({
            type: 'window',
            includeUncontrolled: true
        }).then(clientList => {
            // Check if app is already open
            for (const client of clientList) {
                if (client.url.includes(self.location.origin)) {
                    client.focus();
                    
                    // Send notification data to the client
                    client.postMessage({
                        type: 'NOTIFICATION_CLICKED',
                        action: action,
                        data: notificationData
                    });
                    
                    return;
                }
            }
            
            // Open new window if app is not open
            const targetUrl = notificationData.url || '/index-complete.html';
            return clients.openWindow(targetUrl);
        })
    );
});

// Handle messages from clients
self.addEventListener('message', event => {
    console.log('[SW] Message received:', event.data);
    
    const { type, data } = event.data;
    
    switch (type) {
        case 'SKIP_WAITING':
            self.skipWaiting();
            break;
            
        case 'GET_VERSION':
            event.ports[0].postMessage({
                version: CACHE_NAME,
                caches: [STATIC_CACHE, DYNAMIC_CACHE, API_CACHE]
            });
            break;
            
        case 'CLEAR_CACHE':
            clearAllCaches().then(() => {
                event.ports[0].postMessage({ success: true });
            });
            break;
            
        case 'CACHE_URLS':
            if (data && data.urls) {
                cacheUrls(data.urls).then(() => {
                    event.ports[0].postMessage({ success: true });
                });
            }
            break;
            
        case 'STORE_OFFLINE_DATA':
            if (data) {
                storeOfflineData(data.store, data.items).then(() => {
                    event.ports[0].postMessage({ success: true });
                });
            }
            break;
    }
});

// Clear all caches
async function clearAllCaches() {
    try {
        const cacheNames = await caches.keys();
        await Promise.all(
            cacheNames.map(cacheName => caches.delete(cacheName))
        );
        console.log('[SW] All caches cleared');
    } catch (error) {
        console.error('[SW] Failed to clear caches:', error);
    }
}

// Cache specific URLs
async function cacheUrls(urls) {
    try {
        const cache = await caches.open(DYNAMIC_CACHE);
        await cache.addAll(urls);
        console.log('[SW] URLs cached:', urls);
    } catch (error) {
        console.error('[SW] Failed to cache URLs:', error);
    }
}

// Store data for offline use
async function storeOfflineData(store, items) {
    try {
        const existingData = await getOfflineData(store);
        const updatedData = [...existingData, ...items];
        localStorage.setItem(`offline_${store}`, JSON.stringify(updatedData));
        console.log('[SW] Offline data stored:', store, items.length);
    } catch (error) {
        console.error('[SW] Failed to store offline data:', error);
    }
}

// Periodic background tasks
self.addEventListener('periodicsync', event => {
    if (event.tag === 'backup-check') {
        event.waitUntil(checkBackupSchedule());
    }
});

async function checkBackupSchedule() {
    try {
        // Check if backup is needed
        const lastBackup = localStorage.getItem('last_backup_check');
        const now = Date.now();
        
        if (!lastBackup || (now - parseInt(lastBackup)) > 24 * 60 * 60 * 1000) {
            // Trigger backup notification
            self.registration.showNotification('Lembrete de Backup', {
                body: 'É recomendado fazer um backup dos seus dados.',
                icon: '/assets/images/icon-192.png',
                tag: 'backup-reminder',
                actions: [
                    { action: 'backup-now', title: 'Fazer Backup' },
                    { action: 'dismiss', title: 'Ignorar' }
                ]
            });
            
            localStorage.setItem('last_backup_check', now.toString());
        }
    } catch (error) {
        console.error('[SW] Backup check failed:', error);
    }
}

// Error handling
self.addEventListener('error', event => {
    console.error('[SW] Service Worker error:', event.error);
});

self.addEventListener('unhandledrejection', event => {
    console.error('[SW] Unhandled promise rejection:', event.reason);
});

console.log('[SW] Service Worker loaded successfully:', CACHE_NAME);