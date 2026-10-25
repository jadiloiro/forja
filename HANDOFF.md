# Handoff: Setup do ambiente de desenvolvimento do Forja

**Generated**: 2026-10-25
**Branch**: main
**Status**: Ready for Review

## Goal

Preparar do zero o ambiente de desenvolvimento desta máquina (Windows) para o app Forja (Expo/React Native) e publicar o código no GitHub.

## Completed

- [x] Repositório remoto `jadiloiro/forja` criado no GitHub e sincronizado com o código local de `forjafit` (histórico mesclado — ver seção "Key Decisions")
- [x] Node.js LTS (v24.22.1), Git (2.56.0.3) e GitHub CLI (2.103.2) instalados/atualizados via `winget`
- [x] Git configurado globalmente: `user.name = jadiloiro`, `user.email = jadielga13@gmail.com`
- [x] `gh auth login` concluído — autenticado como `jadiloiro` (escopos `gist`, `read:org`, `repo`)
- [x] `npm install` executado com sucesso em `forjafit` (node_modules instalado)
- [x] Servidor de desenvolvimento validado: `npx expo start --web` sobe corretamente em `http://localhost:8081`
- [x] Plugins do Claude Code instalados: `expo`, `frontend-design`, `impeccable`, `handoff` (marketplaces: `claude-plugins-official`, `impeccable`, `handoff-marketplace`)

## Not Yet Done

- [ ] Nenhuma feature do app foi implementada ou revisada nesta sessão — foi só setup de ambiente/infra
- [ ] Decidir se a mudança automática em `tsconfig.json` (ver abaixo) deve ser commitada

## Failed Approaches (Don't Repeat These)

- `winget install OpenJS.NodeJS.LTS` falhou na primeira tentativa com erro MSI 1603 — causa provável: o prompt de elevação (UAC) não foi aprovado a tempo. Repetir o comando e aprovar o UAC quando aparecer resolveu.
- Rodar `node`/`npx` direto no Bash (Git Bash) ou em uma nova sessão do PowerShell **não funciona** logo após a instalação: o processo do shell já estava aberto antes da instalação e não relê o PATH do Windows automaticamente. Workaround usado: prefixar o PATH manualmente em cada comando (`$env:Path = "C:\Program Files\nodejs;" + $env:Path` no PowerShell, ou `export PATH="/c/Program Files/nodejs:$PATH"` no Bash). Uma sessão de terminal nova (fora do Claude Code) deve pegar o PATH atualizado normalmente.
- Primeira tentativa de `npx expo start --web` falhou com `ConfigError: Cannot determine the project's Expo SDK version` porque `node_modules` não existia ainda — resolvido rodando `npm install` antes.

## Key Decisions

| Decision | Rationale |
|----------|-----------|
| Mesclar histórico do GitHub em vez de force-push | O repo remoto `jadiloiro/forja` já tinha um commit inicial automático (README/LICENSE placeholder do GitHub). Optei por `git fetch` + `git merge origin/main --allow-unrelated-histories`, resolvendo os conflitos de `LICENSE` e `README.md` mantendo a versão local (conteúdo real do projeto), em vez de sobrescrever o remoto. |
| gh auth login via `--web` | Permite login não-interativo a partir de um processo em background: o comando imprime um código de uso único e a URL `https://github.com/login/device`, e o usuário aprova no navegador. |

## Current State

**Working**: Node/Git/GitHub CLI instalados e configurados; repositório clonado e sincronizado com `origin/main`; `npm install` ok; `npx expo start --web` sobe sem erros em `http://localhost:8081`.

**Broken**: Nada identificado nesta sessão (não houve revisão de funcionalidades do app).

**Uncommitted Changes**: `tsconfig.json` foi modificado automaticamente pelo Expo/TypeScript ao rodar o dev server (adicionou a propriedade `include`):
```diff
   "extends": "expo/tsconfig.base",
   "compilerOptions": {
     "strict": true
-  }
+  },
+  "include": [
+    "**/*.ts",
+    "**/*.tsx",
+    ".expo/types/**/*.ts",
+    "expo-env.d.ts"
+  ]
 }
```
Essa mudança é um comportamento normal/esperado do Expo Router (gera tipos automaticamente) e provavelmente deve ser commitada, mas ainda não foi.

## Files to Know

| File | Why It Matters |
|------|----------------|
| `package.json` | Scripts: `start`, `android`, `ios`, `web` (`expo start --web`), `typecheck`, `lint`, `build:apk` |
| `AGENTS.md` | Instruções específicas do projeto para agentes de IA — ler antes de tocar em qualquer API do Expo/EAS (SDK muda rápido; sempre checar `docs.expo.dev/versions/v<major>.0.0/`) |
| `tsconfig.json` | Tem a mudança não commitada descrita acima |
| `src/app/` | Root do Expo Router — cada arquivo aqui é uma rota/tela |

## Resume Instructions

1. Se for uma máquina/sessão nova, abra um terminal novo (não reaproveite um Git Bash/PowerShell que já estava aberto antes da instalação do Node) para garantir que `node`/`npx` estejam no PATH.
2. Entre em `C:\FORJA\forjafit`.
3. Rode `npx expo start --web`.
   - Esperado: log mostra `Waiting on http://localhost:8081` e o navegador abre o app.
   - Se der `ConfigError`/módulo `expo` não encontrado: rode `npm install` primeiro.
4. Decidir sobre o diff pendente em `tsconfig.json` (commitar ou descartar) antes de seguir com novas features.

## Setup Required

- Node.js LTS instalado (`C:\Program Files\nodejs`)
- GitHub CLI autenticado (`gh auth status` deve mostrar `jadiloiro`)
- Remoto `origin` configurado para `https://github.com/jadiloiro/forja.git`

## Warnings

- O diretório de trabalho real do projeto é `C:\FORJA\forjafit` (com `.git` próprio), **não** `C:\FORJA` (que é só a pasta-mãe, sem repositório git).
