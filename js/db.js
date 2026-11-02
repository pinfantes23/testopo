
const DB_NAME = "test-app-db";
const DB_VERSION = 3;

const STORES = {
    QUESTIONS: "questions",
    EXAMS: "exams",
    ANSWERS: "answers",
    FAILED: "failed",
    STATISTICS: "statistics",
    SETTINGS: "settings",
    FLASHCARDS: "flashcards"
};


/* =========================================================
   APERTURA Y ACTUALIZACIÓN DE LA BASE DE DATOS
   ========================================================= */

function openDatabase() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onupgradeneeded = (event) => {
            const db = event.target.result;

            // PREGUNTAS
            if (!db.objectStoreNames.contains(STORES.QUESTIONS)) {
                const store = db.createObjectStore(STORES.QUESTIONS, {
                    keyPath: "id"
                });

                store.createIndex("tema", "tema", {
                    unique: false
                });

                store.createIndex("numero", "numero", {
                    unique: false
                });
            }

            // EXÁMENES
            if (!db.objectStoreNames.contains(STORES.EXAMS)) {
                db.createObjectStore(STORES.EXAMS, {
                    keyPath: "id"
                });
            }

            // RESPUESTAS
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

            // PREGUNTAS FALLADAS
            if (!db.objectStoreNames.contains(STORES.FAILED)) {
                db.createObjectStore(STORES.FAILED, {
                    keyPath: "questionId"
                });
            }

            // ESTADÍSTICAS
            if (!db.objectStoreNames.contains(STORES.STATISTICS)) {
                db.createObjectStore(STORES.STATISTICS, {
                    keyPath: "id"
                });
            }

            // AJUSTES
            if (!db.objectStoreNames.contains(STORES.SETTINGS)) {
                db.createObjectStore(STORES.SETTINGS, {
                    keyPath: "id"
                });
            }

            // FLASHCARDS
            if (!db.objectStoreNames.contains(STORES.FLASHCARDS)) {
                const store = db.createObjectStore(STORES.FLASHCARDS, {
                    keyPath: "id",
                    autoIncrement: true
                });

                store.createIndex("tema", "tema", {
                    unique: false
                });
            }
        };

        request.onsuccess = () => {
            const db = request.result;

            db.onversionchange = () => {
                db.close();
            };

            resolve(db);
        };

        request.onerror = () => {
            reject(request.error);
        };

        request.onblocked = () => {
            console.warn(
                "La actualización de la base de datos está bloqueada. Cierra otras pestañas de la aplicación."
            );
        };
    });
}


/* =========================================================
   PREGUNTAS
   ========================================================= */

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
            db.close();
            resolve();
        };

        transaction.onerror = () => {
            db.close();
            reject(transaction.error);
        };

        transaction.onabort = () => {
            db.close();
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

        const request = transaction
            .objectStore(STORES.QUESTIONS)
            .get(id);

        request.onsuccess = () => {
            resolve(request.result);
        };

        request.onerror = () => {
            reject(request.error);
        };

        transaction.oncomplete = () => {
            db.close();
        };

        transaction.onerror = () => {
            db.close();
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

        const request = transaction
            .objectStore(STORES.QUESTIONS)
            .getAll();

        request.onsuccess = () => {
            resolve(request.result);
        };

        request.onerror = () => {
            reject(request.error);
        };

        transaction.oncomplete = () => {
            db.close();
        };

        transaction.onerror = () => {
            db.close();
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

        const request = transaction
            .objectStore(STORES.QUESTIONS)
            .count();

        request.onsuccess = () => {
            resolve(request.result);
        };

        request.onerror = () => {
            reject(request.error);
        };

        transaction.oncomplete = () => {
            db.close();
        };

        transaction.onerror = () => {
            db.close();
        };
    });
}


/* =========================================================
   FLASHCARDS
   ========================================================= */

// Guardar una nueva flashcard
async function saveFlashcard(flashcard) {
    const db = await openDatabase();

    return new Promise((resolve, reject) => {
        const transaction = db.transaction(
            STORES.FLASHCARDS,
            "readwrite"
        );

        const store = transaction.objectStore(
            STORES.FLASHCARDS
        );

        const registro = {
            tema: Number(flashcard.tema),
            parteA: String(flashcard.parteA || ""),
            parteB: String(flashcard.parteB || "")
        };

        const request = store.add(registro);

        request.onsuccess = () => {
            registro.id = request.result;
        };

        transaction.oncomplete = () => {
            db.close();
            resolve(registro);
        };

        transaction.onerror = () => {
            db.close();
            reject(transaction.error);
        };

        transaction.onabort = () => {
            db.close();
            reject(transaction.error);
        };
    });
}


// Obtener todas las flashcards
async function getAllFlashcards() {
    const db = await openDatabase();

    return new Promise((resolve, reject) => {
        const transaction = db.transaction(
            STORES.FLASHCARDS,
            "readonly"
        );

        const request = transaction
            .objectStore(STORES.FLASHCARDS)
            .getAll();

        request.onsuccess = () => {
            resolve(request.result || []);
        };

        request.onerror = () => {
            reject(request.error);
        };

        transaction.oncomplete = () => {
            db.close();
        };

        transaction.onerror = () => {
            db.close();
        };
    });
}


// Obtener flashcards de un tema concreto
async function getFlashcardsByTema(tema) {
    const tarjetas = await getAllFlashcards();

    return tarjetas.filter(tarjeta => {
        return Number(tarjeta.tema) === Number(tema);
    });
}


// Eliminar una flashcard
async function deleteFlashcard(id) {
    const db = await openDatabase();

    return new Promise((resolve, reject) => {
        const transaction = db.transaction(
            STORES.FLASHCARDS,
            "readwrite"
        );

        transaction.objectStore(
            STORES.FLASHCARDS
        ).delete(Number(id));

        transaction.oncomplete = () => {
            db.close();
            resolve();
        };

        transaction.onerror = () => {
            db.close();
            reject(transaction.error);
        };

        transaction.onabort = () => {
            db.close();
            reject(transaction.error);
        };
    });
}


/* =========================================================
   API PÚBLICA
   ========================================================= */

window.TestAppDB = {
    openDatabase,

    // Preguntas
    saveQuestions,
    getQuestion,
    getAllQuestions,
    getQuestionCount,

    // Flashcards
    saveFlashcard,
    getAllFlashcards,
    getFlashcardsByTema,
    deleteFlashcard
};
