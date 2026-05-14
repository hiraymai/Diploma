"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

// Get all parking spots
export async function getParkingSpots() {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from("parking_spots")
    .select("*")
    .order("spot_number")
  
  if (error) {
    console.error("[QPark] Error fetching spots:", error)
    return []
  }
  
  return data
}

// Get single parking spot
export async function getParkingSpot(spotId: string) {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from("parking_spots")
    .select("*")
    .eq("id", spotId)
    .single()
  
  if (error) {
    return null
  }
  
  return data
}

// Create a booking
export async function createBooking(data: {
  spotId: string
  carId?: string
  type: "SHORT_TERM" | "LONG_TERM"
  rentalDays?: number
}) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return { success: false, error: "Not authenticated" }
  }
  
  // Check if spot is available
  const { data: spot } = await supabase
    .from("parking_spots")
    .select("*")
    .eq("id", data.spotId)
    .single()
  
  if (!spot || spot.status !== "FREE") {
    return { success: false, error: "Spot is not available" }
  }
  
  // Calculate end time based on booking type
  const startTime = new Date()
  let endTime: Date | null = null
  let totalCost = 0
  
  if (data.type === "LONG_TERM" && data.rentalDays) {
    endTime = new Date(startTime.getTime() + data.rentalDays * 24 * 60 * 60 * 1000)
    totalCost = Number(spot.daily_rate) * data.rentalDays
  } else {
    // Short term - 15 minutes to arrive, then pay per hour
    endTime = new Date(startTime.getTime() + 15 * 60 * 1000)
  }
  
  // Create booking
  const { data: booking, error: bookingError } = await supabase
    .from("bookings")
    .insert({
      user_id: user.id,
      spot_id: data.spotId,
      car_id: data.carId || null,
      type: data.type,
      status: "ACTIVE",
      start_time: startTime.toISOString(),
      end_time: endTime?.toISOString(),
      rental_days: data.rentalDays || null,
      total_cost: totalCost,
      paid: data.type === "LONG_TERM",
    })
    .select()
    .single()
  
  if (bookingError) {
    return { success: false, error: bookingError.message }
  }
  
  // Update spot status
  await supabase
    .from("parking_spots")
    .update({ status: "BOOKED" })
    .eq("id", data.spotId)
  
  // If long-term, deduct from wallet
  if (data.type === "LONG_TERM" && totalCost > 0) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("wallet_balance")
      .eq("id", user.id)
      .single()
    
    if (profile && Number(profile.wallet_balance) >= totalCost) {
      await supabase
        .from("profiles")
        .update({ wallet_balance: Number(profile.wallet_balance) - totalCost })
        .eq("id", user.id)
      
      // Record transaction
      await supabase
        .from("transactions")
        .insert({
          user_id: user.id,
          type: "PAYMENT",
          amount: -totalCost,
          description: `Long-term parking: ${spot.spot_number} for ${data.rentalDays} days`,
          booking_id: booking.id,
        })
    }
  }
  
  revalidatePath("/")
  return { success: true, booking }
}

// Get user's active booking
export async function getActiveBooking() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return null
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
  
  return data
}

// Mark arrival
export async function markArrival(bookingId: string) {
  const supabase = await createClient()
  
  const { error } = await supabase
    .from("bookings")
    .update({ 
      arrival_time: new Date().toISOString(),
    })
    .eq("id", bookingId)
  
  // Update spot to OCCUPIED
  const { data: booking } = await supabase
    .from("bookings")
    .select("spot_id")
    .eq("id", bookingId)
    .single()
  
  if (booking) {
    await supabase
      .from("parking_spots")
      .update({ status: "OCCUPIED" })
      .eq("id", booking.spot_id)
  }
  
  revalidatePath("/")
  return { success: !error, error: error?.message }
}

// Complete booking and pay
export async function completeBooking(bookingId: string) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return { success: false, error: "Not authenticated" }
  }
  
  const { data: booking } = await supabase
    .from("bookings")
    .select(`
      *,
      parking_spots (*)
    `)
    .eq("id", bookingId)
    .single()
  
  if (!booking) {
    return { success: false, error: "Booking not found" }
  }
  
  // Calculate final cost for short-term
  let finalCost = Number(booking.total_cost)
  
  if (booking.type === "SHORT_TERM" && booking.arrival_time) {
    const arrivalTime = new Date(booking.arrival_time)
    const now = new Date()
    const hours = Math.ceil((now.getTime() - arrivalTime.getTime()) / (1000 * 60 * 60))
    finalCost = hours * Number(booking.parking_spots.hourly_rate)
    
    // Minimum 1 hour
    if (finalCost < Number(booking.parking_spots.hourly_rate)) {
      finalCost = Number(booking.parking_spots.hourly_rate)
    }
  }
  
  // Deduct from wallet
  const { data: profile } = await supabase
    .from("profiles")
    .select("wallet_balance")
    .eq("id", user.id)
    .single()
  
  if (!profile || Number(profile.wallet_balance) < finalCost) {
    return { success: false, error: "Insufficient balance" }
  }
  
  // Update wallet
  await supabase
    .from("profiles")
    .update({ wallet_balance: Number(profile.wallet_balance) - finalCost })
    .eq("id", user.id)
  
  // Record transaction
  await supabase
    .from("transactions")
    .insert({
      user_id: user.id,
      type: "PAYMENT",
      amount: -finalCost,
      description: `Parking payment: ${booking.parking_spots.spot_number}`,
      booking_id: bookingId,
    })
  
  // Complete booking
  await supabase
    .from("bookings")
    .update({ 
      status: "COMPLETED",
      total_cost: finalCost,
      paid: true,
      end_time: new Date().toISOString(),
    })
    .eq("id", bookingId)
  
  // Free the spot
  await supabase
    .from("parking_spots")
    .update({ status: "FREE" })
    .eq("id", booking.spot_id)
  
  revalidatePath("/")
  return { success: true, cost: finalCost }
}

// Cancel booking
export async function cancelBooking(bookingId: string) {
  const supabase = await createClient()
  
  const { data: booking } = await supabase
    .from("bookings")
    .select("spot_id, arrival_time, user_id")
    .eq("id", bookingId)
    .single()
  
  if (!booking) {
    return { success: false, error: "Booking not found" }
  }
  
  // If already arrived, increment no-show counter
  if (!booking.arrival_time) {
    await supabase.rpc("increment_no_show", { user_id: booking.user_id })
  }
  
  // Update booking status
  await supabase
    .from("bookings")
    .update({ status: "CANCELLED" })
    .eq("id", bookingId)
  
  // Free the spot
  await supabase
    .from("parking_spots")
    .update({ status: "FREE" })
    .eq("id", booking.spot_id)
  
  revalidatePath("/")
  return { success: true }
}

// Get booking history
export async function getBookingHistory() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return []
  }
  
  const { data } = await supabase
    .from("bookings")
    .select(`
      *,
      parking_spots (spot_number)
    `)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(20)
  
  return data || []
}
