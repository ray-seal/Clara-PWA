// Clara PWA - Authentication Manager
import { auth, db, storage, COLLECTIONS } from './config.js';
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
    arrayRemove
} from 'https://www.gstatic.com/firebasejs/10.3.0/firebase-firestore.js';
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
            'helpful_response': 5,
            'weekly_active': 10
        };

        const points = pointValues[actionType] || 0;
        if (points === 0) return;

        try {
            const profileRef = doc(db, COLLECTIONS.PROFILES, userId);
            const profileDoc = await getDoc(profileRef);
            
            if (profileDoc.exists()) {
                const currentData = profileDoc.data();
                const newPoints = (currentData.points || 0) + points;
                const newLevel = this.calculateLevel(newPoints);
                
                await updateDoc(profileRef, {
                    points: newPoints,
                    level: newLevel,
                    [`stats.${actionType}Count`]: increment(1)
                });

                console.log(`✅ Awarded ${points} points for ${actionType}. Total: ${newPoints}, Level: ${newLevel}`);
            }
        } catch (error) {
            console.error('❌ Error awarding points:', error);
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
            const profileDoc = await getDoc(doc(db, COLLECTIONS.PROFILES, uid));
            return profileDoc.exists() ? profileDoc.data() : null;
        } catch (error) {
            console.error('❌ Error getting user profile:', error);
            throw error;
        }
    }

    // Create a new post
    async createPost(content, imageFile = null) {
        if (!this.currentUser) throw new Error('Not authenticated');

        try {
            let imageUrl = null;
            
            // Upload image if provided
            if (imageFile) {
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

            const postRef = await addDoc(collection(db, COLLECTIONS.POSTS), postData);
            
            // Award points for creating a post
            await this.awardPoints(this.currentUser.uid, 'post');

            console.log('✅ Post created successfully');
            return postRef.id;
        } catch (error) {
            console.error('❌ Error creating post:', error);
            throw error;
        }
    }

    // Get posts for feed
    async getPosts(limit = 20) {
        try {
            const postsQuery = query(
                collection(db, COLLECTIONS.POSTS),
                orderBy('createdAt', 'desc'),
                limit(limit)
            );
            
            const snapshot = await getDocs(postsQuery);
            const posts = [];
            
            for (const doc of snapshot.docs) {
                const postData = { id: doc.id, ...doc.data() };
                
                // Get author profile
                const authorProfile = await this.getUserProfile(postData.uid);
                postData.author = authorProfile;
                
                posts.push(postData);
            }
            
            return posts;
        } catch (error) {
            console.error('❌ Error getting posts:', error);
            throw error;
        }
    }

    // Like/unlike a post
    async toggleLike(postId) {
        if (!this.currentUser) throw new Error('Not authenticated');

        try {
            const postRef = doc(db, COLLECTIONS.POSTS, postId);
            const postDoc = await getDoc(postRef);
            
            if (!postDoc.exists()) throw new Error('Post not found');
            
            const postData = postDoc.data();
            const likes = postData.likes || [];
            const userLiked = likes.includes(this.currentUser.uid);
            
            if (userLiked) {
                // Remove like
                await updateDoc(postRef, {
                    likes: arrayRemove(this.currentUser.uid),
                    likesCount: increment(-1)
                });
            } else {
                // Add like
                await updateDoc(postRef, {
                    likes: arrayUnion(this.currentUser.uid),
                    likesCount: increment(1)
                });
                
                // Award points for liking
                await this.awardPoints(this.currentUser.uid, 'like');
            }
            
            return !userLiked; // Return new like state
        } catch (error) {
            console.error('❌ Error toggling like:', error);
            throw error;
        }
    }

    // Add comment to post
    async addComment(postId, content) {
        if (!this.currentUser) throw new Error('Not authenticated');

        try {
            const commentData = {
                postId: postId,
                uid: this.currentUser.uid,
                content: content.trim(),
                createdAt: new Date()
            };

            await addDoc(collection(db, COLLECTIONS.COMMENTS), commentData);
            
            // Update post comment count
            const postRef = doc(db, COLLECTIONS.POSTS, postId);
            await updateDoc(postRef, {
                commentsCount: increment(1)
            });
            
            // Award points for commenting
            await this.awardPoints(this.currentUser.uid, 'comment');

            console.log('✅ Comment added successfully');
        } catch (error) {
            console.error('❌ Error adding comment:', error);
            throw error;
        }
    }

    // Get comments for a post
    async getComments(postId) {
        try {
            const commentsQuery = query(
                collection(db, COLLECTIONS.COMMENTS),
                where('postId', '==', postId),
                orderBy('createdAt', 'asc')
            );
            
            const snapshot = await getDocs(commentsQuery);
            const comments = [];
            
            for (const doc of snapshot.docs) {
                const commentData = { id: doc.id, ...doc.data() };
                
                // Get author profile
                const authorProfile = await this.getUserProfile(commentData.uid);
                commentData.author = authorProfile;
                
                comments.push(commentData);
            }
            
            return comments;
        } catch (error) {
            console.error('❌ Error getting comments:', error);
            throw error;
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
}

// Create and export auth manager instance
export const authManager = new AuthManager();