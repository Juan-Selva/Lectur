// Contenido precargado: textos de primer ciclo con preguntas.
// `vocabulario`: palabras del texto que un chico podría no conocer; todas tienen que estar en el diccionario propio
// (src/diccionario-data.js), y un test lo verifica.
export const textos = [
  {
    titulo: 'El gato Manchas',
    vocabulario: ['mancha', 'posarse', 'vidrio', 'cola', 'ventana', 'quieto'],
    nivel: 'facil',
    categoria: 'ficcion',
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
    vocabulario: ['paraguas', 'abrigo', 'cubrir', 'viento', 'generoso'],
    nivel: 'intermedio',
    categoria: 'ficcion',
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
    vocabulario: [
      'huerto',
      'sembrar',
      'cosechar',
      'regar',
      'semilla',
      'paciencia',
      'vecino',
      'remover',
      'lata',
      'ensalada',
      'lechuga',
      'tomate',
      'zanahoria',
      'primavera',
    ],
    nivel: 'dificil',
    categoria: 'naturaleza',
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
  {
    titulo: 'Lionel Messi, el chico que amaba el fútbol',
    vocabulario: ['selección', 'barrio', 'festejar', 'famoso', 'club', 'equipo'],
    nivel: 'intermedio',
    categoria: 'biografia',
    cuerpo:
      'Lionel Messi nació en Rosario, una ciudad de Argentina, en 1987. Desde muy chiquito jugaba a la pelota con su familia y sus amigos. A los cinco años empezó a jugar en un club de su barrio. A los trece años se fue a vivir a Barcelona, en España, para jugar en un equipo muy importante. Allí practicó muchísimo y se hizo famoso en todo el mundo. En 2022, Messi y la selección argentina ganaron la Copa del Mundo. Mucha gente salió a festejar a las calles.',
    preguntas: [
      {
        tipo: 'literal',
        enunciado: '¿En qué ciudad nació Messi?',
        opciones: ['En Buenos Aires', 'En Rosario', 'En Barcelona'],
        correcta: 1,
      },
      {
        tipo: 'literal',
        enunciado: '¿En qué año ganó la Copa del Mundo con la selección argentina?',
        opciones: ['1987', '2010', '2022'],
        correcta: 2,
      },
      {
        tipo: 'inferencial',
        enunciado: '¿Por qué Messi se hizo famoso en todo el mundo?',
        opciones: [
          'Porque practicó mucho y jugó muy bien',
          'Porque vivía en España',
          'Porque tenía un club propio',
        ],
        correcta: 0,
      },
      {
        tipo: 'inferencial',
        enunciado: '¿Cómo se sintió la gente cuando Argentina ganó?',
        opciones: ['Triste', 'Contenta', 'Enojada'],
        correcta: 1,
      },
    ],
  },
  {
    titulo: 'Manuel Belgrano y la bandera',
    vocabulario: ['ejército', 'bandera', 'izar', 'orilla'],
    nivel: 'dificil',
    categoria: 'biografia',
    cuerpo:
      'Manuel Belgrano fue un hombre muy importante en la historia de nuestro país. Nació en Buenos Aires en 1770. Estudió mucho y se preocupaba porque todos los chicos pudieran ir a la escuela. En 1812 creó una bandera celeste y blanca para que la usara el ejército. La bandera se izó por primera vez en la ciudad de Rosario, a orillas del río Paraná. Hoy la recordamos cada 20 de junio, el Día de la Bandera.',
    preguntas: [
      {
        tipo: 'literal',
        enunciado: '¿Dónde nació Manuel Belgrano?',
        opciones: ['En Buenos Aires', 'En Rosario', 'En Córdoba'],
        correcta: 0,
      },
      {
        tipo: 'literal',
        enunciado: '¿De qué colores es la bandera que creó?',
        opciones: ['Roja y blanca', 'Celeste y blanca', 'Azul y amarilla'],
        correcta: 1,
      },
      {
        tipo: 'inferencial',
        enunciado: '¿Cómo sabemos que a Belgrano le importaba la educación?',
        opciones: [
          'Porque quería que todos los chicos fueran a la escuela',
          'Porque nació en 1770',
          'Porque vivía cerca del río',
        ],
        correcta: 0,
      },
      {
        tipo: 'inferencial',
        enunciado: '¿Por qué el 20 de junio es el Día de la Bandera?',
        opciones: [
          'Porque ese día se recuerda a Belgrano y su bandera',
          'Porque ese día llueve',
          'Porque ese día empiezan las clases',
        ],
        correcta: 0,
      },
    ],
  },
  {
    titulo: 'El 25 de mayo de 1810',
    vocabulario: ['cabildo', 'gobierno', 'junta', 'patria'],
    nivel: 'intermedio',
    categoria: 'historia',
    cuerpo:
      'El 25 de mayo de 1810 mucha gente se juntó frente al Cabildo, en Buenos Aires. Querían tener un gobierno propio, formado por personas de estas tierras. Ese día se formó la Primera Junta. Cada 25 de mayo recordamos ese momento como el comienzo del camino hacia nuestro país libre.',
    preguntas: [
      {
        tipo: 'literal',
        enunciado: '¿Frente a qué edificio se juntó la gente?',
        opciones: ['Frente a la escuela', 'Frente al Cabildo', 'Frente al puerto'],
        correcta: 1,
      },
      {
        tipo: 'literal',
        enunciado: '¿Qué gobierno se formó ese día?',
        opciones: ['La Primera Junta', 'El Congreso', 'El Senado'],
        correcta: 0,
      },
      {
        tipo: 'inferencial',
        enunciado: '¿Por qué se juntó la gente?',
        opciones: [
          'Para ver un desfile',
          'Para decidir quién los iba a gobernar',
          'Para festejar un cumpleaños',
        ],
        correcta: 1,
      },
      {
        tipo: 'inferencial',
        enunciado: '¿Por qué recordamos cada año el 25 de mayo?',
        opciones: [
          'Porque es el comienzo del camino hacia un país libre',
          'Porque es el día más largo',
          'Porque no hay clases',
        ],
        correcta: 0,
      },
    ],
  },
  {
    titulo: 'El recreo de fútbol',
    vocabulario: ['desventaja', 'mudarse', 'timbre', 'cancha', 'aplaudir', 'gol', 'equipo'],
    nivel: 'facil',
    categoria: 'deporte',
    cuerpo:
      'En el recreo, Tomás y sus amigos juegan al fútbol en el patio. Hoy faltaba un jugador y el equipo de Tomás estaba en desventaja. Entonces llegó Sofía, que recién se había mudado. Tomás la invitó a jugar. Sofía corrió muy rápido e hizo dos goles. Cuando sonó el timbre, todos aplaudieron y la invitaron a jugar mañana.',
    preguntas: [
      {
        tipo: 'literal',
        enunciado: '¿Dónde juegan al fútbol?',
        opciones: ['En el patio', 'En la plaza', 'En el aula'],
        correcta: 0,
      },
      {
        tipo: 'literal',
        enunciado: '¿Cuántos goles hizo Sofía?',
        opciones: ['Uno', 'Dos', 'Tres'],
        correcta: 1,
      },
      {
        tipo: 'inferencial',
        enunciado: '¿Por qué invitaron a Sofía a jugar mañana?',
        opciones: ['Porque jugó muy bien', 'Porque era la maestra', 'Porque tenía la pelota'],
        correcta: 0,
      },
      {
        tipo: 'inferencial',
        enunciado: '¿Cómo se habrá sentido Sofía al final?',
        opciones: ['Contenta', 'Aburrida', 'Enojada'],
        correcta: 0,
      },
    ],
  },
  {
    titulo: 'El viaje del agua',
    vocabulario: ['vapor', 'nube', 'ciclo', 'río', 'mar', 'lluvia'],
    nivel: 'intermedio',
    categoria: 'ciencia',
    cuerpo:
      'El sol calienta el agua del mar y la hace subir al cielo en forma de vapor. Arriba hace frío y el vapor se junta formando las nubes. Cuando las nubes están muy llenas, el agua cae como lluvia. La lluvia llena los ríos y los ríos vuelven al mar. Así, el agua da vueltas una y otra vez.',
    preguntas: [
      {
        tipo: 'literal',
        enunciado: '¿Qué calienta el agua del mar?',
        opciones: ['El viento', 'El sol', 'La luna'],
        correcta: 1,
      },
      {
        tipo: 'literal',
        enunciado: '¿Qué se forma cuando el vapor se junta arriba?',
        opciones: ['Nubes', 'Ríos', 'Piedras'],
        correcta: 0,
      },
      {
        tipo: 'inferencial',
        enunciado: '¿Por qué se dice que el agua "da vueltas"?',
        opciones: [
          'Porque baila',
          'Porque siempre vuelve a empezar el mismo recorrido',
          'Porque se queda quieta',
        ],
        correcta: 1,
      },
      {
        tipo: 'inferencial',
        enunciado: 'Si no hubiera sol, ¿qué pasaría con el agua del mar?',
        opciones: ['No subiría vapor para formar nubes', 'Se haría más salada', 'Se convertiría en lluvia'],
        correcta: 0,
      },
    ],
  },
  {
    titulo: 'Diego Maradona, el pibe de Villa Fiorito',
    vocabulario: ['humilde', 'barrio', 'debutar', 'capitán', 'gambetear', 'rival', 'habilidad', 'club'],
    nivel: 'intermedio',
    categoria: 'biografia',
    cuerpo:
      'Diego Maradona nació en 1960 y creció en Villa Fiorito, un barrio humilde del sur del Gran Buenos Aires. De chico jugaba a la pelota todo el día. A los quince años debutó en Argentinos Juniors, un club de Buenos Aires. Más tarde jugó en Boca y en el Napoli, de Italia. En 1986, como capitán de la selección argentina, ganó la Copa del Mundo en México. Muchos lo recuerdan por su habilidad para gambetear a los rivales.',
    preguntas: [
      {
        tipo: 'literal',
        enunciado: '¿En qué barrio creció Maradona?',
        opciones: ['En Villa Fiorito', 'En Palermo', 'En La Boca'],
        correcta: 0,
      },
      {
        tipo: 'literal',
        enunciado: '¿En qué año ganó la Copa del Mundo con la selección?',
        opciones: ['1978', '1986', '2022'],
        correcta: 1,
      },
      {
        tipo: 'inferencial',
        enunciado: '¿Por qué Maradona llegó a ser tan bueno?',
        opciones: [
          'Porque jugaba a la pelota todo el día desde chico',
          'Porque nunca jugó en equipos',
          'Porque vivía en Italia',
        ],
        correcta: 0,
      },
      {
        tipo: 'inferencial',
        enunciado: '¿Qué quiere decir que era el capitán de la selección?',
        opciones: ['Que era el arquero', 'Que era el líder del equipo', 'Que era el entrenador'],
        correcta: 1,
      },
    ],
  },
  {
    titulo: 'Mario Kempes, el goleador del Mundial 78',
    vocabulario: ['provincia', 'goleador', 'torneo', 'campeón', 'mundial', 'apodo'],
    nivel: 'intermedio',
    categoria: 'biografia',
    cuerpo:
      'Mario Kempes nació en Bell Ville, un pueblo de la provincia de Córdoba. Empezó a jugar en un club de su zona y después viajó a jugar a España. En 1978 la Copa del Mundo se jugó en la Argentina. Kempes hizo seis goles y fue el máximo goleador del torneo. Además, la selección argentina fue campeona por primera vez. Por su pelo largo y su velocidad, lo llamaban el Matador.',
    preguntas: [
      {
        tipo: 'literal',
        enunciado: '¿En qué provincia nació Kempes?',
        opciones: ['Córdoba', 'Santa Fe', 'Mendoza'],
        correcta: 0,
      },
      {
        tipo: 'literal',
        enunciado: '¿Cuántos goles hizo en el Mundial de 1978?',
        opciones: ['Dos', 'Seis', 'Diez'],
        correcta: 1,
      },
      {
        tipo: 'inferencial',
        enunciado: '¿Qué significa que fue el máximo goleador?',
        opciones: [
          'Que hizo más goles que todos los demás',
          'Que corrió más rápido',
          'Que atajó más pelotas',
        ],
        correcta: 0,
      },
      {
        tipo: 'inferencial',
        enunciado: '¿Por qué fue un Mundial muy especial para los argentinos?',
        opciones: [
          'Porque se jugó en el país y la selección salió campeona',
          'Porque no hubo goles',
          'Porque lo jugaron solo los chicos',
        ],
        correcta: 0,
      },
    ],
  },
  {
    titulo: 'El Dibu Martínez, el arquero campeón',
    vocabulario: ['arquero', 'penal', 'campeonato', 'atajar'],
    nivel: 'intermedio',
    categoria: 'biografia',
    cuerpo:
      'Emiliano Martínez, al que todos llaman el Dibu, nació en Mar del Plata en 1992. Es arquero y juega atajando los tiros de los rivales. Se fue a jugar a Inglaterra cuando era joven y trabajó mucho para tener su lugar en el equipo. En la final de la Copa del Mundo de 2022 atajó un penal muy importante. Gracias a eso, Argentina ganó el campeonato. Después de ese partido, muchos chicos soñaron con ser arqueros.',
    preguntas: [
      {
        tipo: 'literal',
        enunciado: '¿En qué ciudad nació el Dibu Martínez?',
        opciones: ['En Rosario', 'En Mar del Plata', 'En Córdoba'],
        correcta: 1,
      },
      {
        tipo: 'literal',
        enunciado: '¿Qué hace un arquero?',
        opciones: ['Ataja los tiros de los rivales', 'Hace los goles', 'Arma las jugadas'],
        correcta: 0,
      },
      {
        tipo: 'inferencial',
        enunciado: '¿Cómo logró tener su lugar en el equipo?',
        opciones: ['Trabajando mucho', 'Sin esforzarse', 'Cambiando de país todos los años'],
        correcta: 0,
      },
      {
        tipo: 'inferencial',
        enunciado: '¿Por qué muchos chicos soñaron con ser arqueros?',
        opciones: [
          'Porque vieron que un arquero puede ser un héroe',
          'Porque era más fácil',
          'Porque no tenían que correr',
        ],
        correcta: 0,
      },
    ],
  },
  {
    titulo: 'Ángel Di María, el fideo de Rosario',
    vocabulario: ['medalla', 'olímpico', 'apodo', 'habilidad'],
    nivel: 'dificil',
    categoria: 'biografia',
    cuerpo:
      'Ángel Di María nació en Rosario en 1988 y empezó a jugar en Rosario Central. Es muy rápido y tiene una gran habilidad con la pelota. En 2008 ganó la medalla de oro en los Juegos Olímpicos con la selección. En 2021 hizo el gol que le dio a la Argentina la Copa América, en una final contra Brasil. En la final del Mundial de 2022 también metió un gol. Por su forma de correr y por ser flaquito, lo apodaron el Fideo.',
    preguntas: [
      {
        tipo: 'literal',
        enunciado: '¿En qué club empezó a jugar Di María?',
        opciones: ['En Boca', 'En Rosario Central', 'En River'],
        correcta: 1,
      },
      {
        tipo: 'literal',
        enunciado: '¿Qué ganó en los Juegos Olímpicos de 2008?',
        opciones: ['Una medalla de oro', 'Una copa de plata', 'Nada'],
        correcta: 0,
      },
      {
        tipo: 'inferencial',
        enunciado: '¿Por qué lo llaman el Fideo?',
        opciones: [
          'Porque le gustan los fideos',
          'Por ser flaquito y por su forma de correr',
          'Porque nació en Italia',
        ],
        correcta: 1,
      },
      {
        tipo: 'inferencial',
        enunciado: '¿Cómo se sabe que Di María juega bien en los partidos importantes?',
        opciones: ['Porque hizo goles en finales', 'Porque siempre es suplente', 'Porque nunca viajó'],
        correcta: 0,
      },
    ],
  },
  {
    titulo: 'Pelé, el rey del fútbol',
    vocabulario: ['humilde', 'extraordinario', 'familia'],
    nivel: 'dificil',
    categoria: 'biografia',
    cuerpo:
      'Pelé nació en Brasil en 1940. Su familia era humilde y no tenía dinero para comprarle una pelota. Por eso, de chico jugaba con una pelota hecha de medias viejas. Con el tiempo se convirtió en un jugador extraordinario. Con la selección de Brasil ganó tres Copas del Mundo, en 1958, 1962 y 1970. Todavía hoy mucha gente lo recuerda como el Rey del Fútbol.',
    preguntas: [
      {
        tipo: 'literal',
        enunciado: '¿De qué país era Pelé?',
        opciones: ['De Argentina', 'De Brasil', 'De Italia'],
        correcta: 1,
      },
      {
        tipo: 'literal',
        enunciado: '¿Cuántas Copas del Mundo ganó?',
        opciones: ['Una', 'Tres', 'Cinco'],
        correcta: 1,
      },
      {
        tipo: 'inferencial',
        enunciado: '¿Por qué jugaba con una pelota de medias?',
        opciones: [
          'Porque su familia no tenía dinero para una pelota',
          'Porque era más divertida',
          'Porque no le gustaban las pelotas',
        ],
        correcta: 0,
      },
      {
        tipo: 'inferencial',
        enunciado: '¿Por qué lo llaman el Rey del Fútbol?',
        opciones: [
          'Porque vivía en un castillo',
          'Porque fue uno de los mejores de la historia',
          'Porque era el más alto',
        ],
        correcta: 1,
      },
    ],
  },
]
