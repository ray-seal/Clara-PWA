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
            <div><strong>AuthManager:</strong> ${window.authManager ? (window.authManager.initialized ? '✅ Ready' : '⏳ Loading') : '❌ Missing'}</div>
            <div><strong>User ID:</strong> ${status.userId || 'Not logged in'}</div>
            <div><strong>FCM Token:</strong> ${status.fcmToken}</div>
            <div><strong>Push Enabled:</strong> ${status.pushEnabled ? '✅' : '❌'}</div>
            <div><strong>Browser:</strong> ${status.browser}</div>
            <hr style="margin: 10px 0; border-color: #333;">
            <button onclick="fcmDebugPanel.requestPermission()" style="background: #4CAF50; color: white; border: none; padding: 5px 10px; border-radius: 4px; margin: 2px;">
                Request Permissions
            </button>
            <button onclick="fcmDebugPanel.refreshPanel()" style="background: #FF9800; color: white; border: none; padding: 5px 10px; border-radius: 4px; margin: 2px;">
                Refresh Status
            </button>
            <button onclick="fcmDebugPanel.testNotification()" style="background: #2196F3; color: white; border: none; padding: 5px 10px; border-radius: 4px; margin: 2px;">
                Test Notification
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
        const status = {
            permission: Notification.permission,
            fcmAvailable: !!window.messaging,
            serviceWorker: 'serviceWorker' in navigator,
            userId: null,
            fcmToken: 'Loading...',
            pushEnabled: false,
            browser: navigator.userAgent.includes('iPhone') ? 'iPhone Safari' : 
                    navigator.userAgent.includes('Android') ? 'Android' : 'Desktop'
        };

        // Wait for auth manager and current user
        if (window.authManager) {
            // Wait a bit for auth state to be established
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // Try multiple ways to get the current user
            let currentUser = window.authManager.currentUser;
            
            if (!currentUser && window.authManager.auth) {
                currentUser = window.authManager.auth.currentUser;
            }
            
            if (!currentUser) {
                // Wait for auth state change
                await new Promise((resolve) => {
                    const unsubscribe = window.authManager.onAuthStateChange((user) => {
                        currentUser = user;
                        unsubscribe();
                        resolve();
                    });
                    // Timeout after 3 seconds
                    setTimeout(() => {
                        unsubscribe();
                        resolve();
                    }, 3000);
                });
            }
            
            status.userId = currentUser?.uid || 'Auth state not ready';

            // Get FCM token from profile if user is logged in
            if (currentUser?.uid) {
                try {
                    const doc = await window.authManager.db.doc(`profiles/${currentUser.uid}`).get();
                    const data = doc.data();
                    status.fcmToken = data?.fcmToken ? `✅ Saved (${data.fcmToken.length} chars)` : '❌ Missing';
                    status.pushEnabled = data?.pushNotificationsEnabled || false;
                } catch (error) {
                    status.fcmToken = '❌ Error loading: ' + error.message;
                }
            }
        } else {
            status.userId = 'AuthManager not loaded';
        }

        return status;
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
                    'Test notification from debug panel'
                );
                alert('Test notification sent!');
            } catch (error) {
                alert('Test failed: ' + error.message);
            }
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

    // Method to show/hide panel with a key combination
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