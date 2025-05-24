'use client';

import dynamic from 'next/dynamic';

const JweDecoderComponent = dynamic(() => import('./JweDecoder'), { ssr: false });

export default function JweDecoderWrapper() {
    return <JweDecoderComponent />;
}
