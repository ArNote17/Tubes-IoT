document.addEventListener('DOMContentLoaded', () => {
    loadPaginatedData();

    var date = new Date();
    var dateString = date.toLocaleString("id-ID", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit"
    });
    document.querySelector('input[data-input="tanggal keluar"]').value = dateString;

    const kirimKeluar = document.querySelector(`[data-button="kirim keluar"]`);
    kirimKeluar.onclick = async (e) => {
        e.preventDefault();

        const kodebarangKeluar = document.querySelector(`[data-input="kode barang"]`).value;
        const namabarangKeluar = document.querySelector(`[data-input="nama barang"]`).value;
        const stokbarangKeluar = document.querySelector(`[data-input="stok barang"]`).value;
        const tanggalkeluar = document.querySelector(`[data-input="tanggal keluar"]`).value;
        const oleh = document.querySelector(`[data-input="oleh"]`).value;

        try {
            const snapshot = await firebase.database().ref(`Barang Masuk/${kodebarangKeluar}`).once('value');
            if (snapshot.exists() && snapshot.child(Object.keys(snapshot.val())[0]).val().namabarang === namabarangKeluar) {
                const nomorUnik = firebase.database().ref('Barang Keluar').child(kodebarangKeluar).push().key;
                await firebase.database().ref(`Barang Keluar/${kodebarangKeluar}/${nomorUnik}`).set({
                    kodebarang: kodebarangKeluar,
                    namabarang: namabarangKeluar,
                    stokbarang: stokbarangKeluar,
                    tanggal_keluar: tanggalkeluar,
                    oleh: oleh
                });
                alert('Data barang keluar berhasil disimpan!');
                document.querySelector(`[data-input="kode barang"]`).value = '';
                document.querySelector(`[data-input="nama barang"]`).value = '';
                document.querySelector(`[data-input="stok barang"]`).value = '';
                document.querySelector(`[data-input="tanggal keluar"]`).value = dateString;
                document.querySelector(`[data-input="oleh"]`).value = '';
                loadPaginatedData(); // Reload data after adding new entry
            } else {
                alert('Kode barang atau nama barang tidak cocok dengan data yang ada di database.');
            }
        } catch (error) {
            console.error('Data barang keluar gagal disimpan:', error);
        }
    };

    const searchBox = document.getElementById('search-box');
    searchBox.addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase();
        firebase.database().ref('Barang Keluar').once('value', (snapshot) => {
            const data = snapshot.val();
            if (data) {
                const dataArray = [];
                Object.keys(data).forEach(kode => {
                    Object.keys(data[kode]).forEach(subKey => {
                        const item = data[kode][subKey];
                        item.path = `Barang Keluar/${kode}/${subKey}`;
                        if (
                            item.kodebarang.toLowerCase().includes(query) ||
                            item.namabarang.toLowerCase().includes(query) ||
                            item.oleh.toLowerCase().includes(query)
                        ) {
                            dataArray.push({
                                key: subKey,
                                val: () => item
                            });
                        }
                    });
                });
                renderPaginatedData(dataArray);
            } else {
                tableBody.innerHTML = '';
            }
        });
    });
});

const tableBody = document.getElementById('barangKeluarTableBody');

// Function to render data into table
const renderData = (data) => {
    let html = '';
    let count = 1;

    data.forEach((item) => {
        const { kodebarang, namabarang, stokbarang, tanggal_keluar, oleh, path } = item.val();
        html += `
            <tr>
                <td>${count}</td>
                <td>${kodebarang}</td>
                <td>${namabarang}</td>
                <td>${stokbarang}</td>
                <td>${tanggal_keluar}</td>
                <td>${oleh}</td>
                <td>
                    <button class="edit-button" onclick="editItem('${path}')">✏️</button>
                    <button class="delete-button" onclick="deleteItem('${path}')">🗑️</button>
                </td>
            </tr>
        `;
        count++;
    });

    tableBody.innerHTML = html;
};

// Function to load data from Firebase and render into table
const loadData = () => {
    firebase.database().ref('Barang Keluar').once('value', (snapshot) => {
        const data = snapshot.val();
        if (data) {
            const dataArray = [];
            Object.keys(data).forEach(kode => {
                Object.keys(data[kode]).forEach(subKey => {
                    const item = data[kode][subKey];
                    item.path = `Barang Keluar/${kode}/${subKey}`;
                    dataArray.push({
                        key: subKey,
                        val: () => item
                    });
                });
            });
            renderPaginatedData(dataArray);
        } else {
            tableBody.innerHTML = '';
        }
    });
};

