import { Difficulty, ExerciseType } from './types';

export const EXERCISE_TYPE_OPTIONS: { value: ExerciseType; label: string }[] =
  Object.values(ExerciseType).map((value) => ({
    value,
    label: value,
  }));

export const DIFFICULTY_OPTIONS: { value: Difficulty; label: string }[] =
  Object.values(Difficulty).map((value) => ({
    value,
    label: value,
  }));

export const TOPICS_BY_DIFFICULTY: {
  [key in Difficulty]: { [category: string]: string[] };
} = {
  [Difficulty.A1]: {
    Vocabulario: [
      'Saludos y Presentaciones',
      'La Familia',
      'Los Números y la Hora',
      'Comida y Bebida',
      'La Rutina Diaria',
      'El Tiempo y las Estaciones',
    ],
    Gramática: [
      'Artículos (el, la, los, las)',
      'Presente de Indicativo (verbos regulares)',
      'Verbos Ser y Estar',
      'Género y Número de Sustantivos',
      'Adjetivos Posesivos (mi, tu, su)',
      'Verbos Gustar y Encantar',
      'Presente de Indicativo (irregulares comunes)',
      'Preposiciones de lugar (en, a, de)',
    ],
  },
  [Difficulty.A2]: {
    Vocabulario: [
      'Descripciones de Personas y Lugares',
      'Compras y Tiendas',
      'El Tiempo Libre y Aficiones',
      'Viajes y Vacaciones',
      'Dar Indicaciones',
    ],
    Gramática: [
      'Pretérito Perfecto Compuesto',
      'Pretérito Indefinido',
      'El Imperativo Afirmativo',
      'Comparativos y Superlativos',
      'Pronombres de Objeto Directo (lo, la)',
      'Pronombres de Objeto Indirecto (me, te, le)',
      'Verbos Reflexivos',
      'Diferencia entre Saber y Conocer',
    ],
  },
  [Difficulty.B1]: {
    Vocabulario: [
      'El Trabajo y la Profesión',
      'El Medio Ambiente',
      'Salud y Bienestar',
      'Educación',
      'Expresar Opiniones y Sentimientos',
    ],
    Gramática: [
      'Futuro Simple',
      'Condicional Simple',
      'Pretérito Imperfecto',
      'Contraste Indefinido vs. Imperfecto',
      'Uso de "por" y "para"',
      'Presente de Subjuntivo (deseos, dudas)',
      'Imperativo Negativo',
      'Se impersonal y pasiva refleja',
    ],
  },
  [Difficulty.B2]: {
    Vocabulario: [
      'Temas de Actualidad (Noticias)',
      'Cultura y Tradiciones',
      'La Tecnología y la Sociedad',
      'Relaciones Personales',
      'El Mundo Laboral',
    ],
    Gramática: [
      'Presente de Subjuntivo',
      'La Voz Pasiva',
      'El Discurso Indirecto',
      'Oraciones de relativo',
      'Ventajas y Desventajas (estructuras)',
      'Imperfecto de Subjuntivo',
      'Oraciones Condicionales (si + imperfecto subj.)',
      'Pluscuamperfecto de Indicativo',
    ],
  },
  [Difficulty.C1]: {
    Vocabulario: [
      'Temas Abstractos y Debates',
      'La Política y la Economía',
      'El Arte y la Literatura',
      'La Ciencia y los Avances',
      'Problemas Sociales Globales',
    ],
    Gramática: [
      'Imperfecto y Pluscuamperfecto de Subjuntivo',
      'Oraciones Condicionales (todos los tipos)',
      'Perífrasis Verbales complejas',
      'Conectores discursivos avanzados',
      'Matices del Lenguaje',
      'Oraciones Concesivas (aunque + subj/ind)',
      'La concordancia de los tiempos verbales',
      'Voz Pasiva vs. Pasiva Refleja',
    ],
  },
};