import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import type { Zone } from "../types/zone";
import type { Subject } from "../types/subject";

export type UserRole = "admin" | "school";
export type SchoolStatus =
  | "pending"
  | "payment_submitted"
  | "verified"
  | "active";
export type EducationLevel = "UCE" | "UACE" | "BOTH";

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

export interface StudentRecord {
  id: string;
  registrationNumber: string;
  studentName: string;
  examLevel: "UCE" | "UACE";
  classLevel: string;
  subjectCode: string;
  subjectName: string;
  entry1: number;
  entry2: number;
  entry3: number;
  entry4: number;
  totalEntries: number;
  schoolCode: string;
  schoolName: string;
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
    examLevel: "UCE" | "UACE";
    classLevel: string;
    subjectCode: string;
    subjectName: string;
    entry1: number;
    entry2: number;
    entry3: number;
    entry4: number;
    totalEntries: number;
  }) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const adminUser: User = {
  id: "1",
  name: "WAKISSHA Administrator",
  email: "admin@wakissha.org",
  role: "admin",
  status: "active",
};

const initialZones: Zone[] = [
  {
    id: "zone-1",
    name: "Central Zone",
    district: "Kampala",
    leaderName: "Mr. Robert Kasigire",
    leaderPhone: "+256 757 123 456",
    leaderEmail: "robert.kasigire@wakissha.org",
    secretariatName: "Ms. Grace Nalweyiso",
    secretariatPhone: "+256 757 234 567",
    secretariatEmail: "grace.nalweyiso@wakissha.org",
  },
  {
    id: "zone-2",
    name: "North Zone",
    district: "Wakiso",
    leaderName: "Dr. Henry Musoke",
    leaderPhone: "+256 757 345 678",
    leaderEmail: "henry.musoke@wakissha.org",
    secretariatName: "Ms. Fatuma Ahmed",
    secretariatPhone: "+256 757 456 789",
    secretariatEmail: "fatuma.ahmed@wakissha.org",
  },
  {
    id: "zone-3",
    name: "South Zone",
    district: "Entebbe",
    leaderName: "Prof. Sarah Nakamya",
    leaderPhone: "+256 757 567 890",
    leaderEmail: "sarah.nakamya@wakissha.org",
    secretariatName: "Mr. Joseph Kyambadde",
    secretariatPhone: "+256 757 678 901",
    secretariatEmail: "joseph.kyambadde@wakissha.org",
  },
  {
    id: "zone-4",
    name: "West Zone",
    district: "Wakiso",
    leaderName: "Mr. Patrick Lubega",
    leaderPhone: "+256 757 789 012",
    leaderEmail: "patrick.lubega@wakissha.org",
    secretariatName: "Ms. Sylvia Namujju",
    secretariatPhone: "+256 757 890 123",
    secretariatEmail: "sylvia.namujju@wakissha.org",
  },
  {
    id: "zone-5",
    name: "Eastern Zone",
    district: "Mukono",
    leaderName: "Mr. David Otim",
    leaderPhone: "+256 757 901 234",
    leaderEmail: "david.otim@wakissha.org",
    secretariatName: "Ms. Rosemary Kiwanuka",
    secretariatPhone: "+256 757 012 345",
    secretariatEmail: "rosemary.kiwanuka@wakissha.org",
  },
  {
    id: "zone-6",
    name: "Northern Region",
    district: "Jinja",
    leaderName: "Mr. Edgar Kamya",
    leaderPhone: "+256 758 112 233",
    leaderEmail: "edgar.kamya@wakissha.org",
    secretariatName: "Ms. Christine Nabulya",
    secretariatPhone: "+256 758 223 334",
    secretariatEmail: "christine.nabulya@wakissha.org",
  },
  {
    id: "zone-7",
    name: "Fort Portal Zone",
    district: "Fort Portal",
    leaderName: "Mr. Julius Mugyenyi",
    leaderPhone: "+256 758 334 445",
    leaderEmail: "julius.mugyenyi@wakissha.org",
    secretariatName: "Ms. Hilda Kamugyisha",
    secretariatPhone: "+256 758 445 556",
    secretariatEmail: "hilda.kamugyisha@wakissha.org",
  },
  {
    id: "zone-8",
    name: "Mbarara Zone",
    district: "Mbarara",
    leaderName: "Mr. Amos Bazira",
    leaderPhone: "+256 758 556 667",
    leaderEmail: "amos.bazira@wakissha.org",
    secretariatName: "Ms. Teresa Byamukama",
    secretariatPhone: "+256 758 667 778",
    secretariatEmail: "teresa.byamukama@wakissha.org",
  },
];

