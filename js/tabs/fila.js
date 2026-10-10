// public/js/tabs/fila.js
// Aba Fila — casos novos por dia, agrupados por time + categorias opcionais.

AT.tabs.fila = {
  catVisivel: true,

  async load() {
    const dias = document.getElementById('fila-dias').value || '7';
    const container = document.getElementById('fila-container');
    container.innerHTML = '<p class="loading">Carregando…</p>';

    try {
      const [dados, categorias] = await Promise.all([
        API.get('/fila?dias=' + dias),
        API.get('/fila/categorias?dias=' + dias),
      ]);

      const mapaCat = {};
      categorias.forEach(c => { mapaCat[c.dia] = c; });

      this.render(dados, mapaCat);
    } catch (e) {
      container.innerHTML = '<p class="empty">Erro: ' + AT.h(e.message) + '</p>';
    }
  },

  toggleCat() {
    this.catVisivel = !this.catVisivel;
    // Atualiza ícone do botão
    const btn = document.getElementById('btn-toggle-cat');
    if (btn) btn.innerHTML = this.catVisivel ? '👁️' : '👁️‍🗨️';
    // Mostra/esconde todas as linhas de categoria
    document.querySelectorAll('.fila-categorias').forEach(el => {
      el.style.display = this.catVisivel ? 'flex' : 'none';
    });
  },

  render(dados, mapaCat) {
    const container = document.getElementById('fila-container');

    if (!dados.length) {
      container.innerHTML = '<div class="empty"><div class="emoji">📭</div><p>Nenhum caso novo no período</p></div>';
      return;
    }

    // Botão olho no topo
    const btnOlho = `
      <div class="fila-cat-toggle">
        <span class="fila-cat-toggle-label">Origem</span>
        <button id="btn-toggle-cat" class="btn-olho" onclick="AT.tabs.fila.toggleCat()" title="Mostrar/ocultar origem">
          ${this.catVisivel ? '👁️' : '👁️‍🗨️'}
        </button>
      </div>
    `;

    const cards = dados.map(d => {
      const data = new Date(d.dia + 'T12:00');
      const diaSemana = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'][data.getDay()];
      const dataStr = data.toLocaleDateString('pt-BR');

      const timesHtml = d.times.map(t => `
        <div class="fila-time-item">
          <span class="fila-time-nome">${AT.h(t.time)}</span>
          <span class="fila-time-valor">${t.casos.toLocaleString('pt-BR')}</span>
        </div>
      `).join('');

      // Badges de categoria
      const cat = mapaCat[d.dia];
      let catHtml = '';
      if (cat) {
        const badges = [
          cat.clickbank > 0 ? `
            <div class="fila-cat-badge clickbank">
              <span class="fila-cat-dot"></span>
              <span class="fila-cat-nome">ClickBank</span>
              <span class="fila-cat-valor">${cat.clickbank.toLocaleString('pt-BR')}</span>
            </div>` : '',
          cat.ia > 0 ? `
            <div class="fila-cat-badge ia">
              <span class="fila-cat-dot"></span>
              <span class="fila-cat-nome">IA</span>
              <span class="fila-cat-valor">${cat.ia.toLocaleString('pt-BR')}</span>
            </div>` : '',
          cat.organico > 0 ? `
            <div class="fila-cat-badge organico">
              <span class="fila-cat-dot"></span>
              <span class="fila-cat-nome">Orgânico</span>
              <span class="fila-cat-valor">${cat.organico.toLocaleString('pt-BR')}</span>
            </div>` : '',
        ].filter(Boolean).join('');

        if (badges) {
          catHtml = `<div class="fila-categorias" style="display:${this.catVisivel ? 'flex' : 'none'}">${badges}</div>`;
        }
      }

      return `
        <div class="fila-dia-card">
          <div class="fila-dia-header">
            <div class="fila-dia-label"><span class="dia-semana">${diaSemana}</span>${dataStr}</div>
            <div class="fila-dia-total">${d.total.toLocaleString('pt-BR')} casos</div>
          </div>
          <div class="fila-times">${timesHtml}</div>
          ${catHtml}
        </div>
      `;
    }).join('');

    container.innerHTML = btnOlho + cards;
  },
};