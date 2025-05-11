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
    onSnapshot,
    getCountFromServer,
    startAfter,
    startAt,
    or
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

    /**
   * Tìm kiếm sản phẩm theo barcode chính xác
   * @param {string} barcode - Mã barcode cần tìm
   * @param {string} collectionName - Tên collection (mặc định là 'products')
   * @param {string} barcodeField - Tên trường chứa barcode (mặc định là 'barcode')
   * @returns {Object|null} - Thông tin sản phẩm hoặc null nếu không tìm thấy
   */
    async findProductByBarcode(barcode, collectionName = 'products', barcodeField = 'barcode') {
        try {
            // Tạo reference đến collection
            const collectionRef = collection(this.db, collectionName);

            // Tạo truy vấn để tìm kiếm barcode chính xác
            const q = query(
                collectionRef,
                where(barcodeField, '==', barcode),
                limit(1)
            );

            // Thực hiện truy vấn
            const querySnapshot = await getDocs(q);

            // Kiểm tra kết quả
            if (querySnapshot.empty) {
                console.log(`Không tìm thấy sản phẩm với barcode: ${barcode}`);
                return null;
            }
            // Trả về sản phẩm đầu tiên tìm thấy
            const doc = querySnapshot.docs[0];
            return {
                id: doc.id,
                ...doc.data()
            };
        } catch (error) {
            console.error(`Lỗi khi tìm kiếm barcode ${barcode}:`, error);
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

    async GetCountDocument(collectionName, whereConditions = []) {
        try {
            const colRef = collection(this.db, collectionName);
            let q = query(colRef);
            whereConditions.forEach(condition => {
                const [field, operator, value] = condition;
                q = query(q, where(field, operator, value));
            });
            const snapshot = await getCountFromServer(q);
            return snapshot.data().count
        } catch (error) {
            console.error('Error subscribing to document:', error);
            throw error;
        }
    }

    async getPaginatedData(
        collectionName,
        whereConditions = [],
        sort = "createdAt|desc",
        pageSize = 10,
        lastVisible = null,
        firstVisible = null,
        type = null
    ) {
        try {
            const colRef = collection(db, collectionName);
            let q = query(colRef);
            let combinedQueries = [];
            whereConditions.forEach(condition => {
                const [field, operator, value] = condition;
                /*if (field == 'title') {
                    const titleLowerCase = value.toLowerCase();
                    combinedQueries.push(
                        or(
                            where('title', '>=', titleLowerCase),
                            where('title', '<=', titleLowerCase + '\uf8ff')
                        )
                    );
                }
                if (field == 'barcode') {
                    const barcodeLowerCase = value.toLowerCase();
                    combinedQueries.push(
                        or(
                            where('barcode', '>=', barcodeLowerCase),
                            where('barcode', '<=', barcodeLowerCase + '\uf8ff')
                        )
                    );
                }
                if (field == 'expiryDate') {
                    q = query(q, where(field, operator, value));
                }*/
               q = query(q, where(field, operator, value));
            });

            q = query(q, orderBy(sort.split('|')[0], sort.split('|')[1] == "asc" ? "asc" : "desc"), limit(pageSize));

            if (type == 'prev' && firstVisible) {
                q = query(q, startAt(firstVisible));
            } else if (type == 'next' && lastVisible) {
                q = query(q, startAfter(lastVisible));
            }
            if (combinedQueries.length > 0) {
                q = query(q, ...combinedQueries);
            }
            const snapshot = await getDocs(q);

            const firstDoc = snapshot.docs[0];
            const lastDoc = snapshot.docs[snapshot.docs.length - 1];

            return {
                data: snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })),
                lastVisible: lastDoc,
                firstVisible: firstDoc,
            };
        } catch (error) {
            console.error('Error subscribing to document:', error);
            throw error;
        }
    }


}

// Export instance của FirestoreService
const firestoreService = new FirestoreService();
module.exports = firestoreService;