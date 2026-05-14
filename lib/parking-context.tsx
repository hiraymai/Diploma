"use client"

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react"
import { onAuthStateChanged, signOut as firebaseSignOut } from "firebase/auth"
import { auth } from "@/lib/firebase/config"
import { supabase, getUserByFirebaseUID, createUser, getUserCars, getParkingSpots, getUserBookings, getUserTransactions } from "@/lib/supabase/client"

export type SpotStatus = "FREE" | "BOOKED" | "OCCUPIED" | "RESERVED" | "REPAIR"
export type SpotType = "SHORT_TERM" | "LONG_TERM"

export interface ParkingSpot {
  id: string
  spotNumber: string
  type: SpotType
  status: SpotStatus
  floor: number
  hourlyRate: number
  dailyRate: number
}

export interface Car {
  id: string
  brand: string
  model: string
  plateNumber: string
}

export interface User {
  id: string
  firebaseUid: string
  name: string
  phone: string
  balance: number
  bonusPoints: number
  noShowCount: number
  isBanned: boolean
}

export interface ActiveBooking {
  id: string
  spotId: string
  spotNumber: string
  type: "SHORT_TERM" | "LONG_TERM"
  startTime: Date
  hasArrived: boolean
  rentalDays?: number
  totalCost: number
  isPaid: boolean
}

export interface Transaction {
  id: string
  type: "TOPUP" | "PAYMENT" | "REFUND" | "CASHBACK"
  amount: number
  description: string | null
  createdAt: Date
}

// Translations
export type Language = "en" | "kk" | "ru"

