/**
 * Fuentes en INGLÉS para generar las lecciones y textos de práctica en inglés (data/en/).
 * Todo ASCII (sin apóstrofos ni tildes) para que se pueda teclear en el teclado latinoamericano o en el de EE. UU.
 * Estructura igual que palabras.mjs y frases.mjs.
 */
const L = (s) => s.split(/\s+/).filter(Boolean);

export const PALABRAS = [...new Set(L(`
the a an and or but is it in on at to of for with as by be do go no so up we he me my am us if
ask asks add ads ash all alas alga dad dads dash fad fads fall falls fast flag flags  flask flasks flash glad   had half hall halls has  hall  lad lads lag lash  sad sag saga sash salad salads salsa shaft shall  skid skids slash
has had gas dash  flash glass grass class  pass mass jaws
sleds fled fell   sell sells shell shells jell self shelf elf elks keg kegs leg legs egg eggs deed seed seeds feed heed led held hold gold sold told fold folds sold
life kids kid skid sift gift gifts gill hill  fill dill fish dish disk silk milk risk fist list lift gift hid lid slid
dog dogs fog log logs sock socks look looks good food foods fool pool cool tool tools door floor hood hook book books cook
red rod rid ride road rode rose rise rice ripe rope rock rocks rake race rain rate real read ready year yes yet you your young youth
tree trees true try tries tray trap trip tip top toy toys tour town tower tea team tears tell ten test text the then there these they this thin think three through time tiny tire to today together
quick quiet queen quit quiz quote question quest
under up use used user upon until unit
water wall want warm wash watch wave way week well went were wet what when where which while white who why wide wild will wind window wing winter wish with wolf wood word work world write
people puppy purple paper park path pen pencil piano pick pie piece pig pilot pink pipe place plan plane plant play please plus pocket point pond pony pool pop pot power pretty print prize proud puppet push put
orange open oak oat oats ocean off old once one only other our out over owl own
eat each ear early earth east easy edge egg eight else end enjoy enough even every
map mom milk moon more most mouse mouth move much music must mud mix
nap name near neck nest never new next nice night nine nose note now number nut
bag ball bank barn bat bay bear bed bee bell best big bike bird black blue boat body bone book boot box boy bread bridge bring brown bus busy buy
cab cake call came camp can candy cap car card care carry cart case cat catch chair chalk cheese chicken child city clap clean clear clock close cloud coat cold come corn count cow crab cry cup cut
day deer desk dig dinner doll down draw dream dress drink drive drop drum dry duck
fan far farm fat father fire first five fix flower fly fox frog from fruit full fun funny
game gate gave get girl give glove goat gone grape great green grow guess
hand happy hard hat hear heart help hen her here high him his hit hop horse hot house how hug hungry hurry
ice ink inch into iron island its jam jar jet job join joke jump just
key king kite knee knife know lake lamp land large last late laugh lazy leaf learn left lemon let letter light like lion little live long love lunch
make man many may meat meet melon men mice might mind mine miss mix monkey monster morning mother
sail salt same sand sat say school sea see seven sew shape sheep ship shirt shoe shop short show shy sing sister sit six skip sky sleep slow small smile snake snow soap some song soon sound soup space speak spoon spring square stand star start stay step stone stop store story street strong sugar summer sun super sweet swim
table tail take talk tall tape taste teach teeth thank thing thumb tie tired together tomato tonight too tooth touch towel toy train travel turn turtle twin two
vase very view visit voice wagon wake walk was wax we wear weather wet whale wheel whisper whistle wife won wonder wrong
xylophone box fox six mix wax next text exit exam excited extra expert explore explain
zebra zero zip zoo zone zoom zigzag size lazy dozen
jacket jelly jewel jigsaw journey joyful judge juice jungle junior justice
kangaroo keyboard kitchen kitten knight knock knot koala
quarter quilt quickly quietly
yellow yesterday yard yawn yell yogurt yummy
about above across after again against ago air alive along already also always among animal another answer any anyone around away
because before began behind below beside between beyond bigger bottom brave breakfast bright brother build
carefully certain change circle color corner country course cover crayon cross
different distance doctor double during
engine evening everyone example family favorite finger finish follow forest forget friend front future
garden gentle ground group guitar
happen heavy history holiday honest hundred husband
idea important inside interest invite
kindness knowledge
language laughter library listen lovely
machine magic market matter measure memory middle minute mirror mistake
natural needle neighbor nothing notice
office orange outside
parent party pattern perfect picture planet pocket polite popular practice problem promise
rabbit rainbow reason remember repeat rescue return river rocket rough rhythm
safe science season second secret serious shadow share silver simple single slowly smooth someone sometimes special speed spider station sudden surprise
teacher thirsty thousand thunder ticket together tomorrow tonight topic trouble trust typing
umbrella understand useful usual
valley village voice volcano
weekend welcome whole wonderful
yourself youngest
`))];
export const PALABRAS_TILDE = [];

