# ha-fusion

> A modern, fast and feature-rich custom [Home Assistant](https://www.home-assistant.io/) dashboard

[![Add-on version](https://img.shields.io/badge/dynamic/yaml?url=https%3A%2F%2Fraw.githubusercontent.com%2Fmr-khamzat%2Faddon-ha-fusion%2Fmain%2Fconfig.yaml&query=version&label=addon&color=blue)](https://github.com/mr-khamzat/addon-ha-fusion)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![GitHub Stars](https://img.shields.io/github/stars/mr-khamzat/ha-fusion?style=social)](https://github.com/mr-khamzat/ha-fusion)

[![preview](/static/preview.png)](https://www.youtube.com/watch?v=D8mWruSuPOM)

---

## История проекта / Project History

**ha-fusion** был создан разработчиком [**matt8707**](https://github.com/matt8707) как альтернатива стандартному дашборду Home Assistant — с упором на скорость, удобство и современный дизайн. Проект получил тысячи звёзд на GitHub и активно использовался сообществом.

В середине 2024 года **matt8707 прекратил поддержку** проекта — последний коммит был сделан в сентябре 2024, открытые issues и PR остались без ответа.

В марте 2026 года разработку возобновил [**mr-khamzat**](https://github.com/mr-khamzat). Форк продолжает традицию оригинального проекта — остаётся **полностью открытым и бесплатным** для всего сообщества Home Assistant.

---

*ha-fusion was originally created by [matt8707](https://github.com/matt8707). Development was abandoned in late 2024. This fork was revived in March 2026 by [mr-khamzat](https://github.com/mr-khamzat) and remains **open source** for the entire HA community.*

---

## Установка / Installation

### Аддон Home Assistant (рекомендуется)

Подходит для установок **Home Assistant OS** и **Supervised**.

1. **Добавить репозиторий:**

   [![Add Repository](https://my.home-assistant.io/badges/supervisor_add_addon_repository.svg)](https://my.home-assistant.io/redirect/supervisor_add_addon_repository/?repository_url=https%3A%2F%2Fgithub.com%2Fmr-khamzat%2Faddon-ha-fusion)

   Или вручную: **Настройки → Дополнения → Магазин → ⠿ → Репозитории** → добавить:
   ```
   https://github.com/mr-khamzat/addon-ha-fusion
   ```

2. **Установить дополнение:** Обновите страницу, найдите **ha-fusion** в магазине и нажмите «Установить».

3. **Запустить:** После установки запустите дополнение. Откроется через Ingress или на порту 5050.

---

### Docker

Подходит для установок **Home Assistant Container** и **Core**.

**docker-compose.yml:**
```yaml
services:
  ha-fusion:
    container_name: ha-fusion
    image: ghcr.io/mr-khamzat/addon-ha-fusion-amd64:latest
    restart: unless-stopped
    ports:
      - "5050:5050"
    volumes:
      - ./ha-fusion-data:/app/data
    environment:
      - TZ=Europe/Moscow
      - HASS_URL=http://192.168.1.100:8123
      - HASS_TOKEN=your_long_lived_token_here
```

```bash
docker-compose up -d
```

**Обновление:**
```bash
docker-compose pull ha-fusion
docker-compose up -d ha-fusion
```

<details>
<summary>Запуск без docker-compose</summary>

```bash
docker run -d \
  --name ha-fusion \
  --network bridge \
  -p 5050:5050 \
  -v /path/to/ha-fusion:/app/data \
  -e TZ=Europe/Moscow \
  -e HASS_URL=http://192.168.1.100:8123 \
  -e HASS_TOKEN=your_token \
  --restart always \
  ghcr.io/mr-khamzat/addon-ha-fusion-amd64:latest
```

</details>

---

## Возможности / Features

### Карточки главного дашборда (Main Cards)

| Карточка | Описание |
|----------|----------|
| **Button** | Универсальная кнопка / toggle / датчик |
| **Light** | Управление светом — яркость, цвет, CCT |
| **RGB Light Card** | Полноценный RGB контроль с цветовым кругом |
| **Climate** | Термостат — температура, режимы, вентилятор |
| **Media Player** | Плеер — обложка, прогресс, кнопки управления |
| **Vacuum** | Пылесос — уборка, база, зоны, мощность |
| **Fan Card** | Вентилятор — скорость, направление |
| **Cover / Shutter** | Жалюзи / шторы / ворота |
| **Lock** | Замок — открыть/закрыть + состояние |
| **Alarm Card** | Охранная панель — постановка/снятие |
| **Camera** | Потоковое видео / WebRTC |
| **Multi-Cam Grid** | Сетка из нескольких камер |
| **Presence** | Все члены семьи — геолокация, батарея |
| **Area Overview** | Сводка по комнате (свет, климат, датчики) |
| **Scene Chips** | Полоса кнопок сцен |
| **Quick Actions** | Быстрые действия (скрипты / сцены) |
| **Energy Card** | Энергопотребление и генерация |
| **Device Tracker** | Трекинг отдельного устройства |
| **Sensor Grid** | Сетка датчиков в одной карточке |
| **Binary Sensor** | Датчик присутствия/открытия/движения |
| **Number / Slider** | Числовой ввод / слайдер |
| **Button Group** | Группа кнопок в один ряд |
| **Script Runner** | Запуск скриптов с параметрами |
| **Timer Card** | Таймер с обратным отсчётом |
| **Todo Card** | Список дел с отметками |
| **Weather Card** | Погода с иконками, влажностью, прогнозом |
| **Sensor Graph** | График датчика с историей |
| **Irrigation Card** | Управление поливом зонами |
| **Resource Meter** | Счётчик воды / газа / электричества |
| **Floor Plan** | Интерактивный план квартиры |
| **AI Ассистент** | Чат с Claude AI (Anthropic) |
| **Намаз / Prayer Times** | Времена молитв (намаза) по городу |
| **Picture Elements** | Изображение с интерактивными элементами |
| **Conditional Media** | Медиа с условиями показа |
| **Empty** | Пустое место / разделитель |

### Виджеты сайдбара (Sidebar Widgets)

| Виджет | Описание |
|--------|----------|
| **Time** | Текущее время |
| **Date** | Дата |
| **Weather** | Погода компактно |
| **Weather Forecast** | Прогноз на несколько дней |
| **Sensor** | Показание датчика |
| **Graph** | График статистики |
| **History** | История состояний |
| **Bar** | Прогресс-бар (заряд, влажность…) |
| **Gauge** | Круговой датчик |
| **Radial** | Радиальный индикатор |
| **Thermostat** | Компактный термостат |
| **Mini Player** | Мини-плеер (обложка + управление) |
| **Album Art** | Обложка текущего трека |
| **Person** | Персона (дом/вне дома) |
| **Todo** | Список задач |
| **Calendar Widget** | Предстоящие события календаря |
| **Battery** | Уровень заряда устройств |
| **Analog Clock** | Аналоговые часы |
| **Solar Flow** | Поток солнечной энергии |
| **Notifications** | Уведомления Home Assistant |
| **Automation Toggle** | Включение/выключение автоматизаций |
| **Home Mode Widget** | Режим дома (input_select) |
| **Network Monitor** | Мониторинг сети (ping, скорость) |
| **Markdown** | Произвольный Markdown текст |
| **Navigate** | Кнопка перехода между видами |
| **Image** | Картинка / camera snapshot |
| **Camera** | Камера в сайдбаре |
| **Iframe** | Встроенная страница |
| **Divider** | Разделитель |

### Интерфейс и UX

- **Drag & Drop** — перетаскивание карточек и виджетов в режиме редактирования
- **Несколько видов** — вкладки / кнопки переключения видов
- **Свайп между видами** на мобильных устройствах
- **Адаптивный дизайн** — работает на телефоне, планшете и большом экране
- **Тёмная тема** — несколько вариантов цветовых схем
- **Кастомная тема** — настраиваемые цвета, шрифты, отступы
- **Kiosk режим** (`?kiosk=1`) — скрыть UI для настенного экрана
- **Меню скрыто** (`?menu=false`) — защита от случайных изменений
- **Глобальный поиск** `Cmd/Ctrl+K` — быстрый переход к любой сущности или карточке
- **Screensaver** — заставка после 5 минут бездействия
- **Адаптивный фон** — фон меняется по цвету активного освещения
- **Фон на вид** — своя картинка для каждого вида
- **Haptic feedback** на мобильных (вибрация при нажатии)
- **Undo/Redo** — история изменений дашборда
- **Экспорт/импорт** конфигурации YAML
- **Автоматическое переключение видов** — по условиям (время, состояние сущности)
- **Детали персоны** — тап на член семьи → геолокация, батарея, трекеры

### Совместимость

- Home Assistant OS / Supervised — через аддон
- Home Assistant Container / Core — через Docker
- Поддержка arm64 (Apple M1/M2, Raspberry Pi 4+) и armv7

---

## URL параметры

| Параметр | Пример | Описание |
|---------|--------|----------|
| `?view=` | `?view=Living Room` | Открыть конкретный вид при загрузке |
| `?menu=false` | `?menu=false` | Скрыть кнопку меню (защита от изменений) |
| `?kiosk=1` | `?kiosk=1` | Kiosk режим — только дашборд без chrome |

---

## Горячие клавиши

| Клавиша | Действие |
|---------|----------|
| `Cmd/Ctrl + K` | Открыть глобальный поиск |
| `f` | Поиск в меню |
| `Escape` | Закрыть / выйти |
| `Cmd/Ctrl + S` | Сохранить дашборд |
| `Cmd/Ctrl + Z` | Отменить |
| `Cmd/Ctrl + Shift + Z` | Повторить |

---

## Разработка / Development

```bash
# Клонировать
git clone https://github.com/mr-khamzat/ha-fusion.git
cd ha-fusion

# Установить зависимости
npm install

# Настроить окружение
cp .env.example .env
# Отредактировать .env: HASS_URL + HASS_TOKEN

# Запустить дев-сервер
npm run dev

# Сборка
npm run build

# Проверка типов и линтинг
npm run check
npm run lint
```

### Структура проекта

```
src/
  lib/
    Main/       — карточки главного дашборда
    Sidebar/    — виджеты сайдбара
    Modal/      — конфигурационные модалы и диалоги
    Components/ — переиспользуемые компоненты (Search, Theme, FAB...)
    Drawer/     — панель редактирования (меню)
  routes/
    +page.svelte        — главная страница
    _api/               — серверные API роуты (prayer_times, ai_chat...)
```

---

## Вклад в проект / Contributing

Проект открыт для всех! Принимаются:
- Баг-репорты через [Issues](https://github.com/mr-khamzat/ha-fusion/issues)
- Pull Request с новыми функциями и исправлениями
- Идеи и пожелания

---

## Лицензия / License

[MIT License](LICENSE) — свободное использование, модификация и распространение.

---

## Благодарности / Credits

- **[matt8707](https://github.com/matt8707)** — создатель оригинального ha-fusion (2023–2024)
- **[mr-khamzat](https://github.com/mr-khamzat)** — поддержка и развитие с марта 2026
- Все контрибьюторы оригинального репозитория

---

<p align="center">
  <b>Сделано с ❤️ для сообщества Home Assistant</b><br>
  <i>Built with love for the Home Assistant community</i>
</p>
