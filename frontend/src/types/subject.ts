export interface SubjectPaper {
  id: string;
  name: string; // e.g., "Paper 1"
  isCompulsory: boolean;
}

export interface Subject {
  id: string;
  name: string;
  code: string; // Short code / abbreviation (e.g., ENG, MATH)
  standardCode: string; // Official examination standard code (e.g., 112, 456)
  educationLevel: "UCE" | "UACE";
  optional: boolean;
  papers: SubjectPaper[];
  minPapers?: number; // Minimum papers a student must pick
  maxPapers?: number; // Maximum papers a student can pick
}

// Standard WAKISSHA Subject Codes
export const STANDARD_SUBJECT_CODES: Record<string, string> = {
  ENG: "112",
  LIT: "208",
  KISWA: "336",
  CRE: "223",
  IRE: "225",
  HIST: "241",
  GEOG: "273",
  FRENCH: "314",
  GERMAN: "309",
  ARABIC: "337",
  LUGANDA: "335",
  RUNY: "345",
  LUSOGA: "355",
  MATH: "456",
  AGRIC: "527",
  PHY: "535",
  CHEM: "545",
  BIO: "553",
  ART: "612",
  FN: "662",
  TD: "745",
  CPS: "840",
  ENT: "845",
  GP: "101",
  SUB_MATHS: "475",
  SUB_ICT: "610",
};
