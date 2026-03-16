export type CharacterType = 'theseus' | 'orion' | 'prometheus';

export interface CharacterDef {
  id: CharacterType;
  heroName: string;        // Hero name shown large
  tagline: string;         // One-liner
  color: string;           // Primary color for UI + sprite
  accentColor: string;
  weaponName: string;
  weaponDesc: string;
}

export const CHARACTERS: CharacterDef[] = [
  {
    id: 'theseus',
    heroName: 'МИРЕЙ',
    tagline: 'AoE ближний бой',
    color: '#5B8DD9',
    accentColor: '#3a6cb5',
    weaponName: 'Нить братства',
    weaponDesc: 'Хлыст вокруг — бьёт всех в радиусе',
  },
  {
    id: 'orion',
    heroName: 'СВОРИОН',
    tagline: 'Дальний бой, пробой',
    color: '#7FD1AE',
    accentColor: '#4aad84',
    weaponName: 'Алмазный арбалет',
    weaponDesc: 'Болт пробивает строй, взрывается',
  },
  {
    id: 'prometheus',
    heroName: 'АРМЕТЕЙ',
    tagline: 'Зонирование, огонь',
    color: '#FF6B35',
    accentColor: '#d94c15',
    weaponName: 'Искра Титана',
    weaponDesc: 'Сфера вращается, языки пламени',
  },
];

export function getCharacter(id: CharacterType): CharacterDef {
  return CHARACTERS.find(c => c.id === id)!;
}
