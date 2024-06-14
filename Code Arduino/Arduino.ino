#include <LiquidCrystal_I2C.h>
#include <MFRC522.h>
#include <MFRC522Extended.h>
#include <deprecated.h>
#include <require_cpp11.h>
#include <SPI.h>
#include <Wire.h>
#include <FirebaseESP32.h>
#include <map>
#include <time.h>

// Definisi pin untuk ESP32
#define RST_PIN 4
#define SS_PIN 5
#define MISO_PIN 19
#define MOSI_PIN 23
#define SCK_PIN 18

#define FIREBASE_HOST "https://tubes-iot-ecf00-default-rtdb.asia-southeast1.firebasedatabase.app/"
#define FIREBASE_AUTH "EWPplKoH9tw1OH0L9aclyG8kCn0ozoIonQeAwLRR"
#define WIFI_SSID "Gaslah"
#define WIFI_PASSWORD "allahuma12"

// Definisi pin untuk perangkat tambahan
int buzzer = 27;
int ledred = 14;
int ledgreen = 12;
const int ledPinyellow = 2; // Pin untuk LED
const int switchPin = 10;   // Pin untuk switch
int switchState = 0;        // Variabel untuk membaca status switch

bool hasDisplayedAksesKeluar = false;
bool hasDisplayedAksesMasuk = false;
bool lastSwitchState = HIGH; // Untuk melacak perubahan status switch

// Alamat I2C LCD 0x27 dan LCD 16x2
LiquidCrystal_I2C lcd(0x27, 16, 2);

String MasterTag = "B3F9C913";  // Ganti ID Tag ini dengan ID Tag Anda!!!
String tagID = "";

// Membuat instance
MFRC522 mfrc522(SS_PIN, RST_PIN);
FirebaseData firebaseData;
FirebaseAuth auth;
FirebaseConfig config;

// Mendefinisikan pemetaan untuk tag RFID
std::map<String, String> rfidMapping = {
    {"B3F9C913", "Barang A"},
    {"13AA1F34", "Barang B"},
    {"B3F9C915", "Barang C"},
    // Tambahkan pemetaan lainnya sesuai kebutuhan
};

void setup() 
{
  Serial.begin(9600);
  SPI.begin(SCK_PIN, MISO_PIN, MOSI_PIN, SS_PIN);
  mfrc522.PCD_Init(); // Inisialisasi MFRC522

  pinMode(ledgreen, OUTPUT);
  pinMode(ledred, OUTPUT);
  pinMode(buzzer, OUTPUT);
  pinMode(ledPinyellow, OUTPUT);   // Mengatur pin LED sebagai output
  pinMode(switchPin, INPUT_PULLUP); // Mengatur pin switch sebagai input dengan pull-up internal

  // Inisialisasi LCD
  lcd.init();
  lcd.backlight();
  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print("Silahkan Scan :");

  // Koneksi ke WiFi
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  while (WiFi.status() != WL_CONNECTED) {
    delay(1000);
    Serial.println("Menghubungkan ke WiFi...");
  }
  Serial.println("Terhubung ke WiFi");

  // Inisialisasi Firebase
  config.host = FIREBASE_HOST;
  config.signer.tokens.legacy_token = FIREBASE_AUTH;
  Firebase.begin(&config, &auth);
  Firebase.reconnectWiFi(true);

  // Inisialisasi waktu
  configTime(0, 0, "pool.ntp.org");
  Serial.println("Setup selesai.");
}

void loop() 
{
  
  // Membaca status switch
  switchState = digitalRead(switchPin);

  // Cek status switch dan tampilkan pesan yang sesuai di LCD
  if (switchState != lastSwitchState) {
    lcd.clear();
    lcd.setCursor(0, 0);
    if (switchState == LOW) {
      digitalWrite(ledPinyellow, HIGH); // Menyalakan LED
      lcd.print("Scan Keluar: ");
      Serial.println("Akses Barang Keluar");
    } else {
      digitalWrite(ledPinyellow, LOW); // Mematikan LED
      lcd.print("Scan Masuk: ");
      Serial.println("Akses Barang Masuk");
    }
    lastSwitchState = switchState;
  }

  if (getID()) 
  {
    lcd.clear();
    lcd.setCursor(0, 0);
    lcd.print("ID: ");
    lcd.print(tagID);
    Serial.print("ID Yang Dipindai: ");
    Serial.println(tagID);

    if (tagID == MasterTag) 
    {
      if (switchState == LOW) 
      {
        digitalWrite(ledgreen, HIGH); 
        digitalWrite(ledred, LOW);
        lcd.setCursor(0, 1);
        lcd.print("Akses Diberikan");

        // Pola buzzer untuk akses diberikan
        buzz(2, 100); // Dua kali bunyi pendek
        Serial.println("Akses Diberikan.");

        digitalWrite(ledPinyellow, HIGH);
        saveBarangKeluar(tagID, "Akses Diberikan");
      } 
      else 
      {
        digitalWrite(ledgreen, HIGH); 
        digitalWrite(ledred, LOW);
        lcd.setCursor(0, 1);
        lcd.print("Akses Diberikan");

        // Pola buzzer untuk akses diberikan
        buzz(2, 100); // Dua kali bunyi pendek
        Serial.println("Akses Diberikan.");

        digitalWrite(ledPinyellow, LOW);
        saveBarangMasuk(tagID, "Akses Diberikan");
      }
    } 
    else 
    {
       digitalWrite(ledred, HIGH); 
       digitalWrite(ledgreen, LOW); 
       lcd.setCursor(0, 1);
       lcd.print("Akses Ditolak");
       // Pola buzzer untuk akses ditolak
       digitalWrite(buzzer, HIGH);
       delay(500);
       digitalWrite(buzzer, LOW);
       Serial.println("Akses Ditolak.");
    }
    
    delay(1000);
    digitalWrite(ledred, LOW); 
    digitalWrite(ledgreen, LOW);

    lcd.clear();
    lcd.setCursor(0, 0);
    if (switchState == LOW) {
      lcd.print("Scan Keluar: ");
    } else {
      lcd.print("Scan Masuk: ");
    }
  }

  delay(100); // Memberikan delay untuk mengurangi noise
}

