// public/js/demo.js — ajustes que só existem na versão demo

// A aba "Sem atividade" usa o id "inatividade" na sidebar
AT.tabs.inatividade = AT.tabs['sem-atividade'];

// Relatórios em Excel dependem do servidor (ExcelJS) → na demo só avisa
(function () {
  const aviso = () => alert(
    '📑 Na versão real, este botão gera um arquivo Excel no servidor (ExcelJS) ' +
    'com os dados do PostgreSQL.\n\nNesta demo não há servidor, então o download está desativado.'
  );
  ['baixarCasos', 'baixarAnalise', 'baixarResumo', 'baixarFila', 'baixarDiaDia']
    .forEach(fn => { AT.tabs.relatorios[fn] = aviso; });
})();