export const NOMBRES = L(`Ana Luis Sara John Diego Laura Carla Mario Peter Ellen Hugo Irene Paul Rosa Lucas Marta Nora Oscar Paula Ray Sonia Theo Vera Alma David Eva Fabio Gale Hector Ines Julio Karla Leo Mia Nico Olga Pilar Rita Saul Emma Liam Noah Ava Zoe Ben Kate Jack Lily Max Tom Amy`);
export const LUGARES = L(`Colombia Cali Quito Lima Chile Cuba Brazil Canada Mexico Peru London Paris Tokyo Texas Florida Ohio Kansas Alaska Hawaii Nevada Boston Denver Seattle Miami Atlanta Dallas Orlando Cartagena Bogota Medellin Barranquilla Pasto Neiva Pereira Manizales Leticia Tunja Amazon Andes Caribbean Pacific Atlantic Magdalena Cauca Santander Tolima Huila`);
export const TITULOS = ['The Cat in the Hat', 'Treasure Island', 'My Dog Max', 'The Magic Forest', 'The Great Race', 'A Day at the Beach', 'The Fox and the Moon', 'Pirates of the Sea', 'The Tree House', 'Trip to the Moon'];
export const CLAVES_PALABRAS = ['sun', 'moon', 'cat', 'sea', 'frog', 'star', 'sky', 'tree', 'bear', 'wolf', 'lion', 'fish'];
export const COMILLADAS = ['hello', 'sun', 'sea', 'cat'];

