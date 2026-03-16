# ARCHITECTURE.md — Техническая схема проекта

## Обзор модулей

```
main.ts
  ├── CharacterSelectScene ──(onStart)──→ GameScene
  │                                         ├── Player → BaseWeapon (1 из 3)
  │                                         ├── SpawnSystem → Enemy[] (Shadow, Ranged, Bomber, Boss)
  │                                         ├── XPSystem → XPCrystal[] → weapon.level++
  │                                         ├── Chest[] → force level-up
  │                                         ├── EnemyProjectile[] (от RangedEnemy)
  │                                         ├── Camera (следование за Player)
  │                                         └── UI: HUD, Notification[], GameOverScreen
  └── InputManager (один на всё приложение, передаётся в обе сцены)
```

## Game Loop (main.ts)

```
requestAnimationFrame(gameLoop):
  1. dt = clamp(elapsed, 0, MAX_DELTA=0.1)
  2. accumulator += dt
  3. while (accumulator >= FIXED_STEP=1/60):
       currentScene.update(FIXED_STEP)
       accumulator -= FIXED_STEP
  4. currentScene.render()
```

**Паттерн**: Fixed timestep с накоплением. Физика и логика обновляются ровно 60 раз/с, рендер — каждый кадр.

## Система сцен

**Переключение** через функции `switchToCharacterSelect()` / `switchToGame(character)` в `main.ts`.

```
CharacterSelectScene
  ├── update(dt): анимация фона
  ├── render(): фон + карточки героев + кнопка "НАЧАТЬ БОЙ"
  ├── handleTap(): выбор карточки / старт
  └── destroy(): удаление event listeners

GameScene
  ├── update(dt): player, enemies, projectiles, crystals, chests, bosses, collisions, spawning
  ├── render(): camera transform → world objects → screen-space UI
  ├── restart(): пересоздаёт player/spawner/xpSystem (не scene)
  └── destroy(): удаление event listeners
```

**Контракт сцены**: `update(dt)`, `render()`, `resize(w, h)`, `destroy()`.

## Система сущностей

```
Entity (abstract)
  ├── x, y: number
  ├── active: boolean
  └── update(dt, ...) / render(ctx)

Player extends Entity
  └── weapon: BaseWeapon (создаётся по CharacterType)

Enemy extends Entity (abstract)
  ├── hp, speed, damage, radius, xpValue, goldChance
  ├── contactTimer (кулдаун контактного урона)
  └── update(dt, playerX, playerY): движение к/от игрока

Shadow, RangedEnemy, BomberEnemy, Boss — конкретные враги
```

**Жизненный цикл**: создание → массив в GameScene → `update()` каждый кадр → `active = false` при смерти → удаление из массива.

## Система оружий

```
BaseWeapon (abstract)
  ├── level: 1–8
  ├── displayName: string
  ├── update(dt, playerX, playerY, facingAngle, enemies[]): логика
  └── render(ctx, playerX, playerY): визуал

AriadneThread  → 360° AoE круг, cooldown → flash
AstralCrossbow → болты (Bolt[]), pierce → embed → explode, автоприцел
TitanSpark     → орбитальная сфера (контакт) + языки пламени (Tongue[])
```

**Уровни**: таблица в `weaponConfig.ts` (damage, cooldown, radius, количество снарядов и т.д.)

## Система спавна (SpawnSystem)

```
update(dt, gameTime, currentCount, playerX, playerY, screenW, screenH) → Enemy[]

1. Определяет текущую фазу волны (WAVE_CONFIG: 7 фаз, 0–210с)
2. Проверяет лимит maxEnemies
3. Накапливает spawnRate * dt → сколько спавнить
4. Для каждого спавна:
   - roll → shadow / ranged / bomber (веса зависят от gameTime)
   - Позиция: случайный угол, расстояние = диагональ экрана / 2 + 60px
   - Применяет масштабирование HP/DMG по волне
```

## Система XP (XPSystem)

```
XP_TABLE: [8, 12, 18, 26, 36, 48, 64]  — XP до следующего уровня
MAX_WEAPON_LEVEL: 8

addXP(amount):
  xp += amount
  while (xp >= threshold && weapon.level < MAX):
    weapon.level++
    invincibility + notification + haptic
```

## Коллизии (GameScene.update)

Все проверки — **круг-круг** (`dx² + dy² <= (r1+r2)²`):

| Пара | Результат |
|---|---|
| Player ↔ Enemy | Контактный урон (с cooldown 1.0с) |
| Player ↔ EnemyProjectile | Урон, снаряд уничтожается |
| Player ↔ XPCrystal | Сбор XP (притяжение < 60px, сбор < 10px) |
| Player ↔ Chest | Уровень оружия +1 |
| Weapon ↔ Enemy | Урон от оружия (специфично для каждого) |
| Boss shockwave ↔ Player | Урон 0.8× от boss.damage (флаг `shockwaving`) |
| Bomber explosion ↔ Player | Урон в радиусе 100px |

## Рендер пайплайн (GameScene.render)

```
1. setTransform(dpr) + clear
2. Camera transform (translate к центру экрана - camera.xy)
3. World space:
   - Фон (сетка + трещины, бесконечный скроллинг)
   - Сундуки, кристаллы XP, снаряды врагов
   - Враги, игрок (с оружием)
4. Restore transform → screen space:
   - HUD (HP, XP, таймер, точки уровней)
   - Уведомления (стек, slot 0 = новейшее внизу)
   - Стрелки к сундукам (на краях экрана)
   - Джойстик
   - Game Over overlay
```

## Camera (Camera.ts)

```
update(targetX, targetY):
  x = lerp(x, targetX, 1 - SMOOTH)  // SMOOTH = 0.12
  y = lerp(y, targetY, 1 - SMOOTH)
```

Плавное следование за игроком. Все мировые координаты сдвигаются на `(-camera.x + screenW/2, -camera.y + screenH/2)`.

## Input (InputManager.ts)

Плавающий виртуальный джойстик:
- **Активация**: touchstart / mousedown в любом месте экрана
- **Dead zone**: 8px (ниже — направление не меняется)
- **Max radius**: 50px (knob clamped)
- **Output**: `direction: Vector2` (нормализованный), `magnitude: 0–1`
- **Рендер**: полупрозрачное кольцо + ручка

## Паттерны взаимодействия

### Снаряды врагов
`RangedEnemy` копит снаряды в `pendingProjectiles[]`. `GameScene` каждый кадр вызывает `enemy.drainProjectiles()` и добавляет их в свой пул `enemyProjectiles[]`.

### Взрыв бомбардира
`BomberEnemy.update()` ставит `exploding = true` + `active = false`. GameScene проверяет `enemy.exploding` и наносит урон по радиусу.

### Шоковая волна босса
`Boss.update()` ставит `shockwaving = true` на один кадр. GameScene проверяет `instanceof Boss && enemy.shockwaving` и наносит урон.

### Telegram SDK
```typescript
const tg = (window as unknown as Record<string, unknown>).Telegram;
// HapticFeedback.impactOccurred('light') — урон
// HapticFeedback.notificationOccurred('error') — смерть
```
Обёрнуто в try-catch — работает и без Telegram.
