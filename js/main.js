// ═══════════════════════════════════════
// main.js — Controller / Entry point
// ═══════════════════════════════════════

import { store }         from './store.js';
import { gh }            from './github.js';
import { showToast }     from './helpers.js';
import { buildDashboard } from './ui/dashboard.js';
import { applyFilters, clearFilters, sortBy, renderTable } from './ui/table.js';
import { openNew, openEdit, saveRecord, confirmDelete, applyStatusLock,
         addHistEntry, openOverlay, closeOverlay, overlayBgClose } from './ui/modal.js';
import { openProfile, closeProfile } from './ui/profile.js';
import { buildCani }     from './ui/cani.js';

// ─────────────────────────────────────────
// LOADING SCREEN
// ─────────────────────────────────────────
function setLoadingMsg(msg) { document.getElementById('loading-msg').textContent = msg; }
function hideLoading()      { document.getElementById('loading-screen').classList.add('hide'); }

// ─────────────────────────────────────────
// SAVE BUTTON STATE
// ─────────────────────────────────────────
function setSaveState(state) {
  const btn = document.getElementById('save-btn');
  const ico = document.getElementById('save-ico');
  const lbl = document.getElementById('save-lbl');
  const MAP = {
    idle:   { i: '💾', l: 'Salvar',    cls: 'idle' },
    dirty:  { i: '●',  l: 'Salvar*',   cls: 'dirty' },
    saving: { i: '⏳', l: 'Salvando',  cls: 'saving' },
    ok:     { i: '✓',  l: 'Salvo!',    cls: 'ok' },
    err:    { i: '✕',  l: 'Erro',      cls: 'err' },
  };
  const s = MAP[state] || MAP.idle;
  btn.className = `save-btn ${s.cls}`;
  ico.textContent = s.i;
  lbl.textContent = s.l;
  btn.disabled = state === 'saving';
}

function markDirty() {
  store.isDirty = true;
  setSaveState('dirty');
}

// ─────────────────────────────────────────
// GITHUB STATUS INDICATOR
// ─────────────────────────────────────────
function setGhConnected(connected) {
  gh.connected = connected;
  const el = document.getElementById('gh-status');
  if (connected) {
    el.className = 'gh-status connected';
    el.textContent = `✓ ${gh.repo}`;
    el.onclick = null;
  } else {
    el.className = 'gh-status disconnected';
    el.textContent = '⚙ GitHub';
    el.onclick = () => openOverlay('gh-overlay');
  }
}

// ─────────────────────────────────────────
// ADMIN
// ─────────────────────────────────────────
function handleAdmin() {
  if (store.isAdmin) {
    store.isAdmin = false;
    updateAdminUI();
    showToast('Admin desativado', 'warn');
  } else {
    openOverlay('pw-overlay');
  }
}

function checkPassword() {
  const input = document.getElementById('pw-input');
  const { ADMIN_PASSWORD } = window.__config__;
  if (input.value === ADMIN_PASSWORD) {
    store.isAdmin = true;
    closeOverlay('pw-overlay');
    input.value = '';
    document.getElementById('pw-error').style.display = 'none';
    updateAdminUI();
    showToast('Modo admin ativado ✓');
  } else {
    document.getElementById('pw-error').style.display = 'block';
    input.value = '';
  }
}

function updateAdminUI() {
  document.getElementById('lock-ico').textContent  = store.isAdmin ? '🔓' : '🔒';
  document.getElementById('admin-lbl').textContent = store.isAdmin ? 'Admin ON' : 'Admin';
  document.getElementById('admin-btn').className   = 'admin-btn' + (store.isAdmin ? ' on' : '');
}

// ─────────────────────────────────────────
// VIEWS
// ─────────────────────────────────────────
function switchView(viewId, btn) {
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  document.getElementById(`view-${viewId}`).classList.add('active');
  document.querySelectorAll('.ntab').forEach(t => t.classList.remove('active'));
  btn.classList.add('active');
  if (viewId === 'dashboard')    buildDashboard();
  if (viewId === 'canibalizacao') buildCani();
}

// ─────────────────────────────────────────
// GITHUB SAVE / LOAD
// ─────────────────────────────────────────
async function saveToGitHub() {
  if (!gh.connected) { openOverlay('gh-overlay'); showToast('Configure o GitHub primeiro', 'warn'); return; }
  setSaveState('saving');
  try {
    await gh.save(store.data);
    store.isDirty = false;
    setSaveState('ok');
    showToast('Salvo no GitHub ✓');
    setTimeout(() => setSaveState('idle'), 3000);
  } catch (e) {
    setSaveState('err');
    showToast('Erro ao salvar: ' + e.message, 'err');
    setTimeout(() => setSaveState('dirty'), 3000);
  }
}