export const SIN_TILDE = [
  // animales
  ['animales', 'The dog runs in the park.'], ['animales', 'The cow eats grass in the field.'], ['animales', 'My cat sleeps on the bed.'],
  ['animales', 'The parrot repeats everything it hears.'], ['animales', 'The bee takes pollen to its home.'], ['animales', 'Ants work together all day.'],
  ['animales', 'The bear eats honey and fruit.'], ['animales', 'A fish swims fast in the water.'], ['animales', 'The turtle walks very slowly.'],
  ['animales', 'The wolf howls when the moon comes out.'], ['animales', 'My rabbit jumps and eats carrots.'], ['animales', 'The giraffe has a very long neck.'],
  ['animales', 'The butterfly flies between the flowers.'], ['animales', 'The horse gallops across the green field.'], ['animales', 'The squirrel saves nuts for the winter.'],
  ['animales', 'My dog wags his tail when he sees me.'], ['animales', 'The rooster sings when the sun comes up.'], ['animales', 'The frog jumps from leaf to leaf.'],
  // escuela
  ['escuela', 'Today we have class in the classroom.'], ['escuela', 'I write my homework in my notebook.'], ['escuela', 'The teacher reads a story to everyone.'],
  ['escuela', 'I like recess with my friends.'], ['escuela', 'I keep my books in my backpack.'], ['escuela', 'I raise my hand to ask a question.'],
  ['escuela', 'I learn to type without looking at the keyboard.'], ['escuela', 'The library is very quiet.'], ['escuela', 'My teacher explains the lesson with drawings.'],
  ['escuela', 'We work as a team to solve the problem.'], ['escuela', 'My favorite book is about adventures.'], ['escuela', 'I paint a landscape with many colors.'],
  ['escuela', 'My notebook has a blue cover.'],
  // familia
  ['familia', 'My mother cooks rice with chicken.'], ['familia', 'My father takes me to school.'], ['familia', 'My grandmother tells stories about her town.'],
  ['familia', 'My brother plays ball with me.'], ['familia', 'On Sundays we all eat lunch together.'], ['familia', 'My grandfather grows flowers in the yard.'],
  ['familia', 'At home we all help each other.'], ['familia', 'My sister reads a book on her bed.'], ['familia', 'My cousin paints a red flower.'],
  // naturaleza
  ['naturaleza', 'The sun rises in the east.'], ['naturaleza', 'Rain fills the lakes and the clouds.'], ['naturaleza', 'Trees give shade and clean air.'],
  ['naturaleza', 'The wind moves the leaves of the forest.'], ['naturaleza', 'The moon shines in the night sky.'], ['naturaleza', 'The sea is blue and very deep.'],
  ['naturaleza', 'Let us take care of the water for the future.'], ['naturaleza', 'Plants need sun and water.'], ['naturaleza', 'Thousands of animals live in the jungle.'],
  ['naturaleza', 'Recycling helps take care of the planet.'], ['naturaleza', 'A white cloud passes over the hill.'],
  // deportes
  ['deportes', 'I run in the park every afternoon.'], ['deportes', 'The goalkeeper stops the ball with his hands.'], ['deportes', 'Swimming is good for the whole body.'],
  ['deportes', 'We play basketball on the court.'], ['deportes', 'The cyclist climbs the mountain without stopping.'], ['deportes', 'Before we play, we need to warm up.'],
  ['deportes', 'I jump rope with my friends.'], ['deportes', 'My team trains every Monday.'],
  // tecnologia
  ['tecnologia', 'I use the computer to learn.'], ['tecnologia', 'I type with all ten fingers without looking.'], ['tecnologia', 'The screen shows the text I write.'],
  ['tecnologia', 'I save my files in a folder.'], ['tecnologia', 'I protect my data and I never share my password.'], ['tecnologia', 'A robot can help with many tasks.'],
  ['tecnologia', 'I browse the web with an adult.'], ['tecnologia', 'My fingers know every key.'],
  // ciencia
  ['ciencia', 'The earth goes around the sun.'], ['ciencia', 'Water boils when it gets very hot.'], ['ciencia', 'Plants make their food from light.'],
  ['ciencia', 'The moon has no light of its own.'], ['ciencia', 'Magnets pull iron toward them.'], ['ciencia', 'Sound travels through the air.'],
  ['ciencia', 'Ice melts when it gets warm.'],
  // colombia
  ['colombia', 'Colombia has coasts on two oceans.'], ['colombia', 'The arepa is a much loved food.'], ['colombia', 'In Cali people dance salsa all year.'],
  ['colombia', 'Cartagena has very old walls.'], ['colombia', 'The Amazon is an enormous jungle.'], ['colombia', 'The Andes cross the country from north to south.'],
  ['colombia', 'In Pasto there is a big carnival.'],
  // comida
  ['comida', 'I have bread with cheese and juice for breakfast.'], ['comida', 'I like strawberry ice cream.'], ['comida', 'Rice with an egg is my favorite dish.'],
  ['comida', 'I drink water after I play.'], ['comida', 'Mango juice is very sweet.'], ['comida', 'An arepa with cheese is delicious.'],
  // valores
  ['valores', 'Being kind costs nothing.'], ['valores', 'I respect my classmates and my teacher.'], ['valores', 'Saying sorry with respect is being brave.'],
  ['valores', 'Sharing makes everyone happy.'], ['valores', 'If I make a mistake, I try again.'], ['valores', 'Honesty is a great treasure.'], ['valores', 'Every mistake helps me improve.'],
  // refranes
  ['refranes', 'A good friend is worth gold.'], ['refranes', 'The early bird catches the worm.'], ['refranes', 'Little by little we go far.'],
  ['refranes', 'Practice makes perfect.'],
  // trabalenguas
  ['trabalenguas', 'She sells sea shells by the sea shore.'], ['trabalenguas', 'Peter Piper picked a peck of pickled peppers.'],
  // pangramas
  ['pangramas', 'The quick brown fox jumps over the lazy dog.'],
];