export const translations = {
  en: {
    // Navigation
    home: "Home",
    map: "Map",
    booking: "Booking",
    wallet: "Wallet",
    profile: "Profile",
    // Auth
    enterPhone: "Enter your phone number",
    sendCode: "We'll send you a verification code",
    continue: "Continue",
    verifyPhone: "Verify your phone",
    codeSent: "Code sent to",
    verify: "Verify",
    resendCode: "Resend code",
    resendIn: "Resend code in",
    invalidPhone: "Invalid phone number",
    invalidOtp: "Please enter 6-digit code",
    back: "Back",
    termsAgree: "By continuing, you agree to our",
    and: "and",
    smartParking: "Smart Parking Solution",
    loading: "Loading...",
    // Home
    welcomeBack: "Welcome back,",
    findParking: "Find parking",
    activeSession: "Active session",
    myCars: "My cars",
    recentActivity: "Recent activity",
    bonusPoints: "Bonus points",
    shortTerm: "Short-term",
    longTerm: "Long-term",
    spotsAvailable: "spots available",
    quickActions: "Quick Actions",
    bookNow: "Book now",
    findAvailableParking: "Find available parking",
    registered: "registered",
    specialOffer: "Special Offer!",
    getDiscount: "Get 50% off your first booking",
    activeBooking: "Active Booking",
    remaining: "remaining",
    // Profile
    settings: "Settings",
    darkMode: "Dark Mode",
    language: "Language",
    notifications: "Notifications",
    pushNotifications: "Push Notifications",
    securityPrivacy: "Security & Privacy",
    privacyPolicy: "Privacy Policy",
    termsOfService: "Terms of Service",
    about: "About",
    appVersion: "App Version",
    build: "Build",
    deleteAccount: "Delete Account",
    signOut: "Sign Out",
    appearance: "Appearance",
    selectLanguage: "Select Language",
    noShowCounter: "No show counter",
    balance: "Balance",
    bonus: "Bonus",
    contactSupport: "Contact support:",
    cancel: "Cancel",
    delete: "Delete",
    close: "Close",
    add: "+ Add",
    noCarsRegistered: "No cars registered",
    // Wallet
    topUp: "Top Up",
    history: "History",
    enterAmount: "Enter amount",
    promoCode: "Promo code",
    apply: "Apply",
    pay: "Pay",
    transactionHistory: "Transaction history",
    noTransactions: "No transactions yet",
    payment: "Payment",
    topUpWallet: "Top up wallet",
    refund: "Refund",
    cashback: "Cashback",
    // Map
    parkingMap: "Parking Map",
    selectSpot: "Select a spot",
    floor: "Floor",
    available: "Available",
    booked: "Booked",
    occupied: "Occupied",
    reserved: "Reserved",
    underRepair: "Under repair",
    // Booking
    spotDetails: "Spot Details",
    hourlyRate: "Hourly rate",
    dailyRate: "Daily rate",
    bookThisSpot: "Book this spot",
    confirmBooking: "Confirm Booking",
    parkingDuration: "Parking duration",
    hours: "hours",
    days: "days",
    estimatedCost: "Estimated cost",
    confirm: "Confirm",
    bookingConfirmed: "Booking Confirmed!",
    yourSpot: "Your spot",
    timeRemaining: "Time remaining",
    arrivedBtn: "I've Arrived",
    endSession: "End Session",
    extendSession: "Extend Session",
    payNow: "Pay Now",
    noActiveBooking: "No active booking",
    browseSpots: "Browse available spots",
    rentalPeriod: "Rental period",
    day: "day",
    week: "week",
    twoWeeks: "2 weeks",
    selectRentalPeriod: "Select rental period",
    totalCost: "Total cost",
  },
  kk: {
    // Navigation
    home: "Басты бет",
    map: "Карта",
    booking: "Брондау",
    wallet: "Әмиян",
    profile: "Профиль",
    // Auth
    enterPhone: "Телефон нөміріңізді енгізіңіз",
    sendCode: "Біз сізге растау кодын жібереміз",
    continue: "Жалғастыру",
    verifyPhone: "Телефонды растау",
    codeSent: "Код жіберілді",
    verify: "Растау",
    resendCode: "Кодты қайта жіберу",
    resendIn: "Кодты қайта жіберу",
    invalidPhone: "Қате телефон нөмірі",
    invalidOtp: "6 санды код енгізіңіз",
    back: "Артқа",
    termsAgree: "Жалғастыра отырып, сіз келісесіз",
    and: "және",
    smartParking: "Ақылды паркинг шешімі",
    loading: "Жүктелуде...",
    // Home
    welcomeBack: "Қайта келдіңіз,",
    findParking: "Паркинг табу",
    activeSession: "Белсенді сессия",
    myCars: "Менің көліктерім",
    recentActivity: "Соңғы әрекеттер",
    bonusPoints: "Бонус ұпайлар",
    shortTerm: "Қысқа мерзімді",
    longTerm: "Ұзақ мерзімді",
    spotsAvailable: "орын бар",
    quickActions: "Жылдам әрекеттер",
    bookNow: "Қазір брондау",
    findAvailableParking: "Бос паркинг табу",
    registered: "тіркелген",
    specialOffer: "Арнайы ұсыныс!",
    getDiscount: "Алғашқы брондауға 50% жеңілдік",
    activeBooking: "Белсенді брондау",
    remaining: "қалды",
    // Profile
    settings: "Параметрлер",
    darkMode: "Қараңғы режим",
    language: "Тіл",
    notifications: "Хабарландырулар",
    pushNotifications: "Push хабарландырулар",
    securityPrivacy: "Қауіпсіздік және құпиялылық",
    privacyPolicy: "Құпиялылық саясаты",
    termsOfService: "Қызмет көрсету шарттары",
    about: "Қосымша туралы",
    appVersion: "Қосымша нұсқасы",
    build: "Құрастыру",
    deleteAccount: "Аккаунтты жою",
    signOut: "Шығу",
    appearance: "Көрініс",
    selectLanguage: "Тілді таңдау",
    noShowCounter: "Келмеу есептегіші",
    balance: "Баланс",
    bonus: "Бонус",
    contactSupport: "Қолдау қызметі:",
    cancel: "Бас тарту",
    delete: "Жою",
    close: "Жабу",
    add: "+ Қосу",
    noCarsRegistered: "Көліктер тіркелмеген",
    // Wallet
    topUp: "Толтыру",
    history: "Тарих",
    enterAmount: "Соманы енгізіңіз",
    promoCode: "Промокод",
    apply: "Қолдану",
    pay: "Төлеу",
    transactionHistory: "Транзакция тарихы",
    noTransactions: "Транзакциялар жоқ",
    payment: "Төлем",
    topUpWallet: "Әмиянды толтыру",
    refund: "Қайтару",
    cashback: "Кэшбэк",
    // Map
    parkingMap: "Паркинг картасы",
    selectSpot: "Орын таңдаңыз",
    floor: "Қабат",
    available: "Бос",
    booked: "Брондалған",
    occupied: "Бос емес",
    reserved: "Резервтелген",
    underRepair: "Жөндеуде",
    // Booking
    spotDetails: "Орын мәліметтері",
    hourlyRate: "Сағаттық тариф",
    dailyRate: "Күндік тариф",
    bookThisSpot: "Осы орынды брондау",
    confirmBooking: "Брондауды растау",
    parkingDuration: "Паркинг ұзақтығы",
    hours: "сағат",
    days: "күн",
    estimatedCost: "Болжамды құны",
    confirm: "Растау",
    bookingConfirmed: "Брондау расталды!",
    yourSpot: "Сіздің орныңыз",
    timeRemaining: "Қалған уақыт",
    arrivedBtn: "Мен келдім",
    endSession: "Сессияны аяқтау",
    extendSession: "Сессияны ұзарту",
    payNow: "Қазір төлеу",
    noActiveBooking: "Белсенді брондау жоқ",
    browseSpots: "Бос орындарды қарау",
    rentalPeriod: "Жалдау мерзімі",
    day: "күн",
    week: "апта",
    twoWeeks: "2 апта",
    selectRentalPeriod: "Жалдау мерзімін таңдаңыз",
    totalCost: "Жалпы құны",
  },
  ru: {
    // Navigation
    home: "Главная",
    map: "Карта",
    booking: "Бронь",
    wallet: "Кошелёк",
    profile: "Профиль",
    // Auth
    enterPhone: "Введите номер телефона",
    sendCode: "Мы отправим вам код подтверждения",
    continue: "Продолжить",
    verifyPhone: "Подтвердите телефон",
    codeSent: "Код отправлен на",
    verify: "Подтвердить",
    resendCode: "Отправить код повторно",
    resendIn: "Повторная отправка через",
    invalidPhone: "Неверный номер телефона",
    invalidOtp: "Введите 6-значный код",
    back: "Назад",
    termsAgree: "Продолжая, вы соглашаетесь с",
    and: "и",
    smartParking: "Умная парковка",
    loading: "Загрузка...",
    // Home
    welcomeBack: "С возвращением,",
    findParking: "Найти парковку",
    activeSession: "Активная сессия",
    myCars: "Мои автомобили",
    recentActivity: "Последние действия",
    bonusPoints: "Бонусные баллы",
    shortTerm: "Краткосрочная",
    longTerm: "Долгосрочная",
    spotsAvailable: "мест доступно",
    quickActions: "Быстрые действия",
    bookNow: "Забронировать",
    findAvailableParking: "Найти свободную парковку",
    registered: "зарегистрировано",
    specialOffer: "Специальное предложение!",
    getDiscount: "Скидка 50% на первое бронирование",
    activeBooking: "Активное бронирование",
    remaining: "осталось",
    // Profile
    settings: "Настройки",
    darkMode: "Тёмный режим",
    language: "Язык",
    notifications: "Уведомления",
    pushNotifications: "Push-уведомления",
    securityPrivacy: "Безопасность и конфиденциальность",
    privacyPolicy: "Политика конфиденциальности",
    termsOfService: "Условия использования",
    about: "О приложении",
    appVersion: "Версия приложения",
    build: "Сборка",
    deleteAccount: "Удалить аккаунт",
    signOut: "Выйти",
    appearance: "Оформление",
    selectLanguage: "Выберите язык",
    noShowCounter: "Счётчик неявок",
    balance: "Баланс",
    bonus: "Бонус",
    contactSupport: "Служба поддержки:",
    cancel: "Отмена",
    delete: "Удалить",
    close: "Закрыть",
    add: "+ Добавить",
    noCarsRegistered: "Нет зарегистрированных автомобилей",
    // Wallet
    topUp: "Пополнить",
    history: "История",
    enterAmount: "Введите сумму",
    promoCode: "Промокод",
    apply: "Применить",
    pay: "Оплатить",
    transactionHistory: "История транзакций",
    noTransactions: "Транзакций пока нет",
    payment: "Оплата",
    topUpWallet: "Пополнение кошелька",
    refund: "Возврат",
    cashback: "Кэшбэк",
    // Map
    parkingMap: "Карта парковки",
    selectSpot: "Выберите место",
    floor: "Этаж",
    available: "Свободно",
    booked: "Забронировано",
    occupied: "Занято",
    reserved: "Зарезервировано",
    underRepair: "На ремонте",
    // Booking
    spotDetails: "Информация о месте",
    hourlyRate: "Почасовой тариф",
    dailyRate: "Дневной тариф",
    bookThisSpot: "Забронировать место",
    confirmBooking: "Подтвердить бронирование",
    parkingDuration: "Время парковки",
    hours: "часов",
    days: "дней",
    estimatedCost: "Примерная стоимость",
    confirm: "Подтвердить",
    bookingConfirmed: "Бронирование подтверждено!",
    yourSpot: "Ваше место",
    timeRemaining: "Осталось времени",
    arrivedBtn: "Я приехал",
    endSession: "Завершить сессию",
    extendSession: "Продлить сессию",
    payNow: "Оплатить сейчас",
    noActiveBooking: "Нет активного бронирования",
    browseSpots: "Посмотреть свободные места",
    rentalPeriod: "Период аренды",
    day: "день",
    week: "неделя",
    twoWeeks: "2 недели",
    selectRentalPeriod: "Выберите период аренды",
    totalCost: "Общая стоимость",
  }
}

