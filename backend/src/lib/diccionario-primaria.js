// Diccionario adaptado a la escuela primaria (1.° a 6.° grado).
// Contiene categorías amigables, ejemplos de uso cotidiano y palabras parecidas (sinónimos).

export const CATEGORIAS_INFANTILES = {
  escuela: { emoji: '🏫', etiqueta: 'Escuela y útiles' },
  animal: { emoji: '🐾', etiqueta: 'Animales' },
  naturaleza: { emoji: '🌿', etiqueta: 'Naturaleza y plantas' },
  emoción: { emoji: '💛', etiqueta: 'Emociones y valores' },
  acción: { emoji: '🏃', etiqueta: 'Acción (hacer algo)' },
  objeto: { emoji: '📦', etiqueta: 'Objetos y cosas' },
  comida: { emoji: '🍽️', etiqueta: 'Comidas y sabores' },
  deporte: { emoji: '⚽', etiqueta: 'Deportes y juegos' },
  ciencia: { emoji: '🔬', etiqueta: 'Ciencia y curiosidades' },
  lugar: { emoji: '🗺️', etiqueta: 'Lugares y viajes' },
  cualidad: { emoji: '✨', etiqueta: 'Cómo es algo o alguien' },
  familia: { emoji: '🏡', etiqueta: 'Familia y hogar' },
  tiempo: { emoji: '⏰', etiqueta: 'El tiempo y los días' },
  historia: { emoji: '🇦🇷', etiqueta: 'Historia y nuestro país' },
  cuerpo: { emoji: '🧍', etiqueta: 'El cuerpo humano' },
}

