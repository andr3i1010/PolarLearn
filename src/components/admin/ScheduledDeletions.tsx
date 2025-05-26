"use client"

import { useState, useEffect } from 'react'
import { prisma } from '@/utils/prisma'
import Button1 from '@/components/button/Button1'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'react-toastify'
import { Loader2 } from 'lucide-react'

// This component shows users scheduled for deletion and allows admins to manage them
export default function ScheduledDeletions() {
    const [users, setUsers] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        async function fetchUsers() {
            try {
                // This would be an API call in a real implementation
                // For demo purposes, we'll just simulate it
                const response = await fetch('/api/admin/scheduled-deletions')
                if (!response.ok) throw new Error('Failed to fetch users')

                const data = await response.json()
                setUsers(data.users || [])
            } catch (error) {
                console.error('Error fetching scheduled deletions:', error)
                toast.error('Failed to load users scheduled for deletion')
            } finally {
                setLoading(false)
            }
        }

        fetchUsers()
    }, [])

    return (
        <Card className="bg-neutral-800 text-white border-neutral-700">
            <CardHeader>
                <CardTitle>Scheduled Account Deletions</CardTitle>
                <CardDescription className="text-neutral-400">
                    Users who have requested account deletion (will be automatically deleted after the scheduled date)
                </CardDescription>
            </CardHeader>
            <CardContent>
                {loading ? (
                    <div className="flex justify-center py-8">
                        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                    </div>
                ) : users.length > 0 ? (
                    <div className="space-y-4">
                        <p>There are {users.length} users scheduled for deletion.</p>
                        <table className="w-full border-collapse">
                            <thead>
                                <tr className="border-b border-neutral-700">
                                    <th className="py-2 text-left">Username</th>
                                    <th className="py-2 text-left">Email</th>
                                    <th className="py-2 text-left">Scheduled Deletion</th>
                                    <th className="py-2 text-left">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.map((user) => (
                                    <tr key={user.id} className="border-b border-neutral-700">
                                        <td className="py-2">{user.name}</td>
                                        <td className="py-2">{user.email}</td>
                                        <td className="py-2">
                                            {new Date(user.scheduledDeletion).toLocaleDateString('en-US', {
                                                day: 'numeric',
                                                month: 'short',
                                                year: 'numeric',
                                                hour: '2-digit',
                                                minute: '2-digit'
                                            })}
                                        </td>
                                        <td className="py-2">
                                            <Button1
                                                text="Cancel Deletion"
                                                onClick={async () => {
                                                    // This would be implemented in a real system
                                                    toast.info('This would cancel the scheduled deletion')
                                                }}
                                            />
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <p className="text-center py-8 text-neutral-400">
                        No users are currently scheduled for deletion.
                    </p>
                )}
            </CardContent>
        </Card>
    )
}
