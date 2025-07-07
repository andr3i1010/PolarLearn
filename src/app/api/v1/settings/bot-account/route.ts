import { NextRequest, NextResponse } from 'next/server'
import {
  createUserBotAccount,
  deleteUserBotAccount
} from '@/serverActions/accountSettings'

// POST - Create new bot account
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name } = body

    if (!name || typeof name !== 'string') {
      return NextResponse.json(
        { success: false, message: 'Bot naam is verplicht.' },
        { status: 400 }
      )
    }

    // Validate name length
    if (name.trim().length < 3 || name.trim().length > 50) {
      return NextResponse.json(
        { success: false, message: 'Bot naam moet tussen 3 en 50 karakters zijn.' },
        { status: 400 }
      )
    }

    const result = await createUserBotAccount(name.trim())

    if (!result.success) {
      return NextResponse.json(
        { success: false, message: result.message },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Bot account succesvol aangemaakt!',
      botAccount: result.botAccount
    })
  } catch (error) {
    console.error('Error creating bot account:', error)
    return NextResponse.json(
      { success: false, message: 'Er is een fout opgetreden bij het aanmaken van je bot account.' },
      { status: 500 }
    )
  }
}

// DELETE - Delete bot account
export async function DELETE() {
  try {
    const result = await deleteUserBotAccount()

    if (!result.success) {
      return NextResponse.json(
        { success: false, message: result.message },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      message: result.message
    })
  } catch (error) {
    console.error('Error deleting bot account:', error)
    return NextResponse.json(
      { success: false, message: 'Er is een fout opgetreden bij het verwijderen van je bot account.' },
      { status: 500 }
    )
  }
}
