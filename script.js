"use strict";

// SecureFile Web - browser-side file encryption
const MAGIC = new TextEncoder().encode("SFILE01");
const SALT_LENGTH = 16;
const IV_LENGTH = 12;
const ITERATIONS = 600000;
const MAX_FILE_SIZE = 100 * 1024 * 1024;

const fileInput = document.getElementById("fileInput");
const dropZone = document.getElementById("dropZone");
const selectedFileBox = document.getElementById("selectedFile");
const fileNameLabel = document.getElementById("fileName");
const fileSizeLabel = document.getElementById("fileSize");
const passwordInput = document.getElementById("password");
const confirmInput = document.getElementById("confirmPassword");
const confirmField = document.getElementById("confirmField");
const encryptMode = document.getElementById("encryptMode");
const decryptMode = document.getElementById("decryptMode");
const secureForm = document.getElementById("secureForm");
const actionButton = document.getElementById("actionButton");
const actionText = document.getElementById("actionText");
const actionIcon = document.getElementById("actionIcon");
const statusBox = document.getElementById("status");
const strengthBar = document.getElementById("strengthBar");
const strengthText = document.getElementById("strengthText");
const noticeText = document.getElementById("noticeText");

let selectedFile = null;
let mode = "encrypt";
let busy = false;

// Check browser cryptography support.
if (!window.crypto || !window.crypto.subtle ||
    !window.crypto.getRandomValues) {
  showStatus(
    "Web Crypto is unavailable. Open this site on HTTPS or use localhost.",
    "error"
  );
  actionButton.disabled = true;
}

// Display file sizes in a readable format.
function formatSize(bytes) {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) {
    return (bytes / 1024).toFixed(1) + " KB";
  }
  return (bytes / (1024 * 1024)).toFixed(2) + " MB";
}

// Show success, error, or information messages.
function showStatus(message, type = "info") {
  statusBox.textContent = message;
  statusBox.className = "status " + type;
  statusBox.hidden = false;
}

function clearStatus() {
  statusBox.hidden = true;
  statusBox.textContent = "";
}

// Switch between encryption and decryption.
function setMode(nextMode) {
  if (busy) return;

  mode = nextMode;
  const encrypting = mode === "encrypt";

  encryptMode.classList.toggle("active", encrypting);
  decryptMode.classList.toggle("active", !encrypting);

  encryptMode.setAttribute("aria-pressed", String(encrypting));
  decryptMode.setAttribute("aria-pressed", String(!encrypting));

  confirmField.hidden = !encrypting;
  confirmInput.required = encrypting;

  document.getElementById("dropTitle").textContent =
    encrypting ? "Drop your file here" : "Drop an encrypted file here";

  document.getElementById("fileHint").textContent =
    encrypting
      ? "Any file type · Maximum 100 MB"
      : "Choose a SecureFile .sfile file";

  actionIcon.textContent = encrypting ? "🔒" : "🔓";
  actionText.textContent = encrypting ? "Encrypt file" : "Decrypt file";

  noticeText.textContent = encrypting
    ? "Remember your password. SecureFile cannot recover it if lost."
    : "Use the original password. A wrong password or damaged file will fail authentication.";

  fileInput.accept = encrypting ? "" : ".sfile";
  clearStatus();
  updateStrength();
}

encryptMode.addEventListener("click", () => setMode("encrypt"));
decryptMode.addEventListener("click", () => setMode("decrypt"));

// Select a file and update the interface.
function chooseFile(file) {
  if (!file || busy) return;

  if (file.size > MAX_FILE_SIZE) {
    showStatus("This file is larger than 100 MB. Choose a smaller file.", "error");
    return;
  }

  if (file.size === 0) {
    showStatus("This file is empty. Choose a non-empty file.", "error");
    return;
  }

  if (mode === "decrypt" &&
      !file.name.toLowerCase().endsWith(".sfile")) {
    showStatus("Choose an encrypted .sfile file.", "error");
    return;
  }

  selectedFile = file;
  fileNameLabel.textContent = file.name;
  fileSizeLabel.textContent = formatSize(file.size);

  selectedFileBox.hidden = false;
  dropZone.hidden = true;
  clearStatus();
}

function clearSelectedFile() {
  if (busy) return;

  selectedFile = null;
  fileInput.value = "";
  selectedFileBox.hidden = true;
  dropZone.hidden = false;
  clearStatus();
}

dropZone.addEventListener("click", () => {
  if (!busy) fileInput.click();
});

dropZone.addEventListener("keydown", (event) => {
  if (busy) return;

  if (event.key === "Enter" || event.key === " ") {
    event.preventDefault();
    fileInput.click();
  }
});

fileInput.addEventListener("change", () => {
  if (fileInput.files.length > 0) {
    chooseFile(fileInput.files[0]);
  }
});

document.getElementById("removeFile").addEventListener(
  "click", clearSelectedFile
);

// Drag-and-drop support.
["dragenter", "dragover"].forEach((eventName) => {
  dropZone.addEventListener(eventName, (event) => {
    event.preventDefault();
    if (!busy) dropZone.classList.add("drag-over");
  });
});

["dragleave", "drop"].forEach((eventName) => {
  dropZone.addEventListener(eventName, (event) => {
    event.preventDefault();
    dropZone.classList.remove("drag-over");
  });
});

dropZone.addEventListener("drop", (event) => {
  if (busy) return;
  const file = event.dataTransfer.files[0];
  if (file) chooseFile(file);
});

// Show or hide passwords.
document.querySelectorAll("[data-toggle]").forEach((button) => {
  button.addEventListener("click", () => {
    const input = document.getElementById(button.dataset.toggle);
    const showing = input.type === "text";

    input.type = showing ? "password" : "text";
    button.textContent = showing ? "Show" : "Hide";
  });
});

