"use client"

import { AnalyticsToggle } from "@/components/analytics/AnalyticsToggle"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function PrivacySettings() {
    return (
        <div>
            <h1 className="text-3xl font-bold mb-6">Privacyinstellingen</h1>

            <Card className="mb-6 bg-neutral-800 text-white border-neutral-700">
                <CardHeader>
                    <CardTitle>Analytics</CardTitle>
                    <CardDescription className="text-neutral-400">
                        Je kunt kiezen of PolarLearn gebruik mag maken van Google Analytics om je websitegebruik te analyseren.
                        De analyses helpen ons om PolarLearn te verbeteren.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <AnalyticsToggle />
                </CardContent>
            </Card>

            <p className="text-sm text-muted-foreground mt-6">
                PolarLearn slaat alleen noodzakelijke data op voor de werking van de website.
                We verkopen geen data aan derden en gebruiken cookies alleen voor essentiële functies
                en eventueel analyse als je dat expliciet toestaat via de knop hierboven.
            </p>
        </div>
    )
}
