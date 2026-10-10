// public/js/tabs/ranking.js
// Aba Ranking — lista agentes ordenados por problemas.
// Mostra summary-bar no topo + tabela clicável.

AT.tabs.ranking = {
  async load() {
    const tbody = document.querySelector('#tab-ranking tbody');
    tbody.innerHTML = '<tr><td colspan="7" class="loading">Carregando…</td></tr>';

    try {
      const dados = await API.get('/ranking?parado_dias=' + AT.state.paradoDias);
      const semIA = dados.filter(d => d.name !== AT.state.nomeIA);

      // Soma dos totais pro summary-bar
      const somas = semIA.reduce((s, a) => ({
        ign: s.ign + parseInt(a.ignorados),
        par: s.par + parseInt(a.parados),
        agu: s.agu + parseInt(a.aguardando),
        and: s.and + parseInt(a.em_andamento),
        tot: s.tot + parseInt(a.total),
      }), { ign: 0, par: 0, agu: 0, and: 0, tot: 0 });

      // Renderiza summary-bar
      document.getElementById('ranking-summary').innerHTML = `
        <div class="summary-card c-agentes"><div class="s-label">👥 Agentes</div><div class="s-value">${semIA.length}</div></div>
        <div class="summary-card c-casos"><div class="s-label">📂 Casos</div><div class="s-value">${somas.tot}</div></div>
        <div class="summary-card c-ignorados"><div class="s-label">🔴 Ignorados</div><div class="s-value">${somas.ign}</div></div>
        <div class="summary-card c-parados"><div class="s-label">💤 Parados</div><div class="s-value">${somas.par}</div></div>
        <div class="summary-card c-aguardando"><div class="s-label">🟡 Aguardando</div><div class="s-value">${somas.agu}</div></div>
        <div class="summary-card c-andamento"><div class="s-label">🟢 Andamento</div><div class="s-value">${somas.and}</div></div>
      `;

      if (!semIA.length) {
        tbody.innerHTML = '<tr><td colspan="7" class="empty">Nenhum agente</td></tr>';
        return;
      }

      tbody.innerHTML = semIA.map((a, i) => {
        const medalha = i === 0 ? 'top1' : i === 1 ? 'top2' : i === 2 ? 'top3' : '';
        const nomeEsc = AT.h(a.name).replace(/'/g, "\\'");
        return `
          <tr class="clickable" onclick="AT.irParaAgente(${a.id}, '${nomeEsc}')">
            <td><span class="rank-pos ${medalha}">${i + 1}</span></td>
            <td>
              <div><strong>${AT.h(a.name)}</strong> <span class="agente-id">· ID ${a.id}</span></div>
              <div class="cliente-email">${AT.h(a.email || '')}</div>
            </td>
            <td class="center n-ignorado">${a.ignorados}</td>
            <td class="center n-parado">${a.parados}</td>
            <td class="center n-aguardando">${a.aguardando}</td>
            <td class="center n-andamento">${a.em_andamento}</td>
            <td class="center" style="color: var(--text-dim);">${a.total}</td>
          </tr>
        `;
      }).join('');
    } catch (e) {
      tbody.innerHTML = '<tr><td colspan="7" class="empty">Erro: ' + AT.h(e.message) + '</td></tr>';
    }
  }
};
