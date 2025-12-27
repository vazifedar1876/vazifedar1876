import authManager from '../core/auth.js';
import database from '../core/database.js';
import { Utils } from '../core/utils.js';

class TefekkurGame {
    constructor() {
        this.tefekkurQuestions = this.getTefekkurQuestions();
        this.tesebbusTasks = this.getTesebbusTasks();
        
        this.gameState = {
            completed: 0,
            hasenat: 0,
            totalTime: 0,
            currentType: null,
            currentQuestion: null,
            currentTask: null,
            timer: null,
            timeLeft: 0,
            isGuest: false
        };
        
        this.screens = {
            choice: document.getElementById('choice-screen'),
            question: document.getElementById('question-screen'),
            task: document.getElementById('task-screen'),
            completion: document.getElementById('completion-screen')
        };
        
        this.init();
    }
    
    init() {
        this.updateStats();
        this.setupEventListeners();
        this.loadUserData();
    }
    
    getTefekkurQuestions() {
        return [
            {
                id: 1,
                question: "Ömrünün geri kalanını nerede geçirmek isterdin ve neden?",
                difficulty: "Orta",
                reflectionTime: 90,
                category: "Hayat Felsefesi"
            },
            {
                id: 2,
                question: "En son ne zaman bir çiçeği izleyip hayret ettin? O anda ne hissettin?",
                difficulty: "Kolay",
                reflectionTime: 60,
                category: "Doğa Tefekkürü"
            },
            {
                id: 3,
                question: "Şu an yanında olmayan, gıyabında dua edeceğin ilk kişi kim?",
                difficulty: "Kolay",
                reflectionTime: 45,
                category: "Manevi Bağlar"
            },
            {
                id: 4,
                question: "Hayatındaki en önemli 3 değer nedir? Bu değerler günlük hayatını nasıl şekillendiriyor?",
                difficulty: "Zor",
                reflectionTime: 120,
                category: "Değerler Sistemi"
            },
            {
                id: 5,
                question: "Bugün yaptığın bir iyiliği veya güzel bir davranışını düşün. Bunu yaparken ne hissettin?",
                difficulty: "Kolay",
                reflectionTime: 60,
                category: "İç Muhasebe"
            }
        ];
    }
    
    getTesebbusTasks() {
        return [
            {
                id: 1,
                task: "Telefonunu masaya bırak ve 1 dakika boyunca hiç konuşmadan tefekkür et.",
                hint: "Gözlerini kapatabilir veya etrafındaki doğal güzellikleri izleyebilirsin.",
                duration: 60,
                difficulty: "Kolay",
                category: "Sessizlik"
            },
            {
                id: 2,
                task: "Ezbere bildiğin kısa bir sureyi sesli ve tane tane oku.",
                hint: "Anlamını düşünerek okumaya çalış.",
                duration: 120,
                difficulty: "Kolay",
                category: "Kur'an Okuma"
            },
            {
                id: 3,
                task: "Yanındaki arkadaşına (veya kendine) sesli olarak 'Allah seni seviyor' de.",
                hint: "Samimiyetle ve gülümseyerek söyle.",
                duration: 30,
                difficulty: "Kolay",
                category: "Müsbet Hareket"
            },
            {
                id: 4,
                task: "Bir sayfa kitap oku ve okuduğun bölümden bir ders çıkar.",
                hint: "Kitaplığından veya çevrimiçi bir kaynaktan okuyabilirsin.",
                duration: 300,
                difficulty: "Orta",
                category: "Okuma"
            },
            {
                id: 5,
                task: "Bugün yapabileceğin küçük bir iyilik bul ve hemen yap.",
                hint: "Çöpü at, kapıyı tut, gülümse veya teşekkür et.",
                duration: 300,
                difficulty: "Orta",
                category: "Salih Amel"
            }
        ];
    }
    
