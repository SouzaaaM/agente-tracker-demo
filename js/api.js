// public/js/api.js — VERSÃO DEMO
// ─────────────────────────────────────────────────────────────────────────────
// Na versão real, este arquivo faz fetch() para /api/... (Express + PostgreSQL
// do Chatwoot). Nesta demo, a MESMA interface (API.get / API.post / API.del)
// responde com dados FICTÍCIOS gerados no navegador, sem servidor e sem banco.
// Nenhum dado real de clientes, agentes ou empresa é usado.
// ─────────────────────────────────────────────────────────────────────────────

const DEMO = (() => {
  // Gerador pseudo-aleatório com semente → dados iguais a cada recarga
  let seed = 20261010;
  const rnd = () => { seed = (seed * 1664525 + 1013904223) % 4294967296; return seed / 4294967296; };
  const int = (a, b) => a + Math.floor(rnd() * (b - a + 1));
  const pick = arr => arr[Math.floor(rnd() * arr.length)];

  const MIN = 60000, HORA = 60 * MIN, DIA = 24 * HORA;
  const agora = () => Date.now();
  const iso = ms => new Date(ms).toISOString();
  const ymd = d => {
    const x = new Date(d);
    return x.getFullYear() + '-' + String(x.getMonth() + 1).padStart(2, '0') + '-' + String(x.getDate()).padStart(2, '0');
  };
  const DIAS_SEMANA = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

  const TIMES = ['Suporte', 'Retenção', 'Financeiro', 'Pós-venda'];

  // ── Agentes fictícios ──────────────────────────────────────────────────────
  const NOMES_AG = [
    'Ana Ribeiro', 'Bruno Carvalho', 'Camila Duarte', 'Diego Nogueira', 'Elaine Prado',
    'Felipe Moura', 'Gabriela Lins', 'Henrique Sales', 'Isabela Rocha', 'João Teixeira',
  ];
  const slug = n => n.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\s+/g, '.');
  const agentes = NOMES_AG.map((name, i) => ({
    id: 101 + i,
    name,
    email: slug(name) + '@empresa-demo.com',
    time: TIMES[i % TIMES.length],
    incluir_relatorios: i !== 9,
    perfil: rnd(), // 0 = muito atento, 1 = deixa muita coisa parada
  }));

  // ── Clientes e casos fictícios ────────────────────────────────────────────
  const PRIMEIROS = ['Mariana', 'Carlos', 'Fernanda', 'Rafael', 'Juliana', 'Lucas', 'Patrícia', 'Thiago',
    'Beatriz', 'André', 'Larissa', 'Gustavo', 'Vanessa', 'Rodrigo', 'Aline', 'Marcelo', 'Renata', 'Paulo',
    'Letícia', 'Eduardo', 'Natália', 'Vinícius', 'Cristina', 'Leonardo', 'Sabrina', 'Fábio'];
  const SOBRENOMES = ['Silva', 'Souza', 'Oliveira', 'Pereira', 'Costa', 'Almeida', 'Gomes', 'Martins',
    'Araújo', 'Barbosa', 'Cardoso', 'Freitas', 'Mendes', 'Castro', 'Pinto', 'Vieira'];

  const MSGS_CLIENTE = [
    'Oi, ainda não recebi meu pedido, consegue verificar?',
    'Quero cancelar a assinatura, como faço?',
    'Fui cobrado duas vezes no cartão.',
    'Preciso do código de rastreio, por favor.',
    'O produto chegou com defeito.',
    'Vocês conseguem trocar o endereço de entrega?',
    'Não consigo acessar minha conta.',
    'Quando cai o reembolso?',
    'Olá? Alguém aí?',
    'Mandei o comprovante ontem, deu certo?',
  ];
  const MSGS_AGENTE = [
    'Oi! Já verifiquei aqui e o pedido saiu para entrega hoje.',
    'Certo, já solicitei o reembolso. Prazo de até 7 dias úteis.',
    'Pode me enviar o número do pedido, por favor?',
    'Atualizei o endereço, tudo certo por aqui.',
    'Te enviei o link de rastreio por e-mail.',
    'Vou encaminhar para o financeiro e te retorno.',
    'Consegue mandar uma foto do produto?',
    'Prontinho! Qualquer coisa estou à disposição.',
  ];

  let proxDisplayId = 48210;
  const casos = []; // cada caso: dados crus; a "situação" é calculada na hora

  agentes.forEach(ag => {
    const qtd = int(6, 22);
    for (let i = 0; i < qtd; i++) {
      const cliente = pick(PRIMEIROS) + ' ' + pick(SOBRENOMES);
      // Agentes com perfil alto deixam mais casos sem resposta
      const doCliente = rnd() < 0.25 + ag.perfil * 0.4;
      // Distribui o tempo desde a última msg entre minutos e vários dias
      const faixa = rnd();
      let minutos;
      if (faixa < 0.35) minutos = int(5, 180);
      else if (faixa < 0.6) minutos = int(180, 1440);
      else if (faixa < 0.85) minutos = int(1440, 4 * 1440);
      else minutos = int(4 * 1440, 16 * 1440);

      const categoria = rnd() < 0.45 ? 'ClickBank' : rnd() < 0.8 ? 'Orgânico' : 'IA';
      casos.push({
        display_id: proxDisplayId++,
        agente_id: ag.id,
        cliente,
        cliente_email: rnd() < 0.8 ? slug(cliente) + int(1, 99) + '@email-ficticio.com' : '',
        cliente_telefone: '+55 11 9' + int(1000, 9999) + '-' + int(1000, 9999),
        time_nome: rnd() < 0.8 ? ag.time : pick(TIMES),
        categoria,
        minutos_base: minutos,
        criado_em_ms: agora() - minutos * MIN,
        ultima_msg_de: doCliente ? 'Contact' : 'User',
        preview: doCliente ? pick(MSGS_CLIENTE) : pick(MSGS_AGENTE),
        cobrado: rnd() < 0.15 ? pick(['09:30', '11:00', '14:30', '16:00']) : null,
        cobrado_tipo: pick(['parado', 'aguardando', 'ignorado']),
      });
    }
  });

  // Regras de situação (mesma lógica da versão real, simplificada):
  //  • cliente falou por último há < 4h  → aguardando
  //  • cliente falou por último há ≥ 4h  → ignorado
  //  • agente falou por último há ≥ N dias (filtro "Parado há") → parado
  //  • agente falou por último há menos que isso → em andamento
  function situacao(c, paradoDias) {
    if (c.ultima_msg_de === 'Contact') return c.minutos_base < 240 ? 'aguardando' : 'ignorado';
    return c.minutos_base >= paradoDias * 1440 ? 'parado' : 'em_andamento';
  }

  function casoPublico(c, paradoDias) {
    return {
      display_id: c.display_id,
      cliente: c.cliente,
      cliente_email: c.cliente_email,
      cliente_telefone: c.cliente_telefone,
      time_nome: c.time_nome,
      categoria: c.categoria,
      situacao: situacao(c, paradoDias),
      minutos_desde_ultima: c.minutos_base,
      ultima_em: iso(agora() - c.minutos_base * MIN),
      ultima_msg_de: c.ultima_msg_de,
      preview: c.preview,
      chatwoot_url: null,
      notas: notas[c.display_id] || [],
      badge_cobrado_hora: c.cobrado,
      badge_cobrado_tipo: c.cobrado ? c.cobrado_tipo : null,
    };
  }

  function contagem(agId, paradoDias) {
    const r = { ignorados: 0, parados: 0, aguardando: 0, em_andamento: 0, total: 0 };
    casos.filter(c => c.agente_id === agId).forEach(c => {
      const s = situacao(c, paradoDias);
      if (s === 'ignorado') r.ignorados++;
      else if (s === 'parado') r.parados++;
      else if (s === 'aguardando') r.aguardando++;
      else r.em_andamento++;
      r.total++;
    });
    return r;
  }

  // ── Notas (em memória) ────────────────────────────────────────────────────
  const notas = {};
  casos.slice(0, 40).forEach(c => {
    if (rnd() < 0.3) {
      notas[c.display_id] = [{
        id: 'n' + c.display_id,
        texto: pick(['Cliente pediu retorno por e-mail.', 'Aguardando confirmação do financeiro.', 'Cobrado no Telegram, agente vai responder.']),
        criado_em: iso(agora() - int(1, 48) * HORA),
        automatica: rnd() < 0.4,
      }];
    }
  });

  // ── Mensagens por dia (histórico) ─────────────────────────────────────────
  const msgsDia = {}; // `${agId}|${ymd}` → { mensagens, conversas }
  function diaInfo(agId, data) {
    const k = agId + '|' + ymd(data);
    if (!msgsDia[k]) {
      const dow = new Date(data).getDay();
      const ag = agentes.find(a => a.id === agId);
      const base = dow === 0 || dow === 6 ? int(0, 6) : int(18, 70) * (1.15 - (ag ? ag.perfil : 0.5) * 0.5);
      const mensagens = rnd() < 0.05 ? 0 : Math.round(base);
      msgsDia[k] = { mensagens, conversas: Math.round(mensagens / (2 + rnd() * 2)) };
    }
    return msgsDia[k];
  }

  // ── Jornada (horários de mensagens do dia) ────────────────────────────────
  function jornadaDia(agId, data) {
    const d = new Date(data);
    const info = diaInfo(agId, d);
    const dow = d.getDay();
    const hojeYmd = ymd(agora());
    const futuro = ymd(d) > hojeYmd;
    if (futuro || info.mensagens === 0 || dow === 0 || dow === 6) {
      return { dia: ymd(d), dia_semana: DIAS_SEMANA[dow], total_mensagens: 0, horarios: [], periodos: [] };
    }
    const inicio = new Date(d); inicio.setHours(8, int(45, 75), 0, 0);
    const fim = new Date(d); fim.setHours(17, int(40, 80), 0, 0);
    const almocoIni = new Date(d); almocoIni.setHours(12, int(15, 50), 0, 0);
    const almocoFim = new Date(almocoIni.getTime() + int(55, 80) * MIN);
    const temBuraco = rnd() < 0.45;
    const buracoIni = new Date(d); buracoIni.setHours(15, int(0, 30), 0, 0);
    const buracoFim = new Date(buracoIni.getTime() + int(45, 95) * MIN);

    const tempos = [];
    const n = info.mensagens;
    let tentativas = 0;
    while (tempos.length < n && tentativas < 5000) {
      tentativas++;
      const t = inicio.getTime() + rnd() * (fim - inicio);
      if (t > almocoIni && t < almocoFim) continue;
      if (temBuraco && t > buracoIni && t < buracoFim) continue;
      tempos.push(t);
    }
    tempos.sort((a, b) => a - b);
    tempos[0] = inicio.getTime();
    const hora = t => new Date(t).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    const periodos = [{ tipo: 'almoco', inicio: iso(almocoIni), fim: iso(almocoFim), minutos: Math.round((almocoFim - almocoIni) / MIN) }];
    if (temBuraco) periodos.push({ tipo: 'buraco', inicio: iso(buracoIni), fim: iso(buracoFim), minutos: Math.round((buracoFim - buracoIni) / MIN) });
    return {
      dia: ymd(d),
      dia_semana: DIAS_SEMANA[dow],
      total_mensagens: tempos.length,
      primeira: iso(tempos[0]),
      ultima: iso(tempos[tempos.length - 1]),
      periodos,
      horarios: tempos.map(t => ({ hora: hora(t) })),
    };
  }

  // ── Duplicados ────────────────────────────────────────────────────────────
  const duplicados = [];
  for (let i = 0; i < 9; i++) {
    const cliente = pick(PRIMEIROS) + ' ' + pick(SOBRENOMES);
    const total = int(2, 4);
    const convs = [];
    for (let j = 0; j < total; j++) {
      const ag = rnd() < 0.2 ? null : pick(agentes);
      convs.push({
        display_id: 47000 + i * 10 + j,
        agente: ag ? ag.name : '(sem agente)',
        time: ag ? ag.time : pick(TIMES),
        criada_em: iso(agora() - int(1, 20) * DIA),
        chatwoot_url: null,
      });
    }
    duplicados.push({
      contact_id: 9000 + i,
      cliente,
      email: slug(cliente) + '@email-ficticio.com',
      telefone: '',
      total_conversas: total,
      _convs: convs,
    });
  }
  duplicados.sort((a, b) => b.total_conversas - a.total_conversas);

  // ── Telegram ──────────────────────────────────────────────────────────────
  let vinculados = agentes.slice(0, 7).map((a, i) => ({
    agente_id: a.id,
    agente_nome: a.name,
    nome_telegram: a.name.split(' ')[0],
    username: null, // demo: sem @ reais
    chat_id: 700000100 + i,
    vinculado_em: iso(agora() - int(10, 90) * DIA),
    ativo: i !== 5,
  }));
  let pendentes = [
    { chat_id: 700000901, nome_telegram: 'Henrique', username: null, recebido_em: iso(agora() - 3 * HORA) },
    { chat_id: 700000902, nome_telegram: 'Isa R.', username: null, recebido_em: iso(agora() - 26 * HORA) },
  ];

  // ── Scheduler (bot autônomo) ──────────────────────────────────────────────
  const scheduler = {
    bot_ativo: true,
    telegram_online: true,
    em_horario_comercial: true,
    parado: { ativo: true, horarios: ['09:30', '14:30'] },
    aguardando: { ativo: true, horarios: ['10:00', '13:00', '16:00'] },
    ignorado: { ativo: true, horarios: ['11:00', '15:30'] },
    parado_minutos: 1440,
    relatorio_diario: { ativo: true, horario: '18:00' },
    admin_chat_ids: [700000001],
    relatorio_atividade: { ativo: true, horarios: ['19:00'], admin_chat_ids: [700000001] },
    alertas_inatividade: { ativo: true, sumiu_minutos: 60, admin_chat_ids: [700000001] },
  };

  function historicoHoje() {
    const disparos = { parado: [], aguardando: [], ignorado: [] };
    const hojeIni = new Date(); hojeIni.setHours(0, 0, 0, 0);
    const agoraHM = new Date().toTimeString().slice(0, 5);
    let total = 0, casosT = 0, msgsT = 0;
    const unicos = new Set();
    let ultimo = null;
    ['parado', 'aguardando', 'ignorado'].forEach(tipo => {
      scheduler[tipo].horarios.forEach(h => {
        if (h > agoraHM) return;
        const det = agentes.slice(0, int(3, 7)).map(a => {
          unicos.add(a.name);
          const cs = int(1, 6);
          return { agente: a.name, casos: cs, mensagens: 1 };
        });
        const totalCasos = det.reduce((s, d) => s + d.casos, 0);
        const reg = {
          horario: h,
          ts: iso(hojeIni.getTime() + (+h.slice(0, 2)) * HORA + (+h.slice(3)) * MIN),
          totalAgentes: det.length, totalCasos, totalMsgs: det.length, detalhes: det,
        };
        disparos[tipo].push(reg);
        total++; casosT += totalCasos; msgsT += det.length;
        if (!ultimo || reg.ts > ultimo.ts) ultimo = { ...reg, tipo };
      });
    });
    return {
      data: ymd(agora()),
      disparos,
      resumo: { total_disparos: total, total_agentes_unicos: unicos.size, total_casos: casosT, total_msgs: msgsT, ultimo },
    };
  }

  // ── Roteador ──────────────────────────────────────────────────────────────
  const delay = () => new Promise(r => setTimeout(r, 150 + Math.random() * 250));

  function parse(path) {
    const [p, qs] = path.split('?');
    const q = Object.fromEntries(new URLSearchParams(qs || ''));
    return { parts: p.split('/').filter(Boolean), q };
  }

  function get(path) {
    const { parts, q } = parse(path);
    const pd = parseInt(q.parado_dias || '3', 10);
    const [a, b, c] = parts;

    if (a === 'status') return { ok: true, chatwoot_url: null, nome_ia: 'Assistente IA', versao: 'v3 demo' };

    if (a === 'agentes' && !b) return agentes.map(ag => ({ id: ag.id, name: ag.name, email: ag.email, abertos: contagem(ag.id, 3).total }));
    if (a === 'agentes' && b === 'todos') return agentes.map(ag => ({
      id: ag.id, name: ag.name, email: ag.email, incluir_relatorios: ag.incluir_relatorios, casos_abertos: contagem(ag.id, 3).total,
    }));

    if (a === 'ranking') return agentes
      .map(ag => ({ id: ag.id, name: ag.name, email: ag.email, ...contagem(ag.id, pd) }))
      .sort((x, y) => y.ignorados - x.ignorados || y.parados - x.parados);

    if (a === 'casos') {
      const id = parseInt(b, 10);
      return { casos: casos.filter(cs => cs.agente_id === id).map(cs => casoPublico(cs, pd)) };
    }

    if (a === 'notas') return notas[b] || [];

    if (a === 'resumo') {
      const cs = casos.find(x => String(x.display_id) === b);
      if (!cs) return { mensagens: [] };
      const ag = agentes.find(x => x.id === cs.agente_id);
      const fim = agora() - cs.minutos_base * MIN;
      const msgs = [
        { tipo: 'sistema', conteudo: 'Conversa atribuída a ' + ag.name, criada_em: iso(fim - 3 * HORA) },
        { tipo: 'cliente', quem: cs.cliente, conteudo: pick(MSGS_CLIENTE), criada_em: iso(fim - 2.5 * HORA) },
        { tipo: 'agente', quem: ag.name, conteudo: pick(MSGS_AGENTE), criada_em: iso(fim - 2 * HORA) },
        { tipo: 'agente', quem: ag.name, privada: true, conteudo: 'Nota interna: verificar com o financeiro.', criada_em: iso(fim - 1.5 * HORA) },
      ];
      msgs.push(cs.ultima_msg_de === 'Contact'
        ? { tipo: 'cliente', quem: cs.cliente, conteudo: cs.preview, criada_em: iso(fim) }
        : { tipo: 'agente', quem: ag.name, conteudo: cs.preview, criada_em: iso(fim) });
      return { mensagens: msgs };
    }

    if (a === 'historico' && b === 'times') {
      const dia = c === 'ontem' ? agora() - DIA : agora();
      const tot = TIMES.map(t => ({ time: t, total: int(40, 260), sem_agente: rnd() < 0.4 ? int(1, 12) : 0 }));
      const geral = tot.reduce((s, t) => s + t.total, 0);
      tot.forEach(t => { t.pct = Math.round((t.total / geral) * 100); });
      tot.sort((x, y) => y.total - x.total);
      return { data: ymd(dia), total_geral: geral, times: tot };
    }

    if (a === 'historico') {
      const id = parseInt(b, 10);
      const dias = parseInt(q.dias || '30', 10);
      const out = [];
      for (let i = dias - 1; i >= 0; i--) {
        const d = agora() - i * DIA;
        out.push({ dia: ymd(d), ...diaInfo(id, d) });
      }
      return out;
    }

    if (a === 'jornada') {
      const id = parseInt(b, 10);
      const seg = new Date(); seg.setHours(12, 0, 0, 0);
      seg.setDate(seg.getDate() - ((seg.getDay() + 6) % 7));
      if (q.semana === 'passada') seg.setDate(seg.getDate() - 7);
      const dias = [];
      for (let i = 0; i < 7; i++) {
        const d = new Date(seg); d.setDate(seg.getDate() + i);
        dias.push(jornadaDia(id, d));
      }
      return { dias };
    }

    if (a === 'comparar') {
      const ids = (q.ids || '').split(',').map(Number).filter(Boolean);
      return ids.map(id => {
        const ag = agentes.find(x => x.id === id);
        let msgs7 = 0;
        for (let i = 0; i < 7; i++) msgs7 += diaInfo(id, agora() - i * DIA).mensagens;
        return { id, name: ag ? ag.name : '#' + id, ...contagem(id, pd), msgs_7d: msgs7, media_diaria: (msgs7 / 5).toFixed(1) };
      });
    }

    if (a === 'sem-atividade') {
      const horas = parseFloat(q.horas || '2');
      const semNenhuma = agentes.slice(8, 9).map(ag => ({ name: ag.name, email: ag.email }));
      const sumiu = agentes.slice(2, 5)
        .map((ag, i) => ({ name: ag.name, email: ag.email, horas_desde_ultima: +(horas + i * 0.7 + 0.2).toFixed(1) }))
        .map(x => ({ ...x, ultima_msg_hoje: iso(agora() - x.horas_desde_ultima * HORA) }));
      return { fora_horario: false, horario_comercial: { inicio: 9, fim: 18 }, sem_nenhuma: semNenhuma, sumiu };
    }

    if (a === 'fila' && b === 'categorias') {
      return filaDias(parseInt(q.dias || '7', 10)).map(d => {
        const cb = Math.round(d.total * (0.4 + rnd() * 0.1));
        const ia = Math.round(d.total * (0.1 + rnd() * 0.08));
        return { dia: d.dia, clickbank: cb, ia, organico: d.total - cb - ia };
      });
    }
    if (a === 'fila') return filaDias(parseInt(q.dias || '7', 10));

    if (a === 'duplicados' && !b) return duplicados.map(({ _convs, ...d }) => d);
    if (a === 'duplicados') {
      const d = duplicados.find(x => String(x.contact_id) === b);
      return d ? d._convs : [];
    }

    if (a === 'telegram' && b === 'status') return {
      online: true, bot_nome: 'Agente Tracker Bot (demo)', bot_username: 'agente_tracker_demo_bot', link_bot: null,
      total_vinculados: vinculados.length, total_pendentes: pendentes.length,
    };
    if (a === 'telegram' && b === 'vinculados') return vinculados;
    if (a === 'telegram' && b === 'pendentes') return pendentes;

    if (a === 'scheduler' && b === 'historico-hoje') return historicoHoje();
    if (a === 'scheduler') return JSON.parse(JSON.stringify(scheduler));

    throw new Error('Endpoint não disponível na demo: ' + path);
  }

  const filaCache = {};
  function filaDias(n) {
    const out = [];
    for (let i = 0; i < n; i++) {
      const d = agora() - i * DIA;
      const k = ymd(d);
      if (!filaCache[k]) {
        const dow = new Date(d).getDay();
        const fator = dow === 0 || dow === 6 ? 0.35 : 1;
        const times = TIMES.map(t => ({ time: t, casos: Math.round(int(60, 240) * fator) })).sort((x, y) => y.casos - x.casos);
        filaCache[k] = { dia: k, total: times.reduce((s, t) => s + t.casos, 0), times };
      }
      out.push(filaCache[k]);
    }
    return out;
  }

  function post(path, body) {
    const { parts } = parse(path);
    const [a, b, c] = parts;
    body = body || {};

    if (a === 'agentes' && b === 'toggle-relatorio') {
      const ag = agentes.find(x => x.id === body.id);
      if (ag) ag.incluir_relatorios = !!body.incluir;
      return { ok: true };
    }
    if (a === 'notas') {
      (notas[b] = notas[b] || []).push({ id: 'n' + Date.now(), texto: body.texto, criado_em: iso(agora()), automatica: false });
      return { ok: true };
    }
    if (a === 'telegram' && b === 'teste') return { ok: true };
    if (a === 'telegram' && b === 'desvincular') { vinculados = vinculados.filter(v => v.agente_id !== +c); return { ok: true }; }
    if (a === 'telegram' && b === 'vincular') {
      const p = pendentes.find(x => x.chat_id === body.chat_id);
      const ag = agentes.find(x => x.id === body.agente_id);
      if (p && ag) {
        vinculados = vinculados.filter(v => v.agente_id !== ag.id);
        vinculados.push({ agente_id: ag.id, agente_nome: ag.name, nome_telegram: p.nome_telegram, username: null, chat_id: p.chat_id, vinculado_em: iso(agora()), ativo: true });
        pendentes = pendentes.filter(x => x !== p);
      }
      return { ok: true };
    }

    if (a === 'scheduler') {
      switch (b) {
        case 'toggle-bot': scheduler.bot_ativo = !scheduler.bot_ativo; return { bot_ativo: scheduler.bot_ativo };
        case 'tipo': Object.assign(scheduler[c], body); return { ok: true };
        case 'parado-minutos': scheduler.parado_minutos = body.minutos; return { ok: true };
        case 'disparar': {
          const tot = int(3, 8);
          return { totalAgentes: tot, totalCasos: tot * int(2, 5), totalMsgs: tot, pulados: body.todos ? 0 : int(0, 3) };
        }
        case 'relatorio-config': Object.assign(scheduler.relatorio_diario, body); return { ok: true };
        case 'relatorio-teste': case 'relatorio-agora': case 'atividade-agora': return { enviados: scheduler.admin_chat_ids.length };
        case 'atividade-config': Object.assign(scheduler.relatorio_atividade, body); return { ok: true };
        case 'atividade-teste': return { enviados: 1, partes: 2 };
        case 'inatividade-config': Object.assign(scheduler.alertas_inatividade, body); return { ok: true };
        case 'inatividade-teste': return { sumiram: 3, enviados: 1 };
        case 'inatividade-reset': return { ok: true };
        case 'admin-ids': scheduler.admin_chat_ids = body.ids || []; return { ok: true };
      }
    }
    throw new Error('Ação não disponível na demo');
  }

  function del(path) {
    const { parts } = parse(path);
    const [a, b, c] = parts;
    if (a === 'notas') { notas[b] = (notas[b] || []).filter(n => n.id !== c); return { ok: true }; }
    if (a === 'telegram' && b === 'pendentes') { pendentes = pendentes.filter(p => p.chat_id !== +c); return { ok: true }; }
    throw new Error('Ação não disponível na demo');
  }

  return { get, post, del, delay };
})();

const API = {
  async get(path)        { await DEMO.delay(); return DEMO.get(path); },
  async post(path, body) { await DEMO.delay(); return DEMO.post(path, body); },
  async del(path)        { await DEMO.delay(); return DEMO.del(path); },
};
