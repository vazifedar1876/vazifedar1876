import authManager from '../core/auth.js';
import database from '../core/database.js';
import { Utils } from '../core/utils.js';

export async function initHeader() {
    const header = document.getElementById('app-header');
    if (!header) return;

    const user = authManager.getCurrentUser();
    const isGuest = window.appState?.isGuest || false;

    let userData = null;
    if (user) {
        userData = await database.getUserData(user.uid);
    }

    header.innerHTML = `
        <div class="logo">
            <div style="font-size: 2.5em;">🔍</div>
            <div>
                <h1>Nur Kaşifleri</h1>
                <p style="opacity: 0.8; font-size: 0.9em;">Hakikati keşfet, hasenat kazan!</p>
            </div>
        </div>
        
        <div class="user-profile">
            ${user || isGuest ? `
                <div class="user-info">
                    <div class="user-name">${user ? user.displayName || user.email : 'Misafir Kaşif'}</div>
                    <div class="user-level">🎯 ${userData?.level || 'Müşteak'}</div>
                    <div class="hasenat-badge">✨ ${userData?.hasenat || window.appState?.hasenat || 0}</div>
                </div>
                <img src="${user?.photoURL || 'assets/icon-192.png'}" 
                     class="user-avatar"
                     alt="Profil">
                <button onclick="handleLogout()" style="
                    background: rgba(255,255,255,0.1);
                    border: 1px solid rgba(255,255,255,0.3);
                    color: white;
                    padding: 8px 15px;
                    border-radius: 10px;
                    cursor: pointer;
                    margin-left: 10px;
                ">Çıkış</button>
            ` : `
                <button onclick="handleLogin()" style="
                    background: white;
                    color: #667eea;
                    border: none;
                    padding: 10px 20px;
                    border-radius: 50px;
                    font-weight: bold;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                ">
                    <span>🔐</span>
                    Giriş Yap
                </button>
            `}
        </div>
    `;
}

// Global fonksiyonlar
window.handleLogout = async () => {
    if (authManager.isLoggedIn()) {
        await authManager.signOut();
        Utils.showNotification('Başarıyla çıkış yapıldı', 'success');
        window.location.reload();
    } else {
        window.appState.isGuest = false;
        Utils.saveToLocalStorage('guest_hasenat', window.appState.hasenat || 0);
        window.location.reload();
    }
};

window.handleLogin = async () => {
    const result = await authManager.signInWithGoogle();
    if (result.success) {
        Utils.showNotification('Hoş geldiniz!', 'success');
        window.location.reload();
    }
};