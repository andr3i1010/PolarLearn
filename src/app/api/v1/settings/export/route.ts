import { NextResponse } from 'next/server'
import { exportUserData } from '@/serverActions/exportData'

export async function GET() {
  const result = await exportUserData()
  return NextResponse.json(result)
}
