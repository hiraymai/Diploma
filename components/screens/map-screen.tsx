"use client"

import { useParking, type SpotStatus } from "@/lib/parking-context"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { Car, Wrench, Clock, Check, AlertCircle, ArrowLeft } from "lucide-react"

export function MapScreen() {
  const { spots, setSelectedSpot, setCurrentScreen, darkMode, t } = useParking()
  
  const shortTermSpots = spots.filter(s => s.type === "short-term")
  const longTermSpots = spots.filter(s => s.type === "long-term")

  const statusConfig: Record<SpotStatus, { 
    color: string; 
    darkColor: string;
    bg: string; 
    darkBg: string;
    borderColor: string;
    darkBorderColor: string;
    icon: React.ComponentType<{ className?: string }>; 
    labelKey: "free" | "booked" | "occupied" | "reserved" | "repair"
  }> = {
    FREE: { color: "text-green-600", darkColor: "text-green-400", bg: "bg-green-50", darkBg: "bg-green-900/30", borderColor: "border-green-500", darkBorderColor: "border-green-600", icon: Check, labelKey: "free" },
    BOOKED: { color: "text-blue-600", darkColor: "text-blue-400", bg: "bg-blue-50", darkBg: "bg-blue-900/30", borderColor: "border-blue-500", darkBorderColor: "border-blue-600", icon: Clock, labelKey: "booked" },
    OCCUPIED: { color: "text-gray-600", darkColor: "text-gray-400", bg: "bg-gray-50", darkBg: "bg-gray-800", borderColor: "border-gray-500", darkBorderColor: "border-gray-600", icon: Car, labelKey: "occupied" },
    RESERVED: { color: "text-orange-600", darkColor: "text-orange-400", bg: "bg-orange-50", darkBg: "bg-orange-900/30", borderColor: "border-orange-500", darkBorderColor: "border-orange-600", icon: AlertCircle, labelKey: "reserved" },
    REPAIR: { color: "text-red-600", darkColor: "text-red-400", bg: "bg-red-50", darkBg: "bg-red-900/30", borderColor: "border-red-500", darkBorderColor: "border-red-600", icon: Wrench, labelKey: "repair" },
  }
  
  const handleSpotClick = (spotId: string) => {
    const spot = spots.find(s => s.id === spotId)
    if (spot && spot.status === "FREE") {
      setSelectedSpot(spot)
      setCurrentScreen("spot-details")
    }
  }

  const navItems = [
    { id: "home", icon: "/Home_light.svg", activeIcon: "/Home_light_active.svg", labelKey: "home" as const, active: false },
    { id: "map", icon: "/Map_light.svg", activeIcon: "/Map_light_active.svg", labelKey: "map" as const, active: true },
    { id: "booking", icon: "/Component.svg", activeIcon: "/Component_active.svg", labelKey: "booking" as const, active: false },
    { id: "wallet", icon: "/wallet.svg", activeIcon: "/wallet_active.svg", labelKey: "wallet" as const, active: false },
    { id: "profile", icon: "/User_cicrle_light.svg", activeIcon: "/User_cicrle_light_active.svg", labelKey: "profile" as const, active: false },
  ]
  
  return (
    <div className={`relative mx-auto max-w-md min-h-screen ${darkMode ? 'bg-gray-900' : 'bg-gray-50'} overflow-hidden`}>
      {/* Header */}
      <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} shadow-sm px-4 py-3`}>
        <div className="flex items-center justify-between">
          <button 
            onClick={() => setCurrentScreen("home")}
            className={`p-2 rounded-lg ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'} transition-colors`}
          >
            <ArrowLeft className={`h-5 w-5 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`} />
          </button>
          <div className="text-center">
            <h1 className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{t.parkingMap}</h1>
            <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Astana, Central Location - 30 {t.spots}</p>
          </div>
          <div className="w-9" />
        </div>
      </div>
      
      {/* Legend */}
      <div className={`px-4 py-3 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border-b`}>
        <div className="flex flex-wrap gap-2 justify-center">
          {Object.entries(statusConfig).map(([status, config]) => (
            <Badge 
              key={status} 
              variant="outline" 
              className={`gap-1.5 px-3 py-1.5 text-xs rounded-full ${darkMode ? 'border-gray-600 text-gray-300' : 'border-gray-300 text-gray-700'}`}
            >
              <config.icon className={`h-3 w-3 ${darkMode ? config.darkColor : config.color}`} />
              <span>{t[config.labelKey]}</span>
            </Badge>
          ))}
        </div>
      </div>
      
      {/* Main Content */}
      <div className="px-4 py-4 pb-24 space-y-6">
        {/* Short-term Section */}
        <div>
          <div className="mb-3 flex items-center justify-between">
            <h2 className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{t.shortTerm} (SP-01 to SP-15)</h2>
            <Badge variant="secondary" className={`${darkMode ? 'bg-blue-900/50 text-blue-300 border-blue-700' : 'bg-blue-100 text-blue-800 border-blue-200'}`}>150₸/hr</Badge>
          </div>
          <div className="grid grid-cols-5 gap-2">
            {shortTermSpots.map((spot) => {
              const config = statusConfig[spot.status]
              const Icon = config.icon
              const isClickable = spot.status === "FREE"
              
              return (
                <button
                  key={spot.id}
                  onClick={() => handleSpotClick(spot.id)}
                  disabled={!isClickable}
                  className={cn(
                    "relative flex h-12 flex-col items-center justify-center rounded-lg border transition-all",
                    isClickable && "cursor-pointer hover:scale-105 hover:shadow-md",
                    !isClickable && "cursor-not-allowed opacity-70",
                    darkMode ? config.darkBg : config.bg,
                    darkMode ? config.darkBorderColor : config.borderColor
                  )}
                >
                  <Icon className={cn("h-3 w-3", darkMode ? config.darkColor : config.color)} />
                  <span className={`mt-0.5 text-[9px] font-medium ${darkMode ? 'text-gray-300' : 'text-gray-800'}`}>{spot.number}</span>
                  {spot.status === "FREE" && (
                    <div className="absolute bottom-0.5 w-1 h-1 bg-green-500 rounded-full" />
                  )}
                </button>
              )
            })}
          </div>
        </div>
        
        {/* Long-term Section */}
        <div>
          <div className="mb-3 flex items-center justify-between">
            <h2 className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{t.longTerm} (SP-16 to SP-30)</h2>
            <Badge variant="secondary" className={`${darkMode ? 'bg-blue-900/50 text-blue-300 border-blue-700' : 'bg-blue-100 text-blue-800 border-blue-200'}`}>700₸/day</Badge>
          </div>
          <div className="grid grid-cols-5 gap-2">
            {longTermSpots.map((spot) => {
              const config = statusConfig[spot.status]
              const Icon = config.icon
              const isClickable = spot.status === "FREE"
              
              return (
                <button
                  key={spot.id}
                  onClick={() => handleSpotClick(spot.id)}
                  disabled={!isClickable}
                  className={cn(
                    "relative flex h-12 flex-col items-center justify-center rounded-lg border transition-all",
                    isClickable && "cursor-pointer hover:scale-105 hover:shadow-md",
                    !isClickable && "cursor-not-allowed opacity-70",
                    darkMode ? config.darkBg : config.bg,
                    darkMode ? config.darkBorderColor : config.borderColor
                  )}
                >
                  <Icon className={cn("h-3 w-3", darkMode ? config.darkColor : config.color)} />
                  <span className={`mt-0.5 text-[9px] font-medium ${darkMode ? 'text-gray-300' : 'text-gray-800'}`}>{spot.number}</span>
                  {spot.status === "FREE" && (
                    <div className="absolute bottom-0.5 w-1 h-1 bg-green-500 rounded-full" />
                  )}
                </button>
              )
            })}
          </div>
        </div>
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
