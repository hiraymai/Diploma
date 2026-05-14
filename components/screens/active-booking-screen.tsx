"use client"

import { useState, useEffect } from "react"
import { useParking } from "@/lib/parking-context"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { MapPin, Car, Clock, AlertTriangle, CreditCard, Camera } from "lucide-react"

export function ActiveBookingScreen() {
  const { activeBooking, selectedSpot, user, setCurrentScreen, setActiveBooking, updateSpot, setUser, darkMode, t } = useParking()
  const [timer, setTimer] = useState(15 * 60)
  const [isArrived, setIsArrived] = useState(false)
  const [parkingDuration, setParkingDuration] = useState(0)
  const [isPaying, setIsPaying] = useState(false)
  
  const selectedCar = user?.cars.find(c => c.plateNumber === activeBooking?.plateNumber)
  const isLongTerm = selectedSpot?.type === "long-term"

  const navItems = [
    { id: "home", icon: "/Home_light.svg", activeIcon: "/Home_light_active.svg", labelKey: "home" as const, active: false },
    { id: "map", icon: "/Map_light.svg", activeIcon: "/Map_light_active.svg", labelKey: "map" as const, active: false },
    { id: "booking", icon: "/Component.svg", activeIcon: "/Component_active.svg", labelKey: "booking" as const, active: true },
    { id: "wallet", icon: "/wallet.svg", activeIcon: "/wallet_active.svg", labelKey: "wallet" as const, active: false },
    { id: "profile", icon: "/User_cicrle_light.svg", activeIcon: "/User_cicrle_light_active.svg", labelKey: "profile" as const, active: false },
  ]
  
  useEffect(() => {
    if (!isArrived && !isLongTerm && timer > 0) {
      const interval = setInterval(() => {
        setTimer(prev => prev - 1)
      }, 1000)
      return () => clearInterval(interval)
    }
  }, [timer, isArrived, isLongTerm])
  
  useEffect(() => {
    if (isArrived && !isLongTerm) {
      const interval = setInterval(() => {
        setParkingDuration(prev => prev + 1)
      }, 1000)
      return () => clearInterval(interval)
    }
  }, [isArrived, isLongTerm])
  
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }
  
  const calculateCost = () => {
    if (isLongTerm) return 0
    const minutes = Math.ceil(parkingDuration / 60)
    if (minutes <= 60) return 150
    const extraMinutes = minutes - 60
    return 150 + (extraMinutes * 3)
  }
  
  const simulateArrival = () => {
    setIsArrived(true)
    if (selectedSpot) {
      updateSpot(selectedSpot.id, { status: "OCCUPIED" })
    }
  }
  
  const handlePayAndExit = () => {
    if (!user) return
    
    setIsPaying(true)
    const cost = calculateCost()
    
    setTimeout(() => {
      setUser({
        ...user,
        balance: user.balance - cost,
        transactions: [
          { 
            id: `t-${Date.now()}`, 
            type: "parking_charge", 
            amount: -cost, 
            description: `Parking ${activeBooking?.spotId}`, 
            date: new Date() 
          },
          ...user.transactions
        ]
      })
      
      if (selectedSpot) {
        updateSpot(selectedSpot.id, { status: "FREE", bookedBy: undefined, plateNumber: undefined })
      }
      setActiveBooking(null)
      setCurrentScreen("home")
      setIsPaying(false)
    }, 1500)
  }
  
  const handleCancelBooking = () => {
    if (selectedSpot) {
      updateSpot(selectedSpot.id, { status: "FREE", bookedBy: undefined, plateNumber: undefined })
    }
    setActiveBooking(null)
    setCurrentScreen("home")
  }
  
  if (!activeBooking) {
    return (
      <div className={`flex h-full flex-col items-center justify-center gap-4 p-4 ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <div className={`flex h-16 w-16 items-center justify-center rounded-full ${darkMode ? 'bg-gray-800' : 'bg-gray-100'}`}>
          <Car className={`h-8 w-8 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`} />
        </div>
        <p className={`${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{t.noActiveBooking}</p>
        <Button onClick={() => setCurrentScreen("map")} className="bg-[#354469] hover:bg-[#354469]/90">{t.findParkingBtn}</Button>
        
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
  
  return (
    <div className={`flex flex-col gap-4 p-4 pb-24 ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="w-16" />
        <div className="flex-1 text-center">
          <h1 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{t.activeBookingTitle}</h1>
          <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            {isLongTerm ? t.longTermReservation : t.shortTermParking}
          </p>
        </div>
        <div className="w-16 flex justify-end">
          <Badge 
            variant={isArrived ? "default" : "secondary"}
            className={isArrived ? "bg-green-600" : darkMode ? "bg-gray-700 text-gray-300" : ""}
          >
            {isArrived ? t.parked : t.enRoute}
          </Badge>
        </div>
      </div>
      
      {/* Timer Card */}
      {!isLongTerm && !isArrived && (
        <Card className={`${timer < 300 ? (darkMode ? 'border-red-700 bg-red-900/20' : 'border-destructive bg-destructive/5') : (darkMode ? 'border-red-700 bg-red-900/20' : 'border-red-200 bg-red-50')}`}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {timer < 300 ? (
                  <AlertTriangle className={`h-8 w-8 ${darkMode ? 'text-red-400' : 'text-destructive'}`} />
                ) : (
                  <Clock className={`h-8 w-8 ${darkMode ? 'text-red-400' : 'text-red-600'}`} />
                )}
                <div>
                  <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{t.timeToArrive}</p>
                  <p className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{formatTime(timer)}</p>
                </div>
              </div>
              <Button variant="outline" size="sm" className={`${darkMode ? 'hover:bg-gray-700 hover:text-white border-gray-600' : 'hover:bg-[#36549B]/10 hover:border-[#36549B] hover:text-[#36549B]'}`} onClick={simulateArrival}>
                {t.simulateArrival}
              </Button>
            </div>
            {timer < 300 && (
              <p className={`mt-2 text-sm ${darkMode ? 'text-red-400' : 'text-destructive'}`}>
                {t.hurry}
              </p>
            )}
          </CardContent>
        </Card>
      )}
      
      {/* Parking Duration (when arrived) */}
      {!isLongTerm && isArrived && (
        <Card className={`${darkMode ? 'border-blue-700 bg-blue-900/20' : 'border-[#36549B] bg-[#36549B]/5'}`}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Clock className={`h-8 w-8 ${darkMode ? 'text-blue-400' : 'text-[#36549B]'}`} />
                <div>
                  <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{t.parkingDuration}</p>
                  <p className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{formatTime(parkingDuration)}</p>
                </div>
              </div>
              <div className="text-right">
                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{t.currentCost}</p>
                <p className={`text-2xl font-bold ${darkMode ? 'text-blue-400' : 'text-[#36549B]'}`}>{calculateCost()} &#8376;</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* Long-term Rental Info */}
      {isLongTerm && (
        <Card className={`${darkMode ? 'border-orange-700 bg-orange-900/20' : 'border-orange-300 bg-orange-50'}`}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Clock className={`h-8 w-8 ${darkMode ? 'text-orange-400' : 'text-orange-500'}`} />
                <div>
                  <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{t.rentalPeriod}</p>
                  <p className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{activeBooking.rentalDays} {t.daysRemaining}</p>
                </div>
              </div>
              <Badge variant="outline" className={darkMode ? 'border-gray-600 text-gray-300' : ''}>{t.paid}</Badge>
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* Booking Details */}
      <Card className={darkMode ? 'bg-gray-800 border-gray-700' : ''}>
        <CardContent className="p-4 space-y-4">
          <div className="flex items-center gap-3">
            <div className={`flex h-12 w-12 items-center justify-center rounded-lg ${darkMode ? 'bg-blue-900/30' : 'bg-[#36549B]/10'}`}>
              <MapPin className={`h-6 w-6 ${darkMode ? 'text-blue-400' : 'text-[#36549B]'}`} />
            </div>
            <div>
              <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{t.parkingSpot}</p>
              <p className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{activeBooking.spotId}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <div className={`flex h-12 w-12 items-center justify-center rounded-lg ${darkMode ? 'bg-blue-900/30' : 'bg-[#36549B]/10'}`}>
              <Car className={`h-6 w-6 ${darkMode ? 'text-blue-400' : 'text-[#36549B]'}`} />
            </div>
            <div>
              <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{t.vehicle}</p>
              <p className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                {selectedCar?.brand} {selectedCar?.model}
              </p>
              <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{activeBooking.plateNumber}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <div className={`flex h-12 w-12 items-center justify-center rounded-lg ${darkMode ? 'bg-blue-900/30' : 'bg-[#36549B]/10'}`}>
              <Camera className={`h-6 w-6 ${darkMode ? 'text-blue-400' : 'text-[#36549B]'}`} />
            </div>
            <div>
              <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{t.entryMethod}</p>
              <p className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>{t.lprCamera}</p>
              <p className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>{t.autoPlateRecognition}</p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Cost Summary (Short-term) */}
      {!isLongTerm && isArrived && (
        <Card className={darkMode ? 'bg-gray-800 border-gray-700' : ''}>
          <CardContent className="p-4">
            <h3 className={`mb-3 font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>{t.costBreakdown}</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className={darkMode ? 'text-gray-400' : 'text-gray-500'}>{t.firstHourMin}</span>
                <span className={darkMode ? 'text-white' : 'text-gray-900'}>150 &#8376;</span>
              </div>
              {parkingDuration > 3600 && (
                <div className="flex justify-between">
                  <span className={darkMode ? 'text-gray-400' : 'text-gray-500'}>{t.extraTime} ({Math.ceil((parkingDuration - 3600) / 60)} min)</span>
                  <span className={darkMode ? 'text-white' : 'text-gray-900'}>{Math.ceil((parkingDuration - 3600) / 60) * 3} &#8376;</span>
                </div>
              )}
              <Separator className={darkMode ? 'bg-gray-700' : ''} />
              <div className="flex justify-between font-medium">
                <span className={darkMode ? 'text-white' : 'text-gray-900'}>{t.total}</span>
                <span className={darkMode ? 'text-blue-400' : 'text-[#36549B]'}>{calculateCost()} &#8376;</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* Actions */}
      <div className="space-y-2 mt-2">
        {isArrived && !isLongTerm && (
          <Button 
            size="lg" 
            className="w-full gap-2 bg-[#354469] hover:bg-[#354469]/90"
            onClick={handlePayAndExit}
            disabled={isPaying}
          >
            <CreditCard className="h-5 w-5" />
            {isPaying ? t.processing : `${t.payAndExit} ${calculateCost()} ₸`}
          </Button>
        )}
        
        {!isArrived && !isLongTerm && (
          <Button 
            variant="outline" 
            size="lg" 
            className={`w-full ${darkMode ? 'hover:bg-gray-700 hover:text-white border-gray-600' : 'hover:bg-[#36549B]/10 hover:border-[#36549B] hover:text-[#36549B]'}`}
            onClick={handleCancelBooking}
          >
            {t.cancelBooking}
          </Button>
        )}
        
        {isLongTerm && (
          <Button variant="outline" size="lg" className={`w-full ${darkMode ? 'hover:bg-gray-700 hover:text-white border-gray-600' : 'hover:bg-[#36549B]/10 hover:border-[#36549B] hover:text-[#36549B]'}`}>
            {t.extendRental}
          </Button>
        )}
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
                  className={`${item.active ? "opacity-100" : "opacity-80"} ${darkMode && !item.active ? "brightness-0 invert opacity-70" : ""}`}
                />
              </div>
              <span className={`text-xs font-medium ${item.active ? (darkMode ? "text-blue-400" : "text-[#36549B]") : darkMode ? "text-gray-300" : "text-gray-900"}`}>
                {t[item.labelKey]}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
