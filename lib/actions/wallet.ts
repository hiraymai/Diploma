"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

// Get wallet balance and transactions
export async function getWalletData() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return null
  }
  
  const { data: profile } = await supabase
    .from("profiles")
    .select("wallet_balance, bonus_points")
    .eq("id", user.id)
    .single()
  
  const { data: transactions } = await supabase
    .from("transactions")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(20)
  
  return {
    balance: profile?.wallet_balance || 0,
    bonusPoints: profile?.bonus_points || 0,
    transactions: transactions || [],
  }
}

// Top up wallet (demo - in production use Stripe)
export async function topUpWallet(amount: number) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return { success: false, error: "Not authenticated" }
  }
  
  // Get current balance
  const { data: profile } = await supabase
    .from("profiles")
    .select("wallet_balance")
    .eq("id", user.id)
    .single()
  
  if (!profile) {
    return { success: false, error: "Profile not found" }
  }
  
  const newBalance = Number(profile.wallet_balance) + amount
  
  // Update balance
  const { error: updateError } = await supabase
    .from("profiles")
    .update({ wallet_balance: newBalance })
    .eq("id", user.id)
  
  if (updateError) {
    return { success: false, error: updateError.message }
  }
  
  // Record transaction
  await supabase
    .from("transactions")
    .insert({
      user_id: user.id,
      type: "TOPUP",
      amount: amount,
      description: `Wallet top-up`,
    })
  
  revalidatePath("/")
  return { success: true, newBalance }
}

// Apply promo code
export async function applyPromoCode(code: string) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return { success: false, error: "Not authenticated" }
  }
  
  // Find promo code
  const { data: promo } = await supabase
    .from("promo_codes")
    .select("*")
    .eq("code", code.toUpperCase())
    .eq("is_active", true)
    .single()
  
  if (!promo) {
    return { success: false, error: "Invalid or expired promo code" }
  }
  
  // Check if max uses reached
  if (promo.max_uses && promo.current_uses >= promo.max_uses) {
    return { success: false, error: "Promo code usage limit reached" }
  }
  
  // Check expiration
  if (promo.expires_at && new Date(promo.expires_at) < new Date()) {
    return { success: false, error: "Promo code has expired" }
  }
  
  // Get current balance
  const { data: profile } = await supabase
    .from("profiles")
    .select("wallet_balance")
    .eq("id", user.id)
    .single()
  
  if (!profile) {
    return { success: false, error: "Profile not found" }
  }
  
  const newBalance = Number(profile.wallet_balance) + Number(promo.discount_amount)
  
  // Update balance
  await supabase
    .from("profiles")
    .update({ wallet_balance: newBalance })
    .eq("id", user.id)
  
  // Update promo usage
  await supabase
    .from("promo_codes")
    .update({ current_uses: promo.current_uses + 1 })
    .eq("id", promo.id)
  
  // Record transaction
  await supabase
    .from("transactions")
    .insert({
      user_id: user.id,
      type: "CASHBACK",
      amount: Number(promo.discount_amount),
      description: `Promo code: ${code}`,
    })
  
  revalidatePath("/")
  return { success: true, amount: promo.discount_amount, newBalance }
}