// Vocabulario enriquecido con ejemplos contextuales, sinónimos y categoría pedagógica.
export const detallesPrimaria = {
  // --- Escuela ---
  aula: {
    ejemplo: 'Entramos al aula en fila cuando terminó el recreo.',
    sinonimos: 'salón, clase',
    categoria: 'escuela',
  },
  pizarron: {
    ejemplo: 'La maestra escribió la fecha en el pizarrón con tiza blanca.',
    sinonimos: 'pizarra, tablero',
    categoria: 'escuela',
  },
  tiza: {
    ejemplo: 'Dibujamos una rayuela en el patio usando una tiza de color.',
    sinonimos: 'gis',
    categoria: 'escuela',
  },
  cuaderno: {
    ejemplo: 'Escribí la lista de palabras en mi cuaderno de clase.',
    sinonimos: 'libreta, anotador',
    categoria: 'escuela',
  },
  lapiz: {
    ejemplo: 'Le saqué punta al lápiz para dibujar las hojas del árbol.',
    sinonimos: 'lapicera',
    categoria: 'escuela',
  },
  goma: {
    ejemplo: 'Usé la goma para borrar la letra que me había salido torcida.',
    sinonimos: 'borrador',
    categoria: 'escuela',
  },
  regla: {
    ejemplo: 'Con la regla tracé una línea bien derecha en la hoja.',
    sinonimos: 'escuadra',
    categoria: 'escuela',
  },
  mochila: {
    ejemplo: 'Guardé la cartuchera, la merienda y el cuaderno en la mochila.',
    sinonimos: 'bolso, cartera',
    categoria: 'escuela',
  },
  recreo: {
    ejemplo: 'En el recreo jugamos a la mancha con todos los compañeros.',
    sinonimos: 'descanso, pausa',
    categoria: 'escuela',
  },
  timbre: {
    ejemplo: 'Cuando sonó el timbre supimos que era hora de entrar a clase.',
    sinonimos: 'campana, alarma',
    categoria: 'escuela',
  },
  biblioteca: {
    ejemplo: 'Fuimos a la biblioteca a buscar un libro con fotos del espacio.',
    sinonimos: 'sala de lectura',
    categoria: 'escuela',
  },
  libro: {
    ejemplo: 'Leímos un libro de poesías y adivinanzas muy divertidas.',
    sinonimos: 'tomo, volumen',
    categoria: 'escuela',
  },
  pagina: {
    ejemplo: 'Abrí el libro en la página doce para ver el dibujo del barco.',
    sinonimos: 'hoja, carilla',
    categoria: 'escuela',
  },
  tarea: {
    ejemplo: 'Terminé la tarea de matemáticas antes de salir a jugar.',
    sinonimos: 'deberes, actividad',
    categoria: 'escuela',
  },
  compañero: {
    ejemplo: 'Mi compañero de banco me prestó su lápiz verde.',
    sinonimos: 'amigo, par',
    categoria: 'escuela',
  },
  maestro: {
    ejemplo: 'El maestro nos explicó cómo viaja el agua en las plantas.',
    sinonimos: 'profesor, docente',
    categoria: 'escuela',
  },
  maestra: {
    ejemplo: 'La maestra nos felicitó por el esfuerzo de hoy.',
    sinonimos: 'seño, docente',
    categoria: 'escuela',
  },
  alumno: {
    ejemplo: 'Cada alumno levantó la mano para hacer una pregunta.',
    sinonimos: 'estudiante, chico',
    categoria: 'escuela',
  },
  lectura: {
    ejemplo: 'Hicimos una lectura en voz alta del cuento de la abuela.',
    sinonimos: 'leer',
    categoria: 'escuela',
  },
  palabra: {
    ejemplo: 'Buscamos en el diccionario una palabra que no conocíamos.',
    sinonimos: 'término, vocablo',
    categoria: 'escuela',
  },
  cuento: {
    ejemplo: 'La seño nos leyó un cuento sobre un loro muy travieso.',
    sinonimos: 'historia, relato',
    categoria: 'escuela',
  },
  poesia: {
    ejemplo: 'Recitamos una poesía que rimaba con flores y colores.',
    sinonimos: 'poema, verso',
    categoria: 'escuela',
  },
  dibujo: {
    ejemplo: 'Hice un dibujo con témperas de mi mascota favorita.',
    sinonimos: 'ilustración, pintura',
    categoria: 'escuela',
  },
  utiles: {
    ejemplo: 'Ordené todos los útiles adentro de la cartuchera.',
    sinonimos: 'materiales, herramientas',
    categoria: 'escuela',
  },

  // --- Familia y casa ---
  familia: {
    ejemplo: 'El domingo nos juntamos en familia a comer empanadas.',
    sinonimos: 'parientes, hogar',
    categoria: 'familia',
  },
  abuela: {
    ejemplo: 'Mi abuela me preparó una merienda con tostadas y mermelada.',
    sinonimos: 'nona, abu',
    categoria: 'familia',
  },
  abuelo: {
    ejemplo: 'El abuelo me enseñó a regar las plantas del patio.',
    sinonimos: 'tata, nono',
    categoria: 'familia',
  },
  hermano: {
    ejemplo: 'Juego a la pelota en la vereda con mi hermano mayor.',
    sinonimos: 'hermanito',
    categoria: 'familia',
  },
  casa: {
    ejemplo: 'Volvimos a casa después de un día largo en la escuela.',
    sinonimos: 'hogar, vivienda',
    categoria: 'familia',
  },
  jardin: {
    ejemplo: 'En el jardín florecieron margaritas y rosas de colores.',
    sinonimos: 'parque, patio verde',
    categoria: 'naturaleza',
  },
  ventana: {
    ejemplo: 'El gato miraba los pajaritos a través de la ventana.',
    sinonimos: 'vidriera, ventanal',
    categoria: 'objeto',
  },
  puerta: {
    ejemplo: 'Golpearon la puerta para avisar que había llegado una carta.',
    sinonimos: 'entrada, portón',
    categoria: 'objeto',
  },
  paraguas: {
    ejemplo: 'Lucía abrió su paraguas amarillo para no mojarse con la lluvia.',
    sinonimos: 'sombrilla',
    categoria: 'objeto',
  },
  abrigo: {
    ejemplo: 'Me puse un abrigo abrigado porque soplaba viento frío.',
    sinonimos: 'campera, tapado',
    categoria: 'objeto',
  },

  // --- Animales ---
  gato: {
    ejemplo: 'El gato duerme una siesta calentita al lado de la ventana.',
    sinonimos: 'felino, minino',
    categoria: 'animal',
  },
  perro: {
    ejemplo: 'El perro movió la cola contento cuando su dueño volvió.',
    sinonimos: 'can, pichicho',
    categoria: 'animal',
  },
  pajaro: {
    ejemplo: 'Un pájaro de plumas amarillas se posó sobre la rama.',
    sinonimos: 'ave, pajarito',
    categoria: 'animal',
  },
  loro: {
    ejemplo: 'Pedrito era un loro simpático que aprendió a dar la pata.',
    sinonimos: 'papagayo, cotorra',
    categoria: 'animal',
  },
  jaguar: {
    ejemplo: 'El jaguar se ocultaba entre los árboles con sus ojos brillantes.',
    sinonimos: 'yaguareté, felino',
    categoria: 'animal',
  },
  ballena: {
    ejemplo: 'La ballena gigante nadaba tranquila por las aguas frías.',
    sinonimos: 'cetáceo',
    categoria: 'animal',
  },
  delfin: {
    ejemplo: 'Vimos a un delfín saltar y hacer piruetas en el mar.',
    sinonimos: 'cetáceo',
    categoria: 'animal',
  },
  tortuga: {
    ejemplo: 'La tortuga caminaba sin apuro hacia la sombra de las plantas.',
    sinonimos: 'quelonio',
    categoria: 'animal',
  },
  conejo: {
    ejemplo: 'El conejo blanco comía una zanahoria crujiente.',
    sinonimos: 'conejito',
    categoria: 'animal',
  },
  abeja: {
    ejemplo: 'La abeja zumbaba mientras juntaba polen de una flor.',
    sinonimos: 'insecto',
    categoria: 'animal',
  },
  colmena: {
    ejemplo: 'Las abejas fabrican su miel dulce dentro de la colmena.',
    sinonimos: 'panal',
    categoria: 'animal',
  },
  caballo: {
    ejemplo: 'El caballo trotaba libre por el campo verde.',
    sinonimos: 'corcel, equino',
    categoria: 'animal',
  },
  vaca: {
    ejemplo: 'La vaca comía pasto fresco al lado del alambrado.',
    sinonimos: 'bovino',
    categoria: 'animal',
  },
  leon: {
    ejemplo: 'El león rugió fuerte en la sabana bajo el sol.',
    sinonimos: 'gran felino',
    categoria: 'animal',
  },
  mariposa: {
    ejemplo: 'Una mariposa con alas celestes revoloteaba en el jardín.',
    sinonimos: 'lepidóptero',
    categoria: 'animal',
  },
  garra: {
    ejemplo: 'El felino afilaba sus garras contra el tronco de un sauce.',
    sinonimos: 'uña fuerte',
    categoria: 'animal',
  },
  nido: {
    ejemplo: 'El hornero armó su nido de barro con forma de horno redondo.',
    sinonimos: 'casita de ave',
    categoria: 'animal',
  },

  // --- Naturaleza, clima y huerto ---
  huerto: {
    ejemplo: 'Tomás y su abuela cosecharon tomates jugosos del huerto.',
    sinonimos: 'huerta, quinta',
    categoria: 'naturaleza',
  },
  semilla: {
    ejemplo: 'Pusimos la semilla bajo tierra húmeda para que brote.',
    sinonimos: 'pepita, grano',
    categoria: 'naturaleza',
  },
  sembrar: {
    ejemplo: 'En primavera vamos a sembrar lechuga y zanahoria.',
    sinonimos: 'plantar, cultivar',
    categoria: 'acción',
  },
  cosechar: {
    ejemplo: 'Llegó el verano y pudimos cosechar ricas verduras.',
    sinonimos: 'recolectar, juntar',
    categoria: 'acción',
  },
  regar: {
    ejemplo: 'Hay que regar las plantas a la tardecita para que no se sequen.',
    sinonimos: 'echar agua, humedecer',
    categoria: 'acción',
  },
  remover: {
    ejemplo: 'Primero removió la tierra con la pala para ablandarla.',
    sinonimos: 'mezclar, mover',
    categoria: 'acción',
  },
  arbol: {
    ejemplo: 'El gran árbol nos dio sombra durante la tarde calurosa.',
    sinonimos: 'planta grande',
    categoria: 'naturaleza',
  },
  bosque: {
    ejemplo: 'Caminamos por un sendero rodeado de árboles en el bosque.',
    sinonimos: 'monte, selva',
    categoria: 'naturaleza',
  },
  rio: {
    ejemplo: 'El agua del río corría fresca y cristalina entre las piedras.',
    sinonimos: 'arroyo, corriente',
    categoria: 'naturaleza',
  },
  mar: {
    ejemplo: 'Juntamos caracoles de colores en la orilla del mar.',
    sinonimos: 'océano',
    categoria: 'naturaleza',
  },
  lluvia: {
    ejemplo: 'Las gotas de lluvia golpeaban suavemente contra la ventana.',
    sinonimos: 'llovizna, chaparrón',
    categoria: 'naturaleza',
  },
  arcoiris: {
    ejemplo: 'Después de la tormenta salió el sol y brilló un arcoíris en el cielo.',
    sinonimos: 'arco de colores',
    categoria: 'naturaleza',
  },
  viento: {
    ejemplo: 'El viento mecía las ramas altas de los sauces.',
    sinonimos: 'brisa, aire',
    categoria: 'naturaleza',
  },
  montaña: {
    ejemplo: 'Desde la punta de la montaña se veía todo el valle verde.',
    sinonimos: 'cerro, cumbre',
    categoria: 'naturaleza',
  },
  sol: {
    ejemplo: 'El sol de la mañana nos dio calor y energía para jugar.',
    sinonimos: 'estrella, astro',
    categoria: 'naturaleza',
  },
  luna: {
    ejemplo: 'La luna llena iluminaba el camino durante la noche.',
    sinonimos: 'satélite',
    categoria: 'naturaleza',
  },
  estrella: {
    ejemplo: 'Miramos el cielo oscuro y descubrimos una estrella brillante.',
    sinonimos: 'astro, lucero',
    categoria: 'naturaleza',
  },

  // --- Emociones, valores y cualidades ---
  alegria: {
    ejemplo: 'Sentimos una gran alegría cuando llegó la noticia esperada.',
    sinonimos: 'felicidad, contento',
    categoria: 'emoción',
  },
  paciencia: {
    ejemplo: 'Hay que tener paciencia para esperar que crezcan las plantas.',
    sinonimos: 'calma, tranquilidad',
    categoria: 'emoción',
  },
  valiente: {
    ejemplo: 'Fue muy valiente y se animó a hablar frente a toda la escuela.',
    sinonimos: 'corajudo, animado',
    categoria: 'emoción',
  },
  generoso: {
    ejemplo: 'Lucía fue generosa y compartió su paraguas con un compañero.',
    sinonimos: 'solidario, bondadoso',
    categoria: 'emoción',
  },
  amable: {
    ejemplo: 'Es una persona muy amable que siempre ayuda a quien lo necesita.',
    sinonimos: 'bueno, cordial',
    categoria: 'emoción',
  },
  amistad: {
    ejemplo: 'Cuidar la amistad es compartir juegos, risas y secretos.',
    sinonimos: 'cariño, compañerismo',
    categoria: 'emoción',
  },
  amigo: {
    ejemplo: 'Compartí mis lápices de colores con mi amigo preferido.',
    sinonimos: 'compañero, compinche',
    categoria: 'emoción',
  },
  astuto: {
    ejemplo: 'El zorro astuto encontró el camino más rápido para cruzar.',
    sinonimos: 'pillo, despierto',
    categoria: 'cualidad',
  },
  curioso: {
    ejemplo: 'El chico curioso quería saber cómo funciona un cohete.',
    sinonimos: 'inquieto, preguntón',
    categoria: 'cualidad',
  },
  esfuerzo: {
    ejemplo: 'Con esfuerzo y práctica logró terminar el rompecabezas difícil.',
    sinonimos: 'empeño, dedicación',
    categoria: 'emoción',
  },
  manso: {
    ejemplo: 'El loro era tan manso que comía pan mojado de la mano.',
    sinonimos: 'tranquilo, dócil',
    categoria: 'cualidad',
  },
  centinela: {
    ejemplo: 'El loro vigilaba desde la rama como un centinela atento.',
    sinonimos: 'vigía, guardián',
    categoria: 'cualidad',
  },
  quieto: {
    ejemplo: 'El gato se quedó quieto mirando al pajarito sin moverse.',
    sinonimos: 'inmóvil, sereno',
    categoria: 'cualidad',
  },
  veloz: {
    ejemplo: 'El leopardo es un animal muy veloz cuando corre.',
    sinonimos: 'rápido, ágil',
    categoria: 'cualidad',
  },
  enorme: {
    ejemplo: 'El elefante tiene un tamaño enorme comparado con otros animales.',
    sinonimos: 'gigante, inmenso',
    categoria: 'cualidad',
  },
  diminuto: {
    ejemplo: 'La hormiga cargaba una hojita con su cuerpo diminuto.',
    sinonimos: 'chiquito, pequeñito',
    categoria: 'cualidad',
  },

  // --- Ciencia, tecnología y objetos ---
  brujula: {
    ejemplo: 'Los exploradores usaron la brújula para orientarse en el bosque.',
    sinonimos: 'orientador',
    categoria: 'objeto',
  },
  telescopio: {
    ejemplo: 'Con el telescopio pudimos ver los cráteres redondos de la Luna.',
    sinonimos: 'visor astronómico',
    categoria: 'ciencia',
  },
  microscopio: {
    ejemplo: 'Pusimos una gota de agua bajo el microscopio y vimos bichitos.',
    sinonimos: 'lente de aumento',
    categoria: 'ciencia',
  },
  dinosaurio: {
    ejemplo: 'En el museo descubrimos los fósiles gigantes de un dinosaurio.',
    sinonimos: 'reptil prehistórico',
    categoria: 'ciencia',
  },
  fosil: {
    ejemplo: 'El paleontólogo desenterró un fósil de caracol antiquísimo.',
    sinonimos: 'resto petrificado',
    categoria: 'ciencia',
  },
  experimento: {
    ejemplo: 'Hicimos un experimento en clase para ver cómo flota el hielo.',
    sinonimos: 'prueba, ensayo',
    categoria: 'ciencia',
  },
  energia: {
    ejemplo: 'El sol nos da luz y energía para que crezcan las plantas.',
    sinonimos: 'fuerza, poder',
    categoria: 'ciencia',
  },
  iman: {
    ejemplo: 'El imán atrajo los clips de metal que estaban en la mesa.',
    sinonimos: 'magneto',
    categoria: 'objeto',
  },

  // --- Deportes y juegos ---
  pelota: {
    ejemplo: 'Pateó la pelota con fuerza y metió un golazo en el ángulo.',
    sinonimos: 'balón, esférico',
    categoria: 'deporte',
  },
  gol: {
    ejemplo: 'Toda la hinchada festejó el gol cantando de alegría.',
    sinonimos: 'tanto, anotación',
    categoria: 'deporte',
  },
  arquero: {
    ejemplo: 'El arquero atajó el penal en el último minuto del partido.',
    sinonimos: 'guardameta, portero',
    categoria: 'deporte',
  },
  campeon: {
    ejemplo: 'El equipo levantó la copa muy feliz al salir campeón.',
    sinonimos: 'ganador, vencedor',
    categoria: 'deporte',
  },
  capitan: {
    ejemplo: 'El capitán alentó a todos los compañeros dentro de la cancha.',
    sinonimos: 'líder, guía',
    categoria: 'deporte',
  },

  // --- Comida ---
  ensalada: {
    ejemplo: 'Preparamos una ensalada fresca con verduras de la huerta.',
    sinonimos: 'plato de verduras',
    categoria: 'comida',
  },
  tomate: {
    ejemplo: 'Cortamos el tomate maduro en rodajas para el almuerzo.',
    sinonimos: 'fruto rojo',
    categoria: 'comida',
  },
  lechuga: {
    ejemplo: 'Lavamos bien las hojas verdes de la lechuga antes de comerlas.',
    sinonimos: 'hortaliza',
    categoria: 'comida',
  },
  zanahoria: {
    ejemplo: 'La zanahoria crujiente creció bajo la tierra del huerto.',
    sinonimos: 'verdura naranja',
    categoria: 'comida',
  },
  choclo: {
    ejemplo: 'Comimos un choclo calentito con un poquito de sal.',
    sinonimos: 'maíz, mazorca',
    categoria: 'comida',
  },
  miel: {
    ejemplo: 'Le pusimos una cucharada de miel dulce a la tostada.',
    sinonimos: 'néctar',
    categoria: 'comida',
  },
  pan: {
    ejemplo: 'En la panadería compramos pan recién salido del horno.',
    sinonimos: 'pancito, hogaza',
    categoria: 'comida',
  },
  alfajor: {
    ejemplo: 'En el recreo compartimos un alfajor relleno de dulce de leche.',
    sinonimos: 'golosina',
    categoria: 'comida',
  },

  // --- El cuerpo humano ---
  cuerpo: {
    ejemplo: 'Hacemos ejercicio y jugamos para mantener fuerte y sano todo el cuerpo.',
    sinonimos: 'organismo, figura',
    categoria: 'cuerpo',
  },
  cabeza: {
    ejemplo: 'Se puso una gorra azul en la cabeza para protegerse del sol.',
    sinonimos: 'cráneo',
    categoria: 'cuerpo',
  },
  cara: {
    ejemplo: 'Tenía una gran sonrisa dibujada en la cara al ver a sus amigos.',
    sinonimos: 'rostro, semblante',
    categoria: 'cuerpo',
  },
  ojo: {
    ejemplo: 'Abrió bien los ojos para ver los hermosos colores del arcoíris.',
    sinonimos: 'vista, mirada',
    categoria: 'cuerpo',
  },
  nariz: {
    ejemplo: 'Sintió el rico aroma de las flores del jardín con la nariz.',
    sinonimos: 'olfato',
    categoria: 'cuerpo',
  },
  oreja: {
    ejemplo: 'Puso atención con sus orejas para escuchar el canto del pajarito.',
    sinonimos: 'oído',
    categoria: 'cuerpo',
  },
  lengua: {
    ejemplo: 'Probó el helado de frutilla con la lengua para saborearlo bien.',
    sinonimos: 'papila',
    categoria: 'cuerpo',
  },
  cuello: {
    ejemplo: 'Se abrigó el cuello con una bufanda de lana en los días de frío.',
    sinonimos: 'garganta',
    categoria: 'cuerpo',
  },
  hombro: {
    ejemplo: 'Llevaba una mochila liviana apoyada sobre el hombro.',
    sinonimos: 'omóplato',
    categoria: 'cuerpo',
  },
  brazo: {
    ejemplo: 'Abrió los brazos para darle un abrazo enorme y cariñoso a su abuela.',
    sinonimos: 'extremidad',
    categoria: 'cuerpo',
  },
  codo: {
    ejemplo: 'Apoyó el codo en la mesa mientras leía su cuento preferido.',
    sinonimos: 'articulación',
    categoria: 'cuerpo',
  },
  mano: {
    ejemplo: 'Saludó levantando la mano con una gran sonrisa.',
    sinonimos: 'palma',
    categoria: 'cuerpo',
  },
  dedo: {
    ejemplo: 'Señaló la estrella más brillante de la noche con el dedo.',
    sinonimos: 'falange',
    categoria: 'cuerpo',
  },
  uña: {
    ejemplo: 'Mantuvo las uñas de las manos limpias y cortitas.',
    sinonimos: 'garra',
    categoria: 'cuerpo',
  },
  pecho: {
    ejemplo: 'Respiró hondo llenando el pecho de aire puro y fresco.',
    sinonimos: 'tórax',
    categoria: 'cuerpo',
  },
  panza: {
    ejemplo: 'Se acarició la panza feliz después de una rica merienda.',
    sinonimos: 'vientre, pancita',
    categoria: 'cuerpo',
  },
  espalda: {
    ejemplo: 'Se sentó bien derecho apoyando la espalda en el respaldo de la silla.',
    sinonimos: 'dorso',
    categoria: 'cuerpo',
  },
  pierna: {
    ejemplo: 'Corrió con sus piernas tan rápido como pudo hasta cruzar la meta.',
    sinonimos: 'extremidad',
    categoria: 'cuerpo',
  },
  rodilla: {
    ejemplo: 'Se puso rodilleras para protegerse las rodillas al andar en patines.',
    sinonimos: 'articulación',
    categoria: 'cuerpo',
  },
  pie: {
    ejemplo: 'Pateó la pelota con el pie derecho directo hacia el arco.',
    sinonimos: 'pisada',
    categoria: 'cuerpo',
  },
  corazon: {
    ejemplo: 'Sintió los latidos rápidos y fuertes de su corazón al terminar de correr.',
    sinonimos: 'pecho',
    categoria: 'cuerpo',
  },
  cerebro: {
    ejemplo: 'Usamos el cerebro para pensar, imaginar historias y resolver problemas.',
    sinonimos: 'mente',
    categoria: 'cuerpo',
  },
  hueso: {
    ejemplo: 'Los huesos forman el esqueleto que sostiene nuestro cuerpo.',
    sinonimos: 'esqueleto',
    categoria: 'cuerpo',
  },
  musculo: {
    ejemplo: 'Hizo ejercicios para estirar los músculos antes de jugar al fútbol.',
    sinonimos: 'fuerza',
    categoria: 'cuerpo',
  },
  piel: {
    ejemplo: 'Nos ponemos protector solar para cuidar la piel los días de sol.',
    sinonimos: 'cutis',
    categoria: 'cuerpo',
  },
  sangre: {
    ejemplo: 'El corazón bombea la sangre para llevar energía a todo el cuerpo.',
    sinonimos: 'plasma',
    categoria: 'cuerpo',
  },

  // --- Acciones de textos ---
  posarse: {
    ejemplo: 'El pajarito se posó despacito sobre la rama de un árbol.',
    sinonimos: 'pararse, apoyarse',
    categoria: 'acción',
  },
  cubrir: {
    ejemplo: 'Lucía cubrió a su compañero de la lluvia con el paraguas.',
    sinonimos: 'tapar, proteger',
    categoria: 'acción',
  },
  esquivar: {
    ejemplo: 'El nene pudo esquivar el charco de un solo salto.',
    sinonimos: 'eludir, esquivar',
    categoria: 'acción',
  },
  saltar: {
    ejemplo: 'Manchas quiso saltar a la ventana pero estaba cerrada.',
    sinonimos: 'brincar',
    categoria: 'acción',
  },
  volar: {
    ejemplo: 'El cóndor vuela alto sobre las montañas nevadas.',
    sinonimos: 'planear',
    categoria: 'acción',
  },
  nadar: {
    ejemplo: 'Los peces saben nadar rápido usando sus aletas.',
    sinonimos: 'bucear',
    categoria: 'acción',
  },
}

