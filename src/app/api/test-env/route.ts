import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  return NextResponse.json({
    databaseUrl: process.env.DATABASE_URL,
    jwtSecret: process.env.JWT_SECRET ? 'SET' : 'NOT SET',
    nextAuthSecret: process.env.NEXTAUTH_SECRET ? 'SET' : 'NOT SET',
    nextAuthUrl: process.env.NEXTAUTH_URL,
    nodeEnv: process.env.NODE_ENV,
    allEnvVars: Object.keys(process.env).filter(key => key.includes('NEXT') || key.includes('JWT') || key.includes('DATABASE'))
  })
}
