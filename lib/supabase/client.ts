import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Database types
export interface DBUser {
  id: string
  firebase_uid: string
  phone: string
  name: string
  wallet_balance: number
  bonus_points: number
  no_show_count: number
  is_banned: boolean
  created_at: string
  updated_at: string
}

export interface DBCar {
  id: string
  user_id: string
  brand: string
  model: string
  plate_number: string
  created_at: string
}

export interface DBParkingSpot {
  id: string
  spot_number: string
  type: 'SHORT_TERM' | 'LONG_TERM'
  status: 'FREE' | 'BOOKED' | 'OCCUPIED' | 'RESERVED' | 'REPAIR'
  floor: number
  hourly_rate: number
  daily_rate: number
  created_at: string
  updated_at: string
}

export interface DBBooking {
  id: string
  user_id: string
  spot_id: string
  car_id: string | null
  type: 'SHORT_TERM' | 'LONG_TERM'
  status: 'ACTIVE' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW'
  start_time: string
  end_time: string | null
  arrival_time: string | null
  rental_days: number | null
  total_cost: number
  paid: boolean
  created_at: string
  updated_at: string
}

export interface DBTransaction {
  id: string
  user_id: string
  type: 'TOPUP' | 'PAYMENT' | 'REFUND' | 'CASHBACK'
  amount: number
  description: string | null
  booking_id: string | null
  stripe_payment_id: string | null
  created_at: string
}

export interface DBPromoCode {
  id: string
  code: string
  discount_amount: number
  is_active: boolean
  max_uses: number | null
  current_uses: number
  expires_at: string | null
  created_at: string
}

// User functions
export async function getUserByFirebaseUID(firebaseUid: string): Promise<DBUser | null> {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('firebase_uid', firebaseUid)
    .single()
  
  if (error || !data) return null
  return data as DBUser
}

export async function createUser(firebaseUid: string, phone: string): Promise<DBUser | null> {
  const { data, error } = await supabase
    .from('users')
    .insert({ firebase_uid: firebaseUid, phone })
    .select()
    .single()
  
  if (error || !data) {
    console.error('Error creating user:', error)
    return null
  }
  return data as DBUser
}

export async function updateUser(userId: string, updates: Partial<DBUser>): Promise<DBUser | null> {
  const { data, error } = await supabase
    .from('users')
    .update(updates)
    .eq('id', userId)
    .select()
    .single()
  
  if (error || !data) return null
  return data as DBUser
}

// Car functions
export async function getUserCars(userId: string): Promise<DBCar[]> {
  const { data, error } = await supabase
    .from('cars')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
  
  if (error || !data) return []
  return data as DBCar[]
}

export async function addCar(userId: string, car: { brand: string; model: string; plateNumber: string }): Promise<DBCar | null> {
  const { data, error } = await supabase
    .from('cars')
    .insert({ user_id: userId, brand: car.brand, model: car.model, plate_number: car.plateNumber })
    .select()
    .single()
  
  if (error || !data) return null
  return data as DBCar
}

export async function deleteCar(carId: string): Promise<boolean> {
  const { error } = await supabase
    .from('cars')
    .delete()
    .eq('id', carId)
  
  return !error
}

// Parking spots functions
export async function getParkingSpots(): Promise<DBParkingSpot[]> {
  const { data, error } = await supabase
    .from('parking_spots')
    .select('*')
    .order('spot_number', { ascending: true })
  
  if (error || !data) return []
  return data as DBParkingSpot[]
}

export async function updateParkingSpot(spotId: string, updates: Partial<DBParkingSpot>): Promise<boolean> {
  const { error } = await supabase
    .from('parking_spots')
    .update(updates)
    .eq('id', spotId)
  
  return !error
}

// Booking functions
export async function getUserBookings(userId: string): Promise<DBBooking[]> {
  const { data, error } = await supabase
    .from('bookings')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
  
  if (error || !data) return []
  return data as DBBooking[]
}

export async function createBooking(booking: {
  userId: string
  spotId: string
  carId?: string
  type: 'SHORT_TERM' | 'LONG_TERM'
  rentalDays?: number
  totalCost: number
}): Promise<DBBooking | null> {
  const { data, error } = await supabase
    .from('bookings')
    .insert({
      user_id: booking.userId,
      spot_id: booking.spotId,
      car_id: booking.carId || null,
      type: booking.type,
      rental_days: booking.rentalDays || null,
      total_cost: booking.totalCost,
    })
    .select()
    .single()
  
  if (error || !data) return null
  return data as DBBooking
}

export async function updateBooking(bookingId: string, updates: Partial<DBBooking>): Promise<boolean> {
  const { error } = await supabase
    .from('bookings')
    .update(updates)
    .eq('id', bookingId)
  
  return !error
}

// Transaction functions
export async function getUserTransactions(userId: string): Promise<DBTransaction[]> {
  const { data, error } = await supabase
    .from('transactions')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
  
  if (error || !data) return []
  return data as DBTransaction[]
}

export async function createTransaction(transaction: {
  userId: string
  type: 'TOPUP' | 'PAYMENT' | 'REFUND' | 'CASHBACK'
  amount: number
  description?: string
  bookingId?: string
}): Promise<DBTransaction | null> {
  const { data, error } = await supabase
    .from('transactions')
    .insert({
      user_id: transaction.userId,
      type: transaction.type,
      amount: transaction.amount,
      description: transaction.description || null,
      booking_id: transaction.bookingId || null,
    })
    .select()
    .single()
  
  if (error || !data) return null
  return data as DBTransaction
}

// Promo code functions
export async function getPromoCode(code: string): Promise<DBPromoCode | null> {
  const { data, error } = await supabase
    .from('promo_codes')
    .select('*')
    .eq('code', code.toUpperCase())
    .eq('is_active', true)
    .single()
  
  if (error || !data) return null
  return data as DBPromoCode
}

export async function usePromoCode(codeId: string): Promise<boolean> {
  const { error } = await supabase
    .from('promo_codes')
    .update({ current_uses: supabase.rpc('increment_promo_uses', { code_id: codeId }) })
    .eq('id', codeId)
  
  return !error
}
