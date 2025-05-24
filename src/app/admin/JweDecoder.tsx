'use client';

import { useState } from 'react';
import Button1 from '@/components/button/Button1';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { decodeJweToken } from './jweActions';

export default function JweDecoder() {
    const [jwe, setJwe] = useState('');
    const [decodedData, setDecodedData] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isDecoding, setIsDecoding] = useState(false);

    const handleDecode = async () => {
        try {
            setError(null);
            setIsDecoding(true);

            // Validate inputs
            if (!jwe) {
                setError('Voer een JWE token in');
                setIsDecoding(false);
                return;
            }

            // Call the server action to decode the token
            const result = await decodeJweToken(jwe);

            if (!result.success) {
                setError(result.message || 'Onbekende fout opgetreden');
                setIsDecoding(false);
                return;
            }

            setDecodedData(JSON.stringify(result.data, null, 2));
            setIsDecoding(false);
        } catch (err) {
            setError('Fout bij decoderen JWE: ' + (err instanceof Error ? err.message : String(err)));
            setIsDecoding(false);
        }
    };

    return (
        <div className="space-y-6 p-4">
            <div>
                <h1 className="text-2xl font-bold mb-4">JWE Token Decodeerder</h1>
                <p className="text-sm text-neutral-400 mb-4">
                    Decodeer JWE (JSON Web Encryption) tokens met behulp van de geheime sleutel uit omgevingsvariabelen.
                </p>
            </div>

            <div className="grid gap-4">
                <div>
                    <Label htmlFor="jweInput">JWE Token</Label>
                    <Textarea
                        id="jweInput"
                        value={jwe}
                        onChange={(e) => setJwe(e.target.value)}
                        placeholder="Plak JWE token hier..."
                        className="min-h-[100px]"
                    />
                </div>

                <Button1
                    onClick={handleDecode}
                    text={isDecoding ? 'Decoderen...' : 'Decodeer JWE'}
                    disabled={isDecoding}
                    className="w-full"
                />

                {error && (
                    <div className="p-4 bg-red-900/30 border border-red-700 rounded-md text-red-300">
                        {error === 'Voer een JWE token in'
                            ? 'Voer een JWE token in'
                            : error === 'Er is geen JWE geheim beschikbaar in de omgevingsvariabelen'
                                ? 'Er is geen JWE geheim beschikbaar in de omgevingsvariabelen'
                                : error}
                    </div>
                )}

                {decodedData && (
                    <div>
                        <Label htmlFor="resultOutput">Gedecodeerde Data</Label>
                        <Textarea
                            id="resultOutput"
                            value={decodedData}
                            readOnly
                            className="min-h-[300px] font-mono text-sm"
                        />
                    </div>
                )}
            </div>
        </div>
    );
}
