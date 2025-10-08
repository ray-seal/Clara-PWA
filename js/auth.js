// Clara PWA - Authentication Manager
import { auth, db, storage, messaging, COLLECTIONS } from './config.js';
import { 
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
    updateProfile
} from 'https://www.gstatic.com/firebasejs/10.3.0/firebase-auth.js';
import { 
    doc, 
    setDoc, 
    getDoc, 
    updateDoc, 
    increment,
    addDoc,
    collection,
    query,
    where,
    orderBy,
    limit,
    getDocs,
    deleteDoc,
    arrayUnion,
    arrayRemove,
    onSnapshot,
    serverTimestamp,
    writeBatch
} from 'https://www.gstatic.com/firebasejs/10.3.0/firebase-firestore.js';
import {
    getToken,
    onMessage
} from 'https://www.gstatic.com/firebasejs/10.3.0/firebase-messaging.js';
import { 
    ref, 
    uploadBytes, 
    getDownloadURL 
} from 'https://www.gstatic.com/firebasejs/10.3.0/firebase-storage.js';

class AuthManager {
    constructor() {
        this.currentUser = null;
        this.authStateCallbacks = [];
    }

    // Initialize authentication
    async initialize() {
        console.log('🔐 Initializing authentication...');
        
        // Listen for authentication state changes
        onAuthStateChanged(auth, async (user) => {
            this.currentUser = user;
            
            if (user) {
                console.log('✅ User signed in:', user.email);
                // Get or create user profile
                await this.getOrCreateUserProfile(user);
            } else {
                console.log('👋 User signed out');
            }
            
            // Notify all callbacks
            this.authStateCallbacks.forEach(callback => callback(user));
        });
    }

    // Sign in with email and password
    async signIn(email, password) {
        try {
            console.log('🔑 Signing in user...');
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            console.log('✅ Sign in successful');
            return userCredential.user;
        } catch (error) {
            console.error('❌ Sign in failed:', error);
            throw this.getReadableError(error);
        }
    }

    // Sign up with email and password
    async signUp(email, password, firstName, lastName) {
        try {
            console.log('📝 Creating new user account...');
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;
            
            // Update display name (first name for now)
            await updateProfile(user, { displayName: firstName });
            
            // Create user profile
            await this.createUserProfile(user, firstName, lastName);
            
            console.log('✅ Sign up successful');
            return user;
        } catch (error) {
            console.error('❌ Sign up failed:', error);
            throw this.getReadableError(error);
        }
    }

    // Sign out
    async signOutUser() {
        try {
            console.log('👋 Signing out user...');
            await signOut(auth);
            console.log('✅ Sign out successful');
        } catch (error) {
            console.error('❌ Sign out failed:', error);
            throw error;
        }
    }

    // Get or create user profile
    async getOrCreateUserProfile(user) {
        try {
            const profileDoc = await getDoc(doc(db, COLLECTIONS.PROFILES, user.uid));
            
            if (!profileDoc.exists()) {
                // Create new profile with default values
                await this.createUserProfile(user, user.displayName || 'Anonymous', '');
            }
            
            return profileDoc.data();
        } catch (error) {
            console.error('❌ Error getting user profile:', error);
            return null;
        }
    }

    // Create user profile
    async createUserProfile(user, firstName, lastName) {
        try {
            const profile = {
                uid: user.uid,
                email: user.email,
                firstName: firstName || '',
                lastName: lastName || '',
                displayName: user.displayName || firstName || '',
                createdAt: new Date(),
                isPrivate: true, // Default to private for mental health safety
                isAdmin: false, // Default to non-admin
                showRealName: false, // Default to hide real name for privacy
                bio: '',
                avatarUrl: null,
                points: 0, // Start with 0 points
                level: 1, // Start at level 1
                stats: {
                    postsCount: 0,
                    commentsCount: 0,
                    likesGivenCount: 0,
                    likesReceivedCount: 0
                }
            };

            await setDoc(doc(db, COLLECTIONS.PROFILES, user.uid), profile);
            console.log('✅ User profile created');
        } catch (error) {
            console.error('❌ Error creating user profile:', error);
            throw error;
        }
    }

    // Listen for auth state changes
    onAuthStateChange(callback) {
        this.authStateCallbacks.push(callback);
        
        // Call immediately with current state
        if (this.currentUser !== null) {
            callback(this.currentUser);
        }
    }

    // Get current user
    getCurrentUser() {
        return this.currentUser;
    }

    // Convert Firebase error to readable message
    getReadableError(error) {
        const errorMessages = {
            'auth/user-not-found': 'No account found with this email address.',
            'auth/wrong-password': 'Incorrect password. Please try again.',
            'auth/email-already-in-use': 'An account with this email already exists.',
            'auth/weak-password': 'Password should be at least 6 characters.',
            'auth/invalid-email': 'Please enter a valid email address.',
            'auth/user-disabled': 'This account has been disabled.',
            'auth/too-many-requests': 'Too many failed attempts. Please try again later.',
            'auth/network-request-failed': 'Network error. Please check your connection.'
        };

        return new Error(errorMessages[error.code] || 'An unexpected error occurred. Please try again.');
    }

    // Calculate level from points (progressive system)
    calculateLevel(points) {
        const levelThresholds = [
            { level: 1, points: 0 },      // Level 1: 0-9 points
            { level: 2, points: 10 },     // Level 2: 10-24 points  
            { level: 3, points: 25 },     // Level 3: 25-49 points
            { level: 4, points: 50 },     // Level 4: 50-99 points
            { level: 5, points: 100 },    // Level 5: 100-199 points
            { level: 6, points: 200 },    // Level 6: 200-349 points
            { level: 7, points: 350 },    // Level 7: 350-549 points
            { level: 8, points: 550 },    // Level 8: 550-799 points
            { level: 9, points: 800 },    // Level 9: 800-1199 points
            { level: 10, points: 1200 },  // Level 10: 1200+ points
        ];

        for (let i = levelThresholds.length - 1; i >= 0; i--) {
            if (points >= levelThresholds[i].points) {
                return levelThresholds[i].level;
            }
        }
        return 1;
    }

