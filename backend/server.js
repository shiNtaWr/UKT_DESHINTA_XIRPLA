const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Koneksi PostgreSQL
const db = new Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
});

// Tes koneksi database
db.connect()
    .then(client => {
        console.log('Database PostgreSQL berhasil terhubung!');
        client.release();
    })
    .catch(err => {
        console.error('Koneksi database gagal:', err.message);
    });

// Halaman utama API
app.get('/', (req, res) => {
    res.json({
        message: 'API Sistem Peminjaman Alat Praktik Sekolah aktif'
    });
});

// DASHBOARD
app.get('/api/dashboard', async (req, res) => {
    try {
        const alat = await db.query(
            'SELECT COUNT(*) AS total FROM alat'
        );

        const kategori = await db.query(
            'SELECT COUNT(*) AS total FROM kategori_alat'
        );

        const dipinjam = await db.query(
            "SELECT COUNT(*) AS total FROM peminjaman WHERE status = 'Dipinjam'"
        );

        const dikembalikan = await db.query(
            "SELECT COUNT(*) AS total FROM peminjaman WHERE status = 'Dikembalikan'"
        );

        res.json({
            total_alat: Number(alat.rows[0].total),
            total_kategori: Number(kategori.rows[0].total),
            sedang_dipinjam: Number(dipinjam.rows[0].total),
            sudah_dikembalikan: Number(dikembalikan.rows[0].total)
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// CRUD KATEGORI
// Menampilkan kategori
app.get('/api/kategori', async (req, res) => {
    try {
        const result = await db.query(
            'SELECT * FROM kategori_alat ORDER BY id_kategori ASC'
        );
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Menambahkan kategori
app.post('/api/kategori', async (req, res) => {
    try {
        const { nama_kategori, deskripsi } = req.body;

        const result = await db.query(
            `INSERT INTO kategori_alat (nama_kategori, deskripsi)
             VALUES ($1, $2) RETURNING *`,
            [nama_kategori, deskripsi]
        );

        res.status(201).json(result.rows[0]);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Mengedit kategori
app.put('/api/kategori/:id', async (req, res) => {
    try {
        const { nama_kategori, deskripsi } = req.body;

        const result = await db.query(
            `UPDATE kategori_alat
             SET nama_kategori = $1, deskripsi = $2
             WHERE id_kath              egori = $3 RETURNING *`,
            [nama_kategori, deskripsi, req.params.id]
        );

        if (result.rowCount === 0) {
            return res.status(404).json({
                message: 'Kategori tidak ditemukan'
            });
        }

        res.json(result.rows[0]);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Menghapus kategori
app.delete('/api/kategori/:id', async (req, res) => {
    try {
        const result = await db.query(
            'DELETE FROM kategori_alat WHERE id_kategori = $1 RETURNING *',
            [req.params.id]
        );

        if (result.rowCount === 0) {
            return res.status(404).json({
                message: 'Kategori tidak ditemukan'
            });
        }

        res.json({ message: 'Kategori berhasil dihapus' });
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// CRUD ALAT
// Menampilkan semua alat beserta kategori
app.get('/api/alat', async (req, res) => {
    try {
        const result = await db.query(`
            SELECT a.*, k.nama_kategori
            FROM alat a
            LEFT JOIN kategori_alat k
            ON a.id_kategori = k.id_kategori
            ORDER BY a.id_alat ASC
        `);

        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Menambahkan alat
app.post('/api/alat', async (req, res) => {
    try {
        const {
            id_kategori,
            nama_alat,
            kondisi,
            stok,
            lokasi
        } = req.body;

        const result = await db.query(
            `INSERT INTO alat
            (id_kategori, nama_alat, kondisi, stok, lokasi)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING *`,
            [id_kategori, nama_alat, kondisi, stok, lokasi]
        );

        res.status(201).json(result.rows[0]);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Mengedit alat
app.put('/api/alat/:id', async (req, res) => {
    try {
        const {
            id_kategori,
            nama_alat,
            kondisi,
            stok,
            lokasi
        } = req.body;

        const result = await db.query(
            `UPDATE alat
            SET id_kategori = $1,
                nama_alat = $2,
                kondisi = $3,
                stok = $4,
                lokasi = $5
            WHERE id_alat = $6
            RETURNING *`,
            [
                id_kategori,
                nama_alat,
                kondisi,
                stok,
                lokasi,
                req.params.id
            ]
        );

        if (result.rowCount === 0) {
            return res.status(404).json({
                message: 'Alat tidak ditemukan'
            });
        }

        res.json(result.rows[0]);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Menghapus alat
app.delete('/api/alat/:id', async (req, res) => {
    try {
        const result = await db.query(
            'DELETE FROM alat WHERE id_alat = $1 RETURNING *',
            [req.params.id]
        );

        if (result.rowCount === 0) {
            return res.status(404).json({
                message: 'Alat tidak ditemukan'
            });
        }

        res.json({ message: 'Alat berhasil dihapus' });
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// PEMINJAMAN
// Menampilkan data peminjaman
app.get('/api/peminjaman', async (req, res) => {
    try {
        const result = await db.query(`
            SELECT p.*, a.nama_alat
            FROM peminjaman p
            LEFT JOIN alat a ON p.id_alat = a.id_alat
            ORDER BY p.id_peminjaman DESC
        `);

        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Menambahkan peminjaman
app.post('/api/peminjaman', async (req, res) => {
    try {
        const {
            id_alat,
            nama_peminjam,
            kelas,
            tanggal_pinjam,
            jumlah
        } = req.body;

        const result = await db.query(
            `INSERT INTO peminjaman
            (id_alat, nama_peminjam, kelas, tanggal_pinjam, jumlah)
            VALUES ($1, $2, $3, COALESCE($4, CURRENT_DATE), $5)
            RETURNING *`,
            [
                id_alat,
                nama_peminjam,
                kelas,
                tanggal_pinjam || null,
                jumlah
            ]
        );

        res.status(201).json({
            message: 'Peminjaman berhasil dicatat',
            data: result.rows[0]
        });
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Mengembalikan alat
app.put('/api/peminjaman/:id/kembali', async (req, res) => {
    try {
        const result = await db.query(
            `UPDATE peminjaman
             SET status = 'Dikembalikan',
                 tanggal_kembali = CURRENT_DATE
             WHERE id_peminjaman = $1
             AND status = 'Dipinjam'
             RETURNING *`,
            [req.params.id]
        );

        if (result.rowCount === 0) {
            return res.status(404).json({
                message: 'Peminjaman tidak ditemukan atau sudah dikembalikan'
            });
        }

        res.json({
            message: 'Alat berhasil dikembalikan',
            data: result.rows[0]
        });
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// MENJALANKAN SERVER
app.listen(PORT, () => {
    console.log(`Server berjalan di http://localhost:${PORT}`);
});
