"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { createClient } from "@/lib/supabase/client"
import type { User as SupabaseUser } from "@supabase/supabase-js"

export type SpotStatus = "FREE" | "BOOKED" | "OCCUPIED" | "RESERVED" | "REPAIR"
export type SpotType = "SHORT_TERM" | "LONG_TERM"
export type BookingStatus = "ACTIVE" | "COMPLETED" | "CANCELLED" | "NO_SHOW"
export type BookingType = "SHORT_TERM" | "LONG_TERM"

export interface ParkingSpot {
  id: string
  spot_number: string
  type: SpotType
  status: SpotStatus
  floor: number
  hourly_rate: number
  daily_rate: number
}

export interface Car {
  id: string
  user_id: string
  brand: string
  model: string
  plate_number: string
}

export interface Profile {
  id: string
  phone: string | null
  name: string | null
  wallet_balance: number
  bonus_points: number
  no_show_count: number
  is_banned: boolean
}

export interface Transaction {
  id: string
  user_id: string
  type: "TOPUP" | "PAYMENT" | "REFUND" | "CASHBACK"
  amount: number
  description: string | null
  created_at: string
}

export interface Booking {
  id: string
  user_id: string
  spot_id: string
  car_id: string | null
  type: BookingType
  status: BookingStatus
  start_time: string
  end_time: string | null
  arrival_time: string | null
  rental_days: number | null
  total_cost: number
  paid: boolean
  parking_spots?: ParkingSpot
  cars?: Car
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
    // Auth
    enterPhone: "Enter your phone number",
    sendCode: "Send Code",
    enterOTP: "Enter verification code",
    verifyCode: "Verify",
    invalidOTP: "Invalid or expired code",
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
    // Map
    parkingMap: "Parking Map",
    spots: "spots",
    free: "Free",
    booked: "Booked",
    occupied: "Occupied",
    reserved: "Reserved",
    repair: "Repair",
    // Wallet
    manageBalance: "Manage your balance",
    currentBalance: "Current balance",
    topUpBalance: "+ Top up balance",
    promoCodeAvailable: "Promo Code Available",
    promoDescription: "FIRST - 150₸ off your first parking",
    active: "Active",
    transactionHistory: "Transaction History",
    walletTopUp: "Wallet top-up via",
    selectAmount: "Select Amount",
    payWithStripe: "Pay with Stripe",
    poweredByStripe: "Powered by Stripe (Test Mode)",
    // Booking
    noActiveBooking: "No active booking",
    findParkingBtn: "Find Parking",
    activeBookingTitle: "Active Booking",
    longTermReservation: "Long-term reservation",
    shortTermParking: "Short-term parking",
    parked: "Parked",
    enRoute: "En Route",
    timeToArrive: "Time to arrive",
    hurry: "Hurry! Your booking will expire soon.",
    simulateArrival: "Simulate Arrival",
    parkingDuration: "Parking Duration",
    currentCost: "Current Cost",
    rentalPeriod: "Rental Period",
    daysRemaining: "days remaining",
    paid: "Paid",
    parkingSpot: "Parking Spot",
    vehicle: "Vehicle",
    entryMethod: "Entry Method",
    lprCamera: "LPR Camera",
    autoPlateRecognition: "Automatic plate recognition",
    costBreakdown: "Cost Breakdown",
    firstHourMin: "First hour (minimum)",
    extraTime: "Extra time",
    total: "Total",
    payAndExit: "Pay & Exit",
    processing: "Processing...",
    cancelBooking: "Cancel Booking",
    extendRental: "Extend Rental",
    loading: "Loading...",
  },
  kk: {
    // Navigation
    home: "Басты",
    map: "Карта",
    booking: "Брондау",
    wallet: "Әмиян",
    profile: "Профиль",
    // Home
    welcomeBack: "Қош келдіңіз,",
    findParking: "Тұрақ табу",
    activeSession: "Белсенді сессия",
    myCars: "Менің көліктерім",
    recentActivity: "Соңғы әрекеттер",
    bonusPoints: "Бонус ұпайлар",
    shortTerm: "Қысқа мерзімді",
    longTerm: "Ұзақ мерзімді",
    spotsAvailable: "орын бар",
    quickActions: "Жылдам әрекеттер",
    bookNow: "Қазір брондау",
    findAvailableParking: "Бос тұрақ табу",
    registered: "тіркелген",
    specialOffer: "Арнайы ұсыныс!",
    getDiscount: "Бірінші брондауға 50% жеңілдік",
    activeBooking: "Белсенді брондау",
    remaining: "қалды",
    // Auth
    enterPhone: "Телефон нөміріңізді енгізіңіз",
    sendCode: "Код жіберу",
    enterOTP: "Растау кодын енгізіңіз",
    verifyCode: "Растау",
    invalidOTP: "Жарамсыз немесе мерзімі өткен код",
    // Profile
    settings: "Баптаулар",
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
    appearance: "Сыртқы түрі",
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
    // Map
    parkingMap: "Тұрақ картасы",
    spots: "орын",
    free: "Бос",
    booked: "Брондалған",
    occupied: "Бос емес",
    reserved: "Резервтелген",
    repair: "Жөндеуде",
    // Wallet
    manageBalance: "Балансты басқару",
    currentBalance: "Ағымдағы баланс",
    topUpBalance: "+ Балансты толтыру",
    promoCodeAvailable: "Промокод бар",
    promoDescription: "FIRST - бірінші тұраққа 150₸ жеңілдік",
    active: "Белсенді",
    transactionHistory: "Транзакция тарихы",
    walletTopUp: "Әмиянды толтыру",
    selectAmount: "Соманы таңдау",
    payWithStripe: "Stripe арқылы төлеу",
    poweredByStripe: "Stripe қуатымен (Тест режимі)",
    // Booking
    noActiveBooking: "Белсенді брондау жоқ",
    findParkingBtn: "Тұрақ табу",
    activeBookingTitle: "Белсенді брондау",
    longTermReservation: "Ұзақ мерзімді резерв",
    shortTermParking: "Қысқа мерзімді тұрақ",
    parked: "Тұрақта",
    enRoute: "Жолда",
    timeToArrive: "Келу уақыты",
    hurry: "Тезірек! Брондау мерзімі аяқталады.",
    simulateArrival: "Келуді модельдеу",
    parkingDuration: "Тұрақ ұзақтығы",
    currentCost: "Ағымдағы құн",
    rentalPeriod: "Жалдау мерзімі",
    daysRemaining: "күн қалды",
    paid: "Төленген",
    parkingSpot: "Тұрақ орны",
    vehicle: "Көлік",
    entryMethod: "Кіру әдісі",
    lprCamera: "LPR камера",
    autoPlateRecognition: "Автоматты нөмірді тану",
    costBreakdown: "Құн бөлімшесі",
    firstHourMin: "Бірінші сағат (минимум)",
    extraTime: "Қосымша уақыт",
    total: "Барлығы",
    payAndExit: "Төлеу және шығу",
    processing: "Өңделуде...",
    cancelBooking: "Брондауды болдырмау",
    extendRental: "Жалдауды ұзарту",
    loading: "Жүктелуде...",
  },
  ru: {
    // Navigation
    home: "Главная",
    map: "Карта",
    booking: "Бронь",
    wallet: "Кошелёк",
    profile: "Профиль",
    // Home
    welcomeBack: "С возвращением,",
    findParking: "Найти парковку",
    activeSession: "Активная сессия",
    myCars: "Мои авто",
    recentActivity: "Недавняя активность",
    bonusPoints: "Бонусные баллы",
    shortTerm: "Краткосрочная",
    longTerm: "Долгосрочная",
    spotsAvailable: "мест свободно",
    quickActions: "Быстрые действия",
    bookNow: "Забронировать",
    findAvailableParking: "Найти свободную парковку",
    registered: "зарегистрировано",
    specialOffer: "Специальное предложение!",
    getDiscount: "Скидка 50% на первое бронирование",
    activeBooking: "Активная бронь",
    remaining: "осталось",
    // Auth
    enterPhone: "Введите номер телефона",
    sendCode: "Отправить код",
    enterOTP: "Введите код подтверждения",
    verifyCode: "Подтвердить",
    invalidOTP: "Неверный или просроченный код",
    // Profile
    settings: "Настройки",
    darkMode: "Тёмный режим",
    language: "Язык",
    notifications: "Уведомления",
    pushNotifications: "Push уведомления",
    securityPrivacy: "Безопасность и конфиденциальность",
    privacyPolicy: "Политика конфиденциальности",
    termsOfService: "Условия использования",
    about: "О приложении",
    appVersion: "Версия приложения",
    build: "Сборка",
    deleteAccount: "Удалить аккаунт",
    signOut: "Выйти",
    appearance: "Внешний вид",
    selectLanguage: "Выбрать язык",
    noShowCounter: "Счётчик неявок",
    balance: "Баланс",
    bonus: "Бонус",
    contactSupport: "Поддержка:",
    cancel: "Отмена",
    delete: "Удалить",
    close: "Закрыть",
    add: "+ Добавить",
    noCarsRegistered: "Нет зарегистрированных авто",
    // Map
    parkingMap: "Карта парковки",
    spots: "мест",
    free: "Свободно",
    booked: "Забронировано",
    occupied: "Занято",
    reserved: "Зарезервировано",
    repair: "Ремонт",
    // Wallet
    manageBalance: "Управление балансом",
    currentBalance: "Текущий баланс",
    topUpBalance: "+ Пополнить баланс",
    promoCodeAvailable: "Доступен промокод",
    promoDescription: "FIRST - скидка 150₸ на первую парковку",
    active: "Активен",
    transactionHistory: "История транзакций",
    walletTopUp: "Пополнение кошелька через",
    selectAmount: "Выберите сумму",
    payWithStripe: "Оплатить через Stripe",
    poweredByStripe: "Работает на Stripe (Тестовый режим)",
    // Booking
    noActiveBooking: "Нет активных бронирований",
    findParkingBtn: "Найти парковку",
    activeBookingTitle: "Активная бронь",
    longTermReservation: "Долгосрочная аренда",
    shortTermParking: "Краткосрочная парковка",
    parked: "Припаркован",
    enRoute: "В пути",
    timeToArrive: "Время до прибытия",
    hurry: "Поторопитесь! Бронь скоро истечёт.",
    simulateArrival: "Симулировать прибытие",
    parkingDuration: "Длительность парковки",
    currentCost: "Текущая стоимость",
    rentalPeriod: "Период аренды",
    daysRemaining: "дней осталось",
    paid: "Оплачено",
    parkingSpot: "Парковочное место",
    vehicle: "Транспорт",
    entryMethod: "Способ въезда",
    lprCamera: "LPR камера",
    autoPlateRecognition: "Автоматическое распознавание номеров",
    costBreakdown: "Детализация стоимости",
    firstHourMin: "Первый час (минимум)",
    extraTime: "Доп. время",
    total: "Итого",
    payAndExit: "Оплатить и выехать",
    processing: "Обработка...",
    cancelBooking: "Отменить бронь",
    extendRental: "Продлить аренду",
    loading: "Загрузка...",
  },
}

