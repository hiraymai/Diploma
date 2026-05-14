"use client"

import { createClient } from "@/lib/supabase/client"
import { useEffect, useState, useCallback } from "react"
import type { User as SupabaseUser } from "@supabase/supabase-js"

export interface Profile {
  id: string
  phone: string | null
  name: string | null
  wallet_balance: number
  bonus_points: number
  no_show_count: number
  is_banned: boolean
}

export interface Car {
  id: string
  user_id: string
  brand: string
  model: string
  plate_number: string
}

export interface ParkingSpot {
  id: string
  spot_number: string
  type: "SHORT_TERM" | "LONG_TERM"
  status: "FREE" | "BOOKED" | "OCCUPIED" | "RESERVED" | "REPAIR"
  floor: number
  hourly_rate: number
  daily_rate: number
}

export interface Booking {
  id: string
  user_id: string
  spot_id: string
  car_id: string | null
  type: "SHORT_TERM" | "LONG_TERM"
  status: "ACTIVE" | "COMPLETED" | "CANCELLED" | "NO_SHOW"
  start_time: string
  end_time: string | null
  arrival_time: string | null
  rental_days: number | null
  total_cost: number
  paid: boolean
  parking_spots?: ParkingSpot
  cars?: Car
}

export interface Transaction {
  id: string
  user_id: string
  type: "TOPUP" | "PAYMENT" | "REFUND" | "CASHBACK"
  amount: number
  description: string | null
  created_at: string
}

export function useAuth() {
  const [user, setUser] = useState<SupabaseUser | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  const fetchProfile = useCallback(async (userId: string) => {
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single()
    
    setProfile(data)
  }, [supabase])

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        fetchProfile(session.user.id)
      }
      setLoading(false)
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setUser(session?.user ?? null)
        if (session?.user) {
          fetchProfile(session.user.id)
        } else {
          setProfile(null)
        }
        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [supabase, fetchProfile])

  return { user, profile, loading, refetchProfile: () => user && fetchProfile(user.id) }
}

export function useParkingSpots() {
  const [spots, setSpots] = useState<ParkingSpot[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  const fetchSpots = useCallback(async () => {
    const { data } = await supabase
      .from("parking_spots")
      .select("*")
      .order("spot_number")
    
    setSpots(data || [])
    setLoading(false)
  }, [supabase])

  useEffect(() => {
    fetchSpots()

    // Subscribe to real-time updates
    const channel = supabase
      .channel("parking_spots_changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "parking_spots" },
        () => {
          fetchSpots()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [supabase, fetchSpots])

  return { spots, loading, refetch: fetchSpots }
}

export function useActiveBooking() {
  const [booking, setBooking] = useState<Booking | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()
  const { user } = useAuth()

  const fetchBooking = useCallback(async () => {
    if (!user) {
      setBooking(null)
      setLoading(false)
      return
    }

    const { data } = await supabase
      .from("bookings")
      .select(`
        *,
        parking_spots (*),
        cars (*)
      `)
      .eq("user_id", user.id)
      .eq("status", "ACTIVE")
      .order("created_at", { ascending: false })
      .limit(1)
      .single()
    
    setBooking(data)
    setLoading(false)
  }, [supabase, user])

  useEffect(() => {
    fetchBooking()
  }, [fetchBooking])

  return { booking, loading, refetch: fetchBooking }
}

export function useUserCars() {
  const [cars, setCars] = useState<Car[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()
  const { user } = useAuth()

  const fetchCars = useCallback(async () => {
    if (!user) {
      setCars([])
      setLoading(false)
      return
    }

    const { data } = await supabase
      .from("cars")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
    
    setCars(data || [])
    setLoading(false)
  }, [supabase, user])

  useEffect(() => {
    fetchCars()
  }, [fetchCars])

  return { cars, loading, refetch: fetchCars }
}

export function useTransactions() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()
  const { user } = useAuth()

  const fetchTransactions = useCallback(async () => {
    if (!user) {
      setTransactions([])
      setLoading(false)
      return
    }

    const { data } = await supabase
      .from("transactions")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(20)
    
    setTransactions(data || [])
    setLoading(false)
  }, [supabase, user])

  useEffect(() => {
    fetchTransactions()
  }, [fetchTransactions])

  return { transactions, loading, refetch: fetchTransactions }
}

export function useWalletData() {
  const { profile, refetchProfile } = useAuth()
  const { transactions, loading: transactionsLoading, refetch: refetchTransactions } = useTransactions()

  return {
    balance: profile?.wallet_balance || 0,
    bonusPoints: profile?.bonus_points || 0,
    transactions,
    loading: transactionsLoading,
    refetch: () => {
      refetchProfile()
      refetchTransactions()
    }
  }
}
