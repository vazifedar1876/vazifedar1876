// LOCAL GELİŞTİRME ORTAMI İÇİN
// Sadece temel Firebase servisleri

import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.0/firebase-app.js';
import { getAuth, GoogleAuthProvider } from 'https://www.gstatic.com/firebasejs/10.7.0/firebase-auth.js';
import { getFirestore } from 'https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js';

// Firebase konfigürasyonunuz
const firebaseConfig = {
  apiKey: "AIzaSyCxYkYJvdcqnYmlGiknlSRbaokIEOL_9cg",
  authDomain: "muavin1876.firebaseapp.com",
  projectId: "muavin1876",
  storageBucket: "muavin1876.firebasestorage.app",
  messagingSenderId: "1020465642950",
  appId: "1:1020465642950:web:0f43936b6d12cbeba146c7"
};

// Firebase servislerini başlat
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const googleProvider = new GoogleAuthProvider();

// Remote Config mock (sahte) - local için
const remoteConfig = {
  getString: (key) => {
    const defaults = {
      'welcome_message': 'Nur Kaşifleri (Local Geliştirme)',
      'featured_game': 'muzakere',
      'daily_verse': 'Şüphesiz Allah, adaleti, iyilik yapmayı, yakınlara vermeyi emreder; hayasızlığı, fenalık ve azgınlığı da yasaklar. O, düşünüp tutasınız diye size öğüt verir.',
      'version': '1.0.0-local',
      'maintenance_mode': 'false'
    };
    console.log(`Local Remote Config: ${key} = ${defaults[key] || ''}`);
    return defaults[key] || '';
  },
  fetchAndActivate: async () => {
    console.log('Local: Remote Config mock kullanılıyor');
    return true; // Her zaman başarılı
  }
};

// Analytics mock - local için
const analytics = {
  logEvent: (eventName, eventParams) => {
    console.log(`[ANALYTICS LOCAL] ${eventName}:`, eventParams);
  }
};

// Yardımcı fonksiyonlar
const fetchRemoteConfig = async () => {
  console.log('Local: Remote Config fetch ediliyor (mock)');
  return true;
};

const getRemoteString = (key) => remoteConfig.getString(key);
const getRemoteBoolean = (key) => key === 'maintenance_mode' ? false : false;
const getRemoteNumber = (key) => 0;

const safeLogEvent = (eventName, eventParams = {}) => {
  console.log(`[EVENT LOCAL] ${eventName}:`, eventParams);
};

// Ortam değişkenleri
const isLocal = true;
const isProduction = false;

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