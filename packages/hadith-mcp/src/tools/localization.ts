import type { Grade, HadithRecord, Language } from "../types.js";

const arabicCollectionNames: Record<string, string> = {
  bukhari: "صحيح البخاري",
  muslim: "صحيح مسلم",
  abu_dawud: "سنن أبي داود",
  tirmidhi: "جامع الترمذي",
  nasai: "سنن النسائي",
  ibn_majah: "سنن ابن ماجه"
};

const arabicChapterTitles: Record<string, string> = {
  "chapter: health and leisure": "الصحة والفراغ",
  "health and leisure": "الصحة والفراغ",
  "chapter: the obligation to perform the salat (prayers)": "وجوب الصلاة",
  "the obligation to perform the salat (prayers)": "وجوب الصلاة",
  "chapter: the travelers’ prayer and shortening it": "صلاة المسافرين وقصرها",
  "the travelers’ prayer and shortening it": "صلاة المسافرين وقصرها",
  "chapter: the travelers' prayer and shortening it": "صلاة المسافرين وقصرها",
  "the travelers' prayer and shortening it": "صلاة المسافرين وقصرها"
};

const arabicGradeValues: Record<string, string> = {
  sahih: "صحيح",
  "sahih in chain": "صحيح الإسناد",
  hasan: "حسن",
  "hasan sahih": "حسن صحيح",
  daif: "ضعيف",
  "da'if": "ضعيف",
  daeef: "ضعيف",
  mawdu: "موضوع",
  "mawdu'": "موضوع"
};

function stripChapterPrefix(value: string): string {
  return value.replace(/^Chapter:\s*/i, "").trim();
}

function localizeGrade(grade: Grade | null): Grade | null {
  if (grade === null) {
    return null;
  }

  const value = arabicGradeValues[grade.value.trim().toLowerCase()] ?? grade.value;

  return {
    ...grade,
    value
  };
}

function localizeTitle(value: string | null): string | null {
  if (value === null) {
    return null;
  }

  const normalized = stripChapterPrefix(value);
  const key = normalized.toLowerCase();

  return arabicChapterTitles[key] ?? null;
}

export function localizeRecordForLanguage(record: HadithRecord, language: Language): HadithRecord {
  if (language !== "arabic") {
    return record;
  }

  return {
    ...record,
    display_name: arabicCollectionNames[record.collection] ?? record.display_name,
    book: arabicCollectionNames[record.collection] ?? localizeTitle(record.book),
    chapter: localizeTitle(record.chapter),
    grade: localizeGrade(record.grade)
  };
}
