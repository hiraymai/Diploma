"use client"

import { createContext, useContext, useState, useEffect, useRef, type ReactNode } from "react"
import { io, Socket } from "socket.io-client"

export type SpotStatus = "FREE" | "BOOKED" | "OCCUPIED" | "RESERVED" | "REPAIR"

export interface ParkingSpot {
  id: string
  number: number
  status: SpotStatus
  type: "short-term" | "long-term"
  bookedBy?: string
  plateNumber?: string
  bookedAt?: Date
  expiresAt?: Date
}

export interface Car {
  id: string
  brand: string
  model: string
  plateNumber: string
}

export interface Transaction {
  id: string
  type: "topup_stripe" | "parking_charge" | "longterm_charge" | "waiting_fee" | "bonus_credit" | "promo_discount" | "DEPOSIT" | "WITHDRAWAL" | "PAYMENT" | "REFUND" | "CASHBACK" | "PROMO"
  amount: number
  description: string
  date: Date
}

export interface User {
  id: string
  phone: string
  phoneNumber?: string
  name: string
  firstName?: string
  lastName?: string
  balance: number
  walletBalance?: number
  bonusPoints: number
  noShowCount: number
  isBanned: boolean
  bannedUntil?: Date
  cars: Car[]
  transactions: Transaction[]
  promoCode?: string
}

export interface Booking {
  id: string
  spotId: string
  userId: string
  plateNumber: string
  type: "short-term" | "long-term"
  status: "active" | "completed" | "cancelled"
  startTime: Date
  endTime?: Date
  totalAmount?: number
  isPaid: boolean
  waitingFee: number
  rentalDays?: number
}

interface ParkingContextType {
  // App state
  currentScreen: string
  setCurrentScreen: (screen: string) => void
  isAuthenticated: boolean
  setIsAuthenticated: (auth: boolean) => void

  // Auth token
  authToken: string | null
  setAuthToken: (token: string | null) => void

  // User
  user: User | null
  setUser: (user: User | null) => void

  // Parking spots
  spots: ParkingSpot[]
  setSpots: (spots: ParkingSpot[]) => void
  updateSpot: (spotId: string, updates: Partial<ParkingSpot>) => void

  // Bookings
  activeBooking: Booking | null
  setActiveBooking: (booking: Booking | null) => void
  bookings: Booking[]
  setBookings: (bookings: Booking[]) => void

  // Selected spot for booking
  selectedSpot: ParkingSpot | null
  setSelectedSpot: (spot: ParkingSpot | null) => void

  // Admin mode
  isAdminMode: boolean
  setIsAdminMode: (admin: boolean) => void

  // API helper
  apiCall: (url: string, options?: RequestInit) => Promise<Response>
  fetchSpots: () => Promise<void>
}

const ParkingContext = createContext<ParkingContextType | undefined>(undefined)

// Generate initial parking spots (used only as fallback before real data loads)
const generateInitialSpots = (): ParkingSpot[] => {
  const spots: ParkingSpot[] = []

  for (let i = 1; i <= 15; i++) {
    spots.push({
      id: `SP-${String(i).padStart(2, "0")}`,
      number: i,
      status: "FREE",
      type: "short-term",
    })
  }

  for (let i = 16; i <= 30; i++) {
    spots.push({
      id: `SP-${String(i).padStart(2, "0")}`,
      number: i,
      status: i === 22 ? "REPAIR" : "FREE",
      type: "long-term",
    })
  }

  return spots
}

// Map backend spot to frontend ParkingSpot shape
function mapBackendSpot(s: any): ParkingSpot {
  return {
    id: s.spotNumber,
    number: parseInt(s.spotNumber.replace("SP-", ""), 10),
    status: s.status as SpotStatus,
    type: s.type === "LONG_TERM" ? "long-term" : "short-term",
    plateNumber: s.carPlate !== "-" ? s.carPlate : undefined,
  }
}

// Map backend user object to frontend User shape
function mapBackendUser(backendUser: any): User {
  return {
    id: backendUser.id,
    phone: backendUser.phoneNumber || backendUser.phone || "",
    phoneNumber: backendUser.phoneNumber,
    name: [backendUser.firstName, backendUser.lastName].filter(Boolean).join(" ") || backendUser.phoneNumber || "User",
    firstName: backendUser.firstName,
    lastName: backendUser.lastName,
    balance: backendUser.walletBalance ?? backendUser.balance ?? 0,
    walletBalance: backendUser.walletBalance,
    bonusPoints: 0,
    noShowCount: backendUser.noShowCount ?? 0,
    isBanned: backendUser.isBanned ?? false,
    bannedUntil: backendUser.bannedUntil ? new Date(backendUser.bannedUntil) : undefined,
    cars: backendUser.carPlate
      ? [{ id: "car-1", brand: "", model: "", plateNumber: backendUser.carPlate }]
      : [],
    transactions: (backendUser.transactions || []).map((t: any) => ({
      id: t.id,
      type: t.type,
      amount: t.amount,
      description: t.description || "",
      date: new Date(t.createdAt),
    })),
    promoCode: undefined,
  }
}

