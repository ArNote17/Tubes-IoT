document.addEventListener('DOMContentLoaded', () => {
    const logoutButton = document.getElementById('logout-button');

    if (logoutButton) {
        logoutButton.addEventListener('click', async () => {
            try {
                await firebase.auth().signOut();
                window.location.href = 'Login.html';
            } catch (error) {
                console.error('Error logging out:', error);
                alert('Terjadi kesalahan saat logout. Silakan coba lagi.');
            }
        });
    }

    calculateTotalBarang();
    calculateTotalBarangMasuk();
    calculateTotalBarangKeluar();
});

async function calculateTotalBarang() {
    const laporanBarangSnapshot = await firebase.database().ref('Laporan Barang').once('value');
    const laporanBarangData = laporanBarangSnapshot.val();
    let totalBarang = 0;

    if (laporanBarangData) {
        Object.keys(laporanBarangData).forEach(kodeBarang => {
            const barang = laporanBarangData[kodeBarang];
            totalBarang += barang.totalMasuk - barang.totalKeluar;
        });
    }

    document.getElementById('total-barang').textContent = totalBarang;
}

async function calculateTotalBarangMasuk() {
    const barangMasukSnapshot = await firebase.database().ref('Barang Masuk').once('value');
    const barangMasukData = barangMasukSnapshot.val();
    let totalBarangMasuk = 0;

    if (barangMasukData) {
        Object.keys(barangMasukData).forEach(kodeBarang => {
            Object.values(barangMasukData[kodeBarang]).forEach(item => {
                totalBarangMasuk += 1;  // Count the number of entries
            });
        });
    }

    document.getElementById('barang-masuk').textContent = totalBarangMasuk;
}

async function calculateTotalBarangKeluar() {
    const barangKeluarSnapshot = await firebase.database().ref('Barang Keluar').once('value');
    const barangKeluarData = barangKeluarSnapshot.val();
    let totalBarangKeluar = 0;

    if (barangKeluarData) {
        Object.keys(barangKeluarData).forEach(kodeBarang => {
            Object.values(barangKeluarData[kodeBarang]).forEach(item => {
                totalBarangKeluar += 1;  // Count the number of entries
            });
        });
    }

    document.getElementById('barang-keluar').textContent = totalBarangKeluar;
}

function showBarangMasuk() {
    window.location.href = 'BarangMasuk.html';
}

function showBarangKeluar() {
    window.location.href = 'BarangKeluar.html';
}

function showLaporanBarang() {
    window.location.href = 'LaporanBarang.html';
}
