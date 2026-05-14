"use client"

import { createContext, useContext, useState, type ReactNode } from "react"

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
  name: string
  phone: string
  balance: number
  bonusPoints: number
  noShowCount: number
  cars: Car[]
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

// Initial parking spots data
const initialSpots: ParkingSpot[] = [
  { id: "A1", spotNumber: "A1", type: "SHORT_TERM", status: "FREE", floor: 1, hourlyRate: 200, dailyRate: 1500 },
  { id: "A2", spotNumber: "A2", type: "SHORT_TERM", status: "FREE", floor: 1, hourlyRate: 200, dailyRate: 1500 },
  { id: "A3", spotNumber: "A3", type: "SHORT_TERM", status: "OCCUPIED", floor: 1, hourlyRate: 200, dailyRate: 1500 },
  { id: "A4", spotNumber: "A4", type: "SHORT_TERM", status: "FREE", floor: 1, hourlyRate: 200, dailyRate: 1500 },
  { id: "A5", spotNumber: "A5", type: "SHORT_TERM", status: "REPAIR", floor: 1, hourlyRate: 200, dailyRate: 1500 },
  { id: "A6", spotNumber: "A6", type: "SHORT_TERM", status: "FREE", floor: 1, hourlyRate: 200, dailyRate: 1500 },
  { id: "B1", spotNumber: "B1", type: "LONG_TERM", status: "FREE", floor: 1, hourlyRate: 150, dailyRate: 1200 },
  { id: "B2", spotNumber: "B2", type: "LONG_TERM", status: "BOOKED", floor: 1, hourlyRate: 150, dailyRate: 1200 },
  { id: "B3", spotNumber: "B3", type: "LONG_TERM", status: "FREE", floor: 1, hourlyRate: 150, dailyRate: 1200 },
  { id: "B4", spotNumber: "B4", type: "LONG_TERM", status: "FREE", floor: 1, hourlyRate: 150, dailyRate: 1200 },
  { id: "B5", spotNumber: "B5", type: "LONG_TERM", status: "RESERVED", floor: 1, hourlyRate: 150, dailyRate: 1200 },
  { id: "B6", spotNumber: "B6", type: "LONG_TERM", status: "FREE", floor: 1, hourlyRate: 150, dailyRate: 1200 },
]

interface ParkingContextType {
  // Auth
  isAuthenticated: boolean
  setIsAuthenticated: (value: boolean) => void
  user: User | null
  setUser: (user: User | null) => void
  
  // Navigation
  currentScreen: string
  setCurrentScreen: (screen: string) => void
  
  // Parking
  spots: ParkingSpot[]
  setSpots: (spots: ParkingSpot[]) => void
  selectedSpot: ParkingSpot | null
  setSelectedSpot: (spot: ParkingSpot | null) => void
  
  // Booking
  activeBooking: ActiveBooking | null
  setActiveBooking: (booking: ActiveBooking | null) => void
  
  // Admin
  isAdminMode: boolean
  setIsAdminMode: (value: boolean) => void
  
  // Theme & Language
  darkMode: boolean
  setDarkMode: (dark: boolean) => void
  language: Language
  setLanguage: (lang: Language) => void
  t: typeof translations.en
}

const ParkingContext = createContext<ParkingContextType | undefined>(undefined)

export function ParkingProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [user, setUser] = useState<User | null>(null)
  const [currentScreen, setCurrentScreen] = useState("home")
  const [spots, setSpots] = useState<ParkingSpot[]>(initialSpots)
  const [selectedSpot, setSelectedSpot] = useState<ParkingSpot | null>(null)
  const [activeBooking, setActiveBooking] = useState<ActiveBooking | null>(null)
  const [isAdminMode, setIsAdminMode] = useState(false)
  const [darkMode, setDarkMode] = useState(false)
  const [language, setLanguage] = useState<Language>("en")

  const t = translations[language]

  return (
    <ParkingContext.Provider value={{
      isAuthenticated,
      setIsAuthenticated,
      user,
      setUser,
      currentScreen,
      setCurrentScreen,
      spots,
      setSpots,
      selectedSpot,
      setSelectedSpot,
      activeBooking,
      setActiveBooking,
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
