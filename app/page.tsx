"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

type Chore = { id: number; title: string; description: string; frequency: string; points: number; completed: boolean };
type User = { id: number; username: string };

export default function Home() {
  const [user, setUser] = useState<User | null>(null);
  const [chores, setChores] = useState<Chore[]>([]);
  const [login, setLogin] = useState({ username: "", password: "" });
  const [draft, setDraft] = useState({ title: "", description: "", frequency: "Ukentlig", points: 1 });
  const [editing, setEditing] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const [message, setMessage] = useState("");

  async function load() {
    const response = await fetch("/api/chores");
    if (response.ok) {
      const data = await response.json();
      setUser(data.user);
      setChores(data.chores);
    } else {
      setUser(null);
      setChores([]);
    }
  }

  useEffect(() => { void load(); }, []);

  async function signIn(event: FormEvent) {
    event.preventDefault();
    const response = await fetch("/api/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(login) });
    const data = await response.json();
    if (!response.ok) return setMessage(data.error);
    setMessage("");
    await load();
  }

  async function addChore(event: FormEvent) {
    event.preventDefault();
    const response = await fetch("/api/chores", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(draft) });
    if (response.ok) {
      setDraft({ title: "", description: "", frequency: "Ukentlig", points: 1 });
      await load();
    }
  }

  async function saveEdit(event: FormEvent, chore: Chore) {
    event.preventDefault();
    await updateChore(chore, { title: draft.title, description: draft.description, frequency: draft.frequency, points: draft.points });
    setEditing(null);
  }

  async function updateChore(chore: Chore, changes: Partial<Chore>) {
    await fetch(`/api/chores/${chore.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...chore, ...changes }) });
    await load();
  }

  async function deleteChore(chore: Chore) {
    await fetch(`/api/chores/${chore.id}`, { method: "DELETE" });
    await load();
  }

  async function signOut() {
    await fetch("/api/logout", { method: "POST" });
    setUser(null);
    setChores([]);
  }

  const visible = useMemo(() => chores.filter((chore) => `${chore.title} ${chore.description}`.toLowerCase().includes(search.toLowerCase())), [chores, search]);

  if (!user) return <main className="login-shell"><section className="card login-card"><p className="eyebrow">CASA CAOS</p><h1>Vaskelista</h1><p>Logg inn for å se dine oppgaver.</p><form onSubmit={signIn} className="stack"><label>Brukernavn<input value={login.username} onChange={(e) => setLogin({ ...login, username: e.target.value })} /></label><label>Passord<input type="password" value={login.password} onChange={(e) => setLogin({ ...login, password: e.target.value })} /></label><button>Logg inn</button></form>{message && <p className="message">{message}</p>}<p className="hint">Testbrukere: alice / alice123 · bob / bob123</p></section></main>;

  return <main className="page-shell"><header className="topbar"><div><p className="eyebrow">CASA CAOS</p><h1>Vaskelista</h1></div><div className="account"><span>Innlogget som <strong>{user.username}</strong></span><button className="secondary" onClick={signOut}>Logg ut</button></div></header><section className="card"><h2>Legg til oppgave</h2><form className="task-form" onSubmit={addChore}><label>Oppgave<input value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} /></label><label>Beskrivelse<textarea value={draft.description} onChange={(e) => setDraft({ ...draft, description: e.target.value })} /></label><label>Hvor ofte<select value={draft.frequency} onChange={(e) => setDraft({ ...draft, frequency: e.target.value })}><option>Daglig</option><option>Ukentlig</option><option>Månedlig</option><option>Ved behov</option></select></label><label>Poeng<input type="number" value={draft.points} onChange={(e) => setDraft({ ...draft, points: Number(e.target.value) })} /></label><button>Legg til</button></form></section><section className="card"><div className="list-heading"><div><h2>Mine oppgaver</h2><p>Oppgaver lagres på brukeren du er logget inn som.</p></div><label className="search">Søk<input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Søk i oppgaver" /></label></div><div className="chore-list">{visible.map((chore) => <article className="chore" key={chore.id}><input aria-label="Fullført" type="checkbox" checked={chore.completed} onChange={(e) => void updateChore(chore, { completed: e.target.checked })} />{editing === chore.id ? <form className="edit-form" onSubmit={(e) => void saveEdit(e, chore)}><input aria-label="Oppgavenavn" value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} /><textarea aria-label="Beskrivelse" value={draft.description} onChange={(e) => setDraft({ ...draft, description: e.target.value })} /><select aria-label="Hyppighet" value={draft.frequency} onChange={(e) => setDraft({ ...draft, frequency: e.target.value })}><option>Daglig</option><option>Ukentlig</option><option>Månedlig</option><option>Ved behov</option></select><input aria-label="Poeng" type="number" value={draft.points} onChange={(e) => setDraft({ ...draft, points: Number(e.target.value) })} /><button>Lagre</button><button type="button" className="secondary" onClick={() => setEditing(null)}>Avbryt</button></form> : <><div className="chore-info"><strong className={chore.completed ? "done" : ""}>{chore.title}</strong><p>{chore.description || "Ingen beskrivelse"}</p><small>{chore.frequency} · {chore.points} poeng</small></div><button className="secondary" onClick={() => { setDraft({ title: chore.title, description: chore.description, frequency: chore.frequency, points: chore.points }); setEditing(chore.id); }}>Rediger</button><button className="secondary" onClick={() => void deleteChore(chore)}>Slett</button></>}</article>)}{visible.length === 0 && <p className="empty">Ingen oppgaver funnet.</p>}</div></section></main>;
}
