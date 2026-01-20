// Space Shooter Game
class ShooterGame extends Canvas2DEngine {
    init() {
        super.init();
        
        // Game state
        this.player = {
            x: this.canvas.width / 2,
            y: this.canvas.height - 50,
            width: 40,
            height: 30,
            speed: 5
        };
        
        this.bullets = [];
        this.enemies = [];
        this.stars = [];
        this.score = 0;
        this.lives = 3;
        
        // Create stars background
        for (let i = 0; i < 100; i++) {
            this.stars.push({
                x: Math.random() * this.canvas.width,
                y: Math.random() * this.canvas.height,
                size: Math.random() * 2
            });
        }
        
        // Spawn enemies
        this.enemySpawnTimer = 0;
        
        // Setup controls
        this.shootCooldown = 0;
        
        // Listen for network
        if (GamePlatform.network) {
            GamePlatform.network.onMessage((msg) => {
                if (msg.data.type === 'enemyDestroy') {
                    this.removeEnemy(msg.data.enemyId);
                }
            });
        }
    }

    update(deltaTime) {
        // Update stars
        this.stars.forEach(star => {
            star.y += star.size * 0.5;
            if (star.y > this.canvas.height) {
                star.y = 0;
                star.x = Math.random() * this.canvas.width;
            }
        });
        
        // Player movement
        if (this.keys.has('ArrowLeft') && this.player.x > 0) {
            this.player.x -= this.player.speed;
        }
        if (this.keys.has('ArrowRight') && this.player.x < this.canvas.width - this.player.width) {
            this.player.x += this.player.speed;
        }
        if (this.keys.has('ArrowUp') && this.player.y > this.canvas.height / 2) {
            this.player.y -= this.player.speed;
        }
        if (this.keys.has('ArrowDown') && this.player.y < this.canvas.height - this.player.height) {
            this.player.y += this.player.speed;
        }
        
        // Shooting
        this.shootCooldown--;
        if (this.keys.has('Space') && this.shootCooldown <= 0) {
            this.bullets.push({
                x: this.player.x + this.player.width / 2,
                y: this.player.y,
                width: 4,
                height: 10,
                speed: 8
            });
            this.shootCooldown = 10;
        }
        
        // Update bullets
        this.bullets = this.bullets.filter(bullet => {
            bullet.y -= bullet.speed;
            return bullet.y > -10;
        });
        
        // Spawn enemies
        this.enemySpawnTimer++;
        if (this.enemySpawnTimer > 60) {
            this.enemies.push({
                id: Math.random(),
                x: Math.random() * (this.canvas.width - 40),
                y: -30,
                width: 35,
                height: 25,
                speed: 1 + Math.random() * 2,
                health: 2
            });
            this.enemySpawnTimer = 0;
        }
        
        // Update enemies
        this.enemies.forEach(enemy => {
            enemy.y += enemy.speed;
        });
        
        // Remove off-screen enemies
        this.enemies = this.enemies.filter(enemy => enemy.y < this.canvas.height + 30);
        
        // Collision detection
        this.checkCollisions();
        
        // Update score
        if (Math.random() < 0.02) this.score++;
    }

    checkCollisions() {
        // Bullets vs Enemies
        this.bullets.forEach((bullet, bIndex) => {
            this.enemies.forEach((enemy, eIndex) => {
                if (this.isColliding(bullet, enemy)) {
                    enemy.health--;
                    this.bullets.splice(bIndex, 1);
                    
                    if (enemy.health <= 0) {
                        this.enemies.splice(eIndex, 1);
                        this.score += 100;
                        
                        // Broadcast destroy
                        if (GamePlatform.network) {
                            const roomId = document.getElementById('roomId').value;
                            if (roomId) {
                                GamePlatform.network.broadcastToRoom(roomId, {
                                    type: 'enemyDestroy',
                                    enemyId: enemy.id
                                });
                            }
                        }
                    }
                }
            });
        });
        
        // Enemies vs Player
        this.enemies.forEach(enemy => {
            if (this.isColliding(enemy, this.player)) {
                this.lives--;
                this.enemies = this.enemies.filter(e => e !== enemy);
                
                if (this.lives <= 0) {
                    this.gameOver();
                }
            }
        });
    }

    isColliding(a, b) {
        return a.x < b.x + b.width &&
               a.x + a.width > b.x &&
               a.y < b.y + b.height &&
               a.y + a.height > b.y;
    }

    removeEnemy(enemyId) {
        this.enemies = this.enemies.filter(e => e.id !== enemyId);
    }

    render() {
        this.clear();
        
        // Draw stars
        this.ctx.fillStyle = 'white';
        this.stars.forEach(star => {
            this.ctx.fillRect(star.x, star.y, star.size, star.size);
        });
        
        // Draw player
        this.ctx.fillStyle = '#00ff00';
        this.ctx.fillRect(this.player.x, this.player.y, this.player.width, this.player.height);
        
        // Draw bullets
        this.ctx.fillStyle = '#ffff00';
        this.bullets.forEach(bullet => {
            this.ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);
        });
        
        // Draw enemies
        this.ctx.fillStyle = '#ff0000';
        this.enemies.forEach(enemy => {
            this.ctx.fillRect(enemy.x, enemy.y, enemy.width, enemy.height);
        });
        
        // Draw UI
        this.ctx.fillStyle = 'white';
        this.ctx.font = '20px Arial';
        this.ctx.fillText(`Score: ${this.score}`, 10, 30);
        this.ctx.fillText(`Lives: ${this.lives}`, 10, 60);
    }

    gameOver() {
        alert(`Game Over! Score: ${this.score}`);
        
        // Update stats
        if (!GamePlatform.currentUser.isGuest) {
            GamePlatform.userSystem.updateStats('spaceShooter', this.score);
        }
        
        this.destroy();
        exitGame();
    }

    getGameState() {
        return {
            score: this.score,
            lives: this.lives,
            playerPos: { x: this.player.x, y: this.player.y }
        };
    }

    setGameState(state) {
        this.score = state.score;
        this.lives = state.lives;
        this.player.x = state.playerPos.x;
        this.player.y = state.playerPos.y;
    }
}
