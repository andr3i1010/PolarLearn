"use client"

import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function SettingsPage() {
    const router = useRouter()

    useEffect(() => {
        // Redirect to the account settings page by default
        router.push('/home/settings/account')
    }, [router])

    // Return an empty div instead of a skeleton loader
    return null
}
