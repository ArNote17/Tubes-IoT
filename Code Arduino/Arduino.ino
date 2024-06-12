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

// Pin definitions for ESP32
#define RST_PIN 4
#define SS_PIN 5
#define MISO_PIN 19
#define MOSI_PIN 23
#define SCK_PIN 18

#define FIREBASE_HOST "https://tubes-iot-ecf00-default-rtdb.asia-southeast1.firebasedatabase.app/"
#define FIREBASE_AUTH "EWPplKoH9tw1OH0L9aclyG8kCn0ozoIonQeAwLRR"
#define WIFI_SSID "Gaslah"
#define WIFI_PASSWORD "allahuma12"

// Pin definitions for peripherals
int buzzer = 27; 
int ledred = 14;
int ledgreen = 12;

// LCD I2C address 0x27 and 16x2 LCD
LiquidCrystal_I2C lcd(0x27, 16, 2);

byte readCard[4];
String MasterTag = "B3F9C913";  // REPLACE this Tag ID with your Tag ID!!!
String tagID = "";

// Create instances
MFRC522 mfrc522(SS_PIN, RST_PIN);
FirebaseData firebaseData;
FirebaseAuth auth;
FirebaseConfig config;

// Define mapping for RFID tags
std::map<String, String> rfidMapping = {
    {"B3F9C913", "Barang A"},
    {"13AA1F34", "Barang B"},
    {"B3F9C915", "Barang C"},
    // Add more mappings as needed
};

void setup() 
{
  Serial.begin(9600);
  SPI.begin(SCK_PIN, MISO_PIN, MOSI_PIN, SS_PIN);
  mfrc522.PCD_Init(); // MFRC522 initialization

  pinMode(ledgreen, OUTPUT);
  pinMode(ledred, OUTPUT);
  pinMode(buzzer, OUTPUT);

  // Initialize LCD
  lcd.init(); // Use begin instead of init
  lcd.backlight();
  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print("Silahkan Scan :");

  // Connect to WiFi
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  while (WiFi.status() != WL_CONNECTED) {
    delay(1000);
    Serial.println("Connecting to WiFi...");
  }
  Serial.println("Connected to WiFi");

  // Initialize Firebase
  config.host = FIREBASE_HOST;
  config.signer.tokens.legacy_token = FIREBASE_AUTH;
  Firebase.begin(&config, &auth);
  Firebase.reconnectWiFi(true);

  // Initialize time
  configTime(0, 0, "pool.ntp.org");
  Serial.println("Setup completed.");
}

void loop() 
{
  // Wait until new tag is available
  if (getID()) 
  {  
    lcd.clear();
    lcd.setCursor(0, 0);
    lcd.print("ID: ");
    lcd.print(tagID);
    Serial.print("Scanned ID: ");
    Serial.println(tagID);

    if (tagID == MasterTag) 
    {
       digitalWrite(ledgreen, HIGH); 
       digitalWrite(ledred, LOW);
       lcd.setCursor(0, 1);
       lcd.print("Akses diberikan");

       // Buzzer pattern for access granted
       buzz(2, 100); // Two short beeps
       Serial.println("Access granted.");

       // Save to Firebase for MasterTag
       saveToFirebase(tagID, "Access granted");
    }
    else
    {
       digitalWrite(ledred, HIGH); 
       digitalWrite(ledgreen, LOW); 
       lcd.setCursor(0, 1);
       lcd.print("Akses ditolak");
       // Buzzer pattern for access denied
       digitalWrite(buzzer, HIGH);
       delay(500);
       digitalWrite(buzzer, LOW);
       Serial.println("Access denied.");

       // Save to Firebase for other tags
       saveToFirebase(tagID, "Access denied");
    }  
    delay(1000);
    digitalWrite(ledred, LOW); 
    digitalWrite(ledgreen, LOW);

    lcd.clear();
    lcd.setCursor(0, 0);
    lcd.print("Silahkan Scan :");
  }
}

boolean getID() 
{
  // Getting ready for Reading PICCs
  if (!mfrc522.PICC_IsNewCardPresent()) 
  { 
    // If a new PICC placed to RFID reader continue
    return false;
  }
  if (!mfrc522.PICC_ReadCardSerial()) 
  { 
    // Since a PICC placed get Serial and continue
    return false;
  }
  tagID = "";
  for (uint8_t i = 0; i < 4; i++) 
  { 
    // The MIFARE PICCs that we use have 4 byte UID
    tagID.concat(String(mfrc522.uid.uidByte[i], HEX)); // Adds the 4 bytes in a single String variable
  }
  tagID.toUpperCase();
  mfrc522.PICC_HaltA(); // Stop reading
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

void saveToFirebase(String id, String status)
{
  if (rfidMapping.find(id) == rfidMapping.end()) {
    Serial.println("RFID tag not recognized");
    return;
  }

  // Get the current time
  time_t now = time(nullptr);
  struct tm* p_tm = localtime(&now);

  char buffer[20];
  snprintf(buffer, sizeof(buffer), "%02d/%02d/%04d, %02d.%02d.%02d", 
           p_tm->tm_mday, p_tm->tm_mon + 1, p_tm->tm_year + 1900, 
           p_tm->tm_hour, p_tm->tm_min, p_tm->tm_sec);
  String tanggalMasuk = String(buffer);

  String path = "/Barang Masuk/" + id;
  String namaBarang = rfidMapping[id]; // Get nama barang from mapping
  int banyakBarang = 1;
  String oleh = "Admin";

  FirebaseJson json;
  json.set("/kodebarang", id);
  json.set("/namabarang", namaBarang);
  json.set("/stokbarang", banyakBarang);
  json.set("/tanggal_masuk", tanggalMasuk);
  json.set("/oleh", oleh);

  if (Firebase.pushJSON(firebaseData, path, json)) {
    Serial.println("Data saved successfully");
  } else {
    Serial.println("Failed to save data");
    Serial.println("Reason: " + firebaseData.errorReason());
  }
}
