# Susidy-Server

# продукти

GET /all - отримати всі продукти

GET /:productId - отримати продукт по айді

GET /category (в body вказуємо категорію) - отримати роли по категорії

POST /all (в body вказуємо продукт по схемі) - створити новий продукт

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

GET /:session_id - отримати кошик юзера по айді сесії

POST /add (передати в body session_id, product_id, quantity, productName, price) - додає в кошик юзера по айді сесії продукти

POST /checkout (передати в body session_id, та дані користувача з форми name, phoneNumber) - створює замовлення юзера, видаляє кошик, відправляє замовлення на телеграм

# реєстрація

# адмін
