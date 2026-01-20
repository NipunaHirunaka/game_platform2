// Global State
window.GamePlatform = {
    currentUser: null,
    currentScreen: 'login',
    games: {},
    network: null,
    currentGame: null,
    gameInstance: null
};

// Screen Management
function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(screenId).classList.add('active');
    GamePlatform.currentScreen = screenId;
}

// Initialize Platform
window.addEventListener('DOMContentLoaded', () => {
    initializeGames();
    loadUserData();
});

// Game Registry
function initializeGames() {
    const gameRegistry = [
        {
            id: 'racing3d',
            name: 'Racing Thunder 3D',
            icon: '🏁',
            category: ['3d', 'racing', 'multiplayer'],
            description: 'High-speed 3D racing with multiplayer',
            module: Racing3DGame
        },
        {
            id: 'spaceShooter',
            name: 'Space Shooter',
            icon: '👾',
            category: ['2d', 'shooter', 'classic'],
            description: 'Destroy alien invaders',
            module: ShooterGame
        },
        {
            id: 'streetFighter',
            name: 'Street Fighter',
            icon: '🥊',
            category: ['2d', 'fighting', 'multiplayer'],
            description: '1v1 fighting battles',
            module: FighterGame
        },
        {
            id: 'horrorMaze',
            name: 'Horror Maze',
            icon: '👻',
            category: ['3d', 'horror'],
            description: 'Survive the haunted maze',
            module: HorrorGame
        },
        {
            id: 'snake',
            name: 'Classic Snake',
            icon: '🐍',
            category: ['2d', 'classic'],
            description: 'Retro snake game',
            module: ClassicGames.snake
        },
        {
            id: 'tetris',
            name: 'Tetris',
            icon: '🧱',
            category: ['2d', 'classic'],
            description: 'Block stacking puzzle',
            module: ClassicGames.tetris
        },
        {
            id: 'battleArena',
            name: 'Battle Arena',
            icon: '⚔️',
            category: ['3d', 'shooting', 'multiplayer'],
            description: 'Multiplayer FPS combat',
            module: BattleArenaGame
        }
    ];

    // Register games
    gameRegistry.forEach(game => {
        GamePlatform.games[game.id] = game;
    });

    // Render game library
    renderGameLibrary();
}

// Render Games Grid
function renderGameLibrary(filter = 'all') {
    const grid = document.getElementById('gamesGrid');
    grid.innerHTML = '';

    Object.values(GamePlatform.games).forEach(game => {
        if (filter !== 'all' && !game.category.includes(filter)) return;

        const card = document.createElement('div');
        card.className = 'game-card';
        card.onclick = () => launchGame(game.id);

        const isMultiplayer = game.category.includes('multiplayer');
        
        card.innerHTML = `
            <div class="game-thumbnail">${game.icon}</div>
            ${isMultiplayer ? '<div class="multiplayer-badge">MP</div>' : ''}
            <div class="game-info">
                <h4>${game.name}</h4>
                <p>${game.description}</p>
                <div class="game-tags">
                    ${game.category.map(cat => `<span class="tag">${cat}</span>`).join('')}
                </div>
            </div>
        `;
        
        grid.appendChild(card);
    });
}

// Filter Buttons
document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            renderGameLibrary(e.target.dataset.filter);
        });
    });
});

// Launch Game
function launchGame(gameId) {
    const game = GamePlatform.games[gameId];
    if (!game) return;

    GamePlatform.currentGame = game;
    document.getElementById('currentGameTitle').textContent = game.name;
    
    // Clear previous game
    const container = document.getElementById('gameContainer');
    container.innerHTML = '';
    
    // Initialize new game
    GamePlatform.gameInstance = new game.module(container);
    if (GamePlatform.gameInstance.init) {
        GamePlatform.gameInstance.init();
    }
    
    showScreen('gameScreen');
}

// Exit Game
function exitGame() {
    if (GamePlatform.gameInstance && GamePlatform.gameInstance.destroy) {
        GamePlatform.gameInstance.destroy();
    }
    GamePlatform.gameInstance = null;
    GamePlatform.currentGame = null;
    showScreen('lobbyScreen');
}

// Fullscreen toggle
function toggleFullscreen() {
    const container = document.getElementById('gameContainer');
    if (!document.fullscreenElement) {
        container.requestFullscreen().catch(err => {
            console.log(`Error: ${err.message}`);
        });
    } else {
        document.exitFullscreen();
    }
}

// Audio toggle
function toggleAudio() {
    const btn = event.target;
    const currentState = btn.textContent;
    btn.textContent = currentState === 'Audio: ON' ? 'Audio: OFF' : 'Audio: ON';
}
