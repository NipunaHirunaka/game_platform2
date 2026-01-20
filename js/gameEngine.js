// Base Game Engine Class
class GameEngine {
    constructor(container) {
        this.container = container;
        this.isRunning = false;
        this.frameId = null;
        this.lastTime = 0;
        this.fps = 60;
        this.frameInterval = 1000 / this.fps;
    }

    // Initialize game
    init() {
        this.isRunning = true;
        this.lastTime = performance.now();
        this.gameLoop();
    }

    // Main game loop
    gameLoop(currentTime = 0) {
        if (!this.isRunning) return;

        const deltaTime = currentTime - this.lastTime;
        
        if (deltaTime >= this.frameInterval) {
            this.update(deltaTime);
            this.render();
            this.lastTime = currentTime - (deltaTime % this.frameInterval);
        }

        this.frameId = requestAnimationFrame((time) => this.gameLoop(time));
    }

    // Update game state
    update(deltaTime) {
        // Override in subclass
    }

    // Render game
    render() {
        // Override in subclass
    }

    // Stop game
    destroy() {
        this.isRunning = false;
        if (this.frameId) {
            cancelAnimationFrame(this.frameId);
        }
    }

    // Handle input
    handleInput(event) {
        // Override in subclass
    }

    // Play sound
    playSound(soundId) {
        // Audio management
        if (GamePlatform.currentUser?.settings.audio) {
            // Play sound
        }
    }

    // Save game state
    saveGame() {
        const state = this.getGameState();
        localStorage.setItem(`gamestate_${this.constructor.name}`, JSON.stringify(state));
    }

    // Load game state
    loadGame() {
        const state = localStorage.getItem(`gamestate_${this.constructor.name}`);
        if (state) {
            this.setGameState(JSON.parse(state));
        }
    }

    // Get game state for saving
    getGameState() {
        return {};
    }

    // Set game state for loading
    setGameState(state) {
        // Override in subclass
    }
}

// 2D Canvas Game Engine
class Canvas2DEngine extends GameEngine {
    constructor(container, width = 800, height = 600) {
        super(container);
        
        this.canvas = document.createElement('canvas');
        this.canvas.width = width;
        this.canvas.height = height;
        this.canvas.style.border = '1px solid #444';
        this.ctx = this.canvas.getContext('2d');
        
        container.appendChild(this.canvas);
        
        // Setup input
        this.keys = new Set();
        this.setupInput();
    }

    setupInput() {
        window.addEventListener('keydown', (e) => {
            this.keys.add(e.code);
            this.handleInput(e);
        });

        window.addEventListener('keyup', (e) => {
            this.keys.delete(e.code);
        });
    }

    clear() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }

    fill(color) {
        this.ctx.fillStyle = color;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }
}

// 3D WebGL Game Engine
class WebGL3DEngine extends GameEngine {
    constructor(container) {
        super(container);
        
        // Create Three.js scene
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(
            75, 
            container.clientWidth / container.clientHeight, 
            0.1, 
            1000
        );
        
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(container.clientWidth, container.clientHeight);
        this.renderer.shadowMap.enabled = true;
        
        container.appendChild(this.renderer.domElement);
        
        // Handle resize
        window.addEventListener('resize', () => this.handleResize());
    }

    handleResize() {
        const width = this.container.clientWidth;
        const height = this.container.clientHeight;
        
        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(width, height);
    }

    render() {
        this.renderer.render(this.scene, this.camera);
    }

    destroy() {
        super.destroy();
        this.renderer.dispose();
    }
}
