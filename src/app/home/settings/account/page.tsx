import { getUserPreferences, getUserBotAccount } from '@/serverActions/accountSettings'
import ClientAccountSettings from './ClientAccountSettings'
import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default async function SettingsPage() {
    const initialData = await getUserPreferences()
    if (!initialData) {
        redirect('/auth/sign-in')
    }

    // Also fetch bot account data server-side
    const botAccountData = await getUserBotAccount()

    const parsedData = {
        ...initialData,
        scheduledDeletion: initialData.scheduledDeletion
            ? initialData.scheduledDeletion.toISOString()
            : null,
        botAccount: botAccountData
    }

    return <ClientAccountSettings initialData={parsedData} />
}