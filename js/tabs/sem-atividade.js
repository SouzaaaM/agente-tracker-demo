// public/js/tabs/sem-atividade.js
// Aba Sem atividade — lista agentes que não mandaram msg ou sumiram.
// Usa horário comercial (9h-18h, seg-sex) descontando almoço (12:30-14:00).

AT.tabs['sem-atividade'] = {
  async load() {
    const horas = document.getElementById('sa-horas').value || '2';

    const listaVazia = document.getElementById('sa-lista-vazia');
    const listaSumiu = document.getElementById('sa-lista-sumiu');
    const foraHorario = document.getElementById('sa-fora-horario');
    const gruposWrap = document.getElementById('sa-grupos-wrap');

    listaVazia.innerHTML = '<p class="loading">Carregando…</p>';
    listaSumiu.innerHTML = '';

    try {
      const d = await API.get('/sem-atividade?horas=' + horas);

      if (d.fora_horario) {
        gruposWrap.style.display = 'none';
        foraHorario.style.display = 'block';
        foraHorario.innerHTML = `⏸️ Fora do horário comercial (<b>${d.horario_comercial.inicio}h–${d.horario_comercial.fim}h</b>, seg-sex).<br>A aba só mostra inatividade durante o expediente.`;
        return;
      }

      foraHorario.style.display = 'none';
      gruposWrap.style.display = 'block';

      // Contadores
      document.getElementById('sa-cnt-nenhuma').textContent = d.sem_nenhuma.length;
      document.getElementById('sa-cnt-sumiu').textContent = d.sumiu.length;

      // Lista 1: ninguém mandou hoje
      if (!d.sem_nenhuma.length) {
        listaVazia.innerHTML = '<p class="empty" style="padding: 20px;">✓ Todos mandaram pelo menos uma msg</p>';
      } else {
        listaVazia.innerHTML = d.sem_nenhuma.map(a => `
          <div class="sa-card">
            <div class="sa-avatar vermelho">${AT.h((a.name || '?')[0])}</div>
            <div class="sa-info-pessoa">
              <div class="sa-nome">${AT.h(a.name)}</div>
              <div class="sa-detalhe">${AT.h(a.email || '')} · 0 msgs hoje</div>
            </div>
          </div>
        `).join('');
      }

      // Lista 2: sumiu há X horas
      if (!d.sumiu.length) {
        listaSumiu.innerHTML = '<p class="empty" style="padding: 20px;">✓ Ninguém sumiu</p>';
      } else {
        d.sumiu.sort((a, b) => b.horas_desde_ultima - a.horas_desde_ultima);
        listaSumiu.innerHTML = d.sumiu.map(a => {
          const ultima = new Date(a.ultima_msg_hoje).toLocaleTimeString('pt-BR', {
            hour: '2-digit', minute: '2-digit',
          });
          return `
            <div class="sa-card">
              <div class="sa-avatar laranja">${AT.h((a.name || '?')[0])}</div>
              <div class="sa-info-pessoa">
                <div class="sa-nome">${AT.h(a.name)}</div>
                <div class="sa-detalhe">Última: ${ultima} · sumiu há ${a.horas_desde_ultima}h (comercial)</div>
              </div>
            </div>
          `;
        }).join('');
      }
    } catch (e) {
      listaVazia.innerHTML = '<p class="empty">Erro: ' + AT.h(e.message) + '</p>';
    }
  },
};
