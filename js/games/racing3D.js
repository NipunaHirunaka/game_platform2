// 3D Racing Game
class Racing3DGame extends WebGL3DEngine {
    init() {
        super.init();
        
        // Setup scene
        this.scene.background = new THREE.Color(0x87CEEB);
        
        // Lighting
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        this.scene.add(ambientLight);
        
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(10, 20, 5);
        directionalLight.castShadow = true;
        this.scene.add(directionalLight);
        
        // Create track
        this.createTrack();
        
        // Create car
        this.createCar();
        
        // Camera position
        this.camera.position.set(0, 10, 15);
        this.camera.lookAt(0, 0, 0);
        
        // Controls
        this.carSpeed = 0;
        this.carRotation = 0;
        this.keys = {};
        
        window.addEventListener('keydown', (e) => this.keys[e.code] = true);
        window.addEventListener('keyup', (e) => this.keys[e.code] = false);
        
        // Multiplayer sync
        if (GamePlatform.network) {
            this.syncInterval = setInterval(() => this.syncState(), 100);
        }
    }

    createTrack() {
        // Ground
        const groundGeometry = new THREE.PlaneGeometry(200, 200);
        const groundMaterial = new THREE.MeshLambertMaterial({ color: 0x555555 });
        const ground = new THREE.Mesh(groundGeometry, groundMaterial);
        ground.rotation.x = -Math.PI / 2;
        ground.receiveShadow = true;
        this.scene.add(ground);
        
        // Track borders
        for (let i = 0; i < 4; i++) {
            const wallGeometry = new THREE.BoxGeometry(200, 2, 2);
            const wallMaterial = new THREE.MeshLambertMaterial({ color: 0xff0000 });
            const wall = new THREE.Mesh(wallGeometry, wallMaterial);
            
            const angle = (i * Math.PI) / 2;
            wall.position.x = Math.cos(angle) * 50;
            wall.position.z = Math.sin(angle) * 50;
            wall.rotation.y = angle + Math.PI / 2;
            
            this.scene.add(wall);
        }
        
        // Checkpoints
        this.checkpoints = [];
        for (let i = 0; i < 5; i++) {
            const checkpointGeometry = new THREE.BoxGeometry(10, 0.1, 2);
            const checkpointMaterial = new THREE.MeshLambertMaterial({ color: 0x00ff00 });
            const checkpoint = new THREE.Mesh(checkpointGeometry, checkpointMaterial);
            checkpoint.position.x = (i - 2) * 30;
            checkpoint.position.y = 0.1;
            this.scene.add(checkpoint);
            this.checkpoints.push(checkpoint);
        }
    }

    createCar() {
        const carGeometry = new THREE.BoxGeometry(1, 0.5, 2);
        const carMaterial = new THREE.MeshLambertMaterial({ color: 0x0000ff });
        this.car = new THREE.Mesh(carGeometry, carMaterial);
        this.car.position.y = 0.5;
        this.car.castShadow = true;
        this.scene.add(this.car);
        
        this.carPosition = { x: 0, z: 0, rotation: 0 };
    }

    update(deltaTime) {
        if (!this.car) return;
        
        // Car physics
        if (this.keys['KeyW'] || this.keys['ArrowUp']) {
            this.carSpeed = Math.min(this.carSpeed + 0.01, 0.3);
        }
        if (this.keys['KeyS'] || this.keys['ArrowDown']) {
            this.carSpeed = Math.max(this.carSpeed - 0.01, -0.1);
        }
        if (this.keys['KeyA'] || this.keys['ArrowLeft']) {
            this.carRotation += 0.05;
        }
        if (this.keys['KeyD'] || this.keys['ArrowRight']) {
            this.carRotation -= 0.05;
        }
        
        // Apply friction
        this.carSpeed *= 0.98;
        
        // Update position
        this.carPosition.x += Math.sin(this.carRotation) * this.carSpeed;
        this.carPosition.z += Math.cos(this.carRotation) * this.carSpeed;
        this.carPosition.rotation = this.carRotation;
        
        // Apply to mesh
        this.car.position.x = this.carPosition.x;
        this.car.position.z = this.carPosition.z;
        this.car.rotation.y = this.carRotation;
        
        // Camera follow
        this.camera.position.x = this.car.position.x;
        this.camera.position.z = this.car.position.z + 15;
        this.camera.lookAt(this.car.position);
    }

    syncState() {
        if (!GamePlatform.currentGame) return;
        
        const roomId = document.getElementById('roomId').value;
        if (!roomId) return;
        
        GamePlatform.network.broadcastToRoom(roomId, {
            type: 'gameState',
            game: GamePlatform.currentGame.id,
            position: this.carPosition
        });
    }

    getGameState() {
        return {
            carPosition: this.carPosition,
            carSpeed: this.carSpeed
        };
    }

    setGameState(state) {
        this.carPosition = state.carPosition;
        this.carSpeed = state.carSpeed;
    }

    destroy() {
        super.destroy();
        if (this.syncInterval) {
            clearInterval(this.syncInterval);
        }
        window.removeEventListener('keydown', this.keysHandler);
        window.removeEventListener('keyup', this.keysHandler);
    }
}
