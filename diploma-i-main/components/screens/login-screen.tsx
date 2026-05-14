"use client"

import { useState } from "react"
import { useParking, mapBackendUser } from "@/lib/parking-context"
import Image from "next/image"

export function LoginScreen() {
  const { setIsAuthenticated, setCurrentScreen, setAuthToken, setUser } = useParking()
  const [step, setStep] = useState<"phone" | "otp">("phone")
  const [phone, setPhone] = useState("+7")
  const [otp, setOtp] = useState(["", "", "", ""])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [demoCode, setDemoCode] = useState<string | null>(null)
  const [isNewUser, setIsNewUser] = useState(false)

  const handleSendOtp = async () => {
    if (phone.length < 10) return
    setLoading(true)
    setError(null)
    setDemoCode(null)

    try {
      const res = await fetch("/backend/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phoneNumber: phone }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || "Не удалось отправить код")
      }
      const data = await res.json()
      setDemoCode(data.demoCode || null)
      setStep("otp")
    } catch (e: any) {
      setError(e.message || "Something went wrong")
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyOtp = async () => {
    if (otp.join("").length < 4) return
    setLoading(true)
    setError(null)

    try {
      const res = await fetch("/backend/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phoneNumber: phone, code: otp.join("") }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || "Неверный или истёкший код")
      }

      setIsNewUser(data.isNewUser || false)
      setAuthToken(data.token)
      setUser(mapBackendUser(data.user))
      setIsAuthenticated(true)
      setCurrentScreen("home")
    } catch (e: any) {
      setError(e.message || "Verification failed")
    } finally {
      setLoading(false)
    }
  }

  const handleOtpChange = (index: number, value: string) => {
    if (value.length <= 1) {
      const newOtp = [...otp]
      newOtp[index] = value
      setOtp(newOtp)

      // Auto-focus next input
      if (value && index < 3) {
        const nextInput = document.getElementById(`otp-${index + 1}`)
        if (nextInput) {
          nextInput.focus()
        }
      }
    }
  }

  return (
    <div className="relative mx-auto h-[844px] w-[390px] overflow-hidden rounded-[3rem] border-[12px] border-foreground/90 bg-gray-50 shadow-2xl">
      {/* Status bar */}
      <div className="flex h-12 items-center justify-between bg-white px-6 text-sm">
        <span className="font-medium">9:41</span>
        <div className="absolute left-1/2 top-3 h-6 w-28 -translate-x-1/2 rounded-full bg-foreground/90" />
        <div className="flex items-center gap-1">
          <div className="h-3 w-4 rounded-sm border border-foreground/70">
            <div className="ml-0.5 mt-0.5 h-2 w-2.5 rounded-sm bg-foreground/70" />
          </div>
        </div>
      </div>

      {/* Main content with Safe Area */}
      <div className="h-[calc(100%-48px)] overflow-y-auto bg-gray-50">
        {/* Header - White rounded top section */}
        <div className="bg-white rounded-b-3xl px-6 py-8 shadow-md">
          <div className="flex flex-col items-center">
            <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4">
              <Image
                src="/app_icon2.svg"
                alt="QPark Logo"
                width={200}
                height={200}
                className="object-fill"
              />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 drop-shadow-sm">QPark</h1>
            <p className="text-sm text-gray-500 mt-1 font-medium drop-shadow-sm">Smart parking for your convenience</p>
          </div>
        </div>

        {/* Main Card - White card for content */}
        <div className="px-6 py-8">
          <div className="bg-white rounded-3xl p-6 shadow-md">
            {error && (
              <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">
                {error}
              </div>
            )}

            {step === "phone" && (
              <div className="space-y-4">
                <div>
                  <h2 className="text-xl font-bold text-[#333333] drop-shadow-sm">Welcome</h2>
                  <p className="text-sm text-gray-600 drop-shadow-sm">Enter your phone number to continue</p>
                </div>

                <div className="relative">
                  <div className="absolute left-4 top-1/2 transform -translate-y-1/2">
                    <Image
                      src="/Phone_light.svg"
                      alt="Phone"
                      width={20}
                      height={20}
                    />
                  </div>
                  <input
                    type="tel"
                    placeholder="+7"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full pl-12 pr-4 py-4 bg-gray-100 rounded-2xl text-gray-900 placeholder-gray-500 focus:outline-none"
                  />
                </div>

                <button
                  className="w-full bg-[#495E8E] text-white py-4 rounded-2xl font-semibold active:bg-[#3d4c73] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  onClick={handleSendOtp}
                  disabled={phone.length < 10 || loading}
                >
                  {loading ? "Sending..." : "Continue"}
                </button>

                <p className="text-center text-xs text-gray-500">
                  By continuing, you agree to our{" "}
                  <button className="text-[#296186] hover:underline font-medium">Terms of Service</button>
                </p>
              </div>
            )}

            {step === "otp" && (
              <div className="space-y-4">
                <div>
                  <h2 className="text-xl font-bold text-[#333333]">Введите код</h2>
                  <p className="text-xs text-gray-400 mt-1">{phone}</p>
                </div>

                {/* Demo code block — показываем код для диплома */}
                {demoCode && (
                  <div className="bg-amber-50 border border-amber-300 rounded-2xl p-4 text-center">
                    <p className="text-xs text-amber-600 font-medium mb-1">📱 Ваш код подтверждения</p>
                    <p className="text-4xl font-mono font-bold text-amber-700 tracking-[0.3em]">{demoCode}</p>
                    <p className="text-xs text-amber-500 mt-1">Действителен 5 минут</p>
                    <button
                      className="mt-2 text-xs text-amber-600 underline"
                      onClick={() => {
                        const digits = demoCode.split("")
                        setOtp(digits)
                      }}
                    >
                      Заполнить автоматически
                    </button>
                  </div>
                )}

                <div className="flex justify-start gap-2">
                  {[0, 1, 2, 3].map((i) => (
                    <input
                      key={i}
                      id={`otp-${i}`}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      className="w-16 h-16 bg-gray-100 rounded-2xl text-center text-2xl font-semibold text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#495E8E]"
                      value={otp[i] || ""}
                      onChange={(e) => handleOtpChange(i, e.target.value)}
                    />
                  ))}
                </div>

                <button
                  className="w-full bg-[#495E8E] text-white py-4 rounded-2xl font-semibold active:bg-[#3d4c73] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  onClick={handleVerifyOtp}
                  disabled={otp.join("").length < 4 || loading}
                >
                  {loading ? "Проверка..." : "Подтвердить"}
                </button>

                <button
                  className="w-full text-[#4a5568] hover:text-[#296186] font-medium py-2 transition-colors text-sm"
                  onClick={() => { setStep("phone"); setOtp(["", "", "", ""]); setError(null); setDemoCode(null) }}
                >
                  ← Изменить номер
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
