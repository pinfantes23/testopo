const DB_NAME = "test-app-db";
const DB_VERSION = 1;

const STORES = {
    QUESTIONS: "questions",
    EXAMS: "exams",
    ANSWERS: "answers",
    FAILED: "failed",
    STATISTICS: "statistics",
    SETTINGS: "settings"
};

function openDatabase() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onupgradeneeded = (event) => {
            const db = event.target.result;

            if (!db.objectStoreNames.contains(STORES.QUESTIONS)) {
                const store = db.createObjectStore(STORES.QUESTIONS, {
                    keyPath: "id"
                });

                store.createIndex("tema", "tema", { unique: false });
                store.createIndex("numero", "numero", { unique: false });
            }

            if (!db.objectStoreNames.contains(STORES.EXAMS)) {
                db.createObjectStore(STORES.EXAMS, {
                    keyPath: "id"
                });
            }

            if (!db.objectStoreNames.contains(STORES.ANSWERS)) {
                const store = db.createObjectStore(STORES.ANSWERS, {
                    keyPath: "id",
                    autoIncrement: true
                });

                store.createIndex("questionId", "questionId", {
                    unique: false
                });

                store.createIndex("fecha", "fecha", {
                    unique: false
                });
            }

            if (!db.objectStoreNames.contains(STORES.FAILED)) {
                db.createObjectStore(STORES.FAILED, {
                    keyPath: "questionId"
                });
            }

            if (!db.objectStoreNames.contains(STORES.STATISTICS)) {
                db.createObjectStore(STORES.STATISTICS, {
                    keyPath: "id"
                });
            }

            if (!db.objectStoreNames.contains(STORES.SETTINGS)) {
                db.createObjectStore(STORES.SETTINGS, {
                    keyPath: "id"
                });
            }
        };

        request.onsuccess = () => {
            resolve(request.result);
        };

        request.onerror = () => {
            reject(request.error);
        };
    });
}


async function saveQuestions(questions) {
    const db = await openDatabase();

    return new Promise((resolve, reject) => {
        const transaction = db.transaction(
            STORES.QUESTIONS,
            "readwrite"
        );

        const store = transaction.objectStore(STORES.QUESTIONS);

        questions.forEach(question => {
            store.put(question);
        });

        transaction.oncomplete = () => {
            resolve();
        };

        transaction.onerror = () => {
            reject(transaction.error);
        };
    });
}


async function getQuestion(id) {
    const db = await openDatabase();

    return new Promise((resolve, reject) => {
        const transaction = db.transaction(
            STORES.QUESTIONS,
            "readonly"
        );

        const store = transaction.objectStore(STORES.QUESTIONS);
        const request = store.get(id);

        request.onsuccess = () => {
            resolve(request.result);
        };

        request.onerror = () => {
            reject(request.error);
        };
    });
}


async function getAllQuestions() {
    const db = await openDatabase();

    return new Promise((resolve, reject) => {
        const transaction = db.transaction(
            STORES.QUESTIONS,
            "readonly"
        );

        const store = transaction.objectStore(STORES.QUESTIONS);
        const request = store.getAll();

        request.onsuccess = () => {
            resolve(request.result);
        };

        request.onerror = () => {
            reject(request.error);
        };
    });
}


async function getQuestionCount() {
    const db = await openDatabase();

    return new Promise((resolve, reject) => {
        const transaction = db.transaction(
            STORES.QUESTIONS,
            "readonly"
        );

        const store = transaction.objectStore(STORES.QUESTIONS);
        const request = store.count();

        request.onsuccess = () => {
            resolve(request.result);
        };

        request.onerror = () => {
            reject(request.error);
        };
    });
}


window.TestAppDB = {
    openDatabase,
    saveQuestions,
    getQuestion,
    getAllQuestions,
    getQuestionCount
};