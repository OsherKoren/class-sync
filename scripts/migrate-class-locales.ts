/**
 * Normalises Class.subject and Class.grade from stored translated strings
 * (Hebrew or English) back to locale-neutral keys, so the UI can translate
 * them correctly in any language.
 *
 * Dry-run by default. Pass --apply to write changes.
 *
 *   npx tsx scripts/migrate-class-locales.ts
 *   npx tsx scripts/migrate-class-locales.ts --apply
 */

import { config } from "dotenv";
config({ path: ".env.local" });
import { PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";

const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL! });
const db = new PrismaClient({ adapter });

const SUBJECT_MAP: Record<string, string> = {
  // Hebrew
  "מתמטיקה": "mathematics",
  "אנגלית": "english",
  "עברית": "hebrew",
  "מדעים": "science",
  "היסטוריה": "history",
  "ערבית": "arabic",
  'תנ"ך': "bible",
  "פיזיקה": "physics",
  "כימיה": "chemistry",
  "ביולוגיה": "biology",
  // English (in case classes were created with English active)
  Mathematics: "mathematics",
  English: "english",
  Hebrew: "hebrew",
  Science: "science",
  History: "history",
  Arabic: "arabic",
  "Bible Studies": "bible",
  Physics: "physics",
  Chemistry: "chemistry",
  Biology: "biology",
};

const GRADE_MAP: Record<string, string> = {
  // Hebrew
  "כיתה ד": "4",
  "כיתה ה": "5",
  "כיתה ו": "6",
  "כיתה ז": "7",
  "כיתה ח": "8",
  "כיתה ט": "9",
  "כיתה י": "10",
  // English
  "Grade 4": "4",
  "Grade 5": "5",
  "Grade 6": "6",
  "Grade 7": "7",
  "Grade 8": "8",
  "Grade 9": "9",
  "Grade 10": "10",
};

async function main() {
  const apply = process.argv.includes("--apply");
  const classes = await db.class.findMany({
    select: { id: true, subject: true, grade: true },
  });

  let changed = 0;

  for (const cls of classes) {
    const newSubject = SUBJECT_MAP[cls.subject] ?? cls.subject;
    const newGrade = cls.grade ? (GRADE_MAP[cls.grade] ?? cls.grade) : cls.grade;

    const subjectChanged = newSubject !== cls.subject;
    const gradeChanged = newGrade !== cls.grade;

    if (!subjectChanged && !gradeChanged) continue;

    changed++;
    console.log(`Class ${cls.id}:`);
    if (subjectChanged) console.log(`  subject: "${cls.subject}" → "${newSubject}"`);
    if (gradeChanged) console.log(`  grade:   "${cls.grade}" → "${newGrade}"`);

    if (apply) {
      await db.class.update({
        where: { id: cls.id },
        data: { subject: newSubject, grade: newGrade },
      });
    }
  }

  if (changed === 0) {
    console.log("Nothing to migrate — all classes already use locale-neutral keys.");
  } else if (!apply) {
    console.log(`\n${changed} class(es) would be updated. Re-run with --apply to write changes.`);
  } else {
    console.log(`\n${changed} class(es) updated.`);
  }
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => db.$disconnect());
