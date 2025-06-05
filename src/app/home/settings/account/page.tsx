"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, Eye, EyeOff, AlertTriangle, Trash } from "lucide-react"
import { toast } from 'react-toastify'
import Button1 from "@/components/button/Button1"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import {
    updateUserProfile,
    updateUserPassword,
    initiateAccountDeletion,
    getUserPreferences
} from '@/serverActions/accountSettings'
import { cancelAccountDeletion } from '@/serverActions/cancelDeletion'

export default function AccountSettings() {
    const [loading, setLoading] = useState(false)
    const [passwordLoading, setPasswordLoading] = useState(false)
    const [userData, setUserData] = useState<{
        username: string | null;
        email: string | null;
        scheduledDeletion?: Date | null;
    }>({
        username: '',
        email: '',
        scheduledDeletion: null
    })
    const [isLoading, setIsLoading] = useState(true)
    const [showCurrentPassword, setShowCurrentPassword] = useState(false)
    const [showNewPassword, setShowNewPassword] = useState(false)
    const [showConfirmPassword, setShowConfirmPassword] = useState(false)
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
    const [deleteLoading, setDeleteLoading] = useState(false)

    // Load user data
    useEffect(() => {
        async function loadUserData() {
            try {
                const data = await getUserPreferences()
                if (data) {
                    setUserData(data)
                }
            } catch (error) {
                console.error("Failed to load user data:", error)
                toast.error("Kon gebruikersgegevens niet laden")
            } finally {
                setIsLoading(false)
            }
        }

        loadUserData()
    }, [])

    const handleSaveChanges = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault()
        setLoading(true)

        try {
            const formData = new FormData(event.currentTarget)
            const result = await updateUserProfile(formData)

            if (result.success) {
                toast.success(result.message)
            } else {
                toast.error(result.message)
            }
        } catch (err) {
            toast.error('Er is een fout opgetreden bij het opslaan van je wijzigingen.')
        } finally {
            setLoading(false)
        }
    }

    const handleDeleteAccount = async () => {
        setDeleteDialogOpen(false)
        setDeleteLoading(true)

        try {
            const result = await initiateAccountDeletion()

            if (result.success) {
                toast.success(result.message)
                // Optionally, redirect the user or perform other actions
            } else {
                toast.error(result.message)
            }
        } catch (err) {
            toast.error('Er is een fout opgetreden bij het verwijderen van je account.')
        } finally {
            setDeleteLoading(false)
        }
    }

    return (
        <div>
            <h1 className="text-3xl font-bold mb-6">Accountinstellingen</h1>

            <form onSubmit={handleSaveChanges}>
                <Card className="mb-6 bg-neutral-800 text-white border-neutral-700">
                    <CardHeader>
                        <CardTitle>Persoonlijke informatie</CardTitle>
                        <CardDescription className="text-neutral-400">
                            Update je persoonlijke gegevens en hoe je account wordt weergegeven.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="username">Gebruikersnaam</Label>
                            <Input
                                id="username"
                                name="username"
                                placeholder="Je gebruikersnaam"
                                defaultValue={userData.username || ''}
                                className="bg-neutral-700 border-neutral-600 text-white "
                                disabled={isLoading}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="email">E-mailadres</Label>
                            <Input
                                id="email"
                                name="email"
                                type="email"
                                placeholder="Je e-mailadres"
                                defaultValue={userData.email || ''}
                                className="bg-neutral-700 border-neutral-600 text-white "
                                disabled={isLoading}
                            />
                        </div>
                    </CardContent>
                    <CardFooter>
                        <Button1
                            text={loading ? "Bezig..." : "Opslaan"}
                            type="submit"
                            disabled={loading || isLoading}
                            icon={loading ? <Loader2 className="h-4 w-4 animate-spin" /> : undefined}
                        />
                    </CardFooter>
                </Card>
            </form>

            <Card className="mb-6 bg-neutral-800 text-white border-neutral-700">
                <CardHeader>
                    <CardTitle>Wachtwoord wijzigen</CardTitle>
                    <CardDescription className="text-neutral-400">
                        Update je wachtwoord om je account veilig te houden.
                    </CardDescription>
                </CardHeader>
                <form onSubmit={async (e) => {
                    e.preventDefault()
                    setPasswordLoading(true)

                    try {
                        const formData = new FormData(e.currentTarget)
                        const result = await updateUserPassword(formData)

                        if (result.success) {
                            toast.success(result.message)
                            // Reset the form
                            e.currentTarget.reset()
                        } else {
                            toast.error(result.message)
                            return // Early return to avoid the catch block error message
                        }
                    } catch (err) {
                        console.error("Password update error:", err)
                        toast.error('Er is een fout opgetreden bij het wijzigen van je wachtwoord.')
                    } finally {
                        setPasswordLoading(false)
                    }
                }}>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="currentPassword">Huidig wachtwoord</Label>
                            <div className="relative">
                                <Input
                                    id="currentPassword"
                                    name="currentPassword"
                                    type={showCurrentPassword ? "text" : "password"}
                                    placeholder="••••••••"
                                    className="bg-neutral-700 border-neutral-600 text-white pr-10"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                                    className="absolute inset-y-0 right-0 flex items-center pr-3 cursor-pointer text-neutral-400 hover:text-white"
                                >
                                    {showCurrentPassword ? <Eye size={18} /> : <EyeOff size={18} />}
                                </button>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="newPassword">Nieuw wachtwoord</Label>
                            <div className="relative">
                                <Input
                                    id="newPassword"
                                    name="newPassword"
                                    type={showNewPassword ? "text" : "password"}
                                    placeholder="••••••••"
                                    className="bg-neutral-700 border-neutral-600 text-white pr-10"
                                    required
                                    minLength={8}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowNewPassword(!showNewPassword)}
                                    className="absolute inset-y-0 right-0 flex items-center pr-3 cursor-pointer text-neutral-400 hover:text-white"
                                >
                                    {showNewPassword ? <Eye size={18} /> : <EyeOff size={18} />}
                                </button>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="confirmPassword">Bevestig nieuw wachtwoord</Label>
                            <div className="relative">
                                <Input
                                    id="confirmPassword"
                                    name="confirmPassword"
                                    type={showConfirmPassword ? "text" : "password"}
                                    placeholder="••••••••"
                                    className="bg-neutral-700 border-neutral-600 text-white"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    className="absolute inset-y-0 right-0 flex items-center pr-3 cursor-pointer text-neutral-400 hover:text-white"
                                >
                                    {showConfirmPassword ? <Eye size={18} /> : <EyeOff size={18} />}
                                </button>
                            </div>
                        </div>
                    </CardContent>
                    <CardFooter>
                        <Button1
                            text="Wachtwoord wijzigen"
                            type="submit"
                            className="mt-4"
                            disabled={passwordLoading}
                            icon={passwordLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : undefined}
                        />
                    </CardFooter>
                </form>
            </Card>

            <Card className="mb-6 bg-neutral-800 text-white border-neutral-700">
                <CardHeader>
                    <CardTitle className="text-red-500 flex flex-row items-center">
                        <AlertTriangle className="text-red-500 mr-2 h-6 w-6 flex-shrink-0 mt-1" />
                        Gevaarlijke zone
                    </CardTitle>
                    <CardDescription className="text-neutral-400">
                        Deze acties kunnen niet ongedaan gemaakt worden. Wees voorzichtig!
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        {userData.scheduledDeletion ? (
                            <>
                                <div className="bg-yellow-900/30 border border-yellow-700 rounded-md p-4 mb-4">
                                    <h3 className="text-yellow-400 font-medium mb-2">Account verwijdering gepland</h3>
                                    <p className="text-sm mb-3">
                                        Je account is gepland om verwijderd te worden op {" "}
                                        <span className="font-semibold">{new Date(userData.scheduledDeletion).toLocaleDateString('nl-NL', {
                                            day: 'numeric',
                                            month: 'long',
                                            year: 'numeric',
                                            hour: '2-digit',
                                            minute: '2-digit'
                                        })}</span>
                                    </p>
                                    <Button1
                                        text="Verwijdering annuleren"
                                        onClick={async () => {
                                            try {
                                                const result = await cancelAccountDeletion();
                                                if (result.success) {
                                                    toast.success(result.message);
                                                    // Refresh user data
                                                    const data = await getUserPreferences();
                                                    if (data) {
                                                        setUserData(data);
                                                    }
                                                } else {
                                                    toast.error(result.message);
                                                }
                                            } catch (error) {
                                                console.error("Error canceling account deletion:", error);
                                                toast.error("Er is een fout opgetreden bij het annuleren van de verwijdering.");
                                            }
                                        }}
                                    />
                                </div>
                            </>
                        ) : (
                            <>
                                <h3 className="font-medium">Account verwijderen</h3>
                                <p className="text-sm text-neutral-400">
                                    Verwijder permanent je account en alle bijbehorende gegevens.
                                    Dit kan niet ongedaan gemaakt worden.
                                </p>
                                <Button1
                                    text="Account verwijderen"
                                    onClick={() => setDeleteDialogOpen(true)}
                                    icon={<Trash className='text-red-500'/>}
                                />
                            </>
                        )}
                    </div>
                </CardContent>
            </Card>

            <div className="flex justify-end mt-6">
                <Button1
                    text="Wijzigingen opslaan"
                    onClick={() => document.querySelector('form')?.requestSubmit()}
                    disabled={loading}
                    icon={loading ? <Loader2 className="h-4 w-4 animate-spin" /> : undefined}
                />
            </div>

            <p className="text-sm text-muted-foreground mt-6">
                Je accountgegevens worden beveiligd volgens onze privacyvoorwaarden.
                Voor specifieke vragen over je account kun je contact opnemen met onze support.
            </p>

            {/* Delete Account Confirmation Dialog */}
            <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <DialogContent className="bg-neutral-800 text-white border-neutral-700">
                    <DialogHeader>
                        <DialogTitle className="text-red-400">Account verwijderen</DialogTitle>
                        <DialogDescription className="text-neutral-400">
                            Ben je zeker dat je je account wilt verwijderen?
                        </DialogDescription>
                    </DialogHeader>

                    <div className="py-4 space-y-4">
                        <p className="text-white">
                            Bij het verwijderen van je account worden al je persoonlijke gegevens, voortgang en lijsten
                            permanent verwijderd.
                        </p>

                        <div className="bg-blue-900/30 border border-blue-700 rounded-md p-3">
                            <p className="text-sm text-blue-300">
                                <strong>14 dagen bedenktijd:</strong> Je account wordt niet meteen verwijderd. Je krijgt 14 dagen bedenktijd
                                waarin je deze actie nog kunt annuleren. Na deze periode wordt je account automatisch en permanent verwijderd.
                            </p>
                        </div>
                    </div>

                    <DialogFooter className="flex flex-row gap-2 justify-end">
                        <Button1
                            text="Annuleren"
                            onClick={() => setDeleteDialogOpen(false)}
                        />
                        <Button1
                            text={deleteLoading ? "Bezig..." : "Account verwijderen"}
                            onClick={async () => {
                                setDeleteLoading(true);
                                try {
                                    const result = await initiateAccountDeletion();
                                    if (result.success) {
                                        toast.success(result.message);
                                        // Close dialog
                                        setDeleteDialogOpen(false);
                                        // Refresh user data to show the scheduled deletion notice
                                        const data = await getUserPreferences();
                                        if (data) {
                                            setUserData(data);
                                        }
                                    } else {
                                        toast.error(result.message);
                                    }
                                } catch (error) {
                                    console.error("Error deleting account:", error);
                                    toast.error('Er is een fout opgetreden bij het verwijderen van je account.');
                                } finally {
                                    setDeleteLoading(false);
                                }
                            }}
                        />
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
