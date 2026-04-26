import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import type { Zone } from "../types/zone";
import type { Subject } from "../types/subject";

export type UserRole = "admin" | "school" | "super_admin";
export type SchoolStatus =
  | "pending"
  | "payment_submitted"
  | "verified"
  | "active";
export type EducationLevel = "UCE" | "UACE";

// Predetermined class levels - managed by super admin only
export const CLASS_LEVELS = {
  UCE: ["S.1", "S.2", "S.3", "S.4"],
  UACE: ["S.5", "S.6"],
} as const;

export const CLASS_LEVELS_ARRAY = ["S.1", "S.2", "S.3", "S.4", "S.5", "S.6"] as const;

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  schoolCode?: string;
  district?: string;
  zone?: string;
  academicYear?: string;
  status?: SchoolStatus;
  activationCode?: string;
  avatar?: string;
  schoolLogo?: string;
}

export interface SchoolRecord {
  id: string;
  name: string;
  code: string;
  email: string;
  phone: string;
  address: string;
  district: string;
  zone: string;
  zone_id: string;
  educationLevel: EducationLevel;
  academicYear: string;
  status: SchoolStatus;
  registrationDate: string;
  students: number;
  amountPaid: string;
  paymentProof: string;
  activationCode: string;
  avatar?: string;
  schoolLogo?: string;
  contactPerson?: string;
  contactDesignation?: string;
  registrationFinalized?: boolean;
  markingGuide?: "Arts" | "Sciences" | "Both" | "None";
}

export interface Invoice {
  id: string;
  serialNumber: string;
  schoolCode: string;
  date: string;
  items: {
    description: string;
    quantity: number;
    unitPrice: number;
    total: number;
    formula?: string;
  }[];
  totalAmount: number;
  status: "pending" | "paid";
  type: "original" | "additional";
  paymentProof?: string;
}

export interface StudentSubjectEntry {
  subjectId: string;
  subjectCode: string; // Short code such as ENG, MATH, GP
  subjectStandardCode?: string;
  subjectName: string;
  paper: string; // Dynamic paper name (e.g., "Paper 1", "Theory", "Practical")
  entry1: boolean;
  entry2: boolean;
  entry3: boolean;
  entry4: boolean;
}

export interface StudentRecord {
  id: string;
  registrationNumber: string; // Format: WAK/YY-SCHOOLCODE/STUDENTNO
  studentName: string;
  classLevel: "S.1" | "S.2" | "S.3" | "S.4" | "S.5" | "S.6";
  examLevel: "UCE" | "UACE";
  schoolCode: string;
  schoolName: string;
  academicYear: string;
  stream?: string; // Internal use only
  bookletsCount?: number;
  isAdditional?: boolean;
  subjects: StudentSubjectEntry[];
  totalEntries: number; // Sum of all checked entries
  registrationDate: string;
  isInvoiced?: boolean;
}

// Helper functions for student registration validation
export function mapSubjectCode(subjectCode: string) {
  const normalized = subjectCode.toUpperCase();
  const aliases: Record<string, string> = {
    ENG: "ENG",
    MTH: "MATH",
    CPS: "CPS",
    ETP: "ENT",
    ECN: "ECON",
    GEO: "GEOG",
    HIS: "HIST",
    CHM: "CHEM",
    BIO: "BIO",
    PHY: "PHY",
    GP: "GP",
    LIT: "LIT",
    CRE: "CRE",
    IRE: "IRE",
    ECO: "ECON",
    ENT: "ENT",
    MATH: "MATH",
    CHEM: "CHEM",
    PHYS: "PHY",
  };
  
  // Custom mapping for subsidiaries
  if (normalized.includes("GP") || normalized.includes("101")) return "GP";
  if (normalized.includes("SUB MATH") || normalized.includes("475")) return "SUB_MATHS";
  if (normalized.includes("SUB ICT") || normalized.includes("610")) return "SUB_ICT";
  
  return aliases[normalized] ?? normalized;
}

export function isStudentFullyRegistered(student: Pick<StudentRecord, 'subjects' | 'examLevel'>, subjects: Subject[]) {
  if (!student.subjects || student.subjects.length === 0) return false;
  
  const uniqueSubjectCodes = Array.from(new Set(student.subjects.map(s => mapSubjectCode(s.subjectCode))));
  const subjectCount = uniqueSubjectCodes.length;

  if (student.examLevel === "UCE") {
    // UCE: All compulsory subjects + total between 8-9
    const uceCompulsoryCodes = subjects
      .filter(s => s.educationLevel === "UCE" && !s.optional)
      .map(s => mapSubjectCode(s.code));
    
    const hasAllCompulsory = uceCompulsoryCodes.every(code => uniqueSubjectCodes.includes(code));
    return hasAllCompulsory && subjectCount >= 8 && subjectCount <= 9;
  } else {
    // UACE: Must have GP (101) + at least one Subsidiary (Maths/ICT)
    const hasGP = uniqueSubjectCodes.includes("GP");
    const hasSub = uniqueSubjectCodes.includes("SUB_MATHS") || uniqueSubjectCodes.includes("SUB_ICT");
    return hasGP && hasSub;
  }
}

interface NewSchoolInput {
  name: string;
  email: string;
  phone: string;
  address: string;
  educationLevel: EducationLevel;
  zone_id: string;
  schoolLogo?: string;
  contactPerson?: string;
  contactDesignation?: string;
}

