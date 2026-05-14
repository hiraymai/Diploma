"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

// Generate OTP code
function generateOTP(): string {
  return Math.floor(1000 + Math.random() * 9000).toString()
}

// Send OTP (in production, this would send SMS)
export async function sendOTP(phone: string) {
  const supabase = await createClient()
  
  // Generate OTP
  const code = generateOTP()
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000) // 5 minutes
  
  // Store OTP in database
  const { error } = await supabase
    .from("otp_codes")
    .insert({
      phone,
      code,
      expires_at: expiresAt.toISOString(),
    })
  
  if (error) {
    return { success: false, error: error.message }
  }
  
  // In production, send SMS here
  // For demo, we'll return the code (remove in production!)
  console.log(`[QPark] OTP for ${phone}: ${code}`)
  
  return { success: true, code } // Remove 'code' in production
}

// Verify OTP and sign in/up user
export async function verifyOTP(phone: string, code: string) {
  const supabase = await createClient()
  
  // Check OTP
  const { data: otpData, error: otpError } = await supabase
    .from("otp_codes")
    .select("*")
    .eq("phone", phone)
    .eq("code", code)
    .eq("verified", false)
    .gt("expires_at", new Date().toISOString())
    .order("created_at", { ascending: false })
    .limit(1)
    .single()
  
  if (otpError || !otpData) {
    return { success: false, error: "Invalid or expired OTP code" }
  }
  
  // Mark OTP as verified
  await supabase
    .from("otp_codes")
    .update({ verified: true })
    .eq("id", otpData.id)
  
  // Sign in with OTP (using Supabase phone auth)
  const { data: authData, error: authError } = await supabase.auth.signInWithOtp({
    phone,
    options: {
      shouldCreateUser: true,
    }
  })
  
  if (authError) {
    // If phone auth is not enabled, use email workaround
    // Create/sign in user with email based on phone
    const email = `${phone.replace(/\+/g, "")}@qpark.local`
    const password = `qpark_${phone}_secret`
    
    // Try to sign up first
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          phone,
          name: "User",
        }
      }
    })
    
    if (signUpError && signUpError.message.includes("already registered")) {
      // User exists, sign in
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      
      if (signInError) {
        return { success: false, error: signInError.message }
      }
      
      return { success: true, user: signInData.user }
    }
    
    if (signUpError) {
      return { success: false, error: signUpError.message }
    }
    
    // Auto-confirm for demo (in production, use proper verification)
    return { success: true, user: signUpData.user, needsConfirmation: true }
  }
  
  revalidatePath("/")
  return { success: true, user: authData.user }
}

// Sign out
export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  revalidatePath("/")
  return { success: true }
}

// Get current user profile
export async function getCurrentUser() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return null
  }
  
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single()
  
  return profile
}

// Update user profile
export async function updateProfile(data: { name?: string; phone?: string }) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return { success: false, error: "Not authenticated" }
  }
  
  const { error } = await supabase
    .from("profiles")
    .update(data)
    .eq("id", user.id)
  
  if (error) {
    return { success: false, error: error.message }
  }
  
  revalidatePath("/")
  return { success: true }
}
