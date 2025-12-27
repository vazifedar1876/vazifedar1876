import authManager from '../core/auth.js';
import database from '../core/database.js';
import { Utils } from '../core/utils.js';

class MuzakereGame {
    constructor() {
        this.questions = [];
        this.currentQuestionIndex = 0;
        this.score = 0;
        this.correctAnswers = 0;
        this.totalQuestions = 0;
        this.hasenat = 0;
        this.gameStarted = false;
        this.selectedCategory = null;
        this.selectedDifficulty = null;
        
        this.categories = [
            { id: 'temel-iman', name: 'Temel İman', icon: '🕌' },
            { id: 'risale-i-nur', name: 'Risale-i Nur', icon: '📚' },
            { id: 'hayat', name: 'Bediüzzaman Hayatı', icon: '👤' },
            { id: 'kuran', name: 'Kur\'an Mucizeleri', icon: '📖' },
            { id: 'genel-kultur', name: 'Genel Kültür', icon: '🌍' }
        ];
        
        this.difficulties = [
            { id: 'kolay', name: 'Kolay', color: '#48bb78' },
            { id: 'orta', name: 'Orta', color: '#ed8936' },
            { id: 'zor', name: 'Zor', color: '#f56565' }
        ];
        
        this.init();
    }
    
    async init() {
        await this.loadQuestions();
        this.setupEventListeners();
        this.updateStatsFromStorage();
        this.showCategorySelection();
    }
    
    async loadQuestions() {
        try {
            // Firebase'den soruları yükle
            this.questions = await database.getQuestions(
                this.selectedCategory,
                this.selectedDifficulty,
                10
            );
            
            // Eğer soru yoksa örnek sorular yükle
            if (this.questions.length === 0) {
                this.questions = this.getSampleQuestions();
            }
            
            this.totalQuestions = this.questions.length;
            
        } catch (error) {
            console.error('Sorular yüklenemedi:', error);
            this.questions = this.getSampleQuestions();
            this.totalQuestions = this.questions.length;
        }
    }
    
    getSampleQuestions() {
        return [
            {
                id: '1',
                question: "Risale-i Nur'da imanın kuvvetini ve nurunu anlatan eser hangisidir?",
                answers: [
                    { text: "Mektubat", correct: false },
                    { text: "Sözler", correct: true },
                    { text: "Lem'alar", correct: false },
                    { text: "Şualar", correct: false }
                ],
                correct: 1,
                category: "Risale-i Nur",
                difficulty: "Kolay",
                explanation: "Sözler eseri, iman hakikatlerini çok güzel bir şekilde izah eder."
            },
            {
                id: '2',
                question: "Bediüzzaman Said Nursi'nin doğum yılı nedir?",
                answers: [
                    { text: "1876", correct: false },
                    { text: "1878", correct: true },
                    { text: "1880", correct: false },
                    { text: "1882", correct: false }
                ],
                correct: 1,
                category: "Hayat",
                difficulty: "Kolay",
                explanation: "Bediüzzaman Said Nursi 1878 yılında Bitlis'in Nurs köyünde doğmuştur."
            }
        ];
    }
    
    setupEventListeners() {
        // Ana menü butonu
        const menuBtn = document.querySelector('button[onclick*="index.html"]');
        if (menuBtn) {
            menuBtn.onclick = () => window.location.href = 'index.html';
        }
        
        // Sonraki soru butonu
        const nextBtn = document.getElementById('next-btn');
        if (nextBtn) {
            nextBtn.onclick = () => this.nextQuestion();
        }
    }
    
