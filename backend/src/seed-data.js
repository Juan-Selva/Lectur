// Contenido precargado: textos de primer ciclo con preguntas y definiciones simples.
export const textos = [
  {
    titulo: 'El gato Manchas',
    nivel: 'facil',
    cuerpo:
      'Manchas es un gato blanco con una mancha negra en la cola. Todas las mañanas se sienta en la ventana y mira a los pájaros. Un día, un pájaro se posó cerca. Manchas quiso saltar, pero el vidrio estaba cerrado. Se quedó quieto y movió la cola.',
    preguntas: [
      {
        tipo: 'literal',
        enunciado: '¿De qué color es la mancha de Manchas?',
        opciones: ['Negra', 'Marrón', 'Gris'],
        correcta: 0,
      },
      {
        tipo: 'literal',
        enunciado: '¿Dónde se sienta Manchas por las mañanas?',
        opciones: ['En la cama', 'En la ventana', 'En el jardín'],
        correcta: 1,
      },
      {
        tipo: 'inferencial',
        enunciado: '¿Por qué Manchas no pudo saltar?',
        opciones: ['Tenía sueño', 'El vidrio estaba cerrado', 'No vio al pájaro'],
        correcta: 1,
      },
    ],
  },
  {
    titulo: 'La lluvia de la tarde',
    nivel: 'intermedio',
    cuerpo:
      'Lucía salió de la escuela con su paraguas amarillo. El cielo estaba gris y el viento movía las hojas de los árboles. A mitad de camino empezó a llover fuerte. Lucía abrió el paraguas y vio a un nene que corría sin abrigo. Sin pensarlo, lo cubrió y caminaron juntos hasta su casa. Cuando llegaron, el nene sonrió y le dijo gracias.',
    preguntas: [
      {
        tipo: 'literal',
        enunciado: '¿De qué color era el paraguas de Lucía?',
        opciones: ['Rojo', 'Amarillo', 'Azul'],
        correcta: 1,
      },
      {
        tipo: 'literal',
        enunciado: '¿A quién vio Lucía corriendo?',
        opciones: ['A un perro', 'A su maestra', 'A un nene sin abrigo'],
        correcta: 2,
      },
      {
        tipo: 'inferencial',
        enunciado: '¿Cómo es Lucía?',
        opciones: ['Generosa', 'Distraída', 'Miedosa'],
        correcta: 0,
      },
      {
        tipo: 'inferencial',
        enunciado: '¿Por qué el nene dijo gracias?',
        opciones: ['Lucía le regaló el paraguas', 'Lucía lo cubrió de la lluvia', 'Lucía le prestó un libro'],
        correcta: 1,
      },
    ],
  },
  {
    titulo: 'El huerto de la abuela',
    nivel: 'dificil',
    cuerpo:
      'Cada primavera, la abuela de Tomás preparaba la tierra del huerto con paciencia. Primero removía el suelo, después sembraba semillas de tomate, lechuga y zanahoria. Tomás la ayudaba a regar con una lata agujereada. Aunque las plantas tardaban semanas en crecer, la abuela decía que lo importante era no apurarse. En verano, cuando el huerto estaba lleno, preparaban una ensalada con todo lo que habían cosechado y la compartían con los vecinos.',
    preguntas: [
      {
        tipo: 'literal',
        enunciado: '¿Qué semillas sembraba la abuela?',
        opciones: ['Tomate, lechuga y zanahoria', 'Maíz y papa', 'Frutilla y zapallo'],
        correcta: 0,
      },
      {
        tipo: 'literal',
        enunciado: '¿Con qué regaba Tomás?',
        opciones: ['Con una manguera', 'Con una lata agujereada', 'Con un balde grande'],
        correcta: 1,
      },
      {
        tipo: 'inferencial',
        enunciado: '¿Qué quiso enseñarle la abuela a Tomás cuando dijo que no había que apurarse?',
        opciones: ['Que hay que tener paciencia', 'Que las plantas no crecen', 'Que el verano es largo'],
        correcta: 0,
      },
      {
        tipo: 'inferencial',
        enunciado: '¿Por qué compartían la ensalada con los vecinos?',
        opciones: ['Porque no les gustaba', 'Porque eran generosos', 'Porque sobraba poca'],
        correcta: 1,
      },
    ],
  },
]

export const definiciones = [
  ['paraguas', 'Objeto que se abre sobre la cabeza para no mojarse cuando llueve.'],
  ['huerto', 'Lugar donde se plantan verduras y frutas para comer.'],
  ['sembrar', 'Poner semillas en la tierra para que crezcan plantas.'],
  ['cosechar', 'Juntar las verduras o frutas cuando ya están maduras.'],
  ['paciencia', 'Saber esperar con calma, sin enojarse ni apurarse.'],
  ['generoso', 'Persona que comparte lo que tiene con los demás.'],
  ['vecino', 'Persona que vive cerca de nuestra casa.'],
  ['ventana', 'Abertura de una pared por donde entra la luz y se puede mirar afuera.'],
  ['cola', 'Parte de atrás del cuerpo de algunos animales, como el gato o el perro.'],
  ['regar', 'Echar agua a las plantas para que no se sequen.'],
  ['abrigo', 'Prenda de ropa que nos protege del frío.'],
  ['quieto', 'Que no se mueve.'],
]
