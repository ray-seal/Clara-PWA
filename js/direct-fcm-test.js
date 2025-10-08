// Direct FCM Test - bypasses notification system
export class DirectFCMTest {
    static async testDirectFCM() {
        try {
            if (!window.messaging) {
                alert('FCM not available');
                return;
            }

            // Import FCM functions
            const { getToken } = await import('https://www.gstatic.com/firebasejs/10.3.0/firebase-messaging.js');
            
            // Get FCM token directly
            const token = await getToken(window.messaging, {
                vapidKey: 'BKuOyPAqeNTGfCQxjjL3QpXaQrF0QHmN1QoMfMUl9bkLwgzLpJVPQWG5zg3O4s5YFhQ0uUzQQnE0k1kVJ0J1I5A'
            });

            if (token) {
                alert(`FCM Token Generated:\n${token.substring(0, 50)}...`);
                console.log('Direct FCM token:', token);
                
                // Test notification using Notification API
                if ('Notification' in window && Notification.permission === 'granted') {
                    new Notification('Direct Test', {
                        body: 'This is a direct browser notification test',
                        icon: '/icons/icon-192x192.png'
                    });
                }
                
                return token;
            } else {
                alert('Failed to generate FCM token');
            }
        } catch (error) {
            alert('Direct FCM test failed: ' + error.message);
            console.error('Direct FCM error:', error);
        }
    }
}

window.DirectFCMTest = DirectFCMTest;