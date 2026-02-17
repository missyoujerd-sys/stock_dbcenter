import CryptoJS from 'crypto-js';

const SECRET_KEY = process.env.REACT_APP_ENCRYPTION_KEY;

if (!SECRET_KEY) {
    console.warn('Encryption key is missing! Data will not be properly secured.');
}

export const encryptData = (data) => {
    if (!data) return null;
    try {
        const jsonString = JSON.stringify(data);
        return CryptoJS.AES.encrypt(jsonString, SECRET_KEY).toString();
    } catch (error) {
        console.error('Encryption failed:', error);
        return null;
    }
};

export const decryptData = (ciphertext) => {
    if (!ciphertext) return null;
    try {
        const bytes = CryptoJS.AES.decrypt(ciphertext, SECRET_KEY);
        const decryptedString = bytes.toString(CryptoJS.enc.Utf8);
        return JSON.parse(decryptedString);
    } catch (error) {
        console.error('Decryption failed:', error);
        return null;
    }
};
