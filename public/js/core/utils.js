// Yardımcı fonksiyonlar
export class Utils {
    static formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }

    static getRandomItems(array, count) {
        const shuffled = [...array].sort(() => 0.5 - Math.random());
        return shuffled.slice(0, count);
    }

    static debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    static showNotification(message, type = 'info') {
        const colors = {
            success: '#48bb78',
            error: '#f56565',
            info: '#4299e1',
            warning: '#ed8936'
        };

        const notification = document.createElement('div');
        notification.className = 'global-notification';
        notification.innerHTML = `
            <div class="notification-content ${type}">
                ${message}
            </div>
        `;

        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 9999;
            animation: slideInRight 0.3s ease;
        `;

        const style = document.createElement('style');
        style.textContent = `
            .notification-content {
                padding: 15px 25px;
                border-radius: 10px;
                color: white;
                font-weight: bold;
                box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                margin-bottom: 10px;
            }
            @keyframes slideInRight {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
            @keyframes slideOutRight {
                from { transform: translateX(0); opacity: 1; }
                to { transform: translateX(100%); opacity: 0; }
            }
        `;

        document.head.appendChild(style);
        document.body.appendChild(notification);

        setTimeout(() => {
            notification.style.animation = 'slideOutRight 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

    static getDeviceInfo() {
        return {
            isMobile: /iPhone|iPad|iPod|Android/i.test(navigator.userAgent),
            isTablet: /iPad|Android/i.test(navigator.userAgent) && !/Mobile/i.test(navigator.userAgent),
            isDesktop: !(/iPhone|iPad|iPod|Android/i.test(navigator.userAgent)),
            screenSize: {
                width: window.innerWidth,
                height: window.innerHeight
            }
        };
    }

    static saveToLocalStorage(key, data) {
        try {
            localStorage.setItem(`nur_kasifleri_${key}`, JSON.stringify(data));
        } catch (error) {
            console.error('LocalStorage kaydetme hatası:', error);
        }
    }

    static loadFromLocalStorage(key) {
        try {
            const data = localStorage.getItem(`nur_kasifleri_${key}`);
            return data ? JSON.parse(data) : null;
        } catch (error) {
            console.error('LocalStorage yükleme hatası:', error);
            return null;
        }
    }
}