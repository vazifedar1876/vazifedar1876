import authManager from '../core/auth.js';
import database from '../core/database.js';
import { Utils } from '../core/utils.js';

class IntizamGame {
    constructor() {
        this.BOARD_WIDTH = 10;
        this.BOARD_HEIGHT = 20;
        this.BLOCK_SIZE = 30;
        
        this.board = [];
        this.score = 0;
        this.level = 1;
        this.lines = 0;
        this.gameOver = false;
        this.paused = false;
        
        this.SHAPES = {
            I: [[1,1,1,1]],
            J: [[1,0,0],[1,1,1]],
            L: [[0,0,1],[1,1,1]],
            O: [[1,1],[1,1]],
            S: [[0,1,1],[1,1,0]],
            T: [[0,1,0],[1,1,1]],
            Z: [[1,1,0],[0,1,1]]
        };
        
        this.COLORS = {
            I: '#00f5d4',
            J: '#9d4edd',
            L: '#f8961e',
            O: '#f94144',
            S: '#43aa8b',
            T: '#577590',
            Z: '#f9c74f'
        };
        
        this.currentPiece = null;
        this.nextPiece = null;
        this.piecePosition = {x: 0, y: 0};
        this.gameInterval = null;
        this.startTime = null;
        this.hasenat = 0;
        
        this.init();
    }
    
    init() {
        this.canvas = document.getElementById('game-board');
        this.ctx = this.canvas.getContext('2d');
        this.nextCanvas = document.getElementById('next-piece');
        this.nextCtx = this.nextCanvas.getContext('2d');
        
        this.setupEventListeners();
        this.updateStatsFromStorage();
        this.showGameRules();
    }
    
    setupEventListeners() {
        // Klavye kontrolleri
        document.addEventListener('keydown', (e) => this.handleKeyDown(e));
        
        // Buton event'leri
        const moveLeftBtn = document.querySelector('button[onclick*="moveLeft"]');
        const moveRightBtn = document.querySelector('button[onclick*="moveRight"]');
        const rotateBtn = document.querySelector('button[onclick*="rotatePiece"]');
        const dropBtn = document.querySelector('button[onclick*="dropPiece"]');
        const pauseBtn = document.querySelector('button[onclick*="pauseGame"]');
        const startBtn = document.getElementById('start-btn');
        
        if (moveLeftBtn) {
            moveLeftBtn.onclick = () => this.moveLeft();
            moveLeftBtn.removeAttribute('onclick');
        }
        if (moveRightBtn) {
            moveRightBtn.onclick = () => this.moveRight();
            moveRightBtn.removeAttribute('onclick');
        }
        if (rotateBtn) {
            rotateBtn.onclick = () => this.rotatePiece();
            rotateBtn.removeAttribute('onclick');
        }
        if (dropBtn) {
            dropBtn.onclick = () => this.dropPiece();
            dropBtn.removeAttribute('onclick');
        }
        if (pauseBtn) {
            pauseBtn.onclick = () => this.pauseGame();
            pauseBtn.removeAttribute('onclick');
        }
        if (startBtn) {
            startBtn.onclick = () => this.startGame();
            startBtn.removeAttribute('onclick');
        }
        
        // Ana menü butonu
        const menuBtn = document.querySelector('button[onclick*="index.html"]');
        if (menuBtn) {
            menuBtn.onclick = () => window.location.href = 'index.html';
        }
    }
    
    handleKeyDown(e) {
        if (this.gameOver) return;
        
        switch(e.key) {
            case 'ArrowLeft': this.moveLeft(); break;
            case 'ArrowRight': this.moveRight(); break;
            case 'ArrowUp': this.rotatePiece(); break;
            case 'ArrowDown': this.moveDown(); break;
            case ' ': this.dropPiece(); break;
            case 'p': case 'P': this.pauseGame(); break;
            case 'r': case 'R': this.startGame(); break;
        }
    }
    
    initBoard() {
        this.board = Array(this.BOARD_HEIGHT).fill().map(() => Array(this.BOARD_WIDTH).fill(0));
    }
    
    getRandomPiece() {
        const pieces = Object.keys(this.SHAPES);
        const pieceName = pieces[Math.floor(Math.random() * pieces.length)];
        return {
            name: pieceName,
            shape: this.SHAPES[pieceName],
            color: this.COLORS[pieceName]
        };
    }
    
