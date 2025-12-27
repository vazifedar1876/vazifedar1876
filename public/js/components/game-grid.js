import database from '../core/database.js';
import authManager from '../core/auth.js';

const games = [
    {
        id: 'muzakere',
        title: 'Müzakere',
        icon: '💭',
        description: 'Risale-i Nur hakikatlerini keşfet',
        status: 'ready',
        link: 'muzakere.html',
        color: '#667eea'
    },
    {
        id: 'intizam',
        title: 'İntizam',
        icon: '🧩',
        description: 'Tetris ile nizamı sağla',
        status: 'ready',
        link: 'intizam.html',
        color: '#764ba2'
    },
    {
        id: 'vahdet',
        title: 'Vahdet Tablosu',
        icon: '🧩',
        description: 'Parçalardan bütünü gör',
        status: 'ready',
        link: 'vahdet.html',
        color: '#48bb78'
    },
    {
        id: 'tefekkur',
        title: 'Tefekkür mü Teşebbüs mü?',
        icon: '🤔',
        description: 'İç muhasebe ve salih amel',
        status: 'ready',
        link: 'tefekkur.html',
        color: '#ed8936'
    },
    {
        id: 'istikamet',
        title: 'İstikamet Rotası',
        icon: '🧭',
        description: 'Algoritma ile hedefe ulaş',
        status: 'ready',
        link: 'istikamet.html',
        color: '#f56565'
    }
];

export async function initGameGrid() {
    const gameGrid = document.getElementById('game-grid');
    if (!gameGrid) return;

    let userGamesData = {};
    
    if (authManager.isLoggedIn()) {
        const user = authManager.getCurrentUser();
        const userData = await database.getUserData(user.uid);
        userGamesData = userData?.completedGames || {};
    }

    gameGrid.innerHTML = games.map(game => {
        const gameData = userGamesData[game.id] || {};
        const completedCount = gameData.completedAt ? 1 : 0;
        const highScore = gameData.score || 0;

        return `
            <a href="${game.link}" class="game-card" style="border-color: ${game.color}40;">
                <div class="game-icon" style="color: ${game.color};">${game.icon}</div>
                <div class="game-title">${game.title}</div>
                <div class="game-desc">${game.description}</div>
                <div class="game-meta">
                    <div class="game-status ${game.status === 'ready' ? 'status-ready' : 'status-progress'}">
                        ${game.status === 'ready' ? '✅ Hazır' : '🔄 Devam Ediyor'}
                    </div>
                    <div class="game-stats">
                        ${highScore > 0 ? `🏆 ${highScore} puan` : '🎯 Yeni'}
                    </div>
                </div>
                ${completedCount > 0 ? `
                    <div style="position: absolute; top: 10px; right: 10px; background: ${game.color}; color: white; padding: 3px 8px; border-radius: 10px; font-size: 0.8em;">
                        ✔ ${completedCount}
                    </div>
                ` : ''}
            </a>
        `;
    }).join('');
}