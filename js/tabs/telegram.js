// public/js/tabs/telegram.js
// Aba ✈️ Telegram — status do bot + lista de vinculados + pendentes.

AT.tabs.telegram = {
  vinculados: [],
  pendentes: [],
  filtro: '',

  async load() {
    const container = document.getElementById('tg-container');

    try {
      const [status, vinculados, pendentes] = await Promise.all([
        API.get('/telegram/status'),
        API.get('/telegram/vinculados'),
        API.get('/telegram/pendentes'),
      ]);
      this.vinculados = vinculados;
      this.pendentes = pendentes;
      this.renderStatus(status);
      this.renderStats(status);
      this.renderVinculados();
      this.renderPendentes();
    } catch (e) {
      container.innerHTML = '<p class="empty">Erro: ' + AT.h(e.message) + '</p>';
    }
  },

  renderStatus(s) {
    const bar = document.getElementById('tg-status-bar');
    const offlineWarn = document.getElementById('tg-offline-warn');

    if (s.online) {
      bar.className = 'tg-status-bar online';
      bar.innerHTML = `
        <div class="tg-dot online"></div>
        <div class="tg-bot-info">
          <div class="tg-bot-nome">${AT.h(s.bot_nome || 'Bot')} está online</div>
          <div class="tg-bot-user">@${AT.h(s.bot_username || '')}</div>
        </div>
        ${s.link_bot ? '<a href="' + s.link_bot + '" target="_blank" class="tg-link-bot">🔗 Abrir bot</a>' : ''}
      `;
      offlineWarn.style.display = 'none';
    } else {
      bar.className = 'tg-status-bar offline';
      bar.innerHTML = `
        <div class="tg-dot offline"></div>
        <div class="tg-bot-info">
          <div class="tg-bot-nome" style="color: var(--red);">Bot offline</div>
          <div class="tg-bot-user">Configure TELEGRAM_BOT_TOKEN no .env</div>
        </div>
      `;
      offlineWarn.style.display = 'block';
    }
  },

  renderStats(s) {
    document.getElementById('tg-stat-online').textContent = s.online ? 'ON' : 'OFF';
    document.getElementById('tg-stat-vinculados').textContent = s.total_vinculados || 0;
    document.getElementById('tg-stat-pendentes').textContent = s.total_pendentes || 0;
  },

  filtrar(termo) {
    this.filtro = (termo || '').toLowerCase();
    this.renderVinculados();
  },

  renderVinculados() {
    const container = document.getElementById('tg-lista-vinculados');
    const cnt = document.getElementById('tg-cnt-vinculados');

    let lista = this.vinculados;
    if (this.filtro) {
      lista = lista.filter(v =>
        (v.agente_nome || '').toLowerCase().includes(this.filtro) ||
        (v.nome_telegram || '').toLowerCase().includes(this.filtro) ||
        (v.username || '').toLowerCase().includes(this.filtro) ||
        String(v.chat_id).includes(this.filtro)
      );
    }

    cnt.textContent = lista.length;

    if (!lista.length) {
      container.innerHTML = '<p class="empty" style="padding: 20px;">Nenhum vinculado' + (this.filtro ? ' com esse filtro' : '') + '</p>';
      return;
    }

    container.innerHTML = lista.map(v => {
      const inicial = (v.agente_nome || v.nome_telegram || '?')[0].toUpperCase();
      const userLink = v.username ? '@<a href="https://t.me/' + AT.h(v.username) + '" target="_blank">' + AT.h(v.username) + '</a>' : 'sem username';
      const dataVinc = v.vinculado_em ? new Date(v.vinculado_em).toLocaleDateString('pt-BR') : '';
      const inativoCls = v.ativo ? '' : 'inativo';
      return `
        <div class="tg-card ${inativoCls}">
          <div class="tg-avatar">${AT.h(inicial)}</div>
          <div class="tg-info">
            <div class="tg-nome">
              <span class="ag-nome-real">${AT.h(v.agente_nome || 'Agente #' + v.agente_id)}</span>
              <span class="ag-nome-tg">· TG: ${AT.h(v.nome_telegram || '—')}</span>
            </div>
            <div class="tg-meta">
              ID ${v.agente_id} · chat_id ${v.chat_id} · ${userLink}${dataVinc ? ' · desde ' + dataVinc : ''}
            </div>
          </div>
          <div class="tg-acoes">
            <button class="tg-btn testar" onclick="AT.tabs.telegram.testar(${v.agente_id})">🧪 Testar</button>
            <button class="tg-btn desvincular" onclick="AT.tabs.telegram.desvincular(${v.agente_id})">✕ Desvincular</button>
          </div>
        </div>
      `;
    }).join('');
  },

  renderPendentes() {
    const container = document.getElementById('tg-lista-pendentes');
    const cnt = document.getElementById('tg-cnt-pendentes');
    const secao = document.getElementById('tg-secao-pendentes');

    cnt.textContent = this.pendentes.length;

    if (!this.pendentes.length) {
      secao.style.display = 'none';
      return;
    }
    secao.style.display = 'block';

    // Lista de agentes disponíveis pro select
    const agentesOptions = AT.state.agentes
      .filter(a => a.name !== AT.state.nomeIA)
      .map(a => '<option value="' + a.id + '">' + AT.h(a.name) + ' (#' + a.id + ')</option>')
      .join('');

    container.innerHTML = this.pendentes.map(p => {
      const inicial = (p.nome_telegram || '?')[0].toUpperCase();
      const userLink = p.username ? '@<a href="https://t.me/' + AT.h(p.username) + '" target="_blank">' + AT.h(p.username) + '</a>' : 'sem username';
      const dataRec = p.recebido_em ? new Date(p.recebido_em).toLocaleString('pt-BR') : '';
      return `
        <div class="tg-card pendente">
          <div class="tg-avatar">${AT.h(inicial)}</div>
          <div class="tg-info">
            <div class="tg-nome">${AT.h(p.nome_telegram || 'Sem nome')}</div>
            <div class="tg-meta">chat_id ${p.chat_id} · ${userLink}${dataRec ? ' · recebido em ' + dataRec : ''}</div>
          </div>
          <div class="tg-acoes">
            <select id="tg-sel-${p.chat_id}" class="tg-pendente-select">
              <option value="">— Escolha o agente —</option>
              ${agentesOptions}
            </select>
            <button class="tg-btn vincular" onclick="AT.tabs.telegram.vincular(${p.chat_id})">✓ Vincular</button>
            <button class="tg-btn descartar" onclick="AT.tabs.telegram.descartar(${p.chat_id})" title="Remover sem vincular">🗑️</button>
          </div>
        </div>
      `;
    }).join('');
  },

  async testar(agenteId) {
    try {
      await API.post('/telegram/teste/' + agenteId);
      alert('✅ Mensagem de teste enviada!');
    } catch (e) {
      alert('❌ ' + e.message);
    }
  },

  async desvincular(agenteId) {
    if (!confirm('Desvincular esse agente do Telegram?')) return;
    try {
      await API.post('/telegram/desvincular/' + agenteId);
      await this.load();
    } catch (e) {
      alert('❌ ' + e.message);
    }
  },

  async vincular(chatId) {
    const sel = document.getElementById('tg-sel-' + chatId);
    const agenteId = parseInt(sel.value, 10);
    if (!agenteId) { alert('Escolha um agente!'); return; }
    try {
      await API.post('/telegram/vincular', { chat_id: chatId, agente_id: agenteId });
      await this.load();
    } catch (e) {
      alert('❌ ' + e.message);
    }
  },

  async descartar(chatId) {
    if (!confirm('Descartar esse pendente? (ele vai sumir da lista)')) return;
    try {
      await API.del('/telegram/pendentes/' + chatId);
      await this.load();
    } catch (e) {
      alert('❌ ' + e.message);
    }
  },
};
