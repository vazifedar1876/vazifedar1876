import authManager from '../core/auth.js';
import database from '../core/database.js';
import { Utils } from '../core/utils.js';

class IstikametGame {
    constructor() {
        this.levels = this.getLevels();
        this.blocks = this.getBlocks();
        
        this.gameState = {
            currentLevel: 0,
            playerPos: {x: 0, y: 0},
            playerDir: 0,
            hasenat: 0,
            startTime: null,
            timer: null,
            attempts: 0,
            completedLevels: [],
            isRunning: false
        };
        
        this.CELL_SIZE = 50;
        this.workspaceBlocks = [];
        
        this.init();
    }
    
    init() {
        this.canvas = document.getElementById('maze-canvas');
        this.ctx = this.canvas.getContext('2d');
        
        this.setupEventListeners();
        this.loadUserProgress();
        this.initGame();
    }
    
    getLevels() {
        return [
            {
                id: 1,
                name: "Başlangıç",
                maze: [
                    [0,0,0,0,0,0,0,0,0,0],
                    [0,1,1,1,1,1,1,1,1,0],
                    [0,1,0,0,0,0,0,0,1,0],
                    [0,1,1,1,1,1,1,1,1,0],
                    [0,0,0,0,0,0,0,0,0,0]
                ],
                start: {x: 1, y: 1},
                target: {x: 8, y: 1},
                availableBlocks: ['move', 'turnLeft', 'turnRight'],
                description: "Düz bir yolda ilerlemeyi öğren",
                minBlocks: 2,
                maxBlocks: 4
            },
            {
                id: 2,
                name: "Dönüşler",
                maze: [
                    [0,0,0,0,0,0,0,0,0,0],
                    [0,1,1,1,0,0,0,0,0,0],
                    [0,0,0,1,1,1,1,1,1,0],
                    [0,0,0,0,0,0,0,0,1,0],
                    [0,1,1,1,1,1,1,1,1,0],
                    [0,1,0,0,0,0,0,0,0,0],
                    [0,1,1,1,1,1,1,1,1,0],
                    [0,0,0,0,0,0,0,0,1,0],
                    [0,0,0,0,0,0,0,0,1,0],
                    [0,0,0,0,0,0,0,0,0,0]
                ],
                start: {x: 1, y: 1},
                target: {x: 1, y: 4},
                availableBlocks: ['move', 'turnLeft', 'turnRight', 'repeat'],
                description: "Dönüşleri ve tekrarları kullan",
                minBlocks: 3,
                maxBlocks: 6
            }
        ];
    }
    
    getBlocks() {
        return {
            move: {
                name: "İleri Git",
                icon: "↑",
                color: "#4299e1",
                description: "Bir adım ileri git",
                code: "moveForward()"
            },
            turnLeft: {
                name: "Sola Dön",
                icon: "↶",
                color: "#48bb78",
                description: "90 derece sola dön",
                code: "turnLeft()"
            },
            turnRight: {
                name: "Sağa Dön",
                icon: "↷",
                color: "#ed8936",
                description: "90 derece sağa dön",
                code: "turnRight()"
            },
            repeat: {
                name: "Tekrar Et",
                icon: "🔄",
                color: "#9f7aea",
                description: "İçindeki blokları 3 kez tekrarla",
                code: "for(let i=0; i<3; i++) { }",
                hasContent: true
            }
        };
    }
    
