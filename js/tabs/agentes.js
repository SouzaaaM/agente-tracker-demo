// public/js/tabs/agentes.js
// Aba Agentes — lista todos agentes com toggle pra incluir/excluir dos relatórios.

AT.tabs.agentes = {
  lista: [],
  filtro: '',

  async load() {
    const tbody = document.getElementById('ag-lista');
    tbody.innerHTML = '<p class="loading">Carregando…</p>';

    try {
      this.lista = await API.get('/agentes/todos');
      this.render();
    } catch (e) {
      tbody.innerHTML = '<p class="empty">Erro: ' + AT.h(e.message) + '</p>';
    }
  },

  filtrar(termo) {
    this.filtro = (termo || '').toLowerCase();
    this.render();
  },

  async toggleAgente(id, checked) {
    try {
      await API.post('/agentes/toggle-relatorio', { id, incluir: checked });
      // Atualiza localmente
      const a = this.lista.find(x => x.id === id);
      if (a) a.incluir_relatorios = checked;
      this.render();
    } catch (e) {
      alert('Erro: ' + e.message);
    }
  },

  render() {
    const container = document.getElementById('ag-lista');
    const nomeIA = AT.state.nomeIA;

    // Remove IA da lista
    let lista = this.lista.filter(a => a.name !== nomeIA);

    // Aplica filtro
    if (this.filtro) {
      lista = lista.filter(a =>
        (a.name || '').toLowerCase().includes(this.filtro) ||
        (a.email || '').toLowerCase().includes(this.filtro)
      );
    }

    // Atualiza stats
    const total = this.lista.filter(a => a.name !== nomeIA).length;
    const incluidos = this.lista.filter(a => a.name !== nomeIA && a.incluir_relatorios).length;
    const excluidos = total - incluidos;
    document.getElementById('ag-stat-total').textContent = total;
    document.getElementById('ag-stat-incluidos').textContent = incluidos;
    document.getElementById('ag-stat-excluidos').textContent = excluidos;

    if (!lista.length) {
      container.innerHTML = '<p class="empty">Nenhum agente encontrado</p>';
      return;
    }

    // Ordena: primeiro incluídos, depois excluídos, por nome
    lista.sort((a, b) => {
      if (a.incluir_relatorios !== b.incluir_relatorios) {
        return a.incluir_relatorios ? -1 : 1;
      }
      return a.name.localeCompare(b.name);
    });

    container.innerHTML = lista.map(a => {
      const checked = a.incluir_relatorios ? 'checked' : '';
      const inicial = (a.name || '?')[0].toUpperCase();
      const badgeCasos = a.casos_abertos > 0
        ? `<span class="ag-casos com">${a.casos_abertos} casos</span>`
        : `<span class="ag-casos">sem casos</span>`;
      const labelClass = a.incluir_relatorios ? 'on' : 'off';
      const labelText = a.incluir_relatorios ? 'Incluído' : 'Excluído';

      return `
        <div class="ag-card ${a.incluir_relatorios ? '' : 'excluido'}">
          <div class="ag-avatar">${AT.h(inicial)}</div>
          <div class="ag-info-pessoa">
            <div class="ag-nome">${AT.h(a.name)}</div>
            <div class="ag-detalhe">${AT.h(a.email || '')} · ID ${a.id}</div>
          </div>
          ${badgeCasos}
          <span class="switch-label ${labelClass}">${labelText}</span>
          <label class="switch">
            <input type="checkbox" ${checked} onchange="AT.tabs.agentes.toggleAgente(${a.id}, this.checked)">
            <span class="switch-slider"></span>
          </label>
        </div>
      `;
    }).join('');
  },
};
