"use client"

import { useState } from "react"
import { useParking } from "@/lib/parking-context"
import { Wallet, ArrowDownLeft, ArrowUpRight, Sparkles, CreditCard } from "lucide-react"

export function WalletScreen() {
  const { setCurrentScreen } = useParking()
  const [view, setView] = useState<"main" | "topup">("main")
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null)

  // Static transaction data matching the design
  const transactions = [
    {
      id: "1",
      type: "topup",
      title: "Wallet top-up via",
      subtitle: "Stripe",
      date: "Mar 27, 10:51 PM",
      amount: 500,
    },
    {
      id: "2",
      type: "parking",
      title: "Parking SP-07, 2 hours",
      subtitle: "",
      date: "Mar 26, 10:48 PM",
      amount: -330,
    },
  ]

  const topUpAmounts = [500, 1000, 2000, 5000]

  const handlePayWithStripe = () => {
    if (selectedAmount) {
      // Here you would integrate with Stripe
      alert(`Processing payment of ${selectedAmount}₸ via Stripe (Test Mode)`)
    }
  }

  // Top Up View
  if (view === "topup") {
    return (
      <div className="relative flex flex-col h-full bg-[#F8F9FC] overflow-hidden">
        {/* Header */}
        <div className="text-center pt-6 pb-4">
          <h1 className="text-2xl font-bold text-[#1a1a2e]">Wallet</h1>
        </div>

        {/* Main Content */}
        <div className="flex-1 px-4 space-y-5 overflow-y-auto pb-24">
          {/* Balance Card */}
          <div className="relative bg-[#495E8E] rounded-3xl p-5 overflow-hidden">
            <div className="relative z-10">
              <p className="text-white/80 text-sm font-medium">Current balance</p>
              <p className="text-white text-4xl font-bold mt-1 tracking-tight">
                1500<span className="text-3xl">₸</span>
              </p>
            </div>
            {/* Wallet Icon */}
            <div className="absolute top-5 right-5">
              <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
                <Wallet className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>

          {/* Select Amount Section */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <CreditCard className="w-5 h-5 text-[#495E8E]" />
              <h2 className="text-lg font-bold text-[#1a1a2e]">Select Amount</h2>
            </div>
            
            {/* Amount Grid */}
            <div className="grid grid-cols-2 gap-3">
              {topUpAmounts.map((amount) => (
                <button
                  key={amount}
                  onClick={() => setSelectedAmount(amount)}
                  className={`py-5 rounded-2xl border-2 text-xl font-bold transition-all ${
                    selectedAmount === amount
                      ? "bg-[#495E8E] text-white border-[#495E8E]"
                      : "bg-white text-[#1a1a2e] border-gray-200 hover:border-[#495E8E]"
                  }`}
                >
                  {amount}₸
                </button>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            <button
              onClick={() => {
                setView("main")
                setSelectedAmount(null)
              }}
              className="flex-1 py-4 rounded-2xl bg-gray-200 text-gray-700 font-semibold text-base hover:bg-gray-300 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handlePayWithStripe}
              disabled={!selectedAmount}
              className={`flex-1 py-4 rounded-2xl font-semibold text-base transition-colors ${
                selectedAmount
                  ? "bg-[#85B6FF] text-white hover:bg-[#6da3f0]"
                  : "bg-[#85B6FF]/50 text-white/70 cursor-not-allowed"
              }`}
            >
              Pay with Stripe
            </button>
          </div>

          {/* Stripe Footer */}
          <p className="text-center text-xs text-gray-400">
            Powered by Stripe (Test Mode)
          </p>
        </div>

        {/* Bottom Navigation */}
        <div className="absolute bottom-0 left-0 right-0 h-20 bg-white border-t border-gray-200 z-10">
          <div className="flex justify-around items-center h-full px-4">
            {[
              { id: "home", icon: "/Home_light.svg", activeIcon: "/Home_light_active.svg", label: "Home", active: false },
              { id: "map", icon: "/Map_light.svg", activeIcon: "/Map_light_active.svg", label: "Map", active: false },
              { id: "booking", icon: "/Component.svg", activeIcon: "/Component_active.svg", label: "Booking", active: false },
              { id: "wallet", icon: "/wallet.svg", activeIcon: "/wallet_active.svg", label: "Wallet", active: true },
              { id: "profile", icon: "/User_cicrle_light.svg", activeIcon: "/User_cicrle_light_active.svg", label: "Profile", active: false },
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
                <span className={`text-xs font-medium ${item.active ? "text-[#36549B] drop-shadow-sm" : "text-gray-900 drop-shadow-sm"}`}>
                  {item.label}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    )
  }

  // Main Wallet View
  return (
    <div className="relative flex flex-col h-full bg-[#F8F9FC] overflow-hidden">
      {/* Header */}
      <div className="text-center pt-6 pb-4">
        <h1 className="text-2xl font-bold text-[#1a1a2e]">Wallet</h1>
        <p className="text-sm text-gray-400 mt-1">Manage your balance</p>
      </div>

      {/* Main Content - Scrollable area with bottom padding for navbar */}
      <div className="flex-1 px-4 space-y-4 overflow-y-auto pb-24">
        {/* Balance Card */}
        <div className="relative bg-[#495E8E] rounded-3xl p-5 overflow-hidden">
          <div className="relative z-10">
            <p className="text-white/80 text-sm font-medium">Current balance</p>
            <p className="text-white text-4xl font-bold mt-1 tracking-tight">
              1500<span className="text-3xl">₸</span>
            </p>
            <p className="text-white/70 text-sm mt-2">50 bonus points</p>
          </div>
          {/* Wallet Icon */}
          <div className="absolute top-5 right-5">
            <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
              <Wallet className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        {/* Top Up Button */}
        <button 
          onClick={() => setView("topup")}
          className="w-full bg-[#495E8E] text-white font-semibold py-4 rounded-3xl text-base hover:bg-[#3d4f78] transition-colors"
        >
          + Top up balance
        </button>

        {/* Promo Code Card */}
        <div className="bg-[#F5EBE0] rounded-3xl p-4 flex items-center justify-between">
          <div className="flex items-start gap-3">
            <Sparkles className="w-5 h-5 text-amber-500 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-semibold text-[#1a1a2e] text-sm">Promo Code Available</p>
              <p className="text-gray-500 text-xs mt-0.5">
                FIRST - 150₸ off your first<br />parking
              </p>
            </div>
          </div>
          <span className="bg-white text-gray-600 text-xs font-medium px-3 py-1 rounded-full border border-gray-200">
            Active
          </span>
        </div>

        {/* Transaction History */}
        <div className="mt-2">
          <h2 className="text-lg font-bold text-[#1a1a2e] mb-4">Transaction History</h2>
          <div className="space-y-3">
            {transactions.map((transaction) => (
              <div key={transaction.id} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {/* Icon */}
                  <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                    {transaction.type === "topup" ? (
                      <ArrowDownLeft className="w-4 h-4 text-[#495E8E]" />
                    ) : (
                      <ArrowUpRight className="w-4 h-4 text-orange-500" />
                    )}
                  </div>
                  {/* Details */}
                  <div>
                    <p className="text-[#1a1a2e] text-sm font-medium">
                      {transaction.title}
                      {transaction.subtitle && (
                        <>
                          <br />
                          <span>{transaction.subtitle}</span>
                        </>
                      )}
                    </p>
                    <p className="text-gray-400 text-xs">{transaction.date}</p>
                  </div>
                </div>
                {/* Amount */}
                <p className={`text-sm font-bold ${transaction.amount > 0 ? "text-[#495E8E]" : "text-[#1a1a2e]"}`}>
                  {transaction.amount > 0 ? "+" : ""}{Math.abs(transaction.amount)}₸
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Navigation */}
      <div className="absolute bottom-0 left-0 right-0 h-20 bg-white border-t border-gray-200 z-10">
        <div className="flex justify-around items-center h-full px-4">
          {[
            { id: "home", icon: "/Home_light.svg", activeIcon: "/Home_light_active.svg", label: "Home", active: false },
            { id: "map", icon: "/Map_light.svg", activeIcon: "/Map_light_active.svg", label: "Map", active: false },
            { id: "booking", icon: "/Component.svg", activeIcon: "/Component_active.svg", label: "Booking", active: false },
            { id: "wallet", icon: "/wallet.svg", activeIcon: "/wallet_active.svg", label: "Wallet", active: true },
            { id: "profile", icon: "/User_cicrle_light.svg", activeIcon: "/User_cicrle_light_active.svg", label: "Profile", active: false },
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
              <span className={`text-xs font-medium ${item.active ? "text-[#36549B] drop-shadow-sm" : "text-gray-900 drop-shadow-sm"}`}>
                {item.label}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
