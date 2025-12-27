import authManager from '../core/auth.js';
import database from '../core/database.js';
import { Utils } from '../core/utils.js';

class VahdetGame {
    constructor() {
        this.PUZZLE_SIZE = 4;
        this.puzzlePieces = [];
        this.emptyIndex = this.PUZZLE_SIZE * this.PUZZLE_SIZE - 1;
        this.moves = 0;
        this.startTime = null;
        this.timerInterval = null;
        this.hasenat = 0;
        this.isSolved = false;
        
        this.puzzleImages = [
            "🌙", "⭐", "📖", "🕌",
            "🕋", "☪️", "🕯️", "🌹",
            "📿", "🕌", "🌠", "🕊️",
            "✨", "🌟", "💫", ""
        ];
        
        this.puzzleMeanings = [
            "Kamer (Ay)",
            "Necm (Yıldız)",
            "Kur'an-ı Kerim",
            "Mescid",
            "Kabe-i Muazzama",
            "İslam Sembolü",
            "Nur (Işık)",
            "Gül (Hz. Muhammed)",
            "Tespih",
            "Cami",
            "Şihab (Kayan Yıldız)",
            "Selam (Barış)",
            "Parlaklık",
            "Yıldız",
            "Nuraniyet",
            "Vahdet (Boşluk)"
        ];
        
        this.colors = [
            "#667eea", "#764ba2", "#48bb78", "#ed8936",
            "#f56565", "#4299e1", "#9f7aea", "#38a169",
            "#319795", "#d69e2e", "#3182ce", "#5a67d8",
            "#805ad5", "#d53f8c", "#d69e2e", "transparent"
        ];
        
        this.init();
    }
    
    init() {
        this.container = document.getElementById('puzzle-container');
        this.setupEventListeners();
        this.updateStatsFromStorage();
        this.initPuzzle();
        this.startTimer();
        this.showPuzzleMeanings();
    }
    
    setupEventListeners() {
        // Buton event'leri
        const shuffleBtn = document.querySelector('button[onclick*="shufflePuzzle"]');
        const showBtn = document.querySelector('button[onclick*="showOriginal"]');
        const hintBtn = document.querySelector('button[onclick*="hint"]');
        const resetBtn = document.querySelector('button[onclick*="resetGame"]');
        const menuBtn = document.querySelector('button[onclick*="index.html"]');
        
        if (shuffleBtn) {
            shuffleBtn.onclick = () => this.shufflePuzzle();
            shuffleBtn.removeAttribute('onclick');
        }
        if (showBtn) {
            showBtn.onclick = () => this.showOriginal();
            showBtn.removeAttribute('onclick');
        }
        if (hintBtn) {
            hintBtn.onclick = () => this.hint();
            hintBtn.removeAttribute('onclick');
        }
        if (resetBtn) {
            resetBtn.onclick = () => this.resetGame();
            resetBtn.removeAttribute('onclick');
        }
        if (menuBtn) {
            menuBtn.onclick = () => window.location.href = 'index.html';
        }
    }
    
    initPuzzle() {
        this.container.innerHTML = '';
        this.puzzlePieces = [];
        
        for(let i = 0; i < this.PUZZLE_SIZE * this.PUZZLE_SIZE; i++) {
            const piece = document.createElement('div');
            piece.className = i === this.emptyIndex ? 'puzzle-piece empty' : 'puzzle-piece';
            piece.dataset.index = i;
            piece.dataset.correctIndex = i;
            
            if(i !== this.emptyIndex) {
                piece.textContent = this.puzzleImages[i];
                piece.title = this.puzzleMeanings[i];
                piece.style.fontSize = '2.5em';
                piece.style.display = 'flex';
                piece.style.alignItems = 'center';
                piece.style.justifyContent = 'center';
                piece.style.background = this.colors[i] + '40';
                piece.style.color = 'white';
            }
            
            piece.onclick = () => this.movePiece(i);
            this.container.appendChild(piece);
            this.puzzlePieces.push(piece);
        }
        
        this.shufflePuzzle();
    }
    
    shufflePuzzle() {
        for(let i = 0; i < 1000; i++) {
            const possibleMoves = this.getPossibleMoves();
            const randomMove = possibleMoves[Math.floor(Math.random() * possibleMoves.length)];
            this.swapPieces(this.emptyIndex, randomMove);
            this.emptyIndex = randomMove;
        }
        
        this.moves = 0;
        this.isSolved = false;
        document.getElementById('moves').textContent = this.moves;
        this.startTimer();
    }
    
    getPossibleMoves() {
        const row = Math.floor(this.emptyIndex / this.PUZZLE_SIZE);
        const col = this.emptyIndex % this.PUZZLE_SIZE;
        const moves = [];
        
        if(row > 0) moves.push(this.emptyIndex - this.PUZZLE_SIZE);
        if(row < this.PUZZLE_SIZE - 1) moves.push(this.emptyIndex + this.PUZZLE_SIZE);
        if(col > 0) moves.push(this.emptyIndex - 1);
        if(col < this.PUZZLE_SIZE - 1) moves.push(this.emptyIndex + 1);
        
        return moves;
    }
    
