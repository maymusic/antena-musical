"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { TopBar, Footer } from "@/components/Chrome";
import { useSession } from "@/components/SessionProvider";
import ChangePassword from "@/components/ChangePassword";
import { IconAntenna, IconCheck, IconTrash, IconVerified } from "@/components/icons";

type ArtistRow = {
  id: number;
  slug: string;
  name: string;
  city: string;
  genres: string[];
  coverUrl: string;
  moderationStatus: "active" | "suspended" | "pending";
  moderationNote: string;
  verificationStatus: "none" | "requested" | "uploaded" | "approved" | "rejected";
  verificationNote: string;
  verifiedAt: string | null;
  docCount: number;
  createdAt: string;
  ownerEmail: string | null;
  ownerRole: string | null;
  trackCount: number;
  imageCount: number;
  messageCount: number;
  plays: number;
};
type Message = { id: number; nick: string; body: string; createdAt: string; artistId: number; artistName: string; artistSlug: string };
type Dashboard = { artists: ArtistRow[]; users: { id: number; email: string; role: string; artistId: number | null; createdAt: string }[]; messageCount: number };

const stateStyle: Record<string, string> = {
  active: "border-onair/50 text-onair bg-onair/10",
  suspended: "border-signal/60 text-signal bg-signal/10",
  pending: "border-amber/60 text-amber bg-amber/10",
};

