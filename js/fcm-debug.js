// FCM Debug Panel - Shows notification status in the UI
export class FCMDebugPanel {
    constructor() {
        this.panel = null;
        this.isVisible = false;
    }

    async createDebugPanel() {
        // Create debug panel HTML
        const panel = document.createElement('div');
        panel.id = 'fcm-debug-panel';
        panel.style.cssText = `
            position: fixed;
            top: 10px;
            right: 10px;
            background: #000;
            color: #fff;
            padding: 15px;
            border-radius: 8px;
            font-family: monospace;
            font-size: 12px;
            max-width: 300px;
            z-index: 10000;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            border: 1px solid #333;
        `;

        // Add close button
        const closeBtn = document.createElement('button');
        closeBtn.innerHTML = '×';
        closeBtn.style.cssText = `
            position: absolute;
            top: 5px;
            right: 8px;
            background: none;
            border: none;
            color: #fff;
            font-size: 16px;
            cursor: pointer;
        `;
        closeBtn.onclick = () => this.hidePanel();

        // Get FCM status
        const status = await this.getFCMStatus();
        
        panel.innerHTML = `
            <h4 style="margin: 0 0 10px 0; color: #4CAF50;">🔧 FCM Debug Panel</h4>
            <div><strong>Permission:</strong> ${status.permission}</div>
            <div><strong>FCM Available:</strong> ${status.fcmAvailable ? '✅' : '❌'}</div>
            <div><strong>Service Worker:</strong> ${status.serviceWorker ? '✅' : '❌'}</div>
            <div><strong>AuthManager:</strong> ${status.authStatus}</div>
            <div><strong>User ID:</strong> ${status.userId || 'Not logged in'}</div>
            <div><strong>FCM Token:</strong> ${status.fcmToken}</div>
            <div><strong>Push Enabled:</strong> ${status.pushEnabled ? '✅' : '❌'}</div>
            <div><strong>Browser:</strong> ${status.browser}</div>
            <hr style="margin: 10px 0; border-color: #333;">
            <button onclick="fcmDebugPanel.requestPermission()" style="background: #4CAF50; color: white; border: none; padding: 5px 10px; border-radius: 4px; margin: 2px;">
                Request Permissions
            </button>
            <button onclick="fcmDebugPanel.refreshPanel()" style="background: #FF9800; color: white; border: none; padding: 5px 10px; border-radius: 4px; margin: 2px;">
                Refresh
            </button>
            <button onclick="fcmDebugPanel.testNotification()" style="background: #2196F3; color: white; border: none; padding: 5px 10px; border-radius: 4px; margin: 2px;">
                Test FCM
            </button>
            <button onclick="fcmDebugPanel.testDirectNotification()" style="background: #9C27B0; color: white; border: none; padding: 5px 10px; border-radius: 4px; margin: 2px;">
                Direct Test
            </button>
        `;

        panel.appendChild(closeBtn);
        document.body.appendChild(panel);
        this.panel = panel;
        this.isVisible = true;

        // Make it globally accessible
        window.fcmDebugPanel = this;
    }

    async getFCMStatus() {
        try {
            console.log('🔍 Getting FCM status...');
            
            // Wait for AuthManager to be ready
            let authStatus = 'Missing';
            if (window.authManager) {
                if (window.authManager.initialized) {
                    authStatus = '✅ Ready';
                } else {
                    // Wait a bit for initialization
                    console.log('⏳ Waiting for AuthManager initialization...');
                    let attempts = 0;
                    while (!window.authManager.initialized && attempts < 20) {
                        await new Promise(resolve => setTimeout(resolve, 250));
                        attempts++;
                    }
                    authStatus = window.authManager.initialized ? '✅ Ready' : '⏳ Still Loading';
                }
            }
            
            const permission = ('Notification' in window) ? Notification.permission : 'not-supported';
            const fcmAvailable = typeof importScripts !== 'undefined' || 'serviceWorker' in navigator;
            const serviceWorker = 'serviceWorker' in navigator;
            
            let token = 'Not available';
            let pushEnabled = false;
            
            if (window.authManager && window.authManager.initialized && window.authManager.currentUser) {
                try {
                    const messaging = (await import('./config.js')).messaging;
                    if (messaging && permission === 'granted') {
                        const currentToken = await messaging.getToken();
                        token = currentToken ? `${currentToken.substring(0, 20)}...` : 'No token';
                        pushEnabled = !!currentToken;
                    }
                } catch (error) {
                    console.warn('Could not get FCM token:', error);
                    token = 'Error getting token';
                }
            }
            
            return {
                permission,
                fcmAvailable,
                serviceWorker,
                authStatus,
                token,
                pushEnabled
            };
        } catch (error) {
            console.error('Error getting FCM status:', error);
            return {
                permission: 'Error',
                fcmAvailable: false,
                serviceWorker: false,
                authStatus: 'Error',
                token: 'Error',
                pushEnabled: false
            };
        }
    }