    movePiece(index) {
        if (this.isSolved) return;
        
        const possibleMoves = this.getPossibleMoves();
        
        if(possibleMoves.includes(index)) {
            this.swapPieces(this.emptyIndex, index);
            this.emptyIndex = index;
            this.moves++;
            document.getElementById('moves').textContent = this.moves;
            
            if(this.moves % 5 === 0) {
                this.hasenat += 1;
                Utils.showNotification(`+1 Hasenat (${this.moves}. hamle)`, 'success');
            }
            
            this.checkWin();
        }
    }
    
    swapPieces(index1, index2) {
        const piece1 = this.puzzlePieces[index1];
        const piece2 = this.puzzlePieces[index2];
        
        const parent = piece1.parentNode;
        const temp = document.createElement('div');
        parent.insertBefore(temp, piece1);
        parent.insertBefore(piece1, piece2);
        parent.insertBefore(piece2, temp);
        parent.removeChild(temp);
        
        [this.puzzlePieces[index1], this.puzzlePieces[index2]] = 
        [this.puzzlePieces[index2], this.puzzlePieces[index1]];
        
        this.puzzlePieces[index1].dataset.index = index1;
        this.puzzlePieces[index2].dataset.index = index2;
    }
    
    checkWin() {
        let solved = true;
        for(let i = 0; i < this.puzzlePieces.length; i++) {
            if(parseInt(this.puzzlePieces[i].dataset.index) !== parseInt(this.puzzlePieces[i].dataset.correctIndex)) {
                solved = false;
                break;
            }
        }
        
        if(solved && !this.isSolved) {
            this.isSolved = true;
            clearInterval(this.timerInterval);
            
            const timeBonus = Math.max(0, 300 - Math.floor((new Date() - this.startTime) / 1000));
            const movesBonus = Math.max(0, 100 - this.moves);
            const totalHasenat = 50 + Math.floor(timeBonus / 10) + Math.floor(movesBonus / 5);
            this.hasenat += totalHasenat;
            
            this.showMessage(
                `🎉 Tebrikler! Vahdet Tablosu tamamlandı!\n` +
                `⏱ Süre: ${this.formatTime(new Date() - this.startTime)}\n` +
                `♻ Hamle: ${this.moves}\n` +
                `✨ Hasenat: +${totalHasenat} puan`,
                'success'
            );
            
            this.saveGameResult();
            this.celebrateWin();
        }
    }
    
    celebrateWin() {
        // Parlama efekti
        this.puzzlePieces.forEach(piece => {
            if (!piece.classList.contains('empty')) {
                piece.style.boxShadow = '0 0 20px gold';
                piece.style.transform = 'scale(1.1)';
                piece.style.transition = 'all 0.3s';
            }
        });
        
        // Animasyonlu mesaj
        setTimeout(() => {
            this.puzzlePieces.forEach(piece => {
                piece.style.boxShadow = '';
                piece.style.transform = '';
            });
        }, 2000);
    }
    
