import { cookies } from 'next/headers'
import { prisma } from '@/lib/prisma'

export interface TokenTransaction {
  id: string
  userId: string
  type: 'purchase' | 'usage' | 'refund'
  amount: number
  description: string
  timestamp: Date
}

export interface UserTokens {
  userId: string
  tokens: number
  lastUpdated: Date
}

// Token prices
export const TOKEN_PRICES = {
  PURCHASE: 5, // $5 per 5 tokens
  USAGE: 1,    // 1 token per generation
}

// Get user's token balance
export async function getUserTokens(userId: string): Promise<number> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { tokens: true }
    })
    return user?.tokens || 0
  } catch (error) {
    console.error('Error getting user tokens:', error)
    return 0
  }
}

// Deduct tokens for usage
export async function deductTokens(userId: string, amount: number = 1): Promise<boolean> {
  try {
    const currentTokens = await getUserTokens(userId)
    
    if (currentTokens < amount) {
      return false // Insufficient tokens
    }
    
    // Deduct tokens
    await updateUserTokens(userId, currentTokens - amount)
    
    // Log transaction
    await logTokenTransaction({
      id: Date.now().toString(),
      userId,
      type: 'usage',
      amount: -amount,
      description: 'AI generation usage',
      timestamp: new Date()
    })
    
    return true
  } catch (error) {
    console.error('Error using tokens:', error)
    return false
  }
}

// Add tokens (for purchases)
export async function addTokens(userId: string, amount: number): Promise<void> {
  try {
    // Check if user exists first
    const user = await prisma.user.findUnique({
      where: { id: userId }
    })
    
    if (!user) {
      throw new Error(`User ${userId} not found in database`)
    }
    
    const currentTokens = await getUserTokens(userId)
    await updateUserTokens(userId, currentTokens + amount)
    
    // Log transaction
    await logTokenTransaction({
      id: Date.now().toString(),
      userId,
      type: 'purchase',
      amount,
      description: `Purchased ${amount} tokens for $${(amount / TOKEN_PRICES.PURCHASE) * 5}`,
      timestamp: new Date()
    })
  } catch (error) {
    console.error('Error adding tokens:', error)
    throw error
  }
}

// Check if user has enough tokens
export async function hasEnoughTokens(userId: string, amount: number = 1): Promise<boolean> {
  const tokens = await getUserTokens(userId)
  return tokens >= amount
}

// Get token price in dollars
export function getTokenPrice(tokens: number): number {
  return (tokens / TOKEN_PRICES.PURCHASE) * 5
}

// Database functions
async function updateUserTokens(userId: string, newAmount: number): Promise<void> {
  try {
    await prisma.user.update({
      where: { id: userId },
      data: { tokens: newAmount }
    })
  } catch (error) {
    console.error('Error updating user tokens:', error)
    throw error
  }
}

async function logTokenTransaction(transaction: TokenTransaction): Promise<void> {
  try {
    await prisma.tokenTransaction.create({
      data: {
        id: transaction.id,
        userId: transaction.userId,
        type: transaction.type,
        amount: transaction.amount,
        description: transaction.description,
        timestamp: transaction.timestamp
      }
    })
  } catch (error) {
    console.error('Error logging token transaction:', error)
  }
} 