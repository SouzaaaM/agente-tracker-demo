// public/js/tabs/relatorios.js

AT.tabs.relatorios = {
  async load() {
    const hoje = new Date();
    const seteDias = new Date();
    seteDias.setDate(hoje.getDate() - 6);
    const fmt = d => d.toISOString().slice(0, 10);

    // Fila
    const inputDe  = document.getElementById('rel-fila-de');
    const inputAte = document.getElementById('rel-fila-ate');
    if (inputDe && !inputDe.value)  inputDe.value  = fmt(seteDias);
    if (inputAte && !inputAte.value) inputAte.value = fmt(hoje);

    // Dia a Dia Agentes
    const inputDdDe  = document.getElementById('rel-ddia-de');
    const inputDdAte = document.getElementById('rel-ddia-ate');
    if (inputDdDe && !inputDdDe.value)  inputDdDe.value  = fmt(seteDias);
    if (inputDdAte && !inputDdAte.value) inputDdAte.value = fmt(hoje);
  },

  baixarCasos() {
    window.open('/api/relatorios/casos-sem-resposta?parado_dias=' + AT.state.paradoDias, '_blank');
  },

  baixarAnalise(semana) {
    window.open('/api/relatorios/analise-agentes?semana=' + semana, '_blank');
  },

  baixarResumo() {
    window.open('/api/relatorios/resumo-agentes', '_blank');
  },

  baixarFila() {
    const de  = document.getElementById('rel-fila-de')?.value;
    const ate = document.getElementById('rel-fila-ate')?.value;
    if (!de || !ate) return alert('Preencha as duas datas!');
    if (de > ate)    return alert('A data "de" não pode ser maior que "até"!');
    window.open(`/api/relatorios/fila?de=${de}&ate=${ate}`, '_blank');
  },

  baixarDiaDia() {
    const de  = document.getElementById('rel-ddia-de')?.value;
    const ate = document.getElementById('rel-ddia-ate')?.value;
    if (!de || !ate) return alert('Preencha as duas datas!');
    if (de > ate)    return alert('A data "de" não pode ser maior que "até"!');
    window.open(`/api/relatorios/dia-dia-agentes?de=${de}&ate=${ate}`, '_blank');
  },
};