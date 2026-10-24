const express = require('express');
const admin = require('firebase-admin');

const app = express();
app.use(express.json());

// Inisialisasi Firebase Admin menggunakan Environment Variables Vercel
if (!admin.apps.length) {
    try {
        admin.initializeApp({
            credential: admin.credential.cert({
                projectId: process.env.FIREBASE_PROJECT_ID,
                clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
                // Menangani karakter newline (\n) pada private key
                privateKey: process.env.FIREBASE_PRIVATE_KEY 
                    ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n') 
                    : undefined
            })
        });
    } catch (error) {
        console.error('Gagal menginisialisasi Firebase:', error);
    }
}

const db = admin.firestore();

// Endpoint: Ambil daftar buku dari Firestore
app.get('/api/books', async (req, res) => {
    try {
        const snapshot = await db.collection('books').get();
        const books = [];
        snapshot.forEach(doc => {
            books.push({ id: doc.id, ...doc.data() });
        });
        res.status(200).json({ success: true, data: books });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Endpoint: Tambah buku baru ke Firestore
app.post('/api/books', async (req, res) => {
    try {
        const { title, author, year } = req.body;
        if (!title || !author || !year) {
            return res.status(400).json({ success: false, error: 'Semua field wajib diisi!' });
        }

        const docRef = await db.collection('books').add({
            title,
            author,
            year: Number(year),
            createdAt: admin.firestore.FieldValue.serverTimestamp()
        });

        res.status(201).json({ success: true, id: docRef.id });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = app;