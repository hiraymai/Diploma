'use server'

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

// Use service role for server actions (bypasses RLS)
const supabase = createClient(supabaseUrl, supabaseServiceKey)

// ============ USER ACTIONS ============

export async function getOrCreateUser(firebaseUid: string, phone: string) {
  // Try to find existing user
  const { data: existingUser } = await supabase
    .from('profiles')
    .select('*')
    .eq('firebase_uid', firebaseUid)
    .single()
  
  if (existingUser) {
    return { success: true, user: existingUser }
  }
  
  // Create new user
  const { data: newUser, error } = await supabase
    .from('profiles')
    .insert({
      firebase_uid: firebaseUid,
      phone: phone,
      name: 'User',
      wallet_balance: 0,
      bonus_points: 50, // Welcome bonus
      no_show_count: 0,
      is_banned: false
    })
    .select()
    .single()
  
  if (error) {
    console.error('Error creating user:', error)
    return { success: false, error: error.message }
  }
  
  return { success: true, user: newUser, isNewUser: true }
}

export async function getUserByFirebaseUid(firebaseUid: string) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('firebase_uid', firebaseUid)
    .single()
  
  if (error) {
    return { success: false, error: error.message }
  }
  
  return { success: true, user: data }
}

export async function updateUserProfile(firebaseUid: string, updates: { name?: string }) {
  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('firebase_uid', firebaseUid)
    .select()
    .single()
  
  if (error) {
    return { success: false, error: error.message }
  }
  
  return { success: true, user: data }
}

// ============ CAR ACTIONS ============

export async function getUserCars(firebaseUid: string) {
  // First get user id
  const { data: user } = await supabase
    .from('profiles')
    .select('id')
    .eq('firebase_uid', firebaseUid)
    .single()
  
  if (!user) {
    return { success: false, error: 'User not found', cars: [] }
  }
  
  const { data: cars, error } = await supabase
    .from('cars')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
  
  if (error) {
    return { success: false, error: error.message, cars: [] }
  }
  
  return { success: true, cars: cars || [] }
}

export async function addCar(firebaseUid: string, car: { brand: string; model: string; plateNumber: string }) {
  // First get user id
  const { data: user } = await supabase
    .from('profiles')
    .select('id')
    .eq('firebase_uid', firebaseUid)
    .single()
  
  if (!user) {
    return { success: false, error: 'User not found' }
  }
  
  const { data, error } = await supabase
    .from('cars')
    .insert({
      user_id: user.id,
      brand: car.brand,
      model: car.model,
      plate_number: car.plateNumber
    })
    .select()
    .single()
  
  if (error) {
    return { success: false, error: error.message }
  }
  
  return { success: true, car: data }
}

export async function deleteCar(carId: string) {
  const { error } = await supabase
    .from('cars')
    .delete()
    .eq('id', carId)
  
  if (error) {
    return { success: false, error: error.message }
  }
  
  return { success: true }
}

// ============ PARKING SPOTS ACTIONS ============

export async function getParkingSpots() {
  const { data, error } = await supabase
    .from('parking_spots')
    .select('*')
    .order('spot_number', { ascending: true })
  
  if (error) {
    return { success: false, error: error.message, spots: [] }
  }
  
  return { success: true, spots: data || [] }
}

export async function updateSpotStatus(spotId: string, status: string) {
  const { data, error } = await supabase
    .from('parking_spots')
    .update({ status })
    .eq('id', spotId)
    .select()
    .single()
  
  if (error) {
    return { success: false, error: error.message }
  }
  
  return { success: true, spot: data }
}

// ============ BOOKING ACTIONS ============

export async function createBooking(
  firebaseUid: string, 
  spotId: string, 
  carId: string | null,
  type: 'SHORT_TERM' | 'LONG_TERM',
  rentalDays?: number
) {
  // Get user id
  const { data: user } = await supabase
    .from('profiles')
    .select('id')
    .eq('firebase_uid', firebaseUid)
    .single()
  
  if (!user) {
    return { success: false, error: 'User not found' }
  }
  
  // Get spot info for pricing
  const { data: spot } = await supabase
    .from('parking_spots')
    .select('*')
    .eq('id', spotId)
    .single()
  
  if (!spot) {
    return { success: false, error: 'Parking spot not found' }
  }
  
  // Calculate cost
  let totalCost = 0
  if (type === 'LONG_TERM' && rentalDays) {
    totalCost = spot.daily_rate * rentalDays
  }
  
  // Create booking
  const { data: booking, error } = await supabase
    .from('bookings')
    .insert({
      user_id: user.id,
      spot_id: spotId,
      car_id: carId,
      type,
      status: 'ACTIVE',
      start_time: new Date().toISOString(),
      rental_days: rentalDays || null,
      total_cost: totalCost,
      paid: false
    })
    .select()
    .single()
  
  if (error) {
    return { success: false, error: error.message }
  }
  
  // Update spot status
  await supabase
    .from('parking_spots')
    .update({ status: 'BOOKED' })
    .eq('id', spotId)
  
  return { success: true, booking }
}