    setupEventListeners() {
        // Buton event'leri
        const buttons = {
            'selectTefekkur': () => this.selectTefekkur(),
            'selectTesebbus': () => this.selectTesebbus(),
            'completeTefekkur': () => this.completeTefekkur(),
            'skipQuestion': () => this.skipQuestion(),
            'completeTask': () => this.completeTask(),
            'skipTask': () => this.skipTask(),
            'nextChallenge': () => this.nextChallenge(),
            'showChoiceScreen': () => this.showChoiceScreen()
        };
        
        Object.entries(buttons).forEach(([funcName, handler]) => {
            const elements = document.querySelectorAll(`[onclick*="${funcName}"]`);
            elements.forEach(el => {
                el.onclick = handler;
                el.removeAttribute('onclick');
            });
        });
        
        // Ana menü butonu
        const menuBtn = document.querySelector('button[onclick*="index.html"]');
        if (menuBtn) {
            menuBtn.onclick = () => window.location.href = 'index.html';
        }
        
        // Yansıma metni otomatik kaydet
        const reflectionText = document.getElementById('reflection-text');
        if (reflectionText) {
            reflectionText.addEventListener('input', Utils.debounce(() => {
                this.saveReflection(reflectionText.value);
            }, 1000));
        }
    }
    
    async loadUserData() {
        if (authManager.isLoggedIn()) {
            const user = authManager.getCurrentUser();
            const userData = await database.getUserData(user.uid);
            this.gameState.hasenat = userData?.hasenat || 0;
            this.gameState.completed = userData?.tefekkurCompleted || 0;
        } else {
            const guestData = Utils.loadFromLocalStorage('tefekkur_data') || {};
            this.gameState.hasenat = guestData.hasenat || 0;
            this.gameState.completed = guestData.completed || 0;
            this.gameState.isGuest = true;
        }
        this.updateStats();
    }
    
    updateStats() {
        document.getElementById('completed').textContent = this.gameState.completed;
        document.getElementById('hasenat').textContent = this.gameState.hasenat;
        document.getElementById('total-time').textContent = this.formatTime(this.gameState.totalTime);
    }
    
    formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    
    selectTefekkur() {
        this.gameState.currentType = 'tefekkur';
        this.showRandomQuestion();
        this.showScreen('question');
    }
    
    selectTesebbus() {
        this.gameState.currentType = 'tesebbus';
        this.showRandomTask();
        this.showScreen('task');
    }
    
    showRandomQuestion() {
        const availableQuestions = this.tefekkurQuestions.filter(q => 
            !this.getCompletedQuestions().includes(q.id)
        );
        
        if (availableQuestions.length === 0) {
            this.showMessage('Tüm tefekkür sorularını tamamladın!', 'info');
            this.showChoiceScreen();
            return;
        }
        
        const randomIndex = Math.floor(Math.random() * availableQuestions.length);
        this.gameState.currentQuestion = availableQuestions[randomIndex];
        
        document.getElementById('question-text').textContent = this.gameState.currentQuestion.question;
        document.getElementById('timer-count').textContent = this.gameState.currentQuestion.reflectionTime;
        this.gameState.timeLeft = this.gameState.currentQuestion.reflectionTime;
        
        // Yansıma metnini yükle
        const savedReflection = this.loadReflection(this.gameState.currentQuestion.id);
        document.getElementById('reflection-text').value = savedReflection || '';
        
        this.startTimer('reflection');
    }
    
    showRandomTask() {
        const availableTasks = this.tesebbusTasks.filter(t => 
            !this.getCompletedTasks().includes(t.id)
        );
        
        if (availableTasks.length === 0) {
            this.showMessage('Tüm teşebbüs görevlerini tamamladın!', 'info');
            this.showChoiceScreen();
            return;
        }
        
        const randomIndex = Math.floor(Math.random() * availableTasks.length);
        this.gameState.currentTask = availableTasks[randomIndex];
        
        document.getElementById('task-text').textContent = this.gameState.currentTask.task;
        document.getElementById('task-hint').textContent = this.gameState.currentTask.hint;
        document.getElementById('task-timer-count').textContent = this.gameState.currentTask.duration;
        this.gameState.timeLeft = this.gameState.currentTask.duration;
        
        this.startTimer('task');
    }
    
