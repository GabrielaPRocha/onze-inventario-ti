// ═══════════════════════════════════════
// ui/table.js — Tabela de inventário
// ═══════════════════════════════════════

import { store }    from '../store.js';
import { statusBadge, fabChip, avariado, formatado, isSpare, escAttr } from '../helpers.js';

export function applyFilters() {
  const q   = (document.getElementById('search-input').value || '').toLowerCase();
  const st  = document.getElementById('filter-status').value;
  const fab = document.getElementById('filter-fab').value;
  const av  = document.getElementById('filter-av').value;
  const fmt = document.getElementById('filter-fmt').value;

  store.filtered = store.data.filter(r => {
    const hay = [r.nome, r.sn, r.modelo, r.ativo, r.obs, r.old_user, r.fabricante, r.cargo]
      .join(' ').toLowerCase();
    return (
      (!q   || hay.includes(q))   &&
      (!st  || r.status     === st)  &&
      (!fab || r.fabricante === fab) &&
      (!av  || r.avariado   === av)  &&
      (!fmt || r.formatado  === fmt)
    );
  });

  sortData();
  store.page = 1;
  renderTable();
}

export function clearFilters() {
  ['search-input','filter-status','filter-fab','filter-av','filter-fmt']
    .forEach(id => { document.getElementById(id).value = ''; });
  applyFilters();
}

export function sortBy(key) {
  if (store.sortKey === key) store.sortDir *= -1;
  else { store.sortKey = key; store.sortDir = 1; }
  sortData();
  renderTable();
}

function sortData() {
  store.filtered.sort((a, b) => {
    let va = a[store.sortKey] || '', vb = b[store.sortKey] || '';
    if (store.sortKey === 'ativo') {
      va = parseFloat(va) || 0; vb = parseFloat(vb) || 0;
      return (va - vb) * store.sortDir;
    }
    return va.toString().localeCompare(vb.toString()) * store.sortDir;
  });
}

export function renderTable() {
  const { filtered, page, perPage } = store;
  const rows = filtered.slice((page - 1) * perPage, page * perPage);

  document.getElementById('result-count').textContent =
    `${filtered.length} resultado${filtered.length !== 1 ? 's' : ''}`;

  document.getElementById('table-body').innerHTML = rows.map(r => `
    <tr onclick="window.app.openEdit(${r._id})">
      <td class="mono">${r.ativo || '—'}</td>
      <td>
      ${isSpare(r.nome)
           ? `<span class="spare-label">${r.nome}</span>`
           : !r.nome || !r.nome.trim()
             ? `<em style="color:var(--muted2);font-size:12px">Sem nome</em>`
             : `<span class="user-link" onclick="event.stopPropagation();window.app.openProfile('${escAttr(r.nome)}')">${r.nome}</span>`
         }
      </td>
      <td><small style="color:var(--muted);font-size:11px">${r.cargo || '—'}</small></td>
      <td>${fabChip(r.fabricante)}</td>
      <td style="font-size:12px;max-width:150px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${r.modelo || '—'}</td>
      <td class="mono">${r.sn || '—'}</td>
      <td>${statusBadge(r.status)}</td>
      <td style="text-align:center">${formatado(r.formatado)}</td>
      <td>${avariado(r.avariado)}</td>
      <td class="obs-cell" title="${escAttr(r.obs)}">${r.obs || '—'}</td>
      <td>
        <button class="btn btn-ghost btn-sm" onclick="event.stopPropagation();window.app.openEdit(${r._id})">✏</button>
      </td>
    </tr>`).join('');

  renderPagination();
}

function renderPagination() {
  const total = Math.ceil(store.filtered.length / store.perPage);
  let html = '';
  for (let i = 1; i <= Math.min(total, 10); i++) {
    html += `<button class="pg-btn${i === store.page ? ' active' : ''}" onclick="window.app.goPage(${i})">${i}</button>`;
  }
  if (total > 10) html += `<span style="color:var(--muted);padding:0 5px">…${total}</span>`;
  document.getElementById('pagination').innerHTML =
    html + `<span class="pg-info">Pág ${store.page}/${total} · ${store.filtered.length} reg.</span>`;
}
