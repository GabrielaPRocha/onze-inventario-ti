// ═══════════════════════════════════════
// ui/modal.js — Modal de edição/criação
// ═══════════════════════════════════════

import { store }     from '../store.js';
import { showToast } from '../helpers.js';
import { HIST_TYPES } from '../config.js';

// ── Abrir novo registro ──
export function openNew() {
  store.editId = null;
  store.pendingDel = false;
  document.getElementById('modal-title').textContent = '+ Nova Máquina';
  document.getElementById('btn-delete').style.display = 'none';
  document.getElementById('del-confirm').style.display = 'none';
  clearForm();
  renderHistLog([]);
  applyStatusLock();
  openOverlay('edit-overlay');
}

// ── Abrir edição ──
export function openEdit(id) {
  store.editId = id;
  store.pendingDel = false;
  const r = store.getById(id);
  document.getElementById('modal-title').textContent = `Editar · ${r.nome || r.sn || 'Máquina'}`;
  document.getElementById('btn-delete').style.display = store.isAdmin ? 'inline-flex' : 'none';
  document.getElementById('del-confirm').style.display = 'none';
  document.getElementById('btn-delete').textContent = '🗑 Remover';
  fillForm(r);
  renderHistLog(r._hist || []);
  applyStatusLock();
  openOverlay('edit-overlay');
}

// ── Salvar registro ──
export function saveRecord(onSaved) {
  const fields = readForm();
  store.upsert(store.editId, fields);
  closeOverlay('edit-overlay');
  onSaved();
  showToast(store.editId === null ? 'Máquina adicionada!' : 'Salvo! Clique em 💾 para enviar ao GitHub.');
}

// ── Confirmar exclusão ──
export function confirmDelete(onDeleted) {
  if (!store.isAdmin) { showToast('Necessário modo admin', 'warn'); return; }
  if (!store.pendingDel) {
    store.pendingDel = true;
    document.getElementById('del-confirm').style.display = 'block';
    document.getElementById('btn-delete').textContent = '✓ Confirmar Remoção';
  } else {
    store.remove(store.editId);
    closeOverlay('edit-overlay');
    onDeleted();
    showToast('Máquina removida.', 'warn');
  }
}

// ── Status lock (admin only) ──
export function applyStatusLock() {
  const sel   = document.getElementById('f-status');
  const field = document.getElementById('f-status-field');
  const hint  = document.getElementById('status-hint');
  sel.disabled = !store.isAdmin;
  field.className = 'field' + (store.isAdmin ? '' : ' locked');
  hint.style.display = store.isAdmin ? 'none' : 'inline';
}

// ── Histórico log ──
export function renderHistLog(hist) {
  const container = document.getElementById('hist-log');
  if (!hist.length) {
    container.innerHTML = '<div class="hist-empty">Sem histórico ainda.</div>';
    return;
  }
  const ICO  = { user: '👤', repair: '🔧', note: '📝', cani: '♻️' };
  const DCLS = { user: '', repair: 'repair', note: 'note', cani: 'cani' };
  container.innerHTML = hist.map(h => `
    <div class="hist-entry">
      <div class="hist-dot ${DCLS[h.type] || ''}"></div>
      <div class="hist-text">${ICO[h.type] || '•'} ${h.text}</div>
      <div class="hist-date">${h.date || ''}</div>
    </div>`).join('');
  container.scrollTop = container.scrollHeight;
}

export function addHistEntry() {
  const type = document.getElementById('hist-type').value;
  const text = document.getElementById('hist-text').value.trim();
  if (!text) { showToast('Descreva o evento', 'warn'); return; }
  const entry = { type, text, date: store.today() };
  if (store.editId !== null) {
    store.addHistEntry(store.editId, entry);
    renderHistLog(store.getById(store.editId)._hist);
  }
  document.getElementById('hist-text').value = '';
  showToast('Log adicionado');
}

// ── Overlay helpers ──
export function openOverlay(id)  { document.getElementById(id).classList.add('open'); }
export function closeOverlay(id) {
  document.getElementById(id).classList.remove('open');
  store.pendingDel = false;
  document.getElementById('del-confirm').style.display = 'none';
  document.getElementById('btn-delete').textContent = '🗑 Remover';
}
export function overlayBgClose(e, id) {
  if (e.target === document.getElementById(id)) closeOverlay(id);
}

// ── Form helpers ──
function gv(id) { return (document.getElementById(id)?.value || '').trim(); }
function sv(id, val) { const el = document.getElementById(id); if (el) el.value = val || ''; }

function fillForm(r) {
  sv('f-nome', r.nome);         sv('f-ativo', r.ativo);
  sv('f-fabricante', r.fabricante); sv('f-modelo', r.modelo);
  sv('f-sn', r.sn);             sv('f-carregador', r.carregador);
  sv('f-status', r.status);     sv('f-formatado', r.formatado);
  sv('f-avariado', r.avariado); sv('f-garantia', r.garantia);
  sv('f-vendor', r.vendor);     sv('f-nf', r.nf);
  sv('f-data', r.data);         sv('f-valor', r.valor);
  sv('f-old-user', r.old_user); sv('f-cargo', r.cargo);
  sv('f-obs', r.obs);
}

function clearForm() {
  ['f-nome','f-ativo','f-modelo','f-sn','f-carregador','f-garantia',
   'f-vendor','f-nf','f-data','f-valor','f-old-user','f-cargo','f-obs']
    .forEach(id => sv(id, ''));
  sv('f-fabricante', 'APPLE');
  sv('f-status', 'Em uso');
  sv('f-formatado', '');
  sv('f-avariado', 'Não');
}

function readForm() {
  return {
    nome:       gv('f-nome'),    ativo:      gv('f-ativo'),
    fabricante: gv('f-fabricante'), modelo:  gv('f-modelo'),
    sn:         gv('f-sn'),      carregador: gv('f-carregador'),
    status:     gv('f-status'),  formatado:  gv('f-formatado'),
    avariado:   gv('f-avariado'),garantia:   gv('f-garantia'),
    vendor:     gv('f-vendor'),  nf:         gv('f-nf'),
    data:       gv('f-data'),    valor:      gv('f-valor'),
    old_user:   gv('f-old-user'),cargo:      gv('f-cargo'),
    obs:        gv('f-obs'),
  };
}