    startTimer(type) {
        if (this.gameState.timer) {
            clearInterval(this.gameState.timer);
        }
        
        const countElementId = type === 'tefekkur' ? 'timer-count' : 'task-timer-count';
        
        this.gameState.timer = setInterval(() => {
            this.gameState.timeLeft--;
            this.gameState.totalTime++;
            
            document.getElementById(countElementId).textContent = this.gameState.timeLeft;
            this.updateStats();
            
            if (this.gameState.timeLeft <= 0) {
                clearInterval(this.gameState.timer);
                if (type === 'reflection') {
                    this.completeTefekkur();
                } else {
                    this.completeTask();
                }
            }
        }, 1000);
    }
    
    async completeTefekkur() {
        clearInterval(this.gameState.timer);
        
        // Hasenat hesapla
        const basePoints = 20;
        const timeBonus = Math.max(0, this.gameState.currentQuestion.reflectionTime - this.gameState.timeLeft);
        const difficultyMultiplier = { 'Kolay': 1, 'Orta': 1.5, 'Zor': 2 };
        const earnedPoints = Math.floor(basePoints * 
            difficultyMultiplier[this.gameState.currentQuestion.difficulty] + timeBonus / 10);
        
        // Yansıma metni
        const reflectionText = document.getElementById('reflection-text').value;
        
        // Oyun durumunu güncelle
        this.gameState.completed++;
        this.gameState.hasenat += earnedPoints;
        
        // Kaydet
        await this.saveGameResult('tefekkur', earnedPoints, reflectionText);
        
        // Tamamlama ekranını göster
        this.showCompletionScreen(
            "Tefekkür Tamamlandı!",
            `"${this.gameState.currentQuestion.question}"<br><br>` +
            `<strong>Kategori:</strong> ${this.gameState.currentQuestion.category}<br>` +
            `<strong>Süre:</strong> ${this.gameState.currentQuestion.reflectionTime - this.gameState.timeLeft} saniye<br>` +
            (reflectionText ? `<strong>Yansıman:</strong> "${reflectionText.substring(0, 100)}${reflectionText.length > 100 ? '...' : ''}"` : ""),
            earnedPoints
        );
    }
    
    async completeTask() {
        clearInterval(this.gameState.timer);
        
        // Hasenat hesapla
        const basePoints = 30;
        const timeBonus = Math.max(0, this.gameState.currentTask.duration - this.gameState.timeLeft);
        const difficultyMultiplier = { 'Kolay': 1, 'Orta': 1.5, 'Zor': 2 };
        const earnedPoints = Math.floor(basePoints * 
            difficultyMultiplier[this.gameState.currentTask.difficulty] + timeBonus / 10);
        
        // Oyun durumunu güncelle
        this.gameState.completed++;
        this.gameState.hasenat += earnedPoints;
        
        // Kaydet
        await this.saveGameResult('tesebbus', earnedPoints);
        
        // Tamamlama ekranını göster
        this.showCompletionScreen(
            "Görev Tamamlandı!",
            `"${this.gameState.currentTask.task}"<br><br>` +
            `<strong>Kategori:</strong> ${this.gameState.currentTask.category}<br>` +
            `<strong>Süre:</strong> ${this.gameState.currentTask.duration - this.gameState.timeLeft} saniye<br>` +
            `<strong>Zorluk:</strong> ${this.gameState.currentTask.difficulty}`,
            earnedPoints
        );
    }
    
    skipQuestion() {
        clearInterval(this.gameState.timer);
        this.showRandomQuestion();
    }
    
    skipTask() {
        clearInterval(this.gameState.timer);
        this.showRandomTask();
    }
    
    showCompletionScreen(title, message, earnedPoints) {
        this.showScreen('completion');
        
        document.getElementById('completion-title').textContent = title;
        document.getElementById('completion-message').innerHTML = message;
        document.getElementById('earned-hasenat').textContent = earnedPoints;
        
        // Yansıma metnini temizle
        document.getElementById('reflection-text').value = '';
        
        // İstatistikleri güncelle
        this.updateStats();
    }
    
    nextChallenge() {
        this.showScreen('choice');
        
        if (this.gameState.currentType === 'tefekkur') {
            this.showRandomQuestion();
            this.showScreen('question');
        } else {
            this.showRandomTask();
            this.showScreen('task');
        }
    }
    