boolean getID() 
{
  // Mempersiapkan untuk Membaca PICC
  if (!mfrc522.PICC_IsNewCardPresent()) 
  { 
    // Jika ada PICC baru ditempatkan pada pembaca RFID, lanjutkan
    return false;
  }
  if (!mfrc522.PICC_ReadCardSerial()) 
  { 
    // Jika ada PICC ditempatkan, dapatkan Serial dan lanjutkan
    return false;
  }
  tagID = "";
  for (uint8_t i = 0; i < 4; i++) 
  { 
    // PICC MIFARE yang kita gunakan memiliki UID 4 byte
    tagID.concat(String(mfrc522.uid.uidByte[i], HEX)); // Menambahkan 4 byte dalam satu variabel String
  }
  tagID.toUpperCase();
  mfrc522.PICC_HaltA(); // Berhenti membaca
  return true;
}

void buzz(int times, int delayMs) 
{
  for (int i = 0; i < times; i++) 
  {
    digitalWrite(buzzer, HIGH);
    delay(delayMs);
    digitalWrite(buzzer, LOW);
    delay(delayMs);
  }
}

void saveBarangMasuk(String id, String status)
{
  if (rfidMapping.find(id) == rfidMapping.end()) {
    Serial.println("Tag RFID Tidak Dikenali");
    return;
  }

  // Mendapatkan waktu saat ini
  time_t now = time(nullptr);
  struct tm* p_tm = localtime(&now);

  char buffer[20];
  snprintf(buffer, sizeof(buffer), "%02d/%02d/%04d, %02d.%02d.%02d", 
           p_tm->tm_mday, p_tm->tm_mon + 1, p_tm->tm_year + 1900, 
           p_tm->tm_hour, p_tm->tm_min, p_tm->tm_sec);
  String tanggalMasuk = String(buffer);

  String path = "/Barang Masuk/" + id;
  String namaBarang = rfidMapping[id]; // Mendapatkan nama barang dari pemetaan
  int banyakBarang = 1;
  String oleh = "Admin";

  FirebaseJson json;
  json.set("/kodebarang", id);
  json.set("/namabarang", namaBarang);
  json.set("/stokbarang", banyakBarang);
  json.set("/tanggal_masuk", tanggalMasuk);
  json.set("/oleh", oleh);

  if (Firebase.pushJSON(firebaseData, path, json)) {
    Serial.println("Data Berhasil Disimpan");
  } else {
    Serial.println("Gagal Menyimpan Data");
    Serial.println("Alasan: " + firebaseData.errorReason());
  }
}

void saveBarangKeluar(String id, String status)
{
  if (rfidMapping.find(id) == rfidMapping.end()) {
    Serial.println("Tag RFID Tidak Dikenali");
    return;
  }

  // Mendapatkan waktu saat ini
  time_t now = time(nullptr);
  struct tm* p_tm = localtime(&now);

  char buffer[20];
  snprintf(buffer, sizeof(buffer), "%02d/%02d/%04d, %02d.%02d.%02d", 
           p_tm->tm_mday, p_tm->tm_mon + 1, p_tm->tm_year + 1900, 
           p_tm->tm_hour, p_tm->tm_min, p_tm->tm_sec);
  String tanggalKeluar = String(buffer);

  String path = "/Barang Keluar/" + id;
  String namaBarang = rfidMapping[id]; // Mendapatkan nama barang dari pemetaan
  int banyakBarang = 1;
  String oleh = "Admin";

  FirebaseJson json;
  json.set("/kodebarang", id);
  json.set("/namabarang", namaBarang);
  json.set("/stokbarang", banyakBarang);
  json.set("/tanggal_keluar", tanggalKeluar);
  json.set("/oleh", oleh);

  if (Firebase.pushJSON(firebaseData, path, json)) {
    Serial.println("Data Berhasil Disimpan");
  } else {
    Serial.println("Gagal Menyimpan Data");
    Serial.println("Alasan: " + firebaseData.errorReason());
  }
}
