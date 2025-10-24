"use client"

import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function PrivacySettings() {
    return (
        <div>
            <h1 className="text-3xl font-bold mb-6">Privacyinstellingen</h1>

            <Card className="mb-6 bg-neutral-800 text-white border-neutral-700">
                <CardHeader>
                    <CardTitle>Analytics</CardTitle>
                    <CardDescription className="text-neutral-400">
                        Dit is tijdenlijk uitgeschakeld omdat ja
                    </CardDescription>
                </CardHeader>
            </Card>
        </div>
    )
}
