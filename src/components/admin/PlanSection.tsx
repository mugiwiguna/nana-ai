import { useState, useEffect } from "react";

interface Plan {
  id: string;
  name: string;
  slug: string;
  price: string;
  credits: string;
  duration_days: number;
  description: string | null;
  features: string[];
  model_ids: string[];
  daily_token_limit: number | null;
  weekly_token_limit: number | null;
  monthly_token_limit: number | null;
  is_popular: boolean;
  is_active: boolean;
}

interface Model {
  id: string;
  name: string;
  upstream_model_name: string;
  is_active: boolean;
}

export default function PlanSection({ showToast }: { showToast: (m: string) => void }) {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [models, setModels] = useState<Model[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [edit, setEdit] = useState<Plan | null>(null);
  const [form, setForm] = useState({
    name: "", slug: "", price: "", credits: "", duration_days: "30",
    description: "", features: "", model_ids: [] as string[],
    daily_token_limit: "", weekly_token_limit: "", monthly_token_limit: "", is_popular: false,
  });

  const load = async () => {
    const [pr, mr] = await Promise.all([
      fetch("/api/admin/plans"),
      fetch("/api/admin/models"),
    ]);
    setPlans((await pr.json()).plans || []);
    setModels((await mr.json()).models || []);
  };

  useEffect(() => { load(); }, []);

  const resetForm = () => {
    setForm({ name: "", slug: "", price: "", credits: "", duration_days: "30", description: "", features: "", model_ids: [], daily_token_limit: "", weekly_token_limit: "", monthly_token_limit: "", is_popular: false });
    setEdit(null);
    setShowForm(false);
  };

  const handleSubmit = async () => {
    if (!form.name || !form.slug || !form.price) { showToast("⚠️ name, slug, price wajib"); return; }

    const payload = {
      ...form,
      price: parseFloat(form.price),
      credits: parseFloat(form.credits) || 0,
      duration_days: parseInt(form.duration_days) || 30,
      daily_token_limit: form.daily_token_limit ? parseInt(form.daily_token_limit) : null,
      weekly_token_limit: form.weekly_token_limit ? parseInt(form.weekly_token_limit) : null,
      monthly_token_limit: form.monthly_token_limit ? parseInt(form.monthly_token_limit) : null,
      features: form.features ? form.features.split("\n").map(s => s.trim()).filter(Boolean) : [],
    };

    if (edit) {
      const r = await fetch(`/api/admin/plans/${edit.id}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const d = await r.json();
      if (d.error) { showToast(`❌ ${d.error}`); return; }
      showToast("✅ Plan diupdate");
    } else {
      const r = await fetch("/api/admin/plans", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const d = await r.json();
      if (d.error) { showToast(`❌ ${d.error}`); return; }
      showToast("✅ Plan ditambah");
    }
    resetForm();
    load();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Nonaktifkan plan ini?")) return;
    await fetch(`/api/admin/plans/${id}`, { method: "DELETE" });
    showToast("✅ Plan dinonaktifkan");
    load();
  };

  const handleToggle = async (p: Plan) => {
    await fetch(`/api/admin/plans/${p.id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_active: !p.is_active }),
    });
    load();
  };

  const toggleModel = (modelId: string) => {
    setForm(f => ({
      ...f,
      model_ids: f.model_ids.includes(modelId)
        ? f.model_ids.filter(id => id !== modelId)
        : [...f.model_ids, modelId],
    }));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-[var(--text-primary)]">Paket / Plan ({plans.length})</h2>
        <button onClick={() => { resetForm(); setShowForm(!showForm); }}
          className="bg-blue-600 hover:bg-blue-500 text-[var(--accent-fg)] px-4 py-2 rounded-lg text-sm font-medium transition">
          {showForm ? "Batal" : "+ Tambah Plan"}
        </button>
      </div>

      {showForm && (
        <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl p-5 space-y-4">
          <h3 className="text-sm font-semibold text-[var(--text-primary)]">{edit ? "Edit" : "Tambah"} Plan</h3>
          <div className="grid md:grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-[var(--text-secondary)] block mb-1">Nama Plan</label>
              <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Pro"
                className="w-full bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-lg px-3 py-2 text-sm text-[var(--text-primary)]" />
            </div>
            <div>
              <label className="text-xs text-[var(--text-secondary)] block mb-1">Slug</label>
              <input value={form.slug} onChange={e => setForm({ ...form, slug: e.target.value })} placeholder="pro"
                className="w-full bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-lg px-3 py-2 text-sm text-[var(--text-primary)]" />
            </div>
            <div>
              <label className="text-xs text-[var(--text-secondary)] block mb-1">Harga (Rp)</label>
              <input type="number" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} placeholder="150000"
                className="w-full bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-lg px-3 py-2 text-sm text-[var(--text-primary)]" />
            </div>
            <div>
              <label className="text-xs text-[var(--text-secondary)] block mb-1">Credits (Rp)</label>
              <input type="number" value={form.credits} onChange={e => setForm({ ...form, credits: e.target.value })} placeholder="200000"
                className="w-full bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-lg px-3 py-2 text-sm text-[var(--text-primary)]" />
            </div>
            <div>
              <label className="text-xs text-[var(--text-secondary)] block mb-1">Durasi (hari)</label>
              <input type="number" value={form.duration_days} onChange={e => setForm({ ...form, duration_days: e.target.value })} placeholder="30"
                className="w-full bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-lg px-3 py-2 text-sm text-[var(--text-primary)]" />
            </div>
            <div>
              <label className="text-xs text-[var(--text-secondary)] block mb-1">Daily Token Limit</label>
              <input type="number" value={form.daily_token_limit} onChange={e => setForm({ ...form, daily_token_limit: e.target.value })} placeholder="kosongkan = unlimited"
                className="w-full bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-lg px-3 py-2 text-sm text-[var(--text-primary)]" />
            </div>
            <div>
              <label className="text-xs text-[var(--text-secondary)] block mb-1">Weekly Token Limit</label>
              <input type="number" value={form.weekly_token_limit} onChange={e => setForm({ ...form, weekly_token_limit: e.target.value })} placeholder="kosongkan = unlimited"
                className="w-full bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-lg px-3 py-2 text-sm text-[var(--text-primary)]" />
            </div>
            <div>
              <label className="text-xs text-[var(--text-secondary)] block mb-1">Monthly Token Limit</label>
              <input type="number" value={form.monthly_token_limit} onChange={e => setForm({ ...form, monthly_token_limit: e.target.value })} placeholder="kosongkan = unlimited"
                className="w-full bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-lg px-3 py-2 text-sm text-[var(--text-primary)]" />
            </div>
            <div className="md:col-span-2">
              <label className="text-xs text-[var(--text-secondary)] block mb-1">Deskripsi</label>
              <input value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Plan untuk tim kecil"
                className="w-full bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-lg px-3 py-2 text-sm text-[var(--text-primary)]" />
            </div>
            <div className="md:col-span-2">
              <label className="text-xs text-[var(--text-secondary)] block mb-1">Features (satu per baris)</label>
              <textarea value={form.features} onChange={e => setForm({ ...form, features: e.target.value })} placeholder={"Akses semua model\nPriority support\nBonus 33% credit"} rows={3}
                className="w-full bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-lg px-3 py-2 text-sm text-[var(--text-primary)]" />
            </div>
            <div className="md:col-span-2">
              <label className="text-xs text-[var(--text-secondary)] block mb-1">Model Tersedia (kosongkan = semua)</label>
              <div className="flex flex-wrap gap-2 mt-1">
                {models.filter(m => m.is_active).map(m => (
                  <button key={m.id} onClick={() => toggleModel(m.id)}
                    className={`px-2 py-1 rounded-lg text-xs font-medium transition border ${
                      form.model_ids.includes(m.id)
                        ? "bg-[var(--gradient-start)]/10 text-[var(--gradient-start)] border-[var(--gradient-start)]/30"
                        : "bg-[var(--bg-primary)] text-[var(--text-secondary)] border-[var(--border-color)] hover:border-[var(--text-secondary)]"
                    }`}>
                    {m.name}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" checked={form.is_popular} onChange={e => setForm({ ...form, is_popular: e.target.checked })} />
              <label className="text-xs text-[var(--text-secondary)]">Populer</label>
            </div>
          </div>
          <button onClick={handleSubmit}
            className="bg-emerald-600 hover:bg-emerald-500 text-[var(--accent-fg)] px-6 py-2 rounded-lg text-sm font-medium transition">
            {edit ? "Simpan" : "Tambah"}
          </button>
        </div>
      )}

      <div className="space-y-3">
        {plans.length === 0 && <p className="text-sm text-[var(--text-secondary)] text-center py-8">Belum ada plan.</p>}
        {plans.map(p => (
          <div key={p.id} className={`group bg-[var(--bg-card)] border rounded-xl p-4 transition-all ${p.is_active ? "border-[var(--border-color)]" : "border-red-900/30 opacity-60"}`}>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-semibold text-[var(--text-primary)]">{p.name}</span>
                  <code className="text-[11px] text-blue-400 font-mono bg-blue-500/10 px-1.5 py-0.5 rounded">{p.slug}</code>
                  {p.is_popular && <span className="text-[10px] font-bold bg-[var(--accent-bg)] text-[var(--accent-fg)] px-2 py-0.5 rounded-full">Populer</span>}
                  <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-semibold ${p.is_active ? "bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/20" : "bg-red-500/10 text-red-400 ring-1 ring-red-500/20"}`}>
                    {p.is_active ? "Aktif" : "Nonaktif"}
                  </span>
                </div>
                <div className="text-[11px] text-[var(--text-secondary)] mt-0.5">
                  ${Number(p.price).toLocaleString()} · {p.duration_days} hari
                  {p.description && <span> · {p.description}</span>}
                </div>
                {p.model_ids && p.model_ids.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1">
                    {p.model_ids.map(mid => {
                      const m = models.find(x => x.id === mid);
                      return m ? <span key={mid} className="text-[10px] bg-violet-500/10 text-violet-400 px-1.5 py-0.5 rounded">{m.name}</span> : null;
                    })}
                  </div>
                )}
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button onClick={() => handleToggle(p)} title={p.is_active ? "Nonaktifkan" : "Aktifkan"}
                  className="w-8 h-8 flex items-center justify-center rounded-lg text-amber-400 hover:text-amber-300 hover:bg-amber-500/10 transition">
                  {p.is_active ? "⏸" : "▶"}
                </button>
                <button onClick={() => {
                  setShowForm(true); setEdit(p);
                  setForm({
                    name: p.name, slug: p.slug, price: String(p.price), credits: String(p.credits),
                    duration_days: String(p.duration_days), description: p.description || "",
                    features: (p.features || []).join("\n"), model_ids: p.model_ids || [],
                    daily_token_limit: p.daily_token_limit ? String(p.daily_token_limit) : "",
                    weekly_token_limit: p.weekly_token_limit ? String(p.weekly_token_limit) : "",
                    monthly_token_limit: p.monthly_token_limit ? String(p.monthly_token_limit) : "",
                    is_popular: p.is_popular,
                  });
                }} title="Edit" className="w-8 h-8 flex items-center justify-center rounded-lg text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 transition">✎</button>
                <button onClick={() => handleDelete(p.id)} title="Nonaktifkan" className="w-8 h-8 flex items-center justify-center rounded-lg text-red-400 hover:text-red-300 hover:bg-red-500/10 transition">✕</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
