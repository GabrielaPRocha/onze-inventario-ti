// ═══════════════════════════════════════
// store.js — Estado global da aplicação
// ═══════════════════════════════════════

import { SEED_DATA } from './config.js';

export const store = {
  // ── Dados ──
  data:      [],
  filtered:  [],

  // ── Auth ──
  isAdmin:   false,
  isDirty:   false,

  // ── Tabela ──
  sortKey:   'ativo',
  sortDir:   1,
  page:      1,
  perPage:   25,

  // ── Modal ──
  editId:    null,
  pendingDel: false,

  // ── Helpers ──
  today() {
    return new Date().toLocaleDateString('pt-BR');
  },

  initFromSeed() {
    this.data = SEED_DATA.map((d, i) => ({ ...d, _id: i, _hist: [] }));
  },

  initFromRemote(remoteData) {
    this.data = remoteData.map((d, i) => ({
      ...d,
      _id:   i,
      _hist: d._hist || [],
      cargo: d.cargo || '',
    }));
  },

  getById(id) {
    return this.data.find(d => d._id === id);
  },

  upsert(id, fields) {
    if (id === null) {
      const rec = { ...fields, _id: this.data.length, _hist: [] };
      this.data.push(rec);
      return rec;
    }
    const idx = this.data.findIndex(d => d._id === id);
    const old = this.data[idx];
    const hist = [...old._hist];
    if (fields.status && fields.status !== old.status && store.isAdmin) {
      hist.push({ type: 'note', text: `Status: "${old.status}" → "${fields.status}"`, date: this.today() });
    }
    this.data[idx] = { ...old, ...fields, _hist: hist };
    return this.data[idx];
  },

  remove(id) {
    const idx = this.data.findIndex(d => d._id === id);
    if (idx > -1) this.data.splice(idx, 1);
  },

  addHistEntry(id, entry) {
    const r = this.getById(id);
    if (r) r._hist = [...r._hist, entry];
  },
};
