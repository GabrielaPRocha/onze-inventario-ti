// ═══════════════════════════════════════
// ui/dashboard.js — Dashboard view
// ═══════════════════════════════════════

import { store }       from '../store.js';
import { CHART_COLORS } from '../config.js';
import { gh }          from '../github.js';

export function buildDashboard() {
  const d = store.data;
  const total   = d.length;
  const emUso   = d.filter(r => r.status === 'Em uso').length;
  const estoque = d.filter(r => r.status === 'Estoque').length;
  const cani    = d.filter(r => r.status === 'Canibalização').length;
  const avari   = d.filter(r => r.avariado === 'Sim' || r.avariado === 'Talvez').length;
  const fmt     = d.filter(r => r.formatado === 'Sim').length;

  // ── Stats ──
  document.getElementById('stats-grid').innerHTML = `
    <div class="stat-card">
      <div class="s-label">Total</div>
      <div class="s-val">${total}</div>
      <div class="s-sub">no inventário</div>
    </div>
    <div class="stat-card c-teal">
      <div class="s-label">Em Uso</div>
      <div class="s-val">${emUso}</div>
      <div class="s-sub">${pct(emUso, total)}</div>
    </div>
    <div class="stat-card c-blue">
      <div class="s-label">Estoque</div>
      <div class="s-val">${estoque}</div>
      <div class="s-sub">disponíveis</div>
    </div>
    <div class="stat-card c-red">
      <div class="s-label">Avariadas</div>
      <div class="s-val">${avari}</div>
      <div class="s-sub">com defeito</div>
    </div>
    <div class="stat-card c-or">
      <div class="s-label">Canibalização</div>
      <div class="s-val">${cani}</div>
      <div class="s-sub">para peças</div>
    </div>
    <div class="stat-card c-green">
      <div class="s-label">Formatadas</div>
      <div class="s-val">${fmt}</div>
      <div class="s-sub">prontas</div>
    </div>`;

  // ── Alerts ──
  const noLiga  = d.filter(r => (r.obs || '').toUpperCase().includes('NÃO LIGA'));
  const semSN   = d.filter(r => !r.sn && r.status === 'Em uso');
  let alerts = '';
  if (noLiga.length)   alerts += `<div class="alert danger">⚡ <div><strong>${noLiga.length} máquinas "Não Liga"</strong>Considere mover para Canibalização.</div></div>`;
  if (semSN.length)    alerts += `<div class="alert info">🔍 <div><strong>${semSN.length} em uso sem S/N</strong>Preencha para rastreabilidade.</div></div>`;
  if (cani > 0)        alerts += `<div class="alert warn">♻️ <div><strong>${cani} em Canibalização</strong>Acesse a aba para ver as peças.</div></div>`;
  if (!gh.connected)   alerts += `<div class="alert teal">💾 <div><strong>GitHub não configurado</strong>Clique em "⚙ GitHub" para conectar e salvar seus dados.</div></div>`;
  document.getElementById('alerts-box').innerHTML = alerts;

  // ── Chart: Modelos ──
  const mc = {};
  d.forEach(r => { const m = r.modelo || 'Outro'; mc[m] = (mc[m] || 0) + 1; });
  const models = Object.entries(mc).sort((a, b) => b[1] - a[1]).slice(0, 8);
  const maxM = models[0]?.[1] || 1;
  document.getElementById('chart-models').innerHTML = models.map(([m, c], i) => `
    <div class="bar-row">
      <span class="bar-label" title="${m}">${m}</span>
      <div class="bar-track">
        <div class="bar-fill" style="width:${Math.round(c/maxM*100)}%;background:${CHART_COLORS[i % CHART_COLORS.length]}">${c}</div>
      </div>
      <span class="bar-num">${c}</span>
    </div>`).join('');

  // ── Chart: Status ──
  const sc = {};
  d.forEach(r => { const s = r.status || 'Não definido'; sc[s] = (sc[s] || 0) + 1; });
  const statuses = Object.entries(sc).sort((a, b) => b[1] - a[1]);
  const maxS = statuses[0]?.[1] || 1;
  const S_COLORS = { 'Em uso':'#2ABFBF','Estoque':'#2980B9','Canibalização':'#E67E22','Sucata':'#E74C3C','Não definido':'#9BB5C8' };
  document.getElementById('chart-status').innerHTML = statuses.map(([s, c]) => `
    <div class="bar-row">
      <span class="bar-label">${s}</span>
      <div class="bar-track">
        <div class="bar-fill" style="width:${Math.round(c/maxS*100)}%;background:${S_COLORS[s] || '#9BB5C8'}">${c}</div>
      </div>
      <span class="bar-num">${c}</span>
    </div>`).join('');
}

function pct(a, b) { return b ? Math.round(a / b * 100) + '%' : '0%'; }
