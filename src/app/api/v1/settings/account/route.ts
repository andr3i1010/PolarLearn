import { NextResponse } from 'next/server'
import { getUserPreferences, updateUserProfile, updateUserPassword, initiateAccountDeletion } from '@/serverActions/accountSettings'
import { cancelAccountDeletion } from '@/serverActions/cancelDeletion'

export async function GET() {
  const data = await getUserPreferences()
  return NextResponse.json(data)
}

export async function PATCH(request: Request) {
  const body = await request.json()
  let result
  if (body.action === 'profile') {
    const formData = new FormData()
    formData.append('username', body.username)
    formData.append('email', body.email)
    result = await updateUserProfile(formData)
  } else if (body.action === 'password') {
    const formData = new FormData()
    formData.append('currentPassword', body.currentPassword)
    formData.append('newPassword', body.newPassword)
    formData.append('confirmPassword', body.confirmPassword)
    result = await updateUserPassword(formData)
  } else {
    return NextResponse.json({ success: false, message: 'Onbekende actie.' }, { status: 400 })
  }
  return NextResponse.json(result)
}

export async function POST() {
  const result = await initiateAccountDeletion()
  return NextResponse.json(result)
}

export async function DELETE() {
  const result = await cancelAccountDeletion()
  return NextResponse.json(result)
}
