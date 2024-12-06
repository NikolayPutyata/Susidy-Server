# Susidy-Server

# продукти

GET /all
- отримати всі продукти

GET /:productId
- отримати продукт по айді

GET /all/category
(в body вказуємо категорію)
- отримати роли по категорії

POST /all
(в body вказуємо продукт по схемі)
- створити новий продукт

Схема :
{
  "name": "",
  "price": ,
  "category": "",
  "images": ["", ""],
  "description": "",
}

можливі категорії : 'rolls', 'sushi', 'hotRolls', 'hunkans', 'sets', 'drinks', 'maki', 'bigRolls', 'other'

# корзина

GET /:session_id
- отримати кошик юзера по айді сесії

POST /add
(передати в body session_id, product_id, quantity (мін 1 симв), productName (мін 3 симв), price)
 - додає в кошик юзера по айді сесії продукти

POST /checkout
(передати в body session_id, та дані користувача з форми name, phoneNumber (цифри від 0 до 9, макс 10 симв))
 - створює замовлення юзера, видаляє кошик, відправляє замовлення на телеграм

PATCH /:cart_id
(передати в body session_id, product_id, quantity (мін 1 симв))
- змінює к-сть товару на новий

DELETE /:cart_id
(передати в body session_id, product_id)
- видаляє товар з корзини

# реєстрація

# адмін