export const CON_TILDE = [
  ['signos', 'I need three things: a pencil, a notebook and an eraser.'], ['signos', 'Today I practice a lot; tomorrow I will practice more.'], ['signos', 'In my backpack there are: books, colors and a bottle.'],
  ['signos', 'I like soccer; my sister prefers basketball.'], ['signos', 'Remember: accuracy comes first.'], ['signos', 'I have two pets: a cat and a dog.'],
  ['signos', 'First we warm up; then we play.'], ['signos', 'My to-do list: read, write and draw.'], ['signos', 'There are four seasons: summer, autumn, winter and spring.'],
  ['animales', 'The penguin walks on the ice.'], ['animales', 'The dolphin is a very smart animal.'], ['animales', 'Birds sing in the morning.'],
  ['animales', 'The bat sleeps by day and flies at night.'], ['animales', 'The whale is the biggest animal in the sea.'], ['animales', 'The lion is the king of the savanna.'],
  ['animales', 'The hummingbird flies very fast between the flowers.'], ['animales', 'The spider weaves its web with great patience.'], ['animales', 'How big the giraffe is!'],
  ['escuela', 'Today I learned a new lesson.'], ['escuela', 'Every day I practice a little more.'], ['escuela', 'Who wants to come to the board?'],
  ['escuela', 'My teacher praised my effort.'], ['escuela', 'There are twenty desks in the classroom.'], ['escuela', 'The math homework is very easy.'],
  ['escuela', 'How do you spell this word?'], ['escuela', 'Tomorrow we have a science test.'], ['escuela', 'I read a book about space.'],
  ['familia', 'My mom makes rice with chicken.'], ['familia', 'My dad takes me to school.'], ['familia', 'My aunt lives near the beach.'],
  ['familia', 'My family is the most important thing.'], ['familia', 'Tomorrow is my cousin birthday party.'], ['familia', 'Happy birthday, Dad!'],
  ['familia', 'My grandfather taught me to play chess.'], ['familia', 'Do you want to play with me, brother?'], ['familia', 'My mom gave me a very big hug.'],
  ['naturaleza', 'A rainbow appears after the rain.'], ['naturaleza', 'How beautiful the sky is today!'], ['naturaleza', 'The mountains are tall and cold.'],
  ['naturaleza', 'The river flows from the mountain to the sea.'], ['naturaleza', 'Trees give us shade and clean air.'], ['naturaleza', 'The flower opens its petals in the sun.'],
  ['naturaleza', 'After the storm, the sun comes out.'], ['naturaleza', 'Did you know that plants also breathe?'],
  ['deportes', 'Soccer is the most popular sport in Colombia.'], ['deportes', 'Goal! We all shout with joy.'], ['deportes', 'My team won the game with a goal in the last minute.'],
  ['deportes', 'Who won the cycling race?'], ['deportes', 'Basketball is played with the hands.'], ['deportes', 'Training every day makes me stronger.'],
  ['tecnologia', 'Accuracy is more important than speed.'], ['tecnologia', 'Did you know the F key has a little bump?'], ['tecnologia', 'My computer has a very sharp screen.'],
  ['tecnologia', 'Technology helps us learn faster.'], ['tecnologia', 'Typing well lets me work better.'], ['tecnologia', 'What is your favorite game?'],
  ['ciencia', 'The heart pumps blood to the whole body.'], ['ciencia', 'Scientists ask questions and look for answers.'], ['ciencia', 'Jupiter is the biggest planet in the solar system.'],
  ['ciencia', 'Why is the sky blue?'], ['ciencia', 'Water boils at one hundred degrees.'], ['ciencia', 'Magnets have two poles: north and south.'],
  ['colombia', 'The Magdalena river crosses a large part of the country.'], ['colombia', 'Colombian coffee is famous around the world.'], ['colombia', 'Bogota is the capital of Colombia.'],
  ['colombia', 'The condor is a bird that flies over the Andes.'], ['colombia', 'How delicious the bandeja paisa is!'], ['colombia', 'Medellin is known as the city of eternal spring.'],
  ['colombia', 'In the Colombian Caribbean people dance cumbia.'], ['colombia', 'Do you know the Cocora Valley?'],
  ['comida', 'The arepa with cheese is delicious.'], ['comida', 'Passion fruit juice is my favorite.'], ['comida', 'My mom makes a delicious lemon cake.'],
  ['comida', 'Do you want a banana or an apple?'], ['comida', 'I had a glass of milk with cookies.'],
  ['valores', 'You can do it!'], ['valores', 'Asking for forgiveness is also being brave.'], ['valores', 'With patience and practice, everything is possible.'],
  ['valores', 'Thank you for helping me!'], ['valores', 'I respect my classmates and my teacher.'], ['valores', 'How can I help you today?'],
  ['refranes', 'Better late than never.'], ['refranes', 'Actions speak louder than words.'], ['refranes', 'Do not put off until tomorrow what you can do today.'],
  ['refranes', 'A friend in need is a friend indeed.'], ['refranes', 'Where there is a will, there is a way.'],
  ['trabalenguas', 'How much wood would a woodchuck chuck if a woodchuck could chuck wood?'], ['trabalenguas', 'Red lorry, yellow lorry, red lorry, yellow lorry.'],
  ['trabalenguas', 'Fuzzy Wuzzy was a bear; Fuzzy Wuzzy had no hair.'],
  ['pangramas', 'Pack my box with five dozen liquor jugs.'], ['pangramas', 'How vexingly quick daft zebras jump!'], ['pangramas', 'Sphinx of black quartz, judge my vow.'],
  ['numeros', 'I am 8 years old and my house is number 25.'], ['numeros', 'The game starts at 3:30 in the afternoon.'], ['numeros', 'I bought 4 pencils for $2.50.'],
  ['numeros', 'My email is sophia@school.edu.co.'], ['numeros', '100% of my homework is done.'], ['numeros', 'Today is 03/15/2026.'],
  ['numeros', 'My number on the list is 17.'], ['numeros', '2 + 3 = 5 and 10 - 4 = 6.'], ['numeros', 'The password has 6 numbers and 1 symbol (#).'],
  ['numeros', 'There are 28 students in room 4-B.'], ['numeros', 'The bus leaves at 6:45 and arrives at 7:15.'], ['numeros', 'My phone number ends in 0-7-3.'],
  ['numeros', 'The grade was 4.5 and the goal was 4.0.'], ['numeros', 'Type @ with the AltGr key and the Q.'], ['numeros', 'I paid $12.00 and got $3.50 back.'],
];

