export const people = ["Inger", "Lisa", "Leander", "Vegard"];
export const personColorOptions = [
  { name: "Blå", value: "#14628c" },
  { name: "Brun", value: "#85502a" },
  { name: "Lilla", value: "#65459b" },
  { name: "Grønn", value: "#256c52" },
  { name: "Rød", value: "#c24343" },
  { name: "Oransje", value: "#b65d10" },
  { name: "Grå", value: "#5a6475" },
] as const;
export const defaultPersonColors = personColorOptions
  .slice(0, 4)
  .map((color) => color.value);
export const defaults = {
  presence: [1, 1, 1, 0.5],
  dogs: [1, 2, 0, 0],
  dogExtra: 0.5,
};
export const groups = [
  "Daglig",
  "Ukentlig",
  "Månedlig",
  "Kvartal",
  "Årlig",
  "Ved behov",
];
export const seed = [
  ["Ta inn / ut oppvaskmaskin", 0, 1, 0],
  ["Lage middag", 0, 5, 0],
  ["Rydde etter middag", 0, 3, 0],
  ["Tømme robotstøvsugere", 0, 1, 1],
  ["Bytte mopper og vann i Herman", 0, 2, 1],
  ["Vaske over bord / kjøkkenbenk", 0, 1, 0],
  ["Støvsuge trapper", 1, 3, 1],
  ["Støvsuge bad", 1, 2, 1],
  ["Tørke støv der robot ikke kommer til", 1, 3, 0],
  ["Vaske flekker på kjøkken", 1, 2, 0],
  ["Klippe plen / måke snø", 1, 8, 0],
  ["Vaske do, servant og dusjvegger", 1, 5, 0],
  ["Vaske kluter, håndduker og mopper", 1, 3, 1],
  ["Vaske over bord, benker og sjenker", 1, 3, 0],
  ["Vaske golv", 2, 6, 1],
  ["Vaske trapp", 2, 4, 1],
  ["Vaske flekker i gang", 2, 2, 1],
  ["Vaske håndløper i trapp", 2, 1, 0],
  ["Vaske mikro", 2, 2, 0],
  ["Støvsuge sofa", 2, 3, 1],
  ["Luke gårdsplass", 2, 6, 0],
  ["Rense Herman", 2, 4, 1],
  ["Vaske stekeovn", 3, 8, 0],
  ["Skure golv", 3, 10, 1],
  ["Skure dusjvegger", 3, 6, 0],
  ["Male lister / flikke / tette hakk", 3, 8, 0],
  ["Vaske vinduer / speil", 3, 8, 0],
  ["Vaske sofatrekk", 3, 5, 0],
  ["Vaske kjøkkenskuffer", 3, 6, 0],
].map((r, i) => ({
  id: i + 1,
  name: r[0] as string,
  frequency: groups[r[1] as number],
  points: r[2] as number,
  dog: r[3] as number,
}));
export function today() {
  return new Intl.DateTimeFormat("sv-SE", {
    timeZone: "Europe/Oslo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}
export function shares(s: typeof defaults, dog: number) {
  const w = s.presence.map((v, i) => v + (dog ? s.dogs[i] * s.dogExtra : 0));
  return w.map((v) => v / w.reduce((a, b) => a + b, 0));
}
export const suggestions = [
  ["Tømme søppel og sortere avfall", "Ukentlig", 2],
  ["Sette ut og hente søppeldunker", "Ukentlig", 2],
  ["Vaske felles kjøleskap", "Månedlig", 5],
  ["Rengjøre filter i kjøkkenvifte", "Kvartal", 5],
  ["Rense filter i oppvaskmaskin", "Månedlig", 2],
  ["Rense sluk på felles bad", "Månedlig", 3],
  ["Vaske dørhåndtak og lysbrytere", "Ukentlig", 2],
  ["Fylle på felles såpe og toalettpapir", "Ukentlig", 1],
].map((r, i) => ({
  id: 30 + i,
  name: r[0] as string,
  frequency: r[1] as string,
  points: r[2] as number,
  dog: 0,
}));
export type Absence = {
  id: string;
  person: number;
  start: string;
  end: string;
  dogs_away: number;
};
export function validDate(d: unknown): d is string {
  return (
    typeof d === "string" &&
    /^\d{4}-\d{2}-\d{2}$/.test(d) &&
    Number.isFinite(Date.parse(d)) &&
    new Date(d).toISOString().slice(0, 10) === d
  );
}
export function sharesOnDate(
  s: typeof defaults,
  dog: number,
  date: string,
  absences: Absence[],
) {
  const w = s.presence.map((v, i) => {
    const away = absences.filter(
      (a) => a.person === i && a.start <= date && a.end >= date,
    );
    return (
      (away.length ? 0 : v) +
      (dog && !away.some((a) => a.dogs_away) ? s.dogs[i] * s.dogExtra : 0)
    );
  });
  const total = w.reduce((a, b) => a + b, 0);
  return w.map((v) => (total ? v / total : 0));
}
export function weeklyTaskFrequency(frequency: string) {
  if (frequency === "Daglig") return 7;
  if (frequency === "Ukentlig") return 1;
  if (frequency === "Månedlig") return 12 / 52;
  if (frequency === "Kvartal") return 4 / 52;
  if (frequency === "Årlig") return 1 / 52;
  return 0;
}
export function householdPresenceFactor(
  s: typeof defaults,
  dog: number,
  date: string,
  absences: Absence[],
) {
  const awayOnDate = absences.filter(
    (a) => a.start <= date && a.end >= date,
  );
  const peopleHome = s.presence.reduce(
    (sum, weight, person) =>
      sum + (awayOnDate.some((a) => a.person === person) ? 0 : weight),
    0,
  );
  const peopleTotal = s.presence.reduce((sum, weight) => sum + weight, 0);
  if (!dog) return peopleTotal ? peopleHome / peopleTotal : 0;

  const dogsHome = s.dogs.reduce(
    (sum, count, person) =>
      sum +
      (awayOnDate.some((a) => a.person === person && a.dogs_away) ? 0 : count),
    0,
  );
  const dogsTotal = s.dogs.reduce((sum, count) => sum + count, 0);
  const total = peopleTotal + dogsTotal * s.dogExtra;
  return total
    ? (peopleHome + dogsHome * s.dogExtra) / total
    : 0;
}
export function isoWeekValue(date: string) {
  const day = new Date(`${date}T12:00:00Z`);
  day.setUTCDate(day.getUTCDate() + 4 - ((day.getUTCDay() + 6) % 7));
  const year = day.getUTCFullYear();
  const firstThursday = new Date(Date.UTC(year, 0, 4));
  firstThursday.setUTCDate(
    firstThursday.getUTCDate() + 4 - ((firstThursday.getUTCDay() + 6) % 7),
  );
  const week = 1 + Math.round((day.getTime() - firstThursday.getTime()) / 604800000);
  return `${year}-W${String(week).padStart(2, "0")}`;
}
export function isoWeekRange(value: string) {
  const match = /^(\d{4})-W(\d{2})$/.exec(value);
  if (!match) return null;
  const year = Number(match[1]);
  const week = Number(match[2]);
  if (week < 1 || week > 53) return null;
  const jan4 = new Date(Date.UTC(year, 0, 4));
  const monday = new Date(jan4);
  monday.setUTCDate(jan4.getUTCDate() - ((jan4.getUTCDay() + 6) % 7) + (week - 1) * 7);
  const start = monday.toISOString().slice(0, 10);
  const sunday = new Date(monday);
  sunday.setUTCDate(sunday.getUTCDate() + 6);
  return { start, end: sunday.toISOString().slice(0, 10) };
}
export function personGoalsForPeriod(
  tasks: { points: number; frequency: string; dog: number; participants?: number[] }[],
  settings: Record<string, typeof defaults>,
  absences: Absence[],
  start: string,
  end: string,
) {
  const goals = people.map(() => 0);
  const date = new Date(`${start}T12:00:00Z`);
  const lastDate = new Date(`${end}T12:00:00Z`);

  for (; date <= lastDate; date.setUTCDate(date.getUTCDate() + 1)) {
    const dateString = date.toISOString().slice(0, 10);
    const monthSettings = settings[dateString.slice(0, 7)] ?? defaults;

    for (const task of tasks) {
      const dailyPoints = (task.points * weeklyTaskFrequency(task.frequency)) / 7;
      if (!dailyPoints) continue;

      const householdPoints =
        dailyPoints * householdPresenceFactor(monthSettings, task.dog, dateString, absences);
      const personShares = sharesOnDate(monthSettings, task.dog, dateString, absences);
      const allowed = task.participants ?? people.map((_, person) => person);
      const eligibleTotal = personShares.reduce(
        (sum, share, person) => sum + (allowed.includes(person) ? share : 0),
        0,
      );
      personShares.forEach((share, person) => {
        if (!allowed.includes(person) || !eligibleTotal) return;
        goals[person] += householdPoints * (share / eligibleTotal);
      });
    }
  }

  return goals;
}
export function monthlyPersonGoals(
  tasks: { points: number; frequency: string; dog: number; participants?: number[] }[],
  settings: Record<string, typeof defaults>,
  absences: Absence[],
  month: string,
) {
  const [year, monthNumber] = month.split("-").map(Number);
  const daysInMonth = new Date(Date.UTC(year, monthNumber, 0)).getUTCDate();
  return personGoalsForPeriod(
    tasks,
    settings,
    absences,
    `${month}-01`,
    `${month}-${String(daysInMonth).padStart(2, "0")}`,
  );
}
export function periodStart(frequency: string, date: string) {
  const d = new Date(date + "T12:00:00Z");
  if (frequency === "Daglig") return date;
  if (frequency === "Årlig") return date.slice(0, 4) + "-01-01";
  if (frequency === "Ukentlig") {
    d.setUTCDate(d.getUTCDate() - ((d.getUTCDay() + 6) % 7));
    return d.toISOString().slice(0, 10);
  }
  if (frequency === "Månedlig" || frequency === "Ved behov")
    return date.slice(0, 7) + "-01";
  return (
    date.slice(0, 4) +
    "-" +
    String(Math.floor(d.getUTCMonth() / 3) * 3 + 1).padStart(2, "0") +
    "-01"
  );
}
export function taskName(t: { id: number; name: string }) {
  const legacyNames: Record<number, [string, string]> = {
    2: ["Lage middag", "Lage felles middag"],
    3: ["Rydde etter middag", "Rydde etter felles middag"],
    13: [
      "Vaske kluter, håndduker og mopper",
      "Vaske felles kluter, håndduker og robotmopper",
    ],
  };
  const legacy = legacyNames[t.id];
  return legacy && t.name === legacy[0] ? legacy[1] : t.name;
}
