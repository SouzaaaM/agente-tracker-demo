// public/js/tabs/autonomo.js
// Aba 🚀 Autônomo — controle das cobranças automáticas + relatórios + alertas.

AT.tabs.autonomo = {
  cfg: null,

  async load() {
    try {
      this.cfg = await API.get('/scheduler');
      this.render();
      this.carregarStatusDisparo();
    } catch (e) {
      document.getElementById('aut-container').innerHTML = '<p class="empty">Erro: ' + AT.h(e.message) + '</p>';
    }
  },

  render() {
    const c = this.cfg;
    const card = document.getElementById('bot-geral-card');
    card.classList.toggle('ativo', !!c.bot_ativo);
    document.getElementById('bot-geral-toggle').checked = !!c.bot_ativo;
    document.getElementById('bot-geral-status').textContent = c.bot_ativo ? 'LIGADO' : 'DESLIGADO';
    document.getElementById('bot-geral-status').className = 'status-texto ' + (c.bot_ativo ? 'on' : 'off');

    document.getElementById('bot-geral-info').innerHTML =
      '🤖 Telegram: ' + (c.telegram_online ? '🟢 Online' : '🔴 Offline') + '<br>' +
      '⏰ Horário comercial: ' + (c.em_horario_comercial ? '🟢 Sim' : '🔴 Não');

    // Avisos
    document.getElementById('aut-alerta-comercial').style.display = c.em_horario_comercial ? 'none' : 'block';
    document.getElementById('aut-alerta-tg').style.display = c.telegram_online ? 'none' : 'block';

    // 3 blocos de cobrança
    for (const tipo of ['parado', 'aguardando', 'ignorado']) {
      const cfg = c[tipo] || { ativo: false, horarios: [] };
      document.getElementById('tipo-' + tipo + '-ativo').checked = !!cfg.ativo;
      this.renderHorarios(tipo, cfg.horarios || []);
    }

    // Parado minutos select
    const selPar = document.getElementById('parado-minutos');
    if (selPar) selPar.value = String(c.parado_minutos || 1440);

    // Relatório diário
    document.getElementById('rel-diario-ativo').checked = !!(c.relatorio_diario && c.relatorio_diario.ativo);
    document.getElementById('rel-diario-horario').value = (c.relatorio_diario && c.relatorio_diario.horario) || '18:00';
    this.renderAdminIds('admin-ids-chips', c.admin_chat_ids || []);

    // Atividade semanal
    document.getElementById('atv-ativo').checked = !!(c.relatorio_atividade && c.relatorio_atividade.ativo);
    this.renderHorariosAtividade(c.relatorio_atividade && c.relatorio_atividade.horarios || []);
    this.renderAdminIds('atv-admin-ids', (c.relatorio_atividade && c.relatorio_atividade.admin_chat_ids) || []);

    // Alertas inatividade
    document.getElementById('inat-ativo').checked = !!(c.alertas_inatividade && c.alertas_inatividade.ativo);
    document.getElementById('inat-sumiu-minutos').value = (c.alertas_inatividade && c.alertas_inatividade.sumiu_minutos) || 60;
    this.renderAdminIds('inat-admin-ids', (c.alertas_inatividade && c.alertas_inatividade.admin_chat_ids) || []);
  },

  // === SWITCH GERAL ===
  async toggleBotGeral() {
    try {
      const r = await API.post('/scheduler/toggle-bot');
      this.cfg.bot_ativo = r.bot_ativo;
      this.render();
    } catch (e) { alert('Erro: ' + e.message); }
  },

  // === HORÁRIOS POR TIPO ===
  renderHorarios(tipo, horarios) {
    const cont = document.getElementById('tipo-' + tipo + '-horarios');
    if (!cont) return;
    cont.innerHTML = horarios.map((h, i) => {
      const removivel = horarios.length > 1;
      return '<span class="horario-chip">' +
        '<input type="time" value="' + h + '" onchange="AT.tabs.autonomo.setHorario(\'' + tipo + '\',' + i + ',this.value)"/>' +
        (removivel ? '<button type="button" class="btn-rem-hora" onclick="AT.tabs.autonomo.removerHorario(\'' + tipo + '\',' + i + ')">×</button>' : '') +
      '</span>';
    }).join('');
  },

  async salvarTipoAtivo(tipo) {
    try {
      const ativo = document.getElementById('tipo-' + tipo + '-ativo').checked;
      await API.post('/scheduler/tipo/' + tipo, { ativo });
      this.cfg[tipo].ativo = ativo;
    } catch (e) { alert('Erro: ' + e.message); }
  },

  async setHorario(tipo, idx, valor) {
    if (!/^\d{2}:\d{2}$/.test(valor)) return;
    this.cfg[tipo].horarios[idx] = valor;
    await this.salvarHorarios(tipo);
  },

  async removerHorario(tipo, idx) {
    this.cfg[tipo].horarios.splice(idx, 1);
    await this.salvarHorarios(tipo);
    this.renderHorarios(tipo, this.cfg[tipo].horarios);
  },

  async adicionarHorario(tipo) {
    const horarios = this.cfg[tipo].horarios.slice();
    let nova = '12:00';
    if (horarios.length > 0) {
      const ult = horarios[horarios.length - 1].split(':');
      let h = parseInt(ult[0], 10) + 1;
      if (h > 23) h = 23;
      nova = String(h).padStart(2, '0') + ':' + ult[1];
    }
    horarios.push(nova);
    this.cfg[tipo].horarios = horarios;
    await this.salvarHorarios(tipo);
    this.renderHorarios(tipo, horarios);
  },

  async salvarHorarios(tipo) {
    try { await API.post('/scheduler/tipo/' + tipo, { horarios: this.cfg[tipo].horarios }); }
    catch (e) { alert('Erro: ' + e.message); }
  },

  // === PARADO MINUTOS ===
  async salvarParadoMinutos() {
    try {
      const minutos = parseInt(document.getElementById('parado-minutos').value, 10);
      await API.post('/scheduler/parado-minutos', { minutos });
      this.cfg.parado_minutos = minutos;
    } catch (e) { alert('Erro: ' + e.message); }
  },

  // === DISPARAR ===
  async dispararAgora(tipo, todos) {
    if (todos && !confirm('🔄 TODOS vai recobrar até quem já foi cobrado hoje. Confirma?')) return;
    const div = document.getElementById('res-' + tipo);
    div.style.display = 'block';
    div.innerHTML = '⏳ Disparando…';
    try {
      const r = await API.post('/scheduler/disparar/' + tipo, { todos: !!todos });
      div.innerHTML = '✅ <b>' + r.totalAgentes + '</b> agentes · <b>' + r.totalCasos + '</b> casos · <b>' + r.totalMsgs + '</b> msgs · ' + r.pulados + ' pulados';
    } catch (e) {
      div.innerHTML = '❌ Erro: ' + AT.h(e.message);
    }
  },

  // === RELATÓRIO DIÁRIO ===
  async salvarRelatorioConfig() {
    try {
      const ativo = document.getElementById('rel-diario-ativo').checked;
      const horario = document.getElementById('rel-diario-horario').value;
      await API.post('/scheduler/relatorio-config', { ativo, horario });
    } catch (e) { alert('Erro: ' + e.message); }
  },

  async enviarTesteRelatorio() {
    try {
      const r = await API.post('/scheduler/relatorio-teste');
      alert('✅ Teste enviado pra ' + r.enviados + ' admin(s)');
    } catch (e) { alert('Erro: ' + e.message); }
  },

  async enviarRelatorioAgora() {
    if (!confirm('Enviar relatório agora pros admins?')) return;
    try {
      const r = await API.post('/scheduler/relatorio-agora');
      alert('✅ Relatório enviado pra ' + r.enviados + ' admin(s)');
    } catch (e) { alert('Erro: ' + e.message); }
  },

  // === ATIVIDADE SEMANAL ===
  renderHorariosAtividade(horarios) {
    const cont = document.getElementById('atv-horarios');
    if (!cont) return;
    cont.innerHTML = horarios.map((h, i) => {
      const removivel = horarios.length > 1;
      return '<span class="horario-chip">' +
        '<input type="time" value="' + h + '" onchange="AT.tabs.autonomo.setHorarioAtividade(' + i + ',this.value)"/>' +
        (removivel ? '<button type="button" class="btn-rem-hora" onclick="AT.tabs.autonomo.removerHorarioAtividade(' + i + ')">×</button>' : '') +
      '</span>';
    }).join('');
  },

  async setHorarioAtividade(idx, valor) {
    if (!/^\d{2}:\d{2}$/.test(valor)) return;
    this.cfg.relatorio_atividade.horarios[idx] = valor;
    await this.salvarAtividadeConfig();
  },

  async removerHorarioAtividade(idx) {
    this.cfg.relatorio_atividade.horarios.splice(idx, 1);
    await this.salvarAtividadeConfig();
    this.renderHorariosAtividade(this.cfg.relatorio_atividade.horarios);
  },

  async adicionarHorarioAtividade() {
    const horarios = this.cfg.relatorio_atividade.horarios.slice();
    let nova = '19:00';
    if (horarios.length > 0) {
      const ult = horarios[horarios.length - 1].split(':');
      let h = parseInt(ult[0], 10) + 1;
      if (h > 23) h = 23;
      nova = String(h).padStart(2, '0') + ':' + ult[1];
    }
    horarios.push(nova);
    this.cfg.relatorio_atividade.horarios = horarios;
    await this.salvarAtividadeConfig();
    this.renderHorariosAtividade(horarios);
  },

  async salvarAtividadeConfig() {
    try {
      const ativo = document.getElementById('atv-ativo').checked;
      await API.post('/scheduler/atividade-config', {
        ativo, horarios: this.cfg.relatorio_atividade.horarios,
        admin_chat_ids: this.cfg.relatorio_atividade.admin_chat_ids || [],
      });
      this.cfg.relatorio_atividade.ativo = ativo;
    } catch (e) { alert('Erro: ' + e.message); }
  },

  async enviarTesteAtividade() {
    try {
      const r = await API.post('/scheduler/atividade-teste');
      alert('✅ Teste enviado pra ' + r.enviados + ' admin(s) · ' + (r.partes || 1) + ' parte(s)');
    } catch (e) { alert('Erro: ' + e.message); }
  },

  async enviarAtividadeAgora() {
    if (!confirm('Enviar relatório de atividade agora?')) return;
    try {
      const r = await API.post('/scheduler/atividade-agora');
      alert('✅ Enviado pra ' + r.enviados + ' admin(s)');
    } catch (e) { alert('Erro: ' + e.message); }
  },

  // === ALERTAS INATIVIDADE ===
  async salvarInatConfig() {
    try {
      const ativo = document.getElementById('inat-ativo').checked;
      const sumiu_minutos = parseInt(document.getElementById('inat-sumiu-minutos').value, 10);
      await API.post('/scheduler/inatividade-config', {
        ativo, sumiu_minutos,
        admin_chat_ids: this.cfg.alertas_inatividade.admin_chat_ids || [],
      });
      this.cfg.alertas_inatividade.ativo = ativo;
      this.cfg.alertas_inatividade.sumiu_minutos = sumiu_minutos;
    } catch (e) { alert('Erro: ' + e.message); }
  },

  async enviarTesteInat() {
    try {
      const r = await API.post('/scheduler/inatividade-teste');
      alert('✅ ' + (r.sumiram || 0) + ' agentes sumidos · enviado pra ' + (r.enviados || 0) + ' admin(s)');
    } catch (e) { alert('Erro: ' + e.message); }
  },

  async resetInat() {
    if (!confirm('Resetar estado dos alertas? (vai re-alertar quem já foi notificado)')) return;
    try {
      await API.post('/scheduler/inatividade-reset');
      alert('✅ Estado resetado');
    } catch (e) { alert('Erro: ' + e.message); }
  },

  // === ADMINS CHIPS (genérico) ===
  renderAdminIds(containerId, ids) {
    const cont = document.getElementById(containerId);
    if (!cont) return;
    cont.innerHTML = (ids || []).map(id =>
      '<span class="admin-id-chip">' + id + '<button onclick="AT.tabs.autonomo.removerAdminId(\'' + containerId + '\',' + id + ')">×</button></span>'
    ).join('') || '<span style="color:var(--text-dim);font-size:11px;">Nenhum admin configurado</span>';
  },

  async removerAdminId(containerId, id) {
    let lista, salvar;
    if (containerId === 'admin-ids-chips') { lista = this.cfg.admin_chat_ids; salvar = 'rel'; }
    else if (containerId === 'atv-admin-ids') { lista = this.cfg.relatorio_atividade.admin_chat_ids; salvar = 'atv'; }
    else if (containerId === 'inat-admin-ids') { lista = this.cfg.alertas_inatividade.admin_chat_ids; salvar = 'inat'; }
    else return;

    const idx = lista.indexOf(id);
    if (idx >= 0) lista.splice(idx, 1);
    await this.salvarAdminIds(salvar);
    this.renderAdminIds(containerId, lista);
  },

  async adicionarAdminId(containerId, inputId) {
    const valor = document.getElementById(inputId).value.trim();
    const id = parseInt(valor, 10);
    if (!id || id <= 0) { alert('chat_id deve ser um número positivo'); return; }

    let lista, salvar;
    if (containerId === 'admin-ids-chips') { lista = this.cfg.admin_chat_ids; salvar = 'rel'; }
    else if (containerId === 'atv-admin-ids') { lista = this.cfg.relatorio_atividade.admin_chat_ids; salvar = 'atv'; }
    else if (containerId === 'inat-admin-ids') { lista = this.cfg.alertas_inatividade.admin_chat_ids; salvar = 'inat'; }
    else return;

    if (lista.includes(id)) { alert('Já tá na lista'); return; }
    lista.push(id);
    document.getElementById(inputId).value = '';
    await this.salvarAdminIds(salvar);
    this.renderAdminIds(containerId, lista);
  },

  async salvarAdminIds(qual) {
    try {
      if (qual === 'rel') {
        await API.post('/scheduler/admin-ids', { ids: this.cfg.admin_chat_ids });
      } else if (qual === 'atv') {
        await API.post('/scheduler/atividade-config', {
          ativo: this.cfg.relatorio_atividade.ativo,
          horarios: this.cfg.relatorio_atividade.horarios,
          admin_chat_ids: this.cfg.relatorio_atividade.admin_chat_ids,
        });
      } else if (qual === 'inat') {
        await API.post('/scheduler/inatividade-config', {
          ativo: this.cfg.alertas_inatividade.ativo,
          sumiu_minutos: this.cfg.alertas_inatividade.sumiu_minutos,
          admin_chat_ids: this.cfg.alertas_inatividade.admin_chat_ids,
        });
      }
    } catch (e) { alert('Erro: ' + e.message); }
  },
  // v2.12: histórico no Autônomo
  async carregarStatusDisparo() {
    try {
      const r = await API.get('/scheduler/historico-hoje');
      this.historicoHoje = r;
      const bar = document.getElementById('status-disparo-bar');
      const txt = document.getElementById('status-disparo-texto');
      const badge = document.getElementById('hist-badge');
      if (!bar || !txt) return;

      if (!r.resumo.total_disparos) {
        bar.style.display = 'flex';
        bar.classList.remove('parado');
        bar.classList.add('parado');
        txt.innerHTML = '<b>Nenhum disparo hoje</b><div class="info-secundaria">Aguardando próximo gatilho configurado…</div>';
        if (badge) badge.textContent = '0';
        return;
      }

      bar.style.display = 'flex';
      bar.classList.remove('parado');
      const u = r.resumo.ultimo;
      const tipoLabel = u.tipo === 'parado' ? '💤 Parado' : u.tipo === 'aguardando' ? '🟡 Aguardando' : '🔴 Ignorado';
      txt.innerHTML = '🟢 Último disparo: <b>' + AT.h(u.horario) + '</b> (' + tipoLabel + ') — <b>' +
        u.totalAgentes + '</b> agente(s) · <b>' + u.totalCasos + '</b> casos · <b>' + u.totalMsgs + '</b> msgs' +
        '<div class="info-secundaria">Hoje: ' + r.resumo.total_disparos + ' disparo(s) · ' +
        r.resumo.total_agentes_unicos + ' agente(s) únicos · ' + r.resumo.total_casos + ' casos cobrados</div>';
      if (badge) badge.textContent = String(r.resumo.total_disparos);
    } catch (e) {
      console.error('Erro carregando status disparo:', e);
    }
  },

  abrirHistorico() {
    const overlay = document.getElementById('hist-modal-overlay');
    const body = document.getElementById('hist-modal-body');
    const dataLabel = document.getElementById('hist-data');
    if (!overlay || !body) return;

    const r = this.historicoHoje;
    if (!r) { body.innerHTML = '<p class="loading">Carregando…</p>'; this.carregarStatusDisparo().then(() => this.abrirHistorico()); overlay.classList.add('show'); return; }

    const hojeFmt = new Date(r.data + 'T12:00:00').toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' });
    if (dataLabel) dataLabel.textContent = hojeFmt;

    const resumo = r.resumo;
    const todos = [];
    for (const tipo of ['parado', 'aguardando', 'ignorado']) {
      for (const d of (r.disparos[tipo] || [])) todos.push({ ...d, tipo });
    }
    todos.sort((a, b) => (b.ts || '').localeCompare(a.ts || ''));

    let html = '';
    html += '<div class="hist-resumo">';
    html += '<div class="stat"><div class="label">Disparos</div><div class="valor">' + resumo.total_disparos + '</div></div>';
    html += '<div class="stat"><div class="label">Agentes</div><div class="valor">' + resumo.total_agentes_unicos + '</div></div>';
    html += '<div class="stat"><div class="label">Casos</div><div class="valor">' + resumo.total_casos + '</div></div>';
    html += '<div class="stat"><div class="label">Mensagens</div><div class="valor">' + resumo.total_msgs + '</div></div>';
    html += '</div>';

    if (!todos.length) {
      html += '<div class="hist-vazio"><span class="emoji">📭</span><div>Nenhum disparo hoje ainda</div></div>';
    } else {
      todos.forEach((d, idx) => {
        const tipoLabel = d.tipo === 'parado' ? '💤 Parados' : d.tipo === 'aguardando' ? '🟡 Aguardando' : '🔴 Ignorados';
        const detalhes = (d.detalhes || []).slice().sort((a, b) => (b.casos || 0) - (a.casos || 0));
        html += '<div class="hist-disparo-card ' + d.tipo + '" id="hist-card-' + idx + '">';
        html += '<div class="hist-disparo-header" onclick="AT.tabs.autonomo.toggleHistCard(' + idx + ')">';
        html += '<span class="hist-disparo-icone">⏰</span>';
        html += '<span class="hist-disparo-titulo">' + AT.h(d.horario || '—') + ' · ' + tipoLabel + '</span>';
        html += '<span class="hist-disparo-resumo">' + (d.totalAgentes || 0) + ' ag · ' + (d.totalCasos || 0) + ' casos · ' + (d.totalMsgs || 0) + ' msgs</span>';
        html += '<span class="hist-disparo-arrow">▶</span>';
        html += '</div>';
        html += '<div class="hist-detalhes">';
        if (!detalhes.length) {
          html += '<p style="color:var(--text-dim);font-size:11px;text-align:center;margin:6px 0;">Sem detalhes por agente</p>';
        } else {
          detalhes.forEach(det => {
            html += '<div class="hist-agente-linha">';
            html += '<span class="hist-agente-nome">' + AT.h(det.agente || '—') + '</span>';
            html += '<span class="hist-agente-stats">' + (det.casos || 0) + ' casos · ' + (det.mensagens || 0) + ' msgs</span>';
            html += '</div>';
          });
        }
        html += '</div></div>';
      });
    }

    body.innerHTML = html;
    overlay.classList.add('show');
  },

  toggleHistCard(idx) {
    const card = document.getElementById('hist-card-' + idx);
    if (card) card.classList.toggle('open');
  },

  fecharHistorico() {
    const overlay = document.getElementById('hist-modal-overlay');
    if (overlay) overlay.classList.remove('show');
  },

  fecharHistoricoSeOverlay(e) {
    if (e.target && e.target.id === 'hist-modal-overlay') this.fecharHistorico();
  },

};