    showOriginal() {
        const modal = document.createElement('div');
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.9);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 1000;
            padding: 20px;
        `;
        
        modal.innerHTML = `
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                       padding: 30px;
                       border-radius: 20px;
                       max-width: 600px;
                       width: 100%;
                       border: 3px solid rgba(255,255,255,0.3);
                       max-height: 90vh;
                       overflow-y: auto;">
                <h2 style="text-align: center; margin-bottom: 25px;">🧩 Vahdet Tablosu - Anlamlar</h2>
                <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; margin: 20px 0;">
                    ${this.puzzleImages.map((img, i) => `
                        <div style="background: rgba(255,255,255,0.1); 
                                   padding: 20px; 
                                   border-radius: 15px;
                                   text-align: center;
                                   border: 2px solid ${this.colors[i]}60;
                                   transition: transform 0.3s;
                                   cursor: pointer;"
                             onmouseover="this.style.transform='scale(1.05)'"
                             onmouseout="this.style.transform='scale(1)'">
                            <div style="font-size: 2.5em; margin-bottom: 10px;">${img}</div>
                            <div style="font-size: 0.9em; opacity: 0.9;">${this.puzzleMeanings[i]}</div>
                        </div>
                    `).join('')}
                </div>
                <p style="text-align: center; margin-top: 25px; font-style: italic; opacity: 0.9;">
                    "Parçalardan bütünü görmek, tevhidin bir remzidir."
                </p>
                <button onclick="this.parentElement.parentElement.remove()" 
                        style="display: block; 
                               margin: 25px auto 0; 
                               padding: 12px 30px;
                               background: rgba(255,255,255,0.2);
                               border: 2px solid rgba(255,255,255,0.3);
                               color: white;
                               border-radius: 50px;
                               font-size: 1.1em;
                               cursor: pointer;">
                    Kapat
                </button>
            </div>
        `;
        
        document.body.appendChild(modal);
    }
    
    hint() {
        for(let i = 0; i < this.puzzlePieces.length; i++) {
            if(parseInt(this.puzzlePieces[i].dataset.index) !== parseInt(this.puzzlePieces[i].dataset.correctIndex)) {
                this.puzzlePieces[i].style.boxShadow = '0 0 20px gold';
                this.puzzlePieces[i].style.borderColor = 'gold';
                
                setTimeout(() => {
                    this.puzzlePieces[i].style.boxShadow = '';
                    this.puzzlePieces[i].style.borderColor = '';
                }, 2000);
                break;
            }
        }
        
        Utils.showNotification('💡 Bir parça vurgulandı!', 'info');
    }
    
    resetGame() {
        clearInterval(this.timerInterval);
        this.startTime = null;
        this.moves = 0;
        document.getElementById('timer').textContent = '00:00';
        document.getElementById('moves').textContent = '0';
        this.initPuzzle();
        Utils.showNotification('Oyun sıfırlandı!', 'info');
    }
    
    startTimer() {
        if(this.timerInterval) {
            clearInterval(this.timerInterval);
        }
        
        this.startTime = new Date();
        this.timerInterval = setInterval(() => {
            if(this.startTime && !this.isSolved) {
                const elapsed = new Date() - this.startTime;
                document.getElementById('timer').textContent = this.formatTime(elapsed);
            }
        }, 1000);
    }
    
    formatTime(ms) {
        const seconds = Math.floor(ms / 1000);
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
    }
    
    showMessage(text, type) {
        Utils.showNotification(text, type);
    }
    
    async saveGameResult() {
        const gameData = {
            moves: this.moves,
            hasenat: this.hasenat,
            time: Math.floor((new Date() - this.startTime) / 1000),
            date: new Date().toISOString(),
            solved: true
        };
        
        // LocalStorage
        const history = Utils.loadFromLocalStorage('vahdet_history') || [];
        history.unshift(gameData);
        if (history.length > 10) history.pop();
        Utils.saveToLocalStorage('vahdet_history', history);
        
        // Firebase
        if (authManager.isLoggedIn()) {
            try {
                const user = authManager.getCurrentUser();
                await database.completeGame(user.uid, 'vahdet', this.moves);
                await database.updateUserHasenat(user.uid, this.hasenat);
            } catch (error) {
                console.error('Skor kaydetme hatası:', error);
            }
        } else {
            const guestHasenat = Utils.loadFromLocalStorage('guest_hasenat') || 0;
            Utils.saveToLocalStorage('guest_hasenat', guestHasenat + this.hasenat);
        }
    }
    
    updateStatsFromStorage() {
        if (authManager.isLoggedIn()) {
            const user = authManager.getCurrentUser();
            database.getUserData(user.uid).then(userData => {
                if (userData?.hasenat) {
                    this.hasenat = userData.hasenat;
                }
            });
        } else {
            const guestHasenat = Utils.loadFromLocalStorage('guest_hasenat') || 0;
            this.hasenat = guestHasenat;
        }
    }
    
    showPuzzleMeanings() {
        const meaningsHTML = `
            <div style="background: rgba(255,255,255,0.1); 
                       padding: 15px; 
                       border-radius: 10px; 
                       margin: 20px 0;
                       text-align: left;">
                <h3>📖 Vahdet Tablosu Anlamları:</h3>
                <p style="font-style: italic; margin-bottom: 10px;">
                    Her parça, İslam'ın bir remzini taşır. Parçalardan bütünü gör!
                </p>
                <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; font-size: 0.9em;">
                    ${this.puzzleMeanings.slice(0, 8).map((meaning, i) => `
                        <div style="display: flex; align-items: center; gap: 8px;">
                            <span style="font-size: 1.2em;">${this.puzzleImages[i]}</span>
                            <span>${meaning}</span>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
        
        const gameContainer = document.querySelector('.game-container');
        if (gameContainer && !gameContainer.querySelector('.puzzle-meanings')) {
            const div = document.createElement('div');
            div.className = 'puzzle-meanings';
            div.innerHTML = meaningsHTML;
            gameContainer.insertBefore(div, gameContainer.children[2]);
        }
    }
}

// Oyunu başlat
let vahdetGame = null;

document.addEventListener('DOMContentLoaded', () => {
    vahdetGame = new VahdetGame();
    
    // Global fonksiyonlar
    window.shufflePuzzle = () => vahdetGame.shufflePuzzle();
    window.showOriginal = () => vahdetGame.showOriginal();
    window.hint = () => vahdetGame.hint();
    window.resetGame = () => vahdetGame.resetGame();
});

export default VahdetGame;