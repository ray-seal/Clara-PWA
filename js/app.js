// Clara PWA - Main Application
import { authManager } from './auth.js';
import { APP_CONFIG } from './config.js';

class ClaraApp {
    constructor() {
        this.currentTab = 'feed';
        this.initialized = false;
    }

    async initialize() {
        if (this.initialized) return;

        console.log('🚀 Clara Mental Health Support App starting...');

        try {
            // Initialize authentication
            await authManager.initialize();

            // Set up auth state listener
            authManager.onAuthStateChange((user) => {
                if (user) {
                    console.log('✅ User authenticated:', user.email);
                    this.showMainApp();
                } else {
                    console.log('🔐 User not authenticated');
                    this.showAuthScreen();
                }
            });

            // Setup event listeners
            this.setupEventListeners();

            this.initialized = true;
            console.log('✅ Clara app initialized successfully');

        } catch (error) {
            console.error('❌ Error initializing app:', error);
            this.showError('Failed to initialize app. Please refresh and try again.');
        }
    }

    setupEventListeners() {
        // Auth form submissions
        document.getElementById('signin-form-element')?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleSignIn();
        });

        document.getElementById('signup-form-element')?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleSignUp();
        });

        // Form switchers
        document.getElementById('show-signup')?.addEventListener('click', (e) => {
            e.preventDefault();
            this.showSignUpForm();
        });

        document.getElementById('show-signin')?.addEventListener('click', (e) => {
            e.preventDefault();
            this.showSignInForm();
        });

        // Main app navigation
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const tab = btn.dataset.tab;
                if (tab) {
                    this.switchTab(tab);
                }
            });
        });

        // Header buttons
        document.getElementById('logout-btn')?.addEventListener('click', () => {
            this.handleLogout();
        });

        console.log('✅ Event listeners set up');
    }

    async handleSignIn() {
        const email = document.getElementById('signin-email').value;
        const password = document.getElementById('signin-password').value;

        if (!email || !password) {
            this.showError('Please fill in all fields');
            return;
        }

        const submitBtn = document.querySelector('#signin-form-element button[type="submit"]');
        const originalText = submitBtn.textContent;

        try {
            submitBtn.textContent = 'Signing In...';
            submitBtn.disabled = true;

            await authManager.signIn(email, password);
            console.log('✅ Sign in successful');

        } catch (error) {
            console.error('❌ Sign in failed:', error);
            this.showError(error.message);
        } finally {
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
        }
    }

    async handleSignUp() {
        const name = document.getElementById('signup-name').value;
        const email = document.getElementById('signup-email').value;
        const password = document.getElementById('signup-password').value;
        const confirm = document.getElementById('signup-confirm').value;

        if (!name || !email || !password || !confirm) {
            this.showError('Please fill in all fields');
            return;
        }

        if (password !== confirm) {
            this.showError('Passwords do not match');
            return;
        }

        if (password.length < 6) {
            this.showError('Password must be at least 6 characters');
            return;
        }

        const submitBtn = document.querySelector('#signup-form-element button[type="submit"]');
        const originalText = submitBtn.textContent;

        try {
            submitBtn.textContent = 'Creating Account...';
            submitBtn.disabled = true;

            await authManager.signUp(email, password, name);
            console.log('✅ Sign up successful');

        } catch (error) {
            console.error('❌ Sign up failed:', error);
            this.showError(error.message);
        } finally {
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
        }
    }

    async handleLogout() {
        try {
            await authManager.signOutUser();
            console.log('✅ Logout successful');
        } catch (error) {
            console.error('❌ Logout failed:', error);
            this.showError('Failed to sign out. Please try again.');
        }
    }

    showAuthScreen() {
        const authScreen = document.getElementById('auth-screen');
        const mainApp = document.getElementById('main-app');

        if (authScreen) authScreen.style.display = 'flex';
        if (mainApp) mainApp.style.display = 'none';

        // Clear form inputs
        this.clearAuthForms();

        console.log('🔐 Auth screen shown');
    }

    showMainApp() {
        const authScreen = document.getElementById('auth-screen');
        const mainApp = document.getElementById('main-app');

        if (authScreen) authScreen.style.display = 'none';
        if (mainApp) mainApp.style.display = 'flex';

        // Load main app content
        this.loadMainAppContent();

        console.log('🏠 Main app shown');
    }

    showSignInForm() {
        const signinForm = document.getElementById('signin-form');
        const signupForm = document.getElementById('signup-form');

        if (signinForm) signinForm.style.display = 'block';
        if (signupForm) signupForm.style.display = 'none';

        this.clearAuthForms();
    }

    showSignUpForm() {
        const signinForm = document.getElementById('signin-form');
        const signupForm = document.getElementById('signup-form');

        if (signinForm) signinForm.style.display = 'none';
        if (signupForm) signupForm.style.display = 'block';

        this.clearAuthForms();
    }

    clearAuthForms() {
        // Clear sign in form
        const signinEmail = document.getElementById('signin-email');
        const signinPassword = document.getElementById('signin-password');
        if (signinEmail) signinEmail.value = '';
        if (signinPassword) signinPassword.value = '';

        // Clear sign up form
        const signupName = document.getElementById('signup-name');
        const signupEmail = document.getElementById('signup-email');
        const signupPassword = document.getElementById('signup-password');
        const signupConfirm = document.getElementById('signup-confirm');
        if (signupName) signupName.value = '';
        if (signupEmail) signupEmail.value = '';
        if (signupPassword) signupPassword.value = '';
        if (signupConfirm) signupConfirm.value = '';
    }

    switchTab(tabName) {
        // Update navigation
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-tab="${tabName}"]`)?.classList.add('active');

        // Update content
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
        });
        document.getElementById(`${tabName}-tab`)?.classList.add('active');

        this.currentTab = tabName;
        console.log(`📱 Switched to ${tabName} tab`);

        // Load tab-specific content
        this.loadTabContent(tabName);
    }

    loadMainAppContent() {
        // Load welcome content or initial data
        console.log('📱 Loading main app content...');
        
        // Load support groups
        this.loadSupportGroups();
    }

    loadTabContent(tabName) {
        switch (tabName) {
            case 'feed':
                this.loadFeed();
                break;
            case 'support-groups':
                this.loadSupportGroups();
                break;
            case 'wellness':
                this.loadWellnessTools();
                break;
            case 'profile':
                this.loadProfile();
                break;
        }
    }

    loadFeed() {
        const container = document.getElementById('posts-container');
        if (!container) return;

        container.innerHTML = `
            <div class="card">
                <h3>Welcome to Your Feed</h3>
                <p>This is where you'll see updates from your support groups and wellness activities.</p>
                <p><em>Content coming soon...</em></p>
            </div>
        `;
    }

    loadSupportGroups() {
        const container = document.getElementById('groups-container');
        if (!container) return;

        const groupsHtml = APP_CONFIG.SUPPORT_GROUPS.map(group => `
            <div class="card" style="border-left: 4px solid ${group.color}">
                <h3>${group.icon} ${group.name}</h3>
                <p>${group.description}</p>
                <button class="btn btn-primary mt-lg" onclick="alert('Group chat coming soon!')">
                    Join Group
                </button>
            </div>
        `).join('');

        container.innerHTML = groupsHtml;
    }

    loadWellnessTools() {
        const container = document.getElementById('wellness-tools-container');
        if (!container) return;

        container.innerHTML = `
            <div class="card">
                <h3>🧘‍♀️ Meditation & Mindfulness</h3>
                <p>Guided meditation and breathing exercises for anxiety and stress relief.</p>
                <button class="btn btn-primary mt-lg" onclick="alert('Meditation tools coming soon!')">
                    Start Session
                </button>
            </div>
            <div class="card">
                <h3>📝 Mood Tracking</h3>
                <p>Track your daily mood and emotions to identify patterns and triggers.</p>
                <button class="btn btn-primary mt-lg" onclick="alert('Mood tracking coming soon!')">
                    Log Mood
                </button>
            </div>
            <div class="card">
                <h3>🆘 Crisis Resources</h3>
                <p>Immediate help and resources for mental health crises.</p>
                <button class="btn btn-primary mt-lg" onclick="alert('Crisis: Call 988 for immediate help')">
                    Get Help Now
                </button>
            </div>
        `;
    }

    loadProfile() {
        const container = document.getElementById('profile-content-container');
        if (!container) return;

        const user = authManager.getCurrentUser();
        
        container.innerHTML = `
            <div class="card">
                <h3>Profile Information</h3>
                <p><strong>Email:</strong> ${user?.email || 'Not available'}</p>
                <p><strong>Display Name:</strong> ${user?.displayName || 'Not set'}</p>
                <p><strong>Member Since:</strong> ${user?.metadata?.creationTime ? new Date(user.metadata.creationTime).toLocaleDateString() : 'Not available'}</p>
            </div>
            <div class="card">
                <h3>Privacy Settings</h3>
                <p>Your privacy is important to us. All conversations in support groups are confidential.</p>
                <button class="btn btn-primary mt-lg" onclick="alert('Privacy settings coming soon!')">
                    Manage Privacy
                </button>
            </div>
        `;
    }

    showError(message) {
        // Simple error display - could be enhanced with a proper toast/modal
        alert(message);
    }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    console.log('📱 DOM loaded, initializing Clara app...');
    window.claraApp = new ClaraApp();
    window.claraApp.initialize();
});

// Make app globally available for debugging
window.ClaraApp = ClaraApp;