# QPark — Smart Parking System

## Запуск проекта

### 1. Требования
- Node.js 18+
- PostgreSQL (запущен локально)

### 2. База данных
```bash
createdb smart_parking
```

### 3. Бэкенд
```bash
cd backend
cp .env.example .env
# Открой .env и замени YOUR_USERNAME на своё имя пользователя PostgreSQL
npm install
npx prisma migrate deploy
npx tsx src/server.ts
```

### 4. Фронтенд (новый терминал)
```bash
cd ..
npm install
npm run dev
```

### 5. Открыть
- Приложение: http://localhost:3000
- Админка: http://localhost:3000/admin
  - Логин: `admin` / Пароль: `admin123`

## Стек
- **Frontend**: Next.js, Tailwind CSS, Socket.io-client
- **Backend**: Express, TypeScript, Prisma, PostgreSQL, Socket.io
- **Auth**: JWT, OTP через БД
