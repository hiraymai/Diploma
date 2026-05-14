"use client"

import { ParkingProvider, useParking } from "@/lib/parking-context"
import { MobileShell } from "@/components/mobile-shell"
import { AuthScreen } from "@/components/screens/auth-screen"
import { HomeScreen } from "@/components/screens/home-screen"
import { MapScreen } from "@/components/screens/map-screen"
import { SpotDetailsScreen } from "@/components/screens/spot-details-screen"
import { BookingConfirmScreen } from "@/components/screens/booking-confirm-screen"
import { ActiveBookingScreen } from "@/components/screens/active-booking-screen"
import { WalletScreen } from "@/components/screens/wallet-screen"
import { ProfileScreen } from "@/components/screens/profile-screen"
import { Loader2 } from "lucide-react"
import Image from "next/image"

function AppContent() {
  const { currentScreen, isAuthenticated, isLoading, darkMode, t } = useParking()
  
  // Loading state
  if (isLoading) {
    return (
      <MobileShell>
        <div className={`flex flex-col items-center justify-center h-full ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
          <Loader2 className={`w-12 h-12 animate-spin ${darkMode ? 'text-white' : 'text-[#495E8E]'}`} />
          <p className={`mt-4 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{t.loading}</p>
        </div>
      </MobileShell>
    )
  }
  
  // Auth screen (full screen, no mobile shell)
  if (!isAuthenticated) {
    return (
      <MobileShell>
        <AuthScreen />
      </MobileShell>
    )
  }
  
  // Main app screens
  const renderScreen = () => {
    switch (currentScreen) {
      case "home":
        return <HomeScreen />
      case "map":
        return <MapScreen />
      case "spot-details":
        return <SpotDetailsScreen />
      case "booking-confirm":
        return <BookingConfirmScreen />
      case "booking":
      case "active-booking":
        return <ActiveBookingScreen />
      case "wallet":
        return <WalletScreen />
      case "profile":
        return <ProfileScreen />
      default:
        return <HomeScreen />
    }
  }
  
  return (
    <MobileShell>
      {renderScreen()}
    </MobileShell>
  )
}

export default function SmartParkingApp() {
  return (
    <ParkingProvider>
      <main className="flex min-h-screen items-center justify-center bg-foreground/5 p-4">
        <AppContent />
      </main>
    </ParkingProvider>
  )
}
