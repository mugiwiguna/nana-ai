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
            <div className="flex items-center justify-between gap-4">
              {/* Left: info */}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-sm font-semibold text-[var(--text-primary)] truncate">{p.name}</h3>
                  <code className="text-[11px] text-[var(--text-secondary)] font-mono bg-[var(--bg-primary)] px-1.5 py-0.5 rounded">/{p.slug}</code>
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold tracking-wide ${p.is_active ? "bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/20" : "bg-red-500/10 text-red-400 ring-1 ring-red-500/20"}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${p.is_active ? "bg-emerald-400" : "bg-red-400"}`} />
                    {p.is_active ? "Aktif" : "Nonaktif"}
                  </span>
                </div>
                <p className="text-xs text-[var(--text-secondary)] font-mono truncate max-w-sm">{p.base_url}</p>
                <p className="text-xs text-[var(--text-secondary)] mt-1">
                  <span className="inline-flex items-center bg-[var(--bg-primary)] px-2 py-0.5 rounded-md text-[11px] font-medium">
                    🧩 {p.models?.length || 0} model
                  </span>
                </p>
              </div>
              {/* Right: actions */}
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => handleToggle(p)} title={p.is_active ? "Nonaktifkan" : "Aktifkan"} className="p-1.5 rounded-lg text-amber-400 hover:text-amber-300 hover:bg-amber-500/10 transition">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5.636 5.636a9 9 0 1012.728 0M12 3v9" /></svg>
                </button>
                <button onClick={() => { setShowForm(true); setEdit(p); setForm({ name: p.name, slug: p.slug, base_url: p.base_url, api_key: "" }); }} title="Edit" className="p-1.5 rounded-lg text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 transition">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" /></svg>
                </button>
                <button onClick={() => handleDelete(p.id)} title="Hapus" className="p-1.5 rounded-lg text-red-400 hover:text-red-300 hover:bg-red-500/10 transition">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" /></svg>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
