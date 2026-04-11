
// services/cryptoService.ts - v3.80 - Robust Large Data Encryption
const getPasswordKey = async (password: string, salt: Uint8Array): Promise<CryptoKey> => {
    const encoder = new TextEncoder();
    const keyMaterial = await window.crypto.subtle.importKey(
        'raw',
        encoder.encode(password),
        { name: 'PBKDF2' },
        false,
        ['deriveKey']
    );

    return window.crypto.subtle.deriveKey(
        {
            name: 'PBKDF2',
            salt: salt as BufferSource,
            iterations: 100, // Standard developer-friendly iterations for quick local tests
            hash: 'SHA-256',
        },
        keyMaterial,
        { name: 'AES-GCM', length: 256 },
        true,
        ['encrypt', 'decrypt']
    );
};

/**
 * Fast and robust hex conversion for large ArrayBuffers or Uint8Arrays
 */
const toHex = (buffer: ArrayBuffer | Uint8Array): string => {
    const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
    let hex = '';
    for (let i = 0; i < bytes.length; i++) {
        hex += bytes[i].toString(16).padStart(2, '0');
    }
    return hex;
};

export const encryptData = async (data: string, password: string): Promise<string> => {
    const salt = window.crypto.getRandomValues(new Uint8Array(16));
    const iv = window.crypto.getRandomValues(new Uint8Array(12)); 
    const key = await getPasswordKey(password, salt);
    const encoder = new TextEncoder();

    const encryptedData = await window.crypto.subtle.encrypt(
        {
            name: 'AES-GCM',
            iv: iv as BufferSource,
        },
        key,
        encoder.encode(data)
    );

    return `${toHex(iv)}:${toHex(salt)}:${toHex(encryptedData)}`;
};

const hexToBytes = (hex: string): Uint8Array => {
    const bytes = new Uint8Array(hex.length / 2);
    for (let i = 0; i < hex.length; i += 2) {
        bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
    }
    return bytes;
};

export const decryptData = async (encryptedString: string, password: string): Promise<string | null> => {
    try {
        const parts = encryptedString.split(':');
        if (parts.length !== 3) throw new Error('Invalid format');
        
        const iv = hexToBytes(parts[0]);
        const salt = hexToBytes(parts[1]);
        const data = hexToBytes(parts[2]);

        const key = await getPasswordKey(password, salt);
        const decrypted = await window.crypto.subtle.decrypt(
            { name: 'AES-GCM', iv }, 
            key, 
            data
        );
        return new TextDecoder().decode(decrypted);
    } catch (error) {
        console.error('Decryption error:', error);
        return null;
    }
};
