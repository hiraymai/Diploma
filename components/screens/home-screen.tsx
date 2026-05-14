"use client"

import { useState } from "react"
import { useParking } from "@/lib/parking-context"
import Image from "next/image"

export function HomeScreen() {
  const { setCurrentScreen, user, darkMode, t } = useParking()
  const [activeTab, setActiveTab] = useState("home")

  const navItems = [
    { id: "home", icon: "/Home_light.svg", activeIcon: "/Home_light_active.svg", labelKey: "home" as const, active: true },
    { id: "map", icon: "/Map_light.svg", activeIcon: "/Map_light_active.svg", labelKey: "map" as const, active: false },
    { id: "booking", icon: "/Component.svg", activeIcon: "/Component_active.svg", labelKey: "booking" as const, active: false },
    { id: "wallet", icon: "/wallet.svg", activeIcon: "/wallet_active.svg", labelKey: "wallet" as const, active: false },
    { id: "profile", icon: "/User_cicrle_light.svg", activeIcon: "/User_cicrle_light_active.svg", labelKey: "profile" as const, active: false },
  ]

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      {/* Main content */}
      <div className="px-6 py-4 pb-24">
        {/* Blue Header Card */}
        <div className={`${darkMode ? 'bg-[#2a3654]' : 'bg-[#495E8E]'} rounded-b-[20px] p-4 pb-6 mb-6 shadow-md flex flex-col`}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 bg-white rounded-full flex items-center justify-center overflow-hidden">
                <Image 
                  src="/icon_light.svg" 
                  alt="Logo" 
                  width={80}
                  height={80}
                  className="object-contain"
                  style={{ transform: 'scale(1.3) translateY(4px) translateX(4px)' }}
                />
              </div>
              <div>
                <p className="text-gray-200 text-sm">{t.welcomeBack}</p>
                <p className="text-white text-xl font-extrabold">{user?.name || "User Name"}</p>
              </div>
            </div>
            <button 
              onClick={() => setCurrentScreen("profile")}
              className="flex items-center gap-4 hover:bg-white/10 rounded-lg p-2 transition-colors"
            >
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                <Image 
                  src="/bell.svg" 
                  alt="Notifications" 
                  width={32}
                  height={32}
                  className="object-contain"
                />
              </div>
            </button>
          </div>
          <div className={`flex items-center justify-between ${darkMode ? 'bg-[#1e2a45]' : 'bg-[#354469]'} rounded-xl p-3`}>
            <div>
              <p className="text-gray-300 text-sm">{t.bonusPoints}</p>
              <p className="text-white text-lg font-bold">50</p>
            </div>
            <button 
              onClick={() => setCurrentScreen("wallet")}
              className="hover:bg-white/10 rounded-lg p-2 transition-colors"
            >
              <Image 
                src="/gift.svg" 
                alt="Gift" 
                width={24}
                height={24}
                className="object-contain"
              />
            </button>
          </div>
        </div>

        {/* Active Booking Card */}
        <div className={`${darkMode ? 'bg-gray-800' : 'bg-[#F0EDED]'} rounded-[20px] p-5 mb-8`} style={{boxShadow: darkMode ? '0 10px 20px rgba(0,0,0,0.3)' : '0 10px 20px rgba(0,0,0,0.08)'}}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Image 
                src="/clock.svg" 
                alt="Clock" 
                width={48}
                height={48}
                className={`object-contain ${darkMode ? 'opacity-90' : ''}`}
              />
              <div>
                <h3 className={`${darkMode ? 'text-white' : 'text-[#333333]'} font-extrabold text-lg drop-shadow-md`}>{t.activeBooking}</h3>
                <p className={`${darkMode ? 'text-gray-400' : 'text-gray-600'} text-sm`}>Spot A-24 • 2h {t.remaining}</p>
              </div>
            </div>
            <button 
              onClick={() => setCurrentScreen("booking")}
              className={`p-2 rounded-lg ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-200'} transition-colors`}
            >
              <Image 
                src="/Arrow_right.svg" 
                alt="Arrow" 
                width={32}
                height={32}
                className={`object-contain ${darkMode ? 'brightness-0 invert' : ''}`}
              />
            </button>
          </div>
        </div>

        {/* Parking Spots */}
        <div className="mb-8">
          <div className="grid grid-cols-2 gap-6">
            <button 
              onClick={() => setCurrentScreen("map")}
              className={`${darkMode ? 'bg-gray-800 hover:bg-gray-700' : 'bg-[#F0EDED] hover:bg-[#E5DCDC]'} rounded-[20px] p-5 text-left transition-colors`} 
              style={{boxShadow: darkMode ? '0 10px 20px rgba(0,0,0,0.3)' : '0 10px 20px rgba(0,0,0,0.08)'}}
            >
              <h4 className={`${darkMode ? 'text-white' : 'text-[#333333]'} font-extrabold text-lg mb-3`}>{t.shortTerm}</h4>
              <p className={`${darkMode ? 'text-gray-400' : 'text-gray-600'} text-sm mb-4`}>12 {t.spotsAvailable}</p>
              <div className="flex gap-2">
                {[1,2,3].map(i => (
                  <div key={i} className="w-3 h-3 bg-green-500 rounded-full"></div>
                ))}
              </div>
            </button>
            
            <button 
              onClick={() => setCurrentScreen("map")}
              className={`${darkMode ? 'bg-gray-800 hover:bg-gray-700' : 'bg-[#F0EDED] hover:bg-[#E5DCDC]'} rounded-[20px] p-5 text-left transition-colors`} 
              style={{boxShadow: darkMode ? '0 10px 20px rgba(0,0,0,0.3)' : '0 10px 20px rgba(0,0,0,0.08)'}}
            >
              <h4 className={`${darkMode ? 'text-white' : 'text-[#333333]'} font-extrabold text-lg mb-3`}>{t.longTerm}</h4>
              <p className={`${darkMode ? 'text-gray-400' : 'text-gray-600'} text-sm mb-4`}>8 {t.spotsAvailable}</p>
              <div className="flex gap-2">
                {[1,2].map(i => (
                  <div key={i} className="w-3 h-3 bg-green-500 rounded-full"></div>
                ))}
              </div>
            </button>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <h3 className={`${darkMode ? 'text-white' : 'text-[#333333]'} font-extrabold text-lg mb-6`}>{t.quickActions}</h3>
          <div className="space-y-6">
            <div 
              onClick={() => setCurrentScreen("map")}
              className={`w-full ${darkMode ? 'bg-[#3d5a80]' : 'bg-[#4A5E8E]'} rounded-[20px] p-5 cursor-pointer hover:opacity-90 transition-colors`} 
              style={{boxShadow: darkMode ? '0 10px 20px rgba(0,0,0,0.3)' : '0 10px 20px rgba(0,0,0,0.08)'}}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Image 
                    src="/location.svg" 
                    alt="Location" 
                    width={40}
                    height={40}
                    className="object-contain filter brightness-0 invert"
                  />
                  <div className="text-left">
                    <span className="text-white font-bold text-xl drop-shadow-md">{t.bookNow}</span>
                    <p className="text-white/70 text-sm">{t.findAvailableParking}</p>
                  </div>
                </div>
                <Image 
                  src="/Arrow_right.svg" 
                  alt="Arrow" 
                  width={36}
                  height={36}
                  className="object-contain filter brightness-0 invert"
                />
              </div>
            </div>
            <div 
              onClick={() => setCurrentScreen("profile")}
              className={`w-full ${darkMode ? 'bg-[#7b4a8e]' : 'bg-[#9A56AD]'} rounded-[20px] p-5 cursor-pointer hover:opacity-90 transition-colors`} 
              style={{boxShadow: darkMode ? '0 10px 20px rgba(0,0,0,0.3)' : '0 10px 20px rgba(0,0,0,0.08)'}}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Image 
                    src="/car.svg" 
                    alt="Car" 
                    width={40}
                    height={40}
                    className="object-contain filter brightness-0 invert"
                  />
                  <div className="text-left">
                    <span className="text-white font-bold text-xl drop-shadow-md">{t.myCars}</span>
                    <p className="text-white/70 text-sm">1 {t.registered}</p>
                  </div>
                </div>
                <Image 
                  src="/Arrow_right.svg" 
                  alt="Arrow" 
                  width={36}
                  height={36}
                  className="object-contain filter brightness-0 invert"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Orange Banner */}
        <div 
          onClick={() => setCurrentScreen("wallet")}
          className={`w-full ${darkMode ? 'bg-[#cc8a5c]' : 'bg-[#FFB380]'} rounded-[20px] p-5 mb-24 cursor-pointer hover:opacity-90 transition-colors`} 
          style={{boxShadow: darkMode ? '0 10px 20px rgba(0,0,0,0.3)' : '0 10px 20px rgba(0,0,0,0.08)'}}
        >
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center">
              <Image 
                src="/gift.svg" 
                alt="Gift" 
                width={32}
                height={32}
                className="object-contain filter brightness-0 invert"
              />
            </div>
            <div className="text-left">
              <h3 className="text-white font-extrabold text-lg">{t.specialOffer}</h3>
              <p className="text-orange-100 text-sm">{t.getDiscount}</p>
            </div>
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
