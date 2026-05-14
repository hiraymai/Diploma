"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

// Get user's cars
export async function getUserCars() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return []
  }
  
  const { data } = await supabase
    .from("cars")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
  
  return data || []
}

// Add a car
export async function addCar(data: {
  brand: string
  model: string
  plateNumber: string
}) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return { success: false, error: "Not authenticated" }
  }
  
  const { data: car, error } = await supabase
    .from("cars")
    .insert({
      user_id: user.id,
      brand: data.brand,
      model: data.model,
      plate_number: data.plateNumber,
    })
    .select()
    .single()
  
  if (error) {
    return { success: false, error: error.message }
  }
  
  revalidatePath("/")
  return { success: true, car }
}

// Delete a car
export async function deleteCar(carId: string) {
  const supabase = await createClient()
  
  const { error } = await supabase
    .from("cars")
    .delete()
    .eq("id", carId)
  
  if (error) {
    return { success: false, error: error.message }
  }
  
  revalidatePath("/")
  return { success: true }
}
