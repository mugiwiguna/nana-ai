import { useState, useEffect } from "react";

interface Provider {
  id: string;
  name: string;
  slug: string;
  is_active?: boolean;
}

interface Model {
  id: string;
  provider_id: string;
  provider_name: string;
  name: string;
  upstream_model_name: string;
  input_price: string;
  output_price: string;
  is_active: boolean;
  created_at: string;
}

export default function ModelSection({ showToast }: { showToast: (m: string) => void }) {
  const [models, setModels] = useState<Model[]>([]);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [edit, setEdit] = useState<Model | null>(null);
  const [form, setForm] = useState({ provider_id: "", name: "", upstream_model_name: "", input_price: "0", output_price: "0" });
  const [nameAvailable, setNameAvailable] = useState<boolean | null>(null);

  const load = async () => {
    const [mr, pr] = await Promise.all([
      fetch("/api/admin/models"),
      fetch("/api/admin/providers"),
    ]);
    setModels((await mr.json()).models || []);
    setProviders((await pr.json()).providers || []);
  };

  useEffect(() => { load(); }, []);

  // Check name availability
  useEffect(() => {
    if (!form.name || form.name === edit?.name) { setNameAvailable(null); return; }
    const t = setTimeout(async () => {
      const r = await fetch(`/api/admin/models/check-name?name=${encodeURIComponent(form.name)}`);
      const d = await r.json();
      setNameAvailable(d.available);
    }, 300);
    return () => clearTimeout(t);
  }, [form.name, edit]);

  const resetForm = () => {
    setForm({ provider_id: "", name: "", upstream_model_name: "", input_price: "0", output_price: "0" });
    setEdit(null);
    setShowForm(false);
    setNameAvailable(null);
  };

  const handleSubmit = async () => {
    if (!form.provider_id) { showToast("⚠️ Pilih provider dulu"); return; }
    if (!form.name) { showToast("⚠️ Nama model wajib"); return; }
    if (!form.upstream_model_name) { showToast("⚠️ Nama model upstream wajib"); return; }

    if (edit) {
      const r = await fetch(`/api/admin/models/${edit.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const d = await r.json();
      if (d.error) { showToast(`❌ ${d.error}`); return; }
      showToast("✅ Model diupdate");
    } else {
      const r = await fetch("/api/admin/models", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          input_price: parseFloat(form.input_price),
          output_price: parseFloat(form.output_price),
        }),
      });
      const d = await r.json();
      if (d.error) { showToast(`❌ ${d.error}`); return; }
      showToast("✅ Model ditambah");
    }
    resetForm();
    load();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Hapus model ini?")) return;
    await fetch(`/api/admin/models/${id}`, { method: "DELETE" });
    showToast("✅ Model dihapus");
    load();
  };

  const handleToggle = async (m: Model) => {
    await fetch(`/api/admin/models/${m.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_active: !m.is_active }),
    });
    load();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-[var(--text-primary)]">
          Model Kustom ({models.filter(m => m.is_active).length} aktif)
        </h2>
        <button onClick={() => { resetForm(); setShowForm(!showForm); }}
          className="bg-blue-600 hover:bg-blue-500 text-[var(--accent-fg)] px-4 py-2 rounded-lg text-sm font-medium transition">
          {showForm ? "Batal" : "+ Tambah Model"}
        </button>
      </div>

      {showForm && (
        <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl p-5 space-y-4">
          <h3 className="text-sm font-semibold text-[var(--text-primary)]">{edit ? "Edit" : "Tambah"} Model</h3>
          <div className="grid md:grid-cols-2 gap-3">
            <div className="md:col-span-2">
              <label className="text-xs text-[var(--text-secondary)] block mb-1">Provider</label>
              <select value={form.provider_id} onChange={e => setForm({ ...form, provider_id: e.target.value })}
                className="w-full bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-lg px-3 py-2 text-sm text-[var(--text-primary)]">
                <option value="">Pilih provider...</option>
                {providers.filter(p => p.is_active !== false).map(p => (
                  <option key={p.id} value={p.id}>{p.name} ({p.slug})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-[var(--text-secondary)] block mb-1">
                Nama Model (nanaAI)
                {form.name && nameAvailable !== null && (
                  <span className={`ml-2 ${nameAvailable ? "text-emerald-400" : "text-red-400"}`}>
                    {nameAvailable ? "✅ Tersedia" : "❌ Sudah dipakai"}
                  </span>
                )}
              </label>
              <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                placeholder="openchat-7b"
                className="w-full bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-lg px-3 py-2 text-sm text-[var(--text-primary)]" />
              <p className="text-[10px] text-[var(--text-secondary)] mt-1">Nama yang dipakai user di parameter `model`</p>
            </div>
            <div>
              <label className="text-xs text-[var(--text-secondary)] block mb-1">Nama Model Upstream</label>
              <input value={form.upstream_model_name} onChange={e => setForm({ ...form, upstream_model_name: e.target.value })}
                placeholder="mistralai/openchat-7b"
                className="w-full bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-lg px-3 py-2 text-sm text-[var(--text-primary)]" />
              <p className="text-[10px] text-[var(--text-secondary)] mt-1">Nama model di provider upstream</p>
            </div>
            <div>
              <label className="text-xs text-[var(--text-secondary)] block mb-1">Harga Input ($/token)</label>
              <input type="number" step="0.00000001" value={form.input_price} onChange={e => setForm({ ...form, input_price: e.target.value })}
                placeholder="0.0000005"
                className="w-full bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-lg px-3 py-2 text-sm text-[var(--text-primary)]" />
              <p className="text-[10px] text-[var(--text-secondary)] mt-1">Contoh: gpt-4o = 0.0000025</p>
            </div>
            <div>
              <label className="text-xs text-[var(--text-secondary)] block mb-1">Harga Output ($/token)</label>
              <input type="number" step="0.00000001" value={form.output_price} onChange={e => setForm({ ...form, output_price: e.target.value })}
                placeholder="0.0000015"
                className="w-full bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-lg px-3 py-2 text-sm text-[var(--text-primary)]" />
              <p className="text-[10px] text-[var(--text-secondary)] mt-1">Contoh: gpt-4o = 0.00001</p>
            </div>
          </div>
          <button onClick={handleSubmit}
            className="bg-emerald-600 hover:bg-emerald-500 text-[var(--accent-fg)] px-6 py-2 rounded-lg text-sm font-medium transition">
            {edit ? "Simpan" : "Tambah"}
          </button>
        </div>
      )}

      <div className="space-y-3">
        {models.length === 0 && (
          <p className="text-sm text-[var(--text-secondary)] text-center py-8">Belum ada model kustom.</p>
        )}
        {models.map(m => (
          <div key={m.id} className={`group bg-[var(--bg-card)] border rounded-xl p-4 transition-all hover:border-[var(--accent-primary)]/30 ${m.is_active ? "border-[var(--border-color)]" : "border-red-900/30 opacity-60"}`}>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <code className="text-sm font-semibold text-[var(--text-primary)] font-mono">{m.name}</code>
                  <span className="text-[var(--text-secondary)] text-xs">→</span>
                  <code className="text-[11px] text-blue-400 font-mono bg-blue-500/10 px-1.5 py-0.5 rounded">{m.upstream_model_name}</code>
                  <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-semibold ${m.is_active ? "bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/20" : "bg-red-500/10 text-red-400 ring-1 ring-red-500/20"}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${m.is_active ? "bg-emerald-400" : "bg-red-400"}`} />
                    {m.is_active ? "On" : "Off"}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-[11px] text-[var(--text-secondary)] mt-0.5 overflow-hidden">
                  <span className="shrink-0">{m.provider_name}</span>
                  <span className="shrink-0">·</span>
                  <span className="text-emerald-400 font-mono shrink-0">↓{Number(m.input_price).toFixed(8)}</span>
                  <span className="text-amber-400 font-mono shrink-0">↑{Number(m.output_price).toFixed(8)}</span>
                </div>
              </div>
              {/* Right: actions */}
              <div className="flex items-center gap-1 opacity-60 group-hover:opacity-100 transition-opacity shrink-0">
                <button onClick={() => handleToggle(m)} title={m.is_active ? "Nonaktifkan" : "Aktifkan"} className="w-8 h-8 flex items-center justify-center rounded-lg text-amber-400 hover:text-amber-300 hover:bg-amber-500/10 transition">
                  {m.is_active ? (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14H9V8h2v8zm4 0h-2V8h2v8z"/></svg>
                  ) : (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
                  )}
                </button>
                <button onClick={() => { setShowForm(true); setEdit(m); setForm({ provider_id: m.provider_id, name: m.name, upstream_model_name: m.upstream_model_name, input_price: Number(m.input_price).toFixed(8), output_price: Number(m.output_price).toFixed(8) }); }} title="Edit" className="w-8 h-8 flex items-center justify-center rounded-lg text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 transition">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a1 1 0 000-1.41l-2.34-2.34a1 1 0 00-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/></svg>
                </button>
                <button onClick={() => handleDelete(m.id)} title="Hapus" className="w-8 h-8 flex items-center justify-center rounded-lg text-red-400 hover:text-red-300 hover:bg-red-500/10 transition">
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
