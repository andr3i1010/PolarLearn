import { getUserPreferences } from '@/serverActions/accountSettings'
import ClientAccountSettings from './ClientAccountSettings'
import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default async function SettingsPage() {
    const initialData = await getUserPreferences()
    if (!initialData) {
        redirect('/auth/sign-in')
    }
    const parsedData = {
        ...initialData,
        scheduledDeletion: initialData.scheduledDeletion
            ? initialData.scheduledDeletion.toISOString()
            : null
    }
    return <ClientAccountSettings initialData={parsedData} />
}
