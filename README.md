# Forja — treino e nutrição

App Android (Expo / React Native) para montar, executar e acompanhar treinos de academia e controlar a alimentação. Tudo fica salvo no próprio celular, sem conta e sem servidor.

## O que o app faz

**Treino**
- Questionário inicial (objetivo, nível, dias por semana, tempo por treino, prioridades) que **gera o plano sozinho**: Full body, Push/Pull/Legs, Superior/Inferior, híbrido ou ABCDE, conforme os dias e o nível.
- Séries, repetições e descanso definidos pelo objetivo (hipertrofia, força, emagrecimento, manutenção). Músculos prioritários ganham uma série extra.
- **Controle total do plano**: renomear, adicionar/remover/duplicar/reordenar treinos e exercícios, trocar exercício (com alternativas recomendadas), ajustar séries, faixa de repetições, descanso e notas. Vários planos salvos, um ativo.
- **95 exercícios de academia** com demonstração animada (posição inicial ↔ final, com controle de velocidade), passo a passo em português e erros comuns. Dá para criar exercícios personalizados.
- **Execução do treino**: carga e repetições da última vez ao lado de cada série, sugestão automática de progressão (dupla progressão), tipos de série (aquecimento, drop-set, até a falha), timer de descanso com vibração, troca/adição de exercício no meio do treino e tela sempre acesa.
- **Progresso**: histórico, recordes pessoais com 1RM estimado, gráfico de evolução por exercício, volume semanal, séries por músculo e peso corporal.

**Nutrição**
- Metas de calorias e macros calculadas pelo perfil (Mifflin-St Jeor + nível de atividade + treinos) e reajustadas quando você registra um novo peso. Também dá para definir manualmente.
- Diário por refeição com **~600 alimentos da Tabela TACO** (valores brasileiros) + suplementos comuns, porções caseiras, alimentos personalizados a partir do rótulo, "repetir de ontem" e controle de água.

**Dados**
- Backup/restauração em JSON pela tela de Perfil.

## Rodar no computador

Requisitos: Node 20+ e o app **Expo Go** não serve (o projeto usa módulos nativos); use um emulador Android ou um celular com depuração USB.

```bash
npm install
npx expo run:android      # compila e instala no emulador/celular conectado
```

Para iterar só na interface pelo navegador: `npx expo start --web`.

## Gerar o APK

### Opção 1 — GitHub Actions (automático, recomendado)

O workflow `.github/workflows/android-apk.yml` compila o APK a cada push na `main`:

1. Suba o projeto para um repositório no GitHub.
2. Abra a aba **Actions** → execução "Gerar APK Android" → baixe o artefato **forja-apk**.
3. Para criar uma Release com o APK anexado, crie uma tag: `git tag v1.0.0 && git push --tags`.

No celular, abra o `.apk` e permita "instalar apps de fontes desconhecidas".

### Opção 2 — na sua máquina

Requer JDK 17 e Android SDK (Android Studio).

```bash
npm install
npm run build:apk
# APK em android/app/build/outputs/apk/release/app-release.apk
```

### Opção 3 — EAS Build (nuvem da Expo)

```bash
npx eas-cli@latest build -p android --profile apk
```

### Sobre a assinatura

Por padrão o APK de release é assinado com a chave de debug que vem no template do Expo. Serve para uso pessoal e permite atualizar o app instalando um APK novo por cima. Para publicar na Play Store, gere uma chave própria (ou use o EAS, que gerencia a chave por você).

## Estrutura

```
src/
  app/                 telas (Expo Router)
    (tabs)/            Hoje, Treinos, Exercícios, Nutrição, Progresso
    sessao.tsx         execução do treino
    dia/[planId]/[dayId].tsx   editor de treino
  components/          UI, gráficos, demonstração dos exercícios, timer
  data/                exercícios, imagens, alimentos (TACO)
  lib/                 gerador de plano, progressão, cálculos de nutrição
  store/useStore.ts    estado global persistido (Zustand + AsyncStorage)
scripts/               scripts que geram as imagens e a base de alimentos
```

Mudar ou ampliar o banco de exercícios: edite `src/data/exercises.ts` (o campo `img` é o nome da pasta no Free Exercise DB) e rode `python3 scripts/fetch_exercise_images.py`. As regras de geração de plano ficam em `src/lib/generator.ts`.

## Créditos

- Imagens dos exercícios: [Free Exercise DB](https://github.com/yuhonas/free-exercise-db) (domínio público / Unlicense).
- Composição dos alimentos: TACO – Tabela Brasileira de Composição de Alimentos (NEPA/UNICAMP), via [taco-api](https://github.com/raulfdm/taco-api).

As estimativas do app não substituem a orientação de um profissional de educação física ou nutricionista.
