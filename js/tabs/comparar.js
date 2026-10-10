// public/js/tabs/comparar.js
// Aba Comparar — escolhe até 4 agentes e mostra estatísticas lado a lado.

AT.tabs.comparar = {
  ids: [],
  agentesPopulados: false,

  async load() {
    // Popula o dropdown uma vez só
    if (!this.agentesPopulados) {
      const sel = document.getElementById('comparar-select');
      const semIA = AT.state.agentes.filter(a => a.name !== AT.state.nomeIA);
      semIA.forEach(a => {
        const opt = document.createElement('option');
        opt.value = a.id;
        opt.textContent = a.name + ' (' + a.abertos + ')';
        sel.appendChild(opt);
      });
      this.agentesPopulados = true;
    }

    // Renderiza chips + resultado (se tiver algum selecionado)
    this.renderChips();
    if (this.ids.length) await this.carregarResultado();
  },

  adicionar() {
    const sel = document.getElementById('comparar-select');
    const id = parseInt(sel.value, 10);
    if (!id) return;
    if (this.ids.includes(id)) return;
    if (this.ids.length >= 4) { alert('Máximo 4 agentes!'); return; }
    this.ids.push(id);
    sel.value = '';
    this.renderChips();
    this.carregarResultado();
  },

  remover(id) {
    this.ids = this.ids.filter(x => x !== id);
    this.renderChips();
    if (this.ids.length) this.carregarResultado();
    else document.getElementById('comparar-resultado').innerHTML = '';
  },

  limpar() {
    this.ids = [];
    this.renderChips();
    document.getElementById('comparar-resultado').innerHTML = '';
  },

  renderChips() {
    const div = document.getElementById('comparar-chips');
    if (!this.ids.length) { div.innerHTML = ''; return; }
    div.innerHTML = this.ids.map(id => {
      const a = AT.state.agentes.find(x => x.id === id);
      const nome = a ? a.name : '#' + id;
      return `<span class="chip-selecionado">${AT.h(nome)} <span class="remover" onclick="AT.tabs.comparar.remover(${id})">✕</span></span>`;
    }).join('');
  },

  async carregarResultado() {
    if (!this.ids.length) return;
    const grid = document.getElementById('comparar-resultado');
    grid.innerHTML = '<p class="loading">Carregando…</p>';
    grid.className = 'comparar-grid';
    try {
      const dados = await API.get(`/comparar?ids=${this.ids.join(',')}&parado_dias=${AT.state.paradoDias}`);
      grid.className = 'comparar-grid cols-' + dados.length;
      grid.innerHTML = dados.map(a => `
        <div class="comparar-card">
          <h3>${AT.h(a.name)}</h3>
          <div class="stat-row"><span class="stat-label">🔴 Ignorados</span><span class="stat-val n-ignorado">${a.ignorados}</span></div>
          <div class="stat-row"><span class="stat-label">💤 Parados</span><span class="stat-val n-parado">${a.parados}</span></div>
          <div class="stat-row"><span class="stat-label">🟡 Aguardando</span><span class="stat-val n-aguardando">${a.aguardando}</span></div>
          <div class="stat-row"><span class="stat-label">🟢 Andamento</span><span class="stat-val n-andamento">${a.em_andamento}</span></div>
          <div class="stat-row"><span class="stat-label">📂 Total</span><span class="stat-val">${a.total}</span></div>
          <div class="stat-row"><span class="stat-label">📨 Msgs 7d</span><span class="stat-val" style="color:var(--accent)">${a.msgs_7d}</span></div>
          <div class="stat-row"><span class="stat-label">📊 Média/dia</span><span class="stat-val">${a.media_diaria}</span></div>
        </div>
      `).join('');
    } catch (e) {
      grid.innerHTML = '<p class="empty">Erro: ' + AT.h(e.message) + '</p>';
    }
  },
};
