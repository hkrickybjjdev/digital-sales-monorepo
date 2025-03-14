import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { v7 as uuidv7 } from 'uuid'
import * as crypto from 'crypto'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Generate a unique UUID
export function generateUUID(): string {
  return uuidv7()
}

// Calculate when a product will expire (24 hours from now or creation)
export function calculateExpirationTime(fromDate: Date = new Date()): Date {
  const expirationDate = new Date(fromDate)
  expirationDate.setHours(expirationDate.getHours() + 24)
  return expirationDate
}

// Check if a product is expired
export function isExpired(expirationDate: Date): boolean {
  const now = new Date()
  return now > expirationDate
}

// Check if a product is available for sale (launch time has passed but not expired)
export function isAvailableForSale(launchTime: Date, expirationDate: Date): boolean {
  const now = new Date()
  return now >= launchTime && now <= expirationDate
}

// Format currency
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount)
}

// Secret key for HMAC (in a real app, this would be in environment variables)
const SECRET_KEY = 'your-secret-key'

// Generate HMAC signature for a string
export function generateHmacSignature(data: string): string {
  const hmac = crypto.createHmac('sha256', SECRET_KEY)
  hmac.update(data)
  return hmac.digest('hex')
}

// Verify HMAC signature
export function verifyHmacSignature(data: string, signature: string): boolean {
  const expectedSignature = generateHmacSignature(data)
  return crypto.timingSafeEqual(
    Buffer.from(signature, 'hex'),
    Buffer.from(expectedSignature, 'hex')
  )
}

// Create a signed URL with expiration
export function createSignedUrl(path: string, params: Record<string, string> = {}, expiresAt: Date): string {
  const expiresAtTimestamp = Math.floor(expiresAt.getTime() / 1000)
  const allParams: Record<string, string> = { ...params, expires: expiresAtTimestamp.toString() }
  
  // Sort keys to ensure consistent signature
  const paramString = Object.keys(allParams)
    .sort()
    .map(key => `${key}=${allParams[key]}`)
    .join('&')
  
  const dataToSign = `${path}?${paramString}`
  const signature = generateHmacSignature(dataToSign)
  
  return `${path}?${paramString}&signature=${signature}`
}

// Verify a signed URL
export function verifySignedUrl(url: string): boolean {
  const urlObj = new URL(url)
  const path = urlObj.pathname
  const params = Object.fromEntries(urlObj.searchParams.entries())
  
  // Extract and remove signature
  const { signature, expires, ...otherParams } = params as { 
    signature?: string;
    expires?: string;
    [key: string]: string | undefined;
  }
  
  if (!signature || !expires) {
    return false
  }
  
  // Check if URL has expired
  const expiresTimestamp = parseInt(expires, 10) * 1000
  const now = Date.now()
  
  if (now > expiresTimestamp) {
    return false
  }
  
  // Recreate the data string for verification
  const sortedParams: Record<string, string> = { ...otherParams as Record<string, string>, expires }
  const paramString = Object.keys(sortedParams)
    .sort()
    .map(key => `${key}=${sortedParams[key]}`)
    .join('&')
  
  const dataToVerify = `${path}?${paramString}`
  
  return verifyHmacSignature(dataToVerify, signature)
}

// Format date with time
export function formatDateTime(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

// Calculate time remaining (for countdown timers)
export function getTimeRemaining(targetDate: Date): {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  total: number;
} {
  const total = targetDate.getTime() - Date.now()
  const seconds = Math.floor((total / 1000) % 60)
  const minutes = Math.floor((total / 1000 / 60) % 60)
  const hours = Math.floor((total / (1000 * 60 * 60)) % 24)
  const days = Math.floor(total / (1000 * 60 * 60 * 24))
  
  return { days, hours, minutes, seconds, total }
}
