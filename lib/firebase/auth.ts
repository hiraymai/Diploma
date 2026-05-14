'use client'

import { 
  signInWithPhoneNumber, 
  ConfirmationResult,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User
} from 'firebase/auth'
import { auth, RecaptchaVerifier } from './config'

let confirmationResult: ConfirmationResult | null = null
let recaptchaVerifier: RecaptchaVerifier | null = null

// Initialize reCAPTCHA verifier
export function initRecaptcha(containerId: string) {
  if (typeof window === 'undefined') return null
  
  if (recaptchaVerifier) {
    recaptchaVerifier.clear()
  }
  
  recaptchaVerifier = new RecaptchaVerifier(auth, containerId, {
    size: 'invisible',
    callback: () => {
      // reCAPTCHA solved
    },
    'expired-callback': () => {
      // Reset reCAPTCHA
      if (recaptchaVerifier) {
        recaptchaVerifier.clear()
        recaptchaVerifier = null
      }
    }
  })
  
  return recaptchaVerifier
}

// Send OTP to phone number
export async function sendOTP(phoneNumber: string): Promise<{ success: boolean; error?: string }> {
  try {
    if (!recaptchaVerifier) {
      return { success: false, error: 'reCAPTCHA not initialized' }
    }
    
    // Format phone number (ensure it starts with +)
    const formattedPhone = phoneNumber.startsWith('+') ? phoneNumber : `+${phoneNumber}`
    
    confirmationResult = await signInWithPhoneNumber(auth, formattedPhone, recaptchaVerifier)
    
    return { success: true }
  } catch (error: unknown) {
    console.error('Error sending OTP:', error)
    const errorMessage = error instanceof Error ? error.message : 'Failed to send OTP'
    
    // Reset reCAPTCHA on error
    if (recaptchaVerifier) {
      recaptchaVerifier.clear()
      recaptchaVerifier = null
    }
    
    return { success: false, error: errorMessage }
  }
}

// Verify OTP code
export async function verifyOTP(code: string): Promise<{ success: boolean; user?: User; error?: string }> {
  try {
    if (!confirmationResult) {
      return { success: false, error: 'No verification in progress' }
    }
    
    const result = await confirmationResult.confirm(code)
    confirmationResult = null
    
    return { success: true, user: result.user }
  } catch (error: unknown) {
    console.error('Error verifying OTP:', error)
    const errorMessage = error instanceof Error ? error.message : 'Invalid code'
    return { success: false, error: errorMessage }
  }
}

// Sign out
export async function signOut(): Promise<{ success: boolean; error?: string }> {
  try {
    await firebaseSignOut(auth)
    return { success: true }
  } catch (error: unknown) {
    console.error('Error signing out:', error)
    const errorMessage = error instanceof Error ? error.message : 'Failed to sign out'
    return { success: false, error: errorMessage }
  }
}

// Get current user
export function getCurrentUser(): User | null {
  return auth.currentUser
}

// Subscribe to auth state changes
export function onAuthChange(callback: (user: User | null) => void) {
  return onAuthStateChanged(auth, callback)
}
