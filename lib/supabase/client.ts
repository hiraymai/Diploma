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
