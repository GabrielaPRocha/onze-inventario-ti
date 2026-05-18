// ═══════════════════════════════════════
// helpers.js — Funções utilitárias de UI
// ═══════════════════════════════════════

import { STATUS_CLASS } from './config.js';

export function statusBadge(s) {
  const cls = STATUS_CLASS[s] || 'b-nd';
  return `<span class="badge ${cls}">${s || '—'}</span>`;
}

const FAB_CLS = { APPLE: 'fab-apple', LENOVO: 'fab-lenovo', DELL: 'fab-dell' };
const FAB_ICO = { APPLE: '🍎', LENOVO: '⬛', DELL: '💙' };
export function fabChip(f) {
  return `<span class="fab-chip ${FAB_CLS[f] || ''}">${FAB_ICO[f] || '💻'} ${f}</span>`;
}

export function avariado(a) {
  if (a === 'Sim')    return '<span class="av-sim">⚠ Sim</span>';
  if (a === 'Talvez') return '<span class="av-talvez">? Talvez</span>';
  return '<span class="av-nao">—</span>';
}

export function formatado(f) {
  if (f === 'Sim') return '<span class="fmt-sim">✓</span>';
  if (f === 'Não') return '<span class="fmt-nao">✗</span>';
  return '<span class="fmt-nd">—</span>';
}

export function initials(name) {
  if (!name || !name.trim()) return '??';
  const parts = name.trim().split(/\s+/);
  return (parts[0][0] + (parts[1] ? parts[1][0] : '')).toUpperCase();
}

export function isSpare(name) {
  return (name || '').toUpperCase().startsWith('SPARE');
}

export function escAttr(s) {
  return (s || '').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

// ── Toast ──
let toastTimer = null;
export function showToast(msg, type = 'ok') {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.className = `toast ${type} show`;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), 3500);
}
