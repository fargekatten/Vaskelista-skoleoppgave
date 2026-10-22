"use client";
import { useEffect, useState, useRef } from "react";
import type { CSSProperties } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";
import { House } from "lucide-react";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import {
  people,
  groups,
  defaults,
  today,
  shares,
  sharesOnDate,
  monthlyPersonGoals,
  personGoalsForPeriod,
  isoWeekRange,
  isoWeekValue,
  periodStart,
  taskName,
  Absence,
  defaultPersonColors,
  personColorOptions,
} from "@/lib/house";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
type Task = {
  id: number;
  name: string;
  points: number;
  frequency: string;
  dog: number;
  active: number;
};
type TaskTag = { id: string; name: string };
type TaskMeta = {
  description: string;
  subtasks: string[];
  tagId: string;
  participants: number[] | "all";
};
const allPersonIds = () => people.map((_, index) => index);
const allowedPeople = (participants?: number[] | "all") =>
  participants === "all" || !Array.isArray(participants)
    ? allPersonIds()
    : participants;
const normalizePeople = (participants: number[]): number[] | "all" =>
  people.every((_, index) => participants.includes(index)) ? "all" : participants;
const isEveryone = (participants?: number[] | "all") =>
  participants === "all" ||
  !Array.isArray(participants) ||
  (participants.length === people.length && people.every((_, index) => participants.includes(index)));
type Entry = {
  id: string;
  task: number;
  person: number;
  points: number;
  dog: number;
  date: string;
  created: string;
};
type Data = {
  tasks: Task[];
  entries: Entry[];
  absences: Absence[];
  settings: Record<string, typeof defaults>;
  colors: string[];
  taskMeta: Record<string, TaskMeta>;
  customTags: TaskTag[];
};
const fmt = (n: number) =>
  n.toLocaleString("nb-NO", { maximumFractionDigits: 1 });
