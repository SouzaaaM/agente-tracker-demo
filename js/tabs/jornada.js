// public/js/tabs/jornada.js
// Aba Jornada — mostra a semana do agente dia a dia, com primeira/última msg,
// buracos de tempo (sem atividade) e almoço identificado.

AT.tabs.jornada = {
  dados: null,

  async load() {
    const empty = document.getElementById('jornada-empty');
    const content = document.getElementById('jornada-content');

    if (!AT.state.agenteId) {
      empty.style.display = 'block';
      content.style.display = 'none';
      return;
    }

    empty.style.display = 'none';
    content.style.display = 'block';

    document.getElementById('jornada-titulo').textContent = AT.state.agenteNome || 'Jornada';

    const semana = document.getElementById('jornada-semana').value || 'atual';
    const container = document.getElementById('jornada-dias-container');
    container.innerHTML = '<p class="loading">Carregando…</p>';

    try {
      this.dados = await API.get(`/jornada/${AT.state.agenteId}?semana=${semana}&buraco_min=40`);
      this.render();
    } catch (e) {
      console.error(e);
      container.innerHTML = '<p class="empty">Erro: ' + AT.h(e.message) + '</p>';
    }
  },

  render() {
    const container = document.getElementById('jornada-dias-container');
    if (!this.dados?.dias) return;

    container.innerHTML = this.dados.dias.map((d, idx) => this.cardDia(d, idx)).join('');
  },

  cardDia(d, idx) {
    const dataFormatada = new Date(d.dia + 'T12:00').toLocaleDateString('pt-BR');

    // Dia sem atividade
    if (d.total_mensagens === 0) {
      return `
        <div class="jornada-dia vazio">
          <div class="jornada-dia-header">
            <div class="jornada-dia-label"><span class="dia-semana">${d.dia_semana}</span> ${dataFormatada}</div>
            <div class="jornada-dia-stats">— sem atividade —</div>
          </div>
        </div>
      `;
    }

    const primeira = new Date(d.primeira);
    const ultima = new Date(d.ultima);
    const formatHora = (dt) => dt.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    const duracao = AT.formatTempo(Math.round((ultima - primeira) / 60000));

    // Períodos (buracos/almoço)
    let periodosHtml = '';
    if (d.periodos?.length) {
      periodosHtml = `<div class="jornada-periodos">${d.periodos.map(p => {
        const hi = formatHora(new Date(p.inicio));
        const hf = formatHora(new Date(p.fim));
        if (p.tipo === 'almoco') {
          return `<div class="periodo-item almoco">🍽️ Almoço · ${hi}–${hf} · ${AT.formatTempo(p.minutos)}</div>`;
        }
        return `<div class="periodo-item buraco">⚠️ ${AT.formatTempo(p.minutos)} sem atividade · ${hi}–${hf}</div>`;
      }).join('')}</div>`;
    }

    // Toggle de horários
    const idToggle = 'horarios-' + idx;
    const horariosHtml = (d.horarios || []).map(h => `<span class="hora-chip">${h.hora}</span>`).join('');

    return `
      <div class="jornada-dia">
        <div class="jornada-dia-header">
          <div class="jornada-dia-label"><span class="dia-semana">${d.dia_semana}</span> ${dataFormatada}</div>
          <div class="jornada-dia-stats">${d.total_mensagens} msgs · ${duracao}</div>
        </div>

        <div class="jornada-stats">
          <div class="jornada-stat-box">
            <div class="jsb-label">🌅 Primeira</div>
            <div class="jsb-valor">${formatHora(primeira)}</div>
          </div>
          <div class="jornada-stat-box">
            <div class="jsb-label">🌙 Última</div>
            <div class="jsb-valor">${formatHora(ultima)}</div>
          </div>
          <div class="jornada-stat-box">
            <div class="jsb-label">📊 Mensagens</div>
            <div class="jsb-valor">${d.total_mensagens}</div>
          </div>
        </div>

        ${periodosHtml}

        <div class="horarios-toggle" onclick="document.getElementById('${idToggle}').classList.toggle('show')">
          🕐 Ver todas as ${d.total_mensagens} mensagens
        </div>
        <div class="horarios-lista" id="${idToggle}">
          <div class="horarios-grid">${horariosHtml}</div>
        </div>
      </div>
    `;
  },
};
