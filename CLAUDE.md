# CLAUDE.md — Главный контекст проекта

> **Читай этот файл первым делом в начале каждой сессии.**
> Перед работой также загляни в `PROGRESS.md` (текущий статус) и `ARCHITECTURE.md` (техническая схема).

---

## Что это за проект

**Петростигия** — survivors-like игра (жанр Vampire Survivors) для Telegram Mini Apps.
Мифология + тёмный Петербург. Сессии ~4 минуты. Рогалик с выбором героя и прокачкой оружия.

## Стек технологий

| Технология | Зачем |
|---|---|
| **Vite 5 + TypeScript strict** | Сборка и типизация |
| **HTML5 Canvas 2D** | Рендер (без WebGL — совместимость с Telegram WebView) |
| **vite-plugin-singlefile** | Всё инлайнится в один `dist/index.html` (~46 KB) |
| **@twa-dev/sdk** | Telegram WebApp API (haptic feedback и др.) |

## Команды

```bash
npm run dev              # Dev-сервер (порт 5173)
npm run dev -- --host    # Для тестирования с телефона в локальной сети
npm run build            # Продакшн-сборка → dist/index.html
```

## Структура папок

```
src/
  main.ts              # Точка входа: Canvas, game loop (fixed timestep 60fps), переключение сцен
  config/              # Константы и таблицы: герои, оружия, враги, волны, XP
  core/                # InputManager (джойстик touch+mouse), Camera (плавное следование)
  entities/            # Entity (база), Player, враги (Shadow, RangedEnemy, BomberEnemy, Boss),
                       #   XPCrystal, Chest, EnemyProjectile
  weapons/             # BaseWeapon (абстракт), AriadneThread, AstralCrossbow, TitanSpark
  systems/             # SpawnSystem (волны + масштабирование), XPSystem (прокачка)
  scenes/              # CharacterSelectScene (выбор героя), GameScene (геймплей)
  ui/                  # HUD, Notification (стек), GameOverScreen (2 кнопки)
  utils/               # Vector2, math (clamp, lerp, roundRect и др.)
```

## Ключевые правила и соглашения

1. **DPR** ограничен `MAX_PIXEL_RATIO = 2`, `imageSmoothingEnabled = false`
2. **Fixed timestep**: `1/60` секунды, аккумулятор + максимальная дельта 0.1с
3. **Сцены**: `CharacterSelectScene` и `GameScene`, переключаются через callback-функции в `main.ts`
4. **Оружия**: наследуют `BaseWeapon`, 8 уровней, таблицы в `weaponConfig.ts`
5. **Враги**: наследуют `Enemy`, масштабируются каждые 60с (HP ×1.2, DMG ×1.1)
6. **Коллизии**: круг-круг (без spatial hash, <100 сущностей)
7. **Telegram**: haptic feedback через try-catch (работает и без Telegram)
8. **index.html** в корне проекта (не в /public/) — требование Vite + singlefile
9. **Язык UI**: русский (уведомления, меню, HUD)
10. **Билд**: один HTML-файл, инлайн всех ассетов

## Три героя

| ID | Имя | Оружие | Стиль |
|---|---|---|---|
| `theseus` | МИРЕЙ | Нить братства | 360 AoE вокруг игрока |
| `orion` | СВОРИОН | Алмазный арбалет | Автоприцел, пробивающие болты |
| `prometheus` | АРМЕТЕЙ | Искра Титана | Орбитальная сфера + языки пламени |

## Типы врагов

| Класс | Имя | Поведение |
|---|---|---|
| `Shadow` | Тень | Ближний, бежит к игроку |
| `RangedEnemy` | Стрелец | Дальний, держит дистанцию 130–200px, стреляет |
| `BomberEnemy` | Бомбардир | Быстрый, взрывается при сближении (80px) |
| `Boss` | Оборотень | Ударная волна каждые ~4с, спавн каждые 120с |