    drawBoard() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Board'u çiz
        for(let y = 0; y < this.BOARD_HEIGHT; y++) {
            for(let x = 0; x < this.BOARD_WIDTH; x++) {
                if(this.board[y][x]) {
                    this.ctx.fillStyle = this.board[y][x];
                    this.ctx.fillRect(x * this.BLOCK_SIZE, y * this.BLOCK_SIZE, this.BLOCK_SIZE, this.BLOCK_SIZE);
                    this.ctx.strokeStyle = 'rgba(255,255,255,0.3)';
                    this.ctx.strokeRect(x * this.BLOCK_SIZE, y * this.BLOCK_SIZE, this.BLOCK_SIZE, this.BLOCK_SIZE);
                }
            }
        }
        
        // Aktif parçayı çiz
        if(this.currentPiece && !this.gameOver) {
            this.drawPiece(this.ctx, this.currentPiece, this.piecePosition.x, this.piecePosition.y);
        }
    }
    
    drawPiece(context, piece, x, y) {
        context.fillStyle = piece.color;
        for(let py = 0; py < piece.shape.length; py++) {
            for(let px = 0; px < piece.shape[py].length; px++) {
                if(piece.shape[py][px]) {
                    context.fillRect(
                        (x + px) * this.BLOCK_SIZE,
                        (y + py) * this.BLOCK_SIZE,
                        this.BLOCK_SIZE, this.BLOCK_SIZE
                    );
                    context.strokeStyle = 'rgba(255,255,255,0.3)';
                    context.strokeRect(
                        (x + px) * this.BLOCK_SIZE,
                        (y + py) * this.BLOCK_SIZE,
                        this.BLOCK_SIZE, this.BLOCK_SIZE
                    );
                }
            }
        }
    }
    
    drawNextPiece() {
        this.nextCtx.clearRect(0, 0, this.nextCanvas.width, this.nextCanvas.height);
        if(this.nextPiece) {
            const offsetX = (4 - this.nextPiece.shape[0].length) / 2;
            const offsetY = (4 - this.nextPiece.shape.length) / 2;
            this.drawPiece(this.nextCtx, this.nextPiece, offsetX, offsetY);
        }
    }
    
    newPiece() {
        this.currentPiece = this.nextPiece || this.getRandomPiece();
        this.nextPiece = this.getRandomPiece();
        this.piecePosition = {
            x: Math.floor(this.BOARD_WIDTH / 2) - Math.floor(this.currentPiece.shape[0].length / 2),
            y: 0
        };
        
        if(this.checkCollision()) {
            this.gameOver = true;
            this.showMessage('🎮 Oyun Bitti! Son puan: ' + this.score, 'info');
            this.saveGameResult();
            clearInterval(this.gameInterval);
        }
        
        this.drawNextPiece();
    }
    
    checkCollision() {
        for(let y = 0; y < this.currentPiece.shape.length; y++) {
            for(let x = 0; x < this.currentPiece.shape[y].length; x++) {
                if(this.currentPiece.shape[y][x]) {
                    const newX = this.piecePosition.x + x;
                    const newY = this.piecePosition.y + y;
                    
                    if(newX < 0 || newX >= this.BOARD_WIDTH || newY >= this.BOARD_HEIGHT) {
                        return true;
                    }
                    
                    if(newY >= 0 && this.board[newY][newX]) {
                        return true;
                    }
                }
            }
        }
        return false;
    }
    
    mergePiece() {
        for(let y = 0; y < this.currentPiece.shape.length; y++) {
            for(let x = 0; x < this.currentPiece.shape[y].length; x++) {
                if(this.currentPiece.shape[y][x]) {
                    const boardX = this.piecePosition.x + x;
                    const boardY = this.piecePosition.y + y;
                    
                    if(boardY >= 0) {
                        this.board[boardY][boardX] = this.currentPiece.color;
                    }
                }
            }
        }
    }
    
    clearLines() {
        let linesCleared = 0;
        
        for(let y = this.BOARD_HEIGHT - 1; y >= 0; y--) {
            if(this.board[y].every(cell => cell !== 0)) {
                this.board.splice(y, 1);
                this.board.unshift(Array(this.BOARD_WIDTH).fill(0));
                linesCleared++;
                y++;
            }
        }
        
        if(linesCleared > 0) {
            const linePoints = [100, 300, 500, 800];
            const points = linePoints[linesCleared - 1] * this.level;
            this.score += points;
            this.lines += linesCleared;
            this.hasenat += linesCleared * 10;
            
            this.level = Math.floor(this.lines / 10) + 1;
            
            this.updateDisplay();
            this.showMessage(`🎯 ${linesCleared} satır temizlendi! +${points} puan`, 'success');
            
            // Özel başarılar
            this.checkAchievements(linesCleared);
        }
    }
    
    checkAchievements(linesCleared) {
        const achievements = [
            { lines: 1, message: "İlk intizamını sağladın! +10 hasenat" },
            { lines: 4, message: "TETRİS! Mükemmel intizam! +50 hasenat" },
            { lines: 10, message: "10 satır temizledin! Nizam ustası oluyorsun!" },
            { lines: 25, message: "25 satır! İntizam seninle!" }
        ];
        
        achievements.forEach(ach => {
            if (this.lines === ach.lines) {
                this.hasenat += ach.lines * 5;
                this.showMessage(`🏆 ${ach.message}`, 'warning');
            }
        });
    }
    
    moveLeft() {
        if(this.gameOver || this.paused) return;
        this.piecePosition.x--;
        if(this.checkCollision()) {
            this.piecePosition.x++;
        }
        this.drawBoard();
    }
    
    moveRight() {
        if(this.gameOver || this.paused) return;
        this.piecePosition.x++;
        if(this.checkCollision()) {
            this.piecePosition.x--;
        }
        this.drawBoard();
    }
    
    rotatePiece() {
        if(this.gameOver || this.paused) return;
        
        const oldShape = this.currentPiece.shape;
        const rows = oldShape.length;
        const cols = oldShape[0].length;
        const newShape = Array(cols).fill().map(() => Array(rows).fill(0));
        
        for(let y = 0; y < rows; y++) {
            for(let x = 0; x < cols; x++) {
                newShape[x][rows - 1 - y] = oldShape[y][x];
            }
        }
        
        const oldShapeBackup = this.currentPiece.shape;
        this.currentPiece.shape = newShape;
        
        if(this.checkCollision()) {
            this.currentPiece.shape = oldShapeBackup;
        }
        
        this.drawBoard();
    }
    
    dropPiece() {
        if(this.gameOver || this.paused) return;
        
        while(!this.checkCollision()) {
            this.piecePosition.y++;
        }
        this.piecePosition.y--;
        
        this.mergePiece();
        this.clearLines();
        this.newPiece();
        this.drawBoard();
    }
    
    moveDown() {
        if(this.gameOver || this.paused) return;
        
        this.piecePosition.y++;
        if(this.checkCollision()) {
            this.piecePosition.y--;
            this.mergePiece();
            this.clearLines();
            this.newPiece();
        }
        this.drawBoard();
    }
    
    updateDisplay() {
        document.getElementById('score').textContent = this.score;
        document.getElementById('level').textContent = this.level;
        document.getElementById('lines').textContent = this.lines;
        document.getElementById('hasenat').textContent = this.hasenat;
    }
    
    async saveGameResult() {
        const gameData = {
            score: this.score,
            level: this.level,
            lines: this.lines,
            hasenat: this.hasenat,
            date: new Date().toISOString(),
            duration: this.startTime ? Math.floor((Date.now() - this.startTime) / 1000) : 0
        };
        
        // LocalStorage'a kaydet
        const history = Utils.loadFromLocalStorage('intizam_history') || [];
        history.unshift(gameData);
        if (history.length > 10) history.pop();
        Utils.saveToLocalStorage('intizam_history', history);
        
        // Firebase'e kaydet (giriş yapmışsa)
        if (authManager.isLoggedIn()) {
            try {
                const user = authManager.getCurrentUser();
                await database.completeGame(user.uid, 'intizam', this.score);
                await database.updateUserHasenat(user.uid, this.hasenat);
                
                // En yüksek skoru güncelle
                const userData = await database.getUserData(user.uid);
                const highScore = userData?.intizamHighScore || 0;
                if (this.score > highScore) {
                    await database.updateHighScore(user.uid, 'intizam', this.score);
                    Utils.showNotification(`🎉 Yeni rekor! ${this.score} puan`, 'success');
                }
            } catch (error) {
                console.error('Skor kaydetme hatası:', error);
            }
        } else {
            // Misafir için localStorage
            const guestHasenat = Utils.loadFromLocalStorage('guest_hasenat') || 0;
            Utils.saveToLocalStorage('guest_hasenat', guestHasenat + this.hasenat);
        }
        
        // Geçmişi göster
        this.showGameHistory();
    }
    
    showGameHistory() {
        const history = Utils.loadFromLocalStorage('intizam_history') || [];
        if (history.length > 0) {
            const historyHTML = `
                <div style="background: rgba(0,0,0,0.3); padding: 15px; border-radius: 10px; margin-top: 20px;">
                    <h3>📊 Son Oyunlar:</h3>
                    ${history.slice(0, 5).map((game, i) => `
                        <div style="display: flex; justify-content: space-between; padding: 5px 0; border-bottom: 1px solid rgba(255,255,255,0.1);">
                            <span>${i + 1}. ${new Date(game.date).toLocaleDateString('tr-TR')}</span>
                            <span>${game.score} puan (${game.lines} satır)</span>
                        </div>
                    `).join('')}
                </div>
            `;
            
            const container = document.querySelector('.side-panel');
            const existingHistory = container.querySelector('.game-history');
            if (existingHistory) existingHistory.remove();
            
            const historyDiv = document.createElement('div');
            historyDiv.className = 'game-history';
            historyDiv.innerHTML = historyHTML;
            container.appendChild(historyDiv);
        }
    }
    
    updateStatsFromStorage() {
        if (authManager.isLoggedIn()) {
            const user = authManager.getCurrentUser();
            database.getUserData(user.uid).then(userData => {
                if (userData?.hasenat) {
                    this.hasenat = userData.hasenat;
                    this.updateDisplay();
                }
            });
        } else {
            const guestHasenat = Utils.loadFromLocalStorage('guest_hasenat') || 0;
            this.hasenat = guestHasenat;
            this.updateDisplay();
        }
    }
    
    startGame() {
        if(this.gameInterval) {
            clearInterval(this.gameInterval);
        }
        
        this.initBoard();
        this.score = 0;
        this.level = 1;
        this.lines = 0;
        this.hasenat = 0;
        this.gameOver = false;
        this.paused = false;
        this.startTime = Date.now();
        
        this.nextPiece = this.getRandomPiece();
        this.newPiece();
        this.drawBoard();
        this.updateDisplay();
        
        document.getElementById('start-btn').textContent = 'YENİDEN BAŞLAT';
        
        this.gameInterval = setInterval(() => {
            if(!this.paused && !this.gameOver) {
                this.moveDown();
            }
        }, 1000 - (this.level - 1) * 100);
        
        Utils.showNotification('İntizam oyunu başladı! Nizamı sağla!', 'info');
    }
    
    pauseGame() {
        this.paused = !this.paused;
        const pauseBtn = document.querySelector('.controls button:nth-child(4)');
        if (pauseBtn) {
            pauseBtn.textContent = this.paused ? '▶ Devam' : '⏸ Duraklat';
        }
        Utils.showNotification(this.paused ? 'Oyun duraklatıldı' : 'Oyun devam ediyor', 'info');
    }
    
    showMessage(text, type) {
        Utils.showNotification(text, type);
    }
    
    showGameRules() {
        const rules = `
            <div style="background: rgba(255,255,255,0.1); padding: 15px; border-radius: 10px; margin-top: 20px;">
                <h3>📚 Oyun Kuralları:</h3>
                <ul style="text-align: left; padding-left: 20px;">
                    <li>← → : Parçayı hareket ettir</li>
                    <li>↑ : Parçayı döndür</li>
                    <li>↓ : Parçayı hızlandır</li>
                    <li>Space : Anında yerleştir</li>
                    <li>P : Duraklat/Devam</li>
                    <li>Her satır: +10 hasenat</li>
                    <li>4'lü satır: +50 hasenat!</li>
                </ul>
                <p style="font-style: italic; margin-top: 10px; opacity: 0.8;">
                    "Nizam ve intizamı sağlama" şuuru ile oyna!
                </p>
            </div>
        `;
        
        const sidePanel = document.querySelector('.side-panel');
        if (sidePanel && !sidePanel.querySelector('.game-rules')) {
            const rulesDiv = document.createElement('div');
            rulesDiv.className = 'game-rules';
            rulesDiv.innerHTML = rules;
            sidePanel.appendChild(rulesDiv);
        }
    }
}

// Oyunu başlat
let intizamGame = null;

document.addEventListener('DOMContentLoaded', () => {
    intizamGame = new IntizamGame();
    
    // Global fonksiyonlar (HTML onclick için)
    window.moveLeft = () => intizamGame.moveLeft();
    window.moveRight = () => intizamGame.moveRight();
    window.rotatePiece = () => intizamGame.rotatePiece();
    window.dropPiece = () => intizamGame.dropPiece();
    window.pauseGame = () => intizamGame.pauseGame();
    window.startGame = () => intizamGame.startGame();
    
    // Oyunu otomatik başlat (isteğe bağlı)
    // setTimeout(() => intizamGame.startGame(), 1000);
});

export default IntizamGame;