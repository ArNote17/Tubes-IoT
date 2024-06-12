const container = document.querySelector(".container");

firebase.auth().onAuthStateChanged((user) => {
    if (user) {
        Dashboard(user);
    } else {
        Landing();
    }
});

const Landing = () => {
    container.innerHTML = (`
        <div class="left">
            <div class="background-container">
                <img src="images/Login.jpg" alt="Warehouse" class="background-image">
                <div class="background-overlay"></div>
            </div>
            <div class="welcome-message">
                <img src="images/klipartz.com.png" alt="Logo" class="logo">
                <h2>Selamat datang di SmartLogix</h2>
                <p>Sistem Pendataan Barang</p>
            </div>
        </div>
        <div class="right">
            <h2>Login Inventory!</h2>
            <form id="login-form">
                <div class="input-group">
                    <input type="email" id="email" placeholder=".....@smartlogix.com" required>
                </div>
                <div class="input-group">
                    <input type="password" id="password" placeholder="......" required>
                </div>
                <button type="submit" class="login-button">Login</button>
                <a href="#" class="forgot-password" id="forgot-password">Lupa Kata Sandi?</a>
            </form>
        </div>
    </div>

    <div class="popup" id="forgot-password-popup">
        <div class="popup-content">
            <span class="close-button" id="close-popup">&times;</span>
            <h2>Lupa Kata Sandi</h2>
            <p>Masukkan email Anda yang terdaftar di sistem dan kami akan mengirimkan posmail untuk reset kata sandi Anda.</p>
            <input type="email" placeholder="Masukkan email Anda" required>
            <button class="reset-button">Reset</button>
        </div>
    </div>
    
    `);

    document.getElementById('login-form').addEventListener('submit', async (e) => {
        e.preventDefault();

        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;

        try {
            await firebase.auth().signInWithEmailAndPassword(email, password);
            window.location.href = 'Dashboard.html';
        } catch (error) {
            alert('Email atau password salah');
        }
    });

    document.getElementById('forgot-password').addEventListener('click', (e) => {
        e.preventDefault();
        document.getElementById('forgot-password-popup').style.display = 'flex';
    });

    document.getElementById('close-popup').addEventListener('click', () => {
        document.getElementById('forgot-password-popup').style.display = 'none';
    });

    window.addEventListener('click', (e) => {
        if (e.target === document.getElementById('forgot-password-popup')) {
            document.getElementById('forgot-password-popup').style.display = 'none';
        }
    });

    document.querySelector('.reset-button').addEventListener('click', async (e) => {
        e.preventDefault();
        const resetEmail = document.querySelector('#forgot-password-popup input[type="email"]').value;
    
        try {
            await firebase.auth().sendPasswordResetEmail(resetEmail);
            alert(`Email untuk reset kata sandi telah dikirim ke ${resetEmail}`);
            document.getElementById('forgot-password-popup').style.display = 'none';
        } catch (error) {
            alert(`Terjadi kesalahan, email ${resetEmail} tidak ditemukan`);
        }
    });
    

}

const Dashboard = (user) => {
    const element = document.createElement("div");
    element.innerHTML = (`
        <h2>Selamat datang di Dashboard</h2>
        <p>Anda telah berhasil login</p>
    `);

    container.innerHTML = "";
    container.appendChild(element);
}

document.addEventListener('DOMContentLoaded', () => {
    if (!firebase.auth().currentUser) {
        Landing();
    }
});
