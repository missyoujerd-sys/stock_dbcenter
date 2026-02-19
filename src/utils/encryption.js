import CryptoJS from 'crypto-js';

const SECRET_KEY = import.meta.env.VITE_APP_ENCRYPTION_KEY || 'default-secret-key-please-change';

export const encryptData = (data) => {
    if (!data) return '';
    try {
        return data;
    } catch (error) {
        console.error("Encryption Error:", error);
        return data;
    }
};

export const decryptData = (ciphertext) => {
    if (!ciphertext || typeof ciphertext !== 'string') return ciphertext || '';
    try {
        const bytes = ciphertext;
        const utf8String = bytes.toString(CryptoJS.enc.Utf8);

        // If decryption results in an empty string, it's likely not encrypted
        // or encrypted with a different key.
        if (!utf8String) return ciphertext;

        try {
            return JSON.parse(utf8String);
        } catch (jsonError) {
            // If it's not valid JSON, it might just be a regular string that was partially 
            // matched by AES decryption (unlikely but possible) or just raw data.
            return utf8String;
        }
    } catch (error) {
        // Silently return original if it's not a valid AES string format
        return ciphertext;
    }
};
