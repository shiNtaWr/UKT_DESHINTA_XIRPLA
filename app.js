const API = 'http://localhost:3000/api';

// Fungsi mengambil data dari backend
async function request(endpoint, options = {}) {
    const response = await fetch(API + endpoint, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            ...options.headers
        }
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.message || 'Terjadi kesalahan');
    }

    return data;
}

// Mengamankan teks sebelum ditampilkan ke HTML
function aman(teks) {
    return String(teks ?? '').replace(/[&<>"']/g, karakter => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    })[karakter]);
}

// Mengubah format tanggal menjadi DD/MM/YYYY
function formatTanggal(tanggal) {
    if (!tanggal) return '-';

    // Mengambil bagian tanggal tanpa mengubah zona waktu
    const nilaiTanggal = String(tanggal).substring(0, 10);
    const bagian = nilaiTanggal.split('-');

    if (bagian.length !== 3) return '-';

    const [tahun, bulan, hari] = bagian;

    if (!tahun || !bulan || !hari) return '-';

    return `${hari}/${bulan}/${tahun}`;
}

// Menampilkan pesan
function pesan(error) {
    alert(error.message || error);
}

// DASHBOARD
async function loadDashboard() {
    try {
        const data = await request('/dashboard');

        document.getElementById('total-alat').textContent =
            data.total_alat;

        document.getElementById('total-kategori').textContent =
            data.total_kategori;

        document.getElementById('sedang-dipinjam').textContent =
            data.sedang_dipinjam;

        document.getElementById('sudah-dikembalikan').textContent =
            data.sudah_dikembalikan;

    } catch (error) {
        pesan(error);
    }
}

// KATEGORI
async function loadKategori() {
    try {
        const data = await request('/kategori');

        const tabel = document.getElementById('data-kategori');

        tabel.innerHTML = data.map((item, index) => `
            <tr class="border-b">
                <td class="p-3">${index + 1}</td>
                <td class="p-3">${aman(item.nama_kategori)}</td>
                <td class="p-3">${aman(item.deskripsi)}</td>
                <td class="p-3 whitespace-nowrap">
                    <button onclick="editKategori(${item.id_kategori})"
                        class="bg-yellow-500 text-white px-3 py-2 rounded">
                        Edit
                    </button>
                    <button onclick="hapusKategori(${item.id_kategori})"
                        class="bg-red-600 text-white px-3 py-2 rounded">
                        Hapus
                    </button>
                </td>
            </tr>
        `).join('');

        if (!data.length) {
            tabel.innerHTML = `
                <tr><td colspan="4" class="p-4 text-center">
                    Belum ada kategori
                </td></tr>`;
        }

        const pilihan = document.getElementById('kategori-alat');

        pilihan.innerHTML =
            '<option value="">Pilih kategori</option>' +
            data.map(item => `
                <option value="${item.id_kategori}">
                    ${aman(item.nama_kategori)}
                </option>
            `).join('');

    } catch (error) {
        pesan(error);
    }
}

// Tambah kategori
document.getElementById('form-kategori').addEventListener('submit',
    async function(e) {
        e.preventDefault();

        try {
            await request('/kategori', {
                method: 'POST',
                body: JSON.stringify({
                    nama_kategori:
                        document.getElementById('nama-kategori').value,
                    deskripsi:
                        document.getElementById('deskripsi-kategori').value
                })
            });

            alert('Kategori berhasil ditambahkan!');
            this.reset();

            await loadKategori();
            await loadDashboard();

        } catch (error) {
            pesan(error);
        }
    }
);

// Edit kategori
async function editKategori(id) {
    try {
        const data = await request('/kategori');
        const item = data.find(k => k.id_kategori === id);

        if (!item) return;

        const nama = prompt('Nama kategori:', item.nama_kategori);
        if (nama === null) return;

        if (!nama.trim()) {
            alert('Nama kategori tidak boleh kosong');
            return;
        }

        const deskripsi = prompt('Deskripsi:', item.deskripsi || '');
        if (deskripsi === null) return;

        await request('/kategori/' + id, {
            method: 'PUT',
            body: JSON.stringify({
                nama_kategori: nama.trim(),
                deskripsi
            })
        });

        alert('Kategori berhasil diperbarui!');
        await loadKategori();

    } catch (error) {
        pesan(error);
    }
}

// Hapus kategori
async function hapusKategori(id) {
    if (!confirm('Yakin ingin menghapus kategori ini? Alat di dalamnya juga akan terhapus.')) {
        return;
    }

    try {
        await request('/kategori/' + id, {
            method: 'DELETE'
        });

        alert('Kategori berhasil dihapus!');
        await loadKategori();
        await loadAlat();
        await loadDashboard();

    } catch (error) {
        pesan(error);
    }
}
// DATA ALAT
async function loadAlat() {
    try {
        const data = await request('/alat');

        const tabel = document.getElementById('tabel-alat');

        tabel.innerHTML = data.map((item, index) => `
            <tr class="border-b">
                <td class="p-4">${index + 1}</td>
                <td class="p-4">${aman(item.nama_alat)}</td>
                <td class="p-4">${aman(item.nama_kategori)}</td>
                <td class="p-4">${item.stok}</td>
                <td class="p-4">${aman(item.kondisi)}</td>
                <td class="p-4">${aman(item.lokasi)}</td>
                <td class="p-4 whitespace-nowrap">
                    <button onclick="editAlat(${item.id_alat})"
                        class="bg-yellow-500 text-white px-3 py-2 rounded">
                        Edit
                    </button>
                    <button onclick="hapusAlat(${item.id_alat})"
                        class="bg-red-600 text-white px-3 py-2 rounded">
                        Hapus
                    </button>
                </td>
            </tr>
        `).join('');

        if (!data.length) {
            tabel.innerHTML = `
                <tr><td colspan="7" class="p-4 text-center">
                    Belum ada alat
                </td></tr>`;
        }

        const pilihan = document.getElementById('pinjam-alat');

        pilihan.innerHTML =
            '<option value="">Pilih alat</option>' +
            data.map(item => `
                <option value="${item.id_alat}" ${item.stok <= 0 ? 'disabled' : ''}>
                    ${aman(item.nama_alat)} (Stok: ${item.stok})
                </option>
            `).join('');

    } catch (error) {
        pesan(error);
    }
}

// Tambah dan edit alat
document.getElementById('form-alat').addEventListener('submit',
    async function(e) {
        e.preventDefault();

        try {
            const id = document.getElementById('id-alat').value;

            const data = {
                nama_alat: document.getElementById('nama-alat').value,
                id_kategori: Number(document.getElementById('kategori-alat').value),
                stok: Number(document.getElementById('stok-alat').value),
                kondisi: document.getElementById('kondisi-alat').value,
                lokasi: document.getElementById('lokasi-alat').value
            };

            await request(id ? '/alat/' + id : '/alat', {
                method: id ? 'PUT' : 'POST',
                body: JSON.stringify(data)
            });

            alert(id ? 'Alat berhasil diperbarui!' : 'Alat berhasil ditambahkan!');

            this.reset();
            document.getElementById('id-alat').value = '';

            await loadAlat();
            await loadDashboard();

        } catch (error) {
            pesan(error);
        }
    }
);

// Edit alat
async function editAlat(id) {
    try {
        const data = await request('/alat');
        const item = data.find(a => a.id_alat === id);

        if (!item) return;

        document.getElementById('id-alat').value = item.id_alat;
        document.getElementById('nama-alat').value = item.nama_alat;
        document.getElementById('kategori-alat').value = item.id_kategori;
        document.getElementById('stok-alat').value = item.stok;
        document.getElementById('kondisi-alat').value = item.kondisi;
        document.getElementById('lokasi-alat').value = item.lokasi || '';

        document.getElementById('form-alat').scrollIntoView({
            behavior: 'smooth'
        });

    } catch (error) {
        pesan(error);
    }
}

// Hapus alat
async function hapusAlat(id) {
    if (!confirm('Yakin ingin menghapus alat ini?')) return;

    try {
        await request('/alat/' + id, {
            method: 'DELETE'
        });

        alert('Alat berhasil dihapus!');
        await loadAlat();
        await loadDashboard();

    } catch (error) {
        pesan(error);
    }
}

// PEMINJAMAN
async function loadPeminjaman() {
    try {
        const data = await request('/peminjaman');

        const tabel = document.getElementById('tabel-peminjaman');

        tabel.innerHTML = data.map((item, index) => `
            <tr class="border-b">
                <td class="p-3">${index + 1}</td>
                <td class="p-3">${aman(item.nama_alat)}</td>
                <td class="p-3">${aman(item.nama_peminjam)}</td>
                <td class="p-3">${aman(item.kelas)}</td>
                <td class="p-3">${item.jumlah}</td>
                <td class="p-3">${aman(item.status)}</td>
                <td class="p-3">
                    ${item.status === 'Dipinjam' ? `
                        <button onclick="kembalikanAlat(${item.id_peminjaman})"
                            class="bg-green-600 text-white px-3 py-2 rounded">
                            Kembalikan
                        </button>
                    ` : '-'}
                </td>
            </tr>
        `).join('');

        if (!data.length) {
            tabel.innerHTML = `
                <tr><td colspan="7" class="p-4 text-center text-slate-400">
                    Belum ada transaksi peminjaman
                </td></tr>`;
        }

        // Riwayat seluruh transaksi
        const riwayat = document.getElementById('tabel-riwayat');

        riwayat.innerHTML = data.map((item, index) => `
            <tr class="border-b">
                <td class="p-3">${index + 1}</td>
                <td class="p-3">${aman(item.nama_alat)}</td>
                <td class="p-3">${aman(item.nama_peminjam)}</td>
                <td class="p-3">${formatTanggal(item.tanggal_pinjam)}</td>
                <td class="p-3">${formatTanggal(item.tanggal_kembali)}</td>
                <td class="p-3">${aman(item.status)}</td>
            </tr>
        `).join('');

        if (!data.length) {
            riwayat.innerHTML = `
                <tr>
                    <td colspan="6" class="p-4 text-center text-slate-400">
                        Belum ada riwayat peminjaman
                    </td>
                </tr>`;
        }

    } catch (error) {
        pesan(error);
    }
}

// Tambah peminjaman
document.getElementById('form-peminjaman').addEventListener('submit',
    async function(e) {
        e.preventDefault();

        try {
            await request('/peminjaman', {
                method: 'POST',
                body: JSON.stringify({
                    id_alat: Number(document.getElementById('pinjam-alat').value),
                    nama_peminjam: document.getElementById('nama-peminjam').value,
                    kelas: document.getElementById('kelas-peminjam').value,
                    jumlah: Number(document.getElementById('jumlah-pinjam').value),
                    tanggal_pinjam:
                        document.getElementById('tanggal-pinjam').value || null
                })
            });

            alert('Peminjaman berhasil dicatat!');
            this.reset();

            await loadAlat();
            await loadPeminjaman();
            await loadDashboard();

        } catch (error) {
            pesan(error);
        }
    }
);

// Pengembalian alat
async function kembalikanAlat(id) {
    if (!confirm('Apakah alat benar-benar sudah dikembalikan?')) return;

    try {
        await request('/peminjaman/' + id + '/kembali', {
            method: 'PUT'
        });

        alert('Alat berhasil dikembalikan!');

        await loadAlat();
        await loadPeminjaman();
        await loadDashboard();

    } catch (error) {
        pesan(error);
    }
}

// MENJALANKAN SEMUA FUNGSI
async function init() {
    await loadKategori();
    await loadAlat();
    await loadPeminjaman();
    await loadDashboard();
}

init();

// NAVIGASI AKTIF (WARNA BIRU)
const navLinks = document.querySelectorAll('.nav-link');

navLinks.forEach(link => {
    link.addEventListener('click', function () {

        // Hapus warna biru dari semua menu
        navLinks.forEach(item => {
            item.classList.remove('bg-blue-600', 'text-white');
            item.classList.add('hover:bg-slate-700');
        });

        // Berikan warna biru pada menu yang diklik
        this.classList.add('bg-blue-600', 'text-white');
        this.classList.remove('hover:bg-slate-700');
    });
});