const dateLabel = (d: string) =>
  new Date(d + "T12:00:00").toLocaleDateString("nb-NO", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
function Tasks({ me, onLogout }: { me: number; onLogout: () => void }) {
  const [data, setData] = useState<Data | null>(null),
    [activeTab, setActiveTab] = useState("list"),
    [error, setError] = useState(""),
    [month, setMonth] = useState(today().slice(0, 7)),
    [selectedWeek, setSelectedWeek] = useState(isoWeekValue(today())),
    [year, setYear] = useState(today().slice(0, 4)),
    [onlyRemaining, setOnlyRemaining] = useState(false),
    [frequencies, setFrequencies] = useState<string[]>([]),
    [selectedTag, setSelectedTag] = useState(""),
    [privateYearTag, setPrivateYearTag] = useState("all"),
    [developerTagFilter, setDeveloperTagFilter] = useState("all"),
    [developerFrequencyFilter, setDeveloperFrequencyFilter] = useState("all"),
    [detailTask, setDetailTask] = useState<Task | null>(null),
    [checkedSubtasks, setCheckedSubtasks] = useState<Record<string, boolean>>({}),
    [showCreateTask, setShowCreateTask] = useState(false),
    [newTaskName, setNewTaskName] = useState(""),
    [newTaskFrequency, setNewTaskFrequency] = useState("Ukentlig"),
    [newTaskPoints, setNewTaskPoints] = useState("2"),
    [newTaskTag, setNewTaskTag] = useState(""),
    [newTaskDescription, setNewTaskDescription] = useState(""),
    [newTaskSubtasks, setNewTaskSubtasks] = useState(""),
    [newTaskParticipants, setNewTaskParticipants] = useState<number[] | "all">("all"),
    [creatingTask, setCreatingTask] = useState(false),
    [newTagName, setNewTagName] = useState(""),
    [creatingTag, setCreatingTag] = useState(false),
    [metaDrafts, setMetaDrafts] = useState<Record<string, TaskMeta>>({}),
    [deleting, setDeleting] = useState<string[]>([]),
    [deleteTarget, setDeleteTarget] = useState<Entry | null>(null),
    [absencePerson, setAbsencePerson] = useState("0"),
    [absenceStart, setAbsenceStart] = useState(today()),
    [absenceEnd, setAbsenceEnd] = useState(today()),
    [dogsAway, setDogsAway] = useState(true),
    [savingAbsence, setSavingAbsence] = useState(false),
    [pending, setPending] = useState(false),
    [draft, setDraft] = useState(defaults);
  const selectedPerson = me;
  const lock = useRef(false),
    seq = useRef(0);
  async function refresh() {
    const id = ++seq.current;
    const r = await fetch("/api/house", { cache: "no-store" });
    const d: any = await r.json();
    if (r.status === 401) onLogout();
    if (!r.ok) throw Error(d.error);
    if (id === seq.current) {
      setData(d);
      setError("");
    }
    return d;
  }
  useEffect(() => {
    refresh().catch((e) => setError(e.message));
    const t = setInterval(
      () => refresh().catch((e) => setError(e.message)),
      15000,
    );
    return () => clearInterval(t);
  }, []);
  useEffect(() => {
    const resetPersonFilter = () => {
      if (document.visibilityState === "hidden") {
        setFrequencies([]);
        setSelectedTag("");
        setOnlyRemaining(false);
        setDetailTask(null);
        setCheckedSubtasks({});
      }
    };
    document.addEventListener("visibilitychange", resetPersonFilter);
    return () => document.removeEventListener("visibilitychange", resetPersonFilter);
  }, []);
  useEffect(() => {
    let previous = today().slice(0, 7);
    const timer = setInterval(() => {
      const current = today().slice(0, 7);
      if (current !== previous) {
        setMonth((m) => (m === previous ? current : m));
        previous = current;
      }
    }, 15000);
    return () => clearInterval(timer);
  }, []);
  const savedSettings = JSON.stringify(data?.settings[month] ?? defaults);
  useEffect(() => {
    setDraft(JSON.parse(savedSettings));
  }, [month, savedSettings]);
  async function mutate(body: any) {
    const r = await fetch("/api/house", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const d: any = await r.json();
    if (!r.ok) throw Error(d.error);
    await refresh();
  }
  async function undo(id: string) {
    if (deleting.includes(id)) return;
    setDeleting((ids) => [...ids, id]);
    try {
      await mutate({ action: "undo", id });
      toast.success("Registreringen er fjernet");
      setDeleteTarget(null);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setDeleting((ids) => ids.filter((value) => value !== id));
    }
  }
  async function add(task: number, person: number) {
    if (lock.current) return;
    lock.current = true;
    setPending(true);
    const id = crypto.randomUUID();
    try {
      await mutate({ action: "add", task, person, id });
      toast.success(
        `${people[person]} · ${data?.tasks.find((t) => t.id === task) ? taskName(data.tasks.find((t) => t.id === task)!) : "Oppgave"}`,
        {
          action: {
            label: "Angre",
            onClick: () =>
              setDeleteTarget({
                id,
                task,
                person,
                date: today(),
                created: new Date().toISOString(),
                points: 0,
                dog: 0,
              }),
          },
          duration: 7000,
        },
      );
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      lock.current = false;
      setPending(false);
    }
  }
  useEffect(() => {
    const c = (document as any).modelContext;
    if (!c?.registerTool) return;
    const controller = new AbortController();
    Promise.resolve(
      c.registerTool(
        {
          name: "read_household_overview",
          description:
            "Les kollektivet sine oppgaver og registrerte utførelser.",
          inputSchema: {
            type: "object",
            properties: {},
            additionalProperties: false,
          },
          annotations: { readOnlyHint: true },
          execute: async (input: any) => {
            if (!input || Object.keys(input).length)
              throw Error("Expected empty object");
            return await refresh();
          },
        },
        { signal: controller.signal },
      ),
    ).catch(() => {});
    return () => controller.abort();
  }, []);
  const entries = data?.entries ?? [];
  const activeTasks = data?.tasks.filter((task) => task.active) ?? [];
  const taskParticipants = (task: Task) =>
    allowedPeople(data?.taskMeta?.[String(task.id)]?.participants);
  const isPersonalTask = (task: Task) =>
    !isEveryone(data?.taskMeta?.[String(task.id)]?.participants);
  const monthlyAll = entries.filter((entry) => entry.date.startsWith(month));
  const annualAll = entries.filter((entry) => entry.date.startsWith(year));
  const taskForEntry = (entry: Entry) => data?.tasks.find((task) => task.id === entry.task);
  const monthly = monthlyAll.filter((entry) => {
    const task = taskForEntry(entry);
    return !task || !isPersonalTask(task);
  });
  const weekRange = isoWeekRange(selectedWeek);
  const weekNumber = Number(selectedWeek.split("W")[1]);
  const monthLabel = new Date(`${month}-01T12:00:00`).toLocaleDateString("nb-NO", {
    month: "long",
  });
  const monthHeading = monthLabel.charAt(0).toLocaleUpperCase("nb-NO") + monthLabel.slice(1);
  const weeklyAll = weekRange
    ? entries.filter((entry) => entry.date >= weekRange.start && entry.date <= weekRange.end)
    : [];
  const weekly = weeklyAll.filter((entry) => {
    const task = taskForEntry(entry);
    return !task || !isPersonalTask(task);
  });
  const annual = annualAll.filter((entry) => {
    const task = taskForEntry(entry);
    return !task || !isPersonalTask(task);
  });
  const personalMonthly = monthlyAll.filter((entry) => {
    const task = taskForEntry(entry);
    return task ? isPersonalTask(task) : false;
  });
  const personalAnnual = annualAll.filter((entry) => {
    const task = taskForEntry(entry);
    return task ? isPersonalTask(task) : false;
  });
  const privateYearTags = (data?.customTags ?? []).filter((tag) =>
    (data?.tasks ?? []).some(
      (task) =>
        isPersonalTask(task) &&
        data?.taskMeta?.[String(task.id)]?.tagId === tag.id,
    ),
  );
  const activePrivateYearTag = privateYearTags.some((tag) => tag.id === privateYearTag)
    ? privateYearTag
    : "all";
  const privateAnnualTasks = (data?.tasks ?? []).filter(
    (task) =>
      isPersonalTask(task) &&
      (activePrivateYearTag === "all" ||
        data?.taskMeta?.[String(task.id)]?.tagId === activePrivateYearTag),
  );
  const privateAnnualTaskIds = new Set(privateAnnualTasks.map((task) => task.id));
  const selectedPersonalAnnual = personalAnnual.filter((entry) =>
    privateAnnualTaskIds.has(entry.task),
  );
  const privateAnnualPeople = activePrivateYearTag === "all"
    ? allPersonIds()
    : [...new Set(privateAnnualTasks.flatMap((task) => taskParticipants(task)))].sort(
        (a, b) => a - b,
      );
  const settings = data?.settings[month] ?? defaults;
  const statusDate =
    month === today().slice(0, 7)
      ? today()
      : new Date(
          Date.UTC(Number(month.slice(0, 4)), Number(month.slice(5, 7)), 0),
        )
          .toISOString()
          .slice(0, 10);
  const sharedTasks = activeTasks.filter((task) => !isPersonalTask(task));
  const monthlyGoals = monthlyPersonGoals(
    sharedTasks.map((task) => ({
      ...task,
      participants: taskParticipants(task),
    })),
    data?.settings ?? {},
    data?.absences ?? [],
    month,
  );
  const weeklyGoals = weekRange
    ? personGoalsForPeriod(
        sharedTasks.map((task) => ({
          ...task,
          participants: taskParticipants(task),
        })),
        data?.settings ?? {},
        data?.absences ?? [],
        weekRange.start,
        weekRange.end,
      )
    : people.map(() => 0);
  const personTasks = selectedPerson === null
    ? sharedTasks
    : activeTasks.filter((task) => taskParticipants(task).includes(selectedPerson));
  const availableTags = (data?.customTags ?? []).filter((tag) =>
    personTasks.some((task) => data?.taskMeta?.[String(task.id)]?.tagId === tag.id),
  );
  const activeDeveloperTagFilter =
    developerTagFilter === "all" ||
    developerTagFilter === "__untagged__" ||
    (data?.customTags ?? []).some((tag) => tag.id === developerTagFilter)
      ? developerTagFilter
      : "all";
  const activeDeveloperFrequencyFilter =
    developerFrequencyFilter === "all" || groups.includes(developerFrequencyFilter)
      ? developerFrequencyFilter
      : "all";
  const developerTasks = (data?.tasks ?? [])
    .filter((task) => {
      const tagId = data?.taskMeta?.[String(task.id)]?.tagId ?? "";
      const matchesTag = activeDeveloperTagFilter === "all"
        ? true
        : activeDeveloperTagFilter === "__untagged__"
          ? !tagId
          : tagId === activeDeveloperTagFilter;
      const matchesFrequency = activeDeveloperFrequencyFilter === "all"
        || task.frequency === activeDeveloperFrequencyFilter;
      return matchesTag && matchesFrequency;
    })
    .sort((a, b) => groups.indexOf(a.frequency) - groups.indexOf(b.frequency));
  const filteredTasks = personTasks.filter(
    (task) =>
      (frequencies.length === 0 || frequencies.includes(task.frequency)) &&
      (!selectedTag || data?.taskMeta?.[String(task.id)]?.tagId === selectedTag),
  ).sort((a, b) => groups.indexOf(a.frequency) - groups.indexOf(b.frequency));
  function toggleFrequency(frequency: string) {
    setFrequencies((current) =>
      current.includes(frequency)
        ? current.filter((item) => item !== frequency)
        : [...current, frequency],
    );
  }
  function done(t: Task) {
    const start = periodStart(t.frequency, statusDate);
    return entries.some(
      (e) => e.task === t.id && e.date >= start && e.date <= statusDate,
    );
  }
  const periodLabels: Record<string, string> = {
    Daglig: "i dag",
    Ukentlig: "denne uken",
    Månedlig: "denne måneden",
    Kvartal: "dette kvartalet",
    Årlig: "dette året",
    "Ved behov": "denne måneden",
  };
  async function action(body: any, message: string) {
    try {
      await mutate(body);
      toast.success(message);
    } catch (e: any) {
      toast.error(e.message);
    }
  }
  async function savePersonColor(person: number, color: string) {
    const colors = [...(data?.colors ?? defaultPersonColors)];
    colors[person] = color;
    await action(
      { action: "colors", value: colors },
      `${people[person]} sin farge er lagret`,
    );
  }
  async function createTag(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (creatingTag) return;
    setCreatingTag(true);
    try {
      await mutate({ action: "createTag", name: newTagName });
      setNewTagName("");
      toast.success("Filteret er opprettet");
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setCreatingTag(false);
    }
  }
  async function deleteTag(tag: TaskTag) {
    const assignedCount = data?.tasks.filter(
      (task) => data.taskMeta[String(task.id)]?.tagId === tag.id,
    ).length ?? 0;
    const note = assignedCount
      ? ` ${assignedCount} oppgave(r) beholdes, men får ikke lenger denne taggen.`
      : "";
    if (!window.confirm(`Slette filteret «${tag.name}»?${note}`)) return;
    try {
      await mutate({ action: "deleteTag", id: tag.id });
      toast.success("Filteret er slettet");
    } catch (e: any) {
      toast.error(e.message);
    }
  }
  async function createTask(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (creatingTask) return;
    const participants = newTaskParticipants === "all" ? "all" : normalizePeople(newTaskParticipants);
    if (Array.isArray(participants) && !participants.length) {
      toast.error("Velg minst én person som kan registrere oppgaven.");
      return;
    }
    setCreatingTask(true);
    try {
      await mutate({
        action: "createTask",
        name: newTaskName,
        frequency: newTaskFrequency,
        points: Number(newTaskPoints),
        tagId: newTaskTag,
        description: newTaskDescription,
        subtasks: newTaskSubtasks.split("\n").map((item) => item.trim()).filter(Boolean),
        participants,
      });
      setNewTaskName("");
      setNewTaskDescription("");
      setNewTaskSubtasks("");
      setNewTaskTag("");
      setNewTaskParticipants("all");
      setShowCreateTask(false);
      toast.success("Oppgaven er opprettet");
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setCreatingTask(false);
    }
  }
  async function saveTaskMeta(task: Task, draft: TaskMeta) {
    try {
      await mutate({ action: "taskMeta", task: task.id, ...draft });
      toast.success("Oppgaveinformasjon er lagret");
    } catch (e: any) {
      toast.error(e.message);
    }
  }
  function personalCards(list: Entry[], personIds = allPersonIds()) {
    const totals = personIds.map((person) =>
      list
        .filter((entry) => entry.person === person)
        .reduce((sum, entry) => sum + entry.points, 0),
    );
    const highest = Math.max(0, ...totals);
    return (
      <div className="scores">
        {personIds.map((index) => {
          const person = people[index];
          const own = list.filter((entry) => entry.person === index);
          return (
            <div className={`score person${index}${totals[personIds.indexOf(index)] === highest && highest > 0 ? " private-leader" : ""}`} key={person}>
              <span>{person}</span>
              <strong>{fmt(own.reduce((sum, entry) => sum + entry.points, 0))} <small>poeng</small></strong>
              <div>{own.length} personoppgaver utført</div>
            </div>
          );
        })}
      </div>
    );
  }
  function cards(list: Entry[], targets?: number[], targetLabel = "Månedsmål") {
    return (
      <div className="scores">
        {people.map((p, i) => {
          const own = list.filter((e) => e.person === i),
            points = own.reduce((s, e) => s + e.points, 0),
            expected = list.reduce((sum, entry) => {
              const task = data?.tasks.find((item) => item.id === entry.task);
              const sharesForDay = sharesOnDate(
                data?.settings[entry.date.slice(0, 7)] ?? defaults,
                entry.dog,
                entry.date,
                data?.absences ?? [],
              );
              const allowed = task ? taskParticipants(task) : allPersonIds();
              const eligibleTotal = sharesForDay.reduce(
                (total, share, person) => total + (allowed.includes(person) ? share : 0),
                0,
              );
              return sum + (allowed.includes(i) && eligibleTotal ? entry.points * sharesForDay[i] / eligibleTotal : 0);
            }, 0);
          return (
            <div className={"score person" + i} key={p}>
              {targets && (
                <div
                  className="score-progress"
                  role="progressbar"
                  aria-label={`${p}: ${fmt(points)} av ${fmt(targets[i])} ${targetLabel.toLowerCase()}-poeng`}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={
                    targets[i] > 0
                      ? Math.min(100, (points / targets[i]) * 100)
                      : 0
                  }
                >
                  <span
                    style={{
                      width: `${targets[i] > 0 ? Math.min(100, (points / targets[i]) * 100) : 0}%`,
                    }}
                  />
                </div>
              )}
              <span>{p}</span>
              <strong>
                {fmt(points)} <small>poeng</small>
              </strong>
              <div>{own.length} utførelser</div>
              {targets ? (
                <p>
                  {targets[i] > 0
                    ? `${targetLabel}: ${fmt(targets[i])} poeng · ${Math.round((points / targets[i]) * 100)} %`
                    : `Ingen beregnet ${targetLabel.toLowerCase()}`}
                </p>
              ) : (
                <p>Forventet, med fravær: {fmt(expected)} p</p>
              )}
            </div>
          );
        })}
      </div>
    );
  }
  return (
      <main
        style={
          {
            "--person-color-0": data?.colors?.[0] ?? defaultPersonColors[0],
            "--person-color-1": data?.colors?.[1] ?? defaultPersonColors[1],
            "--person-color-2": data?.colors?.[2] ?? defaultPersonColors[2],
            "--person-color-3": data?.colors?.[3] ?? defaultPersonColors[3],
          } as CSSProperties
        }
      >
      <Toaster position="bottom-center" />
      <AlertDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open && !deleting.length) setDeleteTarget(null);
        }}
      >
        <AlertDialogContent className="delete-dialog">
          <AlertDialogHeader>
            <AlertDialogTitle>
              Slett oppføring for{" "}
              {deleteTarget ? people[deleteTarget.person] : ""}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget && (
                <>
                  <strong>
                    {data?.tasks.find((t) => t.id === deleteTarget.task)
                      ? taskName(
                          data.tasks.find((t) => t.id === deleteTarget.task)!,
                        )
                      : "Oppgave"}
                  </strong>
                  <br />
                  {dateLabel(deleteTarget.date)} kl.{" "}
                  {new Date(deleteTarget.created).toLocaleTimeString("nb-NO", {
                    timeZone: "Europe/Oslo",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                  <br />
                  Dette sletter én oppføring. Andre registreringer beholdes.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting.length > 0}>
              Avbryt
            </AlertDialogCancel>
            <AlertDialogAction
              className="confirm-delete"
              disabled={deleting.length > 0}
              onClick={(event) => {
                event.preventDefault();
                if (deleteTarget) void undo(deleteTarget.id);
              }}
            >
              {deleting.length
                ? "Sletter …"
                : `Ja, slett oppføring for ${deleteTarget ? people[deleteTarget.person] : ""}`}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      {detailTask && (
        <div className="task-detail-backdrop" onMouseDown={(event) => {
          if (event.target === event.currentTarget) setDetailTask(null);
        }}>
          <section className="task-detail" role="dialog" aria-modal="true" aria-labelledby="task-detail-title">
            <button className="task-detail-close" type="button" onClick={() => setDetailTask(null)} aria-label="Lukk oppgavebeskrivelse">×</button>
            <span className="frequency">{detailTask.frequency === "Kvartal" ? "Kvartalsvis" : detailTask.frequency}</span>
            <h2 id="task-detail-title">{taskName(detailTask)}</h2>
            <p>{data?.taskMeta?.[String(detailTask.id)]?.description || "Ingen nærmere beskrivelse er lagt til ennå."}</p>
            {(data?.taskMeta?.[String(detailTask.id)]?.subtasks ?? []).length > 0 && (
              <div className="detail-subtasks">
                <h3>Dette inngår</h3>
                {(data?.taskMeta?.[String(detailTask.id)]?.subtasks ?? []).map((subtask, index) => {
                  const key = `${detailTask.id}-${index}`;
                  return (
                    <label key={key}>
                      <Checkbox checked={!!checkedSubtasks[key]} onCheckedChange={(checked) => setCheckedSubtasks((current) => ({ ...current, [key]: checked === true }))} />
                      <span className={checkedSubtasks[key] ? "subtask-checked" : ""}>{subtask}</span>
                    </label>
                  );
                })}
              </div>
            )}
            <p className="detail-points">{fmt(detailTask.points)} poeng · {detailTask.dog ? "Hundepåvirket oppgave" : "Uten hundetillegg"}</p>
          </section>
        </div>
      )}
      <header>
        <div className="brand">
          <House />
          <h1>Husarbeid</h1>
        </div>
        <span className="household">Inger · Lisa · Leander · Vegard</span>
        <button type="button" className="textbutton" onClick={onLogout}>Logg ut ({people[me]})</button>
      </header>
      <Tabs
        value={activeTab}
        onValueChange={(value) => {
          setActiveTab(value);
          if (value !== "list") {
            setFrequencies([]);
            setSelectedTag("");
            setOnlyRemaining(false);
            setDetailTask(null);
            setCheckedSubtasks({});
          }
        }}
      >
        <div className="nav">
          <TabsList>
            <TabsTrigger value="list">Oppgaver</TabsTrigger>
            <TabsTrigger value="history">Historikk</TabsTrigger>
            <TabsTrigger value="absence">Bortreist</TabsTrigger>
            <TabsTrigger value="settings">Innstillinger</TabsTrigger>
            <TabsTrigger value="developer">Utvikler</TabsTrigger>
          </TabsList>
          <label className="period">
            Måned{" "}
            <input
              aria-label="Velg måned"
              type="month"
              value={month}
              onChange={(e) => e.target.value && setMonth(e.target.value)}
            />
          </label>
        </div>
        {error && (
          <div className="error" role="alert">
            {error}{" "}
            <button onClick={() => refresh().catch((e) => setError(e.message))}>
              Prøv igjen
            </button>
          </div>
        )}
        {!data ? (
          <p className="loading">Henter felles oversikt …</p>
        ) : (
          <>
            <TabsContent value="list">
              <div className="sectionhead">
                <div>
                  <h2>{`Oppgaver for ${people[selectedPerson]}`}</h2>
                  <p>{`Viser oppgaver ${people[selectedPerson]} kan registrere.`}</p>
                </div>
              </div>
              <span className="pill">Registrerer på dagens dato</span>
              <div className="list-toolbar">
                <span>
                  <strong>
                    {filteredTasks.filter((t) => !done(t)).length}
                  </strong>{" "}
                  gjenstår for perioden sin
                  {month !== today().slice(0, 7)
                    ? ` · status per ${dateLabel(statusDate)}`
                    : ""}
                </span>
                <label className="checklabel">
                  <Checkbox
                    checked={onlyRemaining}
                    onCheckedChange={(v) => setOnlyRemaining(v === true)}
                  />
                  Vis bare det som gjenstår
                </label>
              </div>
              <div
                className="task-filters"
                role="group"
                aria-label="Filtrer oppgaver etter hyppighet"
              >
                <button
                  type="button"
                  aria-pressed={frequencies.length === 0}
                  onClick={() => setFrequencies([])}
                >
                  Alle
                </button>
                    {groups.map((frequency) => (
                  <button
                    key={frequency}
                    type="button"
                    aria-pressed={frequencies.includes(frequency)}
                    onClick={() => toggleFrequency(frequency)}
                  >
                    {frequency === "Kvartal" ? "Kvartalsvis" : frequency}
                  </button>
                ))}
              </div>
              {availableTags.length > 0 && (
                <div className="task-filters tag-filters" role="group" aria-label="Filtrer oppgaver etter tag">
                  <button type="button" aria-pressed={!selectedTag} onClick={() => setSelectedTag("")}>Alle typer</button>
                  {availableTags.map((tag) => (
                    <button key={tag.id} type="button" aria-pressed={selectedTag === tag.id} onClick={() => setSelectedTag(selectedTag === tag.id ? "" : tag.id)}>{tag.name}</button>
                  ))}
                </div>
              )}
              <div className="tasklist">
                {filteredTasks
                  .filter((t) => !onlyRemaining || !done(t))
                  .map((t) => {
                    const completed = done(t),
                      last = entries.find(
                        (e) => e.task === t.id && e.date <= statusDate,
                      ),
                      logs = monthly.filter((e) => e.task === t.id);
                    const taskPeriodStart = periodStart(t.frequency, statusDate);
                    const currentPeriodLogs = logs.filter(
                      (entry) => entry.date >= taskPeriodStart && entry.date <= statusDate,
                    );
                    const earlierMonthLogs = logs.filter(
                      (entry) => entry.date < taskPeriodStart,
                    );
                    return (
                      <div
                        className={
                          "task " + (completed ? "completed" : "remaining")
                        }
                        key={t.id}
                      >
                        <div className="tasktext">
                          <div className="tasktitle">
                            <button className="task-title-button" type="button" onClick={() => { setDetailTask(t); setCheckedSubtasks({}); }}>{taskName(t)} <span aria-hidden="true">ⓘ</span></button>
                            <span className="frequency">
                    {t.frequency === "Kvartal"
                                ? "Kvartalsvis"
                                : t.frequency === "Årlig"
                                  ? "Årlig"
                                  : t.frequency}
                            </span>
                          </div>
                          <p className={"status " + (completed ? "done" : "")}>
                            <span>
                              {completed ? "✓ Gjort" : "○ Gjenstår"}{" "}
                              {periodLabels[t.frequency]}
                            </span>
                            {last ? ` · Sist ${dateLabel(last.date)}` : ""}
                          </p>
                          <div
                            className="stamps"
                            aria-label={"Utført i " + month}
                          >
                            {logs.length ? (
                              <>
                                <div className="past-stamps" aria-label="Utført tidligere denne måneden">
                                  {people.map((person, index) => {
                                    const earlier = earlierMonthLogs.filter((entry) => entry.person === index);
                                    if (!earlier.length) return null;
                                    const latest = earlier.reduce((newest, entry) =>
                                      entry.date > newest.date ? entry : newest,
                                    );
                                    return (
                                      <button
                                        type="button"
                                        className={`past-stamp person${index}`}
                                        key={`past-${index}`}
                                        onClick={() => setDeleteTarget(latest)}
                                        aria-label={`Tidligere denne måneden: ${person}. Trykk for å slette siste tidligere oppføring for ${taskName(t)}`}
                                        title={`Tidligere denne måneden · ${person} · siste: ${dateLabel(latest.date)}. Trykk for å slette.`}
                                      >
                                        {person.slice(0, 2)}
                                      </button>
                                    );
                                  })}
                                </div>
                                {people.map((person, index) => {
                                  const current = currentPeriodLogs.filter((entry) => entry.person === index);
                                  if (!current.length) return null;
                                  return (
                                    <button
                                      type="button"
                                      className={`stamp person${index}`}
                                      key={`current-${index}`}
                                      onClick={() => setDeleteTarget(current[0])}
                                      aria-label={`Slett én utførelse av ${taskName(t)} for ${person} i gjeldende periode`}
                                      title={`Trykk for å slette én utførelse for ${person} i gjeldende periode`}
                                    >
                                      <b>{person.slice(0, 2)}</b>
                                      {person}
                                      {current.length > 1 && <strong>×{current.length}</strong>}
                                    </button>
                                  );
                                })}
                              </>
                            ) : (
                              <span className="no-stamps">
                                Ingen utførelser i valgt måned
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="names">
                          {selectedPerson !== null ? (
                            <button disabled={pending} className={`name person${selectedPerson}`} onClick={() => add(t.id, selectedPerson)} aria-label={`Registrer ${taskName(t)} for ${people[selectedPerson]}`}>
                              <span>Gjort for {people[selectedPerson]}</span>
                            </button>
                          ) : people.map((p, i) => (
                            taskParticipants(t).includes(i) && (
                            <button
                              disabled={pending}
                              className={"name person" + i}
                              key={p}
                              onClick={() => add(t.id, i)}
                              aria-label={`Registrer ${taskName(t)} for ${p}`}
                            >
                              <span>{p}</span>
                            </button>
                            )
                          ))}
                        </div>
                      </div>
                    );
                  })}
              </div>
              {onlyRemaining && !filteredTasks.some((t) => !done(t)) && (
                <p className="empty">
                  Ingen gjenstående oppgaver i dette utvalget. Endre filtrene
                  for å vise flere.
                </p>
              )}
              <p className="footnote">
                Grønt = gjort i perioden. Ukene starter mandag; måned og kvartal
                følger kalenderen. Navnene samles opp for valgt måned. Trykk på
                et navnemerke for å slette siste oppføring for personen. Du blir
                bedt om å bekrefte. Eldre oppføringer kan slettes under
                Historikk. Du får poeng hver gang, også når raden er grønn.
              </p>
            </TabsContent>
            <TabsContent value="history">
              <div className="sectionhead weekly-history-head">
                <div>
                  <h2>Uke {weekNumber}</h2>
                  <p>
                    {weekRange
                      ? `${dateLabel(weekRange.start)}–${dateLabel(weekRange.end)} · uka starter mandag.`
                      : "Velg en uke for å se poeng og mål."}
                  </p>
                </div>
                <label>
                  Uke{" "}
                  <input
                    aria-label="Velg uke"
                    type="week"
                    value={selectedWeek}
                    onChange={(event) => event.target.value && setSelectedWeek(event.target.value)}
                  />
                </label>
              </div>
              {cards(weekly, weeklyGoals, "Ukemål")}
              <div className="sectionhead">
                <div>
                  <h2>{monthHeading}</h2>
                  <p>
                    Forventet andel tar hensyn til registrert fravær på datoene
                    arbeidet ble gjort.
                  </p>
                </div>
              </div>
              {cards(monthly, monthlyGoals)}
              <div className="sectionhead">
                <div>
                  <h2>Årsoversikt</h2>
                  <p>Utførelser og poeng samlet gjennom året.</p>
                </div>
                <label>
                  År{" "}
                  <input
                    aria-label="Velg år"
                    className="year"
                    type="number"
                    min="2020"
                    max="2100"
                    value={year}
                    onChange={(e) => setYear(e.target.value)}
                  />
                </label>
              </div>
              {cards(annual)}
              <div className="historygrid">
                <section className="panel">
                  <h3>Oppgaver i {year}</h3>
                          {data.tasks.filter((t) => !isPersonalTask(t)).map((t) => (
                    <div className="annualrow" key={t.id}>
                      <span>
                        {taskName(t)}
                        <small>
                          Sist:{" "}
                          {entries.find((e) => e.task === t.id)
                            ? dateLabel(
                                entries.find((e) => e.task === t.id)!.date,
                              )
                            : "aldri registrert"}
                        </small>
                      </span>
                      <b>
                        {annual.filter((e) => e.task === t.id).length}
                        <small>ganger</small>
                      </b>
                    </div>
                  ))}
                </section>
                <section className="panel">
                  <h3>Registreringer · {month}</h3>
                  <p>Feil trykk? Fjern enkeltregistreringen her.</p>
                  {!monthly.length && (
                    <p className="empty">
                      Ingen oppgaver registrert denne måneden.
                    </p>
                  )}
                  {monthly.map((e) => (
                    <div className="entry" key={e.id}>
                      <div>
                        <strong>{people[e.person]}</strong> ·{" "}
                        {data.tasks.find((t) => t.id === e.task)
                          ? taskName(data.tasks.find((t) => t.id === e.task)!)
                          : "Oppgave"}
                        <small>
                          {dateLabel(e.date)} · {fmt(e.points)} poeng
                        </small>
                      </div>
                      <button
                        className="textbutton"
                        disabled={deleting.includes(e.id)}
                        onClick={() => setDeleteTarget(e)}
                      >
                        {deleting.includes(e.id) ? "Sletter …" : "Slett"}
                      </button>
                    </div>
                  ))}
                </section>
              </div>
              <section className="private-history panel">
                <h2>Personoppgaver · egen oversikt</h2>
                <p>Oppgaver med begrenset deltakerliste holdes utenfor felles poengsummer og månedsmål.</p>
                <h3>{month}</h3>
                {personalCards(personalMonthly)}
                <div className="private-history-entries">
                  {!personalMonthly.length && <p className="empty">Ingen personoppgaver registrert denne måneden.</p>}
                  {personalMonthly.map((entry) => (
                    <div className="entry" key={entry.id}>
                      <div><strong>{people[entry.person]}</strong> · {data.tasks.find((task) => task.id === entry.task) ? taskName(data.tasks.find((task) => task.id === entry.task)!) : "Oppgave"}<small>{dateLabel(entry.date)} · {fmt(entry.points)} poeng</small></div>
                      <button className="textbutton" disabled={deleting.includes(entry.id)} onClick={() => setDeleteTarget(entry)}>{deleting.includes(entry.id) ? "Sletter …" : "Slett"}</button>
                    </div>
                  ))}
                </div>
                <div className="private-year-heading">
                  <h3>Året {year} · {selectedPersonalAnnual.length} utførelser</h3>
                  <label>
                    Oppgaver{" "}
                    <select
                      aria-label="Velg private oppgaver i årsoversikten"
                      value={activePrivateYearTag}
                      onChange={(event) => setPrivateYearTag(event.target.value)}
                    >
                      <option value="all">Alle personoppgaver</option>
                      {privateYearTags.map((tag) => (
                        <option key={tag.id} value={tag.id}>{tag.name}</option>
                      ))}
                    </select>
                  </label>
                </div>
                <p>Poeng og utførelser for valget over. Dette påvirker ikke kollektivet sine poengsummer eller mål.</p>
                {privateAnnualPeople.length ? (
                  personalCards(selectedPersonalAnnual, privateAnnualPeople)
                ) : (
                  <p className="empty">Ingen personer er valgt for disse oppgavene.</p>
                )}
              </section>
            </TabsContent>
            <TabsContent value="absence">
              <h2>Når er du bortreist?</h2>
              <p className="muted">
                Fra- og til-dato teller med. Fraværet justerer forventet
                innsats, mens opptjente poeng beholdes.
              </p>
              <div className="historygrid">
                <section className="panel">
                  <h3>Legg inn fravær</h3>
                  <form
                    className="absence-form"
                    onSubmit={async (e) => {
                      e.preventDefault();
                      if (savingAbsence) return;
                      setSavingAbsence(true);
                      try {
                        await mutate({
                          action: "absence",
                          id: crypto.randomUUID(),
                          person: Number(absencePerson),
                          start: absenceStart,
                          end: absenceEnd,
                          dogsAway,
                        });
                        toast.success("Fravær lagret");
                      } catch (err: any) {
                        toast.error(err.message);
                      } finally {
                        setSavingAbsence(false);
                      }
                    }}
                  >
                    <label>
                      Person
                      <Select
                        value={absencePerson}
                        onValueChange={setAbsencePerson}
                      >
                        <SelectTrigger aria-label="Person">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {people.map((p, i) => (
                            <SelectItem key={p} value={String(i)}>
                              {p}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </label>
                    <label>
                      Fra og med
                      <input
                        aria-label="Fra og med"
                        type="date"
                        required
                        value={absenceStart}
                        onChange={(e) => setAbsenceStart(e.target.value)}
                      />
                    </label>
                    <label>
                      Til og med
                      <input
                        aria-label="Til og med"
                        type="date"
                        required
                        min={absenceStart}
                        value={absenceEnd}
                        onChange={(e) => setAbsenceEnd(e.target.value)}
                      />
                    </label>
                    {Number(absencePerson) < 2 && (
                      <label className="checklabel">
                        <Checkbox
                          checked={dogsAway}
                          onCheckedChange={(v) => setDogsAway(v === true)}
                        />
                        Hundene er også borte
                      </label>
                    )}
                    <button
                      className="primary"
                      disabled={savingAbsence}
                      type="submit"
                    >
                      {savingAbsence ? "Lagrer …" : "Lagre fravær"}
                    </button>
                  </form>
                  <p>
                    Ingen grunnandel på bortreisedagene. Hvis hundene blir
                    hjemme, beholdes bare hundetillegget for gulv, støvsuging og
                    robotstell. Er alle og hundene borte, fordeles ingen
                    forventet innsats på dem.
                  </p>
                </section>
                <section className="panel">
                  <h3>Registrert fravær</h3>
                  {!data.absences.length && <p>Ingen fravær registrert.</p>}
                  {data.absences.map((a) => (
                    <div className="entry" key={a.id}>
                      <div>
                        <strong>{people[a.person]}</strong>
                        <small>
                          {dateLabel(a.start)} – {dateLabel(a.end)}
                        </small>
                        {a.person < 2 && (
                          <small>
                            {a.dogs_away
                              ? "Hundene er også borte"
                              : "Hundene er hjemme"}
                          </small>
                        )}
                      </div>
                      <button
                        className="textbutton"
                        onClick={() =>
                          action(
                            { action: "removeAbsence", id: a.id },
                            "Fravær fjernet",
                          )
                        }
                      >
                        Fjern
                      </button>
                    </div>
                  ))}
                </section>
              </div>
            </TabsContent>
            <TabsContent value="settings">
              <h2>Poeng og fordeling</h2>
              <p className="muted">
                Forslag dere kan justere sammen. Poeng måler innsats, ikke
                nøyaktige minutter.
              </p>
              <div className="historygrid">
                <section className="panel">
                  <h3>Forventet andel · {month}</h3>
                  <p>
                    Hjemmefaktor 1 betyr vanlig tilstedeværelse. Vegard er
                    foreløpig satt til 0,5. Hundetillegget gjelder oppgaver
                    merket med hundehold.
                  </p>
                  {people.map((p, i) => (
                    <div className="settingrow" key={p}>
                      <strong>{p}</strong>
                      <label>
                        Hjemmefaktor
                        <input
                          type="number"
                          min="0"
                          max="10"
                          step="0.1"
                          value={draft.presence[i]}
                          onChange={(e) =>
                            setDraft({
                              ...draft,
                              presence: draft.presence.map((v, j) =>
                                j === i ? Number(e.target.value) : v,
                              ),
                            })
                          }
                        />
                      </label>
                      <label>
                        Hunder
                        <input
                          type="number"
                          min="0"
                          max="10"
                          value={draft.dogs[i]}
                          onChange={(e) =>
                            setDraft({
                              ...draft,
                              dogs: draft.dogs.map((v, j) =>
                                j === i ? Number(e.target.value) : v,
                              ),
                            })
                          }
                        />
                      </label>
                    </div>
                  ))}
                  <label className="dogextra">
                    Tillegg per hund{" "}
                    <input
                      type="number"
                      min="0"
                      max="10"
                      step="0.1"
                      value={draft.dogExtra}
                      onChange={(e) =>
                        setDraft({ ...draft, dogExtra: Number(e.target.value) })
                      }
                    />
                  </label>
                  <button
                    className="primary"
                    onClick={async () => {
                      try {
                        await mutate({
                          action: "settings",
                          month,
                          value: draft,
                        });
                        toast.success("Fordeling lagret for " + month);
                      } catch (e: any) {
                        toast.error(e.message);
                      }
                    }}
                  >
                    Lagre for denne måneden
                  </button>
                  <p>
                    Måneder uten egne innstillinger bruker standardforslaget.
                    Andelen regnes av poengene dere faktisk har utført, og er
                    ikke en fast kvote.
                  </p>
                  <h3>Grunnfordeling før datert fravær</h3>
                  {people.map((p, i) => (
                    <p key={p}>
                      {p}: {fmt(shares(settings, 0)[i] * 100)} % vanlig arbeid ·{" "}
                      {fmt(shares(settings, 1)[i] * 100)} % hundepåvirket arbeid
                    </p>
                  ))}
                </section>
                <section className="panel">
                  <h3>Fellesoppgaver og poeng</h3>
                  <p>
                    Kryss av for oppgavene dere deler. Private klær og rydding
                    på eget rom teller ikke. Vaskeposten gjelder bare felles
                    kluter, håndduker og mopper. 1–2 poeng: liten jobb · 3–5:
                    middels · 6–10: større jobb. Endringer gjelder nye
                    registreringer. Gamle beholder sine poeng.
                  </p>
                  {data.tasks.filter((t) => !isPersonalTask(t)).map((t) => (
                    <div className="weightrow" key={t.id}>
                      <label className="checklabel" htmlFor={"active" + t.id}>
                        <Checkbox
                          id={"active" + t.id}
                          checked={!!t.active}
                          onCheckedChange={(v) =>
                            action(
                              {
                                action: "active",
                                task: t.id,
                                active: v === true,
                              },
                              v ? "Oppgave lagt til" : "Oppgave skjult",
                            )
                          }
                        />
                        <span>
                          {taskName(t)}
                          {t.id >= 30 && (
                            <small className="suggestion">
                              Forslag · {t.frequency.toLowerCase()}
                            </small>
                          )}
                        </span>
                      </label>
                      <select
                        aria-label={`Hyppighet for ${taskName(t)}`}
                        value={t.frequency}
                        onChange={(e) =>
                          action(
                            {
                              action: "frequency",
                              task: t.id,
                              frequency: e.target.value,
                            },
                            "Hyppighet oppdatert",
                          )
                        }
                      >
                        {groups.map((frequency) => (
                          <option key={frequency} value={frequency}>
                            {frequency === "Kvartal" ? "Kvartalsvis" : frequency}
                          </option>
                        ))}
                      </select>
                      <input
                        key={t.id + "-" + t.points}
                        id={"points" + t.id}
                        aria-label={"Poeng for " + taskName(t)}
                        type="number"
                        min="0.5"
                        max="100"
                        step="0.5"
                        defaultValue={t.points}
                        onBlur={async (e) => {
                          const input = e.currentTarget,
                            value = Number(input.value);
                          if (value !== t.points) {
                            try {
                              await mutate({
                                action: "points",
                                task: t.id,
                                points: value,
                              });
                              toast.success("Poeng oppdatert");
                            } catch (err: any) {
                              toast.error(err.message);
                              input.value = String(t.points);
                            }
                          }
                        }}
                      />
                    </div>
                  ))}
                </section>
              </div>
            </TabsContent>
            <TabsContent value="developer">
              <h2>Utvikler</h2>
              <p className="muted">
                Endringene lagres for hele kollektivet og vises for alle som
                bruker lenken.
              </p>
              <div className="developer-layout">
                <section className="panel">
                  <h3>Egne filtre / tagger</h3>
                  <p>Tagger brukes bare til å sortere oppgaver. Oppgaver for utvalgte personer vises når en av dem velges. Tagger gir ikke tilgangsbeskyttelse.</p>
                  <form className="tag-create-form" onSubmit={createTag}>
                    <label>Navn på filter<input required maxLength={40} value={newTagName} onChange={(event) => setNewTagName(event.target.value)} placeholder="For eksempel Inger og kjæresten" /></label>
                    <button className="primary" type="submit" disabled={creatingTag}>{creatingTag ? "Lagrer …" : "Opprett filter"}</button>
                  </form>
                  <div className="tag-list">
                    {!data.customTags.length && <p className="empty">Ingen egne filtre ennå.</p>}
                    {data.customTags.map((tag) => <span className="tag-chip" key={tag.id}>{tag.name}<button type="button" className="tag-delete" aria-label={`Slett filteret ${tag.name}`} title="Slett filter" onClick={() => void deleteTag(tag)}>×</button></span>)}
                  </div>
                </section>
                <section className="panel">
                  <h3>Farger for personer</h3>
                  <p>Velg en av de sju fargene for hver person.</p>
                  {people.map((person, index) => (
                    <div className="developer-color-row" key={person}>
                      <strong>{person}</strong>
                      <div
                        className="color-options"
                        role="group"
                        aria-label={`Velg farge for ${person}`}
                      >
                        {personColorOptions.map((color) => {
                          const selected = data.colors[index] === color.value;
                          return (
                            <button
                              key={color.value}
                              type="button"
                              className={
                                "color-choice" + (selected ? " selected" : "")
                              }
                              style={{ backgroundColor: color.value }}
                              aria-label={`${color.name}${selected ? ", valgt" : ""}`}
                              aria-pressed={selected}
                              title={color.name}
                              onClick={() =>
                                void savePersonColor(index, color.value)
                              }
                            >
                              {selected ? "✓" : ""}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </section>
                <section className="panel">
                  <h3>Opprett ny oppgave</h3>
                  <form className="create-task-form" onSubmit={createTask}>
                    <label>Navn<input required maxLength={100} value={newTaskName} onChange={(event) => setNewTaskName(event.target.value)} /></label>
                    <div className="create-task-grid">
                      <label>Hyppighet<select value={newTaskFrequency} onChange={(event) => setNewTaskFrequency(event.target.value)}>{groups.map((frequency) => <option key={frequency} value={frequency}>{frequency}</option>)}</select></label>
                      <label>Poeng<input type="number" min="0.5" max="100" step="0.5" value={newTaskPoints} onChange={(event) => setNewTaskPoints(event.target.value)} /></label>
                      <label>Filter/tag<select value={newTaskTag} onChange={(event) => setNewTaskTag(event.target.value)}><option value="">Uten tagg</option>{data.customTags.map((tag) => <option key={tag.id} value={tag.id}>{tag.name}</option>)}</select></label>
                    </div>
                    <fieldset><legend>Hvem kan registrere oppgaven?</legend><button type="button" className="textbutton" aria-pressed={newTaskParticipants === "all"} onClick={() => setNewTaskParticipants("all")}>Alle</button>{people.map((person, index) => <label className="checklabel" key={person}><Checkbox checked={allowedPeople(newTaskParticipants).includes(index)} onCheckedChange={(checked) => setNewTaskParticipants((current) => normalizePeople(checked ? [...new Set([...allowedPeople(current), index])] : allowedPeople(current).filter((item) => item !== index)))} />{person}</label>)}</fieldset>
                    <label>Beskrivelse<textarea maxLength={2000} value={newTaskDescription} onChange={(event) => setNewTaskDescription(event.target.value)} placeholder="Hva skal gjøres?" /></label>
                    <label>Underoppgaver, én per linje<textarea maxLength={2400} value={newTaskSubtasks} onChange={(event) => setNewTaskSubtasks(event.target.value)} placeholder="For eksempel: Ta av sengetøy\nLegg på rent sengetøy" /></label>
                    <button className="primary" type="submit" disabled={creatingTask}>{creatingTask ? "Lagrer …" : "Opprett oppgave"}</button>
                  </form>
                </section>
                <section className="panel">
                  <div className="developer-task-heading">
                    <h3>Rediger oppgaver</h3>
                    {data.customTags.length > 0 && (
                      <div className="task-filters developer-tag-filters" role="group" aria-label="Filtrer oppgaver etter tagg">
                        <button type="button" aria-pressed={activeDeveloperTagFilter === "all"} onClick={() => setDeveloperTagFilter("all")}>Alle oppgaver</button>
                        <button type="button" aria-pressed={activeDeveloperTagFilter === "__untagged__"} onClick={() => setDeveloperTagFilter("__untagged__")}>Uten tagg</button>
                        {data.customTags.map((tag) => (
                          <button key={tag.id} type="button" aria-pressed={activeDeveloperTagFilter === tag.id} onClick={() => setDeveloperTagFilter(tag.id)}>{tag.name}</button>
                        ))}
                      </div>
                    )}
                  </div>
                  <p>Her endrer du navn, hyppighet, poeng, filter og hvem som kan registrere.</p>
                  <label className="developer-frequency-filter">
                    Vis oppgaver med hyppighet
                    <select
                      aria-label="Filtrer rediger oppgaver etter hyppighet"
                      value={activeDeveloperFrequencyFilter}
                      onChange={(event) => setDeveloperFrequencyFilter(event.target.value)}
                    >
                      <option value="all">Alle hyppigheter</option>
                      {groups.map((frequency) => (
                        <option key={frequency} value={frequency}>{frequency}</option>
                      ))}
                    </select>
                  </label>
                  <p className="muted">Viser {developerTasks.length} oppgaver.</p>
                  <div className="developer-task-list">
                    {developerTasks.map((task) => (
                      <div className="developer-task-edit" key={task.id}>
                        <label className="developer-task-row">
                          <span>{taskName(task)}</span>
                          <input
                            key={`${task.id}-${task.name}`}
                            type="text"
                            maxLength={100}
                            aria-label={`Oppgavenavn for ${taskName(task)}`}
                            defaultValue={taskName(task)}
                            onKeyDown={(event) => { if (event.key === "Enter") event.currentTarget.blur(); }}
                            onBlur={async (event) => {
                              const input = event.currentTarget, name = input.value.trim();
                              if (!name) { input.value = taskName(task); toast.error("Oppgavenavnet kan ikke være tomt."); return; }
                              if (name === taskName(task)) return;
                              try { await mutate({ action: "name", task: task.id, name }); toast.success("Oppgavenavnet er lagret"); }
                              catch (error: any) { toast.error(error.message); input.value = taskName(task); }
                            }}
                          />
                        </label>
                        {(() => {
                          const saved = data.taskMeta[String(task.id)] ?? { description: "", subtasks: [], tagId: "", participants: "all" as const };
                          const meta = metaDrafts[String(task.id)] ?? saved;
                          const update = (changes: Partial<TaskMeta>) => setMetaDrafts((current) => ({ ...current, [String(task.id)]: { ...meta, ...changes } }));
                          return <label className="developer-task-tag">
                            <span>Tagg</span>
                            <select
                              aria-label={`Tagg for ${taskName(task)}`}
                              value={meta.tagId}
                              onChange={(event) => {
                                const tagId = event.target.value;
                                update({ tagId });
                                void saveTaskMeta(task, { ...meta, tagId });
                              }}
                            >
                              <option value="">Uten tagg</option>
                              {data.customTags.map((tag) => <option key={tag.id} value={tag.id}>{tag.name}</option>)}
                            </select>
                          </label>;
                        })()}
                        <details className="task-meta-editor">
                            <summary>Hyppighet, poeng og detaljer</summary>
                          {(() => {
                            const saved = data.taskMeta[String(task.id)] ?? { description: "", subtasks: [], tagId: "", participants: "all" as const };
                            const meta = metaDrafts[String(task.id)] ?? saved;
                            const update = (changes: Partial<TaskMeta>) => setMetaDrafts((current) => ({ ...current, [String(task.id)]: { ...meta, ...changes } }));
                            return <div className="task-meta-fields">
                              <label>Hyppighet<select value={task.frequency} onChange={(event) => void action({ action: "frequency", task: task.id, frequency: event.target.value }, "Hyppighet oppdatert")}>{groups.map((frequency) => <option key={frequency} value={frequency}>{frequency === "Kvartal" ? "Kvartalsvis" : frequency}</option>)}</select></label>
                              <label>Poeng<input key={`${task.id}-dev-points-${task.points}`} aria-label={`Poeng for ${taskName(task)}`} type="number" min="0.5" max="100" step="0.5" defaultValue={task.points} onBlur={async (event) => { const input = event.currentTarget; const value = Number(input.value); if (!Number.isFinite(value) || value < 0.5 || value > 100) { input.value = String(task.points); toast.error("Poeng må være mellom 0,5 og 100."); return; } if (value === task.points) return; try { await mutate({ action: "points", task: task.id, points: value }); toast.success("Poeng oppdatert"); } catch (error: any) { input.value = String(task.points); toast.error(error.message); } }} /></label>
                              <label>Beskrivelse<textarea maxLength={2000} value={meta.description} onChange={(event) => update({ description: event.target.value })} /></label>
                              <label>Underoppgaver, én per linje<textarea maxLength={2400} value={meta.subtasks.join("\n")} onChange={(event) => update({ subtasks: event.target.value.split("\n").slice(0, 20) })} /></label>
                              <fieldset><legend>Hvem kan registrere?</legend><button type="button" className="textbutton" aria-pressed={meta.participants === "all" || people.every((_, i) => allowedPeople(meta.participants).includes(i))} onClick={() => update({ participants: "all" })}>Alle</button>{people.map((person, index) => <label className="checklabel" key={person}><Checkbox checked={allowedPeople(meta.participants).includes(index)} onCheckedChange={(checked) => update({ participants: normalizePeople(checked ? [...new Set([...allowedPeople(meta.participants), index])] : allowedPeople(meta.participants).filter((item) => item !== index)) })} />{person}</label>)}</fieldset>
                              <button type="button" className="primary" onClick={() => void saveTaskMeta(task, meta)}>Lagre oppgavedetaljer</button>
                            </div>;
                          })()}
                        </details>
                      </div>
                    ))}
                  </div>
                </section>
              </div>
            </TabsContent>
          </>
        )}
      </Tabs>
      <footer>
        Felles oversikt · automatisk lagring · dato etter norsk tid
      </footer>
    </main>
  );
}

export default function Home() {
  const [me, setMe] = useState<number | null>(null),
    [checked, setChecked] = useState(false),
    [username, setUsername] = useState(""),
    [password, setPassword] = useState(""),
    [loginError, setLoginError] = useState("");
  useEffect(() => {
    fetch("/api/auth", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => setMe(d?.user?.person ?? null))
      .catch(() => {})
      .finally(() => setChecked(true));
  }, []);
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoginError("");
    const r = await fetch("/api/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "login", username, password }),
    });
    const d: any = await r.json().catch(() => ({}));
    if (r.ok) {
      setPassword("");
      setMe(d.user.person);
    } else setLoginError(d.error ?? "Kunne ikke logge inn.");
  }
  async function logout() {
    await fetch("/api/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "logout" }),
    }).catch(() => {});
    setMe(null);
  }
  if (!checked) return null;
  if (me === null)
    return (
      <main>
        <form onSubmit={submit} style={{ maxWidth: 320, margin: "4rem auto", display: "grid", gap: 12 }}>
          <h1>Logg inn</h1>
          <label>Brukernavn<input value={username} onChange={(e) => setUsername(e.target.value)} autoComplete="username" required style={{ display: "block", width: "100%" }} /></label>
          <label>Passord<input type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" required style={{ display: "block", width: "100%" }} /></label>
          {loginError && <p role="alert">{loginError}</p>}
          <button type="submit">Logg inn</button>
        </form>
      </main>
    );
  return <Tasks key={me} me={me} onLogout={logout} />;
}