interface ParkingContextType {
  // Auth state
  isAuthenticated: boolean
  isLoading: boolean
  user: User | null
  cars: Car[]
  
  // Navigation
  currentScreen: string
  setCurrentScreen: (screen: string) => void
  
  // Parking data
  parkingSpots: ParkingSpot[]
  selectedSpot: ParkingSpot | null
  setSelectedSpot: (spot: ParkingSpot | null) => void
  activeBooking: ActiveBooking | null
  setActiveBooking: (booking: ActiveBooking | null) => void
  transactions: Transaction[]
  
  // Settings
  darkMode: boolean
  setDarkMode: (mode: boolean) => void
  language: Language
  setLanguage: (lang: Language) => void
  t: typeof translations.en
  
  // Actions
  onAuthSuccess: (firebaseUid: string, phone: string) => Promise<void>
  signOut: () => Promise<void>
  refetchUser: () => Promise<void>
  refetchCars: () => Promise<void>
  refetchSpots: () => Promise<void>
  refetchTransactions: () => Promise<void>
}

const ParkingContext = createContext<ParkingContextType | null>(null)

export function ParkingProvider({ children }: { children: ReactNode }) {
  // Auth state
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [user, setUser] = useState<User | null>(null)
  const [cars, setCars] = useState<Car[]>([])
  
  // Navigation
  const [currentScreen, setCurrentScreen] = useState("home")
  
  // Parking data
  const [parkingSpots, setParkingSpots] = useState<ParkingSpot[]>([])
  const [selectedSpot, setSelectedSpot] = useState<ParkingSpot | null>(null)
  const [activeBooking, setActiveBooking] = useState<ActiveBooking | null>(null)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  
  // Settings
  const [darkMode, setDarkMode] = useState(false)
  const [language, setLanguage] = useState<Language>("ru")
  
  const t = translations[language]
  
  // Fetch user data from Supabase
  const fetchUserData = useCallback(async (firebaseUid: string) => {
    try {
      const userData = await getUserByFirebaseUID(firebaseUid)
      if (userData) {
        setUser({
          id: userData.id,
          firebaseUid: userData.firebase_uid,
          name: userData.name || "User",
          phone: userData.phone,
          balance: Number(userData.wallet_balance) || 0,
          bonusPoints: userData.bonus_points || 0,
          noShowCount: userData.no_show_count || 0,
          isBanned: userData.is_banned || false,
        })
        
        // Fetch cars
        const userCars = await getUserCars(userData.id)
        setCars(userCars.map(c => ({
          id: c.id,
          brand: c.brand,
          model: c.model,
          plateNumber: c.plate_number,
        })))
        
        // Fetch transactions
        const userTransactions = await getUserTransactions(userData.id)
        setTransactions(userTransactions.map(t => ({
          id: t.id,
          type: t.type as Transaction["type"],
          amount: Number(t.amount),
          description: t.description,
          createdAt: new Date(t.created_at),
        })))
        
        // Fetch active booking
        const userBookings = await getUserBookings(userData.id)
        const active = userBookings.find(b => b.status === "ACTIVE")
        if (active) {
          const spot = parkingSpots.find(s => s.id === active.spot_id)
          setActiveBooking({
            id: active.id,
            spotId: active.spot_id,
            spotNumber: spot?.spotNumber || "",
            type: active.type as "SHORT_TERM" | "LONG_TERM",
            startTime: new Date(active.start_time),
            hasArrived: !!active.arrival_time,
            rentalDays: active.rental_days || undefined,
            totalCost: Number(active.total_cost) || 0,
            isPaid: active.paid || false,
          })
        }
        
        setIsAuthenticated(true)
      }
    } catch (error) {
      console.error("Error fetching user data:", error)
    }
  }, [parkingSpots])
  
  // Fetch parking spots
  const fetchParkingSpots = useCallback(async () => {
    try {
      const spots = await getParkingSpots()
      setParkingSpots(spots.map(s => ({
        id: s.id,
        spotNumber: s.spot_number,
        type: s.type as SpotType,
        status: s.status as SpotStatus,
        floor: s.floor,
        hourlyRate: Number(s.hourly_rate),
        dailyRate: Number(s.daily_rate),
      })))
    } catch (error) {
      console.error("Error fetching parking spots:", error)
    }
  }, [])
  
  // Listen for Firebase auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        await fetchParkingSpots()
        await fetchUserData(firebaseUser.uid)
      } else {
        setIsAuthenticated(false)
        setUser(null)
        setCars([])
        setTransactions([])
        setActiveBooking(null)
      }
      setIsLoading(false)
    })
    
    // Also fetch spots initially
    fetchParkingSpots()
    
    return () => unsubscribe()
  }, [fetchUserData, fetchParkingSpots])
  
  // Subscribe to realtime updates for parking spots
  useEffect(() => {
    const channel = supabase
      .channel('parking_spots_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'parking_spots' }, () => {
        fetchParkingSpots()
      })
      .subscribe()
    
    return () => {
      supabase.removeChannel(channel)
    }
  }, [fetchParkingSpots])
  
  // Auth success handler
  const onAuthSuccess = async (firebaseUid: string, phone: string) => {
    setIsLoading(true)
    try {
      // Check if user exists
      let userData = await getUserByFirebaseUID(firebaseUid)
      
      // Create user if not exists
      if (!userData) {
        userData = await createUser(firebaseUid, phone)
      }
      
      if (userData) {
        await fetchUserData(firebaseUid)
      }
    } catch (error) {
      console.error("Error in onAuthSuccess:", error)
    } finally {
      setIsLoading(false)
    }
  }
  
  // Sign out
  const handleSignOut = async () => {
    try {
      await firebaseSignOut(auth)
      setIsAuthenticated(false)
      setUser(null)
      setCars([])
      setTransactions([])
      setActiveBooking(null)
      setCurrentScreen("home")
    } catch (error) {
      console.error("Error signing out:", error)
    }
  }
  
  // Refetch functions
  const refetchUser = async () => {
    if (user?.firebaseUid) {
      await fetchUserData(user.firebaseUid)
    }
  }
  
  const refetchCars = async () => {
    if (user?.id) {
      const userCars = await getUserCars(user.id)
      setCars(userCars.map(c => ({
        id: c.id,
        brand: c.brand,
        model: c.model,
        plateNumber: c.plate_number,
      })))
    }
  }
  
  const refetchSpots = async () => {
    await fetchParkingSpots()
  }
  
  const refetchTransactions = async () => {
    if (user?.id) {
      const userTransactions = await getUserTransactions(user.id)
      setTransactions(userTransactions.map(t => ({
        id: t.id,
        type: t.type as Transaction["type"],
        amount: Number(t.amount),
        description: t.description,
        createdAt: new Date(t.created_at),
      })))
    }
  }
  
  return (
    <ParkingContext.Provider
      value={{
        isAuthenticated,
        isLoading,
        user,
        cars,
        currentScreen,
        setCurrentScreen,
        parkingSpots,
        selectedSpot,
        setSelectedSpot,
        activeBooking,
        setActiveBooking,
        transactions,
        darkMode,
        setDarkMode,
        language,
        setLanguage,
        t,
        onAuthSuccess,
        signOut: handleSignOut,
        refetchUser,
        refetchCars,
        refetchSpots,
        refetchTransactions,
      }}
    >
      {children}
    </ParkingContext.Provider>
  )
}

export function useParking() {
  const context = useContext(ParkingContext)
  if (!context) {
    throw new Error("useParking must be used within a ParkingProvider")
  }
  return context
}