    showChoiceScreen() {
        this.showScreen('choice');
        
        if (this.gameState.timer) {
            clearInterval(this.gameState.timer);
        }
    }
    
    showScreen(screenName) {
        Object.values(this.screens).forEach(screen => {
            if (screen) screen.style.display = 'none';
        });
        
        if (this.screens[screenName]) {
            this.screens[screenName].style.display = 'block';
        }
    }
    
    async saveGameResult(type, earnedPoints, reflection = '') {
        const gameData = {
            type: type,
            points: earnedPoints,
            reflection: reflection,
            date: new Date().toISOString(),
            details: type === 'tefekkur' ? this.gameState.currentQuestion : this.gameState.currentTask
        };
        
        // LocalStorage
        const history = Utils.loadFromLocalStorage('tefekkur_history') || [];
        history.unshift(gameData);
        if (history.length > 20) history.pop();
        Utils.saveToLocalStorage('tefekkur_history', history);
        
        // Tamamlananları kaydet
        if (type === 'tefekkur') {
            const completed = this.getCompletedQuestions();
            if (!completed.includes(this.gameState.currentQuestion.id)) {
                completed.push(this.gameState.currentQuestion.id);
                Utils.saveToLocalStorage('completed_questions', completed);
            }
        } else {
            const completed = this.getCompletedTasks();
            if (!completed.includes(this.gameState.currentTask.id)) {
                completed.push(this.gameState.currentTask.id);
                Utils.saveToLocalStorage('completed_tasks', completed);
            }
        }
        
        // Firebase
        if (authManager.isLoggedIn()) {
            try {
                const user = authManager.getCurrentUser();
                await database.completeGame(user.uid, 'tefekkur', earnedPoints);
                await database.updateUserHasenat(user.uid, earnedPoints);
                
                // Kullanıcı verisini güncelle
                const updateData = {
                    tefekkurCompleted: this.gameState.completed,
                    lastTefekkurDate: new Date().toISOString()
                };
                await database.updateUserData(user.uid, updateData);
            } catch (error) {
                console.error('Kaydetme hatası:', error);
            }
        } else {
            // Misafir için localStorage
            const guestData = {
                hasenat: this.gameState.hasenat,
                completed: this.gameState.completed,
                lastPlayed: new Date().toISOString()
            };
            Utils.saveToLocalStorage('tefekkur_data', guestData);
            
            const guestHasenat = Utils.loadFromLocalStorage('guest_hasenat') || 0;
            Utils.saveToLocalStorage('guest_hasenat', guestHasenat + earnedPoints);
        }
    }
    
    getCompletedQuestions() {
        return Utils.loadFromLocalStorage('completed_questions') || [];
    }
    
    getCompletedTasks() {
        return Utils.loadFromLocalStorage('completed_tasks') || [];
    }
    
    saveReflection(text) {
        if (this.gameState.currentQuestion) {
            const reflections = Utils.loadFromLocalStorage('reflections') || {};
            reflections[this.gameState.currentQuestion.id] = text;
            Utils.saveToLocalStorage('reflections', reflections);
        }
    }
    
    loadReflection(questionId) {
        const reflections = Utils.loadFromLocalStorage('reflections') || {};
        return reflections[questionId] || '';
    }
    
    showMessage(text, type) {
        Utils.showNotification(text, type);
    }
}

// Oyunu başlat
let tefekkurGame = null;

document.addEventListener('DOMContentLoaded', () => {
    tefekkurGame = new TefekkurGame();
    
    // Global fonksiyonlar
    window.selectTefekkur = () => tefekkurGame.selectTefekkur();
    window.selectTesebbus = () => tefekkurGame.selectTesebbus();
    window.completeTefekkur = () => tefekkurGame.completeTefekkur();
    window.skipQuestion = () => tefekkurGame.skipQuestion();
    window.completeTask = () => tefekkurGame.completeTask();
    window.skipTask = () => tefekkurGame.skipTask();
    window.nextChallenge = () => tefekkurGame.nextChallenge();
    window.showChoiceScreen = () => tefekkurGame.showChoiceScreen();
});

export default TefekkurGame;