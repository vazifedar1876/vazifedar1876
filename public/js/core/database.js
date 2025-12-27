import { db } from './firebase.js';
import { 
    doc, setDoc, getDoc, updateDoc, 
    collection, addDoc, query, where, 
    orderBy, limit, getDocs, increment 
} from 'https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js';

class Database {
    constructor() {
        this.usersRef = collection(db, 'users');
        this.gamesRef = collection(db, 'games');
        this.questionsRef = collection(db, 'questions');
        this.scoresRef = collection(db, 'scores');
    }

    // Kullanıcı işlemleri
    async getUserData(uid) {
        try {
            const userDoc = await getDoc(doc(this.usersRef, uid));
            return userDoc.exists() ? userDoc.data() : null;
        } catch (error) {
            console.error('Kullanıcı verisi alma hatası:', error);
            return null;
        }
    }

    async updateUserHasenat(uid, points) {
        try {
            await updateDoc(doc(this.usersRef, uid), {
                hasenat: increment(points),
                lastUpdated: new Date().toISOString()
            });
            return { success: true };
        } catch (error) {
            console.error('Hasenat güncelleme hatası:', error);
            return { success: false, error };
        }
    }

    async updateUserLevel(uid, level) {
        try {
            await updateDoc(doc(this.usersRef, uid), {
                level,
                levelUpdatedAt: new Date().toISOString()
            });
            return { success: true };
        } catch (error) {
            console.error('Seviye güncelleme hatası:', error);
            return { success: false, error };
        }
    }

    async completeGame(uid, gameId, score) {
        try {
            const gameData = {
                gameId,
                score,
                completedAt: new Date().toISOString(),
                hasenatEarned: Math.floor(score / 10)
            };

            // Skor kaydı ekle
            await addDoc(this.scoresRef, {
                uid,
                ...gameData
            });

            // Kullanıcıya oyun tamamlama bilgisi ekle
            await updateDoc(doc(this.usersRef, uid), {
                [`completedGames.${gameId}`]: gameData,
                totalGamesCompleted: increment(1)
            });

            return { success: true, gameData };
        } catch (error) {
            console.error('Oyun tamamlama hatası:', error);
            return { success: false, error };
        }
    }

    // Soru bankası işlemleri
    async getQuestions(category, difficulty, limit = 10) {
        try {
            let q = query(this.questionsRef);
            
            if (category) {
                q = query(q, where('category', '==', category));
            }
            if (difficulty) {
                q = query(q, where('difficulty', '==', difficulty));
            }
            
            q = query(q, orderBy('createdAt', 'desc'), limit(limit));
            const snapshot = await getDocs(q);
            
            return snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
        } catch (error) {
            console.error('Soru getirme hatası:', error);
            return [];
        }
    }

    // Lider tablosu
    async getLeaderboard(limit = 50) {
        try {
            const q = query(
                this.usersRef, 
                orderBy('hasenat', 'desc'), 
                limit(limit)
            );
            const snapshot = await getDocs(q);
            
            return snapshot.docs.map((doc, index) => ({
                rank: index + 1,
                uid: doc.id,
                ...doc.data()
            }));
        } catch (error) {
            console.error('Lider tablosu hatası:', error);
            return [];
        }
    }
}

const database = new Database();
export default database;