// Classic Games Collection
const ClassicGames = {
    // Snake Game
    snake: class extends Canvas2DEngine {
        init() {
            super.init();
            
            this.gridSize = 20;
            this.tileCount = this.canvas.width / this.gridSize;
            
            this.snake = [
                { x: 10, y: 10 }
            ];
            this.direction = { x: 0, y: 0 };
            this.food = this.spawnFood();
            this.score = 0;
            this.gameOverFlag = false;
            
            // Input
            window.addEventListener('keydown', (e) => this.changeDirection(e));
        }
        
        changeDirection(e) {
            if (this.gameOverFlag) return;
            
            switch(e.code) {
                case 'ArrowUp':
                    if (this.direction.y === 0) {
                        this.direction = { x: 0, y: -1 };
                    }
                    break;
                case 'ArrowDown':
                    if (this.direction.y === 0) {
                        this.direction = { x: 0, y: 1 };
                    }
                    break;
                case 'ArrowLeft':
                    if (this.direction.x === 0) {
                        this.direction = { x: -1, y: 0 };
                    }
                    break;
                case 'ArrowRight':
                    if (this.direction.x === 0) {
                        this.direction = { x: 1, y: 0 };
                    }
                    break;
            }
        }
        
        update(deltaTime) {
            if (this.gameOverFlag) return;
            
            // Move snake
            if (this.direction.x !== 0 || this.direction.y !== 0) {
                const head = {
                    x: this.snake[0].x + this.direction.x,
                    y: this.snake[0].y + this.direction.y
                };
                
                // Check walls
                if (head.x < 0 || head.x >= this.tileCount || 
                    head.y < 0 || head.y >= this.tileCount) {
                    this.gameOver();
                    return;
                }
                
                // Check self collision
                for (let segment of this.snake) {
                    if (head.x === segment.x && head.y === segment.y) {
                        this.gameOver();
                        return;
                    }
                }
                
                this.snake.unshift(head);
                
                // Check food
                if (head.x === this.food.x && head.y === this.food.y) {
                    this.score++;
                    this.food = this.spawnFood();
                } else {
                    this.snake.pop();
                }
            }
        }
        
        spawnFood() {
            return {
                x: Math.floor(Math.random() * this.tileCount),
                y: Math.floor(Math.random() * this.tileCount)
            };
        }
        
        render() {
            this.clear();
            
            // Draw snake
            this.ctx.fillStyle = '#00ff00';
            this.snake.forEach((segment, index) => {
                if (index === 0) {
                    this.ctx.fillStyle = '#00aa00'; // Head
                } else {
                    this.ctx.fillStyle = '#00ff00';
                }
                this.ctx.fillRect(
                    segment.x * this.gridSize,
                    segment.y * this.gridSize,
                    this.gridSize - 2,
                    this.gridSize - 2
                );
            });
            
            // Draw food
            this.ctx.fillStyle = '#ff0000';
            this.ctx.fillRect(
                this.food.x * this.gridSize,
                this.food.y * this.gridSize,
                this.gridSize - 2,
                this.gridSize - 2
            );
            
            // Draw score
            this.ctx.fillStyle = 'white';
            this.ctx.font = '20px Arial';
            this.ctx.fillText(`Score: ${this.score}`, 10, 30);
            
            if (this.gameOverFlag) {
                this.ctx.fillStyle = 'rgba(0,0,0,0.7)';
                this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
                this.ctx.fillStyle = 'red';
                this.ctx.font = '40px Arial';
                this.ctx.fillText('GAME OVER', this.canvas.width / 2 - 120, this.canvas.height / 2);
            }
        }
        
        gameOver() {
            this.gameOverFlag = true;
            
            if (!GamePlatform.currentUser.isGuest) {
                GamePlatform.userSystem.updateStats('snake', this.score);
            }
            
            setTimeout(() => {
                this.destroy();
                exitGame();
            }, 3000);
        }
    },
    
    // Tetris Game
    tetris: class extends Canvas2DEngine {
        init() {
            super.init();
            
            this.boardWidth = 10;
            this.boardHeight = 20;
            this.blockSize = this.canvas.width / this.boardWidth;
            
            this.board = Array(this.boardHeight).fill().map(() => Array(this.boardWidth).fill(0));
            
            this.pieces = [
                [[1,1,1,1]], // I
                [[1,1],[1,1]], // O
                [[0,1,0],[1,1,1]], // T
                [[1,1,0],[0,1,1]], // S
                [[0,1,1],[1,1,0]], // Z
                [[1,0,0],[1,1,1]], // J
                [[0,0,1],[1,1,1]]  // L
            ];
            
            this.colors = ['#00f0f0', '#f0f000', '#a000f0', '#00f000', '#f00000', '#0000f0', '#f0a000'];
            
            this.currentPiece = this.newPiece();
            this.dropCounter = 0;
            this.dropInterval = 1000; // ms
            this.score = 0;
            this.gameOverFlag = false;
            
            window.addEventListener('keydown', (e) => this.handleInput(e));
        }
        
        newPiece() {
            const piece = this.pieces[Math.floor(Math.random() * this.pieces.length)];
            return {
                shape: piece.map(row => [...row]),
                x: Math.floor((this.boardWidth - piece[0].length) / 2),
                y: 0,
                color: this.colors[this.pieces.indexOf(piece)]
            };
        }
        
        handleInput(e) {
            if (this.gameOverFlag) return;
            
            switch(e.code) {
                case 'ArrowLeft':
                    this.movePiece(-1, 0);
                    break;
                case 'ArrowRight':
                    this.movePiece(1, 0);
                    break;
                case 'ArrowDown':
                    this.movePiece(0, 1);
                    break;
                case 'ArrowUp':
                    this.rotatePiece();
                    break;
                case 'Space':
                    this.dropPiece();
                    break;
            }
        }
        
        movePiece(dx, dy) {
            this.currentPiece.x += dx;
            this.currentPiece.y += dy;
            
            if (this.collision()) {
                this.currentPiece.x -= dx;
                this.currentPiece.y -= dy;
                return false;
            }
            return true;
        }
        
        rotatePiece() {
            const rotated = this.currentPiece.shape[0].map((_, i) =>
                this.currentPiece.shape.map(row => row[i]).reverse()
            );
            
            const original = this.currentPiece.shape;
            this.currentPiece.shape = rotated;
            
            if (this.collision()) {
                this.currentPiece.shape = original;
            }
        }
        
        collision() {
            for (let y = 0; y < this.currentPiece.shape.length; y++) {
                for (let x = 0; x < this.currentPiece.shape[y].length; x++) {
                    if (this.currentPiece.shape[y][x]) {
                        const boardX = this.currentPiece.x + x;
                        const boardY = this.currentPiece.y + y;
                        
                        if (boardX < 0 || boardX >= this.boardWidth || 
                            boardY >= this.boardHeight) {
                            return true;
                        }
                        
                        if (boardY >= 0 && this.board[boardY][boardX]) {
                            return true;
                        }
                    }
                }
            }
            return false;
        }
        
        dropPiece() {
            while (this.movePiece(0, 1)) {}
            this.lockPiece();
        }
        
        lockPiece() {
            for (let y = 0; y < this.currentPiece.shape.length; y++) {
                for (let x = 0; x < this.currentPiece.shape[y].length; x++) {
                    if (this.currentPiece.shape[y][x]) {
                        const boardY = this.currentPiece.y + y;
                        if (boardY < 0) {
                            this.gameOver();
                            return;
                        }
                        this.board[boardY][this.currentPiece.x + x] = this.currentPiece.color;
                    }
                }
            }
            
            this.clearLines();
            this.currentPiece = this.newPiece();
        }
        
        clearLines() {
            for (let y = this.boardHeight - 1; y >= 0; y--) {
                if (this.board[y].every(cell => cell !== 0)) {
                    this.board.splice(y, 1);
                    this.board.unshift(Array(this.boardWidth).fill(0));
                    this.score += 100;
                    y++; // Check same line again
                }
            }
        }
        
        update(deltaTime) {
            if (this.gameOverFlag) return;
            
            this.dropCounter += deltaTime;
            if (this.dropCounter > this.dropInterval) {
                if (!this.movePiece(0, 1)) {
                    this.lockPiece();
                }
                this.dropCounter = 0;
            }
        }
        
        render() {
            this.clear();
            
            // Draw board
            for (let y = 0; y < this.boardHeight; y++) {
                for (let x = 0; x < this.boardWidth; x++) {
                    if (this.board[y][x]) {
                        this.ctx.fillStyle = this.board[y][x];
                        this.ctx.fillRect(
                            x * this.blockSize,
                            y * this.blockSize,
                            this.blockSize - 1,
                            this.blockSize - 1
                        );
                    }
                }
            }
            
            // Draw current piece
            this.ctx.fillStyle = this.currentPiece.color;
            for (let y = 0; y < this.currentPiece.shape.length; y++) {
                for (let x = 0; x < this.currentPiece.shape[y].length; x++) {
                    if (this.currentPiece.shape[y][x]) {
                        this.ctx.fillRect(
                            (this.currentPiece.x + x) * this.blockSize,
                            (this.currentPiece.y + y) * this.blockSize,
                            this.blockSize - 1,
                            this.blockSize - 1
                        );
                    }
                }
            }
            
            // Draw grid
            this.ctx.strokeStyle = '#333';
            for (let i = 0; i <= this.boardWidth; i++) {
                this.ctx.beginPath();
                this.ctx.moveTo(i * this.blockSize, 0);
                this.ctx.lineTo(i * this.blockSize, this.canvas.height);
                this.ctx.stroke();
            }
            for (let i = 0; i <= this.boardHeight; i++) {
                this.ctx.beginPath();
                this.ctx.moveTo(0, i * this.blockSize);
                this.ctx.lineTo(this.canvas.width, i * this.blockSize);
                this.ctx.stroke();
            }
            
            // Draw score
            this.ctx.fillStyle = 'white';
            this.ctx.font = '20px Arial';
            this.ctx.fillText(`Score: ${this.score}`, 10, 30);
            
            if (this.gameOverFlag) {
                this.ctx.fillStyle = 'rgba(0,0,0,0.7)';
                this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
                this.ctx.fillStyle = 'red';
                this.ctx.font = '40px Arial';
                this.ctx.fillText('GAME OVER', this.canvas.width / 2 - 120, this.canvas.height / 2);
            }
        }
        
        gameOver() {
            this.gameOverFlag = true;
            
            if (!GamePlatform.currentUser.isGuest) {
                GamePlatform.userSystem.updateStats('tetris', this.score);
            }
            
            setTimeout(() => {
                this.destroy();
                exitGame();
            }, 3000);
        }
    }
};
