document.addEventListener('DOMContentLoaded', () => {
    loadLaporanBarang();

    const searchBox = document.getElementById('search-box');
    searchBox.addEventListener('input', () => {
        const query = searchBox.value.toLowerCase();
        searchLaporanBarang(query);
    });

    document.getElementById('prev').addEventListener('click', () => {
        if (currentPage > 1) {
            currentPage--;
            loadLaporanBarang();
        }
    });

    document.getElementById('next').addEventListener('click', () => {
        currentPage++;
        loadLaporanBarang();
    });
});

let currentPage = 1;
const rowsPerPage = 8;
const tableBody = document.getElementById('laporanBarangTableBody');

const loadLaporanBarang = async () => {
    const barangMasukSnapshot = await firebase.database().ref('Barang Masuk').once('value');
    const barangKeluarSnapshot = await firebase.database().ref('Barang Keluar').once('value');
    const barangMasukData = barangMasukSnapshot.val();
    const barangKeluarData = barangKeluarSnapshot.val();

    const laporanData = {};

    // Process Barang Masuk
    if (barangMasukData) {
        Object.keys(barangMasukData).forEach(kodeBarang => {
            let totalMasuk = 0;
            Object.values(barangMasukData[kodeBarang]).forEach(item => {
                totalMasuk += parseInt(item.stokbarang);
            });
            laporanData[kodeBarang] = {
                kodebarang: kodeBarang,
                namabarang: Object.values(barangMasukData[kodeBarang])[0].namabarang,
                totalMasuk: totalMasuk,
                totalKeluar: 0,
                nomorRak: generateNomorRak(kodeBarang)
            };
        });
    }

    // Process Barang Keluar
    if (barangKeluarData) {
        Object.keys(barangKeluarData).forEach(kodeBarang => {
            let totalKeluar = 0;
            Object.values(barangKeluarData[kodeBarang]).forEach(item => {
                totalKeluar += parseInt(item.stokbarang);
            });
            if (laporanData[kodeBarang]) {
                laporanData[kodeBarang].totalKeluar = totalKeluar;
            } else {
                laporanData[kodeBarang] = {
                    kodebarang: kodeBarang,
                    namabarang: Object.values(barangKeluarData[kodeBarang])[0].namabarang,
                    totalMasuk: 0,
                    totalKeluar: totalKeluar,
                    nomorRak: generateNomorRak(kodeBarang)
                };
            }
        });
    }

    // Calculate Total Barang Saat Ini and write to Laporan Barang in Firebase
    for (const kodeBarang in laporanData) {
        const totalBarangSaatIni = laporanData[kodeBarang].totalMasuk - laporanData[kodeBarang].totalKeluar;
        const laporanRef = firebase.database().ref(`Laporan Barang/${kodeBarang}`);
        await laporanRef.set({
            ...laporanData[kodeBarang],
            totalBarangSaatIni: totalBarangSaatIni
        });
    }

    displayLaporanBarang(Object.values(laporanData));
};