interface ParkingContextType {
  // App state
  currentScreen: string
  setCurrentScreen: (screen: string) => void
  isLoading: boolean
  
  // Auth
  isAuthenticated: boolean
  supabaseUser: SupabaseUser | null
  profile: Profile | null
  refetchProfile: () => void
  
  // Parking spots
  spots: ParkingSpot[]
  refetchSpots: () => void
  
  // Cars
  cars: Car[]
  refetchCars: () => void
  
  // Bookings
  activeBooking: Booking | null
  refetchBooking: () => void
  
  // Transactions
  transactions: Transaction[]
  refetchTransactions: () => void
  
  // Selected spot for booking
  selectedSpot: ParkingSpot | null
  setSelectedSpot: (spot: ParkingSpot | null) => void
  
  // Theme & Language
  darkMode: boolean
  setDarkMode: (dark: boolean) => void
  language: Language
  setLanguage: (lang: Language) => void
  t: typeof translations.en
}

const ParkingContext = createContext<ParkingContextType | undefined>(undefined)

export function ParkingProvider({ children }: { children: ReactNode }) {
  const [currentScreen, setCurrentScreen] = useState("home")
  const [isLoading, setIsLoading] = useState(true)
  const [supabaseUser, setSupabaseUser] = useState<SupabaseUser | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [spots, setSpots] = useState<ParkingSpot[]>([])
  const [cars, setCars] = useState<Car[]>([])
  const [activeBooking, setActiveBooking] = useState<Booking | null>(null)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [selectedSpot, setSelectedSpot] = useState<ParkingSpot | null>(null)
  const [darkMode, setDarkMode] = useState(false)
  const [language, setLanguage] = useState<Language>("en")
  
  const supabase = createClient()
  const t = translations[language]
  const isAuthenticated = !!supabaseUser
  
  // Fetch profile
  const fetchProfile = async (userId: string) => {
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single()
    setProfile(data)
  }
  
  // Fetch parking spots
  const fetchSpots = async () => {
    const { data } = await supabase
      .from("parking_spots")
      .select("*")
      .order("spot_number")
    setSpots(data || [])
  }
  
  // Fetch user's cars
  const fetchCars = async (userId: string) => {
    const { data } = await supabase
      .from("cars")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
    setCars(data || [])
  }
  
  // Fetch active booking
  const fetchActiveBooking = async (userId: string) => {
    const { data } = await supabase
      .from("bookings")
      .select(`
        *,
        parking_spots (*),
        cars (*)
      `)
      .eq("user_id", userId)
      .eq("status", "ACTIVE")
      .order("created_at", { ascending: false })
      .limit(1)
      .single()
    setActiveBooking(data)
  }
  
  // Fetch transactions
  const fetchTransactions = async (userId: string) => {
    const { data } = await supabase
      .from("transactions")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(20)
    setTransactions(data || [])
  }
  
  // Initialize auth and data
  useEffect(() => {
    const initAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (session?.user) {
        setSupabaseUser(session.user)
        await Promise.all([
          fetchProfile(session.user.id),
          fetchCars(session.user.id),
          fetchActiveBooking(session.user.id),
          fetchTransactions(session.user.id),
        ])
      }
      
      await fetchSpots()
      setIsLoading(false)
    }
    
    initAuth()
    
    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSupabaseUser(session?.user ?? null)
        
        if (session?.user) {
          await Promise.all([
            fetchProfile(session.user.id),
            fetchCars(session.user.id),
            fetchActiveBooking(session.user.id),
            fetchTransactions(session.user.id),
          ])
        } else {
          setProfile(null)
          setCars([])
          setActiveBooking(null)
          setTransactions([])
        }
      }
    )
    
    // Subscribe to real-time parking spots updates
    const channel = supabase
      .channel("parking_spots_changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "parking_spots" },
        () => fetchSpots()
      )
      .subscribe()
    
    return () => {
      subscription.unsubscribe()
      supabase.removeChannel(channel)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  
  const refetchProfile = () => supabaseUser && fetchProfile(supabaseUser.id)
  const refetchSpots = () => fetchSpots()
  const refetchCars = () => supabaseUser && fetchCars(supabaseUser.id)
  const refetchBooking = () => supabaseUser && fetchActiveBooking(supabaseUser.id)
  const refetchTransactions = () => supabaseUser && fetchTransactions(supabaseUser.id)
  
  return (
    <ParkingContext.Provider value={{
      currentScreen,
      setCurrentScreen,
      isLoading,
      isAuthenticated,
      supabaseUser,
      profile,
      refetchProfile,
      spots,
      refetchSpots,
      cars,
      refetchCars,
      activeBooking,
      refetchBooking,
      transactions,
      refetchTransactions,
      selectedSpot,
      setSelectedSpot,
      darkMode,
      setDarkMode,
      language,
      setLanguage,
      t,
    }}>
      {children}
    </ParkingContext.Provider>
  )
}

export function useParking() {
  const context = useContext(ParkingContext)
  if (context === undefined) {
    throw new Error("useParking must be used within a ParkingProvider")
  }
  return context
}