// Function to delete an item
const deleteItem = (path) => {
    if (confirm('Apakah Anda yakin ingin menghapus item ini?')) {
        firebase.database().ref(path).remove().then(() => {
            alert('Item berhasil dihapus');
            loadPaginatedData(); // Reload data after deletion
        }).catch(error => {
            console.error('Data gagal dihapus:', error);
        });
    }
};

const editItem = (path) => {
    firebase.database().ref(path).once('value', (snapshot) => {
        const data = snapshot.val();
        document.querySelector(`[data-input="kode barang"]`).value = data.kodebarang;
        document.querySelector(`[data-input="nama barang"]`).value = data.namabarang;
        document.querySelector(`[data-input="stok barang"]`).value = data.stokbarang;
        document.querySelector(`[data-input="tanggal keluar"]`).value = data.tanggal_keluar;
        document.querySelector(`[data-input="oleh"]`).value = data.oleh;
        
        const kirimKeluar = document.querySelector(`[data-button="kirim keluar"]`);
        kirimKeluar.onclick = (e) => {
            e.preventDefault();
            const updatedData = {
                kodebarang: document.querySelector(`[data-input="kode barang"]`).value,
                namabarang: document.querySelector(`[data-input="nama barang"]`).value,
                stokbarang: document.querySelector(`[data-input="stok barang"]`).value,
                tanggal_keluar: document.querySelector(`[data-input="tanggal keluar"]`).value,
                oleh: document.querySelector(`[data-input="oleh"]`).value
            };
            firebase.database().ref(path).update(updatedData, (error) => {
                if (error) {
                    console.error('Data barang keluar gagal diupdate:', error);
                } else {
                    console.log('Data barang keluar berhasil diupdate!');
                    alert('Data barang keluar berhasil diupdate!');
                    loadPaginatedData(); // Reload data after updating entry
                }
            });
        };
    });
};

function showAddForm() {
    const addForm = document.getElementById('add-form');
    addForm.style.display = addForm.style.display === 'none' ? 'block' : 'none';
}

// Pagination
let currentPage = 1;
const rowsPerPage = 8;

document.getElementById('prev').addEventListener('click', () => {
    if (currentPage > 1) {
        currentPage--;
        loadPaginatedData();
    }
});

document.getElementById('next').addEventListener('click', () => {
    currentPage++;
    loadPaginatedData();
});

const renderPaginatedData = (data) => {
    let html = '';
    let count = (currentPage - 1) * rowsPerPage + 1;
    const start = (currentPage - 1) * rowsPerPage;
    const end = start + rowsPerPage;

    data.slice(start, end).forEach((item) => {
        const { kodebarang, namabarang, stokbarang, tanggal_keluar, oleh, path } = item.val();
        html += `
            <tr>
                <td>${count}</td>
                <td>${kodebarang}</td>
                <td>${namabarang}</td>
                <td>${stokbarang}</td>
                <td>${tanggal_keluar}</td>
                <td>${oleh}</td>
                <td>
                    <button class="edit-button" onclick="editItem('${path}')">✏️</button>
                    <button class="delete-button" onclick="deleteItem('${path}')">🗑️</button>
                </td>
            </tr>
        `;
        count++;
    });

    tableBody.innerHTML = html;

    // Render page numbers
    const totalPages = Math.ceil(data.length / rowsPerPage);
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
            loadPaginatedData();
        });
        pageNumbers.appendChild(span);
    }
};

const loadPaginatedData = () => {
    firebase.database().ref('Barang Keluar').once('value', (snapshot) => {
        const data = snapshot.val();
        if (data) {
            const dataArray = [];
            Object.keys(data).forEach(kode => {
                Object.keys(data[kode]).forEach(subKey => {
                    const item = data[kode][subKey];
                    item.path = `Barang Keluar/${kode}/${subKey}`;
                    dataArray.push({
                        key: subKey,
                        val: () => item
                    });
                });
            });
            renderPaginatedData(dataArray);
        } else {
            tableBody.innerHTML = '';
        }
    });
};

document.addEventListener('DOMContentLoaded', () => {
    loadPaginatedData();
});
