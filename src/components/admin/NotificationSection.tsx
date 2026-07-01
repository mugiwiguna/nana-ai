import { useState, useEffect } from "react";

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  target: string;
  target_user_id: string | null;
  is_read: boolean;
  created_at: string;
}

export default function NotificationSection({ showToast }: { showToast: (m: string) => void }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [blastMode, setBlastMode] = useState(false);
  const [form, setForm] = useState({ title: "", message: "", type: "info" });
  const [confirmBlast, setConfirmBlast] = useState(false);

  const load = async () => {
    const r = await fetch("/api/admin/notifications");
    setNotifications((await r.json()).notifications || []);
  };

  useEffect(() => { load(); }, []);

  const handleSend = async () => {
    if (!form.title || !form.message) { showToast("⚠️ title & message wajib"); return; }

    if (blastMode) {
      if (!confirmBlast) { setConfirmBlast(true); return; }
      const r = await fetch("/api/admin/notifications/blast", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const d = await r.json();
      if (d.error) { showToast(`❌ ${d.error}`); return; }
      showToast(`✅ Blast terkirim ke ${d.count} user`);
    } else {
      const r = await fetch("/api/admin/notifications", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, target: "all" }),
      });
      const d = await r.json();
      if (d.error) { showToast(`❌ ${d.error}`); return; }
      showToast("✅ Notifikasi dibuat");
    }
    setForm({ title: "", message: "", type: "info" });
    setShowForm(false); setBlastMode(false); setConfirmBlast(false);
    load();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Hapus notifikasi ini?")) return;
    await fetch("/api/admin/notifications", {
      method: "DELETE", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    showToast("✅ Notifikasi dihapus");
    load();
  };

  const typeColors: Record<string, string> = {
    info: "bg-blue-500/10 text-blue-400",
    warning: "bg-amber-500/10 text-amber-400",
    success: "bg-emerald-500/10 text-emerald-400",
    error: "bg-red-500/10 text-red-400",
    promo: "bg-violet-500/10 text-violet-400",
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-[var(--text-primary)]">Notifikasi ({notifications.length})</h2>
        <div className="flex gap-2">
          <button onClick={() => { setShowForm(!showForm); setBlastMode(false); }}
            className="bg-blue-600 hover:bg-blue-500 text-[var(--accent-fg)] px-4 py-2 rounded-lg text-sm font-medium transition">
            {showForm && !blastMode ? "Batal" : "+ Buat Notifikasi"}
          </button>
          <button onClick={() => { setShowForm(!showForm); setBlastMode(true); }}
            className="bg-violet-600 hover:bg-violet-500 text-[var(--accent-fg)] px-4 py-2 rounded-lg text-sm font-medium transition">
            {showForm && blastMode ? "Batal" : "📢 Blast Message"}
          </button>
        </div>
      </div>

      {showForm && (
        <div className={`bg-[var(--bg-card)] border rounded-xl p-5 space-y-4 ${blastMode ? "border-violet-500/30" : "border-[var(--border-color)]"}`}>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-[var(--text-primary)]">{blastMode ? "📢 Blast Message" : "Buat Notifikasi"}</h3>
            {blastMode && <span className="text-[10px] bg-violet-500/10 text-violet-400 px-2 py-0.5 rounded-full">Kirim ke semua user</span>}
          </div>
          <div className="grid gap-3">
            <div>
              <label className="text-xs text-[var(--text-secondary)] block mb-1">Judul</label>
              <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="Promo Spesial!"
                className="w-full bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-lg px-3 py-2 text-sm text-[var(--text-primary)]" />
            </div>
            <div>
              <label className="text-xs text-[var(--text-secondary)] block mb-1">Pesan</label>
              <textarea value={form.message} onChange={e => setForm({ ...form, message: e.target.value })} placeholder="Dapatkan diskon 50% untuk plan Pro..." rows={3}
                className="w-full bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-lg px-3 py-2 text-sm text-[var(--text-primary)]" />
            </div>
            <div>
              <label className="text-xs text-[var(--text-secondary)] block mb-1">Tipe</label>
              <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}
                className="w-full bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-lg px-3 py-2 text-sm text-[var(--text-primary)]">
                <option value="info">Info</option>
                <option value="warning">Warning</option>
                <option value="success">Success</option>
                <option value="error">Error</option>
                <option value="promo">Promo</option>
              </select>
            </div>
          </div>
          <button onClick={handleSend}
            className={`${blastMode ? "bg-violet-600 hover:bg-violet-500" : "bg-emerald-600 hover:bg-emerald-500"} text-[var(--accent-fg)] px-6 py-2 rounded-lg text-sm font-medium transition`}>
            {confirmBlast ? "⚠️ Konfirmasi Kirim Blast" : blastMode ? "Kirim Blast" : "Kirim"}
          </button>
          {confirmBlast && <p className="text-xs text-amber-400">Klik sekali lagi untuk konfirmasi blast ke semua user</p>}
        </div>
      )}

      <div className="space-y-2">
        {notifications.length === 0 && <p className="text-sm text-[var(--text-secondary)] text-center py-8">Belum ada notifikasi.</p>}
        {notifications.map(n => (
          <div key={n.id} className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl p-4 flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-semibold text-[var(--text-primary)]">{n.title}</span>
                <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-semibold ${typeColors[n.type] || typeColors.info}`}>
                  {n.type}
                </span>
                {n.target === "all" && <span className="text-[10px] bg-zinc-500/10 text-zinc-400 px-1.5 py-0.5 rounded">semua</span>}
                {n.target_user_id && <span className="text-[10px] bg-blue-500/10 text-blue-400 px-1.5 py-0.5 rounded">user spesifik</span>}
              </div>
              <p className="text-xs text-[var(--text-secondary)] mt-1 line-clamp-2">{n.message}</p>
              <p className="text-[10px] text-[var(--text-secondary)] mt-1">{new Date(n.created_at).toLocaleString("id-ID")}</p>
            </div>
            <button onClick={() => handleDelete(n.id)} title="Hapus"
              className="w-8 h-8 flex items-center justify-center rounded-lg text-red-400 hover:text-red-300 hover:bg-red-500/10 transition shrink-0">✕</button>
          </div>
        ))}
      </div>
    </div>
  );
}
