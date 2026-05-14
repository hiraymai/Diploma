"use client"

import { useState } from "react"
import { useParking } from "@/lib/parking-context"
import { Input } from "@/components/ui/input"
import { AlertTriangle, Plus, Trash2, LogOut, Settings, Bell, User } from "lucide-react"
import Image from "next/image"

export function ProfileScreen() {
  const { user, setUser, setIsAuthenticated, setCurrentScreen } = useParking()
  const [isAddingCar, setIsAddingCar] = useState(false)
  const [newCar, setNewCar] = useState({ brand: "", model: "", plateNumber: "" })
  
  const handleAddCar = () => {
    if (!user || !newCar.brand || !newCar.model || !newCar.plateNumber) return
    
    setUser({
      ...user,
      cars: [
        ...user.cars,
        {
          id: `car-${Date.now()}`,
          brand: newCar.brand,
          model: newCar.model,
          plateNumber: newCar.plateNumber,
        }
      ]
    })
    
    setNewCar({ brand: "", model: "", plateNumber: "" })
    setIsAddingCar(false)
  }
  
  const handleRemoveCar = (carId: string) => {
    if (!user) return
    setUser({
      ...user,
      cars: user.cars.filter(c => c.id !== carId)
    })
  }

  const handleSignOut = () => {
    setIsAuthenticated(false)
    setCurrentScreen("home")
  }
  
  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Top Profile Card */}
      <div className="bg-[#495E8E] rounded-b-[2.5rem] px-5 pt-6 pb-6 shadow-lg">
        {/* Header Row */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl font-bold text-white">Profile</h1>
          <div className="flex items-center gap-3">
            <button className="p-2 rounded-full hover:bg-white/10 transition-colors">
              <Settings className="w-5 h-5 text-white" />
            </button>
            <button className="p-2 rounded-full hover:bg-white/10 transition-colors relative">
              <Bell className="w-5 h-5 text-white" />
              <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-[#495E8E]"></span>
            </button>
          </div>
        </div>

        {/* User Avatar and Info */}
        <div className="flex flex-col items-center mb-6">
          <div className="w-20 h-20 rounded-full bg-white flex items-center justify-center mb-3">
            <User className="w-10 h-10 text-gray-400" />
          </div>
          <h2 className="text-xl font-bold text-white">{user?.name || "Guest"}</h2>
          <p className="text-white/80 text-sm">{user?.phone || "+7 XXX XXX XX XX"}</p>
        </div>

        {/* Balance and Bonus Cards */}
        <div className="flex gap-3">
          <div className="flex-1 bg-white/10 rounded-2xl p-4 backdrop-blur-sm border border-white/20">
            <div className="flex items-center gap-2 mb-1">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-white/70">
                <rect x="2" y="4" width="20" height="16" rx="2" />
                <path d="M2 10h20" />
              </svg>
              <p className="text-white font-bold text-xl">1500₸</p>
            </div>
            <p className="text-white/70 text-xs">Баланс</p>
          </div>
          <div className="flex-1 bg-white/10 rounded-2xl p-4 backdrop-blur-sm border border-white/20">
            <div className="flex items-center gap-2 mb-1">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-white/70">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
              </svg>
              <p className="text-white font-bold text-xl">50</p>
            </div>
            <p className="text-white/70 text-xs">Бонус</p>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 px-4 py-4 overflow-y-auto pb-32">
        {/* No-Show Counter */}
        <div className="bg-white rounded-3xl p-4 mb-4 shadow-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="font-semibold text-gray-900">No show counter</p>
                <p className="text-sm text-gray-500">{user?.noShowCount || 1} of 6 (ban at 6)</p>
              </div>
            </div>
            <span className="px-3 py-1 bg-gray-100 rounded-full text-xs font-medium text-gray-600">
              {user?.noShowCount || 1}/6
            </span>
          </div>
        </div>

        {/* My Cars */}
        <div className="bg-white rounded-3xl p-4 mb-4 shadow-lg">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                <Image 
                  src="/car.svg" 
                  alt="Car" 
                  width={20}
                  height={20}
                  className="object-contain"
                />
              </div>
              <p className="font-semibold text-gray-900">My cars</p>
            </div>
            <button 
              onClick={() => setIsAddingCar(true)}
              className="flex items-center gap-1 px-3 py-1 bg-gray-100 rounded-full text-gray-600 font-medium text-sm hover:bg-gray-200 transition-colors"
            >
              + Add
            </button>
          </div>

          {/* Car List */}
          {user?.cars.map((car) => (
            <div key={car.id} className="flex items-center justify-between py-3 border-t border-gray-100">
              <div>
                <p className="font-medium text-gray-900">{car.brand} {car.model}</p>
                <p className="text-sm text-gray-500">{car.plateNumber}</p>
              </div>
              <button 
                onClick={() => handleRemoveCar(car.id)}
                className="p-2 text-gray-300 hover:text-red-500 transition-colors"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
          ))}

          {/* Add Car Form */}
          {isAddingCar && (
            <div className="space-y-3 pt-3 border-t border-gray-100">
              <Input
                placeholder="Brand (e.g., Toyota)"
                value={newCar.brand}
                onChange={(e) => setNewCar({ ...newCar, brand: e.target.value })}
                className="rounded-xl"
              />
              <Input
                placeholder="Model (e.g., Camry)"
                value={newCar.model}
                onChange={(e) => setNewCar({ ...newCar, model: e.target.value })}
                className="rounded-xl"
              />
              <Input
                placeholder="Plate Number (e.g., 123 ABC 01)"
                value={newCar.plateNumber}
                onChange={(e) => setNewCar({ ...newCar, plateNumber: e.target.value })}
                className="rounded-xl"
              />
              <div className="flex gap-2">
                <button 
                  onClick={() => {
                    setIsAddingCar(false)
                    setNewCar({ brand: "", model: "", plateNumber: "" })
                  }}
                  className="flex-1 py-3 rounded-xl border border-gray-200 font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleAddCar}
                  disabled={!newCar.brand || !newCar.model || !newCar.plateNumber}
                  className="flex-1 py-3 rounded-xl bg-[#495E8E] text-white font-medium hover:bg-[#3d4c73] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Add Car
                </button>
              </div>
            </div>
          )}

          {(!user?.cars || user.cars.length === 0) && !isAddingCar && (
            <p className="py-4 text-center text-gray-400 border-t border-gray-100">No cars registered</p>
          )}
        </div>

        {/* Support */}
        <p className="text-center text-gray-500 text-sm mb-4">
          Contact support: <span className="font-medium text-gray-700">+7 708 239 51 19</span>
        </p>

        {/* Sign Out Button */}
        <button 
          onClick={handleSignOut}
          className="w-full flex items-center justify-center gap-2 py-4 rounded-3xl bg-[#495E8E] text-white font-semibold hover:bg-[#3d4c73] transition-colors shadow-lg"
        >
          <LogOut className="w-5 h-5 rotate-180" />
          Sign Out
        </button>
      </div>

      {/* Bottom Navigation */}
      <div className="absolute bottom-0 left-0 right-0 h-20 bg-white border-t border-gray-200 z-50">
        <div className="flex justify-around items-center h-full px-4">
          {[
            { id: "home", icon: "/Home_light.svg", activeIcon: "/Home_light_active.svg", label: "Home", active: false },
            { id: "map", icon: "/Map_light.svg", activeIcon: "/Map_light_active.svg", label: "Map", active: false },
            { id: "booking", icon: "/Component.svg", activeIcon: "/Component_active.svg", label: "Booking", active: false },
            { id: "wallet", icon: "/wallet.svg", activeIcon: "/wallet_active.svg", label: "Wallet", active: false },
            { id: "profile", icon: "/User_cicrle_light.svg", activeIcon: "/User_cicrle_light_active.svg", label: "Profile", active: true },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setCurrentScreen(item.id)}
              className="flex flex-col items-center justify-center gap-0.5 p-3 transition-all hover:bg-gray-100 rounded-xl active:scale-95"
            >
              <div className="w-8 h-8 flex items-center justify-center">
                <img 
                  src={item.active ? item.activeIcon : item.icon} 
                  alt={item.label} 
                  width={28}
                  height={28}
                  className={item.active ? "opacity-100" : "opacity-80"}
                />
              </div>
              <span className={`text-xs font-medium ${item.active ? "text-[#36549B]" : "text-gray-900"}`}>
                {item.label}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
