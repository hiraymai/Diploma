"use client"

import { useState } from "react"
import { useParking } from "@/lib/parking-context"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { ArrowLeft, MapPin, Clock, Calendar, Car, Check } from "lucide-react"
import { cn } from "@/lib/utils"

const rentalOptions = [
  { days: 1, price: 700, perDay: 700 },
  { days: 3, price: 1800, perDay: 600 },
  { days: 5, price: 2700, perDay: 540 },
  { days: 7, price: 3500, perDay: 500 },
  { days: 14, price: 6000, perDay: 429 },
]

export function SpotDetailsScreen() {
  const { selectedSpot, user, setCurrentScreen, setActiveBooking, updateSpot, darkMode, t } = useParking()
  const [selectedCar, setSelectedCar] = useState(user?.cars[0]?.id || "")
  const [selectedRentalDays, setSelectedRentalDays] = useState<number | null>(null)
  const [isBooking, setIsBooking] = useState(false)

  const navItems = [
    { id: "home", icon: "/Home_light.svg", activeIcon: "/Home_light_active.svg", labelKey: "home" as const, active: false },
    { id: "map", icon: "/Map_light.svg", activeIcon: "/Map_light_active.svg", labelKey: "map" as const, active: true },
    { id: "booking", icon: "/Component.svg", activeIcon: "/Component_active.svg", labelKey: "booking" as const, active: false },
    { id: "wallet", icon: "/wallet.svg", activeIcon: "/wallet_active.svg", labelKey: "wallet" as const, active: false },
    { id: "profile", icon: "/User_cicrle_light.svg", activeIcon: "/User_cicrle_light_active.svg", labelKey: "profile" as const, active: false },
  ]
  
  if (!selectedSpot) {
    return (
      <div className={`flex h-full items-center justify-center p-4 ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <p className={darkMode ? 'text-gray-400' : 'text-gray-500'}>No spot selected</p>
      </div>
    )
  }
  
  const isLongTerm = selectedSpot.type === "long-term"
  const selectedCarData = user?.cars.find(c => c.id === selectedCar)
  
  const handleBookNow = () => {
    if (!selectedCarData || !user) return
    
    setIsBooking(true)
    
    setTimeout(() => {
      const booking = {
        id: `booking-${Date.now()}`,
        spotId: selectedSpot.id,
        userId: user.id,
        plateNumber: selectedCarData.plateNumber,
        type: selectedSpot.type,
        status: "active" as const,
        startTime: new Date(),
        isPaid: false,
        waitingFee: 0,
        rentalDays: selectedRentalDays || undefined,
      }
      
      setActiveBooking(booking)
      updateSpot(selectedSpot.id, { 
        status: isLongTerm ? "RESERVED" : "BOOKED",
        bookedBy: user.id,
        plateNumber: selectedCarData.plateNumber,
        bookedAt: new Date(),
      })
      
      setIsBooking(false)
      setCurrentScreen("booking-confirm")
    }, 1500)
  }
  
  const getRentalPrice = () => {
    if (!isLongTerm) return 150
    const option = rentalOptions.find(o => o.days === selectedRentalDays)
    return option?.price || 0
  }
  
  return (
    <div className={`flex flex-col gap-4 p-4 pb-24 ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => setCurrentScreen("map")}
          className={`h-10 w-10 ${darkMode ? 'hover:bg-gray-800 text-white' : 'hover:bg-[#354469]/10'}`}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1 text-center">
          <h1 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Spot {selectedSpot.id}</h1>
          <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            {isLongTerm ? t.longTermReservation : t.shortTermParking}
          </p>
        </div>
        <div className="w-10" />
      </div>
      
      {/* Spot Info Card */}
      <Card className={darkMode ? 'bg-gray-800 border-gray-700' : ''}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`flex h-14 w-14 items-center justify-center rounded-xl ${darkMode ? 'bg-green-900/30' : 'bg-green-100'}`}>
                <MapPin className={`h-7 w-7 ${darkMode ? 'text-green-400' : 'text-green-600'}`} />
              </div>
              <div>
                <p className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{selectedSpot.id}</p>
                <Badge variant="secondary" className={darkMode ? 'bg-gray-700 text-gray-300' : ''}>
                  {isLongTerm ? t.longTerm : t.shortTerm}
                </Badge>
              </div>
            </div>
            <div className="text-right">
              <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Starting from</p>
              <p className={`text-xl font-bold ${darkMode ? 'text-blue-400' : 'text-[#36549B]'}`}>
                {isLongTerm ? "700" : "150"} &#8376;
              </p>
              <p className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                {isLongTerm ? "per day" : "first hour"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Select Vehicle */}
      <Card className={darkMode ? 'bg-gray-800 border-gray-700' : ''}>
        <CardHeader className="pb-2">
          <CardTitle className={`flex items-center gap-2 text-base ${darkMode ? 'text-white' : ''}`}>
            <Car className="h-5 w-5" />
            {t.vehicle}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {user?.cars.map((car) => (
            <button
              key={car.id}
              onClick={() => setSelectedCar(car.id)}
              className={cn(
                "flex w-full items-center justify-between rounded-lg border-2 p-3 transition-all",
                selectedCar === car.id 
                  ? darkMode ? "border-blue-500 bg-blue-900/20" : "border-primary bg-primary/5" 
                  : darkMode ? "border-gray-600 hover:border-blue-500/50" : "border-border hover:border-primary/50"
              )}
            >
              <div className="text-left">
                <p className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>{car.brand} {car.model}</p>
                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{car.plateNumber}</p>
              </div>
              {selectedCar === car.id && (
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[#354469]">
                  <Check className="h-4 w-4 text-white" />
                </div>
              )}
            </button>
          ))}
        </CardContent>
      </Card>
      
      {/* Rental Period (Long-term only) */}
      {isLongTerm && (
        <Card className={darkMode ? 'bg-gray-800 border-gray-700' : ''}>
          <CardHeader className="pb-2">
            <CardTitle className={`flex items-center gap-2 text-base ${darkMode ? 'text-white' : ''}`}>
              <Calendar className="h-5 w-5" />
              {t.rentalPeriod}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {rentalOptions.map((option) => (
              <button
                key={option.days}
                onClick={() => setSelectedRentalDays(option.days)}
                className={cn(
                  "flex w-full items-center justify-between rounded-lg border-2 p-3 transition-all",
                  selectedRentalDays === option.days 
                    ? darkMode ? "border-blue-500 bg-blue-900/20" : "border-primary bg-primary/5" 
                    : darkMode ? "border-gray-600 hover:border-blue-500/50" : "border-border hover:border-primary/50"
                )}
              >
                <div className="text-left">
                  <p className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    {option.days} {option.days === 1 ? "day" : "days"}
                  </p>
                  <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    {option.perDay} &#8376;/day
                  </p>
                </div>
                <div className="text-right">
                  <p className={`font-bold ${darkMode ? 'text-blue-400' : 'text-[#36549B]'}`}>{option.price.toLocaleString()} &#8376;</p>
                  {selectedRentalDays === option.days && (
                    <Badge variant="outline" className={`mt-1 ${darkMode ? 'border-gray-600 text-gray-300' : ''}`}>Selected</Badge>
                  )}
                </div>
              </button>
            ))}
          </CardContent>
        </Card>
      )}
      
      {/* Short-term Info */}
      {!isLongTerm && (
        <Card className={darkMode ? 'bg-gray-800/50 border-gray-700' : 'bg-gray-100/50'}>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Clock className={`h-5 w-5 ${darkMode ? 'text-blue-400' : 'text-[#36549B]'}`} />
              <h3 className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>Pricing</h3>
            </div>
            <ul className={`space-y-1 text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              <li>{t.firstHourMin}: 150 &#8376;</li>
              <li>After first hour: 3 &#8376;/minute</li>
              <li>15 min arrival window (free)</li>
              <li>Extended waiting: +75 &#8376; for 30 min</li>
            </ul>
          </CardContent>
        </Card>
      )}
      
      {/* Summary */}
      <Card className={darkMode ? 'bg-gray-800 border-gray-700' : ''}>
        <CardContent className="p-4">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className={darkMode ? 'text-gray-400' : 'text-gray-500'}>Spot</span>
              <span className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>{selectedSpot.id}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className={darkMode ? 'text-gray-400' : 'text-gray-500'}>{t.vehicle}</span>
              <span className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>{selectedCarData?.plateNumber || "-"}</span>
            </div>
            {isLongTerm && selectedRentalDays && (
              <div className="flex justify-between text-sm">
                <span className={darkMode ? 'text-gray-400' : 'text-gray-500'}>{t.rentalPeriod}</span>
                <span className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>{selectedRentalDays} days</span>
              </div>
            )}
            <Separator className={`my-2 ${darkMode ? 'bg-gray-700' : ''}`} />
            <div className="flex justify-between">
              <span className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                {isLongTerm ? t.total : "Starting from"}
              </span>
              <span className={`text-lg font-bold ${darkMode ? 'text-blue-400' : 'text-[#36549B]'}`}>
                {getRentalPrice().toLocaleString()} &#8376;
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Book Button */}
      <Button 
        size="lg" 
        className="w-full bg-[#354469] hover:bg-[#354469]/90"
        onClick={handleBookNow}
        disabled={!selectedCar || (isLongTerm && !selectedRentalDays) || isBooking}
      >
        {isBooking ? t.processing : isLongTerm ? "Reserve & Pay Now" : t.bookNow}
      </Button>
    
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