    setupEventListeners() {
        // Buton event'leri
        const runBtn = document.querySelector('.run-btn');
        const resetBtn = document.querySelector('.reset-btn');
        const menuBtn = document.querySelector('button[onclick*="index.html"]');
        
        if (runBtn) {
            runBtn.onclick = () => this.runProgram();
            runBtn.removeAttribute('onclick');
        }
        if (resetBtn) {
            resetBtn.onclick = () => this.resetWorkspace();
            resetBtn.removeAttribute('onclick');
        }
        if (menuBtn) {
            menuBtn.onclick = () => window.location.href = 'index.html';
        }
        
        // Seviye navigasyonu
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('level-dot')) {
                const levelIndex = parseInt(e.target.dataset.level);
                if (!isNaN(levelIndex)) {
                    this.loadLevel(levelIndex);
                }
            }
        });
    }
    
    async loadUserProgress() {
        if (authManager.isLoggedIn()) {
            const user = authManager.getCurrentUser();
            const userData = await database.getUserData(user.uid);
            this.gameState.hasenat = userData?.hasenat || 0;
            this.gameState.completedLevels = userData?.completedLevels || [];
        } else {
            const guestData = Utils.loadFromLocalStorage('istikamet_data') || {};
            this.gameState.hasenat = guestData.hasenat || 0;
            this.gameState.completedLevels = guestData.completedLevels || [];
        }
        this.updateStats();
    }
    
    initGame() {
        this.loadLevel(this.gameState.currentLevel);
        this.createBlocks();
        this.updateLevelIndicator();
        this.startTimer();
    }
    
    loadLevel(levelIndex) {
        if (levelIndex >= this.levels.length) {
            this.showMessage('Tüm seviyeler tamamlandı!', 'success');
            return;
        }
        
        this.gameState.currentLevel = levelIndex;
        const level = this.levels[levelIndex];
        
        this.gameState.playerPos = {...level.start};
        this.gameState.playerDir = 0;
        this.gameState.attempts = 0;
        this.workspaceBlocks = [];
        
        this.drawMaze(level);
        this.drawPlayer();
        this.createBlocks();
        this.updateStats();
        this.updateLevelIndicator();
        
        this.showMessage(`Seviye ${level.id}: ${level.name}`, 'info');
    }
    
    drawMaze(level) {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Labirenti çiz
        for(let y = 0; y < level.maze.length; y++) {
            for(let x = 0; x < level.maze[y].length; x++) {
                if(level.maze[y][x] === 1) {
                    // Yol
                    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
                    this.ctx.fillRect(x * this.CELL_SIZE, y * this.CELL_SIZE, this.CELL_SIZE, this.CELL_SIZE);
                } else {
                    // Duvar
                    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
                    this.ctx.fillRect(x * this.CELL_SIZE, y * this.CELL_SIZE, this.CELL_SIZE, this.CELL_SIZE);
                }
                
                // Hücre sınırları
                this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
                this.ctx.strokeRect(x * this.CELL_SIZE, y * this.CELL_SIZE, this.CELL_SIZE, this.CELL_SIZE);
            }
        }
        
        // Başlangıç noktası
        this.ctx.fillStyle = '#68d391';
        this.ctx.beginPath();
        this.ctx.arc(
            level.start.x * this.CELL_SIZE + this.CELL_SIZE/2,
            level.start.y * this.CELL_SIZE + this.CELL_SIZE/2,
            this.CELL_SIZE/3,
            0,
            Math.PI * 2
        );
        this.ctx.fill();
        
        // Hedef noktası
        this.ctx.fillStyle = '#f6e05e';
        this.ctx.font = '30px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText(
            '🎯',
            level.target.x * this.CELL_SIZE + this.CELL_SIZE/2,
            level.target.y * this.CELL_SIZE + this.CELL_SIZE/2
        );
        
        // Seviye bilgisi
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        this.ctx.font = '16px Arial';
        this.ctx.textAlign = 'left';
        this.ctx.fillText(`Seviye ${level.id}: ${level.name}`, 10, 25);
        this.ctx.fillText(level.description, 10, 45);
        
        // Blok limiti
        this.ctx.fillText(`Blok limiti: ${level.minBlocks}-${level.maxBlocks}`, 10, 65);
    }
    
    drawPlayer() {
        const level = this.levels[this.gameState.currentLevel];
        
        // Önceki konumu temizle
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
        this.ctx.fillRect(
            this.gameState.playerPos.x * this.CELL_SIZE,
            this.gameState.playerPos.y * this.CELL_SIZE,
            this.CELL_SIZE,
            this.CELL_SIZE
        );
        
        // Oyuncuyu çiz
        this.ctx.fillStyle = '#667eea';
        this.ctx.beginPath();
        this.ctx.arc(
            this.gameState.playerPos.x * this.CELL_SIZE + this.CELL_SIZE/2,
            this.gameState.playerPos.y * this.CELL_SIZE + this.CELL_SIZE/2,
            this.CELL_SIZE/2.5,
            0,
            Math.PI * 2
        );
        this.ctx.fill();
        
        // Yön oku
        this.ctx.fillStyle = 'white';
        this.ctx.font = '20px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        
        const arrows = ['→', '↓', '←', '↑'];
        this.ctx.fillText(
            arrows[this.gameState.playerDir],
            this.gameState.playerPos.x * this.CELL_SIZE + this.CELL_SIZE/2,
            this.gameState.playerPos.y * this.CELL_SIZE + this.CELL_SIZE/2
        );
    }
    
    createBlocks() {
        const blocksGrid = document.getElementById('blocks-grid');
        const workspace = document.getElementById('workspace');
        
        if (!blocksGrid || !workspace) return;
        
        blocksGrid.innerHTML = '';
        workspace.innerHTML = '<div style="color: rgba(255,255,255,0.5); padding: 30px;">Blokları buraya sürükleyin...</div>';
        
        const level = this.levels[this.gameState.currentLevel];
        
        level.availableBlocks.forEach(blockId => {
            const block = this.blocks[blockId];
            const blockElement = this.createBlockElement(blockId, block);
            blocksGrid.appendChild(blockElement);
        });
        
        this.setupDragAndDrop();
    }
    
    createBlockElement(blockId, block) {
        const element = document.createElement('div');
        element.className = 'block-item';
        element.dataset.block = blockId;
        element.draggable = true;
        element.innerHTML = `
            <div style="font-size: 1.5em;">${block.icon}</div>
            <div>${block.name}</div>
            <div style="font-size: 0.8em; opacity: 0.8; margin-top: 5px;">${block.description}</div>
        `;
        element.style.background = block.color;
        
        return element;
    }
    
    setupDragAndDrop() {
        const workspace = document.getElementById('workspace');
        if (!workspace) return;
        
        // Sürükleme olayları
        document.querySelectorAll('.block-item').forEach(item => {
            item.addEventListener('dragstart', (e) => {
                e.dataTransfer.setData('text/plain', e.target.dataset.block);
                e.target.classList.add('dragging');
            });
            
            item.addEventListener('dragend', (e) => {
                e.target.classList.remove('dragging');
            });
        });
        
        workspace.addEventListener('dragover', (e) => {
            e.preventDefault();
            workspace.style.borderColor = 'rgba(255,255,255,0.5)';
        });
        
        workspace.addEventListener('dragleave', () => {
            workspace.style.borderColor = 'rgba(255,255,255,0.2)';
        });
        
        workspace.addEventListener('drop', (e) => {
            e.preventDefault();
            workspace.style.borderColor = 'rgba(255,255,255,0.2)';
            
            const blockId = e.dataTransfer.getData('text/plain');
            if (blockId) {
                this.addBlockToWorkspace(blockId);
            }
        });
    }
    
    addBlockToWorkspace(blockId) {
        const workspace = document.getElementById('workspace');
        const placeholder = workspace.querySelector('div[style*="color: rgba"]');
        
        if (placeholder) {
            workspace.removeChild(placeholder);
        }
        
        const level = this.levels[this.gameState.currentLevel];
        if (this.workspaceBlocks.length >= level.maxBlocks) {
            this.showMessage(`Maksimum ${level.maxBlocks} blok kullanabilirsin!`, 'warning');
            return;
        }
        
        const block = this.blocks[blockId];
        const blockElement = document.createElement('div');
        blockElement.className = 'workspace-item';
        blockElement.dataset.block = blockId;
        blockElement.draggable = true;
        blockElement.innerHTML = `
            <div style="font-size: 1.5em;">${block.icon}</div>
            <div style="flex-grow: 1;">${block.name}</div>
            <button class="remove-block" style="
                background: rgba(255,0,0,0.3);
                border: none;
                color: white;
                border-radius: 5px;
                padding: 5px 10px;
                cursor: pointer;
                font-size: 0.9em;
            ">✕</button>
        `;
        blockElement.style.background = block.color;
        
        // Kaldırma butonu
        blockElement.querySelector('.remove-block').onclick = () => {
            blockElement.remove();
            this.workspaceBlocks = this.workspaceBlocks.filter(b => b.element !== blockElement);
            if (workspace.children.length === 0) {
                workspace.innerHTML = '<div style="color: rgba(255,255,255,0.5); padding: 30px;">Blokları buraya sürükleyin...</div>';
            }
        };
        
        // Sıralama için sürükleme
        blockElement.addEventListener('dragstart', (e) => {
            e.dataTransfer.setData('text/plain', 'reorder');
            blockElement.style.opacity = '0.5';
        });
        
        blockElement.addEventListener('dragover', (e) => {
            e.preventDefault();
            const afterElement = this.getDragAfterElement(workspace, e.clientY);
            const draggable = document.querySelector('.workspace-item.dragging') || blockElement;
            
            if (afterElement == null) {
                workspace.appendChild(draggable);
            } else {
                workspace.insertBefore(draggable, afterElement);
            }
        });
        
        blockElement.addEventListener('dragend', () => {
            blockElement.style.opacity = '1';
            this.updateWorkspaceOrder();
        });
        
        workspace.appendChild(blockElement);
        this.workspaceBlocks.push({
            id: blockId,
            element: blockElement,
            block: block
        });
    }
    
    getDragAfterElement(container, y) {
        const draggableElements = [...container.querySelectorAll('.workspace-item:not(.dragging)')];
        
        return draggableElements.reduce((closest, child) => {
            const box = child.getBoundingClientRect();
            const offset = y - box.top - box.height / 2;
            
            if (offset < 0 && offset > closest.offset) {
                return { offset: offset, element: child };
            } else {
                return closest;
            }
        }, { offset: Number.NEGATIVE_INFINITY }).element;
    }
    
    updateWorkspaceOrder() {
        const workspace = document.getElementById('workspace');
        const items = [...workspace.querySelectorAll('.workspace-item')];
        this.workspaceBlocks = items.map(item => ({
            id: item.dataset.block,
            element: item,
            block: this.blocks[item.dataset.block]
        }));
    }
    
    async runProgram() {
        if (this.gameState.isRunning) return;
        
        this.gameState.isRunning = true;
        this.gameState.attempts++;
        this.updateStats();
        
        const level = this.levels[this.gameState.currentLevel];
        
        // Blok kontrolü
        if (this.workspaceBlocks.length < level.minBlocks) {
            this.showMessage(`En az ${level.minBlocks} blok kullanmalısın!`, 'warning');
            this.gameState.isRunning = false;
            return;
        }
        
        if (this.workspaceBlocks.length > level.maxBlocks) {
            this.showMessage(`En fazla ${level.maxBlocks} blok kullanabilirsin!`, 'warning');
            this.gameState.isRunning = false;
            return;
        }
        
        // Oyun durumunu sıfırla
        this.gameState.playerPos = {...level.start};
        this.gameState.playerDir = 0;
        this.drawPlayer();
        
        // Programı yürüt
        await this.executeProgram();
        
        this.gameState.isRunning = false;
    }
    
    async executeProgram() {
        const program = [...this.workspaceBlocks];
        
        for (let i = 0; i < program.length; i++) {
            const block = program[i];
            
            // Bloku vurgula
            block.element.style.boxShadow = '0 0 15px gold';
            block.element.style.transform = 'scale(1.05)';
            
            await this.executeBlock(block.id);
            
            // Vurgulamayı kaldır
            block.element.style.boxShadow = '';
            block.element.style.transform = '';
            
            // Kısa bekleme
            await this.sleep(500);
        }
        
        // Hedef kontrolü
        this.checkWin();
    }
    
    async executeBlock(blockId) {
        switch(blockId) {
            case 'move':
                await this.moveForward();
                break;
            case 'turnLeft':
                await this.turnLeft();
                break;
            case 'turnRight':
                await this.turnRight();
                break;
            case 'repeat':
                // 3 kez tekrarla
                for (let i = 0; i < 3; i++) {
                    // Sonraki blokları bul (repeat'ten sonrakiler)
                    const workspace = document.getElementById('workspace');
                    const items = [...workspace.querySelectorAll('.workspace-item')];
                    const repeatIndex = items.findIndex(item => item.dataset.block === 'repeat');
                    
                    if (repeatIndex !== -1 && repeatIndex + 1 < items.length) {
                        const nextBlockId = items[repeatIndex + 1].dataset.block;
                        await this.executeBlock(nextBlockId);
                        await this.sleep(300);
                    }
                }
                break;
        }
    }
    
    async moveForward() {
        const newPos = {...this.gameState.playerPos};
        
        switch(this.gameState.playerDir) {
            case 0: newPos.x++; break;
            case 1: newPos.y++; break;
            case 2: newPos.x--; break;
            case 3: newPos.y--; break;
        }
        
        const level = this.levels[this.gameState.currentLevel];
        if (level.maze[newPos.y] && level.maze[newPos.y][newPos.x] === 1) {
            this.gameState.playerPos = newPos;
            this.drawPlayer();
            await this.sleep(300);
        } else {
            this.showMessage('Engel! Yolu kontrol et.', 'warning');
        }
    }
    
    async turnLeft() {
        this.gameState.playerDir = (this.gameState.playerDir + 3) % 4;
        this.drawPlayer();
        await this.sleep(300);
    }
    
    async turnRight() {
        this.gameState.playerDir = (this.gameState.playerDir + 1) % 4;
        this.drawPlayer();
        await this.sleep(300);
    }
    
    checkWin() {
        const level = this.levels[this.gameState.currentLevel];
        const reachedTarget = 
            this.gameState.playerPos.x === level.target.x && 
            this.gameState.playerPos.y === level.target.y;
        
        if (reachedTarget) {
            // Hasenat hesapla
            const timeBonus = Math.max(0, 300 - Math.floor((Date.now() - this.gameState.startTime) / 1000));
            const attemptsBonus = Math.max(0, 50 - this.gameState.attempts);
            const levelBonus = (this.gameState.currentLevel + 1) * 20;
            const earnedHasenat = 50 + Math.floor(timeBonus / 10) + Math.floor(attemptsBonus / 5) + levelBonus;
            
            this.gameState.hasenat += earnedHasenat;
            
            // Tamamlanan seviyeleri kaydet
            if (!this.gameState.completedLevels.includes(this.gameState.currentLevel)) {
                this.gameState.completedLevels.push(this.gameState.currentLevel);
            }
            
            // Kaydet
            this.saveGameResult(earnedHasenat);
            
            // Tebrik mesajı
            setTimeout(() => {
                this.showMessage(
                    `🎉 Seviye ${this.gameState.currentLevel + 1} tamamlandı!\n` +
                    `⏱ Deneme: ${this.gameState.attempts}\n` +
                    `✨ Hasenat: +${earnedHasenat}\n\n` +
                    `"Sebat ve istikametle hedefe ulaştın!"`,
                    'success'
                );
                
                // Sonraki seviyeye geç
                if (this.gameState.currentLevel < this.levels.length - 1) {
                    setTimeout(() => {
                        this.loadLevel(this.gameState.currentLevel + 1);
                    }, 2000);
                } else {
                    this.showMessage('🎊 TEBRİKLER! Tüm seviyeleri tamamladın!\nArtık bir İstikamet Ustası oldun!', 'success');
                }
            }, 1000);
        }
    }
    
    resetWorkspace() {
        const workspace = document.getElementById('workspace');
        workspace.innerHTML = '<div style="color: rgba(255,255,255,0.5); padding: 30px;">Blokları buraya sürükleyin...</div>';
        this.workspaceBlocks = [];
        
        // Oyun durumunu sıfırla
        const level = this.levels[this.gameState.currentLevel];
        this.gameState.playerPos = {...level.start};
        this.gameState.playerDir = 0;
        this.drawPlayer();
    }
    
    updateLevelIndicator() {
        const indicator = document.getElementById('level-indicator');
        if (!indicator) return;
        
        indicator.innerHTML = '';
        
        this.levels.forEach((level, index) => {
            const dot = document.createElement('div');
            dot.className = 'level-dot';
            dot.dataset.level = index;
            
            if (index === this.gameState.currentLevel) {
                dot.classList.add('active');
            }
            if (this.gameState.completedLevels.includes(index)) {
                dot.classList.add('completed');
            }
            
            dot.title = `Seviye ${level.id}: ${level.name}`;
            indicator.appendChild(dot);
        });
    }
    
    updateStats() {
        document.getElementById('level').textContent = this.gameState.currentLevel + 1;
        document.getElementById('hasenat').textContent = this.gameState.hasenat;
        document.getElementById('attempts').textContent = this.gameState.attempts;
    }
    
    startTimer() {
        if (this.gameState.timer) {
            clearInterval(this.gameState.timer);
        }
        
        this.gameState.startTime = Date.now();
        this.gameState.timer = setInterval(() => {
            const elapsed = Math.floor((Date.now() - this.gameState.startTime) / 1000);
            document.getElementById('timer').textContent = this.formatTime(elapsed);
        }, 1000);
    }
    
    formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    
    async saveGameResult(earnedHasenat) {
        const gameData = {
            level: this.gameState.currentLevel + 1,
            attempts: this.gameState.attempts,
            hasenat: earnedHasenat,
            date: new Date().toISOString(),
            blocksUsed: this.workspaceBlocks.length
        };
        
        // LocalStorage
        const history = Utils.loadFromLocalStorage('istikamet_history') || [];
        history.unshift(gameData);
        if (history.length > 10) history.pop();
        Utils.saveToLocalStorage('istikamet_history', history);
        
        // Progress kaydet
        const progress = {
            hasenat: this.gameState.hasenat,
            completedLevels: this.gameState.completedLevels,
            lastPlayed: new Date().toISOString()
        };
        Utils.saveToLocalStorage('istikamet_data', progress);
        
        // Firebase
        if (authManager.isLoggedIn()) {
            try {
                const user = authManager.getCurrentUser();
                await database.completeGame(user.uid, 'istikamet', this.gameState.currentLevel + 1);
                await database.updateUserHasenat(user.uid, earnedHasenat);
                
                // Progress güncelle
                await database.updateUserData(user.uid, {
                    istikametLevel: this.gameState.currentLevel + 1,
                    completedLevels: this.gameState.completedLevels
                });
            } catch (error) {
                console.error('Kaydetme hatası:', error);
            }
        } else {
            // Misafir için
            const guestHasenat = Utils.loadFromLocalStorage('guest_hasenat') || 0;
            Utils.saveToLocalStorage('guest_hasenat', guestHasenat + earnedHasenat);
        }
    }
    
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    
    showMessage(text, type) {
        Utils.showNotification(text, type);
    }
}

// Oyunu başlat
let istikametGame = null;

document.addEventListener('DOMContentLoaded', () => {
    istikametGame = new IstikametGame();
    
    // Global fonksiyonlar
    window.runProgram = () => istikametGame.runProgram();
    window.resetWorkspace = () => istikametGame.resetWorkspace();
});

export default IstikametGame;