import { useState, useEffect } from "react";

interface Headline {
  id: string;
  title: string;
  content: string | null;
  type: string;
  link_url: string | null;
  link_text: string | null;
  is_active: boolean;
  starts_at: string | null;
  ends_at: string | null;
  created_at: string;
}

export default function HeadlineSection({ showToast }: { showToast: (m: string) => void }) {
  const [headlines, setHeadlines] = useState<Headline[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [edit, setEdit] = useState<Headline | null>(null);
  const [form, setForm] = useState({
    title: "", content: "", type: "info", link_url: "", link_text: "", is_active: true, starts_at: "", ends_at: "",
  });

  const load = async () => {
    const r = await fetch("/api/admin/headlines");
    setHeadlines((await r.json()).headlines || []);
  };

  useEffect(() => { load(); }, []);

  const resetForm = () => {
    setForm({ title: "", content: "", type: "info", link_url: "", link_text: "", is_active: true, starts_at: "", ends_at: "" });
    setEdit(null);
    setShowForm(false);
  };

  const handleSubmit = async () => {
    if (!form.title) { showToast("⚠️ title wajib"); return; }

    const payload = {
      ...form,
      starts_at: form.starts_at || null,
      ends_at: form.ends_at || null,
    };

    if (edit) {
      const r = await fetch(`/api/admin/headlines/${edit.id}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const d = await r.json();
      if (d.error) { showToast(`❌ ${d.error}`); return; }
      showToast("✅ Headline diupdate");
    } else {
      const r = await fetch("/api/admin/headlines", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const d = await r.json();
      if (d.error) { showToast(`❌ ${d.error}`); return; }
      showToast("✅ Headline dibuat");
    }
    resetForm();
    load();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Hapus headline ini?")) return;
    await fetch(`/api/admin/headlines/${id}`, { method: "DELETE" });
    showToast("✅ Headline dihapus");
    load();
  };

  const handleToggle = async (h: Headline) => {
    await fetch(`/api/admin/headlines/${h.id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_active: !h.is_active }),
    });
    load();
  };

  const typeColors: Record<string, string> = {
    info: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    warning: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    promo: "bg-violet-500/10 text-violet-400 border-violet-500/20",
    maintenance: "bg-red-500/10 text-red-400 border-red-500/20",
    success: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-[var(--text-primary)]">Headline / Banner ({headlines.length})</h2>
        <button onClick={() => { resetForm(); setShowForm(!showForm); }}
          className="bg-blue-600 hover:bg-blue-500 text-[var(--accent-fg)] px-4 py-2 rounded-lg text-sm font-medium transition">
          {showForm ? "Batal" : "+ Tambah Headline"}
        </button>
      </div>

      <p className="text-xs text-[var(--text-secondary)]">Headline muncul di dashboard user. Bisa dijadwalkan dengan waktu mulai/akhir.</p>

      {showForm && (
        <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl p-5 space-y-4">
          <h3 className="text-sm font-semibold text-[var(--text-primary)]">{edit ? "Edit" : "Tambah"} Headline</h3>
          <div className="grid md:grid-cols-2 gap-3">
            <div className="md:col-span-2">
              <label className="text-xs text-[var(--text-secondary)] block mb-1">Judul</label>
              <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="🚀 Promo Spesial Juli!"
                className="w-full bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-lg px-3 py-2 text-sm text-[var(--text-primary)]" />
            </div>
            <div className="md:col-span-2">
              <label className="text-xs text-[var(--text-secondary)] block mb-1">Konten (opsional)</label>
              <textarea value={form.content} onChange={e => setForm({ ...form, content: e.target.value })} placeholder="Diskon 50% untuk semua plan..." rows={2}
                className="w-full bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-lg px-3 py-2 text-sm text-[var(--text-primary)]" />
            </div>
            <div>
              <label className="text-xs text-[var(--text-secondary)] block mb-1">Tipe</label>
              <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}
                className="w-full bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-lg px-3 py-2 text-sm text-[var(--text-primary)]">
                <option value="info">Info</option>
                <option value="warning">Warning</option>
                <option value="promo">Promo</option>
                <option value="maintenance">Maintenance</option>
                <option value="success">Success</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-[var(--text-secondary)] block mb-1">Link URL (opsional)</label>
              <input value={form.link_url} onChange={e => setForm({ ...form, link_url: e.target.value })} placeholder="https://..."
                className="w-full bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-lg px-3 py-2 text-sm text-[var(--text-primary)]" />
            </div>
            <div>
              <label className="text-xs text-[var(--text-secondary)] block mb-1">Link Text</label>
              <input value={form.link_text} onChange={e => setForm({ ...form, link_text: e.target.value })} placeholder="Lihat Detail →"
                className="w-full bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-lg px-3 py-2 text-sm text-[var(--text-primary)]" />
            </div>
            <div>
              <label className="text-xs text-[var(--text-secondary)] block mb-1">Mulai (opsional)</label>
              <input type="datetime-local" value={form.starts_at} onChange={e => setForm({ ...form, starts_at: e.target.value })}
                className="w-full bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-lg px-3 py-2 text-sm text-[var(--text-primary)]" />
            </div>
            <div>
              <label className="text-xs text-[var(--text-secondary)] block mb-1">Berakhir (opsional)</label>
              <input type="datetime-local" value={form.ends_at} onChange={e => setForm({ ...form, ends_at: e.target.value })}
                className="w-full bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-lg px-3 py-2 text-sm text-[var(--text-primary)]" />
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" checked={form.is_active} onChange={e => setForm({ ...form, is_active: e.target.checked })} />
              <label className="text-xs text-[var(--text-secondary)]">Aktif</label>
            </div>
          </div>
          <button onClick={handleSubmit}
            className="bg-emerald-600 hover:bg-emerald-500 text-[var(--accent-fg)] px-6 py-2 rounded-lg text-sm font-medium transition">
            {edit ? "Simpan" : "Buat"}
          </button>
        </div>
      )}

      <div className="space-y-2">
        {headlines.length === 0 && <p className="text-sm text-[var(--text-secondary)] text-center py-8">Belum ada headline.</p>}
        {headlines.map(h => (
          <div key={h.id} className={`bg-[var(--bg-card)] border rounded-xl p-4 transition-all ${h.is_active ? "border-[var(--border-color)]" : "border-red-900/30 opacity-60"}`}>
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-semibold text-[var(--text-primary)]">{h.title}</span>
                  <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-semibold border ${typeColors[h.type] || typeColors.info}`}>
                    {h.type}
                  </span>
                  <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-semibold ${h.is_active ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"}`}>
                    {h.is_active ? "Aktif" : "Nonaktif"}
                  </span>
                </div>
                {h.content && <p className="text-xs text-[var(--text-secondary)] mt-1 line-clamp-2">{h.content}</p>}
                <div className="text-[10px] text-[var(--text-secondary)] mt-1 flex gap-3">
                  {h.link_url && <span>🔗 {h.link_text || h.link_url}</span>}
                  {h.starts_at && <span>⏰ Mulai: {new Date(h.starts_at).toLocaleString("id-ID")}</span>}
                  {h.ends_at && <span>⏰ Berakhir: {new Date(h.ends_at).toLocaleString("id-ID")}</span>}
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button onClick={() => handleToggle(h)} title={h.is_active ? "Nonaktifkan" : "Aktifkan"}
                  className="w-8 h-8 flex items-center justify-center rounded-lg text-amber-400 hover:text-amber-300 hover:bg-amber-500/10 transition">
                  {h.is_active ? "⏸" : "▶"}
                </button>
                <button onClick={() => {
                  setShowForm(true); setEdit(h);
                  setForm({
                    title: h.title, content: h.content || "", type: h.type,
                    link_url: h.link_url || "", link_text: h.link_text || "", is_active: h.is_active,
                    starts_at: h.starts_at ? h.starts_at.slice(0, 16) : "",
                    ends_at: h.ends_at ? h.ends_at.slice(0, 16) : "",
                  });
                }} title="Edit" className="w-8 h-8 flex items-center justify-center rounded-lg text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 transition">✎</button>
                <button onClick={() => handleDelete(h.id)} title="Hapus" className="w-8 h-8 flex items-center justify-center rounded-lg text-red-400 hover:text-red-300 hover:bg-red-500/10 transition">✕</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