    // Get points needed for next level
    getPointsForNextLevel(currentPoints) {
        const currentLevel = this.calculateLevel(currentPoints);
        const nextLevelThresholds = [10, 25, 50, 100, 200, 350, 550, 800, 1200];
        
        if (currentLevel >= 10) {
            return null; // Max level reached
        }
        
        const nextLevelPoints = nextLevelThresholds[currentLevel - 1];
        return nextLevelPoints - currentPoints;
    }

    // Award points for various actions
    async awardPoints(userId, actionType) {
        const pointValues = {
            'post': 3,
            'comment': 2,
            'like': 1,
            'likeReceived': 3,
            'helpful_response': 5,
            'weekly_active': 10,
            'chatMessage': 3,
            'heartReaction': 1,
            'meditationSession': 10
        };

        const points = pointValues[actionType] || 0;
        if (points === 0) return;

        try {
            console.log(`🎯 Awarding ${points} points for ${actionType} to user ${userId}`);
            
            const profileRef = doc(db, COLLECTIONS.PROFILES, userId);
            const profileDoc = await getDoc(profileRef);
            
            if (profileDoc.exists()) {
                const currentData = profileDoc.data();
                const newPoints = (currentData.points || 0) + points;
                const newLevel = this.calculateLevel(newPoints);
                
                // Prepare the update data
                const updateData = {
                    points: newPoints,
                    level: newLevel
                };

                // Update the appropriate stats counter
                if (actionType === 'post') {
                    updateData['stats.postsCount'] = increment(1);
                } else if (actionType === 'comment') {
                    updateData['stats.commentsCount'] = increment(1);
                } else if (actionType === 'like') {
                    updateData['stats.likesGivenCount'] = increment(1);
                }

                await updateDoc(profileRef, updateData);

                console.log(`✅ Awarded ${points} points for ${actionType}. Total: ${newPoints}, Level: ${newLevel}`);
                
                // Return new stats for UI updates
                return {
                    points: newPoints,
                    level: newLevel,
                    actionType: actionType
                };
            } else {
                console.warn(`⚠️ Profile not found for user ${userId}`);
            }
        } catch (error) {
            console.error('❌ Error awarding points:', error);
            throw error;
        }
    }

    // Upload profile picture
    async uploadProfilePicture(file) {
        if (!this.currentUser) throw new Error('Not authenticated');
        
        const maxSize = 5 * 1024 * 1024; // 5MB
        if (file.size > maxSize) {
            throw new Error('Image must be less than 5MB');
        }

        if (!file.type.startsWith('image/')) {
            throw new Error('Please select an image file');
        }

        try {
            const fileRef = ref(storage, `avatars/${this.currentUser.uid}/${Date.now()}_${file.name}`);
            const snapshot = await uploadBytes(fileRef, file);
            const downloadURL = await getDownloadURL(snapshot.ref);
            
            // Update profile with new avatar URL
            const profileRef = doc(db, COLLECTIONS.PROFILES, this.currentUser.uid);
            await updateDoc(profileRef, {
                avatarUrl: downloadURL
            });

            console.log('✅ Profile picture uploaded successfully');
            return downloadURL;
        } catch (error) {
            console.error('❌ Error uploading profile picture:', error);
            
            // Provide more specific error messages
            if (error.code === 'storage/unauthorized') {
                throw new Error('Permission denied. Please contact support if this persists.');
            } else if (error.code === 'storage/canceled') {
                throw new Error('Upload was canceled. Please try again.');
            } else if (error.code === 'storage/quota-exceeded') {
                throw new Error('Storage quota exceeded. Please try a smaller image.');
            } else if (error.code === 'storage/invalid-format') {
                throw new Error('Invalid image format. Please use JPG, PNG, or GIF.');
            } else {
                throw new Error(`Upload failed: ${error.message || 'Unknown error occurred'}`);
            }
        }
    }

    // Update user profile information
    async updateProfile(profileData) {
        if (!this.currentUser) throw new Error('Not authenticated');

        try {
            const profileRef = doc(db, COLLECTIONS.PROFILES, this.currentUser.uid);
            
            // Prepare update data
            const updateData = {
                ...profileData,
                updatedAt: new Date()
            };

            // Update Firebase Auth display name if firstName changed
            if (profileData.firstName && profileData.firstName !== this.currentUser.displayName) {
                await updateProfile(this.currentUser, { 
                    displayName: profileData.displayName || profileData.firstName 
                });
            }

            // Update Firestore profile
            await updateDoc(profileRef, updateData);
            
            console.log('✅ Profile updated successfully');
            return true;
        } catch (error) {
            console.error('❌ Error updating profile:', error);
            throw error;
        }
    }

    // Get user profile data
    async getUserProfile(userId = null) {
        const uid = userId || this.currentUser?.uid;
        if (!uid) throw new Error('No user ID provided');

        try {
            console.log(`👤 Getting profile for user: ${uid}`);
            const profileDoc = await getDoc(doc(db, COLLECTIONS.PROFILES, uid));
            console.log(`📋 Profile exists: ${profileDoc.exists()}`);
            
            if (profileDoc.exists()) {
                const profileData = profileDoc.data();
                console.log(`✅ Profile loaded for ${profileData.displayName || 'Unknown'}`);
                return profileData;
            } else {
                console.log(`⚠️ No profile found for user: ${uid}`);
                return null;
            }
        } catch (error) {
            console.error('❌ Error getting user profile:', error);
            console.error('❌ Error code:', error.code);
            console.error('❌ Error message:', error.message);
            throw error;
        }
    }

