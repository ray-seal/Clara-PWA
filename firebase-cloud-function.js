// Firebase Cloud Function to send push notifications
// Deploy this to Firebase Functions

const functions = require('firebase-functions');
const admin = require('firebase-admin');

admin.initializeApp();

// Trigger when a new notification is created
exports.sendNotificationPush = functions.firestore
    .document('notifications/{notificationId}')
    .onCreate(async (snap, context) => {
        const notification = snap.data();
        const notificationId = context.params.notificationId;
        
        console.log('📧 New notification created:', notificationId);
        
        try {
            // Get recipient's FCM token
            const userDoc = await admin.firestore()
                .doc(`profiles/${notification.recipientId}`)
                .get();
                
            if (!userDoc.exists) {
                console.log('❌ User profile not found');
                return;
            }
            
            const userData = userDoc.data();
            const fcmToken = userData.fcmToken;
            
            if (!fcmToken || !userData.pushNotificationsEnabled) {
                console.log('⚠️ No FCM token or push notifications disabled');
                return;
            }
            
            // Determine notification icon and action based on type
            let icon = '/icons/icon-192x192.png';
            let clickAction = '/';
            
            if (notification.metadata?.postId) {
                clickAction = `/?post=${notification.metadata.postId}`;
            }
            
            // Send push notification
            const message = {
                token: fcmToken,
                notification: {
                    title: 'Clara',
                    body: notification.message,
                    icon: icon
                },
                data: {
                    notificationId: notificationId,
                    type: notification.type,
                    postId: notification.metadata?.postId || '',
                    url: clickAction
                },
                webpush: {
                    headers: {
                        'TTL': '300'
                    },
                    notification: {
                        icon: icon,
                        badge: '/icons/icon-96x96.png',
                        tag: 'clara-notification',
                        requireInteraction: false,
                        actions: [
                            {
                                action: 'view',
                                title: 'View',
                                icon: '/icons/icon-72x72.png'
                            }
                        ]
                    },
                    fcm_options: {
                        link: clickAction
                    }
                }
            };
            
            const response = await admin.messaging().send(message);
            console.log('✅ Push notification sent:', response);
            
        } catch (error) {
            console.error('❌ Error sending push notification:', error);
            
            // If token is invalid, remove it from user profile
            if (error.code === 'messaging/invalid-registration-token' || 
                error.code === 'messaging/registration-token-not-registered') {
                
                console.log('🧹 Removing invalid FCM token');
                await admin.firestore()
                    .doc(`profiles/${notification.recipientId}`)
                    .update({
                        fcmToken: admin.firestore.FieldValue.delete(),
                        pushNotificationsEnabled: false
                    });
            }
        }
    });

// Clean up old notifications (optional)
exports.cleanupOldNotifications = functions.pubsub
    .schedule('every 24 hours')
    .onRun(async (context) => {
        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - 30); // 30 days old
        
        const oldNotifications = await admin.firestore()
            .collection('notifications')
            .where('createdAt', '<', cutoff)
            .get();
            
        const deletePromises = oldNotifications.docs.map(doc => doc.ref.delete());
        await Promise.all(deletePromises);
        
        console.log(`🧹 Cleaned up ${deletePromises.length} old notifications`);
    });