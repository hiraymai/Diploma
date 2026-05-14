"use client"

import { useState } from "react"
import Image from "next/image"
import { Phone, ArrowRight, Loader2 } from "lucide-react"
import { useParking } from "@/lib/parking-context"
import { sendOTP, verifyOTP } from "@/lib/actions/auth"

export function AuthScreen() {
  const { darkMode, t } = useParking()
  const [phone, setPhone] = useState("")
  const [otp, setOtp] = useState("")
  const [step, setStep] = useState<"phone" | "otp">("phone")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [demoCode, setDemoCode] = useState("")

  const handleSendOTP = async () => {
    if (!phone || phone.length < 10) {
      setError("Please enter a valid phone number")
      return
    }
    
    setLoading(true)
    setError("")
    
    const formattedPhone = phone.startsWith("+") ? phone : `+7${phone}`
    const result = await sendOTP(formattedPhone)
    
    if (result.success) {
      setStep("otp")
      // For demo, show the code
      if (result.code) {
        setDemoCode(result.code)
      }
    } else {
      setError(result.error || "Failed to send OTP")
    }
    
    setLoading(false)
  }

  const handleVerifyOTP = async () => {
    if (!otp || otp.length !== 4) {
      setError("Please enter a 4-digit code")
      return
    }
    
    setLoading(true)
    setError("")
    
    const formattedPhone = phone.startsWith("+") ? phone : `+7${phone}`
    const result = await verifyOTP(formattedPhone, otp)
    
    if (!result.success) {
      setError(result.error || t.invalidOTP)
    }
    // If successful, the auth state change will be handled by the context
    
    setLoading(false)
  }

  return (
    <div className={`min-h-screen flex flex-col ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      {/* Header with logo */}
      <div className={`${darkMode ? 'bg-[#2a3654]' : 'bg-[#495E8E]'} rounded-b-[2.5rem] px-6 pt-12 pb-16 shadow-lg`}>
        <div className="flex flex-col items-center">
          <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mb-4 shadow-lg">
            <Image 
              src="/icon_light.svg" 
              alt="QPark Logo" 
              width={80}
              height={80}
              className="object-contain"
              style={{ transform: 'scale(1.2) translateY(3px) translateX(3px)' }}
            />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">QPark</h1>
          <p className="text-white/70 text-center">Smart Parking Solution</p>
        </div>
      </div>

      {/* Auth Form */}
      <div className="flex-1 px-6 py-8 -mt-8">
        <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-3xl p-6 shadow-xl`}>
          {step === "phone" ? (
            <>
              <h2 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'} mb-2`}>
                {t.enterPhone}
              </h2>
              <p className={`${darkMode ? 'text-gray-400' : 'text-gray-500'} text-sm mb-6`}>
                We&apos;ll send you a verification code
              </p>
              
              <div className="relative mb-4">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
                  <Phone className={`w-5 h-5 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                  <span className={`${darkMode ? 'text-white' : 'text-gray-900'} font-medium`}>+7</span>
                </div>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                  placeholder="XXX XXX XX XX"
                  className={`w-full pl-20 pr-4 py-4 rounded-xl border ${
                    darkMode 
                      ? 'bg-gray-700 border-gray-600 text-white placeholder:text-gray-500' 
                      : 'bg-gray-50 border-gray-200 text-gray-900 placeholder:text-gray-400'
                  } focus:outline-none focus:ring-2 focus:ring-[#495E8E] text-lg`}
                />
              </div>
              
              {error && (
                <p className="text-red-500 text-sm mb-4">{error}</p>
              )}
              
              <button
                onClick={handleSendOTP}
                disabled={loading || phone.length < 10}
                className={`w-full py-4 rounded-xl font-semibold text-white flex items-center justify-center gap-2 transition-colors ${
                  loading || phone.length < 10
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-[#495E8E] hover:bg-[#3d4f7a]'
                }`}
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    {t.sendCode}
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </>
          ) : (
            <>
              <h2 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'} mb-2`}>
                {t.enterOTP}
              </h2>
              <p className={`${darkMode ? 'text-gray-400' : 'text-gray-500'} text-sm mb-2`}>
                Code sent to +7{phone}
              </p>
              
              {/* Demo code display */}
              {demoCode && (
                <div className={`${darkMode ? 'bg-green-900/30 border-green-700' : 'bg-green-50 border-green-200'} border rounded-lg p-3 mb-4`}>
                  <p className={`text-sm ${darkMode ? 'text-green-400' : 'text-green-700'}`}>
                    Demo code: <span className="font-bold text-lg">{demoCode}</span>
                  </p>
                </div>
              )}
              
              <div className="flex justify-center gap-3 mb-6">
                {[0, 1, 2, 3].map((i) => (
                  <input
                    key={i}
                    type="text"
                    maxLength={1}
                    value={otp[i] || ""}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, "")
                      const newOtp = otp.split("")
                      newOtp[i] = value
                      setOtp(newOtp.join(""))
                      
                      // Auto-focus next input
                      if (value && i < 3) {
                        const nextInput = document.querySelector(`input[data-index="${i + 1}"]`) as HTMLInputElement
                        nextInput?.focus()
                      }
                    }}
                    onKeyDown={(e) => {
                      // Handle backspace to go to previous input
                      if (e.key === "Backspace" && !otp[i] && i > 0) {
                        const prevInput = document.querySelector(`input[data-index="${i - 1}"]`) as HTMLInputElement
                        prevInput?.focus()
                      }
                    }}
                    data-index={i}
                    className={`w-14 h-14 text-center text-2xl font-bold rounded-xl border ${
                      darkMode 
                        ? 'bg-gray-700 border-gray-600 text-white' 
                        : 'bg-gray-50 border-gray-200 text-gray-900'
                    } focus:outline-none focus:ring-2 focus:ring-[#495E8E]`}
                  />
                ))}
              </div>
              
              {error && (
                <p className="text-red-500 text-sm mb-4 text-center">{error}</p>
              )}
              
              <button
                onClick={handleVerifyOTP}
                disabled={loading || otp.length !== 4}
                className={`w-full py-4 rounded-xl font-semibold text-white flex items-center justify-center gap-2 transition-colors ${
                  loading || otp.length !== 4
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-[#495E8E] hover:bg-[#3d4f7a]'
                }`}
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    {t.verifyCode}
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
              
              <button
                onClick={() => {
                  setStep("phone")
                  setOtp("")
                  setError("")
                  setDemoCode("")
                }}
                className={`w-full mt-3 py-3 rounded-xl font-medium ${
                  darkMode ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-900'
                } transition-colors`}
              >
                Change phone number
              </button>
            </>
          )}
        </div>
        
        {/* Demo notice */}
        <p className={`text-center mt-6 text-sm ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
          Demo mode: OTP codes are shown on screen
        </p>
      </div>
    </div>
  )
}