// Infiere o genera un detalle amigable para cualquier palabra que no tenga entrada manual.
export function inferirDetalle(palabra, significado = '') {
  const norm = palabra.trim().toLowerCase()
  const sig = significado.toLowerCase()

  // Determinar categoría por significado o terminación
  let categoria = 'objeto'
  if (sig.includes('animal') || sig.includes('ave') || sig.includes('insecto') || sig.includes('pez')) {
    categoria = 'animal'
  } else if (
    sig.includes('cuerpo') ||
    sig.includes('órgano') ||
    sig.includes('hueso') ||
    sig.includes('músculo') ||
    sig.includes('miembro del cuerpo') ||
    sig.includes('cabeza') ||
    sig.includes('brazo') ||
    sig.includes('pierna')
  ) {
    categoria = 'cuerpo'
  } else if (
    sig.includes('escuela') ||
    sig.includes('escribe') ||
    sig.includes('clase') ||
    sig.includes('hoja')
  ) {
    categoria = 'escuela'
  } else if (
    sig.includes('planta') ||
    sig.includes('árbol') ||
    sig.includes('flor') ||
    sig.includes('tierra') ||
    sig.includes('agua')
  ) {
    categoria = 'naturaleza'
  } else if (
    sig.includes('sentimiento') ||
    sig.includes('persona que') ||
    sig.includes('siente') ||
    sig.includes('alegr')
  ) {
    categoria = 'emoción'
  } else if (
    sig.includes('comida') ||
    sig.includes('fruta') ||
    sig.includes('verdura') ||
    sig.includes('alimento') ||
    sig.includes('postre') ||
    sig.includes('plato típico') ||
    sig.includes('bebida')
  ) {
    categoria = 'comida'
  } else if (
    sig.includes('deporte') ||
    sig.includes('partido') ||
    sig.includes('juego') ||
    sig.includes('pelota')
  ) {
    categoria = 'deporte'
  } else if (sig.includes('acción') || norm.endsWith('ar') || norm.endsWith('er') || norm.endsWith('ir')) {
    categoria = 'acción'
  } else if (
    sig.includes('máquina') ||
    sig.includes('aparato') ||
    sig.includes('ciencia') ||
    sig.includes('fuerza')
  ) {
    categoria = 'ciencia'
  } else if (
    sig.includes('lugar') ||
    sig.includes('ciudad') ||
    sig.includes('país') ||
    sig.includes('camino')
  ) {
    categoria = 'lugar'
  } else if (sig.includes('que es') || sig.includes('muy')) {
    categoria = 'cualidad'
  }

  // Generar un ejemplo contextual amigable para chicos de primaria
  let ejemplo = null
  if (categoria === 'cuerpo') {
    ejemplo = `Cuidamos la salud de todo nuestro cuerpo con buenos hábitos cada día.`
  } else if (categoria === 'acción') {
    ejemplo = `En la escuela aprendemos a ${palabra} todos juntos.`
  } else if (categoria === 'animal') {
    ejemplo = `Vimos un ${palabra} en un libro de cuentos ilustrado.`
  } else if (categoria === 'naturaleza') {
    ejemplo = `En el parque pudimos observar de cerca el ${palabra}.`
  } else if (categoria === 'escuela') {
    ejemplo = `Usamos ${palabra} en la clase con la maestra.`
  } else if (categoria === 'comida') {
    ejemplo = `En la merienda disfrutamos de ${palabra} en familia.`
  } else if (categoria === 'emoción') {
    ejemplo = `Sentimos mucha ${palabra} al terminar la actividad.`
  }

  return { ejemplo, sinonimos: null, categoria }
}