    // Create a new post
    async createPost(content, imageFile = null) {
        if (!this.currentUser) throw new Error('Not authenticated');

        try {
            console.log('📝 Creating new post...');
            let imageUrl = null;
            
            // Upload image if provided
            if (imageFile) {
                console.log('📷 Uploading image...');
                const maxSize = 5 * 1024 * 1024; // 5MB
                if (imageFile.size > maxSize) {
                    throw new Error('Image must be less than 5MB');
                }
                if (!imageFile.type.startsWith('image/')) {
                    throw new Error('Please select an image file');
                }

                const fileRef = ref(storage, `posts/${this.currentUser.uid}/${Date.now()}_${imageFile.name}`);
                const snapshot = await uploadBytes(fileRef, imageFile);
                imageUrl = await getDownloadURL(snapshot.ref);
                console.log('✅ Image uploaded successfully');
            }

            // Create post document
            const postData = {
                uid: this.currentUser.uid,
                content: content.trim(),
                imageUrl: imageUrl,
                createdAt: new Date(),
                likes: [],
                likesCount: 0,
                commentsCount: 0,
                isReported: false,
                reports: []
            };

            console.log('💾 Saving post to database...');
            const postRef = await addDoc(collection(db, COLLECTIONS.POSTS), postData);
            
            // Award points for creating a post
            console.log('🎯 Awarding points...');
            await this.awardPoints(this.currentUser.uid, 'post');

            console.log('✅ Post created successfully with ID:', postRef.id);
            return postRef.id;
        } catch (error) {
            console.error('❌ Error creating post:', error);
            
            // Provide more specific error messages
            if (error.code === 'storage/unauthorized') {
                throw new Error('Permission denied for image upload. Please check storage rules.');
            } else if (error.code === 'permission-denied') {
                throw new Error('Permission denied. Please check Firestore security rules.');
            } else if (error.message.includes('Image must be')) {
                throw error; // Re-throw validation errors as-is
            } else {
                throw new Error(`Failed to create post: ${error.message}`);
            }
        }
    }

    // Get posts for feed
    async getPosts() {
        try {
            console.log('📥 Fetching posts from Firebase...');
            
            // Check if user is authenticated
            if (!this.currentUser) {
                throw new Error('User not authenticated');
            }
            
            const postsQuery = query(
                collection(db, COLLECTIONS.POSTS),
                orderBy('createdAt', 'desc')
            );
            
            const snapshot = await getDocs(postsQuery);
            console.log(`📊 Found ${snapshot.docs.length} posts in database`);
            
            const posts = [];
            
            for (const doc of snapshot.docs) {
                const postData = { id: doc.id, ...doc.data() };
                
                try {
                    // Get author profile
                    const authorProfile = await this.getUserProfile(postData.uid);
                    postData.author = authorProfile || {
                        displayName: 'Unknown User',
                        firstName: 'Unknown',
                        lastName: 'User',
                        showRealName: false,
                        avatarUrl: null
                    };
                    
                    posts.push(postData);
                } catch (profileError) {
                    console.warn('⚠️ Error loading author profile for post:', doc.id, profileError);
                    // Still include post with default author info
                    postData.author = {
                        displayName: 'Unknown User',
                        firstName: 'Unknown',
                        lastName: 'User',
                        showRealName: false,
                        avatarUrl: null
                    };
                    posts.push(postData);
                }
            }
            
            console.log(`✅ Successfully processed ${posts.length} posts`);
            return posts;
        } catch (error) {
            console.error('❌ Error getting posts:', error);
            
            // Provide more specific error information
            if (error.code === 'permission-denied') {
                throw new Error('Permission denied. Please check Firestore security rules.');
            } else if (error.code === 'unavailable') {
                throw new Error('Firebase is currently unavailable. Please try again later.');
            } else {
                throw new Error(`Failed to load posts: ${error.message}`);
            }
        }
    }

    // Like/unlike a post
    async toggleLike(postId) {
        if (!this.currentUser) throw new Error('Not authenticated');

        try {
            console.log(`👍 Toggling like for post ${postId}...`);
            console.log(`👤 Current user: ${this.currentUser.uid}`);
            
            const postRef = doc(db, COLLECTIONS.POSTS, postId);
            console.log(`📄 Getting post document...`);
            const postDoc = await getDoc(postRef);
            
            if (!postDoc.exists()) throw new Error('Post not found');
            
            const postData = postDoc.data();
            const likes = postData.likes || [];
            const userLiked = likes.includes(this.currentUser.uid);
            const postAuthorId = postData.uid;
            
            if (userLiked) {
                // Remove like
                await updateDoc(postRef, {
                    likes: arrayRemove(this.currentUser.uid),
                    likesCount: increment(-1)
                });
                
                // Remove points from liker and post author
                await this.removePoints(this.currentUser.uid, 'like');
                if (postAuthorId !== this.currentUser.uid) {
                    await this.removePoints(postAuthorId, 'likeReceived');
                }
                
                console.log('👎 Like removed');
            } else {
                // Add like
                await updateDoc(postRef, {
                    likes: arrayUnion(this.currentUser.uid),
                    likesCount: increment(1)
                });
                
                // Award points to liker
                await this.awardPoints(this.currentUser.uid, 'like');
                
                // Award points to post author (if different from liker)
                if (postAuthorId !== this.currentUser.uid) {
                    await this.awardPointsForReceivingLike(postAuthorId);
                    
                    // Create notification for post author
                    try {
                        await this.createNotification(
                            postAuthorId,
                            'like',
                            `${this.currentUser.displayName || 'Someone'} liked your post`,
                            {
                                postId: postId,
                                fromUserId: this.currentUser.uid,
                                fromUserName: this.currentUser.displayName || 'Someone'
                            }
                        );
                    } catch (notifError) {
                        console.warn('⚠️ Failed to create like notification:', notifError);
                    }
                }
                
                console.log('👍 Like added');
            }
            
            return !userLiked; // Return new like state
        } catch (error) {
            console.error('❌ Error toggling like:', error);
            console.error('❌ Like error code:', error.code);
            console.error('❌ Like error message:', error.message);
            console.error('❌ Full like error:', error);
            throw error;
        }
    }