async function saveGhConfig() {
  const user  = document.getElementById('gh-user').value.trim();
  const repo  = document.getElementById('gh-repo').value.trim();
  const token = document.getElementById('gh-token').value.trim();
  if (!user || !token) { showToast('Preencha usuário e token', 'warn'); return; }
  gh.saveConfig(user, repo, token);
  closeOverlay('gh-overlay');
  showToast('Config salva! Recarregando...');
  setTimeout(() => location.reload(), 1000);
}

async function testGhConnection() {
  const user  = document.getElementById('gh-user').value.trim();
  const repo  = document.getElementById('gh-repo').value.trim();
  const token = document.getElementById('gh-token').value.trim();
  const res   = document.getElementById('gh-test-result');
  res.style.display = 'block';
  res.style.color   = 'var(--muted)';
  res.textContent   = 'Testando...';
  try {
    const { ok, status } = await gh.testConnection(user, repo, token);
    if (ok)            { res.style.color = 'var(--teal2)';  res.textContent = '✓ Conexão OK! Repositório encontrado.'; }
    else if (status === 404) { res.style.color = 'var(--red)';   res.textContent = '✕ Repositório não encontrado.'; }
    else if (status === 401) { res.style.color = 'var(--red)';   res.textContent = '✕ Token inválido.'; }
    else                     { res.style.color = 'var(--red)';   res.textContent = `✕ Erro HTTP ${status}`; }
  } catch (e) {
    res.style.color = 'var(--red)';
    res.textContent = '✕ Erro de rede: ' + e.message;
  }
}

// ─────────────────────────────────────────
// REFRESH (after save/delete)
// ─────────────────────────────────────────
function refreshAll() {
  buildDashboard();
  applyFilters();
  buildCani();
  markDirty();
}

// ─────────────────────────────────────────
// INIT
// ─────────────────────────────────────────
async function init() {
  const hasConfig = gh.loadConfig();

  if (hasConfig) {
    // Pre-fill GitHub modal
    document.getElementById('gh-user').value  = gh.user;
    document.getElementById('gh-repo').value  = gh.repo;
    document.getElementById('gh-token').value = gh.token;

    setLoadingMsg('Carregando dados do GitHub...');
    try {
      const result = await gh.load();
      if (!result.exists) {
        setLoadingMsg('Primeiro acesso — enviando dados iniciais...');
        store.initFromSeed();
        await gh.save(store.data);
        showToast('Dados iniciais enviados ao GitHub ✓');
      } else {
        store.initFromRemote(result.data);
      }
      setGhConnected(true);
    } catch (e) {
      store.initFromSeed();
      setGhConnected(false);
      showToast('Não foi possível carregar do GitHub. Usando dados locais.', 'err');
    }
  } else {
    setLoadingMsg('Configure o GitHub para salvar seus dados');
    store.initFromSeed();
    setTimeout(() => showToast('Configure o GitHub clicando em "⚙ GitHub"', 'warn'), 1500);
  }

  hideLoading();
  buildDashboard();
  applyFilters();
  buildCani();
  updateAdminUI();
  setSaveState('idle');
}

// ─────────────────────────────────────────
// PUBLIC API (called from HTML)
// ─────────────────────────────────────────
window.app = {
  // Views
  switchView,
  goPage: (p) => { store.page = p; renderTable(); },

  // Table
  applyFilters,
  clearFilters,
  sortBy,

  // Modal
  openNew: () => openNew(),
  openEdit: (id) => openEdit(id),
  saveRecord: () => saveRecord(refreshAll),
  confirmDelete: () => confirmDelete(refreshAll),
  addHistEntry,
  closeOverlay,
  overlayBgClose,

  // Profile
  openProfile,
  closeProfile,

  // Admin
  handleAdmin,
  checkPassword,

  // GitHub
  saveToGitHub,
  saveGhConfig,
  testGhConnection,
};

// Expose config for password check
window.__config__ = { ADMIN_PASSWORD: 'onze2025' };

// Warn on unsaved changes
window.addEventListener('beforeunload', e => {
  if (store.isDirty) { e.preventDefault(); e.returnValue = ''; }
});

// Start
init();
