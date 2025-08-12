import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { PrismaAdapter } from '@auth/prisma-adapter'

// Dynamically import Prisma to avoid edge runtime issues
let prismaAdapter: any = undefined

// Only try to create adapter if we're not in edge runtime
if (typeof global !== 'undefined') {
  try {
    const { prisma } = require('./prisma')
    prismaAdapter = PrismaAdapter(prisma)
  } catch (error) {
    console.warn('Prisma adapter not available:', error)
  }
}

export const authOptions: NextAuthOptions = {
  adapter: prismaAdapter,
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        try {
          const { prisma } = require('./prisma')
          const user = await prisma.user.findUnique({
            where: { email: credentials.email }
          })

          if (!user || !user.password) {
            return null
          }

          // For now, simple password comparison (you should use bcrypt in production)
          const isPasswordValid = credentials.password === user.password

          if (!isPasswordValid) {
            return null
          }

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role
          }
        } catch (error) {
          console.error('Auth error:', error)
          return null
        }
      }
    })
  ],
  callbacks: {
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = (token as any).id
        (session.user as any).role = (token as any).role
      }
      return session
    },
    async jwt({ token, user }) {
      if (user) {
        (token as any).id = user.id
        (token as any).role = (user as any).role
      }
      return token
    },
  },
  pages: {
    signIn: '/login',
  },
  session: {
    strategy: 'jwt',
  },
  secret: process.env.NEXTAUTH_SECRET || 'your-secret-key-here',
} 