const initialSubjects: Subject[] = [
  { id: "subj-1", name: "Mathematics", code: "MTH", educationLevel: "BOTH", optional: false },
  { id: "subj-2", name: "English Language", code: "ENG", educationLevel: "BOTH", optional: false },
  { id: "subj-3", name: "Physics", code: "PHY", educationLevel: "UCE", optional: false },
  { id: "subj-4", name: "Chemistry", code: "CHM", educationLevel: "BOTH", optional: false },
  { id: "subj-5", name: "Biology", code: "BIO", educationLevel: "BOTH", optional: false },
  { id: "subj-6", name: "History", code: "HIS", educationLevel: "BOTH", optional: true },
  { id: "subj-7", name: "Geography", code: "GEO", educationLevel: "BOTH", optional: true },
  { id: "subj-8", name: "Computer Science", code: "CPS", educationLevel: "BOTH", optional: true },
  { id: "subj-9", name: "Literature in English", code: "LIT", educationLevel: "UACE", optional: true },
  { id: "subj-10", name: "General Paper", code: "GP", educationLevel: "UACE", optional: false },
  { id: "subj-11", name: "Economics", code: "ECN", educationLevel: "UACE", optional: true },
  { id: "subj-12", name: "Entrepreneurship", code: "ETP", educationLevel: "UACE", optional: true },
];

const initialSchools: SchoolRecord[] = [
  {
    id: "2",
    name: "AMITY SECONDARY SCHOOL",
    code: "WAK26-0001",
    email: "kampalasss@wakissha.org",
    phone: "+256 700 101 001",
    address: "Plot 12 Kampala Road, Kampala",
    district: "Kampala",
    zone: "Central Zone",
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
    email: "wakisohills@wakissha.org",
    phone: "+256 700 101 002",
    address: "Mityana Road, Wakiso",
    district: "Wakiso",
    zone: "North Zone",
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
    email: "entebbehigh@wakissha.org",
    phone: "+256 700 101 003",
    address: "Airport Road, Entebbe",
    district: "Entebbe",
    zone: "South Zone",
    zone_id: "zone-3",
    educationLevel: "BOTH" as const,
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
    name: "Nansana Modern School",
    code: "WAK26-0004",
    email: "nansana@wakissha.org",
    phone: "+256 700 101 004",
    address: "Hoima Road, Nansana",
    district: "Wakiso",
    zone: "West Zone",
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
  {
    id: "student-1",
    registrationNumber: "WAK/26-0001/001",
    studentName: "John Smith",
    examLevel: "UCE",
    classLevel: "S4",
    subjectCode: "MTH",
    subjectName: "Mathematics",
    entry1: 1,
    entry2: 1,
    entry3: 0,
    entry4: 0,
    totalEntries: 2,
    schoolCode: "WAK26-0001",
    schoolName: "AMITY SECONDARY SCHOOL",
  },
  {
    id: "student-2",
    registrationNumber: "WAK/26-0001/002",
    studentName: "Emma Johnson",
    examLevel: "UCE",
    classLevel: "S4",
    subjectCode: "ENG",
    subjectName: "English Language",
    entry1: 1,
    entry2: 1,
    entry3: 1,
    entry4: 0,
    totalEntries: 3,
    schoolCode: "WAK26-0001",
    schoolName: "AMITY SECONDARY SCHOOL",
  },
  {
    id: "student-3",
    registrationNumber: "WAK/26-0002/001",
    studentName: "Michael Chen",
    examLevel: "UACE",
    classLevel: "S6",
    subjectCode: "GP",
    subjectName: "General Paper",
    entry1: 1,
    entry2: 0,
    entry3: 0,
    entry4: 0,
    totalEntries: 1,
    schoolCode: "WAK26-0002",
    schoolName: "Wakiso Hills College",
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
  const [subjects] = useState<Subject[]>(initialSubjects);

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
    const zone = initialZones.find((z) => z.id === newSchool.zone_id) || initialZones[0];

    const school: SchoolRecord = {
      id: String(nextNumber + 1),
      name: newSchool.name,
      code: schoolCode,
      email: newSchool.email,
      phone: newSchool.phone,
      address: newSchool.address,
      district: zone.district,
      zone: zone.name,
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

      const newStudent: StudentRecord = {
        id: `student-${Date.now()}`,
        registrationNumber,
        studentName: entry.studentName,
        examLevel: entry.examLevel,
        classLevel: entry.classLevel,
        subjectCode: entry.subjectCode,
        subjectName: entry.subjectName,
        entry1: entry.entry1,
        entry2: entry.entry2,
        entry3: entry.entry3,
        entry4: entry.entry4,
        totalEntries: entry.totalEntries,
        schoolCode: entry.schoolCode,
        schoolName,
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
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