export function ParkingProvider({ children }: { children: ReactNode }) {
  const [currentScreen, setCurrentScreen] = useState("home")
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [authToken, setAuthTokenState] = useState<string | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [spots, setSpots] = useState<ParkingSpot[]>(generateInitialSpots())
  const [activeBooking, setActiveBooking] = useState<Booking | null>(null)
  const [bookings, setBookings] = useState<Booking[]>([])
  const [selectedSpot, setSelectedSpot] = useState<ParkingSpot | null>(null)
  const [isAdminMode, setIsAdminMode] = useState(false)
  const socketRef = useRef<Socket | null>(null)

  const setAuthToken = (token: string | null) => {
    setAuthTokenState(token)
    if (token) {
      localStorage.setItem("auth_token", token)
    } else {
      localStorage.removeItem("auth_token")
    }
  }

  // Fetch all spots from backend and update state
  const fetchSpots = async () => {
    try {
      const res = await fetch("/backend/parking/spots/simple")
      if (res.ok) {
        const data = await res.json()
        setSpots(data.map(mapBackendSpot))
      }
    } catch {
      // backend unavailable — keep current state
    }
  }

  // apiCall helper that injects Authorization header
  const apiCall = (url: string, options: RequestInit = {}): Promise<Response> => {
    const token = authToken || (typeof window !== "undefined" ? localStorage.getItem("auth_token") : null)
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...(options.headers as Record<string, string> || {}),
    }
    if (token) {
      headers["Authorization"] = `Bearer ${token}`
    }
    return fetch(url, { ...options, headers })
  }

  // On mount: connect to Socket.io and load real spots
  useEffect(() => {
    fetchSpots()

    const socket = io("http://localhost:3001", { transports: ["websocket", "polling"] })
    socketRef.current = socket

    // Re-fetch spots on any parking event to stay in sync
    const refreshEvents = [
      "booking-created",
      "booking-completed",
      "booking-cancelled",
      "booking-extended",
      "rental-created",
      "spot-updated",
    ]
    refreshEvents.forEach((event) => socket.on(event, fetchSpots))

    return () => {
      socket.disconnect()
      socketRef.current = null
    }
  }, [])

  // On mount: restore session from localStorage
  useEffect(() => {
    const savedToken = localStorage.getItem("auth_token")
    if (savedToken) {
      setAuthTokenState(savedToken)
      // Fetch user profile
      fetch("/backend/auth/me", {
        headers: {
          "Authorization": `Bearer ${savedToken}`,
          "Content-Type": "application/json",
        },
      })
        .then((r) => r.ok ? r.json() : null)
        .then((data) => {
          if (data && data.id) {
            setUser(mapBackendUser(data))
            setIsAuthenticated(true)
          } else {
            // Token invalid — clear it
            localStorage.removeItem("auth_token")
            setAuthTokenState(null)
          }
        })
        .catch(() => {
          localStorage.removeItem("auth_token")
          setAuthTokenState(null)
        })
    }
  }, [])

  const updateSpot = (spotId: string, updates: Partial<ParkingSpot>) => {
    setSpots(prev => prev.map(spot =>
      spot.id === spotId ? { ...spot, ...updates } : spot
    ))
  }

  return (
    <ParkingContext.Provider value={{
      currentScreen,
      setCurrentScreen,
      isAuthenticated,
      setIsAuthenticated,
      authToken,
      setAuthToken,
      user,
      setUser,
      spots,
      setSpots,
      updateSpot,
      activeBooking,
      setActiveBooking,
      bookings,
      setBookings,
      selectedSpot,
      setSelectedSpot,
      isAdminMode,
      setIsAdminMode,
      apiCall,
      fetchSpots,
    }}>
      {children}
    </ParkingContext.Provider>
  )
}

export function useParking() {
  const context = useContext(ParkingContext)
  if (context === undefined) {
    throw new Error("useParking must be used within a ParkingProvider")
  }
  return context
}

// Export mapBackendUser for use in other components
export { mapBackendUser }