export async function getUserBookings(firebaseUid: string) {
  const { data: user } = await supabase
    .from('profiles')
    .select('id')
    .eq('firebase_uid', firebaseUid)
    .single()
  
  if (!user) {
    return { success: false, error: 'User not found', bookings: [] }
  }
  
  const { data: bookings, error } = await supabase
    .from('bookings')
    .select(`
      *,
      parking_spots (*),
      cars (*)
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
  
  if (error) {
    return { success: false, error: error.message, bookings: [] }
  }
  
  return { success: true, bookings: bookings || [] }
}

export async function getActiveBooking(firebaseUid: string) {
  const { data: user } = await supabase
    .from('profiles')
    .select('id')
    .eq('firebase_uid', firebaseUid)
    .single()
  
  if (!user) {
    return { success: false, error: 'User not found', booking: null }
  }
  
  const { data: booking, error } = await supabase
    .from('bookings')
    .select(`
      *,
      parking_spots (*),
      cars (*)
    `)
    .eq('user_id', user.id)
    .eq('status', 'ACTIVE')
    .single()
  
  if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
    return { success: false, error: error.message, booking: null }
  }
  
  return { success: true, booking: booking || null }
}

export async function completeBooking(bookingId: string, totalCost: number) {
  const { data: booking, error } = await supabase
    .from('bookings')
    .update({
      status: 'COMPLETED',
      end_time: new Date().toISOString(),
      total_cost: totalCost
    })
    .eq('id', bookingId)
    .select('spot_id')
    .single()
  
  if (error) {
    return { success: false, error: error.message }
  }
  
  // Free up the spot
  if (booking) {
    await supabase
      .from('parking_spots')
      .update({ status: 'FREE' })
      .eq('id', booking.spot_id)
  }
  
  return { success: true }
}

export async function cancelBooking(bookingId: string) {
  const { data: booking, error } = await supabase
    .from('bookings')
    .update({ status: 'CANCELLED' })
    .eq('id', bookingId)
    .select('spot_id')
    .single()
  
  if (error) {
    return { success: false, error: error.message }
  }
  
  // Free up the spot
  if (booking) {
    await supabase
      .from('parking_spots')
      .update({ status: 'FREE' })
      .eq('id', booking.spot_id)
  }
  
  return { success: true }
}

// ============ WALLET ACTIONS ============

export async function topUpWallet(firebaseUid: string, amount: number) {
  const { data: user } = await supabase
    .from('profiles')
    .select('id, wallet_balance')
    .eq('firebase_uid', firebaseUid)
    .single()
  
  if (!user) {
    return { success: false, error: 'User not found' }
  }
  
  // Update balance
  const newBalance = Number(user.wallet_balance) + amount
  const { error: updateError } = await supabase
    .from('profiles')
    .update({ wallet_balance: newBalance })
    .eq('id', user.id)
  
  if (updateError) {
    return { success: false, error: updateError.message }
  }
  
  // Create transaction record
  await supabase
    .from('transactions')
    .insert({
      user_id: user.id,
      type: 'TOPUP',
      amount: amount,
      description: 'Wallet top-up'
    })
  
  return { success: true, newBalance }
}

export async function payFromWallet(firebaseUid: string, amount: number, bookingId?: string) {
  const { data: user } = await supabase
    .from('profiles')
    .select('id, wallet_balance')
    .eq('firebase_uid', firebaseUid)
    .single()
  
  if (!user) {
    return { success: false, error: 'User not found' }
  }
  
  if (Number(user.wallet_balance) < amount) {
    return { success: false, error: 'Insufficient balance' }
  }
  
  // Update balance
  const newBalance = Number(user.wallet_balance) - amount
  const { error: updateError } = await supabase
    .from('profiles')
    .update({ wallet_balance: newBalance })
    .eq('id', user.id)
  
  if (updateError) {
    return { success: false, error: updateError.message }
  }
  
  // Create transaction record
  await supabase
    .from('transactions')
    .insert({
      user_id: user.id,
      type: 'PAYMENT',
      amount: -amount,
      description: 'Parking payment',
      booking_id: bookingId || null
    })
  
  return { success: true, newBalance }
}

export async function getUserTransactions(firebaseUid: string) {
  const { data: user } = await supabase
    .from('profiles')
    .select('id')
    .eq('firebase_uid', firebaseUid)
    .single()
  
  if (!user) {
    return { success: false, error: 'User not found', transactions: [] }
  }
  
  const { data: transactions, error } = await supabase
    .from('transactions')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(50)
  
  if (error) {
    return { success: false, error: error.message, transactions: [] }
  }
  
  return { success: true, transactions: transactions || [] }
}

// ============ PROMO CODE ACTIONS ============

export async function applyPromoCode(firebaseUid: string, code: string) {
  const { data: promo, error } = await supabase
    .from('promo_codes')
    .select('*')
    .eq('code', code.toUpperCase())
    .eq('is_active', true)
    .single()
  
  if (error || !promo) {
    return { success: false, error: 'Invalid promo code' }
  }
  
  if (promo.max_uses && promo.current_uses >= promo.max_uses) {
    return { success: false, error: 'Promo code expired' }
  }
  
  if (promo.expires_at && new Date(promo.expires_at) < new Date()) {
    return { success: false, error: 'Promo code expired' }
  }
  
  // Apply discount to wallet
  const topUpResult = await topUpWallet(firebaseUid, promo.discount_amount)
  
  if (!topUpResult.success) {
    return { success: false, error: 'Failed to apply promo code' }
  }
  
  // Increment usage
  await supabase
    .from('promo_codes')
    .update({ current_uses: promo.current_uses + 1 })
    .eq('id', promo.id)
  
  return { success: true, discount: promo.discount_amount }
}
