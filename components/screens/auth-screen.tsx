"use client"

import { useState, useEffect } from "react"
import { useParking } from "@/lib/parking-context"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Loader2, Phone, ArrowRight, ArrowLeft, Shield } from "lucide-react"
import Image from "next/image"
import { sendOTP, verifyOTP, initRecaptcha } from "@/lib/firebase/auth"

export function AuthScreen() {
  const { darkMode, language, t, onAuthSuccess } = useParking()
  const [step, setStep] = useState<"phone" | "otp">("phone")
  const [phone, setPhone] = useState("")
  const [otp, setOtp] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [countdown, setCountdown] = useState(0)
  
  // Setup recaptcha on mount
  useEffect(() => {
    initRecaptcha("recaptcha-container")
  }, [])
  
  // Countdown timer for resend
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [countdown])
  
  const formatPhone = (value: string) => {
    // Remove all non-digits
    const digits = value.replace(/\D/g, "")
    
    // Format as +7 (XXX) XXX-XX-XX
    if (digits.length <= 1) return digits
    if (digits.length <= 4) return `+${digits.slice(0, 1)} (${digits.slice(1)}`
    if (digits.length <= 7) return `+${digits.slice(0, 1)} (${digits.slice(1, 4)}) ${digits.slice(4)}`
    if (digits.length <= 9) return `+${digits.slice(0, 1)} (${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`
    return `+${digits.slice(0, 1)} (${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7, 9)}-${digits.slice(9, 11)}`
  }
  
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhone(e.target.value)
    setPhone(formatted)
    setError("")
  }
  
  const getCleanPhone = () => {
    return "+" + phone.replace(/\D/g, "")
  }
  
  const handleSendOTP = async () => {
    const cleanPhone = getCleanPhone()
    if (cleanPhone.length < 12) {
      setError(t.invalidPhone || "Invalid phone number")
      return
    }
    
    setLoading(true)
    setError("")
    
    try {
      const result = await sendOTP(cleanPhone)
      if (result.success) {
        setStep("otp")
        setCountdown(60)
      } else {
        setError(result.error || "Failed to send OTP")
      }
    } catch (err) {
      setError("Failed to send OTP. Please try again.")
    } finally {
      setLoading(false)
    }
  }
  
  const handleVerifyOTP = async () => {
    if (otp.length !== 6) {
      setError(t.invalidOtp || "Please enter 6-digit code")
      return
    }
    
    setLoading(true)
    setError("")
    
    try {
      const result = await verifyOTP(otp)
      if (result.success && result.user) {
        // Call the auth success handler from context
        await onAuthSuccess(result.user.uid, getCleanPhone())
      } else {
        setError(result.error || "Invalid code")
      }
    } catch (err) {
      setError("Verification failed. Please try again.")
    } finally {
      setLoading(false)
    }
  }
  
  const handleResendOTP = async () => {
    if (countdown > 0) return
    await handleSendOTP()
  }
  
  const handleOtpChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, "").slice(0, 6)
    setOtp(value)
    setError("")
  }

  return (
    <div className={`h-full flex flex-col ${darkMode ? 'bg-gray-900' : 'bg-gradient-to-b from-[#495E8E] to-[#3a4d7a]'}`}>
      {/* Header */}
      <div className="flex-shrink-0 pt-12 pb-8 px-6 text-center">
        <div className="w-20 h-20 mx-auto mb-4 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-sm">
          <Image src="/qpark-logo.png" alt="QPark" width={50} height={50} className="object-contain" />
        </div>
        <h1 className="text-2xl font-bold text-white mb-2">QPark</h1>
        <p className="text-white/70 text-sm">{t.smartParking || "Smart Parking Solution"}</p>
      </div>
      
      {/* Content */}
      <div className={`flex-1 ${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-t-[32px] px-6 pt-8 pb-6`}>
        {step === "phone" ? (
          <>
            {/* Phone Input Step */}
            <div className="mb-6">
              <h2 className={`text-xl font-bold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                {t.enterPhone || "Enter your phone number"}
              </h2>
              <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                {t.sendCode || "We'll send you a verification code"}
              </p>
            </div>
            
            <div className="space-y-4">
              <div className="relative">
                <Phone className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`} />
                <Input
                  type="tel"
                  placeholder="+7 (XXX) XXX-XX-XX"
                  value={phone}
                  onChange={handlePhoneChange}
                  className={`pl-12 h-14 text-lg rounded-xl ${
                    darkMode 
                      ? 'bg-gray-700 border-gray-600 text-white placeholder:text-gray-500' 
                      : 'bg-gray-50 border-gray-200'
                  } ${error ? 'border-red-500' : ''}`}
                />
              </div>
              
              {error && (
                <p className="text-red-500 text-sm">{error}</p>
              )}
              
              <Button
                onClick={handleSendOTP}
                disabled={loading || phone.replace(/\D/g, "").length < 11}
                className="w-full h-14 text-lg rounded-xl bg-[#495E8E] hover:bg-[#3a4d7a] text-white"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin mr-2" />
                ) : (
                  <ArrowRight className="w-5 h-5 mr-2" />
                )}
                {t.continue || "Continue"}
              </Button>
            </div>
            
            {/* Recaptcha container */}
            <div id="recaptcha-container" className="mt-4"></div>
            
            {/* Terms */}
            <p className={`mt-6 text-xs text-center ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
              {t.termsAgree || "By continuing, you agree to our"}{" "}
              <span className="text-[#495E8E] underline">{t.termsOfService || "Terms of Service"}</span>
              {" "}{t.and || "and"}{" "}
              <span className="text-[#495E8E] underline">{t.privacyPolicy || "Privacy Policy"}</span>
            </p>
          </>
        ) : (
          <>
            {/* OTP Verification Step */}
            <button
              onClick={() => { setStep("phone"); setOtp(""); setError("") }}
              className={`flex items-center gap-2 mb-6 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="text-sm">{t.back || "Back"}</span>
            </button>
            
            <div className="mb-6">
              <div className="w-16 h-16 mx-auto mb-4 bg-green-100 rounded-full flex items-center justify-center">
                <Shield className="w-8 h-8 text-green-600" />
              </div>
              <h2 className={`text-xl font-bold mb-2 text-center ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                {t.verifyPhone || "Verify your phone"}
              </h2>
              <p className={`text-sm text-center ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                {t.codeSent || "Code sent to"} {phone}
              </p>
            </div>
            
            <div className="space-y-4">
              <Input
                type="text"
                inputMode="numeric"
                placeholder="000000"
                value={otp}
                onChange={handleOtpChange}
                maxLength={6}
                className={`h-16 text-2xl text-center tracking-[0.5em] font-mono rounded-xl ${
                  darkMode 
                    ? 'bg-gray-700 border-gray-600 text-white placeholder:text-gray-600' 
                    : 'bg-gray-50 border-gray-200'
                } ${error ? 'border-red-500' : ''}`}
              />
              
              {error && (
                <p className="text-red-500 text-sm text-center">{error}</p>
              )}
              
              <Button
                onClick={handleVerifyOTP}
                disabled={loading || otp.length !== 6}
                className="w-full h-14 text-lg rounded-xl bg-[#495E8E] hover:bg-[#3a4d7a] text-white"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin mr-2" />
                ) : null}
                {t.verify || "Verify"}
              </Button>
              
              <button
                onClick={handleResendOTP}
                disabled={countdown > 0 || loading}
                className={`w-full text-center text-sm ${
                  countdown > 0 
                    ? darkMode ? 'text-gray-500' : 'text-gray-400'
                    : 'text-[#495E8E]'
                }`}
              >
                {countdown > 0 
                  ? `${t.resendIn || "Resend code in"} ${countdown}s`
                  : t.resendCode || "Resend code"
                }
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