    showCategorySelection() {
        const container = document.querySelector('.container');
        if (!container || this.gameStarted) return;
        
        const selectionHTML = `
            <div class="category-selection" style="
                background: rgba(255,255,255,0.1);
                border-radius: 20px;
                padding: 30px;
                margin: 20px 0;
                backdrop-filter: blur(10px);
            ">
                <h2 style="text-align: center; margin-bottom: 25px;">📚 Kategori Seçin</h2>
                
                <div class="categories-grid" style="
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                    gap: 15px;
                    margin-bottom: 30px;
                ">
                    ${this.categories.map(cat => `
                        <div class="category-card" 
                             data-category="${cat.id}"
                             style="
                                background: rgba(255,255,255,0.15);
                                padding: 20px;
                                border-radius: 15px;
                                text-align: center;
                                cursor: pointer;
                                transition: all 0.3s;
                                border: 2px solid rgba(255,255,255,0.2);
                             "
                             onmouseover="this.style.transform='translateY(-5px)'; this.style.background='rgba(255,255,255,0.25)'"
                             onmouseout="this.style.transform=''; this.style.background=''">
                            <div style="font-size: 2.5em; margin-bottom: 10px;">${cat.icon}</div>
                            <div style="font-weight: bold;">${cat.name}</div>
                        </div>
                    `).join('')}
                </div>
                
                <h2 style="text-align: center; margin: 30px 0 20px;">🎯 Zorluk Seviyesi</h2>
                
                <div class="difficulties" style="
                    display: flex;
                    justify-content: center;
                    gap: 15px;
                    margin-bottom: 30px;
                    flex-wrap: wrap;
                ">
                    ${this.difficulties.map(diff => `
                        <div class="difficulty-btn"
                             data-difficulty="${diff.id}"
                             style="
                                background: ${diff.color}40;
                                color: white;
                                padding: 12px 25px;
                                border-radius: 50px;
                                cursor: pointer;
                                border: 2px solid ${diff.color};
                                font-weight: bold;
                                transition: all 0.3s;
                             "
                             onmouseover="this.style.transform='scale(1.05)'"
                             onmouseout="this.style.transform=''">
                            ${diff.name}
                        </div>
                    `).join('')}
                </div>
                
                <button id="start-game-btn" 
                        style="
                            display: block;
                            margin: 0 auto;
                            padding: 15px 40px;
                            background: #48bb78;
                            color: white;
                            border: none;
                            border-radius: 50px;
                            font-size: 1.2em;
                            font-weight: bold;
                            cursor: pointer;
                            transition: all 0.3s;
                        "
                        onmouseover="this.style.transform='scale(1.05)'"
                        onmouseout="this.style.transform=''">
                    🚀 Oyunu Başlat
                </button>
            </div>
        `;
        
        // Oyun alanını temizle ve kategori seçimini göster
        const gameArea = document.querySelector('.question-box');
        if (gameArea) {
            gameArea.style.display = 'none';
        }
        
        const answersContainer = document.getElementById('answers-container');
        if (answersContainer) {
            answersContainer.style.display = 'none';
        }
        
        const nextBtn = document.getElementById('next-btn');
        if (nextBtn) {
            nextBtn.style.display = 'none';
        }
        
        // Kategori seçimini ekle
        const existingSelection = container.querySelector('.category-selection');
        if (existingSelection) {
            existingSelection.remove();
        }
        
        container.insertAdjacentHTML('afterbegin', selectionHTML);
        
        // Event listener'ları ekle
        this.setupSelectionListeners();
    }
    
