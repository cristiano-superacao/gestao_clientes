// Push Notifications Manager - v2.2.0
// Sistema de Gestão de Clientes - SENAI

class PushNotificationManager {
    constructor() {
        this.swRegistration = null;
        this.subscription = null;
        this.vapidPublicKey = 'BEl62iUYgUivxIkv69yViEuiBIa40HI0DLLuxazjqAkXSKaLXYW9c-TpncliYXBxaJlAz8Oic2xtOOhvgqq6MZw'; // Example VAPID key
        this.serverEndpoint = '/api/push-notifications';
        this.notificationSettings = {
            enabled: true,
            sound: true,
            vibration: true,
            showBackup: true,
            showSync: true,
            showUpdates: true,
            showReminders: true,
            quietHours: {
                enabled: false,
                start: '22:00',
                end: '08:00'
            }
        };
        
        this.init();
    }
    
    async init() {
        console.log('🔔 Push Notification Manager iniciando...');
        
        // Load settings from localStorage
        this.loadSettings();
        
        // Check if service worker is available
        if ('serviceWorker' in navigator) {
            try {
                this.swRegistration = await navigator.serviceWorker.ready;
                console.log('✅ Service Worker ready para push notifications');
                
                // Check existing subscription
                await this.checkExistingSubscription();
                
                // Setup message listeners
                this.setupMessageListeners();
                
                // Setup notification click handlers
                this.setupNotificationHandlers();
                
                console.log('✅ Push Notification Manager inicializado');
                
            } catch (error) {
                console.error('❌ Erro ao inicializar Push Notifications:', error);
            }
        } else {
            console.warn('⚠️ Service Worker não suportado - Push Notifications desabilitados');
        }
    }
    
    // Check if user is already subscribed
    async checkExistingSubscription() {
        try {
            this.subscription = await this.swRegistration.pushManager.getSubscription();
            
            if (this.subscription) {
                console.log('✅ Push subscription existente encontrada');
                await this.validateSubscription();
            } else {
                console.log('📭 Nenhuma subscription encontrada');
            }
            
        } catch (error) {
            console.error('❌ Erro ao verificar subscription:', error);
        }
    }
    
    // Request permission and subscribe to push notifications
    async requestPermissionAndSubscribe() {
        try {
            // Request notification permission
            const permission = await Notification.requestPermission();
            
            if (permission !== 'granted') {
                console.warn('⚠️ Permissão de notificação negada');
                return false;
            }
            
            console.log('✅ Permissão de notificação concedida');
            
            // Subscribe to push notifications
            this.subscription = await this.swRegistration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: this.urlBase64ToUint8Array(this.vapidPublicKey)
            });
            
            console.log('✅ Subscrito em push notifications');
            
            // Send subscription to server
            await this.sendSubscriptionToServer(this.subscription);
            
            // Show welcome notification
            await this.showWelcomeNotification();
            
