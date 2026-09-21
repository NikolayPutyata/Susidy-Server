# Susidy Server

Backend для суші-бару з доставкою: публічний каталог товарів, кошик і оформлення замовлення без обов'язкової реєстрації, а також адмін API для керування товарами та клієнтами.

## Стек

Node.js (ESM) + Express + MongoDB (Mongoose). Аутентифікація — сесії (access/refresh токени в БД), не JWT. Зображення товарів зберігаються в Cloudinary. Сповіщення про нові замовлення надсилаються в Telegram.

## Запуск локально

```bash
cp .env.example .env   # заповнити значення
npm install
npm run dev
```

### Через Docker

```bash
cp .env.example .env   # заповнити SMTP/JWT/Cloudinary/Telegram, MONGODB_URI можна лишити порожнім
docker compose up --build
```
Mongo піднімається окремим контейнером, API автоматично підключається до нього (`MONGODB_URI` для контейнера прописаний у `docker-compose.yml`).

### Створення першого адміна

Реєстрація через `/auth/register` завжди створює звичайного користувача (`role: "user"`). Щоб отримати адміна, заповніть `ADMIN_*` змінні в `.env` і виконайте:

```bash
npm run seed:admin
```

Скрипт створює користувача з `role: "admin"` (або підвищує роль, якщо користувач з таким email/телефоном вже існує).

## Основні сценарії

### Замовлення без реєстрації

Кошик прив'язується до `session_id`, який генерує фронтенд (наприклад, зберігає в localStorage) і передає в тілі кожного запиту до `/cart`. Авторизація не потрібна.

При оформленні (`POST /cart/checkout`) обов'язкові лише `name` і `phoneNumber`. Сервер шукає користувача за номером телефону:
- якщо такий телефон уже є в базі — замовлення прив'язується до існуючого користувача (новий запис не створюється);
- якщо немає — створюється мінімальний запис користувача (ім'я + телефон, без email/пароля).

Якщо клієнт залогінений (передав `Authorization: Bearer <accessToken>`), кошик і замовлення прив'язуються до його акаунта замість `session_id`.

Персональна знижка (`discount`, %) користувача застосовується автоматично до суми замовлення при оформленні.

### Реєстрація/логін — опційні

`/auth/register` і `/auth/login` лишаються доступними для тих, хто хоче мати акаунт (історія замовлень, знижка зберігається за акаунтом, а не за телефоном сесії). Якщо людина спершу замовляла як гість, а потім зареєструвалась тим самим номером телефону — її "гостьовий" запис користувача доповнюється email/паролем, а не дублюється.

### Адмінка (`/admin`, потребує `role: "admin"`)

- `POST /admin/products` — створити товар (`multipart/form-data`, поле `images` — файли, до 10 шт., завантажуються в Cloudinary)
- `PATCH /admin/products/:id` — оновити товар (нові `images`, якщо передані, повністю замінюють старі)
- `DELETE /admin/products/:id` — видалити товар
- `GET /admin/users?page=&perPage=` — список усіх користувачів
- `GET /admin/users/search?phone=` — пошук користувачів за (частиною) номера телефону
- `PATCH /admin/users/:id/discount` — встановити персональну знижку (`{ "discount": 10 }`, 0-100%)
- `GET /admin/orders/today` — усі замовлення за поточну добу (межі доби рахуються за системним часом процесу — у Docker виставлено `TZ=Europe/Kyiv`; для локального запуску без Docker, якщо треба саме київська доба, запускайте `TZ=Europe/Kyiv npm run dev`)
- `GET /admin/orders/search?phone=` — усі замовлення конкретного клієнта за (частиною) номера телефону

## Змінні середовища

Див. `.env.example`. `MONGODB_URI` — повний connection string (Atlas: `mongodb+srv://...`, локально/Docker: `mongodb://...`). `CLOUDINARY_*` обов'язкові для роботи адмінського завантаження зображень. `CLIENT_ORIGIN` — origin(и) фронтенду, яким дозволено робити запити з кукі (сесія/refresh-токен зберігаються в httpOnly-куках, тому без правильного `CLIENT_ORIGIN` + `credentials: 'include'` на фронті логін/refresh не працюватимуть з іншого домену).

**Деплой на різні домени (наприклад, фронт на Vercel, API на Render/Railway):** обов'язково постав `COOKIE_SECURE=true`. Браузер вважає `susidy-client.vercel.app` і `susidy-api.onrender.com` різними сайтами, і без `SameSite=None; Secure` на кукі сесії він їх просто не надсилатиме — логін формально "спрацює" (API поверне `accessToken`), але після перезавантаження сторінки сесія одразу загубиться, бо `/auth/refresh` не побачить кукі. Локально (все на `localhost`) цей прапорець не потрібен.

## Публічне API

- `GET /products/all`
- `GET /products/category/:category`
- `GET /products/:productId`
- `POST /cart/add`, `PATCH /cart/:cart_id`, `DELETE /cart/:cart_id`, `GET /cart/:cart_id`
- `POST /cart/checkout`
- `POST /auth/register`, `POST /auth/login`, `POST /auth/logout`, `POST /auth/refresh`, `GET /auth/me`, `POST /auth/request-reset-email`, `POST /auth/reset-password`

## Що поки не реалізовано

Статуси замовлень (наразі замовлення лише летить у Telegram і кошик очищається), rate limiting на `/auth`, пагінація товарів — свідомо лишили на потім за домовленістю.
