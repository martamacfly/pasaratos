// Hand-written puzzles for "Grupos de 4": 16 words that split into 4 hidden groups.
// Groups are listed from easiest to hardest; each word belongs to exactly one group,
// but some are chosen to look like they fit another one.

export type Group = { title: string; words: string[] };
export type Puzzle = Group[];

export const PUZZLES: Puzzle[] = [
  [
    { title: 'Días de la semana', words: ['LUNES', 'JUEVES', 'VIERNES', 'SÁBADO'] },
    { title: 'Planetas', words: ['MARTE', 'VENUS', 'SATURNO', 'MERCURIO'] },
    { title: 'Frutas rojas', words: ['FRESA', 'CEREZA', 'FRAMBUESA', 'SANDÍA'] },
    { title: '___ de mar', words: ['ESTRELLA', 'CABALLITO', 'ERIZO', 'LOBO'] },
  ],
  [
    { title: 'Cítricos', words: ['NARANJA', 'LIMÓN', 'LIMA', 'POMELO'] },
    { title: 'Flores', words: ['TULIPÁN', 'CLAVEL', 'ORQUÍDEA', 'GIRASOL'] },
    { title: 'Tonos de azul', words: ['CELESTE', 'MARINO', 'TURQUESA', 'AÑIL'] },
    { title: 'Nombres de mujer', words: ['ROSA', 'MARGARITA', 'VIOLETA', 'AZUCENA'] },
  ],
  [
    { title: 'Ríos de España', words: ['EBRO', 'TAJO', 'DUERO', 'GUADALQUIVIR'] },
    { title: 'Capitales de Sudamérica', words: ['QUITO', 'BOGOTÁ', 'CARACAS', 'SANTIAGO'] },
    { title: 'Comunidades autónomas', words: ['GALICIA', 'ARAGÓN', 'MURCIA', 'NAVARRA'] },
    { title: 'Herramientas', words: ['MARTILLO', 'SIERRA', 'TALADRO', 'LIMA'] },
  ],
  [
    { title: 'Animales de granja', words: ['VACA', 'CERDO', 'OVEJA', 'GALLINA'] },
    { title: 'Felinos', words: ['TIGRE', 'LEÓN', 'PUMA', 'LINCE'] },
    { title: 'Aves rapaces', words: ['ÁGUILA', 'HALCÓN', 'BÚHO', 'BUITRE'] },
    { title: 'Signos del zodiaco', words: ['ARIES', 'TAURO', 'LEO', 'CÁNCER'] },
  ],
  [
    { title: 'Platos españoles', words: ['PAELLA', 'GAZPACHO', 'TORTILLA', 'CROQUETAS'] },
    { title: 'Electrodomésticos', words: ['NEVERA', 'HORNO', 'LAVADORA', 'MICROONDAS'] },
    { title: 'Cubiertos', words: ['TENEDOR', 'CUCHARA', 'CUCHILLO', 'CUCHARILLA'] },
    { title: 'Especias', words: ['ORÉGANO', 'COMINO', 'PIMENTÓN', 'AZAFRÁN'] },
  ],
  [
    { title: 'Deportes de raqueta', words: ['TENIS', 'PÁDEL', 'BÁDMINTON', 'SQUASH'] },
    { title: 'Deportes de equipo con balón', words: ['FÚTBOL', 'BALONCESTO', 'BALONMANO', 'VOLEIBOL'] },
    { title: 'Artes marciales', words: ['KÁRATE', 'JUDO', 'TAEKWONDO', 'AIKIDO'] },
    { title: 'Estilos de natación', words: ['CROL', 'BRAZA', 'ESPALDA', 'MARIPOSA'] },
  ],
  [
    { title: 'Órganos', words: ['HÍGADO', 'RIÑÓN', 'PULMÓN', 'CORAZÓN'] },
    { title: 'Partes de la cara', words: ['NARIZ', 'BOCA', 'FRENTE', 'MEJILLA'] },
    { title: 'Animales con antenas', words: ['HORMIGA', 'CARACOL', 'ABEJA', 'GAMBA'] },
    { title: 'Huesos', words: ['FÉMUR', 'TIBIA', 'CÚBITO', 'RADIO'] },
  ],
  [
    { title: 'Pintores españoles', words: ['GOYA', 'VELÁZQUEZ', 'PICASSO', 'DALÍ'] },
    { title: 'Escritores españoles', words: ['CERVANTES', 'LORCA', 'MACHADO', 'QUEVEDO'] },
    { title: 'Géneros musicales', words: ['FLAMENCO', 'ROCK', 'JAZZ', 'REGUETÓN'] },
    { title: 'Museos de Madrid', words: ['PRADO', 'THYSSEN', 'SOROLLA', 'REINA SOFÍA'] },
  ],
  [
    { title: 'Estaciones del año', words: ['PRIMAVERA', 'VERANO', 'OTOÑO', 'INVIERNO'] },
    { title: 'Fenómenos del tiempo', words: ['GRANIZO', 'NIEBLA', 'TORMENTA', 'ESCARCHA'] },
    { title: 'Unidades de tiempo', words: ['SEGUNDO', 'MINUTO', 'HORA', 'SIGLO'] },
    { title: 'Meses de 30 días', words: ['ABRIL', 'JUNIO', 'SEPTIEMBRE', 'NOVIEMBRE'] },
  ],
  [
    { title: 'Habitaciones', words: ['COCINA', 'SALÓN', 'BAÑO', 'DORMITORIO'] },
    { title: 'Muebles', words: ['SOFÁ', 'ARMARIO', 'ESTANTERÍA', 'CÓMODA'] },
    { title: 'Ropa de cama', words: ['SÁBANA', 'MANTA', 'ALMOHADA', 'EDREDÓN'] },
    { title: 'Materiales de construcción', words: ['LADRILLO', 'CEMENTO', 'YESO', 'MADERA'] },
  ],
  [
    { title: 'Juegos de mesa', words: ['PARCHÍS', 'AJEDREZ', 'OCA', 'DOMINÓ'] },
    { title: 'Juegos de patio', words: ['ESCONDITE', 'COMBA', 'RAYUELA', 'CANICAS'] },
    { title: 'Piezas de ajedrez', words: ['TORRE', 'ALFIL', 'CABALLO', 'PEÓN'] },
    { title: 'Palos de la baraja española', words: ['OROS', 'COPAS', 'ESPADAS', 'BASTOS'] },
  ],
  [
    { title: 'Insectos', words: ['MOSCA', 'MOSQUITO', 'ESCARABAJO', 'GRILLO'] },
    { title: 'Reptiles', words: ['LAGARTO', 'SERPIENTE', 'TORTUGA', 'COCODRILO'] },
    { title: 'Animales marinos', words: ['PULPO', 'CALAMAR', 'SEPIA', 'MEDUSA'] },
    { title: 'Animales que hibernan', words: ['OSO', 'MARMOTA', 'LIRÓN', 'ERIZO'] },
  ],
  [
    { title: 'Embarcaciones', words: ['BARCO', 'VELERO', 'CANOA', 'YATE'] },
    { title: 'Vehículos de dos ruedas', words: ['BICICLETA', 'MOTO', 'PATINETE', 'CICLOMOTOR'] },
    { title: 'Vuelan', words: ['AVIÓN', 'HELICÓPTERO', 'AVIONETA', 'GLOBO'] },
    { title: 'Partes del coche', words: ['VOLANTE', 'MOTOR', 'MALETERO', 'CAPÓ'] },
  ],
  [
    { title: 'Material escolar', words: ['LÁPIZ', 'GOMA', 'ESTUCHE', 'SACAPUNTAS'] },
    { title: 'Asignaturas', words: ['HISTORIA', 'MATEMÁTICAS', 'LENGUA', 'MÚSICA'] },
    { title: 'Figuras geométricas', words: ['TRIÁNGULO', 'CÍRCULO', 'ROMBO', 'PENTÁGONO'] },
    { title: 'Instrumentos de medida', words: ['REGLA', 'BALANZA', 'TERMÓMETRO', 'RELOJ'] },
  ],
  [
    { title: 'Calzado', words: ['ZAPATILLA', 'BOTA', 'SANDALIA', 'CHANCLA'] },
    { title: 'Joyas', words: ['ANILLO', 'COLLAR', 'PENDIENTE', 'PULSERA'] },
    { title: 'Prendas de abrigo', words: ['ABRIGO', 'BUFANDA', 'GUANTES', 'GORRO'] },
    { title: 'Tejidos', words: ['SEDA', 'LANA', 'ALGODÓN', 'LINO'] },
  ],
  [
    { title: 'Árboles', words: ['ROBLE', 'PINO', 'OLIVO', 'ENCINA'] },
    { title: 'Piedras preciosas', words: ['RUBÍ', 'ZAFIRO', 'ESMERALDA', 'DIAMANTE'] },
    { title: 'Metales', words: ['ORO', 'PLATA', 'COBRE', 'HIERRO'] },
    { title: 'Accidentes geográficos', words: ['VALLE', 'CABO', 'GOLFO', 'SIERRA'] },
  ],
  [
    { title: 'Trabajan en un hospital', words: ['MÉDICO', 'ENFERMERA', 'CIRUJANO', 'CELADOR'] },
    { title: 'Trabajan en un restaurante', words: ['CAMARERO', 'COCINERO', 'PINCHE', 'SUMILLER'] },
    { title: 'Trabajan con madera', words: ['CARPINTERO', 'EBANISTA', 'LEÑADOR', 'TONELERO'] },
    { title: 'Profesiones de la justicia', words: ['JUEZ', 'ABOGADO', 'NOTARIO', 'FISCAL'] },
  ],
  [
    { title: 'Dulces de Navidad', words: ['TURRÓN', 'POLVORÓN', 'MAZAPÁN', 'ROSCÓN'] },
    { title: 'Quesos', words: ['MANCHEGO', 'BRIE', 'PARMESANO', 'CABRALES'] },
    { title: 'Embutidos', words: ['CHORIZO', 'SALCHICHÓN', 'LOMO', 'FUET'] },
    { title: 'Tipos de pan', words: ['BARRA', 'CHAPATA', 'HOGAZA', 'MOLLETE'] },
  ],
  [
    { title: 'Personajes de cuentos', words: ['CAPERUCITA', 'CENICIENTA', 'BLANCANIEVES', 'PINOCHO'] },
    { title: 'Seres fantásticos', words: ['DRAGÓN', 'UNICORNIO', 'HADA', 'DUENDE'] },
    { title: 'Géneros de cine', words: ['COMEDIA', 'TERROR', 'WESTERN', 'DRAMA'] },
    { title: 'Cosas de un cine', words: ['BUTACA', 'PANTALLA', 'PALOMITAS', 'TAQUILLA'] },
  ],
  [
    { title: 'Colores del arcoíris', words: ['ROJO', 'AMARILLO', 'VERDE', 'AZUL'] },
    { title: 'Notas musicales', words: ['DO', 'RE', 'MI', 'SOL'] },
    { title: 'Astros', words: ['LUNA', 'ESTRELLA', 'ASTEROIDE', 'PLANETA'] },
    { title: 'Juguetes', words: ['PEONZA', 'YOYÓ', 'COMETA', 'MUÑECA'] },
  ],
];

/** Group index of each word, for checking a selection of four. */
export function groupOf(puzzle: Puzzle, word: string): number {
  return puzzle.findIndex((g) => g.words.includes(word));
}
