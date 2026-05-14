"use client"

import { useParking } from "@/lib/parking-context"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CheckCircle2, MapPin, Car, Clock, Camera } from "lucide-react"

export function BookingConfirmScreen() {
  const { activeBooking, selectedSpot, user, setCurrentScreen, darkMode, t } = useParking()
  
  const selectedCar = user?.cars.find(c => c.plateNumber === activeBooking?.plateNumber)
  const isLongTerm = selectedSpot?.type === "long-term"

  const navItems = [
    { id: "home", icon: "/Home_light.svg", activeIcon: "/Home_light_active.svg", labelKey: "home" as const, active: false },
    { id: "map", icon: "/Map_light.svg", activeIcon: "/Map_light_active.svg", labelKey: "map" as const, active: true },
    { id: "booking", icon: "/Component.svg", activeIcon: "/Component_active.svg", labelKey: "booking" as const, active: false },
    { id: "wallet", icon: "/wallet.svg", activeIcon: "/wallet_active.svg", labelKey: "wallet" as const, active: false },
    { id: "profile", icon: "/User_cicrle_light.svg", activeIcon: "/User_cicrle_light_active.svg", labelKey: "profile" as const, active: false },
  ]
  
  return (
    <div className={`flex flex-col items-center gap-6 p-4 pt-8 pb-24 ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      {/* Success Icon */}
      <div className={`flex h-20 w-20 items-center justify-center rounded-full ${darkMode ? 'bg-green-900/30' : 'bg-green-100'}`}>
        <CheckCircle2 className={`h-12 w-12 ${darkMode ? 'text-green-400' : 'text-green-600'}`} />
      </div>
      
      {/* Title */}
      <div className="text-center">
        <h1 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
          {isLongTerm ? "Reservation Confirmed!" : "Booking Confirmed!"}
        </h1>
        <p className={`mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
          {isLongTerm 
            ? "Your spot is now reserved" 
            : "You have 15 minutes to arrive"
          }
        </p>
      </div>
      
      {/* Booking Details Card */}
      <Card className={`w-full ${darkMode ? 'bg-gray-800 border-gray-700' : ''}`}>
        <CardContent className="p-4 space-y-4">
          <div className="flex items-center gap-3">
            <div className={`flex h-12 w-12 items-center justify-center rounded-lg ${darkMode ? 'bg-blue-900/30' : 'bg-[#354469]/10'}`}>
              <MapPin className={`h-6 w-6 ${darkMode ? 'text-blue-400' : 'text-[#354469]'}`} />
            </div>
            <div>
              <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{t.parkingSpot}</p>
              <p className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{activeBooking?.spotId}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <div className={`flex h-12 w-12 items-center justify-center rounded-lg ${darkMode ? 'bg-blue-900/30' : 'bg-[#354469]/10'}`}>
              <Car className={`h-6 w-6 ${darkMode ? 'text-blue-400' : 'text-[#354469]'}`} />
            </div>
            <div>
              <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{t.vehicle}</p>
              <p className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                {selectedCar?.brand} {selectedCar?.model}
              </p>
              <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{activeBooking?.plateNumber}</p>
            </div>
          </div>
          
          {!isLongTerm && (
            <div className="flex items-center gap-3">
              <div className={`flex h-12 w-12 items-center justify-center rounded-lg ${darkMode ? 'bg-red-900/30' : 'bg-red-100'}`}>
                <Clock className={`h-6 w-6 ${darkMode ? 'text-red-400' : 'text-red-600'}`} />
              </div>
              <div>
                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{t.timeToArrive}</p>
                <p className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>15:00 {t.remaining}</p>
                <p className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>Arrive within 15 minutes</p>
              </div>
            </div>
          )}
          
          {isLongTerm && activeBooking?.rentalDays && (
            <div className="flex items-center gap-3">
              <div className={`flex h-12 w-12 items-center justify-center rounded-lg ${darkMode ? 'bg-orange-900/30' : 'bg-orange-100'}`}>
                <Clock className={`h-6 w-6 ${darkMode ? 'text-orange-400' : 'text-orange-500'}`} />
              </div>
              <div>
                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{t.rentalPeriod}</p>
                <p className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>{activeBooking.rentalDays} days</p>
                <p className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>Unlimited entries & exits</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* LPR Info */}
      <Card className={`w-full ${darkMode ? 'bg-gray-800/50 border-gray-700' : 'bg-gray-100/50'}`}>
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <Camera className={`h-6 w-6 ${darkMode ? 'text-blue-400' : 'text-[#354469]'}`} />
            <div>
              <p className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>{t.lprCamera}</p>
              <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                {t.autoPlateRecognition}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Actions */}
      <div className="w-full space-y-2">
        <Button 
          className="w-full bg-[#354469] hover:bg-[#354469]/90" 
          size="lg"
          onClick={() => setCurrentScreen("active-booking")}
        >
          View {t.activeBooking}
        </Button>
        <Button 
          variant="outline" 
          className={`w-full ${darkMode ? 'border-gray-600 hover:bg-gray-800 hover:text-white' : 'hover:bg-[#354469]/10 hover:border-[#354469] hover:text-[#354469]'}`}
          size="lg"
          onClick={() => setCurrentScreen("home")}
        >
          Back to {t.home}
        </Button>
      </div>
      
      {/* Bottom Navigation */}
      <div className={`absolute bottom-0 left-0 right-0 h-20 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-300'} border-t z-50 shadow-lg`}>
        <div className="flex justify-around items-center h-full px-4">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setCurrentScreen(item.id)}
              className={`flex flex-col items-center justify-center gap-0.5 p-3 transition-all ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'} rounded-xl active:scale-95`}
            >
              <div className="w-8 h-8 flex items-center justify-center">
                <img 
                  src={item.active ? item.activeIcon : item.icon} 
                  alt={t[item.labelKey]} 
                  width={28}
                  height={28}
                  className={item.active ? "opacity-100" : "opacity-80"}
                />
              </div>
              <span className={`text-xs font-medium ${item.active ? "text-[#36549B]" : darkMode ? "text-gray-300" : "text-gray-900"}`}>
                {t[item.labelKey]}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
