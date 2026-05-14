"use client"

import { useState } from "react"
import { useParking } from "@/lib/parking-context"
import { Input } from "@/components/ui/input"
import { AlertTriangle, Plus, Trash2, LogOut, Settings, Bell, User, ChevronRight, Moon, Globe, Shield, HelpCircle, ChevronLeft } from "lucide-react"
import Image from "next/image"

export function ProfileScreen() {
  const { user, setUser, setIsAuthenticated, setCurrentScreen } = useParking()
  const [isAddingCar, setIsAddingCar] = useState(false)
  const [newCar, setNewCar] = useState({ brand: "", model: "", plateNumber: "" })
  const [showSettings, setShowSettings] = useState(false)
  const [darkMode, setDarkMode] = useState(false)
  const [notifications, setNotifications] = useState(true)
  
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
  
  // Settings Page
  if (showSettings) {
    return (
      <div className="flex flex-col h-full bg-gray-50">
        {/* Settings Header */}
        <div className="bg-[#495E8E] rounded-b-[2.5rem] px-5 pt-6 pb-8 shadow-lg">
          <div className="flex items-center gap-3 mb-2">
            <button 
              onClick={() => setShowSettings(false)}
              className="p-2 rounded-full hover:bg-white/10 transition-colors"
            >
              <ChevronLeft className="w-5 h-5 text-white" />
            </button>
            <h1 className="text-xl font-bold text-white">Settings</h1>
          </div>
        </div>

        {/* Settings Content */}
        <div className="flex-1 px-4 py-6 overflow-y-auto pb-32">
          {/* Appearance */}
          <div className="bg-white rounded-3xl p-4 mb-4 shadow-lg">
            <h3 className="text-sm font-semibold text-gray-400 uppercase mb-3">Appearance</h3>
            
            <div className="flex items-center justify-between py-3">
              <div className="flex items-center gap-3">
                <Moon className="w-5 h-5 text-[#34415F]" />
                <span className="font-medium text-gray-900">Dark Mode</span>
              </div>
              <button 
                onClick={() => setDarkMode(!darkMode)}
                className={`w-12 h-7 rounded-full transition-colors ${darkMode ? 'bg-[#495E8E]' : 'bg-gray-300'}`}
              >
                <div className={`w-5 h-5 bg-white rounded-full shadow-md transition-transform mx-1 ${darkMode ? 'translate-x-5' : 'translate-x-0'}`} />
              </button>
            </div>
            
            <div className="flex items-center justify-between py-3 border-t border-gray-100">
              <div className="flex items-center gap-3">
                <Globe className="w-5 h-5 text-[#34415F]" />
                <span className="font-medium text-gray-900">Language</span>
              </div>
              <div className="flex items-center gap-1 text-gray-500">
                <span className="text-sm">English</span>
                <ChevronRight className="w-4 h-4" />
              </div>
            </div>
          </div>

          {/* Notifications */}
          <div className="bg-white rounded-3xl p-4 mb-4 shadow-lg">
            <h3 className="text-sm font-semibold text-gray-400 uppercase mb-3">Notifications</h3>
            
            <div className="flex items-center justify-between py-3">
              <div className="flex items-center gap-3">
                <Bell className="w-5 h-5 text-[#34415F]" />
                <span className="font-medium text-gray-900">Push Notifications</span>
              </div>
              <button 
                onClick={() => setNotifications(!notifications)}
                className={`w-12 h-7 rounded-full transition-colors ${notifications ? 'bg-[#495E8E]' : 'bg-gray-300'}`}
              >
                <div className={`w-5 h-5 bg-white rounded-full shadow-md transition-transform mx-1 ${notifications ? 'translate-x-5' : 'translate-x-0'}`} />
              </button>
            </div>
          </div>

          {/* Security & Privacy */}
          <div className="bg-white rounded-3xl p-4 mb-4 shadow-lg">
            <h3 className="text-sm font-semibold text-gray-400 uppercase mb-3">Security & Privacy</h3>
            
            <div className="flex items-center justify-between py-3">
              <div className="flex items-center gap-3">
                <Shield className="w-5 h-5 text-[#34415F]" />
                <span className="font-medium text-gray-900">Privacy Policy</span>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </div>
            
            <div className="flex items-center justify-between py-3 border-t border-gray-100">
              <div className="flex items-center gap-3">
                <HelpCircle className="w-5 h-5 text-[#34415F]" />
                <span className="font-medium text-gray-900">Terms of Service</span>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </div>
          </div>

          {/* App Info */}
          <div className="bg-white rounded-3xl p-4 mb-4 shadow-lg">
            <h3 className="text-sm font-semibold text-gray-400 uppercase mb-3">About</h3>
            
            <div className="flex items-center justify-between py-3">
              <span className="font-medium text-gray-900">App Version</span>
              <span className="text-sm text-gray-500">1.0.0</span>
            </div>
            
            <div className="flex items-center justify-between py-3 border-t border-gray-100">
              <span className="font-medium text-gray-900">Build</span>
              <span className="text-sm text-gray-500">2025.01.15</span>
            </div>
          </div>

          {/* Delete Account */}
          <button className="w-full py-4 text-red-500 font-medium text-center">
            Delete Account
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
                onClick={() => {
                  setShowSettings(false)
                  setCurrentScreen(item.id)
                }}
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

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Top Profile Card */}
      <div className="bg-[#495E8E] rounded-b-[2.5rem] px-5 pt-6 pb-6 shadow-lg">
        {/* Header Row */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl font-bold text-white">Profile</h1>
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setShowSettings(true)}
              className="p-2 rounded-full hover:bg-white/10 transition-colors"
            >
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
        <div className="bg-[#7A8BA8] rounded-3xl p-4 mb-4 shadow-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-6 h-6 text-white" />
              <div>
                <p className="font-semibold text-white">No show counter</p>
                <p className="text-sm text-white/70">{user?.noShowCount || 1} of 6 (ban at 6)</p>
              </div>
            </div>
            <span className="px-3 py-1 bg-white/20 rounded-full text-xs font-medium text-white">
              {user?.noShowCount || 1}/6
            </span>
          </div>
        </div>

        {/* My Cars */}
        <div className="bg-[#7A8BA8] rounded-3xl p-4 mb-4 shadow-lg">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <Image 
                src="/car.svg" 
                alt="Car" 
                width={24}
                height={24}
                className="object-contain brightness-0 invert"
              />
              <p className="font-semibold text-white">My cars</p>
            </div>
            <button 
              onClick={() => setIsAddingCar(true)}
              className="flex items-center gap-1 px-3 py-1 bg-white/20 rounded-full text-white font-medium text-sm hover:bg-white/30 transition-colors"
            >
              + Add
            </button>
          </div>

          {/* Car List */}
          {user?.cars.map((car) => (
            <div key={car.id} className="flex items-center justify-between py-3 border-t border-white/20">
              <div>
                <p className="font-medium text-white">{car.brand} {car.model}</p>
                <p className="text-sm text-white/70">{car.plateNumber}</p>
              </div>
              <button 
                onClick={() => handleRemoveCar(car.id)}
                className="p-2 text-white/50 hover:text-red-400 transition-colors"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
          ))}

          {/* Add Car Form */}
          {isAddingCar && (
            <div className="space-y-3 pt-3 border-t border-white/20">
              <Input
                placeholder="Brand (e.g., Toyota)"
                value={newCar.brand}
                onChange={(e) => setNewCar({ ...newCar, brand: e.target.value })}
                className="rounded-xl bg-white/10 border-white/20 text-white placeholder:text-white/50"
              />
              <Input
                placeholder="Model (e.g., Camry)"
                value={newCar.model}
                onChange={(e) => setNewCar({ ...newCar, model: e.target.value })}
                className="rounded-xl bg-white/10 border-white/20 text-white placeholder:text-white/50"
              />
              <Input
                placeholder="Plate Number (e.g., 123 ABC 01)"
                value={newCar.plateNumber}
                onChange={(e) => setNewCar({ ...newCar, plateNumber: e.target.value })}
                className="rounded-xl bg-white/10 border-white/20 text-white placeholder:text-white/50"
              />
              <div className="flex gap-2">
                <button 
                  onClick={() => {
                    setIsAddingCar(false)
                    setNewCar({ brand: "", model: "", plateNumber: "" })
                  }}
                  className="flex-1 py-3 rounded-xl border border-white/30 font-medium text-white hover:bg-white/10 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleAddCar}
                  disabled={!newCar.brand || !newCar.model || !newCar.plateNumber}
                  className="flex-1 py-3 rounded-xl bg-white text-[#34415F] font-medium hover:bg-white/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Add Car
                </button>
              </div>
            </div>
          )}

          {(!user?.cars || user.cars.length === 0) && !isAddingCar && (
            <p className="py-4 text-center text-white/50 border-t border-white/20">No cars registered</p>
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