export const PARRAFOS = [
  // ciencia
  ['ciencia', 'The sun is a star that gives us light and heat. Without it there would be no plants, no animals and no people on Earth. The planets travel around the sun in big circles that we call orbits.'],
  ['ciencia', 'Water can be a liquid, a solid or a gas. When it is very cold, it turns into ice. When it gets hot, it becomes steam. This change is part of the water cycle that gives life to our planet.'],
  ['ciencia', 'Our body is like a machine that never rests. The heart pumps blood, the lungs bring in air and the brain sends orders to every part. Sleeping well and eating healthy food helps this machine work better.'],
  ['ciencia', 'Scientists observe, ask questions and do experiments to understand the world. They write down what they see and share their discoveries, so that other people can learn from them and keep exploring.'],
  // animales
  ['animales', 'Bees live in big families called colonies. Each bee has a job: some look for flowers, others take care of the babies and others build the hive. Thanks to their work we have honey and many fruits.'],
  ['animales', 'The whale is the biggest animal on the planet. Even though it lives in the sea, it is not a fish: it breathes air and feeds its babies with milk. Its song can travel very far under the water.'],
  ['animales', 'Dogs have been friends of people for thousands of years. They are loyal, playful and very smart. A dog can learn many tricks, help people who cannot see and even find lost children in the mountains.'],
  // colombia
  ['colombia', 'Colombia is a country full of colors, music and nature. It has beaches, snowy mountains, deserts and a huge rainforest. Its people are known for being friendly, and its coffee is loved around the world.'],
  ['colombia', 'The Andes mountains split into three ranges when they enter Colombia. Between them flow the Magdalena and Cauca rivers, which bring water to many towns and farms and help grow food all year long.'],
  ['colombia', 'Every year, many cities in Colombia hold colorful festivals. There are parades, costumes, dances and music for everyone. These celebrations show the history and the traditions of each region of the country.'],
  // naturaleza
  ['naturaleza', 'A forest is much more than a group of trees. It is a home for birds, insects and mammals. The trees clean the air, protect the soil from the rain and give us wood, fruit and shade on hot days.'],
  ['naturaleza', 'Rivers begin as tiny drops in the high mountains. They join together, run down the hills and finally reach the sea. Along the way they give water to plants, animals and people, so we must keep them clean.'],
  // tecnologia
  ['tecnologia', 'Typing without looking at the keys is a skill that you can learn with practice. At first you go slowly, but after a few weeks your fingers remember where each letter is, and you can write faster and with fewer mistakes.'],
  ['tecnologia', 'A computer follows instructions that people write. These instructions are called programs. With a program we can draw, write, play music, talk to friends far away and learn about almost anything in the world.'],
  // cuento
  ['cuento', 'Once upon a time there was a curious fox who lived at the edge of a forest. Every night she looked at the stars and wondered how far they were. One day she decided to climb the tallest hill to see them closer.'],
  ['cuento', 'Lucy loved to read. She read at breakfast, on the bus and even under the covers with a flashlight. One afternoon she found an old book in the library. When she opened it, a tiny dragon jumped out and said hello.'],
  ['cuento', 'The little robot woke up in the middle of a big, quiet junkyard. He did not remember his name or where his home was. So he picked up a wrench, turned on his lamp and began to look for his friends.'],
  ['cuento', 'On the first day of school, Tom felt very nervous. He did not know anyone. Then a girl smiled at him and shared her colored pencils. By the end of the day they were friends, and the school did not seem so big.'],
  // valores
  ['valores', 'Being a good teammate means helping others, even when we are not winning. A good team listens, shares the ball and celebrates every goal together. What matters most is to play fair and to enjoy the game with our friends.'],
  ['valores', 'Honesty is telling the truth even when it is hard. When we are honest, people trust us and we feel calm inside. Everyone makes mistakes, but the brave ones say sorry and try to do better the next time.'],
  // historia
  ['historia', 'Long ago, people wrote on clay, on stone and later on paper. The printing press let books travel to many places, and more people could learn to read. Today we also write on screens, and our fingers do the work.'],
  ['historia', 'The first keyboards were made for typewriters more than one hundred years ago. The letters were placed in the order we still use today. That is why the QWERTY keyboard is found on computers all over the world.'],
  // espacio
  ['espacio', 'Our solar system has eight planets. Mercury is the closest to the sun and Neptune is the farthest. Jupiter is so big that more than one thousand Earths could fit inside it. Astronauts dream of visiting them one day.'],
  // comida
  ['comida', 'A healthy plate has many colors. Fruits and vegetables give us vitamins, rice and bread give us energy, and beans, eggs or fish help our muscles grow. Drinking water and eating together with family is also good for us.'],
  // deportes
  ['deportes', 'Playing sports helps our body and our mind. We run, jump and breathe more deeply, and we also learn to follow rules, to work in a team and to accept a loss without getting angry. Moving every day makes us stronger and happier.'],
  // dialogo
  ['dialogo', 'Ana said: Hello, Leo! Do you want to play outside? Leo answered: Yes, but first I have to finish my homework. Ana smiled and said: Do not worry, I will wait for you. Then they ran to the park together.'],
  // numeros
  ['numeros', 'There are 7 days in a week and 12 months in a year. A year has 365 days, and every 4 years February gets one extra day. In one hour there are 60 minutes, and in one minute there are 60 seconds.'],
];

