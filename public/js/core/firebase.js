// ANA FIREBASE DOSYASI
// Ortama göre doğru konfigürasyonu seçer

// Ortam kontrolü
const isLocalhost = window.location.hostname === 'localhost' || 
                    window.location.hostname === '127.0.0.1' ||
                    window.location.hostname.includes('192.168.') ||
                    window.location.hostname === '';

const isProd = window.location.hostname.includes('muavin1876.web.app') || 
               window.location.hostname.includes('muavin1876.firebaseapp.com');

console.log(`Ortam tespiti: ${isLocalhost ? 'LOCAL' : isProd ? 'PRODUCTION' : 'UNKNOWN'}`);

// Ortama göre doğru modülü yükle
let firebaseModule;

if (isLocalhost) {
  console.log('📍 Local geliştirme ortamı tespit edildi');
  firebaseModule = await import('./firebase-local.js');
} else if (isProd) {
  console.log('🚀 Production ortamı tespit edildi');
  firebaseModule = await import('./firebase-prod.js');
} else {
  console.warn('⚠️  Bilinmeyen ortam, local modu kullanılıyor');
  firebaseModule = await import('./firebase-local.js');
}

// Tüm export'ları dışa aktar
export const app = firebaseModule.app;
export const auth = firebaseModule.auth;
export const db = firebaseModule.db;
export const remoteConfig = firebaseModule.remoteConfig;
export const googleProvider = firebaseModule.googleProvider;
export const analytics = firebaseModule.analytics;
export const fetchRemoteConfig = firebaseModule.fetchRemoteConfig;
export const getRemoteString = firebaseModule.getRemoteString;
export const getRemoteBoolean = firebaseModule.getRemoteBoolean;
export const getRemoteNumber = firebaseModule.getRemoteNumber;
export const safeLogEvent = firebaseModule.safeLogEvent;
export const isLocal = firebaseModule.isLocal;
export const isProduction = firebaseModule.isProduction;