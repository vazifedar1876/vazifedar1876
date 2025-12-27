// PRODUCTION ORTAMI İÇİN
// Tüm Firebase servisleri aktif

import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.0/firebase-app.js';
import { getAuth, GoogleAuthProvider } from 'https://www.gstatic.com/firebasejs/10.7.0/firebase-auth.js';
import { getFirestore } from 'https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js';
import { getRemoteConfig, fetchAndActivate, getValue } from 'https://www.gstatic.com/firebasejs/10.7.0/firebase-remote-config.js';
import { getAnalytics, logEvent } from 'https://www.gstatic.com/firebasejs/10.7.0/firebase-analytics.js';

// Firebase konfigürasyonunuz
const firebaseConfig = {
  apiKey: "AIzaSyCxYkYJvdcqnYmlGiknlSRbaokIEOL_9cg",
  authDomain: "muavin1876.firebaseapp.com",
  databaseURL: "https://muavin1876-default-rtdb.firebaseio.com",
  projectId: "muavin1876",
  storageBucket: "muavin1876.firebasestorage.app",
  messagingSenderId: "1020465642950",
  appId: "1:1020465642950:web:0f43936b6d12cbeba146c7",
  measurementId: "G-XZHY38VK60"
};

// Firebase servislerini başlat
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const remoteConfig = getRemoteConfig(app);
const googleProvider = new GoogleAuthProvider();
let analytics = null;

// Analytics'i başlat
try {
  analytics = getAnalytics(app);
  console.log('Firebase Analytics production modunda aktif');
} catch (error) {
  console.warn('Analytics başlatılamadı:', error);
  analytics = {
    logEvent: () => {} // Boş fonksiyon
  };
}

// Remote Config ayarları
remoteConfig.settings = {
  minimumFetchIntervalMillis: 3600000, // 1 saat
  fetchTimeoutMillis: 60000 // 60 saniye
};

// Varsayılan değerler
remoteConfig.defaultConfig = {
  'welcome_message': 'Nur Kaşiflerine Hoş Geldiniz!',
  'featured_game': 'muzakere',
  'maintenance_mode': 'false',
  'daily_verse': 'Şüphesiz Allah, adaleti, iyilik yapmayı, yakınlara vermeyi emreder; hayasızlığı, fenalık ve azgınlığı da yasaklar. O, düşünüp tutasınız diye size öğüt verir.',
  'version': '1.0.0',
  'daily_hasenat_bonus': '10',
  'max_daily_plays': '20'
};

// Remote Config'i fetch et
const fetchRemoteConfig = async () => {
  try {
    console.log('Production: Remote Config fetch ediliyor...');
    await fetchAndActivate(remoteConfig);
    console.log('Production: Remote Config aktif');
    return true;
  } catch (error) {
    console.warn('Remote Config yüklenemedi:', error);
    return false;
  }
};

// Remote Config değerlerini al
const getRemoteString = (key) => {
  try {
    const value = getValue(remoteConfig, key);
    return value.asString();
  } catch (error) {
    console.warn(`Remote Config key "${key}" alınamadı:`, error);
    return remoteConfig.defaultConfig[key] || '';
  }
};

const getRemoteBoolean = (key) => {
  try {
    const value = getValue(remoteConfig, key);
    return value.asBoolean();
  } catch (error) {
    console.warn(`Remote Config boolean "${key}" alınamadı:`, error);
    return false;
  }
};

const getRemoteNumber = (key) => {
  try {
    const value = getValue(remoteConfig, key);
    return value.asNumber();
  } catch (error) {
    console.warn(`Remote Config number "${key}" alınamadı:`, error);
    return 0;
  }
};

// Analytics event
const safeLogEvent = (eventName, eventParams = {}) => {
  try {
    if (analytics && analytics.logEvent) {
      logEvent(analytics, eventName, {
        ...eventParams,
        app_version: getRemoteString('version'),
        timestamp: new Date().toISOString()
      });
      console.log(`[ANALYTICS PROD] ${eventName} gönderildi`);
    }
  } catch (error) {
    console.warn('Analytics event gönderilemedi:', error);
  }
};

// Ortam değişkenleri
const isLocal = false;
const isProduction = true;

export { 
  app, 
  auth, 
  db, 
  remoteConfig,
  googleProvider,
  analytics,
  fetchRemoteConfig,
  getRemoteString,
  getRemoteBoolean,
  getRemoteNumber,
  safeLogEvent,
  isLocal,
  isProduction
};