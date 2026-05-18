// ═══════════════════════════════════════
// ui/cani.js — Aba de Canibalização
// ═══════════════════════════════════════

import { store }   from '../store.js';
import { fabChip } from '../helpers.js';
import { PARTS }   from '../config.js';

export function buildCani() {
  const list = store.data.filter(r => r.status === 'Canibalização');
  const grid = document.getElementById('cani-grid');

  if (!list.length) {
    grid.innerHTML = `
      <div class="empty-state" style="grid-column:1/-1">
        <div class="icon">✅</div>
        <p>Nenhuma máquina em Canibalização.<br>
        <span style="font-size:12px;color:var(--muted2)">Use o Admin para alterar o status.</span></p>
      </div>`;
    return;
  }

  grid.innerHTML = list.map(r => {
    const allText = ((r.obs || '') + ' ' + (r._hist || []).map(h => h.text).join(' ')).toUpperCase();
    const partTags = PARTS.map(p => {
      const damaged = allText.includes(p.toUpperCase());
      return `<span class="part-tag ${damaged ? 'part-bad' : 'part-ok'}">${damaged ? '✕' : '✓'} ${p}</span>`;
    }).join('');

    return `
      <div class="cani-card active" onclick="window.app.openEdit(${r._id})">
        <h4>${r.nome || r.modelo || '—'}</h4>
        <div class="cani-sn">S/N: ${r.sn || '—'} · Ativo #${r.ativo || '—'} · ${fabChip(r.fabricante)}</div>
        ${r.obs ? `<div class="cani-obs">📋 ${r.obs}</div>` : ''}
        <div style="font-size:11px;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:.6px;margin-bottom:6px">
          Peças (baseado em obs + log)
        </div>
        <div class="parts-row">${partTags}</div>
        ${r._hist?.length
          ? `<div style="font-size:11px;color:var(--muted2)">${r._hist.length} evento(s) no log</div>`
          : ''}
      </div>`;
  }).join('');
}
