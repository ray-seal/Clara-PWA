// Clara PWA - Authentication Manager
import { auth, db, COLLECTIONS } from './config.js';
import { 
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
    updateProfile
} from 'https://www.gstatic.com/firebasejs/10.3.0/firebase-auth.js';
import { doc, setDoc, getDoc } from 'https://www.gstatic.com/firebasejs/10.3.0/firebase-firestore.js';

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
    async signUp(email, password, displayName) {
        try {
            console.log('📝 Creating new user account...');
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;
            
            // Update display name
            await updateProfile(user, { displayName });
            
            // Create user profile
            await this.createUserProfile(user, displayName);
            
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
                // Create new profile
                await this.createUserProfile(user, user.displayName || 'Anonymous');
            }
            
            return profileDoc.data();
        } catch (error) {
            console.error('❌ Error getting user profile:', error);
            return null;
        }
    }

    // Create user profile
    async createUserProfile(user, displayName) {
        try {
            const profile = {
                uid: user.uid,
                email: user.email,
                displayName: displayName,
                createdAt: new Date(),
                isPrivate: true, // Default to private for mental health safety
                bio: '',
                avatar: null
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
}

// Create and export auth manager instance
export const authManager = new AuthManager();