    // Award points for receiving a like
    async awardPointsForReceivingLike(userId) {
        try {
            console.log(`🎯 Awarding like-received points to user ${userId}`);
            
            // Use the main awardPoints function which handles both points and stats
            await this.awardPoints(userId, 'likeReceived');
            
            console.log('✅ Like-received points awarded');
        } catch (error) {
            console.error('❌ Error awarding like-received points:', error);
        }
    }

    // Remove points (for unlike actions)
    async removePoints(userId, actionType) {
        try {
            console.log(`📉 Removing points for ${actionType} from user ${userId}`);
            
            const profileRef = doc(db, COLLECTIONS.PROFILES, userId);
            const profileDoc = await getDoc(profileRef);
            
            if (profileDoc.exists()) {
                const currentData = profileDoc.data();
                const pointValues = { 
                    'like': 1, 
                    'likeReceived': 3,
                    'comment': 2,
                    'post': 3,
                    'chatMessage': 3,
                    'heartReaction': 1
                };
                const pointsToRemove = pointValues[actionType] || 0;
                
                const newPoints = Math.max(0, (currentData.points || 0) - pointsToRemove);
                const newLevel = this.calculateLevel(newPoints);
                
                const updateData = {
                    points: newPoints,
                    level: newLevel
                };

                if (actionType === 'like') {
                    updateData['stats.likesGivenCount'] = increment(-1);
                } else if (actionType === 'likeReceived') {
                    updateData['stats.likesReceivedCount'] = increment(-1);
                }

                await updateDoc(profileRef, updateData);
                console.log(`✅ Removed ${pointsToRemove} points for ${actionType}`);
            }
        } catch (error) {
            console.error('❌ Error removing points:', error);
        }
    }

    // Add comment to post
    async addComment(postId, content) {
        if (!this.currentUser) throw new Error('Not authenticated');

        try {
            console.log(`💬 Adding comment to post ${postId}...`);
            console.log(`👤 Current user: ${this.currentUser.uid}`);
            console.log(`📝 Comment content: ${content.trim()}`);
            
            // Get post to find the author
            const postRef = doc(db, COLLECTIONS.POSTS, postId);
            const postDoc = await getDoc(postRef);
            const postData = postDoc.data();
            const postAuthorId = postData?.uid;
            
            const commentData = {
                postId: postId,
                uid: this.currentUser.uid,
                content: content.trim(),
                createdAt: new Date()
            };

            console.log(`📦 Comment data:`, commentData);
            await addDoc(collection(db, COLLECTIONS.COMMENTS), commentData);
            
            // Update post comment count
            await updateDoc(postRef, {
                commentsCount: increment(1)
            });
            
            // Award points for commenting
            await this.awardPoints(this.currentUser.uid, 'comment');
            
            // Create notification for post author (if different from commenter)
            if (postAuthorId && postAuthorId !== this.currentUser.uid) {
                try {
                    await this.createNotification(
                        postAuthorId,
                        'comment',
                        `${this.currentUser.displayName || 'Someone'} commented on your post`,
                        {
                            postId: postId,
                            commentContent: content.trim(),
                            fromUserId: this.currentUser.uid,
                            fromUserName: this.currentUser.displayName || 'Someone'
                        }
                    );
                } catch (notifError) {
                    console.warn('⚠️ Failed to create comment notification:', notifError);
                }
            }

            console.log('✅ Comment added successfully');
        } catch (error) {
            console.error('❌ Error adding comment:', error);
            console.error('❌ Comment error code:', error.code);
            console.error('❌ Comment error message:', error.message);
            console.error('❌ Full comment error:', error);
            throw error;
        }
    }

    // Get comments for a post
    async getComments(postId) {
        try {
            console.log(`📥 Loading comments for post ${postId}...`);
            console.log(`🔗 Collection: ${COLLECTIONS.COMMENTS}`);
            console.log(`👤 Current user:`, this.currentUser?.uid);
            
            const commentsQuery = query(
                collection(db, COLLECTIONS.COMMENTS),
                where('postId', '==', postId)
            );
            
            console.log(`🔍 Executing comments query for postId: ${postId}`);
            const snapshot = await getDocs(commentsQuery);
            console.log(`📊 Found ${snapshot.docs.length} comments`);
            
            const comments = [];
            
            for (const doc of snapshot.docs) {
                const commentData = { id: doc.id, ...doc.data() };
                
                try {
                    // Get author profile
                    const authorProfile = await this.getUserProfile(commentData.uid);
                    commentData.author = authorProfile || {
                        displayName: 'Unknown User',
                        firstName: 'Unknown',
                        lastName: 'User',
                        showRealName: false,
                        avatarUrl: null
                    };
                    
                    comments.push(commentData);
                } catch (profileError) {
                    console.warn('⚠️ Error loading comment author profile:', doc.id, profileError);
                    // Still include comment with default author info
                    commentData.author = {
                        displayName: 'Unknown User',
                        firstName: 'Unknown',
                        lastName: 'User',
                        showRealName: false,
                        avatarUrl: null
                    };
                    comments.push(commentData);
                }
            }
            
            // Sort comments by creation date (oldest first)
            comments.sort((a, b) => {
                const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt);
                const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt);
                return dateA - dateB;
            });
            
