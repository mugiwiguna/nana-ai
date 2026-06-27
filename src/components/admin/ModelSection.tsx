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
            <div className="flex items-center justify-between gap-4">
              {/* Left: info */}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <code className="text-sm font-semibold text-[var(--text-primary)] font-mono">{m.name}</code>
                  <span className="text-[var(--text-secondary)]">→</span>
                  <code className="text-[11px] text-blue-400 font-mono bg-blue-500/10 px-1.5 py-0.5 rounded">{m.upstream_model_name}</code>
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold tracking-wide ${m.is_active ? "bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/20" : "bg-red-500/10 text-red-400 ring-1 ring-red-500/20"}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${m.is_active ? "bg-emerald-400" : "bg-red-400"}`} />
                    {m.is_active ? "Aktif" : "Nonaktif"}
                  </span>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="inline-flex items-center bg-[var(--bg-primary)] px-2 py-0.5 rounded-md text-[11px] font-medium text-[var(--text-secondary)]">
                    🏢 {m.provider_name}
                  </span>
                  <span className="inline-flex items-center bg-[var(--bg-primary)] px-2 py-0.5 rounded-md text-[11px] font-mono text-emerald-400">
                    ↓ {Number(m.input_price).toFixed(8)}
                  </span>
                  <span className="inline-flex items-center bg-[var(--bg-primary)] px-2 py-0.5 rounded-md text-[11px] font-mono text-amber-400">
                    ↑ {Number(m.output_price).toFixed(8)}
                  </span>
                </div>
              </div>
              {/* Right: actions */}
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => handleToggle(m)} title={m.is_active ? "Nonaktifkan" : "Aktifkan"} className="p-1.5 rounded-lg text-amber-400 hover:text-amber-300 hover:bg-amber-500/10 transition">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5.636 5.636a9 9 0 1012.728 0M12 3v9" /></svg>
                </button>
                <button onClick={() => { setShowForm(true); setEdit(m); setForm({ provider_id: m.provider_id, name: m.name, upstream_model_name: m.upstream_model_name, input_price: String(Number(m.input_price)), output_price: String(Number(m.output_price)) }); }} title="Edit" className="p-1.5 rounded-lg text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 transition">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" /></svg>
                </button>
                <button onClick={() => handleDelete(m.id)} title="Hapus" className="p-1.5 rounded-lg text-red-400 hover:text-red-300 hover:bg-red-500/10 transition">
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
