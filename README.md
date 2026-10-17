# Social Admin Simple

Веб-приложение для администрирования социальной сети: управление пользователями, связями между друзьями, фотоальбомами и новостными лентами.

![Node.js](https://img.shields.io/badge/Node.js-20+-339933?style=flat-square&logo=node.js&logoColor=white)
![Express](https://img.shields.io/badge/Express-4.21-000000?style=flat-square&logo=express&logoColor=white)
![Webpack](https://img.shields.io/badge/Webpack-5-8DD6F9?style=flat-square&logo=webpack&logoColor=black)
![Gulp](https://img.shields.io/badge/Gulp-5-CF4647?style=flat-square&logo=gulp&logoColor=white)
![Pug](https://img.shields.io/badge/Pug-3-A86454?style=flat-square&logo=pug&logoColor=white)
![Sass](https://img.shields.io/badge/Sass-1.80-CC6699?style=flat-square&logo=sass&logoColor=white)
![Bootstrap](https://img.shields.io/badge/Bootstrap-5.3-7952B3?style=flat-square&logo=bootstrap&logoColor=white)

---

## 📌 Функциональность

- **Пользователи**: просмотр списка, добавление, редактирование данных, изменение роли (`admin`/`user`) и статуса (`active`/`blocked`/`unconfirmed`), удаление (с каскадной очисткой связей), загрузка аватарок и фото.
- **Друзья**: выбор пользователя, просмотр текущих друзей, список потенциальных друзей, взаимное добавление и удаление.
- **Новости**: просмотр ленты новостей друзей для выбранного пользователя, добавление записей, фильтрация и модерация.
- **Интерфейс**: адаптивный UI на Bootstrap 5, модальные окна подтверждения, тосты уведомлений и индикатор загрузки.

---

## 🛠 Техническое устройство

- **Backend**: Node.js + Express (ES Modules). Сервер работает по протоколу **HTTPS** с использованием SSL-сертификатов (`certs/server.crt`, `certs/server.key`).
- **База данных**: встроенный модуль `lab3-my-database` с персистентным хранением в JSON-файлах (`data/users.json`, `data/news.json`).
- **Загрузка файлов**: обработка multipart-форм через `multer` с сохранением в `uploads/`.
- **Frontend**: шаблонизатор Pug, препроцессор Sass/SCSS, модульный клиентский JavaScript (ES6+ c компиляцией через Babel).
- **Сборка**: реализованы два независимых пайплайна:
  - **Webpack 5**: `HtmlWebpackPlugin`, `MiniCssExtractPlugin`, `TerserPlugin`, `pug-loader`, `sass-loader`, `babel-loader`.
  - **Gulp 5**: задачи компиляции Pug, Dart Sass, очистки (`dist/gulp`) и бандлинга JS через Webpack API.
  Сервер поддерживает отдачу любой из сборок через переменную `SERVE_BUILD` (`webpack` по умолчанию или `gulp`).

---

## 📂 Структура проекта

```text
├── certs/               # SSL-сертификаты (HTTPS)
├── data/                # Хранилище данных (users.json, news.json)
├── lab3-my-database/    # Локальный npm-пакет file-based БД
├── server/              # Серверная часть на Express
│   ├── routes/          # REST API (users, friends, news)
│   ├── middleware/      # Мидлвары (загрузка файлов multer)
│   ├── app.js           # Конфигурация Express приложения
│   └── server.js        # Точка входа HTTPS-сервера
├── src/                 # Исходный код фронтенда
│   ├── js/              # Клиентские скрипты (api, users, friends, news)
│   ├── layouts/         # Базовый Pug-шаблон
│   ├── pages/           # Страницы (index, friends, news)
│   └── styles/          # SCSS стили и миксины
├── uploads/             # Загруженные аватары и медиафайлы
├── gulpfile.js          # Конфигурация Gulp
└── webpack.config.js    # Конфигурация Webpack
```

---

## 🚀 Установка и запуск

### 1. Установка зависимостей
```bash
npm install
```

### 2. Сборка проекта
Собрать обе версии (Gulp + Webpack):
```bash
npm run build
```

Или собрать только нужную:
```bash
npm run build:webpack   # Сборка в dist/webpack
npm run build:gulp      # Сборка в dist/gulp
```

### 3. Запуск сервера
```bash
npm start
```
Для режима разработки с автоперезапуском:
```bash
npm run dev
```

По умолчанию приложение раздается из `dist/webpack` на:
👉 **[https://localhost:3000](https://localhost:3000)**

> *Примечание: Для запуска сборки Gulp используйте:*
> ```bash
> SERVE_BUILD=gulp npm start
> ```

---

## 🔌 Основные API эндпоинты

| Метод | Эндпоинт | Описание |
|---|---|---|
| `GET` | `/api/users` | Список всех пользователей (поддерживает фильтры `role`, `status`) |
| `POST` | `/api/users` | Создание пользователя (поддерживает upload аватарки) |
| `PUT` | `/api/users/:id` | Редактирование данных / роли / статуса |
| `DELETE` | `/api/users/:id` | Удаление пользователя |
| `GET` | `/api/users/:id/friends` | Список друзей пользователя |
| `POST` | `/api/users/:id/friends` | Добавление в друзья (`friendId`) |
| `DELETE` | `/api/users/:id/friends/:friendId` | Удаление из друзей |
| `GET` | `/api/news` | Список новостей (опционально `?userId=:id` для новостей друзей) |
| `POST` | `/api/news` | Создание новой публикации |
| `DELETE` | `/api/news/:id` | Удаление публикации |