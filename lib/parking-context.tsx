"use client"

import { createContext, useContext, useState, type ReactNode } from "react"

export type SpotStatus = "FREE" | "BOOKED" | "OCCUPIED" | "RESERVED" | "REPAIR"

export interface ParkingSpot {
  id: string
  number: number
  status: SpotStatus
  type: "short-term" | "long-term"
  bookedBy?: string
  plateNumber?: string
  bookedAt?: Date
  expiresAt?: Date
}

export interface Car {
  id: string
  brand: string
  model: string
  plateNumber: string
}

export interface Transaction {
  id: string
  type: "topup_stripe" | "parking_charge" | "longterm_charge" | "waiting_fee" | "bonus_credit" | "promo_discount"
  amount: number
  description: string
  date: Date
}

export interface User {
  id: string
  phone: string
  name: string
  balance: number
  bonusPoints: number
  noShowCount: number
  isBanned: boolean
  bannedUntil?: Date
  cars: Car[]
  transactions: Transaction[]
  promoCode?: string
}

export interface Booking {
  id: string
  spotId: string
  userId: string
  plateNumber: string
  type: "short-term" | "long-term"
  status: "active" | "completed" | "cancelled"
  startTime: Date
  endTime?: Date
  totalAmount?: number
  isPaid: boolean
  waitingFee: number
  rentalDays?: number
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
  },
}

interface ParkingContextType {
  // App state
  currentScreen: string
  setCurrentScreen: (screen: string) => void
  isAuthenticated: boolean
  setIsAuthenticated: (auth: boolean) => void
  
  // User
  user: User | null
  setUser: (user: User | null) => void
  
  // Parking spots
  spots: ParkingSpot[]
  setSpots: (spots: ParkingSpot[]) => void
  updateSpot: (spotId: string, updates: Partial<ParkingSpot>) => void
  
  // Bookings
  activeBooking: Booking | null
  setActiveBooking: (booking: Booking | null) => void
  bookings: Booking[]
  setBookings: (bookings: Booking[]) => void
  
  // Selected spot for booking
  selectedSpot: ParkingSpot | null
  setSelectedSpot: (spot: ParkingSpot | null) => void
  
  // Admin mode
  isAdminMode: boolean
  setIsAdminMode: (admin: boolean) => void
  
  // Theme & Language
  darkMode: boolean
  setDarkMode: (dark: boolean) => void
  language: Language
  setLanguage: (lang: Language) => void
  t: typeof translations.en
}

const ParkingContext = createContext<ParkingContextType | undefined>(undefined)

// Generate initial parking spots
const generateInitialSpots = (): ParkingSpot[] => {
  const spots: ParkingSpot[] = []
  
  // Short-term spots (SP-01 to SP-15)
  for (let i = 1; i <= 15; i++) {
    const status: SpotStatus = Math.random() > 0.6 ? "FREE" : 
                               Math.random() > 0.5 ? "OCCUPIED" : 
                               Math.random() > 0.5 ? "BOOKED" : "FREE"
    spots.push({
      id: `SP-${String(i).padStart(2, "0")}`,
      number: i,
      status,
      type: "short-term",
    })
  }
  
  // Long-term spots (SP-16 to SP-30)
  for (let i = 16; i <= 30; i++) {
    const status: SpotStatus = Math.random() > 0.7 ? "FREE" : 
                               Math.random() > 0.5 ? "RESERVED" : 
                               Math.random() > 0.3 ? "OCCUPIED" : "FREE"
    spots.push({
      id: `SP-${String(i).padStart(2, "0")}`,
      number: i,
      status: i === 22 ? "REPAIR" : status,
      type: "long-term",
    })
  }
  
  return spots
}

// Demo user data
const demoUser: User = {
  id: "user-1",
  phone: "+7 777 123 4567",
  name: "Alikhan Serikov",
  balance: 2500,
  bonusPoints: 25,
  noShowCount: 1,
  isBanned: false,
  cars: [
    { id: "car-1", brand: "Toyota", model: "Camry", plateNumber: "123 ABC 01" },
    { id: "car-2", brand: "Hyundai", model: "Tucson", plateNumber: "456 DEF 01" },
  ],
  transactions: [
    { id: "t1", type: "topup_stripe", amount: 3000, description: "Wallet top-up", date: new Date(Date.now() - 86400000 * 2) },
    { id: "t2", type: "parking_charge", amount: -330, description: "Parking SP-07, 2 hours", date: new Date(Date.now() - 86400000) },
    { id: "t3", type: "bonus_credit", amount: 3, description: "Bonus points earned", date: new Date(Date.now() - 86400000) },
    { id: "t4", type: "topup_stripe", amount: 1000, description: "Wallet top-up", date: new Date(Date.now() - 3600000 * 5) },
  ],
  promoCode: "FIRST",
}

export function ParkingProvider({ children }: { children: ReactNode }) {
  const [currentScreen, setCurrentScreen] = useState("home")
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [user, setUser] = useState<User | null>(demoUser)
  const [spots, setSpots] = useState<ParkingSpot[]>(generateInitialSpots())
  const [activeBooking, setActiveBooking] = useState<Booking | null>(null)
  const [bookings, setBookings] = useState<Booking[]>([])
  const [selectedSpot, setSelectedSpot] = useState<ParkingSpot | null>(null)
  const [isAdminMode, setIsAdminMode] = useState(false)
  const [darkMode, setDarkMode] = useState(false)
  const [language, setLanguage] = useState<Language>("en")
  
  const t = translations[language]
  
  const updateSpot = (spotId: string, updates: Partial<ParkingSpot>) => {
    setSpots(prev => prev.map(spot => 
      spot.id === spotId ? { ...spot, ...updates } : spot
    ))
  }
  
  return (
    <ParkingContext.Provider value={{
      currentScreen,
      setCurrentScreen,
      isAuthenticated,
      setIsAuthenticated,
      user,
      setUser,
      spots,
      setSpots,
      updateSpot,
      activeBooking,
      setActiveBooking,
      bookings,
      setBookings,
      selectedSpot,
      setSelectedSpot,
      isAdminMode,
      setIsAdminMode,
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
