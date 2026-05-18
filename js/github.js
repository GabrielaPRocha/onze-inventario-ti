// ═══════════════════════════════════════
// github.js — Integração com GitHub API
// ═══════════════════════════════════════

import { DATA_FILE, GH_REPO_DEFAULT } from './config.js';

const LS = { USER: 'gh_user', REPO: 'gh_repo', TOKEN: 'gh_token' };

export const gh = {
  user:      '',
  repo:      GH_REPO_DEFAULT,
  token:     '',
  connected: false,
  fileSHA:   null,

  // ── Carrega config do localStorage ──
  loadConfig() {
    this.user  = localStorage.getItem(LS.USER)  || '';
    this.repo  = localStorage.getItem(LS.REPO)  || GH_REPO_DEFAULT;
    this.token = localStorage.getItem(LS.TOKEN) || '';
    return !!(this.user && this.token);
  },

  // ── Persiste config no localStorage ──
  saveConfig(user, repo, token) {
    localStorage.setItem(LS.USER,  user);
    localStorage.setItem(LS.REPO,  repo);
    localStorage.setItem(LS.TOKEN, token);
    this.user = user; this.repo = repo; this.token = token;
  },

  // ── Request helper ──
  _request(path, opts = {}) {
    return fetch(`https://api.github.com/repos/${this.user}/${this.repo}/${path}`, {
      headers: {
        Authorization: `token ${this.token}`,
        'Content-Type': 'application/json',
        Accept: 'application/vnd.github.v3+json',
      },
      ...opts,
    });
  },

  // ── Testa conexão ──
  async testConnection(user, repo, token) {
    const r = await fetch(`https://api.github.com/repos/${user}/${repo}`, {
      headers: { Authorization: `token ${token}` },
    });
    return { ok: r.ok, status: r.status };
  },

  // ── Carrega dados.json do repositório ──
  async load() {
    const r = await this._request(`contents/${DATA_FILE}`);
    if (r.status === 404) return { exists: false };
    if (!r.ok) throw new Error(`GitHub HTTP ${r.status}`);
    const json = await r.json();
    this.fileSHA = json.sha;
    const decoded = JSON.parse(atob(json.content.replace(/\n/g, '')));
    this.connected = true;
    return { exists: true, data: decoded };
  },

  // ── Salva dados.json no repositório (commit) ──
  async save(data) {
    const jsonStr = JSON.stringify(data.map(({ _id, ...d }) => d), null, 2);
    const content = btoa(encodeURIComponent(jsonStr).replace(/%([0-9A-F]{2})/g,
      (_, p1) => String.fromCharCode('0x' + p1)));
    const now = new Date().toLocaleString('pt-BR');
    const body = {
      message: `Inventário atualizado — ${now}`,
      content,
      ...(this.fileSHA ? { sha: this.fileSHA } : {}),
    };
    const r = await this._request(`contents/${DATA_FILE}`, {
      method: 'PUT',
      body: JSON.stringify(body),
    });
    if (!r.ok) {
      const err = await r.json();
      throw new Error(err.message || `HTTP ${r.status}`);
    }
    const resp = await r.json();
    this.fileSHA = resp.content.sha;
    return resp;
  },
};
