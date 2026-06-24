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
          className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition">
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
            className="bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-2 rounded-lg text-sm font-medium transition">
            {edit ? "Simpan" : "Tambah"}
          </button>
        </div>
      )}

      <div className="grid gap-4">
        {providers.length === 0 && (
          <p className="text-sm text-[var(--text-secondary)] text-center py-8">Belum ada provider. Tambah dulu!</p>
        )}
        {providers.map(p => (
          <div key={p.id} className={`bg-[var(--bg-card)] border rounded-xl p-5 ${p.is_active ? "border-[var(--border-color)]" : "border-red-900/30 opacity-70"}`}>
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-semibold text-[var(--text-primary)]">{p.name}</h3>
                  <span className="text-xs text-[var(--text-secondary)] font-mono">/{p.slug}</span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${p.is_active ? "bg-emerald-900/30 text-emerald-400" : "bg-red-900/30 text-red-400"}`}>
                    {p.is_active ? "Aktif" : "Nonaktif"}
                  </span>
                </div>
                <p className="text-xs text-[var(--text-secondary)] mt-1 font-mono truncate max-w-md">{p.base_url}</p>
                <p className="text-xs text-[var(--text-secondary)] mt-0.5">Model: {p.models?.length || 0}</p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => handleToggle(p)} className="text-xs text-amber-400 hover:text-amber-300 px-2 py-1 border border-[var(--border-color)] rounded-lg">
                  {p.is_active ? "Nonaktifkan" : "Aktifkan"}
                </button>
                <button onClick={() => { setShowForm(true); setEdit(p); setForm({ name: p.name, slug: p.slug, base_url: p.base_url, api_key: "" }); }}
                  className="text-xs text-blue-400 hover:text-blue-300 px-2 py-1 border border-[var(--border-color)] rounded-lg">Edit</button>
                <button onClick={() => handleDelete(p.id)} className="text-xs text-red-400 hover:text-red-300 px-2 py-1 border border-[var(--border-color)] rounded-lg">Hapus</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
