// public/js/tabs/historico.js
// Aba Histórico — gráficos do agente + distribuição de casos por time.

AT.tabs.historico = {
  dados: [],

  async load() {
    const empty = document.getElementById('historico-empty');
    const content = document.getElementById('historico-content');

    if (!AT.state.agenteId) {
      empty.style.display = 'block';
      content.style.display = 'none';
      return;
    }

    empty.style.display = 'none';
    content.style.display = 'block';

    document.getElementById('historico-titulo').textContent = AT.state.agenteNome || 'Histórico';

    const dias = document.getElementById('historico-dias').value || '30';

    try {
      this.dados = await API.get(`/historico/${AT.state.agenteId}?dias=${dias}`);
      this.renderBarras();
      this.renderLinha();
    } catch (e) {
      console.error(e);
      document.getElementById('barras-container').innerHTML =
        '<p class="empty">Erro: ' + AT.h(e.message) + '</p>';
    }

    // Carrega distribuição por time (ontem + hoje)
    await this.loadTimes();
  },

  renderBarras() {
    const container = document.getElementById('barras-container');
    if (!this.dados.length) {
      container.innerHTML = '<p class="empty">Sem dados</p>';
      return;
    }
    const max = Math.max(...this.dados.map(x => x.mensagens), 1);

    container.innerHTML = this.dados.map(x => {
      const altura = (x.mensagens / max) * 100;
      const label = new Date(x.dia + 'T12:00').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
      return `
        <div class="barra-item" title="${label}: ${x.mensagens} msgs">
          ${x.mensagens > 0 ? `<div class="barra-valor">${x.mensagens}</div>` : ''}
          <div class="barra" style="height: ${altura}%"></div>
          <div class="barra-label">${label}</div>
        </div>
      `;
    }).join('');
  },

  renderLinha() {
    const svg = document.getElementById('linha-svg');
    const w = svg.clientWidth || 800;
    const h = 240;
    const px = 40;
    const py = 25;

    if (!this.dados.length) return;

    const maxY = Math.max(...this.dados.map(x => Math.max(x.mensagens, x.conversas)), 1);
    const sx = (w - 2 * px) / Math.max(this.dados.length - 1, 1);
    const escalaY = v => h - py - ((v / maxY) * (h - 2 * py));

    const pontosMsgs = this.dados.map((x, i) => `${px + i * sx},${escalaY(x.mensagens)}`).join(' ');
    const pontosConvs = this.dados.map((x, i) => `${px + i * sx},${escalaY(x.conversas)}`).join(' ');

    let tip = document.getElementById('hist-tooltip');
    if (!tip) {
      tip = document.createElement('div');
      tip.id = 'hist-tooltip';
      document.body.appendChild(tip);
    }

    let circles = '';
    this.dados.forEach((x, i) => {
      const cx = px + i * sx;
      const cyM = escalaY(x.mensagens);
      const cyC = escalaY(x.conversas);
      circles += `<circle cx="${cx}" cy="${cyM}" r="3.5" fill="#4f9eff" stroke="#0a0e15" stroke-width="1.5"/>`;
      circles += `<circle cx="${cx}" cy="${cyC}" r="3.5" fill="#2ecc71" stroke="#0a0e15" stroke-width="1.5"/>`;
      const dataStr = new Date(x.dia + 'T12:00').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', weekday: 'short' });
      circles += `<rect x="${cx - sx/2}" y="0" width="${sx}" height="${h}" fill="transparent"
                         data-dia="${dataStr}" data-msgs="${x.mensagens}" data-convs="${x.conversas}"
                         class="hover-area" style="cursor: crosshair"/>`;
    });

    svg.innerHTML = `
      <polyline points="${pontosMsgs}" fill="none" stroke="#4f9eff" stroke-width="2"/>
      <polyline points="${pontosConvs}" fill="none" stroke="#2ecc71" stroke-width="2" stroke-dasharray="4,3"/>
      ${circles}
    `;

    svg.querySelectorAll('.hover-area').forEach(rect => {
      rect.addEventListener('mousemove', e => {
        const dia = rect.getAttribute('data-dia');
        const msgs = rect.getAttribute('data-msgs');
        const convs = rect.getAttribute('data-convs');
        const semAtividade = parseInt(msgs, 10) === 0;
        tip.innerHTML = `
          <div style="font-weight: 700; margin-bottom: 6px; color: var(--text);">${dia}</div>
          <div style="color: #4f9eff;">● Mensagens: <b>${msgs}</b></div>
          <div style="color: #2ecc71;">● Conversas: <b>${convs}</b></div>
          ${semAtividade ? '<div style="color: #f5a623; margin-top: 4px; font-size: 11px;">⚠️ Sem atividade</div>' : ''}
        `;
        tip.style.display = 'block';
        tip.style.left = (e.clientX + 14) + 'px';
        tip.style.top = (e.clientY - 10) + 'px';
      });
      rect.addEventListener('mouseleave', () => { tip.style.display = 'none'; });
    });
  },

  // ─── Distribuição por time ──────────────────────────────────────────────────

  async loadTimes() {
    const container = document.getElementById('historico-times-container');
    if (!container) return;

    container.innerHTML = '<p class="loading">Carregando distribuição…</p>';

    try {
      const [ontem, hoje] = await Promise.all([
        API.get('/historico/times/ontem'),
        API.get('/historico/times/hoje'),
      ]);
      this.renderTimes(ontem, hoje, container);
    } catch (e) {
      container.innerHTML = '<p class="empty">Erro ao carregar distribuição: ' + AT.h(e.message) + '</p>';
    }
  },

  renderTimes(ontem, hoje, container) {
    const bloco = (dados) => {
      if (!dados || !dados.times || !dados.times.length) {
        return '<p class="empty" style="font-size:12px;">Sem dados</p>';
      }

      const dataFmt = new Date(dados.data + 'T12:00').toLocaleDateString('pt-BR', {
        weekday: 'long', day: '2-digit', month: '2-digit'
      });

      const linhas = dados.times.map(t => {
        const barW = t.pct || 0;
        return `
          <div class="hist-time-linha">
            <div class="hist-time-nome">${AT.h(t.time)}</div>
            <div class="hist-time-barra-wrap">
              <div class="hist-time-barra" style="width: ${barW}%"></div>
            </div>
            <div class="hist-time-nums">
              <span class="hist-time-total">${t.total.toLocaleString('pt-BR')}</span>
              <span class="hist-time-pct">${barW}%</span>
              ${t.sem_agente > 0 ? `<span class="hist-time-semag" title="sem agente">⚠️ ${t.sem_agente}</span>` : ''}
            </div>
          </div>
        `;
      }).join('');

      return `
        <div class="hist-times-bloco">
          <div class="hist-times-header">
            <span class="hist-times-data">${dataFmt}</span>
            <span class="hist-times-total-geral">${dados.total_geral.toLocaleString('pt-BR')} casos</span>
          </div>
          <div class="hist-times-lista">${linhas}</div>
        </div>
      `;
    };

    container.innerHTML = `
      <div class="hist-times-grid">
        ${bloco(ontem)}
        ${bloco(hoje)}
      </div>
    `;
  },
};