const displayLaporanBarang = (data) => {
    tableBody.innerHTML = '';
    const startIndex = (currentPage - 1) * rowsPerPage;
    const endIndex = startIndex + rowsPerPage;
    const paginatedData = data.slice(startIndex, endIndex);

    paginatedData.forEach((item, index) => {
        const totalBarangSaatIni = item.totalMasuk - item.totalKeluar;
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${startIndex + index + 1}</td>
            <td>${item.kodebarang}</td>
            <td>${item.namabarang}</td>
            <td>${item.totalMasuk}</td>
            <td>${item.totalKeluar}</td>
            <td>${totalBarangSaatIni}</td>
            <td>${item.nomorRak}</td>
            <td><button class="delete-button" onclick="deleteItem('${item.kodebarang}')">🗑️</button></td>
        `;
        tableBody.appendChild(row);
    });
    renderPageNumbers(data.length);
};

const searchLaporanBarang = (query) => {
    firebase.database().ref('Barang Masuk').once('value', (barangMasukSnapshot) => {
        firebase.database().ref('Barang Keluar').once('value', (barangKeluarSnapshot) => {
            const barangMasukData = barangMasukSnapshot.val();
            const barangKeluarData = barangKeluarSnapshot.val();
            const laporanData = {};

            // Process Barang Masuk
            if (barangMasukData) {
                Object.keys(barangMasukData).forEach(kodeBarang => {
                    let totalMasuk = 0;
                    Object.values(barangMasukData[kodeBarang]).forEach(item => {
                        totalMasuk += parseInt(item.stokbarang);
                    });
                    if (kodeBarang.toLowerCase().includes(query) || Object.values(barangMasukData[kodeBarang])[0].namabarang.toLowerCase().includes(query)) {
                        laporanData[kodeBarang] = {
                            kodebarang: kodeBarang,
                            namabarang: Object.values(barangMasukData[kodeBarang])[0].namabarang,
                            totalMasuk: totalMasuk,
                            totalKeluar: 0,
                            nomorRak: generateNomorRak(kodeBarang)
                        };
                    }
                });
            }

            // Process Barang Keluar
            if (barangKeluarData) {
                Object.keys(barangKeluarData).forEach(kodeBarang => {
                    let totalKeluar = 0;
                    Object.values(barangKeluarData[kodeBarang]).forEach(item => {
                        totalKeluar += parseInt(item.stokbarang);
                    });
                    if (laporanData[kodeBarang]) {
                        laporanData[kodeBarang].totalKeluar = totalKeluar;
                    } else if (kodeBarang.toLowerCase().includes(query) || Object.values(barangKeluarData[kodeBarang])[0].namabarang.toLowerCase().includes(query)) {
                        laporanData[kodeBarang] = {
                            kodebarang: kodeBarang,
                            namabarang: Object.values(barangKeluarData[kodeBarang])[0].namabarang,
                            totalMasuk: 0,
                            totalKeluar: totalKeluar,
                            nomorRak: generateNomorRak(kodeBarang)
                        };
                    }
                });
            }

            displayLaporanBarang(Object.values(laporanData));
        });
    });
};

const deleteItem = (kodeBarang) => {
    if (confirm('Apakah Anda yakin ingin menghapus item ini?')) {
        const updates = {};
        updates[`Barang Masuk/${kodeBarang}`] = null;
        updates[`Barang Keluar/${kodeBarang}`] = null;
        updates[`Laporan Barang/${kodeBarang}`] = null;
        firebase.database().ref().update(updates)
            .then(() => {
                alert('Item berhasil dihapus');
                loadLaporanBarang();
            })
            .catch(error => {
                console.error('Data gagal dihapus:', error);
            });
    }
};

const changePage = (direction) => {
    const totalItems = document.querySelectorAll('#laporanBarangTableBody tr').length;
    const totalPages = Math.ceil(totalItems / rowsPerPage);
    if (direction === -1 && currentPage > 1) {
        currentPage--;
    } else if (direction === 1 && currentPage < totalPages) {
        currentPage++;
    }
    loadLaporanBarang();
};

const renderPageNumbers = (totalItems) => {
    const totalPages = Math.ceil(totalItems / rowsPerPage);
    const pageNumbers = document.getElementById('page-numbers');
    pageNumbers.innerHTML = '';

    for (let i = 1; i <= totalPages; i++) {
        const span = document.createElement('span');
        span.textContent = i;
        span.classList.add('page-number');
        if (i === currentPage) {
            span.classList.add('active');
        }
        span.addEventListener('click', () => {
            currentPage = i;
            loadLaporanBarang();
        });
        pageNumbers.appendChild(span);
    }
};

const generateNomorRak = (kodeBarang) => {
    let nomorRak = localStorage.getItem(`nomorRak_${kodeBarang}`);
    if (!nomorRak) {
        nomorRak = Math.floor(1000 + Math.random() * 9000); // Generate a random 4-digit number
        localStorage.setItem(`nomorRak_${kodeBarang}`, nomorRak);
    }
    return nomorRak;
};
    