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
}

export interface StudentSubjectEntry {
  subjectId: string;
  subjectCode: string; // Short code such as ENG, MATH, GP
  subjectStandardCode?: string;
  subjectName: string;
  paper: "Paper 1" | "Paper 2" | "Paper 3" | "Paper 4";
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
  subjects: StudentSubjectEntry[];
  totalEntries: number; // Sum of all checked entries
  registrationDate: string;
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
  addStudentEntry: (entry: {
    schoolCode: string;
    studentName: string;
    classLevel: "S.1" | "S.2" | "S.3" | "S.4" | "S.5" | "S.6";
    stream?: string;
    subjects: StudentSubjectEntry[];
    totalEntries: number;
  }) => void;
  updateStudentEntry: (
    studentId: string,
    updates: {
      studentName: string;
      classLevel: "S.1" | "S.2" | "S.3" | "S.4" | "S.5" | "S.6";
      stream?: string;
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
  }) => void;
  updateSubject: (
    subjectId: string,
    updates: {
      name: string;
      code: string;
      standardCode: string;
      educationLevel: "UCE" | "UACE";
      optional: boolean;
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
  { id: "subj-1", name: "English Language", code: "ENG", standardCode: "112", educationLevel: "UCE", optional: false },
  { id: "subj-2", name: "Literature in English", code: "LIT", standardCode: "208", educationLevel: "UCE", optional: true },
  { id: "subj-3-uceEP", name: "Kiswahili", code: "KISWA", standardCode: "336", educationLevel: "UCE", optional: true },
  { id: "subj-4-uce", name: "Christian Religious Education", code: "CRE", standardCode: "223", educationLevel: "UCE", optional: true },
  { id: "subj-5-uce", name: "Islamic Religious Education", code: "IRE", standardCode: "225", educationLevel: "UCE", optional: true },
  { id: "subj-6", name: "History & Political Education", code: "HIST", standardCode: "241", educationLevel: "UCE", optional: true },
  { id: "subj-7-uce", name: "Geography", code: "GEOG", standardCode: "273", educationLevel: "UCE", optional: true },
  { id: "subj-8-uce", name: "French", code: "FRENCH", standardCode: "314", educationLevel: "UCE", optional: true },
  { id: "subj-9-uce", name: "German", code: "GERMAN", standardCode: "309", educationLevel: "UCE", optional: true },
  { id: "subj-10-uce", name: "Arabic", code: "ARABIC", standardCode: "337", educationLevel: "UCE", optional: true },
  { id: "subj-11-uce", name: "Luganda", code: "LUGANDA", standardCode: "335", educationLevel: "UCE", optional: true },
  { id: "subj-12-uce", name: "Runyankole / Rukiga", code: "RUNY", standardCode: "345", educationLevel: "UCE", optional: true },
  { id: "subj-13-uce", name: "Lusoga", code: "LUSOGA", standardCode: "355", educationLevel: "UCE", optional: true },
  { id: "subj-14-uce", name: "Mathematics", code: "MATH", standardCode: "456", educationLevel: "UCE", optional: false },
  { id: "subj-15-uce", name: "Agriculture", code: "AGRIC", standardCode: "527", educationLevel: "UCE", optional: true },
  { id: "subj-16-uce", name: "Physics", code: "PHY", standardCode: "535", educationLevel: "UCE", optional: true },
  { id: "subj-17-uce", name: "Chemistry", code: "CHEM", standardCode: "545", educationLevel: "UCE", optional: true },
  { id: "subj-18-uce", name: "Biology", code: "BIO", standardCode: "553", educationLevel: "UCE", optional: true },
  { id: "subj-19-uce", name: "Art & Design", code: "ART", standardCode: "612", educationLevel: "UCE", optional: true },
  { id: "subj-20", name: "Nutrition & Food Technology", code: "FN", standardCode: "662", educationLevel: "UCE", optional: true },
  { id: "subj-21-uce", name: "Technical & Design", code: "TD", standardCode: "745", educationLevel: "UCE", optional: true },
  { id: "subj-22", name: "ICT", code: "CPS", standardCode: "840", educationLevel: "UCE", optional: true },
  { id: "subj-23-uce", name: "Entrepreneurship", code: "ENT", standardCode: "845", educationLevel: "UCE", optional: true },
  { id: "subj-ateso-uce", name: "Ateso", code: "ATESO", standardCode: "365", educationLevel: "UCE", optional: true },
  { id: "subj-chinese-uce", name: "Chinese", code: "CHINESE", standardCode: "396", educationLevel: "UCE", optional: true },
  // UACE Subjects
  { id: "subj-24", name: "General Paper", code: "GP", standardCode: "101", educationLevel: "UACE", optional: false },
  { id: "subj-25", name: "Subsidiary Mathematics", code: "SUB_MATHS", standardCode: "475", educationLevel: "UACE", optional: true },
  { id: "subj-26", name: "Subsidiary ICT", code: "SUB_ICT", standardCode: "610", educationLevel: "UACE", optional: true },
  { id: "subj-3-uace", name: "Kiswahili", code: "KISWA", standardCode: "340", educationLevel: "UACE", optional: true },
  { id: "subj-4-uace", name: "Christian Religious Education", code: "CRE", standardCode: "221", educationLevel: "UACE", optional: true },
  { id: "subj-5-uace", name: "Islamic Religious Education", code: "IRE", standardCode: "224", educationLevel: "UACE", optional: true },
  { id: "subj-7-uace", name: "Geography", code: "GEOG", standardCode: "230", educationLevel: "UACE", optional: true },
  { id: "subj-8-uace", name: "French", code: "FRENCH", standardCode: "351", educationLevel: "UACE", optional: true },
  { id: "subj-9-uace", name: "German", code: "GERMAN", standardCode: "358", educationLevel: "UACE", optional: true },
  { id: "subj-10-uace", name: "Arabic", code: "ARABIC", standardCode: "361", educationLevel: "UACE", optional: true },
  { id: "subj-11-uace", name: "Luganda", code: "LUGANDA", standardCode: "380", educationLevel: "UACE", optional: true },
  { id: "subj-12-uace", name: "Runyankole / Rukiga", code: "RUNY", standardCode: "383", educationLevel: "UACE", optional: true },
  { id: "subj-13-uace", name: "Lusoga", code: "LUSOGA", standardCode: "386", educationLevel: "UACE", optional: true },
  { id: "subj-14-uace", name: "Mathematics", code: "MATH", standardCode: "475", educationLevel: "UACE", optional: false },
  { id: "subj-15-uace", name: "Agriculture", code: "AGRIC", standardCode: "515", educationLevel: "UACE", optional: true },
  { id: "subj-16-uace", name: "Physics", code: "PHY", standardCode: "525", educationLevel: "UACE", optional: true },
  { id: "subj-17-uace", name: "Chemistry", code: "CHEM", standardCode: "535", educationLevel: "UACE", optional: true },
  { id: "subj-18-uace", name: "Biology", code: "BIO", standardCode: "545", educationLevel: "UACE", optional: true },
  { id: "subj-19-uace", name: "Fine Art", code: "ART", standardCode: "615", educationLevel: "UACE", optional: true },
  { id: "subj-21-uace", name: "Technical Drawing", code: "TD", standardCode: "680", educationLevel: "UACE", optional: true },
  { id: "subj-23-uace", name: "Entrepreneurship", code: "ENT", standardCode: "268", educationLevel: "UACE", optional: true },
  { id: "subj-econ-uace", name: "Economics", code: "ECON", standardCode: "220", educationLevel: "UACE", optional: true },
  { id: "subj-hist-uace", name: "History", code: "HIST", standardCode: "210", educationLevel: "UACE", optional: true },
  { id: "subj-fn-uace", name: "Food and Nutrition", code: "FN", standardCode: "640", educationLevel: "UACE", optional: true },
  { id: "subj-chinese-uace", name: "Chinese", code: "CHINESE", standardCode: "396", educationLevel: "UACE", optional: true },
  { id: "subj-ateso-uace", name: "Ateso", code: "ATESO", standardCode: "365", educationLevel: "UACE", optional: true },
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
        subjectId: "subj-14",
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
        subjectId: "subj-16",
        subjectCode: "PHY",
        subjectName: "Physics",
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
        subjectId: "subj-18",
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

      const newStudent: StudentRecord = {
        id: `student-${Date.now()}`,
        registrationNumber,
        studentName: entry.studentName,
        classLevel: entry.classLevel as "S.1" | "S.2" | "S.3" | "S.4" | "S.5" | "S.6",
        examLevel,
        stream: entry.stream,
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
    setStudents((prev) =>
      prev.map((student) =>
        student.id === studentId
          ? {
              ...student,
              studentName: updates.studentName,
              classLevel: updates.classLevel,
              stream: updates.stream,
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
        login,
        logout,
        isAuthenticated: !!user,
        addSchool,
        submitSchoolDocuments,
        updateSchoolStatus,
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
