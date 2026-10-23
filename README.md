
# 🔐 File Encryption Tool

File Encryption Tool is a simple, browser-based application that helps users protect their files using password-based encryption and decryption. It uses modern cryptographic techniques to provide a convenient way to secure files directly in the browser.

## ✨ Features

- 🔒 **File Encryption:** Encrypt files using a password.
- 🔓 **File Decryption:** Decrypt files using the correct password.
- 🛡️ **AES-256-GCM:** Protects file confidentiality and integrity.
- 🔑 **PBKDF2 Key Derivation:** Generates a cryptographic key from a password.
- 🎲 **Random Salt and IV:** Uses fresh random values for each encryption operation.
- 📂 **File Selection:** Select files directly from your device.
- 🌐 **Local Processing:** Processes files in the browser without uploading them to an application backend.
- 📥 **Download Files:** Download encrypted and decrypted results.

## 🛠️ Technologies Used

- HTML5
- CSS3
- JavaScript
- Web Crypto API
- AES-256-GCM
- PBKDF2 with SHA-256

## ⚙️ Setup

1. Download or clone the repository.
2. Open the project folder in Visual Studio Code.
3. Ensure these files are present:

   ```text
   File-Encryption-Tool/
   ├── index.html
   ├── style.css
   └── script.js
   ```

4. Install the **Live Server** extension in VS Code.
5. Right-click `index.html` and select **Open with Live Server**.
6. Open the application in your browser.

**Requirements:** A modern browser that supports the Web Crypto API. Run the application using localhost or HTTPS.

## 🚀 Usage

1. Open the application in your browser.
2. Select the file you want to process.
3. Choose **Encrypt** or **Decrypt**.
4. Enter your password.
5. Confirm your password when encrypting, if prompted.
6. Start the operation and wait for it to finish.
7. Download the resulting file.

**Note:** Use the same password for decryption that you used during encryption. If you lose the password, the encrypted file may be unrecoverable.

## 🔐 Security and Privacy

- Use a strong, unique password.
- Keep your password private and secure.
- Store backups of important original files.
- File processing is designed to happen locally in the browser.
- This educational project has not undergone an independent security audit and should not be relied upon as the sole protection for highly sensitive information.

## 🎯 Project Objective

The objective of this project is to demonstrate practical cybersecurity concepts, including file encryption, password-based key derivation, cryptography, and secure client-side file handling.


🌐 Live Demo
Click here : https://christeenabiju-glitch.github.io/Sathtern_File_Encryption_Tool/

