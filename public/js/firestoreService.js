const { initializeApp } = require('firebase/app');
const {
    getFirestore,
    collection,
    addDoc,
    getDocs,
    doc,
    updateDoc,
    deleteDoc,
    query,
    where,
    orderBy,
    limit,
    onSnapshot
} = require('firebase/firestore');
const moment = require('moment');
const firebaseConfig = require('./firebaseConfig');

// Khởi tạo Firebase
const firebaseApp = initializeApp(firebaseConfig);
const db = getFirestore(firebaseApp);

// Class quản lý các thao tác với Firestore
class FirestoreService {
    constructor() {
        this.db = db;
    }

    // Thêm document vào collection
    async addDocument(collectionName, data) {
        console.log(collectionName, data);
        try {
            const docRef = await addDoc(collection(this.db, collectionName), {
                ...data,
                createdAt: moment().unix()
            });
            console.log('Document added with ID:', docRef.id);
            return docRef.id;
        } catch (error) {
            console.error('Error adding document:', error);
            throw error;
        }
    }

    // Lấy tất cả documents trong một collection
    async getAllDocuments(collectionName) {
        try {
            const querySnapshot = await getDocs(collection(this.db, collectionName));
            const documents = [];
            querySnapshot.forEach((doc) => {
                documents.push({
                    id: doc.id,
                    ...doc.data()
                });
            });
            return documents;
        } catch (error) {
            console.error('Error getting documents:', error);
            throw error;
        }
    }

    // Lấy document theo ID
    async getDocumentById(collectionName, documentId) {
        try {
            const docRef = doc(this.db, collectionName, documentId);
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
                return {
                    id: docSnap.id,
                    ...docSnap.data()
                };
            } else {
                console.log('No such document exists!');
                return null;
            }
        } catch (error) {
            console.error('Error getting document:', error);
            throw error;
        }
    }

    // Cập nhật document
    async updateDocument(collectionName, documentId, data) {
        try {
            const docRef = doc(this.db, collectionName, documentId);
            await updateDoc(docRef, {
                ...data,
                updatedAt: moment().unix()
            });
            console.log('Document updated successfully');
            return true;
        } catch (error) {
            console.error('Error updating document:', error);
            throw error;
        }
    }

    // Xóa document
    async deleteDocument(collectionName, documentId) {
        try {
            await deleteDoc(doc(this.db, collectionName, documentId));
            console.log('Document deleted successfully');
            return true;
        } catch (error) {
            console.error('Error deleting document:', error);
            throw error;
        }
    }

    // Tìm kiếm documents theo điều kiện
    async queryDocuments(collectionName, conditions = [], orderByField = null, orderDirection = 'asc', limitCount = null) {
        try {
            let queryRef = collection(this.db, collectionName);

            // Tạo query với các điều kiện
            if (conditions.length > 0) {
                const constraints = [];

                conditions.forEach(condition => {
                    constraints.push(where(condition.field, condition.operator, condition.value));
                });

                queryRef = query(queryRef, ...constraints);
            }

            // Thêm orderBy nếu có
            if (orderByField) {
                queryRef = query(queryRef, orderBy(orderByField, orderDirection));
            }

            // Thêm limit nếu có
            if (limitCount) {
                queryRef = query(queryRef, limit(limitCount));
            }

            const querySnapshot = await getDocs(queryRef);
            const documents = [];

            querySnapshot.forEach((doc) => {
                documents.push({
                    id: doc.id,
                    ...doc.data()
                });
            });

            return documents;
        } catch (error) {
            console.error('Error querying documents:', error);
            throw error;
        }
    }

    // Lắng nghe thay đổi real-time
    subscribeToCollection(collectionName, callback) {
        try {
            const collectionRef = collection(this.db, collectionName);

            return onSnapshot(collectionRef, (snapshot) => {
                const documents = [];

                snapshot.forEach((doc) => {
                    documents.push({
                        id: doc.id,
                        ...doc.data()
                    });
                });

                callback(documents);
            });
        } catch (error) {
            console.error('Error subscribing to collection:', error);
            throw error;
        }
    }

    // Lắng nghe thay đổi real-time cho một document
    subscribeToDocument(collectionName, documentId, callback) {
        try {
            const docRef = doc(this.db, collectionName, documentId);

            return onSnapshot(docRef, (doc) => {
                if (doc.exists()) {
                    callback({
                        id: doc.id,
                        ...doc.data()
                    });
                } else {
                    callback(null);
                }
            });
        } catch (error) {
            console.error('Error subscribing to document:', error);
            throw error;
        }
    }
}

// Export instance của FirestoreService
const firestoreService = new FirestoreService();
module.exports = firestoreService;