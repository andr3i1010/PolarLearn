"use client"

import { useState, useEffect } from 'react'
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { getAnalyticsCookieValue, setAnalyticsCookie } from '@/components/analytics/AnalyticsProvider'

export function AnalyticsToggle() {
    const [analyticsEnabled, setAnalyticsEnabled] = useState(false)
    const [mounted, setMounted] = useState(false)

    // Only check cookie after mount to avoid hydration mismatch
    useEffect(() => {
        setAnalyticsEnabled(getAnalyticsCookieValue())
        setMounted(true)
    }, [])

    const handleToggleChange = (checked: boolean) => {
        setAnalyticsEnabled(checked)
        setAnalyticsCookie(checked)
    }

    if (!mounted) return null

    return (
        <div className="flex items-center space-x-4">
            <Switch
                id="analytics-toggle"
                checked={analyticsEnabled}
                onCheckedChange={handleToggleChange}
            />
            <Label htmlFor="analytics-toggle" className="text-white">
                Sta Google Analytics toe
            </Label>
        </div>
    )
}
