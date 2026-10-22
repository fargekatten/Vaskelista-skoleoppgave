import { db, initialize } from "@/lib/store";
import {
  defaultPersonColors,
  groups,
  people,
  personColorOptions,
  today,
  validDate,
} from "@/lib/house";
import { randomUUID } from "node:crypto";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const validPerson = (p: unknown) =>
  Number.isInteger(p) && Number(p) >= 0 && Number(p) < people.length;
const validParticipants = (value: unknown) =>
  value === "all" ||
  (Array.isArray(value) && value.length > 0 && value.every(validPerson));
const normalizeParticipants = (value: unknown) =>
  value === "all" ||
  (Array.isArray(value) && people.every((_, index) => value.includes(index)))
    ? "all"
    : value;
const validId = (id: unknown) =>
  typeof id === "string" && /^[-a-f0-9]{36}$/.test(id);
export async function GET() {
  try {
    const d = await initialize();
    const [tasks, entries, settings, absences] = await Promise.all([
      d.query("SELECT * FROM tasks ORDER BY id"),
      d.query("SELECT * FROM entries ORDER BY created DESC"),
      d.query("SELECT * FROM settings"),
      d.query("SELECT * FROM absences ORDER BY start DESC"),
    ]);
    const savedSettings = Object.fromEntries(
      settings.map((r: any) => [r.month, JSON.parse(r.value)]),
    );
    const savedColors = savedSettings.__personColors;
    const taskMeta = savedSettings.__taskMeta ?? {};
    let migratedAllParticipants = false;
    for (const meta of Object.values(taskMeta) as any[]) {
      if (
        Array.isArray(meta?.participants) &&
        people.every((_, index) => meta.participants.includes(index)) &&
        meta.participants.length === people.length
      ) {
        meta.participants = "all";
        migratedAllParticipants = true;
      }
    }
    if (migratedAllParticipants) {
      await d.query(
        "UPDATE settings SET value=$1 WHERE month=$2",
        [JSON.stringify(taskMeta), "__taskMeta"],
      );
    }
    const customTags = (savedSettings.__customTags ?? []).map((tag: any) => ({
      id: tag.id,
      name: tag.name,
    }));
    const colors =
      Array.isArray(savedColors) &&
      savedColors.length === 4 &&
      savedColors.every((color: unknown) =>
        personColorOptions.some((option) => option.value === color),
      )
        ? savedColors
        : defaultPersonColors;
    const monthSettings = Object.fromEntries(
      Object.entries(savedSettings).filter(([key]) => /^\d{4}-(0[1-9]|1[0-2])$/.test(key)),
    );
    return Response.json(
      {
        tasks: tasks,
        entries: entries,
        absences: absences,
        settings: monthSettings,
        colors,
        taskMeta,
        customTags,
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (e) {
    return Response.json(
      { error: "Kunne ikke hente oversikten. Prøv igjen." },
      { status: 503 },
    );
  }
}
export async function POST(req: Request) {
  try {
    if (
      req.headers.get("origin") &&
      req.headers.get("origin") !== new URL(req.url).origin
    )
      return Response.json({ error: "Ugyldig avsender." }, { status: 403 });
    const b: any = await req.json();
    const d = await initialize();
    const setting = async (key: string, value: unknown) => {
      await d.query(
        "INSERT INTO settings (month,value) VALUES ($1,$2) ON CONFLICT(month) DO UPDATE SET value=excluded.value",
        [key, JSON.stringify(value)],
      );
    };
    const getSpecial = async (key: string) => {
      const rows = await d.query("SELECT value FROM settings WHERE month=$1", [key]);
      return rows[0] ? JSON.parse(rows[0].value) : null;
    };
    if (b.action === "createTag") {
      if (typeof b.name !== "string" || !b.name.trim() || b.name.trim().length > 40)
        throw Error("input");
      const tags = (await getSpecial("__customTags")) ?? [];
      if (tags.some((tag: any) => tag.name.toLowerCase() === b.name.trim().toLowerCase()))
        throw Error("input");
      const tag = { id: randomUUID(), name: b.name.trim() };
      await setting("__customTags", [...tags, tag]);
    } else if (b.action === "deleteTag") {
      if (typeof b.id !== "string" || !b.id) throw Error("input");
      const tags = (await getSpecial("__customTags")) ?? [];
      if (!tags.some((tag: any) => tag.id === b.id)) throw Error("input");
      const taskMeta = (await getSpecial("__taskMeta")) ?? {};
      for (const meta of Object.values(taskMeta) as any[]) {
        if (meta?.tagId === b.id) meta.tagId = "";
      }
      await setting("__taskMeta", taskMeta);
      await setting("__customTags", tags.filter((tag: any) => tag.id !== b.id));
    } else if (b.action === "taskMeta") {
      if (!Number.isInteger(b.task) || typeof b.description !== "string" || b.description.length > 2000 || !Array.isArray(b.subtasks) || b.subtasks.length > 20 || b.subtasks.some((s: unknown) => typeof s !== "string" || s.trim().length > 120) || !(b.tagId === "" || typeof b.tagId === "string"))
        throw Error("input");
      const tags = (await getSpecial("__customTags")) ?? [];
      const selectedTag = b.tagId ? tags.find((tag: any) => tag.id === b.tagId) : null;
      if (b.tagId && !selectedTag) throw Error("input");
      const taskMeta = (await getSpecial("__taskMeta")) ?? {};
      const current = taskMeta[String(b.task)] ?? {};
      const participants = b.participants ?? current.participants ?? "all";
      if (!validParticipants(participants)) throw Error("input");
      taskMeta[String(b.task)] = { description: b.description.trim(), subtasks: b.subtasks.map((s: string) => s.trim()).filter(Boolean), tagId: b.tagId, participants: normalizeParticipants(participants) };
      await setting("__taskMeta", taskMeta);
    } else if (b.action === "createTask") {
      if (typeof b.name !== "string" || !b.name.trim() || b.name.trim().length > 100 || !groups.includes(b.frequency) || !Number.isFinite(b.points) || b.points < 0.5 || b.points > 100 || !(b.tagId === "" || typeof b.tagId === "string") || (b.description !== undefined && (typeof b.description !== "string" || b.description.length > 2000)) || (b.subtasks !== undefined && (!Array.isArray(b.subtasks) || b.subtasks.length > 20 || b.subtasks.some((item: unknown) => typeof item !== "string" || item.trim().length > 120)))) throw Error("input");
      const tags = (await getSpecial("__customTags")) ?? [];
      const tag = b.tagId ? tags.find((item: any) => item.id === b.tagId) : null;
      if (b.tagId && !tag) throw Error("input");
      const participants = b.participants ?? "all";
      if (!validParticipants(participants)) throw Error("input");
      const ids = await d.query("SELECT COALESCE(MAX(id), 0) + 1 AS id FROM tasks");
      const id = Number(ids[0].id);
      await d.query("INSERT INTO tasks (id,name,frequency,points,dog,active) VALUES ($1,$2,$3,$4,0,1)", [id, b.name.trim(), b.frequency, b.points]);
      const taskMeta = (await getSpecial("__taskMeta")) ?? {};
      taskMeta[String(id)] = { description: typeof b.description === "string" ? b.description.slice(0, 2000).trim() : "", subtasks: Array.isArray(b.subtasks) ? b.subtasks.filter((s: unknown) => typeof s === "string").map((s: string) => s.trim()).filter(Boolean).slice(0, 20) : [], tagId: b.tagId, participants: normalizeParticipants(participants) };
      await setting("__taskMeta", taskMeta);
    } else if (b.action === "add") {
      if (!validPerson(b.person) || !Number.isInteger(b.task) || !validId(b.id))
        throw Error("input");
      const task: any = await d
        .query("SELECT * FROM tasks WHERE id=$1 AND active=1", [b.task])
        .then((rows) => rows[0]);
      if (!task) throw Error("input");
      const taskMeta = (await getSpecial("__taskMeta")) ?? {};
      const meta = taskMeta[String(b.task)];
      if (Array.isArray(meta?.participants) && !meta.participants.includes(b.person)) throw Error("input");
      await d.query(
        "INSERT INTO entries (id,task,person,points,dog,date,created) VALUES ($1,$2,$3,$4,$5,$6,$7) ON CONFLICT DO NOTHING",
        [
          b.id,
          b.task,
          b.person,
          task.points,
          task.dog,
          today(),
          new Date().toISOString(),
        ],
      );
    } else if (b.action === "undo") {
      if (!validId(b.id)) throw Error("input");
      await d.query("DELETE FROM entries WHERE id=$1", [b.id]);
    } else if (b.action === "points") {
      if (
        !Number.isInteger(b.task) ||
        !Number.isFinite(b.points) ||
        b.points < 0.5 ||
        b.points > 100
      )
        throw Error("input");
      await d.query("UPDATE tasks SET points=$1 WHERE id=$2", [
        b.points,
        b.task,
      ]);
    } else if (b.action === "name") {
      if (
        !Number.isInteger(b.task) ||
        typeof b.name !== "string" ||
        !b.name.trim() ||
        b.name.trim().length > 100
      )
        throw Error("input");
      await d.query("UPDATE tasks SET name=$1 WHERE id=$2", [
        b.name.trim(),
        b.task,
      ]);
    } else if (b.action === "colors") {
      if (
        !Array.isArray(b.value) ||
        b.value.length !== 4 ||
        b.value.some(
          (color: unknown) =>
            !personColorOptions.some((option) => option.value === color),
        )
      )
        throw Error("input");
      await setting("__personColors", b.value);
    } else if (b.action === "active") {
      if (!Number.isInteger(b.task) || typeof b.active !== "boolean")
        throw Error("input");
      await d.query("UPDATE tasks SET active=$1 WHERE id=$2", [
        b.active ? 1 : 0,
        b.task,
      ]);
    } else if (b.action === "frequency") {
      if (!Number.isInteger(b.task) || !groups.includes(b.frequency))
        throw Error("input");
      await d.query("UPDATE tasks SET frequency=$1 WHERE id=$2", [
        b.frequency,
        b.task,
      ]);
    } else if (b.action === "absence") {
      if (
        !validId(b.id) ||
        !validPerson(b.person) ||
        !validDate(b.start) ||
        !validDate(b.end) ||
        b.start > b.end ||
        typeof b.dogsAway !== "boolean"
      )
        throw Error("input");
      await d.query(
        'INSERT INTO absences (id,person,start,"end",dogs_away) VALUES ($1,$2,$3,$4,$5) ON CONFLICT DO NOTHING',
        [b.id, b.person, b.start, b.end, b.dogsAway ? 1 : 0],
      );
    } else if (b.action === "removeAbsence") {
      if (!validId(b.id)) throw Error("input");
      await d.query("DELETE FROM absences WHERE id=$1", [b.id]);
    } else if (b.action === "settings") {
      const s = b.value;
      if (
        !/^\d{4}-(0[1-9]|1[0-2])$/.test(b.month) ||
        !s ||
        !["presence", "dogs"].every(
          (k) =>
            Array.isArray(s[k]) &&
            s[k].length === 4 &&
            s[k].every((v: any) => Number.isFinite(v) && v >= 0 && v <= 10),
        ) ||
        s.presence.reduce((a: number, v: number) => a + v, 0) <= 0 ||
        !Number.isFinite(s.dogExtra) ||
        s.dogExtra < 0 ||
        s.dogExtra > 10
      )
        throw Error("input");
      await setting(b.month, s);
    } else throw Error("input");
    return Response.json({ ok: true });
  } catch (e) {
    return Response.json(
      { error: "Kunne ikke lagre. Kontroller verdiene og prøv igjen." },
      { status: 400 },
    );
  }
}
