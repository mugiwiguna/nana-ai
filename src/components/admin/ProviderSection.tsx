import { useState, useEffect } from "react";

interface Provider {
  id: string;
  name: string;
  slug: string;
  base_url: string;
  api_key: string;
  is_active: boolean;
  models: any[];
  created_at: string;
}

export default function ProviderSection({ showToast }: { showToast: (m: string) => void }) {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [edit, setEdit] = useState<Provider | null>(null);
  const [form, setForm] = useState({ name: "", slug: "", base_url: "", api_key: "" });

  const load = async () => {
    const r = await fetch("/api/admin/providers");
    const d = await r.json();
    setProviders(d.providers || []);
  };

  useEffect(() => { load(); }, []);

  const resetForm = () => { setForm({ name: "", slug: "", base_url: "", api_key: "" }); setEdit(null); setShowForm(false); };

  const handleSubmit = async () => {
    if (edit) {
      const r = await fetch(`/api/admin/providers/${edit.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const d = await r.json();
      if (d.error) { showToast(`❌ ${d.error}`); return; }
      showToast("✅ Provider diupdate");
    } else {
      const r = await fetch("/api/admin/providers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const d = await r.json();
      if (d.error) { showToast(`❌ ${d.error}`); return; }
      showToast("✅ Provider ditambah");
    }
    resetForm();
    load();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Hapus provider & semua modelnya?")) return;
    await fetch(`/api/admin/providers/${id}`, { method: "DELETE" });
    showToast("✅ Provider dihapus");
    load();
  };

  const handleToggle = async (p: Provider) => {
    await fetch(`/api/admin/providers/${p.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_active: !p.is_active }),
    });
    load();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-[var(--text-primary)]">
          Provider ({providers.filter(p => p.is_active).length} aktif)
        </h2>
        <button onClick={() => { resetForm(); setShowForm(!showForm); }}
          className="bg-blue-600 hover:bg-blue-500 text-[var(--accent-fg)] px-4 py-2 rounded-lg text-sm font-medium transition">
          {showForm ? "Batal" : "+ Tambah Provider"}
        </button>
      </div>

      {showForm && (
        <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl p-5 space-y-4">
          <h3 className="text-sm font-semibold text-[var(--text-primary)]">{edit ? "Edit" : "Tambah"} Provider</h3>
          <div className="grid md:grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-[var(--text-secondary)] block mb-1">Nama</label>
              <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value, slug: edit ? form.slug : e.target.value.toLowerCase().replace(/\s+/g, "-") })}
                className="w-full bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-lg px-3 py-2 text-sm text-[var(--text-primary)]" />
            </div>
            <div>
              <label className="text-xs text-[var(--text-secondary)] block mb-1">Slug (identifier unik)</label>
              <input value={form.slug} onChange={e => setForm({ ...form, slug: e.target.value })}
                className="w-full bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-lg px-3 py-2 text-sm text-[var(--text-primary)]" disabled={!!edit} />
            </div>
            <div className="md:col-span-2">
              <label className="text-xs text-[var(--text-secondary)] block mb-1">Base URL <span className="text-[var(--text-secondary)] font-mono text-[10px]">(tanpa /v1)</span></label>
              <input value={form.base_url} onChange={e => setForm({ ...form, base_url: e.target.value })}
                placeholder="https://api.openai.com"
                className="w-full bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-lg px-3 py-2 text-sm text-[var(--text-primary)]" />
            </div>
            <div className="md:col-span-2">
              <label className="text-xs text-[var(--text-secondary)] block mb-1">API Key</label>
              <input value={form.api_key} onChange={e => setForm({ ...form, api_key: e.target.value })}
                type="password" placeholder="sk-..."
                className="w-full bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-lg px-3 py-2 text-sm text-[var(--text-primary)]" />
            </div>
          </div>
          <button onClick={handleSubmit}
            className="bg-emerald-600 hover:bg-emerald-500 text-[var(--accent-fg)] px-6 py-2 rounded-lg text-sm font-medium transition">
            {edit ? "Simpan" : "Tambah"}
          </button>
        </div>
      )}

      <div className="grid gap-4">
        {providers.length === 0 && (
          <p className="text-sm text-[var(--text-secondary)] text-center py-8">Belum ada provider. Tambah dulu!</p>
        )}
        {providers.map(p => (
          <div key={p.id} className={`group bg-[var(--bg-card)] border rounded-xl p-4 transition-all hover:border-[var(--accent-primary)]/30 ${p.is_active ? "border-[var(--border-color)]" : "border-red-900/30 opacity-60"}`}>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-sm font-semibold text-[var(--text-primary)]">{p.name}</h3>
                  <code className="text-[11px] text-[var(--text-secondary)] font-mono bg-[var(--bg-primary)] px-1.5 py-0.5 rounded">/{p.slug}</code>
                  <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-semibold ${p.is_active ? "bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/20" : "bg-red-500/10 text-red-400 ring-1 ring-red-500/20"}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${p.is_active ? "bg-emerald-400" : "bg-red-400"}`} />
                    {p.is_active ? "On" : "Off"}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-[11px] text-[var(--text-secondary)] mt-0.5 overflow-hidden">
                  <span className="font-mono truncate">{p.base_url}</span>
                  <span className="shrink-0">·</span>
                  <span className="shrink-0">{p.models?.length || 0} model</span>
                </div>
              </div>
              <div className="flex items-center gap-1 opacity-60 group-hover:opacity-100 transition-opacity shrink-0">
                <button onClick={() => handleToggle(p)} title={p.is_active ? "Nonaktifkan" : "Aktifkan"} className="w-8 h-8 flex items-center justify-center rounded-lg text-amber-400 hover:text-amber-300 hover:bg-amber-500/10 transition">
                  {p.is_active ? (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14H9V8h2v8zm4 0h-2V8h2v8z"/></svg>
                  ) : (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
                  )}
                </button>
                <button onClick={() => { setShowForm(true); setEdit(p); setForm({ name: p.name, slug: p.slug, base_url: p.base_url, api_key: "" }); }} title="Edit" className="w-8 h-8 flex items-center justify-center rounded-lg text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 transition">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a1 1 0 000-1.41l-2.34-2.34a1 1 0 00-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/></svg>
                </button>
                <button onClick={() => handleDelete(p.id)} title="Hapus" className="w-8 h-8 flex items-center justify-center rounded-lg text-red-400 hover:text-red-300 hover:bg-red-500/10 transition">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