// Basic password-strength guidance (not a security guarantee).
function updateStrength() {
  const password = passwordInput.value;
  let score = 0;

  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
  if (/\d/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  const labels = [
    "Use at least 8 characters.",
    "Very weak",
    "Weak",
    "Fair",
    "Good",
    "Strong"
  ];

  const colors = [
    "transparent", "#ff7e8b", "#ff7e8b",
    "#ffc76b", "#69c7f0", "#60d6a4"
  ];

  strengthBar.style.width = (score * 20) + "%";
  strengthBar.style.background = colors[score];
  strengthText.textContent = password.length === 0
    ? labels[0]
    : labels[score];

  strengthText.style.color = password.length === 0
    ? ""
    : colors[score];
}

passwordInput.addEventListener("input", updateStrength);

// Derive a 256-bit encryption key from the password.
async function deriveKey(password, salt) {
  const passwordBytes = new TextEncoder().encode(password);

  const material = await crypto.subtle.importKey(
    "raw",
    passwordBytes,
    "PBKDF2",
    false,
    ["deriveKey"]
  );

  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: salt,
      iterations: ITERATIONS,
      hash: "SHA-256"
    },
    material,
    {
      name: "AES-GCM",
      length: 256
    },
    false,
    ["encrypt", "decrypt"]
  );
}

// Combine byte arrays into one binary output.
function combineBytes(...arrays) {
  const totalLength = arrays.reduce(
    (total, array) => total + array.length, 0
  );

  const result = new Uint8Array(totalLength);
  let offset = 0;

  for (const array of arrays) {
    result.set(array, offset);
    offset += array.length;
  }

  return result;
}

// Download bytes as a file.
function downloadBytes(bytes, filename) {
  const blob = new Blob([bytes], {
    type: "application/octet-stream"
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();

  // Keep the temporary download URL alive briefly.
  setTimeout(() => URL.revokeObjectURL(url), 60000);
}

// Encrypt the selected file.
async function encryptFile(file, password) {
  const data = await file.arrayBuffer();

  const salt = crypto.getRandomValues(new Uint8Array(SALT_LENGTH));
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));

  const key = await deriveKey(password, salt);

  const ciphertext = await crypto.subtle.encrypt(
    {
      name: "AES-GCM",
      iv: iv,
      tagLength: 128
    },
    key,
    data
  );

  // Format: magic header | salt | IV | ciphertext + authentication tag.
  const output = combineBytes(
    MAGIC,
    salt,
    iv,
    new Uint8Array(ciphertext)
  );

  const outputName = file.name + ".sfile";
  downloadBytes(output, outputName);

  return outputName;
}

// Decrypt a SecureFile .sfile file.
async function decryptFile(file, password) {
  const contents = new Uint8Array(await file.arrayBuffer());

  const headerLength = MAGIC.length + SALT_LENGTH + IV_LENGTH;

  if (contents.length <= headerLength) {
    throw new Error("The encrypted file is incomplete or invalid.");
  }

  // Validate the SecureFile header.
  for (let i = 0; i < MAGIC.length; i++) {
    if (contents[i] !== MAGIC[i]) {
      throw new Error("This is not a valid SecureFile encrypted file.");
    }
  }

  let offset = MAGIC.length;

  const salt = contents.slice(offset, offset + SALT_LENGTH);
  offset += SALT_LENGTH;

  const iv = contents.slice(offset, offset + IV_LENGTH);
  offset += IV_LENGTH;

  const ciphertext = contents.slice(offset);
  const key = await deriveKey(password, salt);

  let plaintext;

  try {
    plaintext = await crypto.subtle.decrypt(
      {
        name: "AES-GCM",
        iv: iv,
        tagLength: 128
      },
      key,
      ciphertext
    );
  } catch {
    throw new Error(
      "Decryption failed. Check your password or choose an undamaged file."
    );
  }

  let outputName = file.name.replace(/\.sfile$/i, "");

  if (!outputName || outputName === file.name) {
    outputName = "decrypted-file";
  }

  downloadBytes(new Uint8Array(plaintext), outputName);

  return outputName;
}

// Prevent double submissions and run the selected operation.
secureForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  if (busy) return;

  if (!window.crypto?.subtle) {
    showStatus("Web Crypto is unavailable. Use HTTPS or localhost.", "error");
    return;
  }

  if (!selectedFile) {
    showStatus("Please select a file first.", "error");
    return;
  }

  const password = passwordInput.value;

  if (password.length < 8) {
    showStatus("Use a password with at least 8 characters.", "error");
    passwordInput.focus();
    return;
  }

  if (mode === "encrypt" && password !== confirmInput.value) {
    showStatus("The passwords do not match.", "error");
    confirmInput.focus();
    return;
  }

  busy = true;
  actionButton.disabled = true;
  actionText.textContent = mode === "encrypt"
    ? "Encrypting file..."
    : "Decrypting file...";

  showStatus(
    "Processing locally. Please wait; password derivation can take a moment.",
    "info"
  );

  try {
    const outputName = mode === "encrypt"
      ? await encryptFile(selectedFile, password)
      : await decryptFile(selectedFile, password);

    showStatus(
      "Success! Your file is ready: " + outputName,
      "success"
    );
  } catch (error) {
    showStatus(
      error.message || "Something went wrong while processing the file.",
      "error"
    );
  } finally {
    busy = false;
    actionButton.disabled = false;
    actionText.textContent = mode === "encrypt"
      ? "Encrypt file"
      : "Decrypt file";
    actionIcon.textContent = mode === "encrypt" ? "🔒" : "🔓";
  }
});