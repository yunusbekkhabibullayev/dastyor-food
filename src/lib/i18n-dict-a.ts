import type { Dict } from "./i18n";

// Format: uz | ru | en
const raw = `
Bosh sahifa|Главная|Home
Sevimlilar|Избранное|Favorites
Savat|Корзина|Cart
Profil|Профиль|Profile
Barchasi|Все|All
Burgerlar|Бургеры|Burgers
Lavash|Лаваш|Lavash
Pizza|Пицца|Pizza
Tovuq|Курица|Chicken
Kartoshka|Картофель|Fries
Ichimliklar|Напитки|Drinks
Souslar|Соусы|Sauces
-20% chegirma|-20% скидка|-20% off
Yangi|Новинка|New
Bepul yetkazish|Бесплатная доставка|Free delivery
Eng yaxshi fast-foodlar endi bir joyda!|Лучший фастфуд теперь в одном месте!|The best fast food, all in one place!
Buyurtma bering va tezkor yetkazib berishni oling|Закажите и получите быструю доставку|Order now and get fast delivery
Issiq pitsalar 30 daqiqada|Горячая пицца за 30 минут|Hot pizza in 30 minutes
Sevimli pitsangizni uyga buyurtma qiling|Закажите любимую пиццу домой|Order your favorite pizza home
Lavash va donarlar|Лаваш и донеры|Lavash and doners
Ko'pchilik xonalardan yetkazib berish — 0 UZS|Доставка из большинства заведений — 0 UZS|Delivery from most places — 0 UZS
Buyurtma berish|Оформить заказ|Place order
Fast-food xonalar|Заведения фастфуда|Fast-food places
Mashhur taomlar|Популярные блюда|Popular dishes
Fast-food yoki mahsulot qidirish...|Поиск фастфуда или блюда...|Search places or dishes...
Xona yoki taom nomi...|Название заведения или блюда...|Place or dish name...
Skanerlash|Сканировать|Scan
Skanerlash tez orada|Сканирование скоро|Scanning coming soon
Tozalash|Очистить|Clear
Hech narsa topilmadi|Ничего не найдено|Nothing found
Boshqa so'z bilan qidirib ko'ring|Попробуйте другой запрос|Try another search
Topilgan taomlar|Найденные блюда|Found dishes
Savatga qo'shish|В корзину|Add to cart
Sevimlilarga qo'shish|В избранное|Add to favorites
Sevimlilarga|В избранное|Favorite
Sevimlilardan olib tashlash|Убрать из избранного|Remove from favorites
Xonani sevimlilarga qo'shish|Добавить заведение в избранное|Add place to favorites
Kamaytirish|Уменьшить|Decrease
Ko'paytirish|Увеличить|Increase
Savatda boshqa xona taomlari bor|В корзине блюда из другого заведения|Cart has items from another place
Bitta buyurtmada faqat bitta xonadan taom bo'lishi mumkin.|В одном заказе — блюда только из одного заведения.|One order can contain dishes from one place only.
Yangilash|Обновить|Replace
Menyu|Меню|Menu
Asosiy menyu|Основное меню|Main menu
Menyuda bunday taom yo'q|В меню нет такого блюда|No such dish on the menu
Min. buyurtma|Мин. заказ|Min. order
Yetkazish|Доставка|Delivery
Vaqt|Время|Time
Xona|Заведение|Place
Xonalar|Заведения|Places
Taomlar|Блюда|Dishes
Barcha xonalar|Все заведения|All places
Xona topilmadi|Заведение не найдено|Place not found
Xonalarni ko'rish|Смотреть заведения|Browse places
Sevimli taomlar yo'q|Нет избранных блюд|No favorite dishes
Sevimli xonalar yo'q|Нет избранных заведений|No favorite places
Savat bo'sh|Корзина пуста|Cart is empty
Savatingiz bo'sh|Ваша корзина пуста|Your cart is empty
Sevimli fast-food xonangizdan taom tanlang.|Выберите блюдо в любимом заведении.|Pick a dish from your favorite place.
Mahsulotni o'chirish|Удалить товар|Remove item
Ushbu mahsulotni savatdan o'chirmoqchimisiz?|Удалить этот товар из корзины?|Remove this item from the cart?
O'chirish|Удалить|Delete
Ha, o'chirish|Да, удалить|Yes, delete
Bekor qilish|Отмена|Cancel
Jami|Итого|Total
Mahsulotlar|Товары|Items
Yetkazib berish|Доставка|Delivery
Bepul|Бесплатно|Free
Buyurtmani davom ettirish|Продолжить заказ|Continue
Buyurtma berish uchun avval ro'yxatdan o'ting|Для заказа сначала зарегистрируйтесь|Sign up first to place an order
Buyurtma berish uchun ism, telefon va yetkazish manzili kerak. Savatingiz saqlanib qoladi.|Для заказа нужны имя, телефон и адрес. Корзина сохранится.|Name, phone and address are required to order. Your cart is kept.
Ism, telefon raqam va yetkazish manzili kerak — savatingiz o'chirilmaydi.|Нужны имя, телефон и адрес — корзина не удалится.|Name, phone and address needed — your cart stays.
Ro'yxatdan o'tish|Регистрация|Sign up
Mijoz ma'lumotlari|Данные клиента|Customer details
Ism|Имя|Name
Ismingizni kiriting|Введите имя|Enter your name
Telefon raqami|Номер телефона|Phone number
Telefon|Телефон|Phone
Yetkazish manzili|Адрес доставки|Delivery address
Yetkazish manzilini tanlang|Выберите адрес доставки|Choose delivery address
Yetkazish manzilini tanlang va buyurtmani tasdiqlang.|Выберите адрес и подтвердите заказ.|Choose an address and confirm your order.
Xaritadan o'zgartirish|Изменить на карте|Change on map
Xaritadan tanlash|Выбрать на карте|Pick on map
Profil orqali o'zgartirish|Изменить в профиле|Change in profile
Saqlash va davom etish|Сохранить и продолжить|Save and continue
Saqlash|Сохранить|Save
Ma'lumotlar saqlandi|Данные сохранены|Details saved
To'lov usuli|Способ оплаты|Payment method
Naqd pul|Наличные|Cash
Karta|Карта|Card
Izoh|Комментарий|Note
Masalan: domofon 12, 3-qavat|Например: домофон 12, 3 этаж|E.g. intercom 12, 3rd floor
Yuborilmoqda...|Отправка...|Sending...
Buyurtma muvaffaqiyatli yaratildi!|Заказ успешно создан!|Order placed successfully!
Buyurtmangiz muvaffaqiyatli yaratildi.|Ваш заказ успешно создан.|Your order has been placed.
Rahmat! Buyurtmangiz qabul qilindi.|Спасибо! Ваш заказ принят.|Thank you! Your order is accepted.
Buyurtma raqami|Номер заказа|Order number
Buyurtma holatini kuzatish|Отследить заказ|Track order
Bosh sahifaga|На главную|Go home
Bosh sahifaga qaytish|Вернуться на главную|Back to home
Profilga o'tish|Перейти в профиль|Go to profile
Buyurtma holati|Статус заказа|Order status
Buyurtma qabul qilindi|Заказ принят|Order received
Tayyorlanmoqda|Готовится|Preparing
Yo'lda|В пути|On the way
Yetkazildi|Доставлен|Delivered
Hozirgi bosqich|Текущий этап|Current stage
Taxminiy yetkazish vaqti|Примерное время доставки|Estimated delivery
1 daqiqadan kam|Меньше минуты|Under a minute
Buyurtma tarkibi|Состав заказа|Order items
Buyurtma topilmadi|Заказ не найден|Order not found
Buyurtmalarim|Мои заказы|My orders
Buyurtmalar|Заказы|Orders
Joriy|Текущие|Current
Oldingi|Прошлые|Past
Hali buyurtma yo'q|Заказов пока нет|No orders yet
Hali buyurtmalar yo'q|Заказов пока нет|No orders yet
Birinchi buyurtmangizni bering — u shu yerda paydo bo'ladi.|Сделайте первый заказ — он появится здесь.|Place your first order — it will show up here.
Taom tanlab, buyurtma bering.|Выберите блюдо и закажите.|Pick a dish and order.
Mehmon|Гость|Guest
Tahrirlash|Редактировать|Edit
O'zgartirish|Изменить|Change
Profil saqlandi|Профиль сохранён|Profile saved
Manzillar|Адреса|Addresses
Saqlangan manzillar|Сохранённые адреса|Saved addresses
Sozlamalar|Настройки|Settings
Bildirishnomalar|Уведомления|Notifications
Maxfiylik|Конфиденциальность|Privacy
Manzil qo'shish|Добавить адрес|Add address
Manzil saqlandi|Адрес сохранён|Address saved
Manzil o'chirilsinmi?|Удалить адрес?|Delete address?
Hali manzil saqlanmagan|Адресов пока нет|No saved addresses yet
Uy yoki ish manzilingizni qo'shing.|Добавьте адрес дома или работы.|Add your home or work address.
Manzillar faqat shu qurilmada saqlanadi.|Адреса хранятся только на этом устройстве.|Addresses are stored on this device only.
Asosiy manzil|Основной адрес|Default address
Asosiy qilish|Сделать основным|Make default
Manzil nomini kiriting|Введите название адреса|Enter address name
Manzilni kiriting|Введите адрес|Enter address
Manzilni tekshiring|Проверьте адрес|Check the address
Manzil ma'lumotlari|Данные адреса|Address details
Ko'cha|Улица|Street
Ko'cha nomini kiriting|Введите улицу|Enter street
Uy|Дом|House
Uy raqamini kiriting|Введите номер дома|Enter house number
Tuman|Район|District
Juda uzun|Слишком длинно|Too long
Buyurtma yangiliklari|Новости заказа|Order updates
Aksiya va takliflar|Акции и предложения|Offers and promotions
Ma'lumotlaringiz shu qurilmada|Ваши данные на этом устройстве|Your data is on this device
Profil, manzillar, savat, sevimlilar, buyurtmalar va sozlamalar brauzeringizda saqlanadi.|Профиль, адреса, корзина, избранное, заказы и настройки хранятся в браузере.|Profile, addresses, cart, favorites, orders and settings are stored in your browser.
Ma'lumotlarni tozalash|Очистить данные|Clear data
Barcha ma'lumotlar o'chirilsinmi?|Удалить все данные?|Delete all data?
Savat, buyurtmalar, sevimlilar, profil, manzillar va sozlamalar tozalanadi. Buni ortga qaytarib bo'lmaydi.|Корзина, заказы, избранное, профиль, адреса и настройки будут удалены. Это необратимо.|Cart, orders, favorites, profile, addresses and settings will be cleared. This can't be undone.
Ha, tozalash|Да, очистить|Yes, clear
Ma'lumotlar tozalandi|Данные очищены|Data cleared
Sahifa topilmadi|Страница не найдена|Page not found
Bu sahifa mavjud emas yoki boshqa manzilga ko'chirilgan.|Страница не существует или перемещена.|This page doesn't exist or has moved.
Sahifa ochilmadi|Страница не открылась|Page failed to load
Xatolik yuz berdi. Qayta urinib ko'ring yoki bosh sahifaga qayting.|Произошла ошибка. Попробуйте снова или вернитесь на главную.|Something went wrong. Try again or go home.
Qayta urinish|Повторить|Try again
Yopish|Закрыть|Close
Hozircha bo'sh|Пока пусто|Empty for now
Tumandagi barcha fast-food xonalar bir ilovada!|Весь фастфуд района в одном приложении!|All local fast food in one app!
Evos, Max Way, Bellissimo va boshqa sevimli xonalaringiz.|Evos, Max Way, Bellissimo и другие любимые заведения.|Evos, Max Way, Bellissimo and more favorites.
Sevimli taomingizni tanlang|Выберите любимое блюдо|Pick your favorite dish
Menyuni ko'ring, savatga qo'shing va bir necha bosishda buyurtma bering.|Смотрите меню, добавляйте в корзину и заказывайте в пару касаний.|Browse menus, add to cart and order in a few taps.
Tezkor yetkazib berish|Быстрая доставка|Fast delivery
Manzilni xaritadan belgilang va buyurtma holatini kuzatib boring.|Отметьте адрес на карте и следите за заказом.|Mark your address on the map and track your order.
O'tkazib yuborish|Пропустить|Skip
Keyingi|Далее|Next
Boshlash|Начать|Start
`;

export const dictA: Dict = Object.fromEntries(
  raw
    .trim()
    .split("\n")
    .map((l) => {
      const [uz, ru, en] = l.split("|");
      return [uz, { ru, en }];
    }),
);