export default function AdminPage() {
  const { session } = useSession();
  const router = useRouter();
  const [data, setData] = useState<Dashboard | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [tab, setTab] = useState<"profiles" | "verify" | "messages" | "users">("profiles");
  const [vDocs, setVDocs] = useState<Record<number, { url: string; label: string }[]>>({});
  const [vDocsOpen, setVDocsOpen] = useState<number | null>(null);
  const [vEdit, setVEdit] = useState<{ id: number; action: "note" | "reject" } | null>(null);
  const [vNote, setVNote] = useState("");
  const [query, setQuery] = useState("");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [create, setCreate] = useState({ name: "", slug: "", city: "", tagline: "", email: "", password: "" });
  const [creating, setCreating] = useState(false);
  const [noteId, setNoteId] = useState<number | null>(null);
  const [note, setNote] = useState("");

  const load = async () => {
    const res = await fetch("/api/admin", { cache: "no-store" });
    if (res.ok) setData(await res.json());
  };
  const loadMessages = async () => {
    const res = await fetch("/api/admin/messages", { cache: "no-store" });
    if (res.ok) setMessages((await res.json()).messages ?? []);
  };

  useEffect(() => {
    if (!session.loading && session.role !== "admin") router.replace("/");
    if (session.role === "admin") load();
  }, [session, router]);
  useEffect(() => {
    if (tab === "messages" && session.role === "admin") loadMessages();
  }, [tab, session.role]);
  useEffect(() => {
    if (!notice) return;
    const id = setTimeout(() => setNotice(""), 3000);
    return () => clearTimeout(id);
  }, [notice]);

  const artists = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return data?.artists ?? [];
    return (data?.artists ?? []).filter((a) => `${a.name} ${a.slug} ${a.city} ${a.ownerEmail ?? ""} ${a.genres.join(" ")}`.toLowerCase().includes(q));
  }, [data, query]);

  const setStatus = async (a: ArtistRow, status: ArtistRow["moderationStatus"], moderationNote = a.moderationNote) => {
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/artists/${a.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status, note: moderationNote }) });
      const out = await res.json();
      if (!res.ok) throw new Error(out.error);
      setData((d) => d ? { ...d, artists: d.artists.map((x) => x.id === a.id ? { ...x, moderationStatus: status, moderationNote } : x) } : d);
      setNotice(status === "suspended" ? "Estación suspendida" : status === "active" ? "Estación reactivada" : "Estación marcada como pendiente");
      setNoteId(null);
    } catch (e) { setNotice((e as Error).message || "Error de moderación"); } finally { setBusy(false); }
  };

  const deleteArtist = async (a: ArtistRow) => {
    if (!window.confirm(`Eliminar para siempre ${a.name}, sus pistas, fotos, mensajes y fechas?`)) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/artists/${a.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error((await res.json()).error);
      setData((d) => d ? { ...d, artists: d.artists.filter((x) => x.id !== a.id) } : d);
      setNotice("Perfil eliminado definitivamente");
    } catch (e) { setNotice((e as Error).message || "Error al borrar"); } finally { setBusy(false); }
  };

  const createArtist = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      const res = await fetch("/api/admin", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(create) });
      const out = await res.json();
      if (!res.ok) throw new Error(out.error);
      setCreate({ name: "", slug: "", city: "", tagline: "", email: "", password: "" });
      setNotice("Perfil y cuenta de artista creados ✔");
      load();
    } catch (e) { setNotice((e as Error).message || "No se pudo crear"); } finally { setCreating(false); }
  };

  const viewDocs = async (id: number) => {
    if (vDocsOpen === id) {
      setVDocsOpen(null);
      return;
    }
    setVDocsOpen(id);
    const res = await fetch(`/api/admin/artists/${id}/verification`, { cache: "no-store" });
    if (res.ok) {
      const data = await res.json();
      setVDocs((d) => ({ ...d, [id]: data.docs ?? [] }));
    }
  };

  const adminVerify = async (a: ArtistRow, action: "approve" | "reject" | "note", note = "") => {
    setBusy(true);
    try {
      const body = action === "approve" ? { status: "approved" } : action === "reject" ? { status: "rejected", note } : { note };
      const res = await fetch(`/api/admin/artists/${a.id}/verification`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const out = await res.json();
      if (!res.ok) throw new Error(out.error);
      setNotice(action === "approve" ? `Paloma azul otorgada a ${a.name} ✔` : action === "reject" ? "Verificación rechazada" : "Petición de documentos enviada");
      setVEdit(null);
      setVNote("");
      load();
    } catch (e) {
      setNotice((e as Error).message || "Error de verificación");
    } finally {
      setBusy(false);
    }
  };

  const deleteMessage = async (id: number) => {
    await fetch(`/api/admin/messages/${id}`, { method: "DELETE" });
    setMessages((m) => m.filter((x) => x.id !== id));
    setNotice("Mensaje retirado del chat");
  };

  if (session.loading || session.role !== "admin") return <div className="min-h-screen bg-coal" />;

  const stats = [
    ["Estaciones", data?.artists.length ?? 0],
    ["Activas", data?.artists.filter((a) => a.moderationStatus === "active").length ?? 0],
    ["Suspendidas", data?.artists.filter((a) => a.moderationStatus === "suspended").length ?? 0],
    ["Verificadas", data?.artists.filter((a) => a.verificationStatus === "approved").length ?? 0],
    ["En revisión", data?.artists.filter((a) => ["requested", "uploaded"].includes(a.verificationStatus)).length ?? 0],
    ["Cuentas", data?.users.length ?? 0],
  ];

  return (
    <div className="min-h-screen">
      <TopBar solid />
      <main className="mx-auto max-w-7xl px-4 pt-10 pb-8">
        <div className="flex flex-wrap items-end justify-between gap-4 mb-8">
          <div>
            <p className="font-tech text-[11px] tracking-[0.3em] uppercase text-signal mb-2">Superadministración</p>
            <h1 className="font-display font-extrabold text-4xl md:text-5xl tracking-tight">Torre de control<span className="text-signal">.</span></h1>
          </div>
          <p className="font-tech text-[10px] tracking-widest uppercase text-bone-dim">Sesión admin · {session.email}</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-6 gap-3 mb-8">
          {stats.map(([label, value]) => <div key={String(label)} className="border border-inkline bg-panel p-4"><p className="font-display font-extrabold text-2xl st-text">{value}</p><p className="font-tech text-[9px] tracking-[0.2em] uppercase text-bone-dim mt-1">{label}</p></div>)}
        </div>

        <form onSubmit={createArtist} className="border border-inkline bg-panel p-5 mb-8 noise relative overflow-hidden">
          <p className="font-tech text-[10px] tracking-[0.3em] uppercase text-amber mb-4">Alta manual de artista + cuenta</p>
          <div className="grid md:grid-cols-3 gap-3">
            <input className="bg-coal border border-inkline px-3 py-2.5 text-sm text-bone focus:outline-none focus:border-signal" required value={create.name} onChange={(e) => setCreate({ ...create, name: e.target.value })} placeholder="Nombre artístico" />
            <input className="bg-coal border border-inkline px-3 py-2.5 text-sm text-bone focus:outline-none focus:border-signal" required value={create.slug} onChange={(e) => setCreate({ ...create, slug: e.target.value })} placeholder="URL (ej. mi-banda)" />
            <input className="bg-coal border border-inkline px-3 py-2.5 text-sm text-bone focus:outline-none focus:border-signal" value={create.city} onChange={(e) => setCreate({ ...create, city: e.target.value })} placeholder="Ciudad" />
            <input className="md:col-span-2 bg-coal border border-inkline px-3 py-2.5 text-sm text-bone focus:outline-none focus:border-signal" value={create.tagline} onChange={(e) => setCreate({ ...create, tagline: e.target.value })} placeholder="Lema (opcional)" />
            <input className="bg-coal border border-inkline px-3 py-2.5 text-sm text-bone focus:outline-none focus:border-signal" required type="email" value={create.email} onChange={(e) => setCreate({ ...create, email: e.target.value })} placeholder="Email del artista" />
            <input className="md:col-span-2 bg-coal border border-inkline px-3 py-2.5 text-sm text-bone focus:outline-none focus:border-signal" required minLength={8} type="password" value={create.password} onChange={(e) => setCreate({ ...create, password: e.target.value })} placeholder="Contraseña temporal (mín. 8)" />
            <button disabled={creating} className="bg-signal text-coal font-display font-bold px-5 py-2.5 hover:brightness-110 disabled:opacity-40">{creating ? "Creando…" : "Crear perfil"}</button>
          </div>
        </form>

        <div className="flex flex-wrap gap-2 mb-5">
          {(["profiles", "verify", "messages", "users"] as const).map((id) => <button key={id} onClick={() => setTab(id)} className={`px-4 py-2.5 border font-tech text-[10px] tracking-[0.2em] uppercase ${tab === id ? "border-signal text-signal bg-signal/10" : "border-inkline text-bone-dim hover:text-bone"}`}>{id === "profiles" ? "Perfiles" : id === "verify" ? "Palomas azules" : id === "messages" ? "Chat / moderación" : "Cuentas"}</button>)}
          {tab === "profiles" && <input className="ml-auto min-w-56 bg-coal border border-inkline px-3 py-2 text-sm text-bone focus:outline-none focus:border-signal" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar perfil, email, ciudad…" />}
        </div>

        {tab === "profiles" && <div className="border border-inkline overflow-x-auto"><table className="w-full text-left min-w-[900px]"><thead className="bg-coal-2 font-tech text-[9px] tracking-[0.2em] uppercase text-bone-dim"><tr><th className="p-3">Estación</th><th className="p-3">Cuenta</th><th className="p-3">Contenido</th><th className="p-3">Estado</th><th className="p-3">Moderación</th></tr></thead><tbody className="divide-y divide-inkline">{artists.map((a) => <tr key={a.id} className="bg-panel align-top"><td className="p-3"><Link href={`/${a.slug}`} className="font-display font-bold hover:text-signal">{a.name}</Link><p className="font-tech text-[9px] text-bone-dim">/{a.slug} · {a.city || "sin ciudad"}</p><p className="text-xs text-bone-dim mt-1">{a.genres.join(" · ") || "sin géneros"}</p></td><td className="p-3 text-sm">{a.ownerEmail ?? <span className="text-signal">sin propietario</span>}<p className="font-tech text-[9px] text-bone-dim mt-1">{a.ownerRole ?? "—"}</p></td><td className="p-3 font-tech text-[10px] text-bone-dim leading-relaxed">{a.trackCount} pistas<br />{a.imageCount} fotos<br />{a.messageCount} chat<br />{a.plays.toLocaleString("es")} rep.</td><td className="p-3"><span className={`inline-flex px-2 py-1 border font-tech text-[9px] tracking-widest uppercase ${stateStyle[a.moderationStatus]}`}>{a.moderationStatus}</span>{a.moderationNote && <p className="mt-2 max-w-48 text-xs text-bone-dim">{a.moderationNote}</p>}</td><td className="p-3"><div className="flex flex-wrap gap-2"><button disabled={busy || a.moderationStatus === "active"} onClick={() => setStatus(a, "active")} className="px-2.5 py-1.5 border border-onair/40 text-onair font-tech text-[9px] uppercase disabled:opacity-30">Activar</button><button disabled={busy || a.moderationStatus === "suspended"} onClick={() => { setNoteId(a.id); setNote(a.moderationNote); }} className="px-2.5 py-1.5 border border-signal/40 text-signal font-tech text-[9px] uppercase disabled:opacity-30">Suspender</button><button onClick={() => deleteArtist(a)} className="p-1.5 border border-inkline text-bone-dim hover:bg-signal hover:text-coal"><IconTrash className="w-3.5 h-3.5" /></button></div>{noteId === a.id && <div className="mt-3 space-y-2"><textarea className="w-full min-h-16 bg-coal border border-inkline p-2 text-xs text-bone focus:outline-none focus:border-signal" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Razón interna / aviso al artista" /><div className="flex gap-2"><button onClick={() => setStatus(a, "suspended", note)} className="px-3 py-1.5 bg-signal text-coal font-display font-bold text-xs">Confirmar suspensión</button><button onClick={() => setNoteId(null)} className="text-xs text-bone-dim">Cancelar</button></div></div>}</td></tr>)}</tbody></table></div>}

        {tab === "verify" && (
          <div className="border border-inkline divide-y divide-inkline">
            {artists.filter((a) => a.verificationStatus !== "none").length === 0 && (
              <p className="p-8 text-center text-bone-dim">Sin solicitudes de verificación por ahora.</p>
            )}
            {artists
              .filter((a) => a.verificationStatus !== "none")
              .sort((a, b) => {
                const weight = (s: ArtistRow["verificationStatus"]) => (s === "uploaded" ? 0 : s === "requested" ? 1 : 2);
                return weight(a.verificationStatus) - weight(b.verificationStatus);
              })
              .map((a) => {
                const vLabel: Record<string, { text: string; cls: string }> = {
                  requested: { text: "Solicitada", cls: "border-amber/50 text-amber bg-amber/10" },
                  uploaded: { text: "Docs enviados", cls: "border-[#4DA6FF]/50 text-[#4DA6FF] bg-[#4DA6FF]/10" },
                  approved: { text: "Verificada ✔", cls: "border-[#4DA6FF]/60 text-[#4DA6FF] bg-[#4DA6FF]/15" },
                  rejected: { text: "Rechazada", cls: "border-signal/50 text-signal bg-signal/10" },
                };
                const v = vLabel[a.verificationStatus];
                return (
                  <div key={a.id} className="p-4 bg-panel">
                    <div className="flex flex-wrap items-center gap-3">
                      <Link href={`/${a.slug}`} className="font-display font-extrabold hover:text-signal flex items-center gap-1.5">
                        {a.name}
                        {a.verificationStatus === "approved" && <IconVerified className="w-4 h-4" />}
                      </Link>
                      <span className={`px-2 py-1 border font-tech text-[9px] tracking-widest uppercase ${v.cls}`}>{v.text}</span>
                      <span className="font-tech text-[9px] text-bone-dim">{a.docCount} docs · /{a.slug}</span>
                      <div className="ml-auto flex flex-wrap items-center gap-2">
                        <button onClick={() => viewDocs(a.id)} className="px-2.5 py-1.5 border border-inkline font-tech text-[9px] uppercase text-bone-dim hover:text-bone">Ver documentos</button>
                        <button onClick={() => { setVEdit({ id: a.id, action: "note" }); setVNote(a.verificationNote); }} className="px-2.5 py-1.5 border border-amber/40 text-amber font-tech text-[9px] uppercase">Pedir más</button>
                        <button disabled={busy || a.verificationStatus === "approved"} onClick={() => adminVerify(a, "approve")} className="px-2.5 py-1.5 border border-[#4DA6FF]/50 text-[#4DA6FF] font-tech text-[9px] uppercase disabled:opacity-30">Aprobar ✔</button>
                        <button disabled={busy || a.verificationStatus === "approved"} onClick={() => { setVEdit({ id: a.id, action: "reject" }); setVNote(""); }} className="px-2.5 py-1.5 border border-signal/50 text-signal font-tech text-[9px] uppercase disabled:opacity-30">Rechazar</button>
                      </div>
                    </div>
                    {a.verificationNote && (
                      <p className="mt-2 text-xs text-bone-dim max-w-3xl"><span className="text-amber">Nota actual:</span> {a.verificationNote}</p>
                    )}
                    {vDocsOpen === a.id && (
                      <div className="mt-3 border border-inkline bg-coal-2 p-3 space-y-2">
                        {(vDocs[a.id] ?? []).length === 0 ? (
                          <p className="font-tech text-[10px] text-bone-dim">Sin documentos enlazados todavía.</p>
                        ) : (
                          (vDocs[a.id] ?? []).map((d, i) => (
                            <a key={i} href={d.url} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-sm text-bone hover:text-signal transition-colors">
                              <span className="text-[#4DA6FF]">📄</span>
                              <span className="flex-1 truncate">{d.label || `Documento ${i + 1}`}</span>
                              <span className="font-tech text-[9px] text-bone-dim">ABRIR ↗</span>
                            </a>
                          ))
                        )}
                      </div>
                    )}
                    {vEdit?.id === a.id && (
                      <div className="mt-3 space-y-2">
                        <textarea className="w-full min-h-16 bg-coal border border-inkline p-2 text-xs text-bone focus:outline-none focus:border-signal" value={vNote} onChange={(e) => setVNote(e.target.value)} placeholder={vEdit.action === "reject" ? "Razón del rechazo (visible para el artista)" : "Qué documentos necesitas (visible para el artista)"} />
                        <div className="flex gap-2">
                          <button onClick={() => adminVerify(a, vEdit.action, vNote)} className="px-3 py-1.5 bg-signal text-coal font-display font-bold text-xs">{vEdit.action === "reject" ? "Confirmar rechazo" : "Enviar petición"}</button>
                          <button onClick={() => { setVEdit(null); setVNote(""); }} className="text-xs text-bone-dim">Cancelar</button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
          </div>
        )}

        {tab === "messages" && <div className="border border-inkline divide-y divide-inkline">{messages.length === 0 ? <p className="p-8 text-center text-bone-dim">No hay mensajes de chat.</p> : messages.map((m) => <div key={m.id} className="flex gap-4 p-4 bg-panel"><span className="w-9 h-9 shrink-0 rounded-full bg-coal-2 border border-inkline flex items-center justify-center font-display font-bold text-signal">{m.nick[0]}</span><div className="flex-1"><p className="font-tech text-[10px] text-bone-dim"><Link href={`/${m.artistSlug}`} className="text-signal hover:underline">{m.artistName}</Link> · {m.nick} · {new Date(m.createdAt).toLocaleString("es-ES")}</p><p className="mt-1 text-sm">{m.body}</p></div><button onClick={() => deleteMessage(m.id)} className="p-2 h-fit border border-inkline text-bone-dim hover:bg-signal hover:text-coal"><IconTrash className="w-4 h-4" /></button></div>)}</div>}

        {tab === "users" && <div className="mb-6"><ChangePassword accent="#FFB000" /></div>}

        {tab === "users" && <div className="border border-inkline divide-y divide-inkline">{(data?.users ?? []).map((u) => <div key={u.id} className="flex items-center gap-4 p-4 bg-panel"><span className="w-9 h-9 rounded-full bg-coal-2 border border-inkline flex items-center justify-center font-display font-bold text-signal">{u.email[0].toUpperCase()}</span><div className="flex-1"><p className="font-semibold text-sm">{u.email}</p><p className="font-tech text-[9px] text-bone-dim">Cuenta #{u.id} · creada {new Date(u.createdAt).toLocaleDateString("es-ES")}</p></div><span className={`px-2 py-1 border font-tech text-[9px] tracking-widest uppercase ${u.role === "admin" ? "border-amber/50 text-amber" : "border-inkline text-bone-dim"}`}>{u.role}</span><span className="font-tech text-[9px] text-bone-dim">{u.artistId ? `Perfil #${u.artistId}` : "sin perfil"}</span></div>)}</div>}
      </main>
      {notice && <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-[95] flex items-center gap-2 px-4 py-3 bg-bone text-coal font-display font-bold text-sm hard-shadow-signal"><IconCheck className="w-4 h-4" /> {notice}</div>}
      <Footer />
    </div>
  );
}
