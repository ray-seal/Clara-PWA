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
            <div><strong>User ID:</strong> ${status.userId || 'Not logged in'}</div>
            <div><strong>FCM Token:</strong> ${status.fcmToken}</div>
            <div><strong>Push Enabled:</strong> ${status.pushEnabled ? '✅' : '❌'}</div>
            <div><strong>Browser:</strong> ${status.browser}</div>
            <hr style="margin: 10px 0; border-color: #333;">
            <button onclick="fcmDebugPanel.requestPermission()" style="background: #4CAF50; color: white; border: none; padding: 5px 10px; border-radius: 4px; margin: 2px;">
                Request Permissions
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
            userId: window.authManager?.currentUser?.uid || null,
            fcmToken: 'Loading...',
            pushEnabled: false,
            browser: navigator.userAgent.includes('iPhone') ? 'iPhone Safari' : 
                    navigator.userAgent.includes('Android') ? 'Android' : 'Desktop'
        };

        // Get FCM token from profile if user is logged in
        if (status.userId && window.authManager) {
            try {
                const doc = await window.authManager.db.doc(`profiles/${status.userId}`).get();
                const data = doc.data();
                status.fcmToken = data?.fcmToken ? `✅ Saved (${data.fcmToken.length} chars)` : '❌ Missing';
                status.pushEnabled = data?.pushNotificationsEnabled || false;
            } catch (error) {
                status.fcmToken = '❌ Error loading';
            }
        }

        return status;
    }

    async requestPermission() {
        if (window.authManager) {
            try {
                await window.authManager.requestNotificationPermission();
                this.refreshPanel();
            } catch (error) {
                alert('Permission request failed: ' + error.message);
            }
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
            const status = await this.getFCMStatus();
            // Update the content (simplified for this example)
            location.reload(); // For now, just reload
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