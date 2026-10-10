# Agente Tracker — Demo

Painel de acompanhamento de agentes de atendimento em cima do Chatwoot. Ele monitora os casos de cada agente, cobra pendências pelo Telegram e gera relatórios.

> **Esta é uma versão de demonstração.** Todos os dados (agentes, clientes, conversas) são **fictícios** e gerados no navegador. Não há servidor, banco de dados nem conexão com nenhum sistema real.

## O que o sistema faz

- **Ranking e Casos:** classifica as conversas abertas de cada agente em 4 estados: 🔴 Ignorado (o cliente falou e ninguém respondeu), 🟡 Aguardando, 💤 Parado (sem movimento há N dias) e 🟢 Em andamento.
- **Histórico e Jornada:** mostra as mensagens por dia, o horário da primeira e da última mensagem, o almoço identificado automaticamente e os intervalos sem atividade.
- **Sem atividade:** aponta agentes sem mensagens ou que sumiram durante o horário comercial.
- **Fila e Duplicados:** mostra os casos novos por dia e por time, e os clientes com mais de uma conversa aberta.
- **Telegram e Autônomo:** um bot que vincula agentes e dispara cobranças agendadas por tipo de pendência, além de relatórios diários e alertas de inatividade para os admins.
- **Relatórios:** exportação em Excel (desativada na demo).

## Arquitetura da versão real

```
Chatwoot (PostgreSQL) ──► Node.js / Express ──► API REST /api/* ──► Front-end (HTML/CSS/JS)
                                │
                                ├── Agendador (cron) → cobranças e relatórios
                                ├── Bot Telegram (node-telegram-bot-api)
                                ├── Relatórios Excel (ExcelJS)
                                └── Login Google OAuth restrito ao domínio da empresa
```

Na demo, o arquivo `js/api.js` mantém a mesma interface (`API.get/post/del`), mas responde com dados simulados em vez de chamar o servidor. Por isso o front-end é exatamente o mesmo.

## Rodar localmente

É só abrir com qualquer servidor estático:

```bash
npx serve .
```

## Publicar

- **Vercel:** importe o repositório, framework "Other", sem build.
- **GitHub Pages:** Settings → Pages → branch `main`, pasta raiz.