    setupSelectionListeners() {
        // Kategori seçimi
        document.querySelectorAll('.category-card').forEach(card => {
            card.addEventListener('click', () => {
                // Tüm kartlardan seçimi kaldır
                document.querySelectorAll('.category-card').forEach(c => {
                    c.style.borderColor = 'rgba(255,255,255,0.2)';
                    c.style.background = 'rgba(255,255,255,0.15)';
                });
                
                // Seçili kartı vurgula
                card.style.borderColor = '#f6e05e';
                card.style.background = 'rgba(246, 224, 94, 0.2)';
                
                this.selectedCategory = card.dataset.category;
            });
        });
        
        // Zorluk seçimi
        document.querySelectorAll('.difficulty-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                // Tüm butonlardan seçimi kaldır
                document.querySelectorAll('.difficulty-btn').forEach(b => {
                    b.style.opacity = '0.7';
                    b.style.transform = 'scale(1)';
                });
                
                // Seçili butonu vurgula
                btn.style.opacity = '1';
                btn.style.transform = 'scale(1.1)';
                
                this.selectedDifficulty = btn.dataset.difficulty;
            });
        });
        
        // Oyunu başlat butonu
        const startBtn = document.getElementById('start-game-btn');
        if (startBtn) {
            startBtn.addEventListener('click', async () => {
                if (!this.selectedCategory || !this.selectedDifficulty) {
                    Utils.showNotification('Lütfen kategori ve zorluk seviyesi seçin!', 'warning');
                    return;
                }
                
                await this.startGame();
            });
        }
    }
    
    async startGame() {
        this.gameStarted = true;
        this.currentQuestionIndex = 0;
        this.score = 0;
        this.correctAnswers = 0;
        
        // Kategori seçimini kaldır
        const selection = document.querySelector('.category-selection');
        if (selection) {
            selection.remove();
        }
        
        // Oyun alanını göster
        const gameArea = document.querySelector('.question-box');
        const answersContainer = document.getElementById('answers-container');
        const nextBtn = document.getElementById('next-btn');
        
        if (gameArea) gameArea.style.display = 'block';
        if (answersContainer) answersContainer.style.display = 'grid';
        if (nextBtn) nextBtn.style.display = 'none';
        
        // Soruları yükle
        await this.loadQuestions();
        
        if (this.questions.length === 0) {
            Utils.showNotification('Seçtiğiniz kategoride soru bulunamadı!', 'error');
            this.showCategorySelection();
            return;
        }
        
        // İlk soruyu göster
        this.showQuestion();
        
        Utils.showNotification('Müzakere başladı! Haydi, hakikatleri keşfet!', 'success');
    }
    
    showQuestion() {
        if (this.currentQuestionIndex >= this.questions.length) {
            this.endGame();
            return;
        }
        
        const question = this.questions[this.currentQuestionIndex];
        
        // Soru bilgilerini göster
        document.getElementById('question-text').textContent = question.question;
        document.getElementById('category-name').textContent = question.category || 'Genel';
        document.getElementById('difficulty-level').textContent = question.difficulty || 'Orta';
        
        // Cevapları oluştur
        const answersContainer = document.getElementById('answers-container');
        answersContainer.innerHTML = '';
        
        question.answers.forEach((answer, index) => {
            const button = document.createElement('button');
            button.className = 'answer-btn';
            button.innerHTML = `
                <span class="answer-text">${answer.text || answer}</span>
                <span class="answer-check"></span>
            `;
            button.onclick = () => this.checkAnswer(index);
            answersContainer.appendChild(button);
        });
        
        // Sonraki soru butonunu gizle
        document.getElementById('next-btn').style.display = 'none';
    }
    
    async checkAnswer(selectedIndex) {
        const question = this.questions[this.currentQuestionIndex];
        const buttons = document.querySelectorAll('.answer-btn');
        
        // Tüm butonları devre dışı bırak
        buttons.forEach(btn => btn.disabled = true);
        
        let correctIndex = question.correct;
        
        // Eğer answers nesnelerden oluşuyorsa
        if (question.answers[0] && typeof question.answers[0] === 'object') {
            correctIndex = question.answers.findIndex(ans => ans.correct);
        }
        
        // Doğru ve yanlış cevapları göster
        buttons.forEach((btn, index) => {
            if(index === correctIndex) {
                btn.classList.add('correct');
            } else if(index === selectedIndex && index !== correctIndex) {
                btn.classList.add('wrong');
            }
        });
        
        // Puan hesapla
        if(selectedIndex === correctIndex) {
            this.score += 10;
            this.correctAnswers++;
            this.hasenat += 5;
            
            this.updateDisplay();
            Utils.showNotification('✅ Doğru! +5 Hasenat', 'success');
            
            // Zorluk bonusu
            const difficultyBonus = {
                'Kolay': 1,
                'Orta': 2,
                'Zor': 3
            };
            const bonus = difficultyBonus[question.difficulty] || 1;
            this.hasenat += bonus;
            
        } else {
            const correctAnswer = question.answers[correctIndex]?.text || question.answers[correctIndex];
            Utils.showNotification(`❌ Yanlış! Doğru cevap: ${correctAnswer}`, 'error');
        }
        
        // Açıklama göster
        if (question.explanation) {
            this.showExplanation(question.explanation);
        }
        
        document.getElementById('next-btn').style.display = 'block';
    }
    
    showExplanation(text) {
        const container = document.querySelector('.question-box');
        const existingExplanation = container.querySelector('.explanation');
        
        if (existingExplanation) {
            existingExplanation.remove();
        }
        
        const explanation = document.createElement('div');
        explanation.className = 'explanation';
        explanation.innerHTML = `
            <div style="
                background: rgba(255,255,255,0.1);
                padding: 15px;
                border-radius: 10px;
                margin-top: 20px;
                border-left: 4px solid #f6e05e;
            ">
                <h4 style="margin-bottom: 10px; color: #f6e05e;">📚 Açıklama:</h4>
                <p>${text}</p>
            </div>
        `;
        
        container.appendChild(explanation);
    }
    
    async nextQuestion() {
        this.currentQuestionIndex++;
        
        if (this.currentQuestionIndex >= this.questions.length) {
            await this.endGame();
        } else {
            // Açıklamayı temizle
            const explanation = document.querySelector('.explanation');
            if (explanation) {
                explanation.remove();
            }
            
            this.showQuestion();
        }
    }
    
    async endGame() {
        const accuracy = this.totalQuestions > 0 ? 
            Math.round((this.correctAnswers / this.totalQuestions) * 100) : 0;
        
        // Bonus hasenat
        let bonusHasenat = 0;
        if (accuracy === 100) bonusHasenat = 50;
        else if (accuracy >= 80) bonusHasenat = 30;
        else if (accuracy >= 60) bonusHasenat = 15;
        
        this.hasenat += bonusHasenat;
        
        // Sonuç ekranını göster
        const resultHTML = `
            <div class="game-result" style="
                background: rgba(255,255,255,0.1);
                border-radius: 20px;
                padding: 30px;
                margin: 20px 0;
                backdrop-filter: blur(10px);
                text-align: center;
            ">
                <h2 style="color: #f6e05e; margin-bottom: 20px;">🎉 Müzakere Tamamlandı!</h2>
                
                <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; margin: 30px 0;">
                    <div class="stat" style="background: rgba(255,255,255,0.1); padding: 15px; border-radius: 10px;">
                        <div style="font-size: 2em; color: #48bb78;">${this.score}</div>
                        <div>Toplam Puan</div>
                    </div>
                    <div class="stat" style="background: rgba(255,255,255,0.1); padding: 15px; border-radius: 10px;">
                        <div style="font-size: 2em; color: #f6e05e;">${this.hasenat}</div>
                        <div>Hasenat Puanı</div>
                    </div>
                    <div class="stat" style="background: rgba(255,255,255,0.1); padding: 15px; border-radius: 10px;">
                        <div style="font-size: 2em; color: #4299e1;">${accuracy}%</div>
                        <div>Doğruluk Oranı</div>
                    </div>
                    <div class="stat" style="background: rgba(255,255,255,0.1); padding: 15px; border-radius: 10px;">
                        <div style="font-size: 2em; color: #ed8936;">${this.correctAnswers}/${this.totalQuestions}</div>
                        <div>Doğru Cevap</div>
                    </div>
                </div>
                
                ${bonusHasenat > 0 ? `
                    <div style="background: rgba(246, 224, 94, 0.2); 
                               padding: 15px; 
                               border-radius: 10px;
                               margin: 20px 0;
                               border: 2px solid #f6e05e;">
                        <div style="color: #f6e05e; font-weight: bold; font-size: 1.2em;">
                            🏆 Mükemmel! +${bonusHasenat} bonus hasenat kazandın!
                        </div>
                    </div>
                ` : ''}
                
                <div style="margin-top: 30px;">
                    <button onclick="window.location.reload()" style="
                        padding: 15px 30px;
                        background: #48bb78;
                        color: white;
                        border: none;
                        border-radius: 50px;
                        font-size: 1.1em;
                        font-weight: bold;
                        cursor: pointer;
                        margin: 0 10px;
                    ">
                        🔁 Tekrar Oyna
                    </button>
                    <button onclick="window.location.href='index.html'" style="
                        padding: 15px 30px;
                        background: rgba(255,255,255,0.2);
                        color: white;
                        border: 2px solid rgba(255,255,255,0.3);
                        border-radius: 50px;
                        font-size: 1.1em;
                        font-weight: bold;
                        cursor: pointer;
                        margin: 0 10px;
                    ">
                        🏠 Ana Menü
                    </button>
                </div>
            </div>
        `;
        
        // Mevcut içeriği değiştir
        const container = document.querySelector('.container');
        if (container) {
            container.innerHTML = resultHTML;
        }
        
        // Sonucu kaydet
        await this.saveGameResult(accuracy);
    }
    
    updateDisplay() {
        document.getElementById('score').textContent = this.score;
        document.getElementById('hasenat').textContent = this.hasenat;
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
    
    async saveGameResult(accuracy) {
        const gameData = {
            score: this.score,
            correctAnswers: this.correctAnswers,
            totalQuestions: this.totalQuestions,
            accuracy: accuracy,
            hasenat: this.hasenat,
            date: new Date().toISOString(),
            category: this.selectedCategory,
            difficulty: this.selectedDifficulty
        };
        
        // LocalStorage
        const history = Utils.loadFromLocalStorage('muzakere_history') || [];
        history.unshift(gameData);
        if (history.length > 20) history.pop();
        Utils.saveToLocalStorage('muzakere_history', history);
        
        // Firebase
        if (authManager.isLoggedIn()) {
            try {
                const user = authManager.getCurrentUser();
                await database.completeGame(user.uid, 'muzakere', this.score);
                await database.updateUserHasenat(user.uid, this.hasenat);
                
                // İstatistikleri güncelle
                const stats = {
                    muzakerePlayed: true,
                    muzakereHighScore: Math.max(
                        (await database.getUserData(user.uid))?.muzakereHighScore || 0,
                        this.score
                    ),
                    lastMuzakereDate: new Date().toISOString()
                };
                await database.updateUserData(user.uid, stats);
                
            } catch (error) {
                console.error('Skor kaydetme hatası:', error);
            }
        } else {
            // Misafir için
            const guestHasenat = Utils.loadFromLocalStorage('guest_hasenat') || 0;
            Utils.saveToLocalStorage('guest_hasenat', guestHasenat + this.hasenat);
        }
    }
}

// Oyunu başlat
let muzakereGame = null;

document.addEventListener('DOMContentLoaded', () => {
    muzakereGame = new MuzakereGame();
    
    // Global fonksiyonlar
    window.checkAnswer = (index) => muzakereGame.checkAnswer(index);
    window.nextQuestion = () => muzakereGame.nextQuestion();
});

export default MuzakereGame;