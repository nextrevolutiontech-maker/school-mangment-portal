import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";

export type UserRole = "admin" | "school";
export type SchoolStatus =
  | "pending"
  | "payment_submitted"
  | "verified"
  | "active";

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
  academicYear: string;
  status: SchoolStatus;
  registrationDate: string;
  students: number;
  amountPaid: string;
  paymentProof: string;
  activationCode: string;
  avatar?: string;
}

interface NewSchoolInput {
  name: string;
  email: string;
  phone: string;
  address: string;
}

interface AuthContextType {
  user: User | null;
  schools: SchoolRecord[];
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
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const adminUser: User = {
  id: "1",
  name: "WAKISSHA Administrator",
  email: "admin@wakissha.org",
  role: "admin",
  status: "active",
};

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
    academicYear: "2026",
    status: "active",
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
    academicYear: "2026",
    status: "verified",
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
    academicYear: "2026",
    status: "pending",
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
    academicYear: "2026",
    status: "payment_submitted",
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

    const school: SchoolRecord = {
      id: String(nextNumber + 1),
      name: newSchool.name,
      code: schoolCode,
      email: newSchool.email,
      phone: newSchool.phone,
      address: newSchool.address,
      district: "Wakiso",
      zone: "Central Zone",
      academicYear: "2026",
      status: "pending",
      registrationDate: new Date().toISOString().split("T")[0],
      students: 0,
      amountPaid: "0 UGX",
      paymentProof: "not-submitted.pdf",
      activationCode: "",
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

  return (
    <AuthContext.Provider
      value={{
        user,
        schools,
        login,
        logout,
        isAuthenticated: !!user,
        addSchool,
        submitSchoolDocuments,
        updateSchoolStatus,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
