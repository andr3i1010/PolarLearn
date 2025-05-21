'use server';

import { compactDecrypt } from 'jose';
import crypto from 'crypto';

// This function fetches the JWE secret from environment variables
export async function getJweSecret(): Promise<{
    success: boolean;
    message: string;
    hasSecret?: boolean;
}> {
    // Get the secret from environment variables
    const secret = process.env.SECRET || '';

    // Return a masked version of the secret for security
    // This is just to confirm we have access to it
    if (secret) {
        return {
            success: true,
            message: '',
            hasSecret: true
        };
    }

    return {
        success: false,
        message: 'Geen SECRET gevonden in omgevingsvariabelen',
        hasSecret: false
    };
}

// This function will decrypt a JWE token using the secret from environment variables
export async function decodeJweToken(jweToken: string): Promise<{
    success: boolean;
    message?: string;
    data?: any;
}> {
    try {
        const envSecret = process.env.SECRET;

        if (!envSecret) {
            return {
                success: false,
                message: 'Geen SECRET gevonden in omgevingsvariabelen'
            };
        }

        if (!jweToken) {
            return {
                success: false,
                message: 'Geen JWE token opgegeven'
            };
        }

        try {
            // Derive a 256-bit key from process.env.SECRET (same as in auth library)
            const secret = crypto.createHash('sha256').update(envSecret).digest();

            // Decrypt the JWE token
            const { plaintext } = await compactDecrypt(jweToken, secret);

            // Parse the decrypted payload
            const decodedData = JSON.parse(new TextDecoder().decode(plaintext));

            return {
                success: true,
                data: decodedData
            };
        } catch (e) {
            return {
                success: false,
                message: `JWE decoderen mislukt: ${e instanceof Error ? e.message : String(e)}`
            };
        }
    } catch (error) {
        return {
            success: false,
            message: `Fout bij decoderen JWE: ${error instanceof Error ? error.message : String(error)}`
        };
    }
}
