import type { Status } from "./store";

/** قائمة الاستيراد الجماعي: ألعاب مختومة قديمًا بساعات الختم العالمية + إصدارات مرتقبة */
export type RetroImportItem = {
  slug: string;
  title: string;
  /** متوسط ساعات الختم عالميًا */
  hours: number;
  status: Status;
};

export const RETRO_IMPORT: RetroImportItem[] = [
  { slug: "god-of-war-2", title: "God of War (2018)", hours: 20, status: "completed" },
  { slug: "god-of-war-ragnarok", title: "God of War Ragnarök", hours: 25, status: "completed" },
  { slug: "a-plague-tale-innocence", title: "A Plague Tale: Innocence", hours: 11, status: "completed" },
  { slug: "a-plague-tale-requiem", title: "A Plague Tale: Requiem", hours: 17, status: "completed" },
  { slug: "red-dead-redemption-2", title: "Red Dead Redemption 2", hours: 50, status: "completed" },
  { slug: "resident-evil-9-requiem", title: "Resident Evil 9: Requiem", hours: 0, status: "hype" },
  { slug: "resident-evil-4-2023", title: "Resident Evil 4 Remake", hours: 16, status: "completed" },
  { slug: "silent-hill-f", title: "Silent Hill f", hours: 0, status: "hype" },
  { slug: "ghost-of-tsushima", title: "Ghost of Tsushima", hours: 25, status: "completed" },
  { slug: "cyberpunk-2077", title: "Cyberpunk 2077", hours: 60, status: "completed" },
  { slug: "elden-ring", title: "Elden Ring + Shadow of the Erdtree", hours: 100, status: "completed" },
  { slug: "resident-evil-2-2019", title: "Resident Evil 2 (Remake)", hours: 8, status: "completed" },
  { slug: "resident-evil-3", title: "Resident Evil 3 (Remake)", hours: 6, status: "completed" },
  { slug: "resident-evil-4", title: "Resident Evil 4 (2005)", hours: 15, status: "completed" },
  { slug: "the-last-of-us-part-2", title: "The Last of Us Part II", hours: 20, status: "completed" },
  { slug: "batman-arkham-city-2", title: "Batman: Arkham City", hours: 12, status: "completed" },
  { slug: "batman-arkham-origins", title: "Batman: Arkham Origins", hours: 12, status: "completed" },
  { slug: "marvels-spider-man-2", title: "Marvel's Spider-Man 2", hours: 17, status: "completed" },
  { slug: "pragmata", title: "Pragmata", hours: 0, status: "hype" },
  { slug: "batman-arkham-knight", title: "Batman: Arkham Knight", hours: 15, status: "completed" },
  { slug: "batman-arkham-asylum", title: "Batman: Arkham Asylum", hours: 12, status: "completed" },
];
