import { pick, shuffle } from './random';

// Traditional Spanish sayings, written without punctuation.
const REFRANES = [
  'Más vale tarde que nunca',
  'No por mucho madrugar amanece más temprano',
  'A quien madruga Dios le ayuda',
  'En boca cerrada no entran moscas',
  'Perro ladrador poco mordedor',
  'Más vale pájaro en mano que ciento volando',
  'Ojos que no ven corazón que no siente',
  'Dime con quién andas y te diré quién eres',
  'Al mal tiempo buena cara',
  'Cría cuervos y te sacarán los ojos',
  'El que la sigue la consigue',
  'Camarón que se duerme se lo lleva la corriente',
  'No hay mal que por bien no venga',
  'A caballo regalado no le mires el diente',
  'Quien siembra vientos recoge tempestades',
  'Donde fueres haz lo que vieres',
  'Agua que no has de beber déjala correr',
  'Más sabe el diablo por viejo que por diablo',
  'Cada loco con su tema',
  'De tal palo tal astilla',
  'El hábito no hace al monje',
  'En casa del herrero cuchillo de palo',
  'Mucho ruido y pocas nueces',
  'No dejes para mañana lo que puedas hacer hoy',
  'Poco a poco se va lejos',
  'Quien bien te quiere te hará llorar',
  'Zapatero a tus zapatos',
  'A buen entendedor pocas palabras bastan',
  'Del dicho al hecho hay mucho trecho',
  'Las apariencias engañan',
  'Ojo por ojo diente por diente',
  'Quien mucho abarca poco aprieta',
  'Querer es poder',
  'Una golondrina no hace verano',
  'Al pan pan y al vino vino',
  'Cuando el río suena agua lleva',
  'Hablando del rey de Roma por la puerta asoma',
  'La curiosidad mató al gato',
  'No es oro todo lo que reluce',
  'Sobre gustos no hay nada escrito',
  'A falta de pan buenas son tortas',
  'A lo hecho pecho',
  'A rey muerto rey puesto',
  'Quien a buen árbol se arrima buena sombra le cobija',
  'Aunque la mona se vista de seda mona se queda',
  'Cada oveja con su pareja',
  'Contigo pan y cebolla',
  'Cuando una puerta se cierra otra se abre',
  'De noche todos los gatos son pardos',
  'Dios los cría y ellos se juntan',
  'El que no llora no mama',
  'El tiempo es oro',
  'En abril aguas mil',
  'Gato escaldado del agua fría huye',
  'Hasta el cuarenta de mayo no te quites el sayo',
  'La avaricia rompe el saco',
  'La práctica hace al maestro',
  'Lo que no mata engorda',
  'Los últimos serán los primeros',
  'Más vale prevenir que curar',
  'Más vale solo que mal acompañado',
  'No hay rosa sin espinas',
  'No se ganó Zamora en una hora',
  'En martes ni te cases ni te embarques',
  'Piensa el ladrón que todos son de su condición',
  'Quien calla otorga',
  'Quien tiene un amigo tiene un tesoro',
  'Roma no se construyó en un día',
  'Se dice el pecado pero no el pecador',
  'Tanto va el cántaro a la fuente que al final se rompe',
  'Unos nacen con estrella y otros nacen estrellados',
  'Vísteme despacio que tengo prisa',
  'A grandes males grandes remedios',
  'Año de nieves año de bienes',
  'Cuatro ojos ven más que dos',
  'El saber no ocupa lugar',
  'Las cuentas claras y el chocolate espeso',
  'No hay dos sin tres',
  'Más vale maña que fuerza',
  'Quien ríe el último ríe mejor',
];

export type Level = 'facil' | 'medio' | 'dificil';
/** How many different letters of the saying are given away at the start. */
export const LEVELS: Record<Level, { reveal: number; label: string }> = {
  facil: { reveal: 5, label: 'Fácil' },
  medio: { reveal: 3, label: 'Medio' },
  dificil: { reveal: 1, label: 'Difícil' },
};

/**
 * text: the saying in capitals without accents (Ñ kept); code: number shown for each letter;
 * given: letters revealed from the start.
 */
export type Criptograma = { text: string; code: Record<string, number>; given: string[] };

const normalize = (s: string) =>
  s
    .toUpperCase()
    .replace(/Ñ/g, '\u0001')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/\u0001/g, 'Ñ');

export const isLetter = (c: string) => /[A-ZÑ]/.test(c);

export function generate(level: Level): Criptograma {
  const text = normalize(pick(REFRANES));
  const letters = [...new Set([...text].filter(isLetter))];
  // Each letter gets a different number from 1 to 27, in random order.
  const numbers = shuffle(Array.from({ length: 27 }, (_, i) => i + 1));
  const code: Record<string, number> = {};
  letters.forEach((l, i) => (code[l] = numbers[i]));
  return { text, code, given: shuffle(letters).slice(0, LEVELS[level].reveal) };
}