            return true;
            
        } catch (error) {
            console.error('❌ Erro ao subscrever push notifications:', error);
            return false;
        }
    }
    
    // Unsubscribe from push notifications
    async unsubscribe() {
        try {
            if (this.subscription) {
                await this.subscription.unsubscribe();
                
                // Remove from server
                await this.removeSubscriptionFromServer();
                
                this.subscription = null;
                console.log('✅ Push notifications desabilitados');
                
                return true;
            }
            
        } catch (error) {
            console.error('❌ Erro ao desabilitar push notifications:', error);
        }
        
        return false;
    }
    
    // Send subscription to server
    async sendSubscriptionToServer(subscription) {
        try {
            const subscriptionData = {
                endpoint: subscription.endpoint,
                keys: {
                    p256dh: this.arrayBufferToBase64(subscription.getKey('p256dh')),
                    auth: this.arrayBufferToBase64(subscription.getKey('auth'))
                },
                userId: this.getUserId(),
                userAgent: navigator.userAgent,
                timestamp: new Date().toISOString()
            };
            
            // In a real app, send this to your server
            console.log('📤 Enviando subscription para servidor:', subscriptionData);
            
            // Store locally for demo purposes
            localStorage.setItem('push_subscription', JSON.stringify(subscriptionData));
            
            // Simulate server response
            return { success: true, id: 'sub_' + Date.now() };
            
        } catch (error) {
            console.error('❌ Erro ao enviar subscription:', error);
            throw error;
        }
    }
    
    // Remove subscription from server
    async removeSubscriptionFromServer() {
        try {
            const subscriptionData = localStorage.getItem('push_subscription');
            
            if (subscriptionData) {
                console.log('📤 Removendo subscription do servidor');
                localStorage.removeItem('push_subscription');
            }
            
        } catch (error) {
            console.error('❌ Erro ao remover subscription:', error);
        }
    }
    
    // Validate existing subscription
    async validateSubscription() {
        try {
            // Check if subscription is still valid
            const isValid = this.subscription && !this.subscription.expirationTime;
            
            if (!isValid) {
                console.log('⚠️ Subscription expirada, renovando...');
                await this.requestPermissionAndSubscribe();
            }
            
        } catch (error) {
            console.error('❌ Erro ao validar subscription:', error);
        }
    }
    
    // Send push notification (server-side simulation)
    async sendPushNotification(notificationData) {
        try {
            const subscription = JSON.parse(localStorage.getItem('push_subscription') || '{}');
            
            if (!subscription.endpoint) {
                console.warn('⚠️ Nenhuma subscription ativa para enviar push');
                return false;
            }
            
            // Simulate server sending push notification
            console.log('📤 Simulando envio de push notification:', notificationData);
            
            // In a real implementation, your server would send the push notification
            // For demo purposes, we'll trigger it directly via Service Worker
            await this.triggerNotificationDirectly(notificationData);
            
            return true;
            
        } catch (error) {
            console.error('❌ Erro ao enviar push notification:', error);
            return false;
        }
    }
    
    // Trigger notification directly (for demo purposes)
    async triggerNotificationDirectly(notificationData) {
        if (!this.swRegistration) return;
        
        try {
            await this.swRegistration.showNotification(notificationData.title, {
                body: notificationData.body,
                icon: notificationData.icon || '/assets/images/icon-192.png',
                badge: '/assets/images/icon-192.png',
                tag: notificationData.tag || 'default',
                data: notificationData.data || {},
                actions: notificationData.actions || [],
                requireInteraction: notificationData.requireInteraction || false,
                silent: notificationData.silent || false,
                vibrate: notificationData.vibrate || [200, 100, 200],
                timestamp: Date.now()
            });
            
        } catch (error) {
            console.error('❌ Erro ao mostrar notificação:', error);
        }
    }
    
    // Pre-defined notification types
    async sendBackupNotification(backupInfo) {
        if (!this.notificationSettings.showBackup || !this.isNotificationTimeAllowed()) {
            return;
        }
        
        const notification = {
            title: '💾 Backup Concluído',
            body: `Backup realizado com sucesso (${backupInfo.size || 'N/A'})`,
            tag: 'backup-complete',
            icon: '/assets/images/icon-192.png',
            data: {
                type: 'backup',
                backupId: backupInfo.id,
                url: '/backup-complete.html'
            },
            actions: [
                { action: 'view-backup', title: 'Ver Backup' },
                { action: 'dismiss', title: 'OK' }
            ],
            requireInteraction: false
        };
        
        await this.sendPushNotification(notification);
        this.logNotification('backup', notification);
    }
    
    async sendSyncNotification(syncInfo) {
        if (!this.notificationSettings.showSync || !this.isNotificationTimeAllowed()) {
            return;
        }
        
        const notification = {
            title: '🔄 Sincronização Completa',
            body: `${syncInfo.count || 0} itens sincronizados com sucesso`,
            tag: 'sync-complete',
            icon: '/assets/images/icon-192.png',
            data: {
                type: 'sync',
                count: syncInfo.count,
                url: '/dashboard-complete.html'
            },
            actions: [
                { action: 'view-dashboard', title: 'Ver Dashboard' },
                { action: 'dismiss', title: 'OK' }
            ],
            requireInteraction: false
        };
        
        await this.sendPushNotification(notification);
        this.logNotification('sync', notification);
    }
    
    async sendUpdateNotification(updateInfo) {
        if (!this.notificationSettings.showUpdates || !this.isNotificationTimeAllowed()) {
            return;
        }
        
        const notification = {
            title: '🆕 Atualização Disponível',
            body: `Nova versão ${updateInfo.version || 'N/A'} disponível`,
            tag: 'update-available',
            icon: '/assets/images/icon-192.png',
            data: {
                type: 'update',
                version: updateInfo.version,
                url: '/'
            },
            actions: [
                { action: 'update-now', title: 'Atualizar' },
                { action: 'later', title: 'Mais Tarde' }
            ],
            requireInteraction: true
        };
        
        await this.sendPushNotification(notification);
        this.logNotification('update', notification);
    }
    
    async sendReminderNotification(reminderInfo) {
        if (!this.notificationSettings.showReminders || !this.isNotificationTimeAllowed()) {
            return;
        }
        
        const notification = {
            title: '⏰ Lembrete',
            body: reminderInfo.message || 'Você tem uma tarefa pendente',
            tag: 'reminder',
            icon: '/assets/images/icon-192.png',
            data: {
                type: 'reminder',
                reminderId: reminderInfo.id,
                url: reminderInfo.url || '/'
            },
            actions: [
                { action: 'view-task', title: 'Ver Tarefa' },
                { action: 'snooze', title: 'Adiar' }
            ],
            requireInteraction: true
        };
        
        await this.sendPushNotification(notification);
        this.logNotification('reminder', notification);
    }
    
    async sendCustomNotification(title, body, options = {}) {
        const notification = {
            title: title,
            body: body,
            tag: options.tag || 'custom',
            icon: options.icon || '/assets/images/icon-192.png',
            data: options.data || {},
            actions: options.actions || [],
            requireInteraction: options.requireInteraction || false,
            silent: options.silent || false
        };
        
        await this.sendPushNotification(notification);
        this.logNotification('custom', notification);
    }
    
    // Setup message listeners for SW communication
    setupMessageListeners() {
        if (!navigator.serviceWorker) return;
        
        navigator.serviceWorker.addEventListener('message', (event) => {
            const { type, data } = event.data;
            
            switch (type) {
                case 'NOTIFICATION_CLICKED':
                    this.handleNotificationClick(data);
                    break;
                    
                case 'NOTIFICATION_CLOSED':
                    this.handleNotificationClose(data);
                    break;
                    
                case 'PUSH_RECEIVED':
                    this.handlePushReceived(data);
                    break;
            }
        });
    }
    
    // Setup notification event handlers
    setupNotificationHandlers() {
        // Listen for notification clicks globally
        document.addEventListener('notificationclick', (event) => {
            this.handleNotificationClick(event.notification.data);
            event.notification.close();
        });
    }
    
    // Handle notification clicks
    handleNotificationClick(data) {
        console.log('🔔 Notificação clicada:', data);
        
        const { type, action, url } = data;
        
        switch (action) {
            case 'view-backup':
                this.navigateTo('/backup-complete.html');
                break;
                
            case 'view-dashboard':
                this.navigateTo('/dashboard-complete.html');
                break;
                
            case 'update-now':
                this.triggerAppUpdate();
                break;
                
            case 'view-task':
                this.navigateTo(url || '/');
                break;
                
            case 'snooze':
                this.snoozeReminder(data.reminderId);
                break;
                
            default:
                if (url) {
                    this.navigateTo(url);
                }
        }
        
        // Log click analytics
        this.logNotificationClick(type, action);
    }
    
    // Handle notification close
    handleNotificationClose(data) {
        console.log('🔔 Notificação fechada:', data);
        this.logNotificationClose(data.type);
    }
    
    // Handle push received
    handlePushReceived(data) {
        console.log('📨 Push recebido:', data);
        // Additional handling for push events
    }
    
    // Navigation helper
    navigateTo(url) {
        if (window.location.pathname !== url) {
            window.location.href = url;
        } else {
            window.focus();
        }
    }
    
    // Trigger app update
    async triggerAppUpdate() {
        if (window.pwaManager) {
            await window.pwaManager.updateApp();
        }
    }
    
    // Snooze reminder
    snoozeReminder(reminderId) {
        // Snooze for 1 hour
        const snoozeTime = 60 * 60 * 1000; // 1 hour in milliseconds
        
        setTimeout(() => {
            this.sendReminderNotification({
                id: reminderId,
                message: 'Lembrete adiado - ainda pendente'
            });
        }, snoozeTime);
        
        console.log(`⏰ Lembrete ${reminderId} adiado por 1 hora`);
    }
    
    // Check if notification should be sent based on quiet hours
    isNotificationTimeAllowed() {
        if (!this.notificationSettings.quietHours.enabled) {
            return true;
        }
        
        const now = new Date();
        const currentTime = now.getHours() * 100 + now.getMinutes();
        
        const startTime = this.parseTime(this.notificationSettings.quietHours.start);
        const endTime = this.parseTime(this.notificationSettings.quietHours.end);
        
        // Handle overnight quiet hours
        if (startTime > endTime) {
            return currentTime < endTime || currentTime > startTime;
        } else {
            return currentTime < startTime || currentTime > endTime;
        }
    }
    
    parseTime(timeStr) {
        const [hours, minutes] = timeStr.split(':').map(Number);
        return hours * 100 + minutes;
    }
    
    // Settings management
    updateSettings(newSettings) {
        this.notificationSettings = { ...this.notificationSettings, ...newSettings };
        this.saveSettings();
        console.log('⚙️ Configurações de notificação atualizadas:', this.notificationSettings);
    }
    
    saveSettings() {
        localStorage.setItem('notification_settings', JSON.stringify(this.notificationSettings));
    }
    
    loadSettings() {
        try {
            const saved = localStorage.getItem('notification_settings');
            if (saved) {
                this.notificationSettings = { ...this.notificationSettings, ...JSON.parse(saved) };
            }
        } catch (error) {
            console.error('❌ Erro ao carregar configurações:', error);
        }
    }
    
    getSettings() {
        return { ...this.notificationSettings };
    }
    
    // Notification history and analytics
    logNotification(type, notification) {
        const log = {
            id: Date.now(),
            type: type,
            title: notification.title,
            body: notification.body,
            timestamp: new Date().toISOString(),
            sent: true
        };
        
        this.addToHistory(log);
    }
    
    logNotificationClick(type, action) {
        const log = {
            id: Date.now(),
            type: 'click',
            notificationType: type,
            action: action,
            timestamp: new Date().toISOString()
        };
        
        this.addToHistory(log);
    }
    
    logNotificationClose(type) {
        const log = {
            id: Date.now(),
            type: 'close',
            notificationType: type,
            timestamp: new Date().toISOString()
        };
        
        this.addToHistory(log);
    }
    
    addToHistory(log) {
        try {
            const history = JSON.parse(localStorage.getItem('notification_history') || '[]');
            history.unshift(log);
            
            // Keep only last 100 notifications
            if (history.length > 100) {
                history.splice(100);
            }
            
            localStorage.setItem('notification_history', JSON.stringify(history));
            
        } catch (error) {
            console.error('❌ Erro ao salvar histórico:', error);
        }
    }
    
    getHistory(limit = 50) {
        try {
            const history = JSON.parse(localStorage.getItem('notification_history') || '[]');
            return history.slice(0, limit);
        } catch (error) {
            console.error('❌ Erro ao carregar histórico:', error);
            return [];
        }
    }
    
    clearHistory() {
        localStorage.removeItem('notification_history');
        console.log('🗑️ Histórico de notificações limpo');
    }
    
    // Utility functions
    urlBase64ToUint8Array(base64String) {
        const padding = '='.repeat((4 - base64String.length % 4) % 4);
        const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
        const rawData = window.atob(base64);
        const outputArray = new Uint8Array(rawData.length);
        
        for (let i = 0; i < rawData.length; ++i) {
            outputArray[i] = rawData.charCodeAt(i);
        }
        
        return outputArray;
    }
    
    arrayBufferToBase64(buffer) {
        const bytes = new Uint8Array(buffer);
        let binary = '';
        bytes.forEach(byte => binary += String.fromCharCode(byte));
        return window.btoa(binary);
    }
    
    getUserId() {
        // Generate or retrieve user ID
        let userId = localStorage.getItem('user_id');
        if (!userId) {
            userId = 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            localStorage.setItem('user_id', userId);
        }
        return userId;
    }
    
    // Status methods
    isSubscribed() {
        return this.subscription !== null;
    }
    
    getSubscriptionStatus() {
        return {
            subscribed: this.isSubscribed(),
            permission: Notification.permission,
            endpoint: this.subscription?.endpoint,
            subscription: this.subscription
        };
    }
    
    // Test methods for development
    async runNotificationTests() {
        console.log('🧪 Executando testes de notificação...');
        
        const tests = [
            () => this.sendBackupNotification({ id: 'test_backup', size: '2.5MB' }),
            () => this.sendSyncNotification({ count: 5 }),
            () => this.sendUpdateNotification({ version: '2.3.0' }),
            () => this.sendReminderNotification({ 
                id: 'test_reminder', 
                message: 'Fazer backup dos dados importantes',
                url: '/backup-complete.html'
            }),
            () => this.sendCustomNotification('Teste Personalizado', 'Esta é uma notificação de teste personalizada')
        ];
        
        for (let i = 0; i < tests.length; i++) {
            setTimeout(tests[i], i * 2000);
        }
        
        console.log('✅ Testes de notificação agendados');
    }
}

// Auto-initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.pushNotificationManager = new PushNotificationManager();
});

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PushNotificationManager;
}