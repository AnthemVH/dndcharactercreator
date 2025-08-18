import { SignJWT, jwtVerify } from 'jose'
import bcrypt from 'bcryptjs'
import { supabaseAdmin } from './supabase'

const JWT_SECRET = process.env.JWT_SECRET || (() => {
  console.warn('JWT_SECRET not set, using fallback. This is not secure for production!')
  return 'fallback-secret-change-in-production'
})()

export interface JWTPayload {
  userId: string
  email: string
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12)
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword)
}

export async function generateToken(payload: JWTPayload): Promise<string> {
  const secret = new TextEncoder().encode(JWT_SECRET)
  const alg = 'HS256'
  
  return new SignJWT(payload)
    .setProtectedHeader({ alg })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(secret)
}

export async function verifyToken(token: string): Promise<JWTPayload | null> {
  try {
    const secret = new TextEncoder().encode(JWT_SECRET)
    const { payload } = await jwtVerify(token, secret)
    return payload as JWTPayload
  } catch (error) {
    return null
  }
}

export async function authenticateUser(email: string, password: string) {
  const { data: user, error } = await supabaseAdmin
    .from('users')
    .select('id, email, name, password')
    .eq('email', email)
    .single()
  if (error) {
    return null
  }

  if (!user) {
    return null
  }

  const isValid = user.password ? await verifyPassword(password, user.password) : false
  if (!isValid) {
    return null
  }

  return user
} 