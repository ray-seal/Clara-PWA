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

        // Ensure we're on the feed tab and load it immediately
        this.currentTab = 'feed';
        this.switchTab('feed');

        console.log('🏠 Main app shown and feed loaded');
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
        console.log(`📱 Switching to ${tabName} tab`);
        
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
        
        // Always load tab content when switching
        this.loadTabContent(tabName);
        
        console.log(`✅ Switched to ${tabName} tab and loaded content`);
    }

    loadMainAppContent() {
        // Load welcome content or initial data
        console.log('📱 Loading main app content...');
        
        // Load the currently active tab (feed by default)
        this.loadTabContent(this.currentTab);
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
        console.log('📱 Loading feed tab...');
        const container = document.getElementById('posts-container');
        if (!container) {
            console.error('❌ Posts container not found!');
            return;
        }

        console.log('✅ Posts container found, setting up feed UI...');
        container.innerHTML = `
            <!-- Simple Post Input -->
            <div class="card post-input-card">
                <div class="post-input-container">
                    <input type="text" id="post-input" placeholder="What's on your mind? Share your thoughts or ask for support..." maxlength="1000">
                    <button type="button" id="add-image-icon" class="image-icon-btn" title="Add image">
                        <span class="material-icons">image</span>
                    </button>
                    <button type="button" id="post-submit-btn" class="post-submit-btn" disabled title="Share post">
                        <span class="material-icons">send</span>
                    </button>
                </div>
                <input type="file" id="post-image-input" accept="image/*" style="display: none;">
                <div id="image-preview-simple" class="image-preview-simple" style="display: none;">
                    <img id="preview-img-simple" src="" alt="Preview">
                    <button type="button" class="remove-image-simple" id="remove-image-simple">
                        <span class="material-icons">close</span>
                    </button>
                </div>
            </div>

            <!-- Posts Feed -->
            <div id="posts-feed" class="posts-feed">
                <div class="loading-posts">
                    <span class="material-icons spinning">refresh</span>
                    <p>Loading posts...</p>
                </div>
            </div>
        `;

        // Set up post creation functionality
        this.setupSimplePostCreation();
        
        // Load and display posts
        this.loadPosts();
        
        console.log('✅ Feed setup complete');
    }

    setupSimplePostCreation() {
        console.log('🔧 Setting up post creation...');
        const input = document.getElementById('post-input');
        const submitBtn = document.getElementById('post-submit-btn');
        const addImageBtn = document.getElementById('add-image-icon');
        const imageInput = document.getElementById('post-image-input');
        const imagePreview = document.getElementById('image-preview-simple');
        const previewImg = document.getElementById('preview-img-simple');
        const removeImageBtn = document.getElementById('remove-image-simple');

        if (!input || !submitBtn || !addImageBtn) {
            console.error('❌ Post creation elements not found!', {
                input: !!input,
                submitBtn: !!submitBtn, 
                addImageBtn: !!addImageBtn
            });
            return;
        }

        console.log('✅ Post creation elements found, setting up events...');

        // Enable submit button when there's content
        input.addEventListener('input', () => {
            const hasContent = input.value.trim().length > 0;
            submitBtn.disabled = !hasContent;
            submitBtn.style.opacity = hasContent ? '1' : '0.5';
        });

        // Image upload handling
        addImageBtn.addEventListener('click', () => {
            imageInput.click();
        });

        imageInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                if (file.size > 5 * 1024 * 1024) {
                    alert('Image must be less than 5MB');
                    return;
                }
                
                const reader = new FileReader();
                reader.onload = (e) => {
                    previewImg.src = e.target.result;
                    imagePreview.style.display = 'block';
                    addImageBtn.classList.add('image-selected');
                };
                reader.readAsDataURL(file);
            }
        });

        removeImageBtn.addEventListener('click', () => {
            imageInput.value = '';
            imagePreview.style.display = 'none';
            addImageBtn.classList.remove('image-selected');
        });

        // Submit post
        submitBtn.addEventListener('click', async () => {
            const content = input.value.trim();
            const imageFile = imageInput.files[0];
            
            if (!content) {
                return;
            }

            const originalIcon = submitBtn.innerHTML;
            
            try {
                console.log('🚀 Starting post submission...');
                submitBtn.innerHTML = '<span class="material-icons spinning">hourglass_empty</span>';
                submitBtn.disabled = true;
                addImageBtn.disabled = true;

                await authManager.createPost(content, imageFile);
                
                console.log('✅ Post submitted successfully, resetting form...');
                
                // Reset form
                input.value = '';
                imageInput.value = '';
                imagePreview.style.display = 'none';
                addImageBtn.classList.remove('image-selected');
                submitBtn.disabled = true;
                submitBtn.style.opacity = '0.5';

                // Reload posts
                console.log('🔄 Reloading posts...');
                await this.loadPosts();
                
                // Refresh profile stats if user is on profile tab
                if (this.currentTab === 'profile') {
                    this.refreshProfileStats();
                }
                
                console.log('✅ Post creation process complete');
                
            } catch (error) {
                console.error('❌ Error creating post:', error);
                alert(`Failed to create post: ${error.message}`);
            } finally {
                submitBtn.innerHTML = originalIcon;
                addImageBtn.disabled = false;
                
                // Re-enable submit if there's still content
                if (input.value.trim()) {
                    submitBtn.disabled = false;
                    submitBtn.style.opacity = '1';
                }
            }
        });

        // Submit on Enter key
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey && !submitBtn.disabled) {
                e.preventDefault();
                submitBtn.click();
            }
        });
    }

    async loadPosts() {
        console.log('📥 Loading posts...');
        const container = document.getElementById('posts-feed');
        if (!container) {
            console.error('❌ Posts feed container not found!');
            return;
        }

        // Show loading state
        container.innerHTML = `
            <div class="loading-posts">
                <span class="material-icons spinning">refresh</span>
                <p>Loading posts...</p>
            </div>
        `;

        try {
            const posts = await authManager.getPosts();
            console.log(`✅ Loaded ${posts.length} posts`);
            
            if (posts.length === 0) {
                container.innerHTML = `
                    <div class="card no-posts">
                        <h3>Welcome to the Community!</h3>
                        <p>No posts yet. Be the first to share something with the community!</p>
                        <p><em>Use the input box above to create your first post.</em></p>
                    </div>
                `;
                return;
            }

            const postsHtml = posts.map(post => this.renderPost(post)).join('');
            container.innerHTML = postsHtml;
            
            // Set up post interactions
            this.setupPostInteractions();
            
        } catch (error) {
            console.error('❌ Error loading posts:', error);
            container.innerHTML = `
                <div class="card error-loading">
                    <h3>Unable to Load Posts</h3>
                    <p>There was a problem loading the community posts.</p>
                    <p><strong>Error:</strong> ${error.message}</p>
                    <button class="btn btn-primary" onclick="window.claraApp.loadPosts()">
                        <span class="material-icons">refresh</span>
                        Try Again
                    </button>
                </div>
            `;
        }
    }

    renderPost(post) {
        const currentUser = authManager.getCurrentUser();
        const isOwnPost = post.uid === currentUser?.uid;
        const userLiked = post.likes?.includes(currentUser?.uid) || false;
        
        const displayName = post.author?.showRealName && (post.author?.firstName || post.author?.lastName) 
            ? [post.author.firstName, post.author.lastName].filter(Boolean).join(' ')
            : post.author?.displayName || 'Anonymous';

        const timeAgo = this.formatTimeAgo(post.createdAt);

        return `
            <div class="card post-card" data-post-id="${post.id}">
                <div class="post-header">
                    <div class="post-author">
                        <div class="author-avatar">
                            ${post.author?.avatarUrl ? 
                                `<img src="${post.author.avatarUrl}" alt="${displayName}">` :
                                `<div class="avatar-placeholder"><span class="material-icons">person</span></div>`
                            }
                        </div>
                        <div class="author-info">
                            <h4>${displayName}</h4>
                            <p class="post-time">${timeAgo}</p>
                        </div>
                    </div>
                    <div class="post-menu">
                        <button class="post-menu-btn" data-post-id="${post.id}">
                            <span class="material-icons">more_vert</span>
                        </button>
                        <div class="post-menu-dropdown" id="menu-${post.id}" style="display: none;">
                            ${isOwnPost ? '<button class="menu-item delete-post" data-post-id="' + post.id + '"><span class="material-icons">delete</span> Delete Post</button>' : ''}
                            <button class="menu-item report-post" data-post-id="${post.id}">
                                <span class="material-icons">flag</span> Report Post
                            </button>
                        </div>
                    </div>
                </div>
                
                <div class="post-content">
                    <p>${this.formatPostContent(post.content)}</p>
                    ${post.imageUrl ? `<div class="post-image"><img src="${post.imageUrl}" alt="Post image"></div>` : ''}
                </div>
                
                <div class="post-actions">
                    <button class="action-btn like-btn ${userLiked ? 'liked' : ''}" data-post-id="${post.id}">
                        <span class="material-icons">${userLiked ? 'favorite' : 'favorite_border'}</span>
                        <span class="action-count">${post.likesCount || 0}</span>
                    </button>
                    <button class="action-btn comment-btn" data-post-id="${post.id}">
                        <span class="material-icons">comment</span>
                        <span class="action-count">${post.commentsCount || 0}</span>
                    </button>
                </div>
                
                <div class="comments-section" id="comments-${post.id}" style="display: none;">
                    <div class="add-comment">
                        <textarea placeholder="Add a comment..." rows="2" maxlength="500" id="comment-input-${post.id}"></textarea>
                        <button class="btn btn-primary btn-small submit-comment" data-post-id="${post.id}">Comment</button>
                    </div>
                    <div class="comments-list" id="comments-list-${post.id}">
                        <!-- Comments will be loaded here -->
                    </div>
                </div>
            </div>
        `;
    }

    setupPostInteractions() {
        // Like buttons
        document.querySelectorAll('.like-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                e.preventDefault();
                const postId = btn.getAttribute('data-post-id');
                await this.handleLike(postId, btn);
            });
        });

        // Comment buttons
        document.querySelectorAll('.comment-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const postId = btn.getAttribute('data-post-id');
                this.toggleComments(postId);
            });
        });

        // Post menu buttons
        document.querySelectorAll('.post-menu-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const postId = btn.getAttribute('data-post-id');
                this.togglePostMenu(postId);
            });
        });

        // Comment submission
        document.querySelectorAll('.submit-comment').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                e.preventDefault();
                const postId = btn.getAttribute('data-post-id');
                await this.handleComment(postId);
            });
        });

        // Delete post
        document.querySelectorAll('.delete-post').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                e.preventDefault();
                const postId = btn.getAttribute('data-post-id');
                await this.handleDeletePost(postId);
            });
        });

        // Report post
        document.querySelectorAll('.report-post').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                e.preventDefault();
                const postId = btn.getAttribute('data-post-id');
                await this.handleReportPost(postId);
            });
        });

        // Close menus when clicking outside
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.post-menu')) {
                document.querySelectorAll('.post-menu-dropdown').forEach(menu => {
                    menu.style.display = 'none';
                });
            }
        });
    }

    async handleLike(postId, button) {
        try {
            const newLikeState = await authManager.toggleLike(postId);
            const icon = button.querySelector('.material-icons');
            const count = button.querySelector('.action-count');
            
            if (newLikeState) {
                button.classList.add('liked');
                icon.textContent = 'favorite';
                count.textContent = parseInt(count.textContent) + 1;
            } else {
                button.classList.remove('liked');
                icon.textContent = 'favorite_border';
                count.textContent = parseInt(count.textContent) - 1;
            }
            
            // Refresh profile stats if user is on profile tab
            if (this.currentTab === 'profile') {
                this.refreshProfileStats();
            }
        } catch (error) {
            console.error('❌ Error liking post:', error);
            alert('Failed to like post. Please try again.');
        }
    }

    async toggleComments(postId) {
        const commentsSection = document.getElementById(`comments-${postId}`);
        
        if (commentsSection.style.display === 'none') {
            commentsSection.style.display = 'block';
            await this.loadComments(postId);
        } else {
            commentsSection.style.display = 'none';
        }
    }

    async loadComments(postId) {
        const commentsList = document.getElementById(`comments-list-${postId}`);
        
        try {
            const comments = await authManager.getComments(postId);
            
            if (comments.length === 0) {
                commentsList.innerHTML = '<p class="no-comments">No comments yet. Be the first to comment!</p>';
                return;
            }

            const commentsHtml = comments.map(comment => {
                const displayName = comment.author?.showRealName && (comment.author?.firstName || comment.author?.lastName) 
                    ? [comment.author.firstName, comment.author.lastName].filter(Boolean).join(' ')
                    : comment.author?.displayName || 'Anonymous';

                return `
                    <div class="comment">
                        <div class="comment-author">
                            <div class="comment-avatar">
                                ${comment.author?.avatarUrl ? 
                                    `<img src="${comment.author.avatarUrl}" alt="${displayName}">` :
                                    `<div class="avatar-placeholder-small"><span class="material-icons">person</span></div>`
                                }
                            </div>
                            <div class="comment-content">
                                <h5>${displayName}</h5>
                                <p>${this.formatPostContent(comment.content)}</p>
                                <span class="comment-time">${this.formatTimeAgo(comment.createdAt)}</span>
                            </div>
                        </div>
                    </div>
                `;
            }).join('');

            commentsList.innerHTML = commentsHtml;
        } catch (error) {
            console.error('❌ Error loading comments:', error);
            commentsList.innerHTML = '<p class="error-comments">Failed to load comments.</p>';
        }
    }

    async handleComment(postId) {
        const input = document.getElementById(`comment-input-${postId}`);
        const content = input.value.trim();
        
        if (!content) {
            alert('Please enter a comment.');
            return;
        }

        try {
            await authManager.addComment(postId, content);
            input.value = '';
            await this.loadComments(postId);
            
            // Update comment count in UI
            const commentBtn = document.querySelector(`[data-post-id="${postId}"].comment-btn`);
            const countSpan = commentBtn.querySelector('.action-count');
            countSpan.textContent = parseInt(countSpan.textContent) + 1;
            
            // Refresh profile stats if user is on profile tab
            if (this.currentTab === 'profile') {
                this.refreshProfileStats();
            }
            
        } catch (error) {
            console.error('❌ Error adding comment:', error);
            alert('Failed to add comment. Please try again.');
        }
    }

    togglePostMenu(postId) {
        const menu = document.getElementById(`menu-${postId}`);
        const isVisible = menu.style.display !== 'none';
        
        // Hide all other menus
        document.querySelectorAll('.post-menu-dropdown').forEach(m => m.style.display = 'none');
        
        // Toggle this menu
        menu.style.display = isVisible ? 'none' : 'block';
    }

    async handleDeletePost(postId) {
        if (!confirm('Are you sure you want to delete this post? This action cannot be undone.')) {
            return;
        }

        try {
            await authManager.deletePost(postId);
            // Remove post from UI
            const postCard = document.querySelector(`[data-post-id="${postId}"]`);
            postCard.remove();
            console.log('✅ Post deleted successfully');
        } catch (error) {
            console.error('❌ Error deleting post:', error);
            alert('Failed to delete post. Please try again.');
        }
    }

    async handleReportPost(postId) {
        const reason = prompt('Please provide a reason for reporting this post:');
        if (!reason) return;

        try {
            await authManager.reportPost(postId, reason);
            alert('Thank you for your report. Our moderators will review this post.');
            
            // Hide menu
            document.getElementById(`menu-${postId}`).style.display = 'none';
        } catch (error) {
            console.error('❌ Error reporting post:', error);
            alert('Failed to report post. Please try again.');
        }
    }

    formatPostContent(content) {
        // Basic text formatting - escape HTML and preserve line breaks
        return content
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/\n/g, '<br>');
    }

    formatTimeAgo(timestamp) {
        const now = new Date();
        const time = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
        const diff = now - time;
        
        const seconds = Math.floor(diff / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);
        
        if (days > 0) return `${days}d ago`;
        if (hours > 0) return `${hours}h ago`;
        if (minutes > 0) return `${minutes}m ago`;
        return 'Just now';
    }

    // Refresh profile stats in real-time
    async refreshProfileStats() {
        try {
            const user = authManager.getCurrentUser();
            if (!user) return;

            console.log('🔄 Refreshing profile stats...');
            
            const profileData = await authManager.getUserProfile();
            if (!profileData) return;

            // Update stats in the UI if elements exist
            const statsElements = {
                posts: document.querySelector('.stat-item .stat-number:nth-of-type(1)'),
                comments: document.querySelector('.stat-item .stat-number:nth-of-type(2)'), 
                likesGiven: document.querySelector('.stat-item .stat-number:nth-of-type(3)'),
                likesReceived: document.querySelector('.stat-item .stat-number:nth-of-type(4)')
            };

            // Find and update stats by their labels
            document.querySelectorAll('.stat-item').forEach(item => {
                const label = item.querySelector('.stat-label')?.textContent?.toLowerCase();
                const numberElement = item.querySelector('.stat-number');
                
                if (numberElement && label) {
                    if (label.includes('posts')) {
                        numberElement.textContent = profileData.stats?.postsCount || 0;
                    } else if (label.includes('comments')) {
                        numberElement.textContent = profileData.stats?.commentsCount || 0;
                    } else if (label.includes('likes given')) {
                        numberElement.textContent = profileData.stats?.likesGivenCount || 0;
                    } else if (label.includes('likes received')) {
                        numberElement.textContent = profileData.stats?.likesReceivedCount || 0;
                    }
                }
            });

            // Update level and points
            const levelNumber = document.querySelector('.level-number');
            const pointsCount = document.querySelector('.points-count');
            
            if (levelNumber && pointsCount) {
                const currentLevel = authManager.calculateLevel(profileData.points || 0);
                levelNumber.textContent = `Level ${currentLevel}`;
                pointsCount.textContent = `${profileData.points || 0} points`;

                // Update progress bar
                const pointsToNext = authManager.getPointsForNextLevel(profileData.points || 0);
                const progressFill = document.querySelector('.progress-fill');
                const nextLevelText = document.querySelector('.next-level-text');
                
                if (pointsToNext && progressFill && nextLevelText) {
                    const progress = ((profileData.points || 0) % pointsToNext) / pointsToNext * 100;
                    progressFill.style.width = `${progress}%`;
                    nextLevelText.textContent = `${pointsToNext} points to Level ${currentLevel + 1}`;
                } else if (!pointsToNext) {
                    // Max level reached
                    const maxLevelText = document.querySelector('.max-level-text');
                    if (maxLevelText) {
                        maxLevelText.textContent = '🎉 Maximum level reached!';
                    }
                }
            }

            console.log('✅ Profile stats refreshed');
        } catch (error) {
            console.error('❌ Error refreshing profile stats:', error);
        }
    }

    loadSupportGroups() {
        const container = document.getElementById('groups-container');
        if (!container) return;

        const groupsHtml = APP_CONFIG.SUPPORT_GROUPS.map(group => `
            <div class="card" style="border-left: 4px solid ${group.color}">
                <h3>${group.icon} ${group.name}</h3>
                <p>${group.description}</p>
                <button class="btn btn-primary mt-lg" data-group-id="${group.id}">
                    Join Group
                </button>
            </div>
        `).join('');

        container.innerHTML = groupsHtml;

        // Add click listeners for join buttons only
        document.querySelectorAll('[data-group-id]').forEach(button => {
            button.addEventListener('click', (e) => {
                const groupId = e.target.dataset.groupId;
                if (groupId === 'anxiety-support') {
                    this.openChatRoom(groupId);
                } else {
                    alert('This support group chat is coming soon!');
                }
            });
        });
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
                <button class="btn btn-primary mt-lg" onclick="alert('Crisis: Call 999 or 111 for immediate help')">
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

    // =====================================================
    // CHAT ROOM FUNCTIONALITY
    // =====================================================

    openChatRoom(groupId) {
        console.log(`💬 Opening chat room for ${groupId}...`);
        
        // Hide groups list and show chat room
        document.getElementById('groups-list-view').style.display = 'none';
        document.getElementById('anxiety-chat-room').style.display = 'block';
        
        // Initialize chat
        this.initializeChatRoom(groupId);
    }

    async initializeChatRoom(groupId) {
        console.log(`💬 Initializing chat room for ${groupId}...`);
        this.currentChatGroup = groupId;
        this.chatUnsubscribers = this.chatUnsubscribers || [];
        
        // Small delay to ensure DOM is ready
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Set up back button
        const backButton = document.getElementById('back-to-groups');
        if (backButton) {
            backButton.addEventListener('click', () => {
                this.closeChatRoom();
            });
        }
        
        // Set up message input and send button
        this.setupChatInput();
        
        // Force visibility check on input elements
        const inputContainer = document.getElementById('chat-message-input')?.parentElement?.parentElement;
        if (inputContainer) {
            inputContainer.style.display = 'block';
            inputContainer.style.visibility = 'visible';
            console.log('✅ Chat input container visibility forced');
        }
        
        // Update user presence
        await authManager.updateUserPresence(groupId, true);
        
        // Subscribe to chat messages
        const messagesUnsubscriber = authManager.subscribeToChatMessages(groupId, (messages) => {
            this.displayChatMessages(messages);
        });
        this.chatUnsubscribers.push(messagesUnsubscriber);
        
        // Subscribe to active members
        const membersUnsubscriber = authManager.subscribeToActiveMembers(groupId, (members) => {
            this.displayActiveMembers(members);
        });
        this.chatUnsubscribers.push(membersUnsubscriber);
        
        console.log('✅ Chat room initialized');
    }

    closeChatRoom() {
        console.log('❌ Closing chat room...');
        
        // Update user presence to inactive
        if (this.currentChatGroup) {
            authManager.updateUserPresence(this.currentChatGroup, false);
        }
        
        // Unsubscribe from real-time listeners
        if (this.chatUnsubscribers) {
            this.chatUnsubscribers.forEach(unsubscriber => {
                if (typeof unsubscriber === 'function') {
                    unsubscriber();
                }
            });
            this.chatUnsubscribers = [];
        }
        
        // Show groups list and hide chat room
        document.getElementById('anxiety-chat-room').style.display = 'none';
        document.getElementById('groups-list-view').style.display = 'block';
        
        this.currentChatGroup = null;
    }

    setupChatInput() {
        console.log('🎛️ Setting up chat input...');
        const messageInput = document.getElementById('chat-message-input');
        const sendButton = document.getElementById('send-message-btn');
        
        console.log('📝 Message input found:', !!messageInput);
        console.log('🔘 Send button found:', !!sendButton);
        
        if (!messageInput || !sendButton) {
            console.error('❌ Chat input elements not found!');
            console.log('🔧 Attempting to recreate input elements...');
            
            // Try to find the container and recreate the input
            const chatContainer = document.querySelector('.chat-messages-container');
            if (chatContainer) {
                const inputHtml = `
                    <div class="chat-input-container">
                        <div class="chat-input-wrapper">
                            <input type="text" id="chat-message-input" placeholder="Type a supportive message..." maxlength="500">
                            <button id="send-message-btn" class="send-button">
                                <span class="material-icons">send</span>
                            </button>
                        </div>
                    </div>
                `;
                
                // Remove existing input container if any
                const existingInput = chatContainer.querySelector('.chat-input-container');
                if (existingInput) {
                    existingInput.remove();
                }
                
                chatContainer.insertAdjacentHTML('beforeend', inputHtml);
                console.log('✅ Chat input recreated');
                
                // Try again
                return this.setupChatInput();
            }
            return;
        }
        
        // Handle send button click
        sendButton.addEventListener('click', () => {
            this.sendChatMessage();
        });
        
        // Handle Enter key press
        messageInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendChatMessage();
            }
        });
        
        // Auto-resize input and update send button state
        messageInput.addEventListener('input', () => {
            const content = messageInput.value.trim();
            sendButton.disabled = content.length === 0;
        });
        
        // Initial state
        sendButton.disabled = true;
    }

    async sendChatMessage() {
        const messageInput = document.getElementById('chat-message-input');
        const sendButton = document.getElementById('send-message-btn');
        
        if (!messageInput || !sendButton || !this.currentChatGroup) return;
        
        const content = messageInput.value.trim();
        if (!content) return;
        
        try {
            // Disable input while sending
            messageInput.disabled = true;
            sendButton.disabled = true;
            sendButton.innerHTML = '<span class="material-icons spinning">hourglass_empty</span>';
            
            // Send message
            await authManager.sendChatMessage(this.currentChatGroup, content);
            
            // Clear input
            messageInput.value = '';
            
            // Scroll to bottom
            this.scrollChatToBottom();
            
        } catch (error) {
            console.error('❌ Error sending message:', error);
            alert('Failed to send message. Please try again.');
        } finally {
            // Re-enable input
            messageInput.disabled = false;
            sendButton.innerHTML = '<span class="material-icons">send</span>';
            sendButton.disabled = false;
            messageInput.focus();
        }
    }

    displayChatMessages(messages) {
        console.log(`🎨 displayChatMessages called with ${messages.length} messages`);
        console.log(`📋 Messages data:`, messages);
        
        const messagesContainer = document.getElementById('chat-messages');
        if (!messagesContainer) {
            console.error('❌ Messages container not found!');
            return;
        }
        
        if (messages.length === 0) {
            console.log(`📭 No messages to display`);
            messagesContainer.innerHTML = `
                <div class="no-messages">
                    <span class="material-icons">chat_bubble_outline</span>
                    <h3>No messages yet</h3>
                    <p>Be the first to share a supportive message in this group!</p>
                </div>
            `;
            return;
        }
        
        console.log(`🖼️ Rendering ${messages.length} messages...`);
        const messagesHtml = messages.map(message => {
            const displayName = message.author?.showRealName && (message.author?.firstName || message.author?.lastName)
                ? [message.author.firstName, message.author.lastName].filter(Boolean).join(' ')
                : message.author?.displayName || 'Anonymous';
            
            const heartCount = message.heartReactions?.length || 0;
            const userReacted = message.heartReactions?.includes(authManager.currentUser?.uid) || false;
            
            return `
                <div class="chat-message" data-message-id="${message.id}">
                    <div class="message-avatar">
                        ${message.author?.avatarUrl ?
                            `<img src="${message.author.avatarUrl}" alt="${displayName}">` :
                            `<div class="message-avatar-placeholder">
                                <span class="material-icons">person</span>
                            </div>`
                        }
                    </div>
                    <div class="message-content">
                        <div class="message-header">
                            <span class="message-author">${displayName}</span>
                            <span class="message-time">${this.formatTimeAgo(message.createdAt)}</span>
                        </div>
                        <div class="message-text">${this.formatPostContent(message.content)}</div>
                        <div class="message-actions">
                            <button class="heart-reaction ${userReacted ? 'active' : ''}" onclick="window.claraApp.toggleHeartReaction('${message.id}')">
                                <span class="material-icons">${userReacted ? 'favorite' : 'favorite_border'}</span>
                                ${heartCount > 0 ? `<span class="reaction-count">${heartCount}</span>` : ''}
                            </button>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
        
        console.log(`✅ Messages HTML generated, updating container...`);
        messagesContainer.innerHTML = messagesHtml;
        console.log(`📜 Container updated, scrolling to bottom...`);
        this.scrollChatToBottom();
        console.log(`✅ displayChatMessages completed`);
    }

    displayActiveMembers(members) {
        const membersContainer = document.getElementById('active-members-list');
        const activeCount = document.getElementById('active-count');
        
        if (!membersContainer || !activeCount) return;
        
        activeCount.textContent = members.length;
        
        if (members.length === 0) {
            membersContainer.innerHTML = `
                <div class="no-members">
                    <span class="material-icons">people_outline</span>
                    <p>No active members</p>
                </div>
            `;
            return;
        }
        
        const membersHtml = members.map(member => {
            const displayName = member.profile?.showRealName && (member.profile?.firstName || member.profile?.lastName)
                ? [member.profile.firstName, member.profile.lastName].filter(Boolean).join(' ')
                : member.profile?.displayName || 'Anonymous';
            
            return `
                <div class="active-member">
                    <div class="member-avatar">
                        ${member.profile?.avatarUrl ?
                            `<img src="${member.profile.avatarUrl}" alt="${displayName}">` :
                            `<div class="member-avatar-placeholder">
                                <span class="material-icons">person</span>
                            </div>`
                        }
                        <div class="member-status"></div>
                    </div>
                    <div class="member-info">
                        <div class="member-name">${displayName}</div>
                        <div class="member-last-seen">${this.formatTimeAgo(member.lastSeen)}</div>
                    </div>
                </div>
            `;
        }).join('');
        
        membersContainer.innerHTML = membersHtml;
    }

    async toggleHeartReaction(messageId) {
        try {
            await authManager.toggleHeartReaction(messageId);
            console.log(`💖 Toggled heart reaction for message ${messageId}`);
        } catch (error) {
            console.error('❌ Error toggling heart reaction:', error);
            alert('Failed to add reaction. Please try again.');
        }
    }

    scrollChatToBottom() {
        const messagesContainer = document.getElementById('chat-messages');
        if (messagesContainer) {
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
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
