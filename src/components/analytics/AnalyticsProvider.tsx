"use client"

import { useEffect, useState } from 'react'
import { GoogleAnalytics } from '@next/third-parties/google'

const ANALYTICS_COOKIE_NAME = "polarlearn.enable-analytics"
// is dit niet prive??
const ANALYTICS_ID = "G-C17NNNRTEM" 

export function AnalyticsProvider() {
    const [analyticsEnabled, setAnalyticsEnabled] = useState(false)

    useEffect(() => {
        // Check for the analytics cookie
        const cookies = document.cookie.split(';')
        const analyticsCookie = cookies
            .find(cookie => cookie.trim().startsWith(`${ANALYTICS_COOKIE_NAME}=`))
            ?.split('=')[1]

        setAnalyticsEnabled(analyticsCookie === 'true')

    }, [])

    return analyticsEnabled ? <GoogleAnalytics gaId={ANALYTICS_ID} /> : null
}

// Helper function to set the analytics cookie
export function setAnalyticsCookie(enabled: boolean) {
    const expiryDate = new Date()
    expiryDate.setFullYear(expiryDate.getFullYear() + 1) // Cookie expires in 1 year

    document.cookie = `${ANALYTICS_COOKIE_NAME}=${enabled}; expires=${expiryDate.toUTCString()}; path=/; SameSite=Lax`

    // Force a page reload to apply the analytics change
    // This ensures the GoogleAnalytics component is properly mounted/unmounted
    window.location.reload()
}

// Helper function to get the analytics cookie value
export function getAnalyticsCookieValue(): boolean {
    if (typeof document === 'undefined') return false  // Server-side check

    const cookies = document.cookie.split(';')
    const analyticsCookie = cookies
        .find(cookie => cookie.trim().startsWith(`${ANALYTICS_COOKIE_NAME}=`))
        ?.split('=')[1]

    return analyticsCookie === 'true'
}

// Next.js third-parties handles the typings for Google Analytics
// so we don't need to add our own window declarations