/* ═════════ Traducciones del currículo (título, tip y objetivos fijos) ═════════ */
export const TITULOS_LECCION = {
  'F y J: los índices': 'F and J: the index fingers', 'D y K: los dedos medios': 'D and K: the middle fingers', 'Repaso: F J D K': 'Review: F J D K',
  'S y L: los anulares': 'S and L: the ring fingers', 'A y Ñ: los meñiques': 'A and Ñ: the pinkies', 'Repaso de la fila base': 'Home row review',
  'G y H: los índices se estiran': 'G and H: the index fingers stretch', 'La fila base completa': 'The whole home row', 'Tus primeras palabras': 'Your first words',
  'Más palabras de la fila base': 'More home row words', 'Espacio y ritmo': 'Space and rhythm', 'Precisión de la fila base': 'Home row accuracy',
  'Velocidad de la fila base': 'Home row speed', 'Jefe: el guardián de la fila base': 'Boss: the home row guardian',
  'E e I: los dedos medios': 'E and I: the middle fingers', 'R y U: los índices suben': 'R and U: the index fingers go up', 'Repaso: E I R U': 'Review: E I R U',
  'T y Y: los índices alcanzan más lejos': 'T and Y: the index fingers reach farther', 'W y O: los anulares suben': 'W and O: the ring fingers go up',
  'Q y P: los meñiques suben': 'Q and P: the pinkies go up', 'Repaso de la fila superior': 'Top row review', 'Palabras con fila superior': 'Words with the top row',
  'Más palabras: arriba y en medio': 'More words: top and middle', 'Frases cortas': 'Short sentences', 'Combos frecuentes: es, en, el, ue': 'Common combos: es, en, el, ue',
  'Precisión de la fila superior': 'Top row accuracy', 'Velocidad de la fila superior': 'Top row speed', 'Jefe: la torre de las letras': 'Boss: the letter tower',
  'V y M: los índices bajan': 'V and M: the index fingers go down', 'C y la coma: dedos medios': 'C and the comma: middle fingers', 'X y el punto: anulares': 'X and the period: ring fingers',
  'Z y el guion: meñiques': 'Z and the hyphen: pinkies', 'B y N: índices al centro': 'B and N: index fingers to the center', 'Repaso de la fila inferior': 'Bottom row review',
  'Palabras con fila inferior': 'Words with the bottom row', 'Comas y puntos en frases': 'Commas and periods in sentences', 'Combos frecuentes: ra, ca, co, tr': 'Common combos: ra, ca, co, tr',
  'Precisión de la fila inferior': 'Bottom row accuracy', 'Velocidad de la fila inferior': 'Bottom row speed', 'Jefe: el navegante': 'Boss: the navigator',
  'El abecedario completo': 'The complete alphabet', 'Palabras con Ñ': 'Words with Ñ (Spanish)', 'Animales y naturaleza': 'Animals and nature', 'Escuela y familia': 'School and family',
  'Comida y deportes': 'Food and sports', 'Palabras difíciles: Q Z X W K': 'Hard words: Q Z X W K', 'Refuerzo de meñiques: Q A Z P Ñ': 'Pinky reinforcement: Q A Z P Ñ',
  'Frases largas y claras': 'Long, clear sentences', 'Valores y refranes': 'Values and sayings', 'Trabalenguas': 'Tongue twisters', 'Precisión con todo el teclado': 'Accuracy with the whole keyboard',
  'Velocidad con todo el teclado': 'Speed with the whole keyboard', 'Mezcla total': 'Total mix', 'Jefe: el mapa del tesoro': 'Boss: the treasure map',
  'Shift izquierdo: mayúsculas de la mano derecha': 'Left Shift: capitals for the right hand', 'Shift derecho: mayúsculas de la mano izquierda': 'Right Shift: capitals for the left hand',
  'Nombres propios': 'Proper names', 'Ciudades y regiones': 'Cities and regions', 'Mayúscula al empezar una frase': 'Capital letter at the start of a sentence',
  'Mayúsculas dentro de frases': 'Capitals inside sentences', 'Siglas y letreros': 'Acronyms and signs', 'Títulos de cuentos': 'Story titles',
  'Precisión con mayúsculas': 'Accuracy with capitals', 'Velocidad con mayúsculas': 'Speed with capitals', 'Jefe: la montaña Shift': 'Boss: the Shift mountain',
  'Tilde en la á': 'Accent on á (Spanish)', 'Tilde en la é': 'Accent on é (Spanish)', 'Tilde en la í': 'Accent on í (Spanish)', 'Tilde en la ó': 'Accent on ó (Spanish)', 'Tilde en la ú': 'Accent on ú (Spanish)',
  'Repaso de todas las tildes': 'Review of all accents (Spanish)', 'La diéresis: ü': 'The dieresis: ü (Spanish)', 'Preguntas: ¿ y ?': 'Questions: ¿ and ? (Spanish)', 'Exclamaciones: ¡ y !': 'Exclamations: ¡ and ! (Spanish)',
  'Punto y coma, y dos puntos': 'Semicolon and colon', 'Palabras con tilde': 'Words with accents (Spanish)', 'Frases con preguntas y exclamaciones': 'Sentences with questions and exclamations',
  'Repaso de tildes y signos': 'Accents and punctuation review (Spanish)', 'Precisión con tildes': 'Accuracy with accents (Spanish)', 'Velocidad con tildes': 'Speed with accents (Spanish)', 'Jefe: el mago de las tildes': 'Boss: the accent wizard (Spanish)',
  'Los números 4 5 6 7': 'The numbers 4 5 6 7', 'Los números 3 y 8': 'The numbers 3 and 8', 'Los números 2 y 9': 'The numbers 2 and 9', 'Los números 1 y 0': 'The numbers 1 and 0',
  'Repaso de números': 'Numbers review', 'Suma, resta, igual': 'Plus, minus, equals', 'Por y dividido: * y /': 'Times and divided by: * and /', 'Precios y porcentajes: $ y %': 'Prices and percentages: $ and %',
  'Paréntesis y comillas': 'Parentheses and quotation marks', 'Arroba, numeral y ampersand': 'At sign, hash and ampersand', 'Correos y claves seguras': 'Emails and safe passwords',
  'Fechas, horas y precios': 'Dates, times and prices', 'Precisión con números': 'Accuracy with numbers', 'Velocidad con números': 'Speed with numbers', 'Jefe: el guardián de los números': 'Boss: the number guardian',
  'Frases de animales': 'Animal sentences', 'Frases de la escuela': 'School sentences', 'Frases de la familia': 'Family sentences', 'Frases de la naturaleza': 'Nature sentences',
  'Frases de deportes': 'Sports sentences', 'Frases de tecnología': 'Technology sentences', 'Frases de ciencia': 'Science sentences', 'Frases de Colombia': 'Sentences about Colombia',
  'Frases de comida': 'Food sentences', 'Valores': 'Values', 'Refranes': 'Sayings', 'Trabalenguas y pangramas': 'Tongue twisters and pangrams', 'Frases con números': 'Sentences with numbers',
  'Precisión con frases': 'Accuracy with sentences', 'Velocidad con frases': 'Speed with sentences', 'Jefe: el maestro de las frases': 'Boss: the sentence master',
  'Párrafo: ciencia (1)': 'Paragraph: science (1)', 'Párrafo: ciencia (2)': 'Paragraph: science (2)', 'Párrafo: animales (1)': 'Paragraph: animals (1)', 'Párrafo: animales (2)': 'Paragraph: animals (2)',
  'Párrafo: Colombia (1)': 'Paragraph: Colombia (1)', 'Párrafo: Colombia (2)': 'Paragraph: Colombia (2)', 'Párrafo: naturaleza': 'Paragraph: nature', 'Párrafo: tecnología': 'Paragraph: technology',
  'Cuento: el zorro curioso': 'Story: the curious fox', 'Cuento: la niña lectora': 'Story: the girl who loved reading', 'Cuento: el robot perdido': 'Story: the lost robot',
  'Valores y deporte': 'Values and sports', 'Historia y espacio': 'History and space', 'Precisión con párrafos': 'Accuracy with paragraphs', 'Velocidad con párrafos': 'Speed with paragraphs', 'Jefe: el narrador': 'Boss: the storyteller',
  'Sprint 1: palabras cortas': 'Sprint 1: short words', 'Sprint 2: frases': 'Sprint 2: sentences', 'Sprint 3: tildes y signos': 'Sprint 3: accents and punctuation (Spanish)', 'Sprint 4: números y símbolos': 'Sprint 4: numbers and symbols',
  'Sin mirar 1: el teclado se oculta': 'No peeking 1: the keyboard hides', 'Sin mirar 2: frases a ciegas': 'No peeking 2: sentences blind', 'Precisión perfecta: 98 %': 'Perfect accuracy: 98%',
  'Palabras largas': 'Long words', 'Ritmo constante': 'Steady rhythm', 'Mayúsculas y signos mezclados': 'Mixed capitals and punctuation', 'Combo: letras y números': 'Combo: letters and numbers',
  'Maratón de 3 minutos': '3-minute marathon', 'Maratón de 5 minutos': '5-minute marathon', 'Párrafo a ciegas': 'Blind paragraph', 'Velocidad de campeones': 'Champion speed',
  'Jefe final: el gran maestro del teclado': 'Final boss: the keyboard grand master',
};
export const TIPS_LECCION = {
  'Las teclas F y J tienen un puntito en relieve. Sirven para que tus índices siempre encuentren su “casa” sin mirar.': 'The F and J keys have a small raised bump. They help your index fingers always find their “home” without looking.',
  'Los meñiques son los más débiles. Ve despacio: la precisión viene primero.': 'The pinkies are the weakest fingers. Go slowly: accuracy comes first.',
  'Tus índices se estiran un poquito hacia el centro y vuelven a su tecla de casa.': 'Your index fingers stretch a little toward the center and then go back to their home key.',
  'La barra espaciadora se pulsa con el pulgar. Mantén un ritmo parejo, como un tambor.': 'The space bar is pressed with the thumb. Keep an even rhythm, like a drum.',
  'Sube desde la fila base y vuelve siempre a tu tecla de casa.': 'Reach up from the home row and always come back to your home key.',
  'Para una letra de la mano derecha, mantén Shift con el meñique izquierdo y pulsa la letra.': 'For a right-hand letter, hold Shift with your left pinky and press the letter.',
  'Para una letra de la mano izquierda, mantén Shift con el meñique derecho.': 'For a left-hand letter, hold Shift with your right pinky.',
  'Primero pulsa la tecla ´ (a la derecha de la P) y, después, la vocal. No necesitas mantener ninguna.': 'First press the ´ key (to the right of P) and then the vowel. You do not need to hold either one.',
  'Mantén Shift, pulsa la tecla ´ y luego la u: ü (pingüino).': 'Hold Shift, press the ´ key and then u: ü (pingüino).',
  'En español la pregunta se abre con ¿ y se cierra con ?': 'In Spanish a question opens with ¿ and closes with ?',
  'Tus índices suben a la fila de números y vuelven a la fila base.': 'Your index fingers reach up to the number row and come back to the home row.',
  'La arroba @ se escribe con AltGr + Q (la tecla Alt derecha y la Q).': 'The at sign @ is typed with AltGr + Q (the right Alt key and Q).',
};
export const OBJETIVOS_LECCION = {
  'Mantén Shift con el meñique izquierdo y escribe con la mano derecha: Juan, Luis, Hugo…': 'Hold Shift with your left pinky and type with your right hand: John, Louis, Hugo…',
  'Mantén Shift con el meñique derecho y escribe con la mano izquierda: Ana, Sara, Diego…': 'Hold Shift with your right pinky and type with your left hand: Ana, Sara, Diego…',
  'Escribe ü (pingüino): mantén Shift, pulsa la tecla ´ y luego la u.': 'Type ü (pingüino): hold Shift, press the ´ key and then u.',
  'Aprende ¿ y ?: en español la pregunta se abre y se cierra con signos.': 'Learn ¿ and ?: in Spanish a question opens and closes with marks.',
  'Aprende ¡ y !: la exclamación también se abre y se cierra.': 'Learn ¡ and !: an exclamation also opens and closes.',
  'Aprende el punto y coma (;) y los dos puntos (:), ambos con Shift.': 'Learn the semicolon (;) and the colon (:), both with Shift.',
  'Aprende @ (AltGr + Q), # (Shift + 3) y & (Shift + 6) para correos y claves.': 'Learn @ (AltGr + Q), # (Shift + 3) and & (Shift + 6) for emails and passwords.',
};
export const DEDOS_EN = {
  'índice izquierdo': 'left index finger', 'índice derecho': 'right index finger', 'dedo medio izquierdo': 'left middle finger', 'dedo medio derecho': 'right middle finger',
  'anular izquierdo': 'left ring finger', 'anular derecho': 'right ring finger', 'meñique izquierdo': 'left pinky', 'meñique derecho': 'right pinky',
  'pulgar izquierdo': 'left thumb', 'pulgar derecho': 'right thumb',
};
