// public/js/tabs/duplicados.js
// Aba Duplicados — clientes com + de 1 conversa aberta.
// Expande pra ver todas as conversas e os agentes responsáveis.

AT.tabs.duplicados = {
  lista: [],
  conversasCache: {},
  abertos: new Set(),

  async load() {
    const container = document.getElementById('dup-container');
    container.innerHTML = '<p class="loading">Carregando…</p>';

    try {
      this.lista = await API.get('/duplicados');
      this.renderStats();
      this.renderLista();
    } catch (e) {
      container.innerHTML = '<p class="empty">Erro: ' + AT.h(e.message) + '</p>';
    }
  },

  renderStats() {
    const total = this.lista.length;
    const conversasTotal = this.lista.reduce((s, c) => s + c.total_conversas, 0);
    const maxConvs = this.lista.length ? Math.max(...this.lista.map(c => c.total_conversas)) : 0;
    document.getElementById('dup-stat-clientes').textContent = total;
    document.getElementById('dup-stat-conversas').textContent = conversasTotal;
    document.getElementById('dup-stat-max').textContent = maxConvs;
  },

  renderLista() {
    const container = document.getElementById('dup-container');
    if (!this.lista.length) {
      container.innerHTML = '<div class="empty"><div class="emoji">🎉</div><p>Nenhum cliente duplicado!</p></div>';
      return;
    }

    container.innerHTML = this.lista.map(c => this.cardHtml(c)).join('');
  },

  cardHtml(c) {
    const aberto = this.abertos.has(c.contact_id);
    const contato = c.email || c.telefone || 'sem contato';
    return `
      <div class="dup-card ${aberto ? 'open' : ''}" id="dup-card-${c.contact_id}">
        <div class="dup-card-header" onclick="AT.tabs.duplicados.toggle(${c.contact_id})">
          <div class="dup-cliente-info">
            <div class="dup-cliente-nome">${AT.h(c.cliente || 'Sem nome')}</div>
            <div class="dup-cliente-contato">${AT.h(contato)}</div>
          </div>
          <div class="dup-badges">
            <span class="dup-badge total">${c.total_conversas} conversas</span>
          </div>
          <span class="dup-arrow">▶</span>
        </div>
        <div class="dup-conversas" id="dup-conversas-${c.contact_id}"></div>
      </div>
    `;
  },

  async toggle(contactId) {
    const card = document.getElementById('dup-card-' + contactId);
    if (this.abertos.has(contactId)) {
      this.abertos.delete(contactId);
      card.classList.remove('open');
      return;
    }
    this.abertos.add(contactId);
    card.classList.add('open');

    // Carrega conversas se ainda não tiver
    const divConvs = document.getElementById('dup-conversas-' + contactId);
    if (!this.conversasCache[contactId]) {
      divConvs.innerHTML = '<p class="loading" style="padding:12px;">Carregando…</p>';
      try {
        this.conversasCache[contactId] = await API.get('/duplicados/' + contactId);
      } catch (e) {
        divConvs.innerHTML = '<p class="empty">Erro: ' + AT.h(e.message) + '</p>';
        return;
      }
    }
    const convs = this.conversasCache[contactId];
    if (!convs.length) {
      divConvs.innerHTML = '<p class="empty" style="padding:12px;">Sem conversas abertas</p>';
      return;
    }
    divConvs.innerHTML = convs.map(cv => {
      const data = new Date(cv.criada_em).toLocaleDateString('pt-BR');
      const semAg = cv.agente === '(sem agente)';
      const agHtml = semAg ? '<span class="sem">⚠️ ' + AT.h(cv.agente) + '</span>' : AT.h(cv.agente);
      const linkCW = cv.chatwoot_url
        ? `<a href="${cv.chatwoot_url}" target="_blank" class="dup-conversa-link">🔗 abrir</a>`
        : '';
      return `
        <div class="dup-conversa-linha">
          <span class="dup-conversa-id">#${cv.display_id}</span>
          <span class="dup-conversa-agente">${agHtml} · ${AT.h(cv.time)}</span>
          <span class="dup-conversa-data">${data}</span>
          ${linkCW}
        </div>
      `;
    }).join('');
  },
};
