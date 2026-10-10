// public/js/tabs/casos.js
// Aba Casos — mostra os casos do agente selecionado.
// 4 KPIs clicáveis + filtros de categoria + tabela.
// Clicando num caso: 🔗 abre no Chatwoot · 👁 resumo · 📝 notas.

AT.tabs.casos = {
  // Estado local da aba
  casos: [],
  filtroSit: '',
  filtroCat: '',

  async load() {
    const content = document.getElementById('casos-content');
    const empty = document.getElementById('casos-empty');

    if (!AT.state.agenteId) {
      content.style.display = 'none';
      empty.style.display = 'block';
      return;
    }

    empty.style.display = 'none';
    content.style.display = 'block';

    // Atualiza título do agente
    document.getElementById('casos-titulo').textContent = AT.state.agenteNome || 'Casos';

    try {
      const data = await API.get(`/casos/${AT.state.agenteId}?parado_dias=${AT.state.paradoDias}`);
      this.casos = data.casos || [];
      this.atualizarKPIs();
      this.renderTabela();
    } catch (e) {
      console.error(e);
      document.getElementById('tbody-casos').innerHTML =
        '<tr><td colspan="6" class="empty">Erro: ' + AT.h(e.message) + '</td></tr>';
    }
  },

  atualizarKPIs() {
    const count = (s) => this.casos.filter(c => c.situacao === s).length;
    document.getElementById('kpi-parado').textContent = count('parado');
    document.getElementById('kpi-aguardando').textContent = count('aguardando');
    document.getElementById('kpi-ignorado').textContent = count('ignorado');
    document.getElementById('kpi-andamento').textContent = count('em_andamento');
  },

  filtrarSituacao(sit) {
    this.filtroSit = (this.filtroSit === sit) ? '' : sit;
    document.querySelectorAll('#casos-content .kpi-card').forEach(c => {
      c.classList.toggle('active', c.dataset.situacao === this.filtroSit);
    });
    this.renderTabela();
  },

  filtrarCategoria(cat) {
    this.filtroCat = cat;
    document.querySelectorAll('#casos-content .filtro-pill').forEach(p => {
      p.classList.toggle('active', p.dataset.cat === cat);
    });
    this.renderTabela();
  },

  renderTabela() {
    const tbody = document.getElementById('tbody-casos');
    let lista = this.casos;
    if (this.filtroSit) lista = lista.filter(c => c.situacao === this.filtroSit);
    if (this.filtroCat) lista = lista.filter(c => c.categoria === this.filtroCat);

    if (!lista.length) {
      tbody.innerHTML = '<tr><td colspan="6" class="empty">🎉 Nenhum caso</td></tr>';
      return;
    }

    // Ordena: parados primeiro, depois aguardando, ignorados, andamento
    const ordem = { parado: 0, aguardando: 1, ignorado: 2, em_andamento: 3 };
    lista.sort((a, b) => {
      if (ordem[a.situacao] !== ordem[b.situacao]) return ordem[a.situacao] - ordem[b.situacao];
      return new Date(a.ultima_em) - new Date(b.ultima_em);
    });

    tbody.innerHTML = lista.map(c => this.linhaHtml(c)).join('');
  },

  linhaHtml(c) {
    const dot = c.situacao === 'em_andamento' ? 'dot-green' :
                c.situacao === 'aguardando' ? 'dot-yellow' :
                c.situacao === 'ignorado' ? 'dot-red' : 'dot-purple';
    const sitTxt = c.situacao === 'em_andamento' ? '🟢 Respondeu' :
                   c.situacao === 'aguardando' ? '🟡 Aguardando' :
                   c.situacao === 'ignorado' ? '🔴 Ignorado' : '💤 Parado';
    const tempo = AT.formatTempo(c.minutos_desde_ultima);
    const dataUltima = AT.formatData(c.ultima_em);
    const quemRespondeu = c.ultima_msg_de === 'User' ? 'Agente' : 'Cliente';
    const corQuem = c.ultima_msg_de === 'User' ? 'var(--green)' : 'var(--red)';

    const badgeCat = c.categoria === 'ClickBank' ? 'cb' :
                     c.categoria === 'IA' ? 'ia' : 'organico';
    // v2.13: badge cobrado pelo bot
    const badgeCobrado = c.badge_cobrado_hora
      ? '<span class="badge-cobrado-bot" title="Cobrado pelo bot autônomo (' + AT.h(c.badge_cobrado_tipo || '') + ')">🤖 cobrado ' + AT.h(c.badge_cobrado_hora) + '</span>'
      : '';

    const linkChatwoot = c.chatwoot_url ?
      `<a href="${c.chatwoot_url}" target="_blank" class="acao-btn">🔗</a>` : '';
    const qtdNotas = (c.notas || []).length;
    const btnNotas = `<button class="acao-btn ${qtdNotas > 0 ? 'has-notas' : ''}" onclick="AT.tabs.casos.abrirNotas(${c.display_id}, '${AT.h(c.cliente).replace(/'/g, "\\'")}')">📝${qtdNotas > 0 ? ' ' + qtdNotas : ''}</button>`;
    const btnResumo = `<button class="acao-btn resumo" onclick="AT.tabs.casos.abrirResumo(${c.display_id}, '${AT.h(c.cliente).replace(/'/g, "\\'")}')">👁️</button>`;

    return `
      <tr>
        <td>
          <div><span class="status-dot ${dot}"></span><span class="conv-id">#${c.display_id}</span></div>
          <div class="tempo-info">${sitTxt}</div>
        </td>
        <td>
          <div><strong>${AT.h(c.cliente)}</strong></div>
          <div class="cliente-email">${AT.h(c.cliente_email || c.cliente_telefone || '')}</div>
          <div style="margin-top: 4px;"><span class="badge time">${AT.h(c.time_nome)}</span></div>
        </td>
        <td><span class="badge ${badgeCat}">${c.categoria}</span>${badgeCobrado}</td>
        <td>
          <div style="color: ${corQuem}; font-weight: 600; font-size: 12px;">${quemRespondeu} · ${dataUltima}</div>
          <div class="preview-text">${AT.h(c.preview || '')}</div>
        </td>
        <td><div style="font-weight: 600;">${tempo}</div></td>
        <td><div class="acoes">${linkChatwoot}${btnResumo}${btnNotas}</div></td>
      </tr>
    `;
  },

  // Modal de notas
  async abrirNotas(displayId, cliente) {
    this.notasAtual = displayId;
    document.getElementById('modal-notas-titulo').innerHTML =
      `📝 #${displayId} <span style="color:var(--text-dim);font-weight:400">${AT.h(cliente)}</span>`;
    document.getElementById('nova-nota-txt').value = '';
    await this.recarregarNotasModal();
    document.getElementById('modal-notas').classList.add('show');
  },

  async recarregarNotasModal() {
    const notas = await API.get('/notas/' + this.notasAtual);
    const div = document.getElementById('lista-notas');
    if (!notas.length) {
      div.innerHTML = '<p style="color: var(--text-dim); font-size: 13px;">Nenhuma nota.</p>';
    } else {
      div.innerHTML = notas.map(n => `
        <div class="nota-item ${n.automatica ? 'automatica' : ''}">
          <div class="meta">
            ${AT.formatData(n.criado_em)}${n.automatica ? ' · 🤖' : ''}
            <button onclick="AT.tabs.casos.removerNota('${n.id}')">remover</button>
          </div>
          <div>${AT.h(n.texto).replace(/\n/g, '<br>')}</div>
        </div>
      `).join('');
    }
    // Atualiza contador no caso local
    const caso = this.casos.find(c => c.display_id == this.notasAtual);
    if (caso) caso.notas = notas;
    this.renderTabela();
  },

  async adicionarNota() {
    const txt = document.getElementById('nova-nota-txt').value;
    if (!txt.trim()) return;
    await API.post('/notas/' + this.notasAtual, { texto: txt });
    document.getElementById('nova-nota-txt').value = '';
    await this.recarregarNotasModal();
  },

  async removerNota(notaId) {
    if (!confirm('Remover esta nota?')) return;
    await API.del(`/notas/${this.notasAtual}/${notaId}`);
    await this.recarregarNotasModal();
  },

  // Modal de resumo
  async abrirResumo(displayId, cliente) {
    const url = AT.state.status?.chatwoot_url ?
      `${AT.state.status.chatwoot_url}/app/accounts/1/conversations/${displayId}` : '#';
    document.getElementById('modal-resumo-titulo').innerHTML =
      `📑 #${displayId} <span style="color:var(--text-dim);font-weight:400">${AT.h(cliente)}</span> <a href="${url}" target="_blank">↗</a>`;
    document.getElementById('resumo-conteudo').innerHTML = '<p class="loading">Carregando…</p>';
    document.getElementById('modal-resumo').classList.add('show');

    try {
      const data = await API.get('/resumo/' + displayId);
      if (!data.mensagens?.length) {
        document.getElementById('resumo-conteudo').innerHTML = '<p class="empty">Sem mensagens.</p>';
        return;
      }
      document.getElementById('resumo-conteudo').innerHTML = data.mensagens.map(m => {
        if (m.tipo === 'sistema') {
          return `<div class="msg-bubble sistema">${AT.h(m.conteudo || '(sistema)')}</div>`;
        }
        const classes = `msg-bubble ${m.tipo}${m.privada ? ' privada' : ''}`;
        return `
          <div class="${classes}">
            <div class="meta">${AT.h(m.quem)} · ${AT.formatData(m.criada_em)}</div>
            <div>${AT.h(m.conteudo).replace(/\n/g, '<br>')}</div>
          </div>
        `;
      }).join('');
    } catch (e) {
      document.getElementById('resumo-conteudo').innerHTML = '<p class="empty">Erro: ' + AT.h(e.message) + '</p>';
    }
  },

  fecharModal(id) {
    document.getElementById(id).classList.remove('show');
  },
};
