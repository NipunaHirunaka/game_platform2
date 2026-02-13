// User Authentication & Data Management
class UserSystem {
    constructor() {
        this.currentUser = null;
        this.users = this.loadUsers();
    }

    // Load users from localStorage
    loadUsers() {
        try {
            const data = localStorage.getItem('gamehub_users');
            return data ? JSON.parse(data) : {};
        } catch (error) {
            console.warn('Failed to read saved users. Resetting local user store.', error);
            localStorage.removeItem('gamehub_users');
            return {};
        }
    }

    // Save users to localStorage
    saveUsers() {
        try {
            localStorage.setItem('gamehub_users', JSON.stringify(this.users));
        } catch (error) {
            console.warn('Failed to save users to localStorage.', error);
        }
    }

    // Login
    login(username, password) {
        if (this.users[username]) {
            if (this.users[username].password === password) {
                this.currentUser = this.users[username];
                return { success: true, user: this.currentUser };
            }
            return { success: false, error: 'Incorrect password' };
        } else {
            // Create new user
            this.users[username] = {
                username: username,
                password: password,
                created: Date.now(),
                stats: {
                    gamesPlayed: 0,
                    totalScore: 0,
                    achievements: []
                },
                friends: [],
                settings: {
                    audio: true,
                    graphics: 'high'
                }
            };
            this.saveUsers();
            this.currentUser = this.users[username];
            return { success: true, user: this.currentUser, newUser: true };
        }
    }

    // Guest login
    loginGuest() {
        this.currentUser = {
            username: 'Guest_' + Math.random().toString(36).substr(2, 5),
            isGuest: true,
            stats: { gamesPlayed: 0, totalScore: 0, achievements: [] }
        };
        return { success: true, user: this.currentUser };
    }

    // Logout
    logout() {
        this.currentUser = null;
    }

    // Update stats
    updateStats(gameId, score, won = false) {
        if (!this.currentUser || this.currentUser.isGuest) return;
        
        this.currentUser.stats.gamesPlayed++;
        this.currentUser.stats.totalScore += score;
        
        // Add achievement
        if (won) {
            this.currentUser.stats.achievements.push({
                game: gameId,
                type: 'win',
                timestamp: Date.now()
            });
        }
        
        this.saveUsers();
    }

    // Add friend
    addFriend(username) {
        if (!this.currentUser || this.currentUser.isGuest) return false;
        
        if (this.users[username] && !this.currentUser.friends.includes(username)) {
            this.currentUser.friends.push(username);
            this.saveUsers();
            return true;
        }
        return false;
    }

    // Get leaderboard
    getLeaderboard() {
        return Object.values(this.users)
            .filter(u => !u.isGuest)
            .sort((a, b) => b.stats.totalScore - a.stats.totalScore)
            .slice(0, 10);
    }
}

// Global user system
GamePlatform.userSystem = new UserSystem();


function loadUserData() {
    const savedUser = localStorage.getItem('gamehub_current_user');
    if (!savedUser) return;

    try {
        const user = JSON.parse(savedUser);
        GamePlatform.currentUser = user;
        GamePlatform.userSystem.currentUser = user;
        document.getElementById('userDisplay').textContent =
            `Welcome, ${user.username}${user.isGuest ? ' (Guest)' : ''}!`;
        showScreen('lobbyScreen');
        renderFriends();
        loadAchievements();
    } catch (error) {
        console.warn('Failed to load saved user data.', error);
        localStorage.removeItem('gamehub_current_user');
    }
}

// UI Functions
function login() {
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value;

    if (!username) {
        document.getElementById('loginStatus').textContent = 'Please enter username';
        return;
    }

    try {
        const result = GamePlatform.userSystem.login(username, password);

        if (result.success) {
            GamePlatform.currentUser = result.user;
            localStorage.setItem('gamehub_current_user', JSON.stringify(result.user));
            document.getElementById('userDisplay').textContent =
                `Welcome, ${result.user.username}${result.user.isGuest ? ' (Guest)' : ''}!`;
            showScreen('lobbyScreen');
            renderFriends();
            loadAchievements();
            return;
        }

        document.getElementById('loginStatus').textContent = result.error;
    } catch (error) {
        console.error('Login failed unexpectedly.', error);
        document.getElementById('loginStatus').textContent = 'Login failed. Please refresh and try again.';
    }
}

function guestLogin() {
    const result = GamePlatform.userSystem.loginGuest();
    GamePlatform.currentUser = result.user;
    localStorage.setItem('gamehub_current_user', JSON.stringify(result.user));
    document.getElementById('userDisplay').textContent = `Welcome, ${result.user.username} (Guest)!`;
    showScreen('lobbyScreen');
}

function logout() {
    GamePlatform.userSystem.logout();
    GamePlatform.currentUser = null;
    localStorage.removeItem('gamehub_current_user');
    showScreen('loginScreen');
}

function renderFriends() {
    const list = document.getElementById('friendsList');
    if (!GamePlatform.currentUser || !GamePlatform.currentUser.friends) {
        list.innerHTML = '<div>No friends</div>';
        return;
    }
    
    list.innerHTML = GamePlatform.currentUser.friends
        .map(friend => `<div class="friend-item">${friend}</div>`)
        .join('');
}

function loadAchievements() {
    // Display achievements in user profile area
    const user = GamePlatform.currentUser;
    if (!user || !user.stats || !user.stats.achievements) return;

    console.log('Achievements loaded:', user.stats.achievements);
}
