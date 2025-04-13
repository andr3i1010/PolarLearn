"use client";
import { useEffect, useState } from 'react';

export default function PwaDebugger() {
    const [debug, setDebug] = useState<Record<string, any>>({});
    const [showDebug, setShowDebug] = useState(false);

    useEffect(() => {
        // Only run in browser
        if (typeof window === 'undefined') return;

        const checkPwaStatus = async () => {
            try {
                const status: Record<string, any> = {
                    serviceWorker: 'ServiceWorker' in navigator,
                    serviceWorkerRegistered: false,
                    manifestDetected: !!document.querySelector('link[rel="manifest"]'),
                    manifestContent: null,
                    icons: [],
                    displayMode: window.matchMedia('(display-mode: standalone)').matches ? 'standalone' : 'browser',
                    installable: false,
                    https: window.location.protocol === 'https:' || window.location.hostname === 'localhost',
                };

                // Check for existing service worker registrations
                if (navigator.serviceWorker) {
                    const registrations = await navigator.serviceWorker.getRegistrations();
                    status.serviceWorkerRegistered = registrations.length > 0;
                    status.serviceWorkerRegistrations = registrations.map(r => ({
                        scope: r.scope,
                        active: !!r.active,
                        installing: !!r.installing,
                        waiting: !!r.waiting,
                    }));
                }

                // Check manifest
                const manifestLink = document.querySelector('link[rel="manifest"]');
                if (manifestLink?.getAttribute('href')) {
                    try {
                        const manifestResponse = await fetch(manifestLink.getAttribute('href') || '');
                        if (manifestResponse.ok) {
                            const manifest = await manifestResponse.json();
                            status.manifestContent = manifest;

                            // Check for icons
                            if (manifest.icons && Array.isArray(manifest.icons)) {
                                status.icons = manifest.icons;
                                // Try to load each icon
                                for (const icon of manifest.icons) {
                                    try {
                                        const iconResponse = await fetch(icon.src);
                                        icon.exists = iconResponse.ok;
                                        icon.status = iconResponse.status;
                                    } catch (e) {
                                        icon.exists = false;
                                        icon.error = e instanceof Error ? e.message : String(e);
                                    }
                                }
                            }

                            // Basic installability check
                            status.installable =
                                !!manifest.name &&
                                !!manifest.display &&
                                (manifest.display === 'standalone' || manifest.display === 'fullscreen' || manifest.display === 'minimal-ui') &&
                                !!manifest.start_url &&
                                Array.isArray(manifest.icons) &&
                                manifest.icons.some((i: { sizes: string; }) => i.sizes === '192x192') &&
                                manifest.icons.some((i: { sizes: string; }) => i.sizes === '512x512') &&
                                status.serviceWorkerRegistered &&
                                status.https;
                        } else {
                            status.manifestError = `HTTP ${manifestResponse.status}: ${manifestResponse.statusText}`;
                        }
                    } catch (e) {
                        status.manifestError = e instanceof Error ? e.message : String(e);
                    }
                }

                setDebug(status);
            } catch (err) {
                console.error('Error checking PWA status:', err);
                setDebug({ error: err instanceof Error ? err.message : String(err) });
            }
        };

        checkPwaStatus();
    }, []);

    if (!showDebug) {
        return (
            <button
                onClick={() => setShowDebug(true)}
                className="fixed bottom-4 left-4 z-50 bg-gray-800 text-white px-3 py-1 rounded text-sm"
            >
                PWA Debug
            </button>
        );
    }

    return (
        <div className="fixed bottom-0 left-0 z-50 bg-black/90 text-white p-4 max-h-[80vh] overflow-auto w-full md:w-[500px]">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold">PWA Debug Info</h3>
                <button onClick={() => setShowDebug(false)} className="text-white">✕</button>
            </div>

            <div className="space-y-2">
                <div className="flex justify-between">
                    <span>Installable:</span>
                    <span className={debug.installable ? "text-green-500" : "text-red-500"}>
                        {debug.installable ? "Yes ✓" : "No ✗"}
                    </span>
                </div>

                <div className="flex justify-between">
                    <span>HTTPS:</span>
                    <span className={debug.https ? "text-green-500" : "text-red-500"}>
                        {debug.https ? "Yes ✓" : "No ✗"}
                    </span>
                </div>

                <div className="flex justify-between">
                    <span>Service Worker API:</span>
                    <span className={debug.serviceWorker ? "text-green-500" : "text-red-500"}>
                        {debug.serviceWorker ? "Available ✓" : "Not Available ✗"}
                    </span>
                </div>

                <div className="flex justify-between">
                    <span>Service Worker Registered:</span>
                    <span className={debug.serviceWorkerRegistered ? "text-green-500" : "text-red-500"}>
                        {debug.serviceWorkerRegistered ? "Yes ✓" : "No ✗"}
                    </span>
                </div>

                <div className="flex justify-between">
                    <span>Manifest Detected:</span>
                    <span className={debug.manifestDetected ? "text-green-500" : "text-red-500"}>
                        {debug.manifestDetected ? "Yes ✓" : "No ✗"}
                    </span>
                </div>

                <div className="flex justify-between">
                    <span>Display Mode:</span>
                    <span>{debug.displayMode}</span>
                </div>
            </div>

            {debug.icons && debug.icons.length > 0 && (
                <div className="mt-4">
                    <h4 className="font-bold mb-2">Icons:</h4>
                    <div className="space-y-2">
                        {debug.icons.map((icon: any, i: number) => (
                            <div key={i} className="flex items-center">
                                <span className={icon.exists ? "text-green-500" : "text-red-500"}>
                                    {icon.exists ? "✓" : "✗"}
                                </span>
                                <span className="ml-2">{icon.src} ({icon.sizes})</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {debug.manifestError && (
                <div className="mt-4 text-red-500">
                    <h4 className="font-bold">Manifest Error:</h4>
                    <p>{debug.manifestError}</p>
                </div>
            )}

            {debug.serviceWorkerRegistrations && (
                <div className="mt-4">
                    <h4 className="font-bold mb-2">Service Worker Registrations:</h4>
                    <div className="space-y-2">
                        {debug.serviceWorkerRegistrations.map((reg: any, i: number) => (
                            <div key={i} className="text-sm">
                                <div>Scope: {reg.scope}</div>
                                <div>Status: {reg.active ? "Active" : reg.installing ? "Installing" : reg.waiting ? "Waiting" : "Unknown"}</div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <div className="mt-4">
                <button onClick={() => window.location.reload()} className="bg-blue-600 text-white px-3 py-1 rounded mr-2">
                    Refresh Page
                </button>
                <button onClick={() => setShowDebug(false)} className="bg-gray-600 text-white px-3 py-1 rounded">
                    Close
                </button>
            </div>
        </div>
    );
}
