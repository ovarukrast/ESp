import { Difficulty } from "./types";

export interface ColorInfo {
  name: string;
  bg: string;
  text: string;
  icon: string;
  hex: string;
  textHex: string;
}

const unitColorPalette: ColorInfo[] = [
  // 0: Rojo (Unidad 0)
  { name: 'red', bg: 'bg-red-600', text: 'text-red-200', icon: 'text-red-500', hex: '#DC2626', textHex: '#FECACA' },
  // 1: Naranja (Unidad 1)
  { name: 'orange', bg: 'bg-orange-500', text: 'text-orange-100', icon: 'text-orange-500', hex: '#F97316', textHex: '#FFEDD5' },
  // 2: Ámbar (Unidad 2)
  { name: 'amber', bg: 'bg-amber-500', text: 'text-amber-100', icon: 'text-amber-500', hex: '#F59E0B', textHex: '#FEF3C7' },
  // 3: Lima (Unidad 3)
  { name: 'lime', bg: 'bg-lime-600', text: 'text-lime-200', icon: 'text-lime-600', hex: '#65A30D', textHex: '#D9F99D' },
  // 4: Verde (Unidad 4)
  { name: 'green', bg: 'bg-green-600', text: 'text-green-200', icon: 'text-green-600', hex: '#16A34A', textHex: '#BBF7D0' },
  // 5: Esmeralda (Unidad 5)
  { name: 'emerald', bg: 'bg-emerald-600', text: 'text-emerald-200', icon: 'text-emerald-600', hex: '#059669', textHex: '#A7F3D0' },
  // 6: Turquesa (Unidad 6)
  { name: 'teal', bg: 'bg-teal-600', text: 'text-teal-200', icon: 'text-teal-600', hex: '#0D9488', textHex: '#99F6E4' },
  // 7: Cian (Unidad 7)
  { name: 'cyan', bg: 'bg-cyan-600', text: 'text-cyan-200', icon: 'text-cyan-600', hex: '#0891B2', textHex: '#A5F3FC' },
  // 8: Azul (Unidad 8)
  { name: 'sky', bg: 'bg-sky-600', text: 'text-sky-200', icon: 'text-sky-600', hex: '#0284C7', textHex: '#BAE6FD' },
  // 9: Índigo (Unidad 9)
  { name: 'indigo', bg: 'bg-indigo-600', text: 'text-indigo-200', icon: 'text-indigo-500', hex: '#4F46E5', textHex: '#C7D2FE' },
  // 10: Violeta (Unidad 10)
  { name: 'violet', bg: 'bg-violet-600', text: 'text-violet-200', icon: 'text-violet-500', hex: '#7C3AED', textHex: '#DDD6FE' },
  // 11: Fucsia (Unidad 11)
  { name: 'fuchsia', bg: 'bg-fuchsia-600', text: 'text-fuchsia-200', icon: 'text-fuchsia-500', hex: '#C026D3', textHex: '#F5D0FE' },
  // 12: Rosa (Unidad 12)
  { name: 'rose', bg: 'bg-rose-600', text: 'text-rose-200', icon: 'text-rose-500', hex: '#E11D48', textHex: '#FECDD3' },
];

const defaultColor = unitColorPalette[9]; // Indigo por defecto

export const getUnitColorInfo = (topic: string): ColorInfo => {
    if (!topic) return defaultColor;
  
    const numberMatches = topic.match(/\d+/g);
  
    if (numberMatches) {
      const numbers = numberMatches.map(Number);
      const maxUnit = Math.max(...numbers);
      return unitColorPalette[maxUnit % unitColorPalette.length] || defaultColor;
    }
  
    return defaultColor;
};

export const getSubtitleInfo = (topic: string, difficulty: Difficulty): string => {
  if (!topic) return '';

  const getBookName = (level: Difficulty): string => {
      switch (level) {
          case Difficulty.A1: return 'Aula Internacional Plus 1';
          case Difficulty.A2: return 'Aula Internacional Plus 2';
          case Difficulty.B1: return 'Aula Internacional Plus 3';
          case Difficulty.B2: return 'Aula Internacional Plus'; // Special case, handled below
          case Difficulty.C1: return 'C de C1';
          default: return '';
      }
  };

  let bookName = getBookName(difficulty);
  let unitPart = '';

  if (difficulty === Difficulty.B2) {
      const bookMatch = topic.match(/Libro (\d)/);
      if (bookMatch) {
          bookName = `Aula Internacional Plus ${bookMatch[1]}`;
      }
  }

  if (difficulty === Difficulty.C1) {
      const themeMatch = topic.match(/\(([^)]+)\)/);
      if (themeMatch) {
          unitPart = `Unidad de ${themeMatch[1]}`;
      }
  } else {
      const unitMatches = topic.match(/Unidad \d+/g);
      if (unitMatches) {
          // Get unique unit numbers, sort them, and create the string
          const unitNumbers = [...new Set(unitMatches.map(u => u.split(' ')[1]))].map(Number).sort((a, b) => a - b);
          if (unitNumbers.length > 1) {
              unitPart = `Unidades ${unitNumbers.join(', ')}`;
          } else if (unitNumbers.length === 1) {
              unitPart = `Unidad ${unitNumbers[0]}`;
          }
      }
  }
  
  return unitPart ? `${bookName} - ${unitPart}` : bookName;
};