// public/js/core.js
// Estado global da aplicação + roteamento de abas + init.

const AT = {
  // Estado global
  state: {
    status: null,            // { chatwoot_url, nome_ia, versao }
    agentes: [],             // lista de agentes disponíveis
    agenteId: null,          // agente atualmente selecionado
    agenteNome: '',          // nome do agente selecionado
    paradoDias: 3,           // filtro "parado há"
    nomeIA: 'Assistente IA',
    tabAtiva: 'ranking',
  },

  // Registry de abas — cada aba registra seu loader aqui
  tabs: {},

  // Helpers de DOM/escape
  h(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[c]));
  },

  formatTempo(minutos) {
    const m = Math.round(minutos);
    if (m < 60) return m + ' min';
    const h = Math.floor(m / 60);
    const r = m % 60;
    if (h < 24) return h + 'h' + (r > 0 ? ' ' + r + 'min' : '');
    return Math.floor(h / 24) + 'd ' + (h % 24) + 'h';
  },

  formatData(iso) {
    if (!iso) return '';
    return new Date(iso).toLocaleString('pt-BR');
  },

  // v2.1: sync paradoDias - lê o valor atual do dropdown e atualiza o state
  // Chamar antes de qualquer load() pra garantir que o valor não tá em cache
  syncParadoDias() {
    const sel = document.getElementById('parado-dias');
    if (sel) this.state.paradoDias = parseInt(sel.value, 10);
  },

  // Troca de aba
  async mudarTab(tabId) {
    this.state.tabAtiva = tabId;

    // Atualiza visual da sidebar
    document.querySelectorAll('.sb-nav-item').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.tab === tabId);
    });

    // Mostra a section correta
    document.querySelectorAll('main section').forEach(s => {
      s.classList.toggle('active', s.id === 'tab-' + tabId);
    });

    // Chama o loader registrado (se tiver)
    this.syncParadoDias(); // v2.1: sempre sincroniza antes de load
    const loader = this.tabs[tabId];
    if (loader && typeof loader.load === 'function') {
      try {
        await loader.load();
      } catch (e) {
        console.error('Erro na aba ' + tabId + ':', e);
      }
    }
  },

  // Quando o agente muda no dropdown
  async onAgenteChange() {
    const sel = document.getElementById('agente-select');
    this.state.agenteId = sel.value ? parseInt(sel.value, 10) : null;
    this.state.agenteNome = sel.options[sel.selectedIndex]?.text.replace(/\s*\(\d+\)$/, '') || '';

    this.syncParadoDias();
    const loader = this.tabs[this.state.tabAtiva];
    if (loader && typeof loader.load === 'function') {
      await loader.load();
    }
  },

  // Quando muda o "parado há"
  async onParadoDiasChange() {
    this.syncParadoDias();
    const loader = this.tabs[this.state.tabAtiva];
    if (loader && typeof loader.load === 'function') {
      await loader.load();
    }
  },

  // Recarregar tudo
  async recarregarTudo() {
    this.syncParadoDias();
    const loader = this.tabs[this.state.tabAtiva];
    if (loader && typeof loader.load === 'function') {
      await loader.load();
    }
  },

  // Programar a página pro usuário ver resultado de navegar "pra Casos de um agente X"
  irParaAgente(agenteId, agenteNome) {
    this.state.agenteId = agenteId;
    this.state.agenteNome = agenteNome;
    // Atualiza dropdown visualmente
    document.getElementById('agente-select').value = agenteId;
    this.mudarTab('casos');
  },

  // Inicialização
  async init() {
    // 1. Puxa status
    try {
      this.state.status = await API.get('/status');
      this.state.nomeIA = this.state.status.nome_ia;
    } catch (e) {
      console.error('Erro carregando status:', e);
    }

    // 2. Puxa agentes e popula o dropdown
    try {
      this.state.agentes = await API.get('/agentes');
      const sel = document.getElementById('agente-select');
      const agentesNaoIA = this.state.agentes.filter(a => a.name !== this.state.nomeIA);
      agentesNaoIA.forEach(a => {
        const opt = document.createElement('option');
        opt.value = a.id;
        opt.textContent = a.name + ' (' + a.abertos + ')';
        sel.appendChild(opt);
      });
    } catch (e) {
      console.error('Erro carregando agentes:', e);
    }

    // 3. Registra event listeners na sidebar
    document.querySelectorAll('.sb-nav-item').forEach(btn => {
      btn.addEventListener('click', () => this.mudarTab(btn.dataset.tab));
    });

    // 4. Carrega a aba inicial
    await this.mudarTab('ranking');
  },
};

// Boot quando o DOM tá pronto
document.addEventListener('DOMContentLoaded', () => {
  AT.init();
});