    async requestPermission() {
        // Better AuthManager detection
        const maxWait = 10000; // 10 seconds
        const startTime = Date.now();
        
        while (!window.authManager && (Date.now() - startTime) < maxWait) {
            await new Promise(resolve => setTimeout(resolve, 500));
        }
        
        if (!window.authManager) {
            alert('AuthManager failed to load. Try refreshing the page.');
            return;
        }
        
        // Wait for auth manager to be fully initialized
        let attempts = 0;
        while (!window.authManager.initialized && attempts < 20) {
            await new Promise(resolve => setTimeout(resolve, 500));
            attempts++;
        }
        
        if (!window.authManager.initialized) {
            alert('AuthManager not initialized. Try refreshing the page.');
            return;
        }
        
        try {
            const result = await window.authManager.requestNotificationPermission();
            alert('Permission result: ' + result);
            await new Promise(resolve => setTimeout(resolve, 2000));
            this.refreshPanel();
        } catch (error) {
            alert('Permission request failed: ' + error.message);
            console.error('Permission error:', error);
        }
    }

    async testNotification() {
        if (window.authManager && window.authManager.currentUser) {
            try {
                await window.authManager.createNotification(
                    window.authManager.currentUser.uid,
                    'test',
                    'Test notification from debug panel',
                    { source: 'debug_panel' }
                );
                alert('Test notification sent!');
            } catch (error) {
                alert('Test failed: ' + error.message);
                console.error('Test notification error:', error);
            }
        } else {
            alert('Not logged in or AuthManager not ready');
        }
    }

    async refreshPanel() {
        if (this.panel) {
            this.hidePanel();
            await new Promise(resolve => setTimeout(resolve, 500));
            this.showPanel();
        }
    }

    showPanel() {
        if (!this.isVisible) {
            this.createDebugPanel();
        }
    }

    hidePanel() {
        if (this.panel) {
            this.panel.remove();
            this.panel = null;
            this.isVisible = false;
        }
    }

    async testDirectNotification() {
        try {
            // Test direct browser notification first
            if ('Notification' in window && Notification.permission === 'granted') {
                new Notification('Direct Browser Test', {
                    body: 'This bypasses FCM - if you see this, browser notifications work',
                    icon: '/icons/icon-192x192.png',
                    tag: 'direct-test'
                });
                alert('Direct browser notification sent! Check if it appeared.');
            } else {
                alert('Notification permission not granted or not available');
            }
        } catch (error) {
            alert('Direct test failed: ' + error.message);
            console.error('Direct test error:', error);
        }
    }
    setupKeyboardShortcut() {
        document.addEventListener('keydown', (e) => {
            // Press Ctrl+Shift+D (or Cmd+Shift+D on Mac) to toggle debug panel
            if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'D') {
                e.preventDefault();
                if (this.isVisible) {
                    this.hidePanel();
                } else {
                    this.showPanel();
                }
            }
        });
    }
}

// Create global instance
const fcmDebugPanel = new FCMDebugPanel();
fcmDebugPanel.setupKeyboardShortcut();

// Also expose it globally for easy access
window.fcmDebugPanel = fcmDebugPanel;