interface AuthContextType {
  user: User | null;
  schools: SchoolRecord[];
  students: StudentRecord[];
  zones: Zone[];
  subjects: Subject[];
  invoices: Invoice[];
  login: (identifier: string, password: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  addSchool: (school: NewSchoolInput) => void;
  submitSchoolDocuments: (schoolCode: string) => void;
  updateSchoolStatus: (
    schoolCode: string,
    status: SchoolStatus,
    activationCode?: string,
  ) => void;
  finalizeRegistration: (schoolCode: string, markingGuide: "Arts" | "Sciences" | "Both", bookletsCount: number) => void;
  addInvoice: (invoice: Omit<Invoice, "id">, studentIds?: string[]) => void;
  uploadPaymentProof: (invoiceId: string, proofUrl: string) => void;
  addStudentEntry: (entry: {
    schoolCode: string;
    studentName: string;
    classLevel: "S.1" | "S.2" | "S.3" | "S.4" | "S.5" | "S.6";
    stream?: string;
    bookletsCount?: number;
    subjects: StudentSubjectEntry[];
    totalEntries: number;
    isAdditional?: boolean;
  }) => void;
  updateStudentEntry: (
    studentId: string,
    updates: {
      studentName: string;
      classLevel: "S.1" | "S.2" | "S.3" | "S.4" | "S.5" | "S.6";
      stream?: string;
      bookletsCount?: number;
      subjects: StudentSubjectEntry[];
      totalEntries: number;
    },
  ) => void;
  deleteStudentEntry: (studentId: string) => void;
  addSubject: (subject: {
    name: string;
    code: string;
    standardCode: string;
    educationLevel: "UCE" | "UACE";
    optional: boolean;
    papers: SubjectPaper[];
    minPapers?: number;
    maxPapers?: number;
  }) => void;
  updateSubject: (
    subjectId: string,
    updates: {
      name: string;
      code: string;
      standardCode: string;
      educationLevel: "UCE" | "UACE";
      optional: boolean;
      papers: SubjectPaper[];
      minPapers?: number;
      maxPapers?: number;
    },
  ) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const adminUser: User = {
  id: "1",
  name: "WAKISSHA Administrator",
  email: "admin@wakissha.ug",
  role: "admin",
  status: "active",
};

const initialZones: Zone[] = [
  {
    id: "zone-1",
    name: "AGGREY ZONE",
    district: "Wakiso",
    leaderName: "Mr. Robert Kasigire",
    leaderPhone: "+256 757 123 456",
    leaderEmail: "robert.kasigire@wakissha.ug",
    secretariatName: "Ms. Grace Nalweyiso",
    secretariatPhone: "+256 757 234 567",
    secretariatEmail: "grace.nalweyiso@wakissha.ug",
  },
  {
    id: "zone-2",
    name: "BULOBA ZONE",
    district: "Wakiso",
    leaderName: "Dr. Henry Musoke",
    leaderPhone: "+256 757 345 678",
    leaderEmail: "henry.musoke@wakissha.ug",
    secretariatName: "Ms. Fatuma Ahmed",
    secretariatPhone: "+256 757 456 789",
    secretariatEmail: "fatuma.ahmed@wakissha.ug",
  },
  {
    id: "zone-3",
    name: "BWEYOGERERE ZONE",
    district: "Entebbe",
    leaderName: "Prof. Sarah Nakamya",
    leaderPhone: "+256 757 567 890",
    leaderEmail: "sarah.nakamya@wakissha.ug",
    secretariatName: "Mr. Joseph Kyambadde",
    secretariatPhone: "+256 757 678 901",
    secretariatEmail: "joseph.kyambadde@wakissha.ug",
  },
  {
    id: "zone-4",
    name: "ENTEBBE ZONE",
    district: "Wakiso",
    leaderName: "Mr. Patrick Lubega",
    leaderPhone: "+256 757 789 012",
    leaderEmail: "patrick.lubega@wakissha.ug",
    secretariatName: "Ms. Sylvia Namujju",
    secretariatPhone: "+256 757 890 123",
    secretariatEmail: "sylvia.namujju@wakissha.ug",
  },
  {
    id: "zone-5",
    name: "KITENDE ZONE",
    district: "Mukono",
    leaderName: "Mr. David Otim",
    leaderPhone: "+256 757 901 234",
    leaderEmail: "david.otim@wakissha.ug",
    secretariatName: "Ms. Rosemary Kiwanuka",
    secretariatPhone: "+256 757 012 345",
    secretariatEmail: "rosemary.kiwanuka@wakissha.ug",
  },
  {
    id: "zone-6",
    name: "MATUGGA ZONE",
    district: "Jinja",
    leaderName: "Mr. Edgar Kamya",
    leaderPhone: "+256 758 112 233",
    leaderEmail: "edgar.kamya@wakissha.ug",
    secretariatName: "Ms. Christine Nabulya",
    secretariatPhone: "+256 758 223 334",
    secretariatEmail: "christine.nabulya@wakissha.ug",
  },
  {
    id: "zone-7",
    name: "NADDANGIRA ZONE",
    district: "Wakiso",
    leaderName: "Mr. Julius Mugyenyi",
    leaderPhone: "+256 758 334 445",
    leaderEmail: "julius.mugyenyi@wakissha.ug",
    secretariatName: "Ms. Hilda Kamugyisha",
    secretariatPhone: "+256 758 445 556",
    secretariatEmail: "hilda.kamugyisha@wakissha.ug",
  },
  {
    id: "zone-8",
    name: "NANSANA ZONE",
    district: "Wakiso",
    leaderName: "Mr. Amos Bazira",
    leaderPhone: "+256 758 556 667",
    leaderEmail: "amos.bazira@wakissha.ug",
    secretariatName: "Ms. Teresa Byamukama",
    secretariatPhone: "+256 758 667 778",
    secretariatEmail: "teresa.byamukama@wakissha.ug",
  },
  {
    id: "zone-9",
    name: "NSANGI ZONE",
    district: "Wakiso",
    leaderName: "Mr. Samuel Ssenyonga",
    leaderPhone: "+256 759 111 222",
    leaderEmail: "samuel.ssenyonga@wakissha.ug",
    secretariatName: "Ms. Brenda Namata",
    secretariatPhone: "+256 759 222 333",
    secretariatEmail: "brenda.namata@wakissha.ug",
  },
  {
    id: "zone-10",
    name: "WAMPEEWO ZONE",
    district: "Wakiso",
    leaderName: "Mr. Peter Mugisha",
    leaderPhone: "+256 759 333 444",
    leaderEmail: "peter.mugisha@wakissha.ug",
    secretariatName: "Ms. Lydia Namirembe",
    secretariatPhone: "+256 759 444 555",
    secretariatEmail: "lydia.namirembe@wakissha.ug",
  },
];

const initialSubjects: Subject[] = [
  // UCE Subjects
  { id: "subj-1", name: "English Language", code: "ENG", standardCode: "112", educationLevel: "UCE", optional: false, papers: [{ id: "p1", name: "Paper 1", isCompulsory: true }, { id: "p2", name: "Paper 2", isCompulsory: true }] },
  { id: "subj-2", name: "Literature in English", code: "LIT", standardCode: "208", educationLevel: "UCE", optional: true, papers: [{ id: "p1", name: "Paper 1", isCompulsory: true }, { id: "p2", name: "Paper 2", isCompulsory: true }] },
  { id: "subj-3", name: "Kiswahili", code: "KISWA", standardCode: "336", educationLevel: "UCE", optional: true, papers: [{ id: "p1", name: "Paper 1", isCompulsory: true }, { id: "p2", name: "Paper 2", isCompulsory: true }] },
  { id: "subj-4", name: "Christian Religious Education", code: "CRE", standardCode: "223", educationLevel: "UCE", optional: true, papers: [{ id: "p1", name: "Paper 1", isCompulsory: true }, { id: "p2", name: "Paper 2", isCompulsory: true }] },
  { id: "subj-5", name: "Islamic Religious Education", code: "IRE", standardCode: "225", educationLevel: "UCE", optional: true, papers: [{ id: "p1", name: "Paper 1", isCompulsory: true }, { id: "p2", name: "Paper 2", isCompulsory: true }] },
  { id: "subj-6", name: "History & Political Education", code: "HIST", standardCode: "241", educationLevel: "UCE", optional: false, papers: [{ id: "p1", name: "Paper 1", isCompulsory: true }, { id: "p2", name: "Paper 2", isCompulsory: true }] },
  { id: "subj-7", name: "Geography", code: "GEOG", standardCode: "273", educationLevel: "UCE", optional: false, papers: [{ id: "p1", name: "Paper 1", isCompulsory: true }, { id: "p2", name: "Paper 2", isCompulsory: true }] },
  { id: "subj-8", name: "French", code: "FRENCH", standardCode: "314", educationLevel: "UCE", optional: true, papers: [{ id: "p1", name: "Paper 1", isCompulsory: true }, { id: "p2", name: "Paper 2", isCompulsory: true }] },
  { id: "subj-9", name: "German", code: "GERMAN", standardCode: "309", educationLevel: "UCE", optional: true, papers: [{ id: "p1", name: "Paper 1", isCompulsory: true }, { id: "p2", name: "Paper 2", isCompulsory: true }] },
  { id: "subj-10", name: "Arabic", code: "ARABIC", standardCode: "337", educationLevel: "UCE", optional: true, papers: [{ id: "p1", name: "Paper 1", isCompulsory: true }, { id: "p2", name: "Paper 2", isCompulsory: true }] },
  { id: "subj-11", name: "Luganda", code: "LUGANDA", standardCode: "335", educationLevel: "UCE", optional: true, papers: [{ id: "p1", name: "Paper 1", isCompulsory: true }, { id: "p2", name: "Paper 2", isCompulsory: true }] },
  { id: "subj-12", name: "Runyankole / Rukiga", code: "RUNY", standardCode: "345", educationLevel: "UCE", optional: true, papers: [{ id: "p1", name: "Paper 1", isCompulsory: true }, { id: "p2", name: "Paper 2", isCompulsory: true }] },
  { id: "subj-13", name: "Lusoga", code: "LUSOGA", standardCode: "355", educationLevel: "UCE", optional: true, papers: [{ id: "p1", name: "Paper 1", isCompulsory: true }, { id: "p2", name: "Paper 2", isCompulsory: true }] },
  { id: "subj-14", name: "Mathematics", code: "MATH", standardCode: "456", educationLevel: "UCE", optional: false, papers: [{ id: "p1", name: "Paper 1", isCompulsory: true }, { id: "p2", name: "Paper 2", isCompulsory: true }] },
  { id: "subj-15", name: "Agriculture", code: "AGRIC", standardCode: "527", educationLevel: "UCE", optional: true, papers: [{ id: "p1", name: "Paper 1", isCompulsory: true }, { id: "p2", name: "Paper 2", isCompulsory: true }] },
  { id: "subj-16", name: "Physics", code: "PHY", standardCode: "535", educationLevel: "UCE", optional: false, papers: [{ id: "p1", name: "Paper 1", isCompulsory: true }, { id: "p2", name: "Paper 2", isCompulsory: true }, { id: "p3", name: "Paper 3 (Practical)", isCompulsory: true }] },
  { id: "subj-17", name: "Chemistry", code: "CHEM", standardCode: "545", educationLevel: "UCE", optional: false, papers: [{ id: "p1", name: "Paper 1", isCompulsory: true }, { id: "p2", name: "Paper 2", isCompulsory: true }, { id: "p3", name: "Paper 3 (Practical)", isCompulsory: true }] },
  { id: "subj-18", name: "Biology", code: "BIO", standardCode: "553", educationLevel: "UCE", optional: false, papers: [{ id: "p1", name: "Paper 1", isCompulsory: true }, { id: "p2", name: "Paper 2", isCompulsory: true }, { id: "p3", name: "Paper 3 (Practical)", isCompulsory: true }] },
  { id: "subj-19", name: "Art & Design", code: "ART", standardCode: "612", educationLevel: "UCE", optional: true, papers: [{ id: "p1", name: "Paper 1", isCompulsory: true }, { id: "p2", name: "Paper 2", isCompulsory: true }] },
  { id: "subj-20", name: "Nutrition & Food Technology", code: "FN", standardCode: "662", educationLevel: "UCE", optional: true, papers: [{ id: "p1", name: "Paper 1", isCompulsory: true }, { id: "p2", name: "Paper 2", isCompulsory: true }] },
  { id: "subj-21", name: "Technical & Design", code: "TD", standardCode: "745", educationLevel: "UCE", optional: true, papers: [{ id: "p1", name: "Paper 1", isCompulsory: true }, { id: "p2", name: "Paper 2", isCompulsory: true }] },
  { id: "subj-22", name: "ICT", code: "CPS", standardCode: "840", educationLevel: "UCE", optional: true, papers: [{ id: "p1", name: "Paper 1", isCompulsory: true }, { id: "p2", name: "Paper 2", isCompulsory: true }] },
  { id: "subj-23", name: "Entrepreneurship", code: "ENT", standardCode: "845", educationLevel: "UCE", optional: true, papers: [{ id: "p1", name: "Paper 1", isCompulsory: true }, { id: "p2", name: "Paper 2", isCompulsory: true }] },
  { id: "subj-ateso-uce", name: "Ateso", code: "ATESO", standardCode: "365", educationLevel: "UCE", optional: true, papers: [{ id: "p1", name: "Paper 1", isCompulsory: true }, { id: "p2", name: "Paper 2", isCompulsory: true }] },
  { id: "subj-chinese-uce", name: "Chinese", code: "CHINESE", standardCode: "396", educationLevel: "UCE", optional: true, papers: [{ id: "p1", name: "Paper 1", isCompulsory: true }, { id: "p2", name: "Paper 2", isCompulsory: true }] },
  { id: "subj-commerce-uce", name: "Commerce", code: "COM", standardCode: "800", educationLevel: "UCE", optional: true, papers: [{ id: "p1", name: "Paper 1", isCompulsory: true }, { id: "p2", name: "Paper 2", isCompulsory: true }] },
  { id: "subj-accounts-uce", name: "Principles of Accounts", code: "ACC", standardCode: "810", educationLevel: "UCE", optional: true, papers: [{ id: "p1", name: "Paper 1", isCompulsory: true }, { id: "p2", name: "Paper 2", isCompulsory: true }] },
  { id: "subj-music-uce", name: "Music", code: "MUSIC", standardCode: "610", educationLevel: "UCE", optional: true, papers: [{ id: "p1", name: "Paper 1", isCompulsory: true }, { id: "p2", name: "Paper 2", isCompulsory: true }] },
  { id: "subj-pe-uce", name: "Physical Education", code: "PE", standardCode: "860", educationLevel: "UCE", optional: true, papers: [{ id: "p1", name: "Paper 1", isCompulsory: true }, { id: "p2", name: "Paper 2", isCompulsory: true }] },
  // UACE Subjects
  { id: "subj-24", name: "General Paper", code: "GP", standardCode: "101", educationLevel: "UACE", optional: false, papers: [{ id: "p1", name: "Paper 1", isCompulsory: true }] },
  { id: "subj-submath-uace", name: "Subsidiary Mathematics", code: "SUB_MATHS", standardCode: "475S", educationLevel: "UACE", optional: true, papers: [{ id: "p1", name: "Paper 1", isCompulsory: true }] },
  { id: "subj-subict-uace", name: "Subsidiary ICT", code: "SUB_ICT", standardCode: "610", educationLevel: "UACE", optional: true, papers: [{ id: "p1", name: "Paper 1", isCompulsory: true }, { id: "p2", name: "Paper 2", isCompulsory: true }] },
  { id: "subj-3-uace", name: "Kiswahili", code: "KISWA", standardCode: "340", educationLevel: "UACE", optional: true, papers: [{ id: "p1", name: "Paper 1", isCompulsory: true }, { id: "p2", name: "Paper 2", isCompulsory: true }, { id: "p3", name: "Paper 3", isCompulsory: true }] },
  { id: "subj-4-uace", name: "Christian Religious Education", code: "CRE", standardCode: "221", educationLevel: "UACE", optional: true, papers: [{ id: "p1", name: "Paper 1", isCompulsory: true }, { id: "p2", name: "Paper 2", isCompulsory: true }, { id: "p3", name: "Paper 3", isCompulsory: true }] },
  { id: "subj-5-uace", name: "Islamic Religious Education", code: "IRE", standardCode: "224", educationLevel: "UACE", optional: true, papers: [{ id: "p1", name: "Paper 1", isCompulsory: true }, { id: "p2", name: "Paper 2", isCompulsory: true }, { id: "p3", name: "Paper 3", isCompulsory: true }] },
  { id: "subj-7-uace", name: "Geography", code: "GEOG", standardCode: "230", educationLevel: "UACE", optional: true, papers: [{ id: "p1", name: "Paper 1", isCompulsory: true }, { id: "p2", name: "Paper 2", isCompulsory: true }, { id: "p3", name: "Paper 3", isCompulsory: true }] },
  { id: "subj-8-uace", name: "French", code: "FRENCH", standardCode: "351", educationLevel: "UACE", optional: true, papers: [{ id: "p1", name: "Paper 1", isCompulsory: true }, { id: "p2", name: "Paper 2", isCompulsory: true }, { id: "p3", name: "Paper 3", isCompulsory: true }] },
  { id: "subj-9-uace", name: "German", code: "GERMAN", standardCode: "358", educationLevel: "UACE", optional: true, papers: [{ id: "p1", name: "Paper 1", isCompulsory: true }, { id: "p2", name: "Paper 2", isCompulsory: true }, { id: "p3", name: "Paper 3", isCompulsory: true }] },
  { id: "subj-10-uace", name: "Arabic", code: "ARABIC", standardCode: "361", educationLevel: "UACE", optional: true, papers: [{ id: "p1", name: "Paper 1", isCompulsory: true }, { id: "p2", name: "Paper 2", isCompulsory: true }, { id: "p3", name: "Paper 3", isCompulsory: true }] },
  { id: "subj-11-uace", name: "Luganda", code: "LUGANDA", standardCode: "380", educationLevel: "UACE", optional: true, papers: [{ id: "p1", name: "Paper 1", isCompulsory: true }, { id: "p2", name: "Paper 2", isCompulsory: true }, { id: "p3", name: "Paper 3", isCompulsory: true }] },
  { id: "subj-12-uace", name: "Runyankole / Rukiga", code: "RUNY", standardCode: "383", educationLevel: "UACE", optional: true, papers: [{ id: "p1", name: "Paper 1", isCompulsory: true }, { id: "p2", name: "Paper 2", isCompulsory: true }, { id: "p3", name: "Paper 3", isCompulsory: true }] },
  { id: "subj-13-uace", name: "Lusoga", code: "LUSOGA", standardCode: "386", educationLevel: "UACE", optional: true, papers: [{ id: "p1", name: "Paper 1", isCompulsory: true }, { id: "p2", name: "Paper 2", isCompulsory: true }, { id: "p3", name: "Paper 3", isCompulsory: true }] },
  { id: "subj-14-uace", name: "Mathematics", code: "MATH", standardCode: "475", educationLevel: "UACE", optional: true, papers: [{ id: "p1", name: "Paper 1", isCompulsory: true }, { id: "p2", name: "Paper 2", isCompulsory: true }] },
  { id: "subj-15-uace", name: "Agriculture", code: "AGRIC", standardCode: "515", educationLevel: "UACE", optional: true, papers: [{ id: "p1", name: "Paper 1", isCompulsory: true }, { id: "p2", name: "Paper 2", isCompulsory: true }, { id: "p3", name: "Paper 3 (Practical)", isCompulsory: true }] },
  { id: "subj-16-uace", name: "Physics", code: "PHY", standardCode: "525", educationLevel: "UACE", optional: true, papers: [{ id: "p1", name: "Paper 1", isCompulsory: true }, { id: "p2", name: "Paper 2", isCompulsory: true }, { id: "p3", name: "Paper 3 (Practical)", isCompulsory: true }] },
  { id: "subj-17-uace", name: "Chemistry", code: "CHEM", standardCode: "535", educationLevel: "UACE", optional: true, papers: [{ id: "p1", name: "Paper 1", isCompulsory: true }, { id: "p2", name: "Paper 2", isCompulsory: true }, { id: "p3", name: "Paper 3 (Practical)", isCompulsory: true }] },
  { id: "subj-18-uace", name: "Biology", code: "BIO", standardCode: "545", educationLevel: "UACE", optional: true, papers: [{ id: "p1", name: "Paper 1", isCompulsory: true }, { id: "p2", name: "Paper 2", isCompulsory: true }, { id: "p3", name: "Paper 3 (Practical)", isCompulsory: true }] },
  { id: "subj-19-uace", name: "Fine Art", code: "ART", standardCode: "615", educationLevel: "UACE", optional: true, papers: [{ id: "p1", name: "Paper 1", isCompulsory: true }, { id: "p2", name: "Paper 2", isCompulsory: true }, { id: "p3", name: "Paper 3", isCompulsory: true }, { id: "p4", name: "Paper 4", isCompulsory: true }] },
  { id: "subj-21-uace", name: "Technical Drawing", code: "TD", standardCode: "680", educationLevel: "UACE", optional: true, papers: [{ id: "p1", name: "Paper 1", isCompulsory: true }, { id: "p2", name: "Paper 2", isCompulsory: true }, { id: "p3", name: "Paper 3", isCompulsory: true }] },
  { id: "subj-23-uace", name: "Entrepreneurship", code: "ENT", standardCode: "268", educationLevel: "UACE", optional: true, papers: [{ id: "p1", name: "Paper 1", isCompulsory: true }, { id: "p2", name: "Paper 2", isCompulsory: true }, { id: "p3", name: "Paper 3", isCompulsory: true }] },
  { id: "subj-econ-uace", name: "Economics", code: "ECON", standardCode: "220", educationLevel: "UACE", optional: true, papers: [{ id: "p1", name: "Paper 1", isCompulsory: true }, { id: "p2", name: "Paper 2", isCompulsory: true }] },
  { id: "subj-hist-uace", name: "History", code: "HIST", standardCode: "210", educationLevel: "UACE", optional: true, papers: [{ id: "p1", name: "Paper 1", isCompulsory: true }, { id: "p2", name: "Paper 2", isCompulsory: true }, { id: "p3", name: "Paper 3", isCompulsory: true }] },
  { id: "subj-lit-uace", name: "Literature in English", code: "LIT", standardCode: "208", educationLevel: "UACE", optional: true, papers: [{ id: "p1", name: "Paper 1", isCompulsory: true }, { id: "p2", name: "Paper 2", isCompulsory: true }, { id: "p3", name: "Paper 3", isCompulsory: true }] },
  { id: "subj-fn-uace", name: "Food and Nutrition", code: "FN", standardCode: "640", educationLevel: "UACE", optional: true, papers: [{ id: "p1", name: "Paper 1", isCompulsory: true }, { id: "p2", name: "Paper 2", isCompulsory: true }, { id: "p3", name: "Paper 3 (Practical)", isCompulsory: true }] },
  { id: "subj-chinese-uace", name: "Chinese", code: "CHINESE", standardCode: "396", educationLevel: "UACE", optional: true, papers: [{ id: "p1", name: "Paper 1", isCompulsory: true }, { id: "p2", name: "Paper 2", isCompulsory: true }, { id: "p3", name: "Paper 3", isCompulsory: true }] },
  { id: "subj-ateso-uace", name: "Ateso", code: "ATESO", standardCode: "365", educationLevel: "UACE", optional: true, papers: [{ id: "p1", name: "Paper 1", isCompulsory: true }, { id: "p2", name: "Paper 2", isCompulsory: true }, { id: "p3", name: "Paper 3", isCompulsory: true }] },
  { id: "subj-music-uace", name: "Music", code: "MUSIC", standardCode: "620", educationLevel: "UACE", optional: true, papers: [{ id: "p1", name: "Paper 1", isCompulsory: true }, { id: "p2", name: "Paper 2", isCompulsory: true }, { id: "p3", name: "Paper 3", isCompulsory: true }, { id: "p4", name: "Paper 4", isCompulsory: true }] },

];

const initialSchools: SchoolRecord[] = [
  {
    id: "2",
    name: "AMITY SECONDARY SCHOOL",
    code: "WAK26-0001",
    email: "kampalasss@wakissha.ug",
    phone: "+256 700 101 001",
    address: "Plot 12 Kampala Road, Kampala",
    district: "Kampala",
    zone: "AGGREY ZONE",
    zone_id: "zone-1",
    educationLevel: "UCE" as const,
    academicYear: "2026",
    status: "active" as const,
    registrationDate: "2026-01-12",
    students: 120,
    amountPaid: "3,600,000 UGX",
    paymentProof: "receipt-wak26-0001.pdf",
    activationCode: "ACT-2026-001",
  },
  {
    id: "3",
    name: "Wakiso Hills College",
    code: "WAK26-0002",
    email: "wakisohills@wakissha.ug",
    phone: "+256 700 101 002",
    address: "Mityana Road, Wakiso",
    district: "Wakiso",
    zone: "BULOBA ZONE",
    zone_id: "zone-2",
    educationLevel: "UACE" as const,
    academicYear: "2026",
    status: "verified" as const,
    registrationDate: "2026-01-18",
    students: 98,
    amountPaid: "2,940,000 UGX",
    paymentProof: "receipt-wak26-0002.pdf",
    activationCode: "ACT-2026-002",
  },
  {
    id: "4",
    name: "Entebbe High School",
    code: "WAK26-0003",
    email: "entebbehigh@wakissha.ug",
    phone: "+256 700 101 003",
    address: "Airport Road, Entebbe",
    district: "Entebbe",
    zone: "BWEYOGERERE ZONE",
    zone_id: "zone-3",
    educationLevel: "UACE" as const,
    academicYear: "2026",
    status: "pending" as const,
    registrationDate: "2026-02-01",
    students: 84,
    amountPaid: "0 UGX",
    paymentProof: "not-submitted.pdf",
    activationCode: "",
  },
  {
    id: "5",
    name: "Nansana Secondary School",
    code: "WAK26-0004",
    email: "nansana@wakissha.ug",
    phone: "+256 700 101 004",
    address: "Hoima Road, Nansana",
    district: "Wakiso",
    zone: "ENTEBBE ZONE",
    zone_id: "zone-4",
    educationLevel: "UCE" as const,
    academicYear: "2026",
    status: "payment_submitted" as const,
    registrationDate: "2026-02-10",
    students: 73,
    amountPaid: "2,190,000 UGX",
    paymentProof: "receipt-wak26-0004.pdf",
    activationCode: "",
  },
];

const schoolPasswords: Record<string, string> = {
  "WAK26-0001": "demo123",
  "WAK26-0002": "demo123",
  "WAK26-0003": "demo123",
  "WAK26-0004": "demo123",
};

const initialStudents: StudentRecord[] = [
  // WAK26-0001 (AMITY SECONDARY SCHOOL) - UCE Students
  {
    id: "student-1",
    registrationNumber: "WAK/26-0001/001",
    studentName: "John Smith",
    examLevel: "UCE",
    classLevel: "S.4",
    schoolCode: "WAK26-0001",
    schoolName: "AMITY SECONDARY SCHOOL",
    academicYear: "2026",
    subjects: [
      {
        subjectId: "subj-14",
        subjectCode: "MATH",
        subjectName: "Mathematics",
        paper: "Paper 1",
        entry1: false,
        entry2: false,
        entry3: false,
        entry4: false,
      },
      {
        subjectId: "subj-1",
        subjectCode: "ENG",
        subjectName: "English",
        paper: "Paper 1",
        entry1: false,
        entry2: false,
        entry3: false,
        entry4: false,
      },
    ],
    totalEntries: 2,
    registrationDate: "2026-01-15",
  },
  {
    id: "student-2",
    registrationNumber: "WAK/26-0001/002",
    studentName: "Emma Johnson",
    examLevel: "UCE",
    classLevel: "S.4",
    schoolCode: "WAK26-0001",
    schoolName: "AMITY SECONDARY SCHOOL",
    academicYear: "2026",
    subjects: [
      {
        subjectId: "subj-1",
        subjectCode: "ENG",
        subjectName: "English",
        paper: "Paper 2",
        entry1: false,
        entry2: false,
        entry3: false,
        entry4: false,
      },
      {
        subjectId: "subj-14",
        subjectCode: "MATH",
        subjectName: "Mathematics",
        paper: "Paper 1",
        entry1: false,
        entry2: false,
        entry3: false,
        entry4: false,
      },
      {
        subjectId: "subj-16",
        subjectCode: "PHY",
        subjectName: "Physics",
        paper: "Paper 1",
        entry1: false,
        entry2: false,
        entry3: false,
        entry4: false,
      },
    ],
    totalEntries: 3,
    registrationDate: "2026-01-16",
  },
  {
    id: "student-3",
    registrationNumber: "WAK/26-0001/003",
    studentName: "Alice Brown",
    examLevel: "UCE",
    classLevel: "S.3",
    schoolCode: "WAK26-0001",
    schoolName: "AMITY SECONDARY SCHOOL",
    academicYear: "2026",
    subjects: [
      {
        subjectId: "subj-14",
        subjectCode: "MATH",
        subjectName: "Mathematics",
        paper: "Paper 2",
        entry1: false,
        entry2: false,
        entry3: false,
        entry4: false,
      },
      {
        subjectId: "subj-1",
        subjectCode: "ENG",
        subjectName: "English",
        paper: "Paper 1",
        entry1: false,
        entry2: false,
        entry3: false,
        entry4: false,
      },
    ],
    totalEntries: 2,
    registrationDate: "2026-01-20",
  },
  {
    id: "student-4",
    registrationNumber: "WAK/26-0001/004",
    studentName: "David Wilson",
    examLevel: "UCE",
    classLevel: "S.4",
    schoolCode: "WAK26-0001",
    schoolName: "AMITY SECONDARY SCHOOL",
    academicYear: "2026",
    subjects: [
      {
        subjectId: "subj-14",
        subjectCode: "MATH",
        subjectName: "Mathematics",
        paper: "Paper 1",
        entry1: false,
        entry2: false,
        entry3: false,
        entry4: false,
      },
      {
        subjectId: "subj-17",
        subjectCode: "CHEM",
        subjectName: "Chemistry",
        paper: "Paper 3",
        entry1: false,
        entry2: false,
        entry3: false,
        entry4: false,
      },
    ],
    totalEntries: 2,
    registrationDate: "2026-01-21",
  },

  // WAK26-0002 (Wakiso Hills College) - UACE Students
  {
    id: "student-5",
    registrationNumber: "WAK/26-0002/001",
    studentName: "Michael Chen",
    examLevel: "UACE",
    classLevel: "S.6",
    schoolCode: "WAK26-0002",
    schoolName: "Wakiso Hills College",
    academicYear: "2026",
    subjects: [
      {
        subjectId: "subj-24",
        subjectCode: "GP",
        subjectName: "General Paper",
        paper: "Paper 1",
        entry1: false,
        entry2: false,
        entry3: false,
        entry4: false,
      },
      {
        subjectId: "subj-14-uace",
        subjectCode: "MATH",
        subjectName: "Mathematics",
        paper: "Paper 2",
        entry1: false,
        entry2: false,
        entry3: false,
        entry4: false,
      },
    ],
    totalEntries: 2,
    registrationDate: "2026-01-17",
  },
  {
    id: "student-6",
    registrationNumber: "WAK/26-0002/002",
    studentName: "Sarah Thompson",
    examLevel: "UACE",
    classLevel: "S.5",
    schoolCode: "WAK26-0002",
    schoolName: "Wakiso Hills College",
    academicYear: "2026",
    subjects: [
      {
        subjectId: "subj-24",
        subjectCode: "GP",
        subjectName: "General Paper",
        paper: "Paper 1",
        entry1: false,
        entry2: false,
        entry3: false,
        entry4: false,
      },
      {
        subjectId: "subj-16-uace",
        subjectCode: "PHY",
        subjectName: "Physics",
        paper: "Paper 1",
        entry1: false,
        entry2: false,
        entry3: false,
        entry4: false,
      },
      {
        subjectId: "subj-17-uace",
        subjectCode: "CHEM",
        subjectName: "Chemistry",
        paper: "Paper 2",
        entry1: false,
        entry2: false,
        entry3: false,
        entry4: false,
      },
    ],
    totalEntries: 3,
    registrationDate: "2026-01-18",
  },
  {
    id: "student-7",
    registrationNumber: "WAK/26-0002/003",
    studentName: "James Patterson",
    examLevel: "UACE",
    classLevel: "S.6",
    schoolCode: "WAK26-0002",
    schoolName: "Wakiso Hills College",
    academicYear: "2026",
    subjects: [
      {
        subjectId: "subj-24",
        subjectCode: "GP",
        subjectName: "General Paper",
        paper: "Paper 1",
        entry1: false,
        entry2: false,
        entry3: false,
        entry4: false,
      },
      {
        subjectId: "subj-18-uace",
        subjectCode: "BIO",
        subjectName: "Biology",
        paper: "Paper 3",
        entry1: false,
        entry2: false,
        entry3: false,
        entry4: false,
      },
    ],
    totalEntries: 2,
    registrationDate: "2026-01-22",
  },

  // WAK26-0003 (Entebbe High School) - Mixed UCE & UACE Students
  {
    id: "student-8",
    registrationNumber: "WAK/26-0003/001",
    studentName: "Grace Omurungi",
    examLevel: "UCE",
    classLevel: "S.4",
    schoolCode: "WAK26-0003",
    schoolName: "Entebbe High School",
    academicYear: "2026",
    subjects: [
      {
        subjectId: "subj-14",
        subjectCode: "MATH",
        subjectName: "Mathematics",
        paper: "Paper 1",
        entry1: false,
        entry2: false,
        entry3: false,
        entry4: false,
      },
      {
        subjectId: "subj-1",
        subjectCode: "ENG",
        subjectName: "English",
        paper: "Paper 3",
        entry1: false,
        entry2: false,
        entry3: false,
        entry4: false,
      },
    ],
    totalEntries: 2,
    registrationDate: "2026-01-19",
  },
  {
    id: "student-9",
    registrationNumber: "WAK/26-0003/002",
    studentName: "Peter Okello",
    examLevel: "UACE",
    classLevel: "S.6",
    schoolCode: "WAK26-0003",
    schoolName: "Entebbe High School",
    academicYear: "2026",
    subjects: [
      {
        subjectId: "subj-24",
        subjectCode: "GP",
        subjectName: "General Paper",
        paper: "Paper 2",
        entry1: false,
        entry2: false,
        entry3: false,
        entry4: false,
      },
    ],
    totalEntries: 1,
    registrationDate: "2026-01-23",
  },

  // WAK26-0004 (Nansana Secondary School) - UCE Students
  {
    id: "student-10",
    registrationNumber: "WAK/26-0004/001",
    studentName: "Sophia Nakato",
    examLevel: "UCE",
    classLevel: "S.4",
    schoolCode: "WAK26-0004",
    schoolName: "Nansana Secondary School",
    academicYear: "2026",
    subjects: [
      {
        subjectId: "subj-14",
        subjectCode: "MATH",
        subjectName: "Mathematics",
        paper: "Paper 4",
        entry1: false,
        entry2: false,
        entry3: false,
        entry4: false,
      },
      {
        subjectId: "subj-1",
        subjectCode: "ENG",
        subjectName: "English",
        paper: "Paper 1",
        entry1: false,
        entry2: false,
        entry3: false,
        entry4: false,
      },
      {
        subjectId: "subj-16",
        subjectCode: "PHY",
        subjectName: "Physics",
        paper: "Paper 2",
        entry1: false,
        entry2: false,
        entry3: false,
        entry4: false,
      },
    ],
    totalEntries: 3,
    registrationDate: "2026-01-24",
  },
];

function toSchoolUser(school: SchoolRecord): User {
  return {
    id: school.id,
    name: school.name,
    email: school.email,
    role: "school",
    schoolCode: school.code,
    district: school.district,
    zone: school.zone,
    academicYear: school.academicYear,
    status: school.status,
    activationCode: school.activationCode,
    avatar: school.avatar,
    schoolLogo: school.schoolLogo,
  };
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [schools, setSchools] = useState<SchoolRecord[]>(initialSchools);
  const [students, setStudents] = useState<StudentRecord[]>(initialStudents);
  const [zones] = useState<Zone[]>(initialZones);
  const [subjects, setSubjects] = useState<Subject[]>(initialSubjects);
  const [invoices, setInvoices] = useState<Invoice[]>([]);

  useEffect(() => {
    // Load invoices from localStorage if needed, or initialize with empty
    const savedInvoices = localStorage.getItem("wakissha_invoices");
    if (savedInvoices) {
      setInvoices(JSON.parse(savedInvoices));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("wakissha_invoices", JSON.stringify(invoices));
  }, [invoices]);

  useEffect(() => {
    if (!user || user.role !== "school" || !user.schoolCode) return;

    const linkedSchool = schools.find((school) => school.code === user.schoolCode);
    if (linkedSchool) {
      setUser((current) => {
        if (!current || current.role !== "school") return current;
        return toSchoolUser(linkedSchool);
      });
    }
  }, [schools, user?.role, user?.schoolCode]);

  const login = async (identifier: string, password: string) => {
    if (
      identifier === adminUser.email &&
      password === "wakissha2026"
    ) {
      setUser(adminUser);
      return;
    }

    const school = schools.find((record) => record.code === identifier);
    if (!school || schoolPasswords[identifier] !== password) {
      throw new Error("Invalid credentials");
    }

    setUser(toSchoolUser(school));
  };

  const logout = () => {
    setUser(null);
  };

  const addSchool = (newSchool: NewSchoolInput) => {
    const nextNumber = schools.length + 1;
    const schoolCode = `WAK26-${String(nextNumber).padStart(4, "0")}`;
    const zone = initialZones.find((z) => z.id === newSchool.zone_id);
    const resolvedZone = zone ?? initialZones[0];

    const school: SchoolRecord = {
      id: String(nextNumber + 1),
      name: newSchool.name,
      code: schoolCode,
      email: newSchool.email,
      phone: newSchool.phone,
      address: newSchool.address,
      district: zone ? resolvedZone.district : "Unassigned",
      zone: zone ? resolvedZone.name : "UNASSIGNED ZONE",
      zone_id: newSchool.zone_id,
      educationLevel: newSchool.educationLevel,
      academicYear: "2026",
      status: "pending",
      registrationDate: new Date().toISOString().split("T")[0],
      students: 0,
      amountPaid: "0 UGX",
      paymentProof: "not-submitted.pdf",
      activationCode: "",
      schoolLogo: newSchool.schoolLogo,
      contactPerson: newSchool.contactPerson,
      contactDesignation: newSchool.contactDesignation,
    };

    schoolPasswords[schoolCode] = "demo123";
    setSchools((prev) => [...prev, school]);
  };

  const submitSchoolDocuments = (schoolCode: string) => {
    setSchools((prev) =>
      prev.map((school) =>
        school.code === schoolCode
          ? {
              ...school,
              status: "payment_submitted",
              amountPaid:
                school.amountPaid === "0 UGX"
                  ? "2,550,000 UGX"
                  : school.amountPaid,
              paymentProof: `signed-form-${schoolCode.toLowerCase()}.pdf`,
            }
          : school,
      ),
    );
  };

  const updateSchoolStatus = (
    schoolCode: string,
    status: SchoolStatus,
    activationCode = "",
  ) => {
    setSchools((prev) =>
      prev.map((school) =>
        school.code === schoolCode
          ? {
              ...school,
              status,
              activationCode:
                status === "active"
                  ? activationCode || school.activationCode
                  : school.activationCode,
            }
          : school,
      ),
    );
  };

  const finalizeRegistration = (schoolCode: string, markingGuide: "Arts" | "Sciences" | "Both", bookletsCount: number) => {
    setSchools((prev) =>
      prev.map((school) =>
        school.code === schoolCode
          ? {
              ...school,
              registrationFinalized: true,
              markingGuide,
            }
          : school,
      ),
    );

    // Generate initial invoice
    const school = schools.find(s => s.code === schoolCode);
    if (!school) return;

    const schoolStudents = students.filter(s => s.schoolCode === schoolCode && !s.isAdditional);
    const fullySubmittedStudents = schoolStudents.filter(student => isStudentFullyRegistered(student, subjects));
    const fullySubmittedCount = fullySubmittedStudents.length;

    const items = [
      { 
        description: "School Registration Fee", 
        quantity: 1, 
        unitPrice: 500000, 
        total: 500000,
        formula: "Fixed Amount"
      },
      { 
        description: "Student Fee", 
        quantity: fullySubmittedCount, 
        unitPrice: 27000, 
        total: fullySubmittedCount * 27000,
        formula: `27,000 × ${fullySubmittedCount} = ${(fullySubmittedCount * 27000).toLocaleString()}`
      },
      { 
        description: "Answer Booklets", 
        quantity: bookletsCount, 
        unitPrice: 25000, 
        total: bookletsCount * 25000,
        formula: `25,000 × ${bookletsCount} = ${(bookletsCount * 25000).toLocaleString()}`
      },
    ];

    if (markingGuide === "Both") {
      items.push({ 
        description: "Marking Guide (Arts & Sciences)", 
        quantity: 2, 
        unitPrice: 25000, 
        total: 50000,
        formula: "25,000 × 2 = 50,000"
      });
    } else if (markingGuide !== "None") {
      items.push({ 
        description: `Marking Guide (${markingGuide})`, 
        quantity: 1, 
        unitPrice: 25000, 
        total: 25000,
        formula: "25,000 × 1 = 25,000"
      });
    }

    const totalAmount = items.reduce((sum, item) => sum + item.total, 0);

    addInvoice({
      serialNumber: `INV-${schoolCode}-${Date.now().toString().slice(-4)}`,
      schoolCode,
      date: new Date().toISOString().split("T")[0],
      items,
      totalAmount,
      status: "pending",
      type: "original"
    });

    // Mark these students as invoiced
    const studentIds = fullySubmittedStudents.map(s => s.id);
    setStudents(prev => prev.map(s => 
      studentIds.includes(s.id) ? { ...s, isInvoiced: true } : s
    ));
  };

  const addInvoice = (invoiceData: Omit<Invoice, "id">, studentIds?: string[]) => {
    const newInvoice: Invoice = {
      ...invoiceData,
      id: `inv-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    };
    setInvoices((prev) => [...prev, newInvoice]);

    if (studentIds && studentIds.length > 0) {
      setStudents((prev) =>
        prev.map((s) =>
          studentIds.includes(s.id) ? { ...s, isInvoiced: true } : s
        )
      );
    }
  };

  const uploadPaymentProof = (invoiceId: string, proofUrl: string) => {
    setInvoices((prev) =>
      prev.map((inv) =>
        inv.id === invoiceId ? { ...inv, paymentProof: proofUrl, status: "pending" } : inv
      )
    );
    // Also update school status and school's payment proof field
    if (user?.schoolCode) {
      setSchools((prev) =>
        prev.map((s) =>
          s.code === user.schoolCode
            ? { ...s, status: "payment_submitted", paymentProof: proofUrl }
            : s
        )
      );
    }
  };

  const addStudentEntry: AuthContextType["addStudentEntry"] = (entry) => {
    setStudents((prev) => {
      const schoolStudents = prev.filter((student) => student.schoolCode === entry.schoolCode);
      const serial = String(schoolStudents.length + 1).padStart(3, "0");
      const schoolSuffix = entry.schoolCode.replace("WAK26-", "");
      const registrationNumber = `WAK/26-${schoolSuffix}/${serial}`;

      const schoolName =
        schools.find((school) => school.code === entry.schoolCode)?.name ?? entry.schoolCode;

      // Determine exam level based on class level
      const examLevel: "UCE" | "UACE" =
        ["S.1", "S.2", "S.3", "S.4"].includes(entry.classLevel) ? "UCE" : "UACE";

      const schoolRecord = schools.find(s => s.code === entry.schoolCode);
      const isAdditional = schoolRecord?.registrationFinalized ?? false;

      const newStudent: StudentRecord = {
        id: `student-${Date.now()}`,
        registrationNumber,
        studentName: entry.studentName,
        classLevel: entry.classLevel as "S.1" | "S.2" | "S.3" | "S.4" | "S.5" | "S.6",
        examLevel,
        stream: entry.stream,
        bookletsCount: entry.bookletsCount,
        isAdditional,
        subjects: entry.subjects,
        totalEntries: entry.totalEntries,
        schoolCode: entry.schoolCode,
        schoolName,
        academicYear: "2026",
        registrationDate: new Date().toISOString().split("T")[0],
      };

      return [...prev, newStudent];
    });

    setSchools((prev) =>
      prev.map((school) =>
        school.code === entry.schoolCode
          ? { ...school, students: school.students + 1 }
          : school,
      ),
    );
  };

  const updateStudentEntry: AuthContextType["updateStudentEntry"] = (studentId, updates) => {
    const studentToUpdate = students.find(s => s.id === studentId);
    if (!studentToUpdate) return;

    const schoolRecord = schools.find(s => s.code === studentToUpdate.schoolCode);
    const isFinalized = schoolRecord?.registrationFinalized ?? false;

    // Lock non-additional students if registration is finalized
    if (isFinalized && !studentToUpdate.isAdditional) {
      console.warn("Attempted to update a locked student record.");
      return;
    }

    setStudents((prev) =>
      prev.map((student) =>
        student.id === studentId
          ? {
              ...student,
              studentName: updates.studentName,
              classLevel: updates.classLevel,
              stream: updates.stream,
              bookletsCount: updates.bookletsCount,
              subjects: updates.subjects,
              totalEntries: updates.totalEntries,
              examLevel: ["S.1", "S.2", "S.3", "S.4"].includes(updates.classLevel)
                ? "UCE"
                : "UACE",
            }
          : student,
      ),
    );
  };

  const deleteStudentEntry: AuthContextType["deleteStudentEntry"] = (studentId) => {
    const studentToDelete = students.find((s) => s.id === studentId);
    if (!studentToDelete) return;

    const schoolRecord = schools.find(s => s.code === studentToDelete.schoolCode);
    const isFinalized = schoolRecord?.registrationFinalized ?? false;

    // Lock non-additional students if registration is finalized
    if (isFinalized && !studentToDelete.isAdditional) {
      console.warn("Attempted to delete a locked student record.");
      return;
    }

    setStudents((prev) => prev.filter((student) => student.id !== studentId));

    setSchools((prev) =>
      prev.map((school) =>
        school.code === studentToDelete.schoolCode
          ? { ...school, students: Math.max(0, school.students - 1) }
          : school,
      ),
    );
  };

  const addSubject: AuthContextType["addSubject"] = (subject) => {
    setSubjects((prev) => {
      const normalizedCode = subject.code.trim().toUpperCase();
      if (
        prev.some(
          (item) =>
            item.code.toUpperCase() === normalizedCode &&
            item.educationLevel === subject.educationLevel,
        )
      ) {
        return prev;
      }

      return [
        ...prev,
        {
          id: `${subject.educationLevel}-${normalizedCode}`,
          name: subject.name.trim(),
          code: normalizedCode,
          standardCode: subject.standardCode.trim(),
          educationLevel: subject.educationLevel,
          optional: subject.optional,
          papers: subject.papers,
          minPapers: subject.minPapers,
          maxPapers: subject.maxPapers,
        },
      ];
    });
  };

  const updateSubject: AuthContextType["updateSubject"] = (subjectId, updates) => {
    setSubjects((prev) => {
      const normalizedCode = updates.code.trim().toUpperCase();
      const duplicate = prev.some(
        (item) =>
          item.id !== subjectId &&
          item.code.toUpperCase() === normalizedCode &&
          item.educationLevel === updates.educationLevel,
      );
      if (duplicate) return prev;

      return prev.map((subject) =>
        subject.id === subjectId
          ? {
                ...subject,
                name: updates.name.trim(),
                code: normalizedCode,
                standardCode: updates.standardCode.trim(),
                educationLevel: updates.educationLevel,
                optional: updates.optional,
                papers: updates.papers,
                minPapers: updates.minPapers,
                maxPapers: updates.maxPapers,
              }
          : subject,
      );
    });
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        schools,
        students,
        zones,
        subjects,
        invoices,
        login,
        logout,
        isAuthenticated: !!user,
        addSchool,
        submitSchoolDocuments,
        updateSchoolStatus,
        finalizeRegistration,
        addInvoice,
        uploadPaymentProof,
        addStudentEntry,
        updateStudentEntry,
        deleteStudentEntry,
        addSubject,
        updateSubject,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