            console.log(`✅ Successfully loaded ${comments.length} comments`);
            return comments;
        } catch (error) {
            console.error('❌ Error getting comments:', error);
            console.error('❌ Error code:', error.code);
            console.error('❌ Error message:', error.message);
            console.error('❌ Full error object:', error);
            
            // Check if it's a Firebase permission error
            if (error.code === 'permission-denied') {
                console.error('🔒 Firestore permission denied for comments collection');
                throw new Error('Permission denied: Unable to read comments. Please check your authentication status.');
            }
            
            throw new Error(`Failed to load comments: ${error.message}`);
        }
    }

    // Delete post (own posts or admin)
    async deletePost(postId) {
        if (!this.currentUser) throw new Error('Not authenticated');

        try {
            const postRef = doc(db, COLLECTIONS.POSTS, postId);
            const postDoc = await getDoc(postRef);
            
            if (!postDoc.exists()) throw new Error('Post not found');
            
            const postData = postDoc.data();
            const userProfile = await this.getUserProfile();
            
            // Check permissions: own post or admin
            if (postData.uid !== this.currentUser.uid && !userProfile.isAdmin) {
                throw new Error('Not authorized to delete this post');
            }
            
            // Delete the post
            await deleteDoc(postRef);
            
            // Delete associated comments
            const commentsQuery = query(
                collection(db, COLLECTIONS.COMMENTS),
                where('postId', '==', postId)
            );
            const commentsSnapshot = await getDocs(commentsQuery);
            
            const deletePromises = commentsSnapshot.docs.map(doc => deleteDoc(doc.ref));
            await Promise.all(deletePromises);
            
            console.log('✅ Post deleted successfully');
        } catch (error) {
            console.error('❌ Error deleting post:', error);
            throw error;
        }
    }

    // Report post
    async reportPost(postId, reason) {
        if (!this.currentUser) throw new Error('Not authenticated');

        try {
            const reportData = {
                postId: postId,
                reportedBy: this.currentUser.uid,
                reason: reason,
                createdAt: new Date(),
                status: 'pending'
            };

            await addDoc(collection(db, COLLECTIONS.REPORTS), reportData);
            
            // Mark post as reported
            const postRef = doc(db, COLLECTIONS.POSTS, postId);
            await updateDoc(postRef, {
                isReported: true,
                reports: arrayUnion(this.currentUser.uid)
            });

            console.log('✅ Post reported successfully');
        } catch (error) {
            console.error('❌ Error reporting post:', error);
            throw error;
        }
    }

    // =====================================================
    // CHAT FUNCTIONALITY
    // =====================================================

    // Send a chat message
    async sendChatMessage(groupId, content) {
        if (!this.currentUser) throw new Error('Not authenticated');

        try {
            console.log(`💬 Sending chat message to ${groupId}...`);
            
            const messageData = {
                groupId: groupId,
                uid: this.currentUser.uid,
                content: content.trim(),
                createdAt: serverTimestamp(),
                heartReactions: []
            };

            const messageRef = await addDoc(collection(db, COLLECTIONS.CHAT_MESSAGES), messageData);
            
            // Award points for chat participation
            await this.awardPoints(this.currentUser.uid, 'chatMessage');
            
            console.log('✅ Chat message sent successfully');
            return messageRef.id;
        } catch (error) {
            console.error('❌ Error sending chat message:', error);
            throw error;
        }
    }

    // Listen to chat messages in real-time
    subscribeToChatMessages(groupId, callback) {
        console.log(`👂 Subscribing to chat messages for ${groupId}...`);
        console.log(`🔗 Collection: ${COLLECTIONS.CHAT_MESSAGES}`);
        console.log(`👤 Current user:`, this.currentUser?.uid);
        
        const messagesQuery = query(
            collection(db, COLLECTIONS.CHAT_MESSAGES),
            where('groupId', '==', groupId),
            orderBy('createdAt', 'asc')
        );

        return onSnapshot(messagesQuery, async (snapshot) => {
            console.log(`📨 Received ${snapshot.docs.length} messages from Firestore`);
            console.log(`🔍 Raw snapshot:`, snapshot.docs.map(doc => ({ id: doc.id, data: doc.data() })));
            
            const messages = [];
            
            for (const doc of snapshot.docs) {
                const messageData = { id: doc.id, ...doc.data() };
                
                try {
                    // Get author profile
                    const authorProfile = await this.getUserProfile(messageData.uid);
                    messageData.author = authorProfile || {
                        displayName: 'Unknown User',
                        firstName: 'Unknown',
                        lastName: 'User',
                        showRealName: false,
                        avatarUrl: null
                    };
                    
                    messages.push(messageData);
                } catch (profileError) {
                    console.warn('⚠️ Error loading message author profile:', doc.id, profileError);
                    messageData.author = {
                        displayName: 'Unknown User',
                        firstName: 'Unknown',
                        lastName: 'User',
                        showRealName: false,
                        avatarUrl: null
                    };
                    messages.push(messageData);
                }
            }
            
            console.log(`✅ Processed ${messages.length} chat messages`);
            console.log(`📤 Calling callback with messages:`, messages);
            callback(messages);
        }, (error) => {
            console.error('❌ Error listening to chat messages:', error);
            console.error('❌ Error code:', error.code);
            console.error('❌ Error message:', error.message);
            callback([]);
        });
    }

    // Toggle heart reaction on a chat message
    async toggleHeartReaction(messageId) {
        if (!this.currentUser) throw new Error('Not authenticated');

        try {
            console.log(`💖 Toggling heart reaction on message ${messageId}...`);
            
            const messageRef = doc(db, COLLECTIONS.CHAT_MESSAGES, messageId);
            const messageDoc = await getDoc(messageRef);
            
            if (!messageDoc.exists()) throw new Error('Message not found');
            
            const messageData = messageDoc.data();
            const reactions = messageData.heartReactions || [];
            const userReacted = reactions.includes(this.currentUser.uid);
            
            if (userReacted) {
                // Remove heart reaction
                await updateDoc(messageRef, {
                    heartReactions: arrayRemove(this.currentUser.uid)
                });
                console.log('💔 Heart reaction removed');
            } else {
                // Add heart reaction
                await updateDoc(messageRef, {
                    heartReactions: arrayUnion(this.currentUser.uid)
                });
                
                // Award points for giving a reaction
                await this.awardPoints(this.currentUser.uid, 'heartReaction');
                console.log('💖 Heart reaction added');
            }
            
            return !userReacted; // Return new reaction state
        } catch (error) {
            console.error('❌ Error toggling heart reaction:', error);
            throw error;
        }
    }

    // Update user presence for active members
    async updateUserPresence(groupId, isActive = true) {
        if (!this.currentUser) return;

        try {
            const presenceRef = doc(db, COLLECTIONS.USER_PRESENCE, `${groupId}_${this.currentUser.uid}`);
            
            if (isActive) {
                await setDoc(presenceRef, {
                    uid: this.currentUser.uid,
                    groupId: groupId,
                    lastSeen: serverTimestamp(),
                    isActive: true
                }, { merge: true });
            } else {
                await updateDoc(presenceRef, {
                    isActive: false,
                    lastSeen: serverTimestamp()
                });
            }
        } catch (error) {
            console.error('❌ Error updating user presence:', error);
        }
    }

    // Listen to active members in real-time
    subscribeToActiveMembers(groupId, callback) {
        console.log(`👥 Subscribing to active members for ${groupId}...`);
        console.log(`🔗 Collection: ${COLLECTIONS.USER_PRESENCE}`);
        console.log(`👤 Current user:`, this.currentUser?.uid);
        
        const presenceQuery = query(
            collection(db, COLLECTIONS.USER_PRESENCE),
            where('groupId', '==', groupId)
        );

        return onSnapshot(presenceQuery, async (snapshot) => {
            console.log(`👥 Found ${snapshot.docs.length} presence records`);
            console.log(`🔍 Raw presence data:`, snapshot.docs.map(doc => ({ id: doc.id, data: doc.data() })));
            
            const activeMembers = [];
            
            for (const doc of snapshot.docs) {
                const presenceData = doc.data();
                
                // Filter for active members only (JavaScript filter instead of Firestore where)
                if (!presenceData.isActive) continue;
                
                try {
                    // Get user profile
                    const userProfile = await this.getUserProfile(presenceData.uid);
                    if (userProfile) {
                        activeMembers.push({
                            uid: presenceData.uid,
                            lastSeen: presenceData.lastSeen,
                            profile: userProfile
                        });
                    }
                } catch (profileError) {
                    console.warn('⚠️ Error loading active member profile:', presenceData.uid, profileError);
                }
            }
            
            // Sort by last seen (most recent first)
            activeMembers.sort((a, b) => {
                const timeA = a.lastSeen?.toDate ? a.lastSeen.toDate() : new Date(a.lastSeen || 0);
                const timeB = b.lastSeen?.toDate ? b.lastSeen.toDate() : new Date(b.lastSeen || 0);
                return timeB - timeA;
            });
            
            console.log(`✅ Processed ${activeMembers.length} active members`);
            callback(activeMembers);
        }, (error) => {
            console.error('❌ Error listening to active members:', error);
            console.error('❌ Error code:', error.code);
            console.error('❌ Error message:', error.message);
            console.error('❌ Full error object:', error);
            callback([]);
        });
    }

    // =====================================================
    // MEDITATION & WELLNESS FUNCTIONALITY
    // =====================================================

    // Save mood assessment
    async saveMoodAssessment(assessmentData) {
        if (!this.currentUser) throw new Error('Not authenticated');

        let retries = 3;
        while (retries > 0) {
            try {
                console.log(`💭 Saving ${assessmentData.type || 'mood'} assessment... (${4 - retries}/3)`);
                
                const dataToSave = {
                    uid: this.currentUser.uid,
                    type: assessmentData.type,
                    meditationType: assessmentData.meditationType,
                    responses: assessmentData, // Store the actual mood data
                    timestamp: assessmentData.timestamp || new Date(),
                    createdAt: serverTimestamp()
                };

                const assessmentRef = await addDoc(collection(db, COLLECTIONS.MOOD_ASSESSMENTS), dataToSave);
                console.log('✅ Mood assessment saved successfully');
                return assessmentRef.id;
            } catch (error) {
                retries--;
                console.error(`❌ Error saving mood assessment (${retries} retries left):`, error);
                
                if (retries === 0) {
                    // If it's a network error, suggest refresh
                    if (error.code === 'unavailable' || error.message.includes('NS_BINDING_ABORTED')) {
                        throw new Error('Network connection issue. Please refresh the page and try again.');
                    }
                    throw error;
                }
                
                // Wait 1 second before retry
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
        }
    }

    // Save meditation session
    async saveMeditationSession(sessionData) {
        if (!this.currentUser) throw new Error('Not authenticated');

        try {
            console.log('🧘‍♀️ Saving meditation session...');
            
            // Calculate duration if startTime and endTime are provided
            let duration = sessionData.duration;
            if (sessionData.startTime && sessionData.endTime) {
                duration = Math.round((sessionData.endTime - sessionData.startTime) / 1000); // Duration in seconds
            }
            
            const session = {
                uid: this.currentUser.uid,
                type: sessionData.type,
                duration: duration || 0,
                completed: sessionData.completed || false,
                startedAt: sessionData.startTime || sessionData.startedAt || new Date(),
                completedAt: sessionData.endTime || sessionData.completedAt || (sessionData.completed ? new Date() : null),
                preMoodData: sessionData.preMoodData || null,
                postMoodData: sessionData.postMoodData || null,
                improvements: sessionData.improvements || null,
                meditationType: sessionData.type,
                createdAt: serverTimestamp()
            };

            const sessionRef = await addDoc(collection(db, COLLECTIONS.MEDITATION_SESSIONS), session);
            
            // Award points for completing meditation
            if (sessionData.completed) {
                await this.awardPoints(this.currentUser.uid, 'meditationSession');
            }
            
            console.log('✅ Meditation session saved successfully');
            return sessionRef.id;
        } catch (error) {
            console.error('❌ Error saving meditation session:', error);
            throw error;
        }
    }

    // Get user's meditation history
    async getMeditationHistory(maxRecords = 20) {
        if (!this.currentUser) throw new Error('Not authenticated');

        try {
            console.log('📊 Fetching meditation history...');
            
            const sessionsQuery = query(
                collection(db, COLLECTIONS.MEDITATION_SESSIONS),
                where('uid', '==', this.currentUser.uid),
                orderBy('createdAt', 'desc'),
                limit(maxRecords)
            );

            const snapshot = await getDocs(sessionsQuery);
            const sessions = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

            console.log(`✅ Found ${sessions.length} meditation sessions`);
            return sessions;
        } catch (error) {
            console.error('❌ Error fetching meditation history:', error);
            throw error;
        }
    }

    // =====================================================
    // NOTIFICATION SYSTEM
    // =====================================================

    // Create a notification
    async createNotification(recipientId, type, message, data = {}) {
        if (!this.currentUser) throw new Error('Not authenticated');

        try {
            console.log(`🔔 Creating notification for user ${recipientId}`);
            
            const notification = {
                recipientId: recipientId,
                senderId: this.currentUser.uid,
                type: type, // 'like', 'comment', 'heart_reaction', etc.
                message: message,
                data: data, // Additional context (postId, messageId, etc.)
                read: false,
                createdAt: serverTimestamp()
            };

            const notificationRef = await addDoc(collection(db, COLLECTIONS.NOTIFICATIONS), notification);
            console.log('✅ Notification created successfully');
            return notificationRef.id;
        } catch (error) {
            console.error('❌ Error creating notification:', error);
            throw error;
        }
    }

    // Get user's notifications
    async getNotifications(limit = 20) {
        if (!this.currentUser) throw new Error('Not authenticated');

        try {
            console.log('🔔 Fetching notifications...');
            
            const notificationsQuery = query(
                collection(db, COLLECTIONS.NOTIFICATIONS),
                where('recipientId', '==', this.currentUser.uid),
                orderBy('createdAt', 'desc'),
                limit(limit)
            );

            const snapshot = await getDocs(notificationsQuery);
            const notifications = await Promise.all(snapshot.docs.map(async (docSnapshot) => {
                const data = docSnapshot.data();
                
                // Get sender profile for display name and avatar
                let senderProfile = null;
                if (data.senderId) {
                    try {
                        const senderDoc = await getDoc(doc(db, COLLECTIONS.PROFILES, data.senderId));
                        if (senderDoc.exists()) {
                            senderProfile = senderDoc.data();
                        }
                    } catch (error) {
                        console.warn('Could not fetch sender profile:', error);
                    }
                }

                return {
                    id: docSnapshot.id,
                    ...data,
                    sender: senderProfile
                };
            }));

            console.log(`✅ Found ${notifications.length} notifications`);
            return notifications;
        } catch (error) {
            console.error('❌ Error fetching notifications:', error);
            throw error;
        }
    }

    // Subscribe to real-time notifications
    subscribeToNotifications(callback) {
        if (!this.currentUser) throw new Error('Not authenticated');

        console.log('👂 Subscribing to notifications...');
        
        const notificationsQuery = query(
            collection(db, COLLECTIONS.NOTIFICATIONS),
            where('recipientId', '==', this.currentUser.uid),
            orderBy('createdAt', 'desc'),
            limit(50)
        );

        return onSnapshot(notificationsQuery, async (snapshot) => {
            console.log(`🔔 Notifications updated: ${snapshot.docs.length} notifications`);
            
            const notifications = await Promise.all(snapshot.docs.map(async (docSnapshot) => {
                const data = docSnapshot.data();
                
                // Get sender profile
                let senderProfile = null;
                if (data.senderId) {
                    try {
                        const senderDoc = await getDoc(doc(db, COLLECTIONS.PROFILES, data.senderId));
                        if (senderDoc.exists()) {
                            senderProfile = senderDoc.data();
                        }
                    } catch (error) {
                        console.warn('Could not fetch sender profile:', error);
                    }
                }

                return {
                    id: docSnapshot.id,
                    ...data,
                    sender: senderProfile
                };
            }));
            
            callback(notifications);
        }, (error) => {
            console.error('❌ Error in notifications subscription:', error);
        });
    }

    // Mark notification as read
    async markNotificationRead(notificationId) {
        if (!this.currentUser) throw new Error('Not authenticated');

        try {
            const notificationRef = doc(db, COLLECTIONS.NOTIFICATIONS, notificationId);
            await updateDoc(notificationRef, {
                read: true,
                readAt: serverTimestamp()
            });
            console.log(`✅ Notification ${notificationId} marked as read`);
        } catch (error) {
            console.error('❌ Error marking notification as read:', error);
            throw error;
        }
    }

    // Mark all notifications as read
    async markAllNotificationsRead() {
        if (!this.currentUser) throw new Error('Not authenticated');

        try {
            const notificationsQuery = query(
                collection(db, COLLECTIONS.NOTIFICATIONS),
                where('recipientId', '==', this.currentUser.uid),
                where('read', '==', false)
            );

            const snapshot = await getDocs(notificationsQuery);
            const batch = writeBatch(db);

            snapshot.docs.forEach((docSnapshot) => {
                batch.update(docSnapshot.ref, {
                    read: true,
                    readAt: serverTimestamp()
                });
            });

            await batch.commit();
            console.log(`✅ Marked ${snapshot.docs.length} notifications as read`);
        } catch (error) {
            console.error('❌ Error marking all notifications as read:', error);
            throw error;
        }
    }

    // Delete notification
    async deleteNotification(notificationId) {
        if (!this.currentUser) throw new Error('Not authenticated');

        try {
            await deleteDoc(doc(db, COLLECTIONS.NOTIFICATIONS, notificationId));
            console.log(`✅ Notification ${notificationId} deleted`);
        } catch (error) {
            console.error('❌ Error deleting notification:', error);
            throw error;
        }
    }

    // Clear all notifications
    async clearAllNotifications() {
        if (!this.currentUser) throw new Error('Not authenticated');

        try {
            const notificationsQuery = query(
                collection(db, COLLECTIONS.NOTIFICATIONS),
                where('recipientId', '==', this.currentUser.uid)
            );

            const snapshot = await getDocs(notificationsQuery);
            const batch = writeBatch(db);

            snapshot.docs.forEach((docSnapshot) => {
                batch.delete(docSnapshot.ref);
            });

            await batch.commit();
            console.log(`✅ Cleared ${snapshot.docs.length} notifications`);
        } catch (error) {
            console.error('❌ Error clearing all notifications:', error);
            throw error;
        }
    }

    // 🔔 PUSH NOTIFICATIONS (FCM) METHODS

    // Request notification permission and get FCM token
    async requestNotificationPermission() {
        try {
            console.log('🔔 Requesting notification permission...');
            
            // Check if notifications are supported
            if (!('Notification' in window)) {
                console.warn('⚠️ This browser does not support notifications');
                return null;
            }

            // Check current permission status
            let permission = Notification.permission;
            console.log('🔔 Current permission status:', permission);

            // Request permission if not already granted
            if (permission === 'default') {
                permission = await Notification.requestPermission();
                console.log('🔔 Permission after request:', permission);
            }

            if (permission === 'granted') {
                // Get FCM token
                const token = await this.getFCMToken();
                if (token) {
                    // Save token to user profile
                    await this.saveFCMToken(token);
                    console.log('✅ Push notifications enabled');
                    return token;
                }
            } else {
                console.log('❌ Notification permission denied');
                return null;
            }
        } catch (error) {
            console.error('❌ Error requesting notification permission:', error);
            return null;
        }
    }

    // Get FCM registration token
    async getFCMToken() {
        try {
            // Register service worker for FCM
            if ('serviceWorker' in navigator) {
                const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
                console.log('✅ FCM Service Worker registered:', registration);
            }

            // Get FCM token
            const token = await getToken(messaging, {
                vapidKey: 'BGyl4BFV2RaioVpj_Ijhy-WXMMjLsg0rw47Tn9MYCPJzm_-VpXNp-ijlli9171TORSO4cMfbefyZbkj_uuCa5vc'
            });

            if (token) {
                console.log('✅ FCM token obtained:', token.substring(0, 20) + '...');
                return token;
            } else {
                console.warn('⚠️ No FCM token available');
                return null;
            }
        } catch (error) {
            console.error('❌ Error getting FCM token:', error);
            return null;
        }
    }

    // Save FCM token to user profile
    async saveFCMToken(token) {
        if (!this.currentUser) return;

        try {
            const profileRef = doc(db, COLLECTIONS.PROFILES, this.currentUser.uid);
            await updateDoc(profileRef, {
                fcmToken: token,
                fcmTokenUpdatedAt: serverTimestamp(),
                pushNotificationsEnabled: true
            });
            console.log('✅ FCM token saved to profile');
        } catch (error) {
            console.error('❌ Error saving FCM token:', error);
        }
    }

    // Setup foreground message listener
    setupForegroundMessageListener() {
        if (!messaging) return;

        onMessage(messaging, (payload) => {
            console.log('🔔 Foreground message received:', payload);

            // Show notification if app is in foreground
            if (Notification.permission === 'granted') {
                const notification = new Notification(
                    payload.notification?.title || 'Clara Notification',
                    {
                        body: payload.notification?.body || 'You have a new notification',
                        icon: '/icons/icon-192x192.png',
                        badge: '/icons/icon-96x96.png',
                        tag: 'clara-notification',
                        data: payload.data
                    }
                );

                // Handle notification click
                notification.onclick = () => {
                    window.focus();
                    notification.close();
                    
                    // Handle specific notification actions if needed
                    if (payload.data?.url) {
                        window.location.href = payload.data.url;
                    }
                };
            }

            // Update notification badge in real-time
            if (window.app && window.app.updateNotificationBadge) {
                window.app.updateNotificationBadge();
            }
        });
    }

    // Disable push notifications
    async disablePushNotifications() {
        if (!this.currentUser) return;

        try {
            const profileRef = doc(db, COLLECTIONS.PROFILES, this.currentUser.uid);
            await updateDoc(profileRef, {
                fcmToken: null,
                pushNotificationsEnabled: false,
                fcmTokenUpdatedAt: serverTimestamp()
            });
            console.log('✅ Push notifications disabled');
        } catch (error) {
            console.error('❌ Error disabling push notifications:', error);
        }
    }

    // Check if push notifications are supported and enabled
    isPushNotificationSupported() {
        return 'Notification' in window && 'serviceWorker' in navigator && messaging;
    }
}

// Create and export auth manager instance
export const authManager = new AuthManager();