// ═══════════════════════════════════════
// ui/profile.js — Perfil de usuário
// ═══════════════════════════════════════

import { store }      from '../store.js';
import { statusBadge, avariado, initials } from '../helpers.js';

export function openProfile(name) {
  if (!name || !name.trim()) return;
  const nameUp = name.trim().toUpperCase();
  const minLen = nameUp.length >= 3;
  const matches = store.data.filter(r => {
    const curMatch = (r.nome || '').trim().toUpperCase() === nameUp;
    const oldMatch = minLen && (r.old_user || '').toUpperCase().includes(nameUp);
    const histMatch = minLen && (r._hist || []).some(h => h.text.toUpperCase().includes(nameUp));
    return curMatch || oldMatch || histMatch;
  });

  document.getElementById('profile-avatar').textContent = initials(name);
  document.getElementById('profile-name').textContent   = name;

  const current = matches.filter(r => (r.nome || '').toUpperCase() === nameUp).length;
  const historic = matches.length - current;
  document.getElementById('profile-meta').textContent =
    `${matches.length} máquina(s) · ${current} atual(is) · ${historic} no histórico`;
  document.getElementById('profile-count').textContent =
    `${matches.length} registro(s)`;

  document.getElementById('profile-table-body').innerHTML = matches.map(r => {
    const isCurrent = (r.nome || '').toUpperCase() === nameUp;
    return `
      <tr onclick="window.app.openEdit(${r._id})" style="cursor:pointer">
        <td class="mono">${r.ativo || '—'}</td>
        <td style="font-size:12px">${r.modelo || '—'}</td>
        <td class="mono">${r.sn || '—'}</td>
        <td>${statusBadge(r.status)}</td>
        <td>
          <span class="badge ${isCurrent ? 'b-teal' : 'b-nd'}">
            ${isCurrent ? 'Atual' : 'Histórico'}
          </span>
        </td>
        <td>${avariado(r.avariado)}</td>
        <td class="obs-cell">${r.obs || '—'}</td>
      </tr>`;
  }).join('');

  document.getElementById('profile-view').style.display  = 'block';
  document.getElementById('main-inv-view').style.display = 'none';
}

export function closeProfile() {
  document.getElementById('profile-view').style.display  = 'none';
  document.getElementById('main-inv-view').style.display = 'block';
}
