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
  [
    { title: 'Mamíferos marinos', words: ['DELFÍN', 'BALLENA', 'FOCA', 'MORSA'] },
    { title: 'Cosas de playa', words: ['TOALLA', 'SOMBRILLA', 'CUBO', 'PALA'] },
    { title: 'Ríos de Europa', words: ['DANUBIO', 'SENA', 'RIN', 'TÁMESIS'] },
    { title: '___ de agua', words: ['GOTA', 'VASO', 'BOTELLA', 'PISTOLA'] },
  ],
  [
    { title: 'Instrumentos de viento', words: ['FLAUTA', 'TROMPETA', 'CLARINETE', 'SAXOFÓN'] },
    { title: 'Instrumentos de percusión', words: ['TAMBOR', 'PLATILLOS', 'XILÓFONO', 'CASTAÑUELAS'] },
    { title: 'Instrumentos de cuerda', words: ['VIOLÍN', 'ARPA', 'CHELO', 'BANDURRIA'] },
    { title: 'Partes de una canción', words: ['ESTRIBILLO', 'ESTROFA', 'PUENTE', 'INTRO'] },
  ],
  [
    { title: 'Capitales europeas', words: ['LISBOA', 'BERLÍN', 'VIENA', 'ATENAS'] },
    { title: 'Ciudades andaluzas', words: ['SEVILLA', 'GRANADA', 'CÓRDOBA', 'MÁLAGA'] },
    { title: 'Islas españolas', words: ['MALLORCA', 'TENERIFE', 'IBIZA', 'LANZAROTE'] },
    { title: 'Países de África', words: ['MARRUECOS', 'EGIPTO', 'KENIA', 'NIGERIA'] },
  ],
  [
    { title: 'Verduras', words: ['LECHUGA', 'ZANAHORIA', 'PEPINO', 'CALABACÍN'] },
    { title: 'Legumbres', words: ['LENTEJA', 'GARBANZO', 'ALUBIA', 'GUISANTE'] },
    { title: 'Frutos secos', words: ['NUEZ', 'ALMENDRA', 'AVELLANA', 'PISTACHO'] },
    { title: 'Cereales', words: ['TRIGO', 'CEBADA', 'AVENA', 'MAÍZ'] },
  ],
  [
    { title: 'Partes del ordenador', words: ['TECLADO', 'RATÓN', 'MONITOR', 'ALTAVOZ'] },
    { title: 'Partes de un libro', words: ['PORTADA', 'ÍNDICE', 'CAPÍTULO', 'PRÓLOGO'] },
    { title: 'Cosas de correos', words: ['SELLO', 'SOBRE', 'BUZÓN', 'CARTERO'] },
    { title: 'Signos de puntuación', words: ['COMA', 'PUNTO', 'GUION', 'COMILLAS'] },
  ],
  [
    { title: 'Postres', words: ['FLAN', 'NATILLAS', 'TARTA', 'HELADO'] },
    { title: 'Bebidas calientes', words: ['CAFÉ', 'TÉ', 'CHOCOLATE', 'INFUSIÓN'] },
    { title: 'Salsas', words: ['MAYONESA', 'ALIOLI', 'BECHAMEL', 'KÉTCHUP'] },
    { title: 'Bailes', words: ['SALSA', 'TANGO', 'VALS', 'SEVILLANAS'] },
  ],
  [
    { title: 'Emociones', words: ['ALEGRÍA', 'TRISTEZA', 'MIEDO', 'ENFADO'] },
    { title: 'Sentidos', words: ['VISTA', 'OÍDO', 'OLFATO', 'TACTO'] },
    { title: 'Partes del ojo', words: ['PUPILA', 'IRIS', 'RETINA', 'CÓRNEA'] },
    { title: 'Se pueden perder', words: ['PACIENCIA', 'TIEMPO', 'MEMORIA', 'EQUILIBRIO'] },
  ],
  [
    { title: 'Ropa de verano', words: ['BAÑADOR', 'BIKINI', 'PAREO', 'CHANCLAS'] },
    { title: 'Complementos', words: ['CINTURÓN', 'CORBATA', 'BOLSO', 'GAFAS'] },
    { title: 'Partes de una camisa', words: ['CUELLO', 'MANGA', 'PUÑO', 'BOTÓN'] },
    { title: 'Costura', words: ['AGUJA', 'DEDAL', 'HILO', 'TIJERAS'] },
  ],
  [
    { title: 'Mascotas', words: ['PERRO', 'GATO', 'HÁMSTER', 'PERIQUITO'] },
    { title: 'Animales de la sabana', words: ['JIRAFA', 'CEBRA', 'ÑU', 'HIPOPÓTAMO'] },
    { title: 'Animales del frío', words: ['PINGÜINO', 'RENO', 'ARMIÑO', 'ORCA'] },
    { title: 'Crías de animales', words: ['CACHORRO', 'POTRO', 'TERNERO', 'POLLITO'] },
  ],
  [
    { title: 'Monedas', words: ['EURO', 'DÓLAR', 'YEN', 'PESO'] },
    { title: 'Unidades de longitud', words: ['METRO', 'MILLA', 'PULGADA', 'KILÓMETRO'] },
    { title: 'Unidades de peso', words: ['GRAMO', 'KILO', 'TONELADA', 'LIBRA'] },
    { title: 'Unidades de tiempo', words: ['DÍA', 'SEMANA', 'MES', 'AÑO'] },
  ],
  [
    { title: 'En el cielo', words: ['NUBE', 'ARCOÍRIS', 'RAYO', 'AURORA'] },
    { title: 'Planetas', words: ['JÚPITER', 'NEPTUNO', 'URANO', 'TIERRA'] },
    { title: 'Constelaciones', words: ['ORIÓN', 'OSA MAYOR', 'CASIOPEA', 'PEGASO'] },
    { title: 'Dioses griegos', words: ['ZEUS', 'HERA', 'APOLO', 'ATENEA'] },
  ],
  [
    { title: 'Partes de una casa', words: ['TEJADO', 'CHIMENEA', 'BALCÓN', 'SÓTANO'] },
    { title: 'En el jardín', words: ['CÉSPED', 'MACETA', 'MANGUERA', 'SETO'] },
    { title: 'Herramientas de jardín', words: ['RASTRILLO', 'AZADA', 'PALA', 'CORTACÉSPED'] },
    { title: 'Bichos de jardín', words: ['MARIQUITA', 'CARACOL', 'LOMBRIZ', 'ORUGA'] },
  ],
  [
    { title: 'Deportes de invierno', words: ['ESQUÍ', 'SNOWBOARD', 'PATINAJE', 'TRINEO'] },
    { title: 'Deportes acuáticos', words: ['SURF', 'VELA', 'REMO', 'BUCEO'] },
    { title: 'Material de fútbol', words: ['BALÓN', 'PORTERÍA', 'BOTAS', 'ESPINILLERAS'] },
    { title: 'Posiciones de fútbol', words: ['PORTERO', 'DEFENSA', 'CENTROCAMPISTA', 'DELANTERO'] },
  ],
  [
    { title: 'Enfermedades', words: ['GRIPE', 'RESFRIADO', 'VARICELA', 'SARAMPIÓN'] },
    { title: 'Partes de la pierna', words: ['RODILLA', 'TOBILLO', 'MUSLO', 'TALÓN'] },
    { title: 'Material médico', words: ['ESTETOSCOPIO', 'JERINGUILLA', 'BISTURÍ', 'VENDA'] },
    { title: 'Parientes', words: ['PRIMO', 'SOBRINO', 'CUÑADO', 'SUEGRO'] },
  ],
  [
    { title: 'Comidas del día', words: ['DESAYUNO', 'ALMUERZO', 'MERIENDA', 'CENA'] },
    { title: 'Sabores', words: ['DULCE', 'SALADO', 'AMARGO', 'ÁCIDO'] },
    { title: 'Menaje de cocina', words: ['SARTÉN', 'OLLA', 'CAZO', 'ESPUMADERA'] },
    { title: 'Formas de cocinar', words: ['FREÍR', 'HERVIR', 'ASAR', 'HORNEAR'] },
  ],
  [
    { title: 'Navidad', words: ['BELÉN', 'VILLANCICO', 'ESPUMILLÓN', 'TURRÓN'] },
    { title: 'Fiestas españolas', words: ['SANFERMINES', 'FALLAS', 'FERIA', 'TOMATINA'] },
    { title: 'Disfraces', words: ['PIRATA', 'BRUJA', 'PAYASO', 'VAQUERO'] },
    { title: 'Cosas de cumpleaños', words: ['TARTA', 'VELAS', 'REGALO', 'GLOBOS'] },
  ],
  [
    { title: 'Transporte público', words: ['AUTOBÚS', 'METRO', 'TRANVÍA', 'TAXI'] },
    { title: 'Partes de una bici', words: ['PEDAL', 'SILLÍN', 'MANILLAR', 'CADENA'] },
    { title: 'Conducen algo', words: ['PILOTO', 'CONDUCTOR', 'MAQUINISTA', 'CAPITÁN'] },
    { title: 'En la carretera', words: ['SEMÁFORO', 'ROTONDA', 'ARCÉN', 'PEAJE'] },
  ],
  [
    { title: 'Animales con cuernos', words: ['TORO', 'CIERVO', 'CABRA', 'RINOCERONTE'] },
    { title: 'Animales con caparazón', words: ['TORTUGA', 'CANGREJO', 'ARMADILLO', 'CARACOL'] },
    { title: 'Animales con trompa', words: ['ELEFANTE', 'MOSQUITO', 'MARIPOSA', 'TAPIR'] },
    { title: 'Animales nocturnos', words: ['MURCIÉLAGO', 'LECHUZA', 'BÚHO', 'ZORRO'] },
  ],
  [
    { title: 'Material de oficina', words: ['GRAPADORA', 'CLIP', 'CARPETA', 'ROTULADOR'] },
    { title: 'Muebles de oficina', words: ['ESCRITORIO', 'SILLA', 'ARCHIVADOR', 'ESTANTE'] },
    { title: 'Cosas en un bolso', words: ['LLAVES', 'CARTERA', 'PAÑUELO', 'MÓVIL'] },
    { title: 'Dinero', words: ['BILLETE', 'MONEDA', 'TARJETA', 'CHEQUE'] },
  ],
  [
    { title: 'Palabras esdrújulas', words: ['MÚSICA', 'PÁJARO', 'MÉDICO', 'LÁMPARA'] },
    { title: 'Diminutivos', words: ['CASITA', 'PERRITO', 'ARBOLITO', 'PANECILLO'] },
    { title: 'Aumentativos', words: ['CASONA', 'PERRAZO', 'NARIZOTA', 'CABEZÓN'] },
    { title: 'Riman con «corazón»', words: ['CANCIÓN', 'BALCÓN', 'LIMÓN', 'RATÓN'] },
  ],
];

/** Group index of each word, for checking a selection of four. */
export function groupOf(puzzle: Puzzle, word: string): number {
  return puzzle.findIndex((g) => g.words.includes(word));
}
