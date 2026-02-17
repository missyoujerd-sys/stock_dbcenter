import CryptoJS from 'crypto-js';

const SECRET_KEY = import.meta.env.VITE_APP_ENCRYPTION_KEY || 'default-secret-key-please-change';

export const encryptData = (data) => {
    if (!data) return '';
    try {
        return CryptoJS.AES.encrypt(JSON.stringify(data), SECRET_KEY).toString();
    } catch (error) {
        console.error("Encryption Error:", error);
        return data;
    }
};

export const decryptData = (ciphertext) => {
    if (!ciphertext) return '';
    try {
        const bytes = CryptoJS.AES.decrypt(ciphertext, SECRET_KEY);
        const decryptedData = JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
        return decryptedData;
    } catch (error) {
        console.error("Decryption Error:", error);
        return ciphertext; // Return original if fail (e.g. not encrypted)
    }
};
