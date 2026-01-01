// This service uses the browser's native Web Crypto API for strong encryption.
// It's designed to be secure and run entirely on the client-side.

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
            salt: salt,
            iterations: 100000, // A common standard for iterations
            hash: 'SHA-256',
        },
        keyMaterial,
        { name: 'AES-GCM', length: 256 },
        true,
        ['encrypt', 'decrypt']
    );
};

export const encryptData = async (data: string, password: string): Promise<string> => {
    const salt = window.crypto.getRandomValues(new Uint8Array(16));
    const iv = window.crypto.getRandomValues(new Uint8Array(12)); // 96 bits is recommended for AES-GCM
    const key = await getPasswordKey(password, salt);
    const encoder = new TextEncoder();

    const encryptedData = await window.crypto.subtle.encrypt(
        {
            name: 'AES-GCM',
            iv: iv,
        },
        key,
        encoder.encode(data)
    );

    // Convert ArrayBuffers to hex strings for safe storage/transfer
    const toHex = (buffer: ArrayBuffer) => Array.from(new Uint8Array(buffer)).map(b => b.toString(16).padStart(2, '0')).join('');

    return `${toHex(iv)}:${toHex(salt)}:${toHex(encryptedData)}`;
};

// Note: The decryption part is implemented directly in the generated HTML report
// to make it self-contained and not require this service file to be present for decryption.