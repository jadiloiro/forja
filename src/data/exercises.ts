import { Exercise } from './types';

/**
 * Banco de exercícios de academia.
 * Imagens de execução: free-exercise-db (github.com/yuhonas/free-exercise-db), domínio público (Unlicense).
 * Textos de execução escritos em português para este app.
 */
export const EXERCISES: Exercise[] = [
  // ───────────── PEITO ─────────────
  {
    id: 'supino_reto_barra', nome: 'Supino reto com barra', grupo: 'peito', secundarios: ['triceps', 'ombros'],
    equipamento: 'barra', tipo: 'composto', nivel: 2, img: 'Barbell_Bench_Press_-_Medium_Grip',
    passos: [
      'Deite no banco com os olhos alinhados abaixo da barra e os pés firmes no chão.',
      'Segure a barra com pegada um pouco mais aberta que os ombros e junte as escápulas.',
      'Tire a barra do suporte e posicione-a sobre o peito com os braços estendidos.',
      'Desça de forma controlada até tocar levemente a parte baixa do peitoral.',
      'Empurre a barra de volta para cima, expirando, até estender os cotovelos.',
    ],
    dicas: ['Mantenha as escápulas retraídas o tempo todo.', 'Cotovelos a cerca de 45–70° do tronco, não totalmente abertos.', 'Não quique a barra no peito.'],
  },
  {
    id: 'supino_reto_halter', nome: 'Supino reto com halteres', grupo: 'peito', secundarios: ['triceps', 'ombros'],
    equipamento: 'halteres', tipo: 'composto', nivel: 1, img: 'Dumbbell_Bench_Press',
    passos: [
      'Sente no banco com os halteres apoiados nas coxas e deite levando-os junto ao peito.',
      'Posicione os halteres na linha do peito, palmas para a frente.',
      'Empurre para cima até quase encostar um halter no outro.',
      'Desça devagar até sentir alongar o peitoral, com os cotovelos levemente abaixo do banco.',
    ],
    dicas: ['Amplitude maior que a barra: aproveite o alongamento.', 'Não bata os halteres no topo.'],
  },
  {
    id: 'supino_inclinado_barra', nome: 'Supino inclinado com barra', grupo: 'peito', secundarios: ['ombros', 'triceps'],
    equipamento: 'barra', tipo: 'composto', nivel: 2, img: 'Barbell_Incline_Bench_Press_-_Medium_Grip',
    passos: [
      'Ajuste o banco entre 30° e 45° e deite com os pés firmes.',
      'Segure a barra um pouco mais aberta que os ombros e retire do suporte.',
      'Desça a barra até a parte alta do peito, logo abaixo da clavícula.',
      'Empurre de volta até estender os braços.',
    ],
    dicas: ['Inclinação acima de 45° transfere o trabalho para o ombro.', 'Escápulas juntas e peito "aberto".'],
  },
  {
    id: 'supino_inclinado_halter', nome: 'Supino inclinado com halteres', grupo: 'peito', secundarios: ['ombros', 'triceps'],
    equipamento: 'halteres', tipo: 'composto', nivel: 1, img: 'Incline_Dumbbell_Press',
    passos: [
      'Banco entre 30° e 45°, halteres apoiados nas coxas.',
      'Deite levando os halteres à altura do peito superior.',
      'Empurre para cima e levemente para dentro.',
      'Desça controlando até alongar o peitoral.',
    ],
    dicas: ['Ótimo para quem sente o ombro no supino com barra.', 'Punhos alinhados acima dos cotovelos.'],
  },
  {
    id: 'supino_declinado_barra', nome: 'Supino declinado com barra', grupo: 'peito', secundarios: ['triceps'],
    equipamento: 'barra', tipo: 'composto', nivel: 2, img: 'Decline_Barbell_Bench_Press',
    passos: [
      'Prenda as pernas no apoio do banco declinado e deite.',
      'Retire a barra com pegada média e posicione sobre o peito.',
      'Desça até a parte baixa do peitoral.',
      'Empurre de volta até estender os braços.',
    ],
    dicas: ['Use um parceiro para tirar e recolocar a barra.', 'Movimento curto: não precisa de amplitude exagerada.'],
  },
  {
    id: 'supino_maquina', nome: 'Supino na máquina', grupo: 'peito', secundarios: ['triceps', 'ombros'],
    equipamento: 'maquina', tipo: 'composto', nivel: 1, img: 'Machine_Bench_Press',
    passos: [
      'Ajuste o banco para que as manoplas fiquem na altura do meio do peito.',
      'Segure as manoplas, costas apoiadas e escápulas juntas.',
      'Empurre até quase estender os braços.',
      'Volte devagar até sentir o alongamento do peito.',
    ],
    dicas: ['Ótima opção para ir até a falha com segurança.', 'Não deixe os ombros subirem.'],
  },
  {
    id: 'supino_inclinado_smith', nome: 'Supino inclinado no Smith', grupo: 'peito', secundarios: ['ombros', 'triceps'],
    equipamento: 'smith', tipo: 'composto', nivel: 1, img: 'Smith_Machine_Incline_Bench_Press',
    passos: [
      'Posicione o banco inclinado sob o Smith, de modo que a barra desça na parte alta do peito.',
      'Destrave a barra girando os punhos.',
      'Desça controlando até perto do peito.',
      'Empurre de volta e trave ao final da série.',
    ],
    dicas: ['Trajetória guiada: bom para focar no peitoral sem se preocupar com equilíbrio.'],
  },
  {
    id: 'crucifixo_halter', nome: 'Crucifixo reto com halteres', grupo: 'peito', secundarios: ['ombros'],
    equipamento: 'halteres', tipo: 'isolado', nivel: 1, img: 'Dumbbell_Flyes',
    passos: [
      'Deite no banco reto com os halteres acima do peito, palmas uma de frente para a outra.',
      'Com os cotovelos levemente flexionados, abra os braços em arco.',
      'Desça até sentir o peitoral alongar, na linha do peito.',
      'Feche os braços no mesmo arco, como se abraçasse uma árvore.',
    ],
    dicas: ['Não transforme em supino: o ângulo do cotovelo fica fixo.', 'Carga moderada, foco no alongamento.'],
  },
  {
    id: 'crucifixo_inclinado', nome: 'Crucifixo inclinado com halteres', grupo: 'peito', secundarios: ['ombros'],
    equipamento: 'halteres', tipo: 'isolado', nivel: 1, img: 'Incline_Dumbbell_Flyes',
    passos: [
      'Banco a 30°, halteres acima do peito, palmas frente a frente.',
      'Abra os braços em arco com cotovelos levemente flexionados.',
      'Desça até alongar a parte alta do peitoral.',
      'Volte contraindo o peito.',
    ],
    dicas: ['Mantenha as escápulas apoiadas no banco.'],
  },
  {
    id: 'crossover', nome: 'Crossover (polia alta)', grupo: 'peito', secundarios: ['ombros'],
    equipamento: 'cabo', tipo: 'isolado', nivel: 1, img: 'Cable_Crossover',
    passos: [
      'Polias no alto, segure uma manopla em cada mão e dê um passo à frente.',
      'Incline levemente o tronco, braços abertos e cotovelos levemente flexionados.',
      'Puxe as manoplas para baixo e para a frente até se encontrarem à frente do quadril.',
      'Segure 1 segundo e volte devagar.',
    ],
    dicas: ['Tensão constante: não deixe o peso bater na pilha.', 'Varie a altura da polia para enfatizar regiões diferentes.'],
  },
  {
    id: 'peck_deck', nome: 'Voador (peck deck)', grupo: 'peito', secundarios: ['ombros'],
    equipamento: 'maquina', tipo: 'isolado', nivel: 1, img: 'Butterfly',
    passos: [
      'Ajuste o banco para que as manoplas fiquem na altura do peito.',
      'Costas apoiadas, segure as manoplas com os braços abertos.',
      'Feche os braços à frente do peito contraindo o peitoral.',
      'Volte controlando até sentir o alongamento.',
    ],
    dicas: ['Não deixe os ombros projetarem para a frente.'],
  },
  {
    id: 'flexao', nome: 'Flexão de braço', grupo: 'peito', secundarios: ['triceps', 'ombros', 'abdomen'],
    equipamento: 'peso_corporal', tipo: 'composto', nivel: 1, img: 'Pushups',
    passos: [
      'Mãos no chão um pouco mais abertas que os ombros, corpo em linha reta.',
      'Contraia abdômen e glúteos.',
      'Desça o peito até perto do chão.',
      'Empurre de volta até estender os braços.',
    ],
    dicas: ['Não deixe o quadril cair.', 'Para facilitar, apoie os joelhos ou as mãos num banco.'],
  },
  {
    id: 'paralelas_peito', nome: 'Paralelas (ênfase peito)', grupo: 'peito', secundarios: ['triceps', 'ombros'],
    equipamento: 'peso_corporal', tipo: 'composto', nivel: 2, img: 'Dips_-_Chest_Version',
    passos: [
      'Suba nas paralelas com os braços estendidos.',
      'Incline o tronco para a frente e afaste levemente os cotovelos.',
      'Desça até os ombros ficarem um pouco abaixo dos cotovelos.',
      'Empurre de volta até estender os braços.',
    ],
    dicas: ['Desça só até onde o ombro estiver confortável.', 'Use a máquina com contrapeso se ainda não fizer o peso corporal.'],
  },
  {
    id: 'pullover', nome: 'Pullover com halter', grupo: 'peito', secundarios: ['costas', 'triceps'],
    equipamento: 'halteres', tipo: 'isolado', nivel: 2, img: 'Bent-Arm_Dumbbell_Pullover',
    passos: [
      'Apoie a parte alta das costas no banco, segurando um halter com as duas mãos acima do peito.',
      'Com cotovelos levemente flexionados, leve o halter para trás da cabeça em arco.',
      'Desça até sentir alongar peito e dorsais.',
      'Volte o halter acima do peito.',
    ],
    dicas: ['Quadril pode ficar baixo para aumentar a amplitude.', 'Movimento lento e controlado.'],
  },

  // ───────────── COSTAS ─────────────
  {
    id: 'puxada_frente', nome: 'Puxada frontal aberta', grupo: 'costas', secundarios: ['biceps'],
    equipamento: 'cabo', tipo: 'composto', nivel: 1, img: 'Wide-Grip_Lat_Pulldown',
    passos: [
      'Ajuste o apoio das coxas e segure a barra com pegada aberta, palmas para a frente.',
      'Incline levemente o tronco para trás, peito para cima.',
      'Puxe a barra até a parte alta do peito, levando os cotovelos para baixo e para trás.',
      'Volte devagar até estender os braços.',
    ],
    dicas: ['Pense em "puxar com os cotovelos", não com as mãos.', 'Não jogue o tronco para trás para roubar.'],
  },
  {
    id: 'puxada_triangulo', nome: 'Puxada com triângulo', grupo: 'costas', secundarios: ['biceps'],
    equipamento: 'cabo', tipo: 'composto', nivel: 1, img: 'V-Bar_Pulldown',
    passos: [
      'Prenda o triângulo na polia alta e sente com as coxas travadas.',
      'Segure com as palmas viradas uma para a outra.',
      'Puxe até o peito, mantendo o tronco levemente inclinado.',
      'Estenda os braços devagar, alongando as costas.',
    ],
    dicas: ['Ótima variação para quem tem desconforto no ombro na pegada aberta.'],
  },
  {
    id: 'puxada_supinada', nome: 'Puxada supinada', grupo: 'costas', secundarios: ['biceps'],
    equipamento: 'cabo', tipo: 'composto', nivel: 1, img: 'Underhand_Cable_Pulldowns',
    passos: [
      'Segure a barra com as palmas viradas para você, na largura dos ombros.',
      'Puxe até a parte alta do peito, cotovelos junto ao corpo.',
      'Contraia as costas no final do movimento.',
      'Volte controlando.',
    ],
    dicas: ['Envolve mais o bíceps que a pegada aberta.'],
  },
  {
    id: 'barra_fixa', nome: 'Barra fixa (pronada)', grupo: 'costas', secundarios: ['biceps', 'abdomen'],
    equipamento: 'peso_corporal', tipo: 'composto', nivel: 3, img: 'Pullups',
    passos: [
      'Pendure-se na barra com pegada um pouco mais aberta que os ombros, palmas para a frente.',
      'Desça os ombros (afaste das orelhas) antes de puxar.',
      'Puxe até o queixo passar a barra.',
      'Desça controlando até estender os braços.',
    ],
    dicas: ['Use a máquina graviton ou elástico para assistência.', 'Evite balançar o corpo.'],
  },
  {
    id: 'barra_fixa_supinada', nome: 'Barra fixa supinada (chin-up)', grupo: 'costas', secundarios: ['biceps'],
    equipamento: 'peso_corporal', tipo: 'composto', nivel: 2, img: 'Chin-Up',
    passos: [
      'Pendure-se com as palmas viradas para você, mãos na largura dos ombros.',
      'Puxe o corpo até o queixo passar a barra.',
      'Desça devagar até estender os braços.',
    ],
    dicas: ['Geralmente mais fácil que a pronada por usar mais bíceps.'],
  },
  {
    id: 'remada_curvada', nome: 'Remada curvada com barra', grupo: 'costas', secundarios: ['biceps', 'lombar', 'ombros'],
    equipamento: 'barra', tipo: 'composto', nivel: 3, img: 'Bent_Over_Barbell_Row',
    passos: [
      'Segure a barra pronada, joelhos levemente flexionados.',
      'Incline o tronco à frente (cerca de 45°) mantendo a coluna neutra.',
      'Puxe a barra em direção ao umbigo, levando os cotovelos para trás.',
      'Desça a barra controlando até estender os braços.',
    ],
    dicas: ['Coluna neutra é obrigatória: se arredondar, reduza a carga.', 'Não use impulso do quadril.'],
  },
  {
    id: 'remada_unilateral', nome: 'Remada unilateral (serrote)', grupo: 'costas', secundarios: ['biceps', 'ombros'],
    equipamento: 'halteres', tipo: 'composto', nivel: 1, img: 'One-Arm_Dumbbell_Row',
    passos: [
      'Apoie joelho e mão do mesmo lado no banco, costas paralelas ao chão.',
      'Segure o halter com o outro braço estendido.',
      'Puxe o halter em direção ao quadril, cotovelo junto ao corpo.',
      'Desça controlando até alongar a dorsal.',
    ],
    dicas: ['Não gire o tronco para subir o peso.', 'Puxe "para o bolso", não para o ombro.'],
  },
  {
    id: 'remada_baixa', nome: 'Remada baixa sentada', grupo: 'costas', secundarios: ['biceps', 'ombros'],
    equipamento: 'cabo', tipo: 'composto', nivel: 1, img: 'Seated_Cable_Rows',
    passos: [
      'Sente com os pés apoiados e joelhos levemente flexionados, segurando o triângulo.',
      'Tronco ereto, braços estendidos à frente.',
      'Puxe o triângulo até o abdômen, juntando as escápulas.',
      'Volte devagar, deixando as escápulas se afastarem sem curvar a lombar.',
    ],
    dicas: ['Não balance o tronco para a frente e para trás.'],
  },
  {
    id: 'remada_cavalinho', nome: 'Remada cavalinho (T-bar)', grupo: 'costas', secundarios: ['biceps', 'lombar'],
    equipamento: 'barra', tipo: 'composto', nivel: 2, img: 'T-Bar_Row_with_Handle',
    passos: [
      'Posicione-se sobre a barra com os pés afastados e joelhos flexionados.',
      'Incline o tronco à frente com a coluna neutra e segure o pegador.',
      'Puxe em direção ao peito/abdômen.',
      'Desça controlando.',
    ],
    dicas: ['Mantenha o peito "aberto" e a lombar neutra.'],
  },
  {
    id: 'remada_maquina', nome: 'Remada articulada (máquina)', grupo: 'costas', secundarios: ['biceps'],
    equipamento: 'maquina', tipo: 'composto', nivel: 1, img: 'Leverage_Iso_Row',
    passos: [
      'Ajuste o banco e apoie o peito no suporte.',
      'Segure as manoplas com os braços estendidos.',
      'Puxe até as mãos ficarem ao lado do tronco.',
      'Volte devagar.',
    ],
    dicas: ['Pode ser feita unilateralmente para corrigir assimetrias.'],
  },
  {
    id: 'pulldown_braco_reto', nome: 'Pulldown com braços estendidos', grupo: 'costas', secundarios: ['triceps'],
    equipamento: 'cabo', tipo: 'isolado', nivel: 1, img: 'Straight-Arm_Pulldown',
    passos: [
      'Em pé de frente para a polia alta, segure a barra com os braços estendidos.',
      'Incline levemente o tronco à frente.',
      'Leve a barra até as coxas em arco, sem dobrar os cotovelos.',
      'Volte devagar até a altura da cabeça.',
    ],
    dicas: ['Ótimo para "sentir" a dorsal antes das puxadas.'],
  },
  {
    id: 'levantamento_terra', nome: 'Levantamento terra', grupo: 'costas', secundarios: ['posterior', 'gluteos', 'lombar', 'trapezio'],
    equipamento: 'barra', tipo: 'composto', nivel: 3, img: 'Barbell_Deadlift',
    passos: [
      'Pés na largura do quadril, barra sobre o meio dos pés.',
      'Flexione quadril e joelhos e segure a barra por fora das pernas.',
      'Coluna neutra, peito para cima, barra encostada nas canelas.',
      'Empurre o chão com os pés e estenda quadril e joelhos juntos até ficar ereto.',
      'Desça a barra pelo mesmo caminho, junto ao corpo.',
    ],
    dicas: ['Nunca arredonde a lombar.', 'A barra deve "raspar" nas pernas o tempo todo.', 'Comece leve e aprenda o padrão.'],
  },
  {
    id: 'hiperextensao', nome: 'Hiperextensão lombar (banco 45°)', grupo: 'lombar', secundarios: ['gluteos', 'posterior'],
    equipamento: 'peso_corporal', tipo: 'isolado', nivel: 1, img: 'Hyperextensions_Back_Extensions',
    passos: [
      'Ajuste o apoio na altura do quadril e prenda os tornozelos.',
      'Cruze os braços no peito.',
      'Desça o tronco flexionando o quadril.',
      'Suba até o corpo ficar em linha reta, sem hiperestender.',
    ],
    dicas: ['Segure uma anilha no peito para progredir.'],
  },

  // ───────────── OMBROS ─────────────
  {
    id: 'desenvolvimento_halter', nome: 'Desenvolvimento com halteres', grupo: 'ombros', secundarios: ['triceps'],
    equipamento: 'halteres', tipo: 'composto', nivel: 1, img: 'Dumbbell_Shoulder_Press',
    passos: [
      'Sente no banco com encosto vertical, halteres na altura dos ombros.',
      'Palmas para a frente, cotovelos levemente à frente do tronco.',
      'Empurre os halteres para cima até quase estender os braços.',
      'Desça controlando até a altura das orelhas.',
    ],
    dicas: ['Não arqueie demais a lombar.', 'Não bata os halteres no topo.'],
  },
  {
    id: 'desenvolvimento_barra', nome: 'Desenvolvimento militar com barra', grupo: 'ombros', secundarios: ['triceps', 'abdomen'],
    equipamento: 'barra', tipo: 'composto', nivel: 2, img: 'Standing_Military_Press',
    passos: [
      'Em pé, barra apoiada na parte alta do peito, pegada um pouco mais aberta que os ombros.',
      'Contraia glúteos e abdômen.',
      'Empurre a barra para cima, afastando a cabeça para trás para passar.',
      'Trave os braços acima da cabeça e desça controlando.',
    ],
    dicas: ['Não incline o tronco para trás para empurrar.'],
  },
  {
    id: 'desenvolvimento_maquina', nome: 'Desenvolvimento na máquina', grupo: 'ombros', secundarios: ['triceps'],
    equipamento: 'maquina', tipo: 'composto', nivel: 1, img: 'Machine_Shoulder_Military_Press',
    passos: [
      'Ajuste o banco para que as manoplas fiquem na altura dos ombros.',
      'Costas apoiadas, empurre até quase estender os braços.',
      'Volte devagar.',
    ],
    dicas: ['Boa opção para séries até a falha.'],
  },
  {
    id: 'arnold', nome: 'Desenvolvimento Arnold', grupo: 'ombros', secundarios: ['triceps'],
    equipamento: 'halteres', tipo: 'composto', nivel: 2, img: 'Arnold_Dumbbell_Press',
    passos: [
      'Sentado, halteres à frente do rosto com as palmas viradas para você.',
      'Enquanto empurra para cima, gire os punhos até as palmas ficarem para a frente.',
      'Estenda os braços acima da cabeça.',
      'Desça fazendo a rotação inversa.',
    ],
    dicas: ['Movimento fluido, sem pressa.'],
  },
  {
    id: 'elevacao_lateral', nome: 'Elevação lateral com halteres', grupo: 'ombros', secundarios: ['trapezio'],
    equipamento: 'halteres', tipo: 'isolado', nivel: 1, img: 'Side_Lateral_Raise',
    passos: [
      'Em pé, halteres ao lado do corpo, cotovelos levemente flexionados.',
      'Eleve os braços para os lados até a altura dos ombros.',
      'Lidere o movimento com os cotovelos, não com as mãos.',
      'Desça devagar.',
    ],
    dicas: ['Carga leve e execução perfeita rendem mais.', 'Não suba os ombros (encolher).'],
  },
  {
    id: 'elevacao_lateral_cabo', nome: 'Elevação lateral no cabo', grupo: 'ombros', secundarios: [],
    equipamento: 'cabo', tipo: 'isolado', nivel: 1, img: 'Cable_Seated_Lateral_Raise',
    passos: [
      'Polia baixa, segure a manopla com a mão oposta ao aparelho.',
      'Eleve o braço lateralmente até a altura do ombro.',
      'Desça controlando sem deixar o peso bater.',
    ],
    dicas: ['Tensão constante na parte baixa do movimento, onde o halter não trabalha.'],
  },
  {
    id: 'elevacao_frontal', nome: 'Elevação frontal com halteres', grupo: 'ombros', secundarios: ['peito'],
    equipamento: 'halteres', tipo: 'isolado', nivel: 1, img: 'Front_Dumbbell_Raise',
    passos: [
      'Em pé, halteres à frente das coxas.',
      'Eleve um ou ambos os braços à frente até a altura dos ombros.',
      'Desça devagar.',
    ],
    dicas: ['Muitas vezes desnecessária se você já faz supinos e desenvolvimentos.'],
  },
  {
    id: 'crucifixo_inverso', nome: 'Crucifixo inverso com halteres', grupo: 'ombros', secundarios: ['costas', 'trapezio'],
    equipamento: 'halteres', tipo: 'isolado', nivel: 1, img: 'Reverse_Flyes',
    passos: [
      'Incline o tronco à frente quase paralelo ao chão, halteres pendurados.',
      'Com cotovelos levemente flexionados, abra os braços para os lados.',
      'Contraia a parte de trás dos ombros no topo.',
      'Desça controlando.',
    ],
    dicas: ['Foco no deltoide posterior: não junte demais as escápulas.'],
  },
  {
    id: 'crucifixo_inverso_maquina', nome: 'Crucifixo inverso na máquina', grupo: 'ombros', secundarios: ['costas'],
    equipamento: 'maquina', tipo: 'isolado', nivel: 1, img: 'Reverse_Machine_Flyes',
    passos: [
      'Sente de frente para o encosto do voador, peito apoiado.',
      'Segure as manoplas com os braços à frente.',
      'Abra os braços para trás até ficarem alinhados com o tronco.',
      'Volte devagar.',
    ],
    dicas: ['Mantenha os ombros baixos.'],
  },
  {
    id: 'face_pull', nome: 'Face pull', grupo: 'ombros', secundarios: ['trapezio', 'costas'],
    equipamento: 'cabo', tipo: 'isolado', nivel: 1, img: 'Face_Pull',
    passos: [
      'Polia na altura do rosto com a corda.',
      'Segure a corda com as palmas para baixo e dê um passo atrás.',
      'Puxe a corda em direção ao rosto, abrindo as mãos para os lados.',
      'Volte controlando.',
    ],
    dicas: ['Excelente para saúde dos ombros e postura.'],
  },
  {
    id: 'remada_alta', nome: 'Remada alta com barra', grupo: 'ombros', secundarios: ['trapezio', 'biceps'],
    equipamento: 'barra', tipo: 'composto', nivel: 2, img: 'Upright_Barbell_Row',
    passos: [
      'Em pé, barra à frente das coxas com pegada na largura dos ombros.',
      'Puxe a barra para cima junto ao corpo, cotovelos liderando.',
      'Pare quando os cotovelos chegarem à altura dos ombros.',
      'Desça devagar.',
    ],
    dicas: ['Pegada mais aberta reduz o estresse no ombro.', 'Não suba acima da linha dos ombros.'],
  },

  // ───────────── TRAPÉZIO ─────────────
  {
    id: 'encolhimento_halter', nome: 'Encolhimento com halteres', grupo: 'trapezio', secundarios: [],
    equipamento: 'halteres', tipo: 'isolado', nivel: 1, img: 'Dumbbell_Shrug',
    passos: [
      'Em pé, halteres ao lado do corpo.',
      'Eleve os ombros em direção às orelhas.',
      'Segure 1 segundo no topo.',
      'Desça devagar.',
    ],
    dicas: ['Não gire os ombros: o movimento é só para cima e para baixo.'],
  },
  {
    id: 'encolhimento_barra', nome: 'Encolhimento com barra', grupo: 'trapezio', secundarios: [],
    equipamento: 'barra', tipo: 'isolado', nivel: 1, img: 'Barbell_Shrug',
    passos: [
      'Em pé, segure a barra à frente das coxas.',
      'Eleve os ombros o máximo que puder.',
      'Segure e desça controlando.',
    ],
    dicas: ['Use straps se a pegada falhar antes do trapézio.'],
  },

  // ───────────── BÍCEPS ─────────────
  {
    id: 'rosca_direta', nome: 'Rosca direta com barra', grupo: 'biceps', secundarios: ['antebraco'],
    equipamento: 'barra', tipo: 'isolado', nivel: 1, img: 'Barbell_Curl',
    passos: [
      'Em pé, segure a barra com as palmas para cima na largura dos ombros.',
      'Cotovelos colados ao corpo.',
      'Flexione os cotovelos levando a barra até a altura do peito.',
      'Desça devagar até estender os braços.',
    ],
    dicas: ['Não balance o tronco.', 'Cotovelos não vão para a frente.'],
  },
  {
    id: 'rosca_w', nome: 'Rosca com barra W', grupo: 'biceps', secundarios: ['antebraco'],
    equipamento: 'barra_w', tipo: 'isolado', nivel: 1, img: 'EZ-Bar_Curl',
    passos: [
      'Segure a barra W nas curvas internas, palmas para cima.',
      'Cotovelos junto ao corpo, flexione até a barra chegar perto do peito.',
      'Desça controlando.',
    ],
    dicas: ['Mais confortável para os punhos que a barra reta.'],
  },
  {
    id: 'rosca_alternada', nome: 'Rosca alternada com halteres', grupo: 'biceps', secundarios: ['antebraco'],
    equipamento: 'halteres', tipo: 'isolado', nivel: 1, img: 'Dumbbell_Alternate_Bicep_Curl',
    passos: [
      'Em pé, halteres ao lado do corpo, palmas para dentro.',
      'Suba um halter girando a palma para cima durante o movimento.',
      'Desça devagar e alterne o braço.',
    ],
    dicas: ['Gire o punho (supinação) para contrair mais o bíceps.'],
  },
  {
    id: 'rosca_martelo', nome: 'Rosca martelo', grupo: 'biceps', secundarios: ['antebraco'],
    equipamento: 'halteres', tipo: 'isolado', nivel: 1, img: 'Hammer_Curls',
    passos: [
      'Em pé, halteres ao lado do corpo, palmas viradas para dentro.',
      'Flexione os cotovelos mantendo a pegada neutra.',
      'Suba até a altura do ombro e desça devagar.',
    ],
    dicas: ['Trabalha bastante o braquial e o antebraço.'],
  },
  {
    id: 'rosca_scott', nome: 'Rosca Scott', grupo: 'biceps', secundarios: [],
    equipamento: 'barra_w', tipo: 'isolado', nivel: 1, img: 'Preacher_Curl',
    passos: [
      'Sente no banco Scott com a parte de trás dos braços apoiada.',
      'Segure a barra com as palmas para cima.',
      'Flexione até a barra chegar perto dos ombros.',
      'Desça devagar quase até estender — sem relaxar no fundo.',
    ],
    dicas: ['Cuidado na extensão final com cargas altas.'],
  },
  {
    id: 'rosca_concentrada', nome: 'Rosca concentrada', grupo: 'biceps', secundarios: [],
    equipamento: 'halteres', tipo: 'isolado', nivel: 1, img: 'Concentration_Curls',
    passos: [
      'Sente no banco, cotovelo apoiado na parte interna da coxa.',
      'Flexione o cotovelo levando o halter ao ombro.',
      'Contraia no topo e desça devagar.',
    ],
    dicas: ['Ótima para finalizar o treino de bíceps.'],
  },
  {
    id: 'rosca_inclinada', nome: 'Rosca inclinada com halteres', grupo: 'biceps', secundarios: [],
    equipamento: 'halteres', tipo: 'isolado', nivel: 1, img: 'Incline_Dumbbell_Curl',
    passos: [
      'Sente num banco inclinado (45°–60°), braços pendurados.',
      'Flexione os cotovelos sem trazê-los para a frente.',
      'Desça devagar até alongar totalmente.',
    ],
    dicas: ['Enfatiza a porção longa do bíceps pelo alongamento.'],
  },
  {
    id: 'rosca_cabo', nome: 'Rosca no cabo', grupo: 'biceps', secundarios: ['antebraco'],
    equipamento: 'cabo', tipo: 'isolado', nivel: 1, img: 'Standing_Biceps_Cable_Curl',
    passos: [
      'Polia baixa com barra reta ou W, palmas para cima.',
      'Cotovelos junto ao corpo, flexione até a barra chegar ao peito.',
      'Desça controlando.',
    ],
    dicas: ['Tensão constante em toda a amplitude.'],
  },

  // ───────────── TRÍCEPS ─────────────
  {
    id: 'triceps_pulley', nome: 'Tríceps pulley (barra)', grupo: 'triceps', secundarios: [],
    equipamento: 'cabo', tipo: 'isolado', nivel: 1, img: 'Triceps_Pushdown',
    passos: [
      'De frente para a polia alta, segure a barra com as palmas para baixo.',
      'Cotovelos colados ao corpo e fixos.',
      'Empurre a barra para baixo até estender os braços.',
      'Volte até os antebraços ficarem paralelos ao chão.',
    ],
    dicas: ['Só os antebraços se movem.'],
  },
  {
    id: 'triceps_corda', nome: 'Tríceps na corda', grupo: 'triceps', secundarios: [],
    equipamento: 'cabo', tipo: 'isolado', nivel: 1, img: 'Triceps_Pushdown_-_Rope_Attachment',
    passos: [
      'Polia alta com corda, cotovelos junto ao corpo.',
      'Estenda os braços para baixo, abrindo a corda no final.',
      'Volte controlando.',
    ],
    dicas: ['Abrir a corda no final aumenta a contração.'],
  },
  {
    id: 'triceps_testa', nome: 'Tríceps testa (barra W)', grupo: 'triceps', secundarios: [],
    equipamento: 'barra_w', tipo: 'isolado', nivel: 2, img: 'EZ-Bar_Skullcrusher',
    passos: [
      'Deite no banco com a barra W acima do peito, braços estendidos.',
      'Flexione apenas os cotovelos, levando a barra em direção à testa.',
      'Estenda os braços de volta.',
    ],
    dicas: ['Cotovelos apontando para cima, sem abrir.', 'Levar a barra um pouco atrás da cabeça alonga mais.'],
  },
  {
    id: 'triceps_frances', nome: 'Tríceps francês com halter', grupo: 'triceps', secundarios: [],
    equipamento: 'halteres', tipo: 'isolado', nivel: 1, img: 'Standing_Dumbbell_Triceps_Extension',
    passos: [
      'Sentado ou em pé, segure um halter com as duas mãos acima da cabeça.',
      'Flexione os cotovelos levando o halter atrás da cabeça.',
      'Estenda os braços de volta.',
    ],
    dicas: ['Cotovelos apontando para a frente/cima, sem abrir muito.'],
  },
  {
    id: 'triceps_overhead_corda', nome: 'Tríceps overhead na corda', grupo: 'triceps', secundarios: [],
    equipamento: 'cabo', tipo: 'isolado', nivel: 1, img: 'Cable_Rope_Overhead_Triceps_Extension',
    passos: [
      'De costas para a polia, segure a corda atrás da cabeça.',
      'Incline o tronco levemente à frente.',
      'Estenda os braços para a frente e para cima.',
      'Volte devagar alongando o tríceps.',
    ],
    dicas: ['Trabalha muito a porção longa do tríceps.'],
  },
  {
    id: 'triceps_coice', nome: 'Tríceps coice', grupo: 'triceps', secundarios: [],
    equipamento: 'halteres', tipo: 'isolado', nivel: 1, img: 'Tricep_Dumbbell_Kickback',
    passos: [
      'Incline o tronco à frente com um joelho e mão apoiados no banco.',
      'Braço colado ao corpo, cotovelo a 90°.',
      'Estenda o cotovelo levando o halter para trás.',
      'Volte devagar.',
    ],
    dicas: ['Carga leve, contração forte no final.'],
  },
  {
    id: 'supino_fechado', nome: 'Supino fechado', grupo: 'triceps', secundarios: ['peito', 'ombros'],
    equipamento: 'barra', tipo: 'composto', nivel: 2, img: 'Close-Grip_Barbell_Bench_Press',
    passos: [
      'Deite no banco e segure a barra com as mãos na largura dos ombros.',
      'Desça a barra até a parte baixa do peito com os cotovelos junto ao corpo.',
      'Empurre de volta até estender os braços.',
    ],
    dicas: ['Mãos muito juntas machucam os punhos: largura dos ombros basta.'],
  },
  {
    id: 'mergulho_banco', nome: 'Mergulho no banco', grupo: 'triceps', secundarios: ['peito', 'ombros'],
    equipamento: 'peso_corporal', tipo: 'composto', nivel: 1, img: 'Bench_Dips',
    passos: [
      'Apoie as mãos na borda de um banco atrás de você, pernas à frente.',
      'Flexione os cotovelos descendo o quadril.',
      'Pare com os cotovelos a 90° e empurre de volta.',
    ],
    dicas: ['Cotovelos apontando para trás.', 'Evite descer demais se sentir o ombro.'],
  },
  {
    id: 'paralelas_triceps', nome: 'Paralelas (ênfase tríceps)', grupo: 'triceps', secundarios: ['peito', 'ombros'],
    equipamento: 'peso_corporal', tipo: 'composto', nivel: 2, img: 'Dips_-_Triceps_Version',
    passos: [
      'Suba nas paralelas com o tronco ereto.',
      'Desça flexionando os cotovelos, mantendo-os junto ao corpo.',
      'Empurre de volta até estender os braços.',
    ],
    dicas: ['Tronco vertical enfatiza o tríceps.'],
  },

  // ───────────── QUADRÍCEPS ─────────────
  {
    id: 'agachamento_livre', nome: 'Agachamento livre', grupo: 'quadriceps', secundarios: ['gluteos', 'posterior', 'lombar'],
    equipamento: 'barra', tipo: 'composto', nivel: 3, img: 'Barbell_Squat',
    passos: [
      'Barra apoiada no trapézio, pés na largura dos ombros, pontas levemente para fora.',
      'Respire fundo e contraia o abdômen.',
      'Desça empurrando o quadril para trás e flexionando os joelhos.',
      'Desça até as coxas ficarem pelo menos paralelas ao chão.',
      'Suba empurrando o chão, mantendo o peito para cima.',
    ],
    dicas: ['Joelhos acompanham a direção das pontas dos pés.', 'Calcanhares no chão.', 'Use as travas de segurança do rack.'],
  },
  {
    id: 'agachamento_frontal', nome: 'Agachamento frontal', grupo: 'quadriceps', secundarios: ['gluteos', 'abdomen'],
    equipamento: 'barra', tipo: 'composto', nivel: 3, img: 'Front_Squat_Clean_Grip',
    passos: [
      'Barra apoiada na frente dos ombros, cotovelos altos.',
      'Pés na largura dos ombros.',
      'Desça mantendo o tronco o mais vertical possível.',
      'Suba empurrando o chão, cotovelos sempre altos.',
    ],
    dicas: ['Exige mobilidade de punho e tornozelo.'],
  },
  {
    id: 'agachamento_smith', nome: 'Agachamento no Smith', grupo: 'quadriceps', secundarios: ['gluteos'],
    equipamento: 'smith', tipo: 'composto', nivel: 1, img: 'Smith_Machine_Squat',
    passos: [
      'Barra no trapézio, pés um pouco à frente da linha da barra.',
      'Destrave e desça flexionando joelhos e quadril.',
      'Desça até as coxas ficarem paralelas ao chão.',
      'Suba empurrando o chão.',
    ],
    dicas: ['Pés mais à frente = mais glúteo; mais embaixo = mais quadríceps.'],
  },
  {
    id: 'leg_press', nome: 'Leg press 45°', grupo: 'quadriceps', secundarios: ['gluteos', 'posterior'],
    equipamento: 'maquina', tipo: 'composto', nivel: 1, img: 'Leg_Press',
    passos: [
      'Sente com as costas e o quadril bem apoiados.',
      'Pés na plataforma na largura dos ombros.',
      'Destrave e desça a plataforma flexionando os joelhos.',
      'Desça até onde o quadril não sair do banco e empurre de volta.',
    ],
    dicas: ['Não trave os joelhos no topo.', 'O quadril nunca pode descolar do banco.'],
  },
  {
    id: 'hack', nome: 'Agachamento hack', grupo: 'quadriceps', secundarios: ['gluteos'],
    equipamento: 'maquina', tipo: 'composto', nivel: 1, img: 'Hack_Squat',
    passos: [
      'Costas apoiadas no encosto, ombros sob as almofadas.',
      'Pés na plataforma na largura dos ombros.',
      'Destrave e desça flexionando os joelhos.',
      'Suba empurrando a plataforma.',
    ],
    dicas: ['Excelente para quadríceps com menos carga na coluna.'],
  },
  {
    id: 'cadeira_extensora', nome: 'Cadeira extensora', grupo: 'quadriceps', secundarios: [],
    equipamento: 'maquina', tipo: 'isolado', nivel: 1, img: 'Leg_Extensions',
    passos: [
      'Ajuste o encosto para que o joelho fique alinhado ao eixo da máquina.',
      'Rolo apoiado na parte baixa da canela.',
      'Estenda os joelhos até as pernas ficarem retas.',
      'Segure 1 segundo e desça devagar.',
    ],
    dicas: ['Segure no banco para não levantar o quadril.'],
  },
  {
    id: 'afundo', nome: 'Afundo com halteres', grupo: 'quadriceps', secundarios: ['gluteos', 'posterior'],
    equipamento: 'halteres', tipo: 'composto', nivel: 2, img: 'Dumbbell_Lunges',
    passos: [
      'Em pé com halteres ao lado do corpo.',
      'Dê um passo à frente e desça até os dois joelhos formarem 90°.',
      'Empurre com a perna da frente para voltar.',
      'Alterne as pernas.',
    ],
    dicas: ['Tronco ereto.', 'O joelho de trás quase toca o chão.'],
  },
  {
    id: 'agachamento_dividido', nome: 'Agachamento dividido (búlgaro)', grupo: 'quadriceps', secundarios: ['gluteos'],
    equipamento: 'halteres', tipo: 'composto', nivel: 2, img: 'Split_Squat_with_Dumbbells',
    passos: [
      'Uma perna à frente e a outra atrás (pode apoiar o pé de trás num banco para a versão búlgara).',
      'Segure os halteres ao lado do corpo.',
      'Desça o corpo verticalmente até a coxa da frente ficar paralela ao chão.',
      'Suba empurrando com a perna da frente. Complete as repetições e troque.',
    ],
    dicas: ['Inclinar o tronco à frente enfatiza mais o glúteo.'],
  },
  {
    id: 'passada', nome: 'Passada (avanço caminhando)', grupo: 'quadriceps', secundarios: ['gluteos', 'posterior'],
    equipamento: 'barra', tipo: 'composto', nivel: 2, img: 'Barbell_Walking_Lunge',
    passos: [
      'Barra nas costas (ou halteres nas mãos).',
      'Dê um passo longo à frente e desça.',
      'Traga a perna de trás para a frente no próximo passo.',
      'Continue caminhando alternando as pernas.',
    ],
    dicas: ['Precisa de espaço livre à frente.'],
  },
  {
    id: 'step_up', nome: 'Subida no banco (step-up)', grupo: 'quadriceps', secundarios: ['gluteos'],
    equipamento: 'halteres', tipo: 'composto', nivel: 1, img: 'Dumbbell_Step_Ups',
    passos: [
      'Halteres nas mãos, de frente para um banco ou caixa.',
      'Apoie um pé inteiro no banco.',
      'Suba empurrando com essa perna até ficar em pé no banco.',
      'Desça controlando e repita.',
    ],
    dicas: ['Evite dar impulso com a perna de baixo.'],
  },

  // ───────────── POSTERIOR ─────────────
  {
    id: 'stiff', nome: 'Stiff com barra', grupo: 'posterior', secundarios: ['gluteos', 'lombar'],
    equipamento: 'barra', tipo: 'composto', nivel: 2, img: 'Stiff-Legged_Barbell_Deadlift',
    passos: [
      'Em pé, barra à frente das coxas, joelhos levemente flexionados.',
      'Empurre o quadril para trás descendo a barra junto às pernas.',
      'Desça até sentir o alongamento forte do posterior, coluna neutra.',
      'Volte contraindo glúteos e posterior.',
    ],
    dicas: ['A amplitude é limitada pela flexibilidade, não force arredondando a lombar.'],
  },
  {
    id: 'terra_romeno', nome: 'Levantamento terra romeno', grupo: 'posterior', secundarios: ['gluteos', 'lombar'],
    equipamento: 'barra', tipo: 'composto', nivel: 2, img: 'Romanian_Deadlift',
    passos: [
      'Segure a barra em pé, joelhos levemente flexionados.',
      'Leve o quadril para trás, barra descendo rente às coxas.',
      'Pare logo abaixo dos joelhos ou quando o posterior estiver alongado.',
      'Suba projetando o quadril à frente.',
    ],
    dicas: ['Pense em "fechar uma porta com o bumbum".'],
  },
  {
    id: 'stiff_halter', nome: 'Stiff com halteres', grupo: 'posterior', secundarios: ['gluteos', 'lombar'],
    equipamento: 'halteres', tipo: 'composto', nivel: 1, img: 'Stiff-Legged_Dumbbell_Deadlift',
    passos: [
      'Halteres à frente das coxas, joelhos levemente flexionados.',
      'Desça os halteres junto às pernas levando o quadril para trás.',
      'Volte contraindo glúteos.',
    ],
    dicas: ['Mais fácil de aprender que a versão com barra.'],
  },
  {
    id: 'mesa_flexora', nome: 'Mesa flexora', grupo: 'posterior', secundarios: ['panturrilhas'],
    equipamento: 'maquina', tipo: 'isolado', nivel: 1, img: 'Lying_Leg_Curls',
    passos: [
      'Deite de bruços com o rolo logo acima dos calcanhares.',
      'Joelhos alinhados ao eixo da máquina.',
      'Flexione os joelhos levando o rolo em direção aos glúteos.',
      'Desça devagar.',
    ],
    dicas: ['Não levante o quadril do banco.'],
  },
  {
    id: 'cadeira_flexora', nome: 'Cadeira flexora', grupo: 'posterior', secundarios: [],
    equipamento: 'maquina', tipo: 'isolado', nivel: 1, img: 'Seated_Leg_Curl',
    passos: [
      'Sente com o rolo atrás dos tornozelos e trave as coxas.',
      'Flexione os joelhos puxando o rolo para baixo.',
      'Volte devagar.',
    ],
    dicas: ['Inclinar o tronco à frente aumenta o alongamento do posterior.'],
  },
  {
    id: 'flexora_em_pe', nome: 'Flexora em pé (unilateral)', grupo: 'posterior', secundarios: [],
    equipamento: 'maquina', tipo: 'isolado', nivel: 1, img: 'Standing_Leg_Curl',
    passos: [
      'Posicione o rolo atrás do tornozelo de uma perna.',
      'Flexione o joelho levando o calcanhar ao glúteo.',
      'Desça devagar. Complete e troque de perna.',
    ],
    dicas: ['Mantenha o quadril parado.'],
  },
  {
    id: 'bom_dia', nome: 'Good morning', grupo: 'posterior', secundarios: ['lombar', 'gluteos'],
    equipamento: 'barra', tipo: 'composto', nivel: 3, img: 'Good_Morning',
    passos: [
      'Barra apoiada no trapézio, pés na largura do quadril.',
      'Joelhos levemente flexionados, incline o tronco à frente levando o quadril para trás.',
      'Desça até o tronco ficar quase paralelo ao chão.',
      'Volte contraindo glúteos e posterior.',
    ],
    dicas: ['Comece muito leve: técnica exigente para a lombar.'],
  },
  {
    id: 'terra_sumo', nome: 'Levantamento terra sumô', grupo: 'posterior', secundarios: ['gluteos', 'quadriceps', 'costas'],
    equipamento: 'barra', tipo: 'composto', nivel: 3, img: 'Sumo_Deadlift',
    passos: [
      'Pés bem afastados, pontas para fora, barra sobre o meio dos pés.',
      'Segure a barra por dentro das pernas, coluna neutra.',
      'Empurre o chão afastando os joelhos e suba até ficar ereto.',
      'Desça a barra pelo mesmo caminho.',
    ],
    dicas: ['Mais glúteo e adutores, menos lombar que o terra convencional.'],
  },

  // ───────────── GLÚTEOS ─────────────
  {
    id: 'hip_thrust', nome: 'Elevação de quadril (hip thrust)', grupo: 'gluteos', secundarios: ['posterior'],
    equipamento: 'barra', tipo: 'composto', nivel: 1, img: 'Barbell_Hip_Thrust',
    passos: [
      'Apoie a parte alta das costas num banco, barra sobre o quadril (use uma almofada).',
      'Pés firmes no chão, joelhos flexionados.',
      'Eleve o quadril até o tronco ficar alinhado com as coxas.',
      'Contraia os glúteos no topo e desça controlando.',
    ],
    dicas: ['Queixo levemente para baixo.', 'Canelas na vertical no topo do movimento.'],
  },
  {
    id: 'ponte_gluteo', nome: 'Ponte de glúteo com barra', grupo: 'gluteos', secundarios: ['posterior'],
    equipamento: 'barra', tipo: 'isolado', nivel: 1, img: 'Barbell_Glute_Bridge',
    passos: [
      'Deitado no chão, barra sobre o quadril, joelhos flexionados.',
      'Eleve o quadril contraindo os glúteos.',
      'Segure no topo e desça.',
    ],
    dicas: ['Amplitude menor que o hip thrust, mas fácil de montar.'],
  },
  {
    id: 'gluteo_cabo', nome: 'Glúteo no cabo (coice)', grupo: 'gluteos', secundarios: ['posterior'],
    equipamento: 'cabo', tipo: 'isolado', nivel: 1, img: 'One-Legged_Cable_Kickback',
    passos: [
      'Prenda a caneleira no tornozelo na polia baixa.',
      'Segure no aparelho e incline levemente o tronco.',
      'Leve a perna para trás estendendo o quadril.',
      'Volte controlando. Complete e troque.',
    ],
    dicas: ['Não arqueie a lombar para levar a perna mais alto.'],
  },
  {
    id: 'abdutora', nome: 'Cadeira abdutora', grupo: 'gluteos', secundarios: [],
    equipamento: 'maquina', tipo: 'isolado', nivel: 1, img: 'Thigh_Abductor',
    passos: [
      'Sente na máquina com as almofadas por fora dos joelhos.',
      'Afaste as pernas o máximo que conseguir.',
      'Volte devagar.',
    ],
    dicas: ['Inclinar o tronco à frente enfatiza o glúteo máximo.'],
  },
  {
    id: 'adutora', nome: 'Cadeira adutora', grupo: 'quadriceps', secundarios: [],
    equipamento: 'maquina', tipo: 'isolado', nivel: 1, img: 'Thigh_Adductor',
    passos: [
      'Sente com as almofadas por dentro dos joelhos.',
      'Feche as pernas contraindo a parte interna das coxas.',
      'Volte devagar.',
    ],
    dicas: ['Trabalha os adutores (parte interna da coxa).'],
  },

  // ───────────── PANTURRILHAS ─────────────
  {
    id: 'panturrilha_em_pe', nome: 'Panturrilha em pé', grupo: 'panturrilhas', secundarios: [],
    equipamento: 'maquina', tipo: 'isolado', nivel: 1, img: 'Standing_Calf_Raises',
    passos: [
      'Ombros sob as almofadas, pontas dos pés na plataforma.',
      'Desça os calcanhares o máximo possível.',
      'Suba na ponta dos pés o mais alto que puder.',
      'Segure 1 segundo no topo.',
    ],
    dicas: ['Pause no alongamento: panturrilha responde a amplitude total.'],
  },
  {
    id: 'panturrilha_sentado', nome: 'Panturrilha sentado', grupo: 'panturrilhas', secundarios: [],
    equipamento: 'maquina', tipo: 'isolado', nivel: 1, img: 'Seated_Calf_Raise',
    passos: [
      'Sente com as almofadas sobre as coxas, pontas dos pés na plataforma.',
      'Desça os calcanhares e suba o máximo possível.',
    ],
    dicas: ['Enfatiza o sóleo.'],
  },
  {
    id: 'panturrilha_leg', nome: 'Panturrilha no leg press', grupo: 'panturrilhas', secundarios: [],
    equipamento: 'maquina', tipo: 'isolado', nivel: 1, img: 'Calf_Press_On_The_Leg_Press_Machine',
    passos: [
      'No leg press, apoie só as pontas dos pés na borda inferior da plataforma.',
      'Joelhos estendidos (sem travar).',
      'Empurre com as pontas dos pés e volte alongando.',
    ],
    dicas: ['Mantenha a trava de segurança acessível.'],
  },

  // ───────────── ABDÔMEN ─────────────
  {
    id: 'abdominal_supra', nome: 'Abdominal supra (crunch)', grupo: 'abdomen', secundarios: [],
    equipamento: 'peso_corporal', tipo: 'isolado', nivel: 1, img: 'Crunches',
    passos: [
      'Deitado, joelhos flexionados, mãos atrás da cabeça ou no peito.',
      'Enrole o tronco tirando as escápulas do chão.',
      'Desça devagar.',
    ],
    dicas: ['Não puxe o pescoço com as mãos.'],
  },
  {
    id: 'abdominal_cabo', nome: 'Abdominal no cabo (ajoelhado)', grupo: 'abdomen', secundarios: [],
    equipamento: 'cabo', tipo: 'isolado', nivel: 1, img: 'Cable_Crunch',
    passos: [
      'Ajoelhe de frente para a polia alta, segurando a corda junto à cabeça.',
      'Flexione o tronco levando os cotovelos em direção aos joelhos.',
      'Volte devagar.',
    ],
    dicas: ['O quadril não se move: quem trabalha é o abdômen.'],
  },
  {
    id: 'prancha', nome: 'Prancha', grupo: 'abdomen', secundarios: ['ombros'],
    equipamento: 'peso_corporal', tipo: 'isolado', nivel: 1, img: 'Plank', porTempo: true,
    passos: [
      'Apoie os antebraços e as pontas dos pés no chão.',
      'Corpo em linha reta da cabeça aos calcanhares.',
      'Contraia abdômen e glúteos e segure a posição.',
    ],
    dicas: ['Não deixe o quadril cair nem subir demais.'],
  },
  {
    id: 'elevacao_pernas', nome: 'Elevação de pernas na barra', grupo: 'abdomen', secundarios: [],
    equipamento: 'peso_corporal', tipo: 'isolado', nivel: 2, img: 'Hanging_Leg_Raise',
    passos: [
      'Pendure-se na barra com os braços estendidos.',
      'Eleve as pernas (estendidas ou flexionadas) até a altura do quadril ou mais.',
      'Desça devagar sem balançar.',
    ],
    dicas: ['Versão mais fácil: joelhos flexionados.'],
  },
  {
    id: 'abdominal_maquina', nome: 'Abdominal na máquina', grupo: 'abdomen', secundarios: [],
    equipamento: 'maquina', tipo: 'isolado', nivel: 1, img: 'Ab_Crunch_Machine',
    passos: [
      'Ajuste a máquina e segure as manoplas.',
      'Flexione o tronco contraindo o abdômen.',
      'Volte devagar.',
    ],
    dicas: ['Permite progressão de carga no abdômen.'],
  },
  {
    id: 'abdominal_infra', nome: 'Abdominal infra (reverse crunch)', grupo: 'abdomen', secundarios: [],
    equipamento: 'peso_corporal', tipo: 'isolado', nivel: 1, img: 'Reverse_Crunch',
    passos: [
      'Deitado, joelhos flexionados a 90° e pernas no ar.',
      'Leve os joelhos em direção ao peito tirando o quadril do chão.',
      'Desça devagar.',
    ],
    dicas: ['Controle a descida, sem jogar as pernas.'],
  },
  {
    id: 'russian_twist', nome: 'Rotação russa', grupo: 'abdomen', secundarios: [],
    equipamento: 'peso_corporal', tipo: 'isolado', nivel: 1, img: 'Russian_Twist',
    passos: [
      'Sentado, tronco inclinado para trás e pés levemente elevados.',
      'Gire o tronco de um lado para o outro (pode segurar um peso).',
    ],
    dicas: ['Conte cada lado como uma repetição.'],
  },
  {
    id: 'roda_abdominal', nome: 'Roda abdominal (rollout)', grupo: 'abdomen', secundarios: ['costas', 'ombros'],
    equipamento: 'barra', tipo: 'isolado', nivel: 3, img: 'Barbell_Ab_Rollout',
    passos: [
      'Ajoelhado, segure a roda ou uma barra com anilhas.',
      'Role à frente estendendo o corpo, mantendo o abdômen contraído.',
      'Vá até onde conseguir sem arquear a lombar e volte.',
    ],
    dicas: ['Avançado: comece com amplitude curta.'],
  },
  {
    id: 'prancha_lateral', nome: 'Prancha lateral', grupo: 'abdomen', secundarios: [],
    equipamento: 'peso_corporal', tipo: 'isolado', nivel: 1, img: 'Side_Bridge', porTempo: true,
    passos: [
      'Deite de lado apoiado no antebraço.',
      'Eleve o quadril deixando o corpo em linha reta.',
      'Segure o tempo determinado e troque de lado.',
    ],
    dicas: ['Trabalha oblíquos e estabilizadores.'],
  },
  {
    id: 'pallof', nome: 'Pallof press', grupo: 'abdomen', secundarios: [],
    equipamento: 'cabo', tipo: 'isolado', nivel: 1, img: 'Pallof_Press',
    passos: [
      'De lado para a polia na altura do peito, segure a manopla junto ao peito.',
      'Empurre as mãos à frente resistindo à rotação.',
      'Segure 2 segundos e volte. Complete e troque de lado.',
    ],
    dicas: ['Exercício antirrotação: o tronco não pode girar.'],
  },

  // ───────────── ANTEBRAÇO ─────────────
  {
    id: 'rosca_punho', nome: 'Rosca de punho', grupo: 'antebraco', secundarios: [],
    equipamento: 'barra', tipo: 'isolado', nivel: 1, img: 'Seated_Palm-Up_Barbell_Wrist_Curl',
    passos: [
      'Sentado, antebraços apoiados nas coxas, palmas para cima.',
      'Deixe a barra descer até a ponta dos dedos.',
      'Flexione os punhos subindo a barra.',
    ],
    dicas: ['Carga leve e muitas repetições.'],
  },
  {
    id: 'rosca_inversa', nome: 'Rosca inversa', grupo: 'antebraco', secundarios: ['biceps'],
    equipamento: 'barra', tipo: 'isolado', nivel: 1, img: 'Reverse_Barbell_Curl',
    passos: [
      'Em pé, segure a barra com as palmas para baixo.',
      'Flexione os cotovelos levando a barra até o peito.',
      'Desça devagar.',
    ],
    dicas: ['Trabalha braquiorradial e extensores do punho.'],
  },
];

export const EXERCISE_MAP: Record<string, Exercise> = Object.fromEntries(EXERCISES.map((e) => [e.id, e]));
