import { auth, googleProvider, db } from './firebase.js';
import { signInWithPopup, signOut } from 'https://www.gstatic.com/firebasejs/10.7.0/firebase-auth.js';
import { doc, setDoc, getDoc } from 'https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js';

class AuthManager {
    constructor() {
        this.user = null;
        this.init();
    }

    init() {
        auth.onAuthStateChanged(async (user) => {
            this.user = user;
            if (user) {
                await this.createOrUpdateUser(user);
                this.dispatchEvent('auth-change', { user, loggedIn: true });
            } else {
                this.dispatchEvent('auth-change', { user: null, loggedIn: false });
            }
        });
    }

    async signInWithGoogle() {
        try {
            const result = await signInWithPopup(auth, googleProvider);
            return { success: true, user: result.user };
        } catch (error) {
            console.error('Google giriş hatası:', error);
            return { success: false, error };
        }
    }

    async signOut() {
        try {
            await signOut(auth);
            return { success: true };
        } catch (error) {
            console.error('Çıkış hatası:', error);
            return { success: false, error };
        }
    }

    async createOrUpdateUser(firebaseUser) {
        const userRef = doc(db, 'users', firebaseUser.uid);
        const userData = {
            uid: firebaseUser.uid,
            displayName: firebaseUser.displayName,
            email: firebaseUser.email,
            photoURL: firebaseUser.photoURL,
            lastLogin: new Date().toISOString(),
            createdAt: firebaseUser.metadata.creationTime,
            provider: firebaseUser.providerData[0].providerId
        };

        try {
            const userDoc = await getDoc(userRef);
            if (!userDoc.exists()) {
                userData.createdAt = new Date().toISOString();
                userData.hasenat = 0;
                userData.level = 'Müşteak';
                userData.completedGames = {};
            }
            await setDoc(userRef, userData, { merge: true });
        } catch (error) {
            console.error('Kullanıcı kaydetme hatası:', error);
        }
    }

    getCurrentUser() {
        return this.user;
    }

    isLoggedIn() {
        return !!this.user;
    }

    dispatchEvent(name, detail) {
        window.dispatchEvent(new CustomEvent(name, { detail }));
    }
}

// Singleton instance
const authManager = new AuthManager();
export default authManager;