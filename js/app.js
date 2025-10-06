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
        const firstName = document.getElementById('signup-firstname').value;
        const lastName = document.getElementById('signup-lastname').value;
        const email = document.getElementById('signup-email').value;
        const password = document.getElementById('signup-password').value;
        const confirm = document.getElementById('signup-confirm').value;

        if (!firstName || !lastName || !email || !password || !confirm) {
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

            await authManager.signUp(email, password, firstName, lastName);
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
        const signupFirstName = document.getElementById('signup-firstname');
        const signupLastName = document.getElementById('signup-lastname');
        const signupEmail = document.getElementById('signup-email');
        const signupPassword = document.getElementById('signup-password');
        const signupConfirm = document.getElementById('signup-confirm');
        if (signupFirstName) signupFirstName.value = '';
        if (signupLastName) signupLastName.value = '';
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

    async loadProfile() {
        const container = document.getElementById('profile-content-container');
        if (!container) return;

        const user = authManager.getCurrentUser();
        
        try {
            // Get user profile data from Firestore
            const profileDoc = await import('./config.js').then(module => 
                import('https://www.gstatic.com/firebasejs/10.3.0/firebase-firestore.js').then(firestore => 
                    firestore.getDoc(firestore.doc(module.db, module.COLLECTIONS.PROFILES, user.uid))
                )
            );
            
            const profileData = profileDoc.exists() ? profileDoc.data() : {};
            
            // Calculate level info
            const currentLevel = authManager.calculateLevel(profileData.points || 0);
            const pointsToNext = authManager.getPointsForNextLevel(profileData.points || 0);
            
            // Determine display name
            let displayName = 'Not set';
            if (profileData.showRealName && (profileData.firstName || profileData.lastName)) {
                displayName = [profileData.firstName, profileData.lastName].filter(Boolean).join(' ');
            } else if (profileData.displayName) {
                displayName = profileData.displayName;
            }
            
            container.innerHTML = `
                <div class="card">
                    <div class="profile-header">
                        <div class="profile-avatar-section">
                            <div class="profile-avatar" id="profile-avatar">
                                ${profileData.avatarUrl ? 
                                    `<img src="${profileData.avatarUrl}" alt="Profile picture" class="avatar-img">` :
                                    `<div class="avatar-placeholder">
                                        <span class="material-icons">person</span>
                                    </div>`
                                }
                                <button class="avatar-upload-btn" id="avatar-upload-btn" title="Change profile picture">
                                    <span class="material-icons">camera_alt</span>
                                </button>
                            </div>
                            <input type="file" id="avatar-input" accept="image/*" style="display: none;">
                        </div>
                        <div class="profile-info">
                            <div class="profile-info-header">
                                <h3>Profile Information</h3>
                                <button class="btn btn-secondary btn-small" id="edit-profile-btn">
                                    <span class="material-icons">edit</span>
                                    Edit Profile
                                </button>
                            </div>
                            
                            <!-- View Mode -->
                            <div id="profile-view-mode">
                                <div class="profile-field">
                                    <strong>Name:</strong> ${displayName}
                                    ${!profileData.showRealName && (profileData.firstName || profileData.lastName) ? 
                                        '<span class="privacy-note">(Real name hidden for privacy)</span>' : ''}
                                </div>
                                <div class="profile-field">
                                    <strong>Display Name:</strong> ${profileData.displayName || 'Not set'}
                                </div>
                                <div class="profile-field">
                                    <strong>Bio:</strong> ${profileData.bio || 'No bio set'}
                                </div>
                                <div class="profile-field">
                                    <strong>Member Since:</strong> ${profileData.createdAt ? 
                                        new Date(profileData.createdAt.toDate()).toLocaleDateString() : 'Not available'}
                                </div>
                            </div>
                            
                            <!-- Edit Mode -->
                            <div id="profile-edit-mode" style="display: none;">
                                <form id="edit-profile-form">
                                    <div class="form-row">
                                        <div class="form-group">
                                            <label for="edit-firstname">First Name</label>
                                            <input type="text" id="edit-firstname" value="${profileData.firstName || ''}" required>
                                        </div>
                                        <div class="form-group">
                                            <label for="edit-lastname">Last Name</label>
                                            <input type="text" id="edit-lastname" value="${profileData.lastName || ''}" required>
                                        </div>
                                    </div>
                                    <div class="form-group">
                                        <label for="edit-displayname">Display Name</label>
                                        <input type="text" id="edit-displayname" value="${profileData.displayName || ''}" 
                                               placeholder="How others will see you">
                                    </div>
                                    <div class="form-group">
                                        <label for="edit-bio">Bio</label>
                                        <textarea id="edit-bio" rows="3" placeholder="Tell others about yourself...">${profileData.bio || ''}</textarea>
                                    </div>
                                    <div class="edit-profile-actions">
                                        <button type="submit" class="btn btn-primary">
                                            <span class="material-icons">save</span>
                                            Save Changes
                                        </button>
                                        <button type="button" class="btn btn-secondary" id="cancel-edit-btn">
                                            <span class="material-icons">close</span>
                                            Cancel
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="card">
                    <h3>Community Level & Points</h3>
                    <div class="level-info">
                        <div class="level-badge">
                            <span class="level-number">Level ${currentLevel}</span>
                            <span class="points-count">${profileData.points || 0} points</span>
                        </div>
                        ${pointsToNext ? 
                            `<div class="progress-bar">
                                <div class="progress-fill" style="width: ${((profileData.points || 0) % pointsToNext) / pointsToNext * 100}%"></div>
                            </div>
                            <p class="next-level-text">${pointsToNext} points to Level ${currentLevel + 1}</p>` :
                            '<p class="max-level-text">🎉 Maximum level reached!</p>'
                        }
                    </div>
                    
                    <div class="stats-grid">
                        <div class="stat-item">
                            <span class="stat-number">${profileData.stats?.postsCount || 0}</span>
                            <span class="stat-label">Posts</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-number">${profileData.stats?.commentsCount || 0}</span>
                            <span class="stat-label">Comments</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-number">${profileData.stats?.likesGivenCount || 0}</span>
                            <span class="stat-label">Likes Given</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-number">${profileData.stats?.likesReceivedCount || 0}</span>
                            <span class="stat-label">Likes Received</span>
                        </div>
                    </div>
                </div>
                
                <div class="card">
                    <h3>Privacy Settings</h3>
                    <div class="privacy-setting">
                        <label class="privacy-toggle">
                            <input type="checkbox" id="show-real-name" ${profileData.showRealName ? 'checked' : ''}>
                            <span class="toggle-slider"></span>
                            <span class="toggle-label">Show real name instead of display name</span>
                        </label>
                        <p class="setting-description">When enabled, other users will see your real name. Your privacy is important to us.</p>
                    </div>
                    <button class="btn btn-primary mt-lg" onclick="alert('More privacy settings coming soon!')">
                        Manage All Privacy Settings
                    </button>
                </div>
            `;
            
            // Set up all functionality
            this.setupAvatarUpload();
            this.setupPrivacyToggle();
            this.setupEditProfile();
            
        } catch (error) {
            console.error('❌ Error loading profile:', error);
            container.innerHTML = `
                <div class="card">
                    <h3>Profile Information</h3>
                    <p class="error-message">Unable to load profile data. Please try refreshing the page.</p>
                </div>
            `;
        }
    }

    setupAvatarUpload() {
        const uploadBtn = document.getElementById('avatar-upload-btn');
        const fileInput = document.getElementById('avatar-input');

        if (uploadBtn && fileInput) {
            uploadBtn.addEventListener('click', () => {
                fileInput.click();
            });

            fileInput.addEventListener('change', async (e) => {
                const file = e.target.files[0];
                if (!file) return;

                try {
                    uploadBtn.innerHTML = '<span class="material-icons spinning">hourglass_empty</span>';
                    uploadBtn.disabled = true;

                    const downloadURL = await authManager.uploadProfilePicture(file);
                    
                    // Update the avatar display
                    const avatarContainer = document.getElementById('profile-avatar');
                    const avatarImg = avatarContainer.querySelector('.avatar-img') || avatarContainer.querySelector('.avatar-placeholder');
                    
                    if (avatarImg) {
                        avatarImg.outerHTML = `<img src="${downloadURL}" alt="Profile picture" class="avatar-img">`;
                    }

                    console.log('✅ Profile picture updated');
                    
                } catch (error) {
                    console.error('❌ Error uploading avatar:', error);
                    alert(error.message);
                } finally {
                    uploadBtn.innerHTML = '<span class="material-icons">camera_alt</span>';
                    uploadBtn.disabled = false;
                    fileInput.value = '';
                }
            });
        }
    }

    setupPrivacyToggle() {
        const toggle = document.getElementById('show-real-name');
        if (toggle) {
            toggle.addEventListener('change', async (e) => {
                try {
                    const user = authManager.getCurrentUser();
                    if (!user) return;

                    const { doc, updateDoc } = await import('https://www.gstatic.com/firebasejs/10.3.0/firebase-firestore.js');
                    const { db, COLLECTIONS } = await import('./config.js');
                    
                    await updateDoc(doc(db, COLLECTIONS.PROFILES, user.uid), {
                        showRealName: e.target.checked
                    });

                    // Reload profile to show updated name display
                    this.loadProfile();
                    
                    console.log('✅ Privacy setting updated');
                } catch (error) {
                    console.error('❌ Error updating privacy setting:', error);
                    // Revert toggle if failed
                    e.target.checked = !e.target.checked;
                    alert('Failed to update privacy setting. Please try again.');
                }
            });
        }
    }

    setupEditProfile() {
        const editBtn = document.getElementById('edit-profile-btn');
        const cancelBtn = document.getElementById('cancel-edit-btn');
        const editForm = document.getElementById('edit-profile-form');
        const viewMode = document.getElementById('profile-view-mode');
        const editMode = document.getElementById('profile-edit-mode');

        if (editBtn) {
            editBtn.addEventListener('click', () => {
                // Switch to edit mode
                viewMode.style.display = 'none';
                editMode.style.display = 'block';
                editBtn.style.display = 'none';
            });
        }

        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => {
                // Switch back to view mode without saving
                viewMode.style.display = 'block';
                editMode.style.display = 'none';
                editBtn.style.display = 'inline-flex';
            });
        }

        if (editForm) {
            editForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                
                const firstName = document.getElementById('edit-firstname').value.trim();
                const lastName = document.getElementById('edit-lastname').value.trim();
                const displayName = document.getElementById('edit-displayname').value.trim();
                const bio = document.getElementById('edit-bio').value.trim();

                if (!firstName || !lastName) {
                    alert('First name and last name are required.');
                    return;
                }

                const submitBtn = editForm.querySelector('button[type="submit"]');
                const originalText = submitBtn.innerHTML;

                try {
                    submitBtn.innerHTML = '<span class="material-icons spinning">hourglass_empty</span> Saving...';
                    submitBtn.disabled = true;

                    // Update profile
                    await authManager.updateProfile({
                        firstName,
                        lastName,
                        displayName: displayName || firstName, // Default to firstName if displayName is empty
                        bio
                    });

                    // Reload profile to show changes
                    this.loadProfile();
                    
                    console.log('✅ Profile updated successfully');
                    
                } catch (error) {
                    console.error('❌ Error updating profile:', error);
                    alert('Failed to update profile. Please try again.');
                    
                    // Restore button
                    submitBtn.innerHTML = originalText;
                    submitBtn.disabled = false;
                }
            });
        }
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