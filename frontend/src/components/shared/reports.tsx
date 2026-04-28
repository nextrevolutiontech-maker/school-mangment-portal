import { useEffect, useMemo, useState } from "react";
import {
  FileSpreadsheet,
  FileText,
  Download,
  Loader2,
  School,
  Search,
  PlusCircle,
  Info,
  AlertTriangle,
  Clock,
  CheckCircle,
  FileQuestion,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Badge } from "../ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import { Alert, AlertDescription, AlertTitle } from "../ui/alert";
import { toast } from "sonner";
import { useAuth, isStudentFullyRegistered, mapSubjectCode } from "../auth-context";
import { jsPDF } from "jspdf";
import { utils as XLSXUtils, writeFile } from "xlsx";
import autoTable from "jspdf-autotable";
import { UACE_WPF_SECTIONS, UCE_WPF_SECTIONS, WPFSection } from "../../constants/wpf-schedules";
import { generateWPF_PDF } from "../../utils/wpf-pdf";

interface ReportsProps {
  onPageChange: (page: string) => void;
}

type EducationLevelFilter = "UCE" | "UACE";

type FormColumn = {
  key: string;
  label: string;
};

const formBaseColumns: FormColumn[] = [
  { key: "refNo", label: "REF" },
  { key: "schoolName", label: "NAME OF SCHOOL" },
  { key: "district", label: "DISTRICT" },
  { key: "zone", label: "ZONE / CENTRE" },
  { key: "candidatesRegistered", label: "CANDIDATES REGISTERED" },
  { key: "telephone", label: "TELEPHONE" },
];

const uaceSubjectColumns: FormColumn[] = [
  { key: "GP", label: "GP" },
  { key: "SUB_MATHS", label: "SUB MATHS" },
  { key: "SUB_ICT", label: "SUB ICT" },
  { key: "HIST", label: "HIST" },
  { key: "ENT", label: "ENT" },
  { key: "IRE", label: "IRE" },
  { key: "CRE", label: "CRE" },
  { key: "GEOG", label: "GEOG" },
  { key: "LIT", label: "LIT" },
  { key: "KISWA", label: "KISWA" },
  { key: "ART", label: "ART" },
  { key: "PHY", label: "PHY" },
  { key: "CHEM", label: "CHEM" },
  { key: "BIO", label: "BIO" },
  { key: "MATH", label: "MATH" },
  { key: "AGRIC", label: "AGRIC" },
  { key: "FN", label: "FN" },
  { key: "TD", label: "TD" },
  { key: "FRENCH", label: "FRENCH" },
  { key: "GERMAN", label: "GERMAN" },
  { key: "ARABIC", label: "ARABIC" },
  { key: "LUGANDA", label: "LUGANDA" },
  { key: "RUNY", label: "RUNY" },
  { key: "LUSOGA", label: "LUSOGA" },
];

const uceSubjectColumns: FormColumn[] = [
  { key: "ENG", label: "ENGLISH" },
  { key: "MATH", label: "MATHEMATICS" },
  { key: "BIO", label: "BIOLOGY" },
  { key: "CHEM", label: "CHEMISTRY" },
  { key: "PHY", label: "PHYSICS" },
  { key: "HIST", label: "HISTORY" },
  { key: "GEOG", label: "GEOGRAPHY" },
  { key: "CRE", label: "CRE" },
  { key: "IRE", label: "IRE" },
  { key: "CPS", label: "ICT" },
  { key: "FRENCH", label: "FRENCH" },
  { key: "GERMAN", label: "GERMAN" },
  { key: "ARABIC", label: "ARABIC" },
  { key: "LUGANDA", label: "LUGANDA" },
  { key: "RUNY", label: "RUNY" },
  { key: "LUSOGA", label: "LUSOGA" },
];

type FormRow = Record<string, string | number>;

type OfficialSubjectRow = {
  key: string;
  code: string;
  name: string;
};

type SubjectWiseReportRow = {
  key: string;
  code: string;
  subject: string;
  level: "UCE" | "UACE";
  totalSchools: number;
  totalStudents: number;
  totalEntries: number;
};

type StudentSubjectEntry = {
  subjectCode: string;
};

type StudentLike = {
  examLevel: "UCE" | "UACE";
  subjects?: StudentSubjectEntry[];
};

type AppendixRow = {
  code: string;
  key: string;
  name: string;
  section?: "FOREIGN LANGUAGES" | "LOCAL LANGUAGES";
};

const uceOfficialSubjectRows: OfficialSubjectRow[] = [
  { key: "ENG", code: "112", name: "ENGLISH" },
  { key: "LIT", code: "208", name: "LIT ENG" },
  { key: "KISWA", code: "336", name: "KISWAHILI" },
  { key: "CRE", code: "223", name: "CRE" },
  { key: "IRE", code: "225", name: "IRE" },
  { key: "HIST", code: "241", name: "HISTORY & POL. EDUC." },
  { key: "GEOG", code: "273", name: "GEOGRAPHY" },
  { key: "FRENCH", code: "314", name: "FRENCH" },
  { key: "GERMAN", code: "309", name: "GERMAN" },
  { key: "ARABIC", code: "337", name: "ARABIC" },
  { key: "LUGANDA", code: "335", name: "LUGANDA" },
  { key: "RUNY", code: "345", name: "RUNYANKOLE / RUKIGA" },
  { key: "LUSOGA", code: "355", name: "LUSOGA" },
  { key: "MATH", code: "456", name: "MATHEMATICS" },
  { key: "AGRIC", code: "527", name: "AGRICULTURE" },
  { key: "PHY", code: "535", name: "PHYSICS" },
  { key: "CHEM", code: "545", name: "CHEMISTRY" },
  { key: "BIO", code: "553", name: "BIOLOGY" },
  { key: "ART", code: "612", name: "ART & DESIGN" },
  { key: "FN", code: "662", name: "NUTRITION & FOOD TECH." },
  { key: "TD", code: "745", name: "TECH. & DESIGN" },
  { key: "CPS", code: "840", name: "ICT" },
  { key: "ENT", code: "845", name: "ENTREPRENEURSHIP" },
];

const uaceOfficialSubjectRows: OfficialSubjectRow[] = [
  { key: "GP", code: "101", name: "GENERAL PAPER" },
  { key: "SUB_MATHS", code: "475", name: "SUBSIDIARY MATHEMATICS" },
  { key: "SUB_ICT", code: "610", name: "SUBSIDIARY ICT" },
  { key: "HIST", code: "210", name: "HISTORY" },
  { key: "ECON", code: "220", name: "ECONOMICS" },
  { key: "ENT", code: "268", name: "ENTREPRENEURSHIP" },
  { key: "IRE", code: "224", name: "IRE" },
  { key: "CRE", code: "221", name: "CRE" },
  { key: "GEOG", code: "230", name: "GEOGRAPHY" },
  { key: "LIT", code: "220", name: "LITERATURE IN ENGLISH" },
  { key: "KISWA", code: "340", name: "KISWAHILI" },
  { key: "ART", code: "615", name: "FINE ART" },
  { key: "PHY", code: "525", name: "PHYSICS" },
  { key: "CHEM", code: "535", name: "CHEMISTRY" },
  { key: "BIO", code: "545", name: "BIOLOGY" },
  { key: "MATH", code: "475", name: "MATHEMATICS" },
  { key: "AGRIC", code: "515", name: "AGRICULTURE" },
  { key: "FN", code: "635", name: "FOOD & NUTRITION" },
  { key: "TD", code: "680", name: "TECHNICAL DRAWING" },
  { key: "FRENCH", code: "351", name: "FRENCH" },
  { key: "GERMAN", code: "358", name: "GERMAN" },
  { key: "ARABIC", code: "361", name: "ARABIC" },
  { key: "LUGANDA", code: "380", name: "LUGANDA" },
  { key: "RUNY", code: "383", name: "RUNYAKITARA" },
  { key: "LUSOGA", code: "386", name: "LUSOGA" },
];

const appendixUCE: AppendixRow[] = [
  { code: "112", key: "ENG", name: "ENGLISH LANGUAGE" },
  { code: "208", key: "LIT", name: "LIT ENG" },
  { code: "336", key: "KISWA", name: "KISWAHILI" },
  { code: "223", key: "CRE", name: "CRE" },
  { code: "225", key: "IRE", name: "IRE" },
  { code: "241", key: "HIST", name: "HISTORY & POL. EDUC." },
  { code: "273", key: "GEOG", name: "GEOGRAPHY" },
  { code: "", key: "sec-foreign", name: "", section: "FOREIGN LANGUAGES" },
  { code: "301", key: "LATIN", name: "LATIN" },
  { code: "309", key: "GERMAN", name: "GERMAN" },
  { code: "314", key: "FRENCH", name: "FRENCH" },
  { code: "337", key: "ARABIC", name: "ARABIC" },
  { code: "396", key: "CHINESE", name: "CHINESE" },
  { code: "", key: "sec-local", name: "", section: "LOCAL LANGUAGES" },
  { code: "335", key: "LUGANDA", name: "LUGANDA" },
  { code: "345", key: "RUNY", name: "RUNYANKOLE / RUKIGA" },
  { code: "385", key: "RUNYORO", name: "RUNYORO/RUTOORO" },
  { code: "315", key: "LEB", name: "LEB LANGO" },
  { code: "355", key: "LUSOGA", name: "LUSOGA" },
  { code: "365", key: "ATESO", name: "ATESO" },
  { code: "456", key: "MATH", name: "MATHEMATICS" },
  { code: "527", key: "AGRIC", name: "AGRICULTURE" },
  { code: "535", key: "PHY", name: "PHYSICS" },
  { code: "545", key: "CHEM", name: "CHEMISTRY" },
  { code: "553", key: "BIO", name: "BIOLOGY" },
  { code: "555", key: "PE", name: "PHYSICAL EDUC." },
  { code: "612", key: "ART", name: "ART & DESIGN" },
  { code: "662", key: "FN", name: "NUTRITION & FOOD TECH." },
  { code: "745", key: "TD", name: "TECH. & DESIGN" },
  { code: "840", key: "CPS", name: "ICT" },
  { code: "845", key: "ENT", name: "ENTREPRENEURSHIP" },
];

const appendixUACE: AppendixRow[] = [
  { code: "S101", key: "GP", name: "GP" },
  { code: "P210", key: "HIST", name: "HISTORY" },
  { code: "P220", key: "ECON", name: "ECONOMICS" },
  { code: "P230", key: "ENT", name: "ENTREPRE" },
  { code: "P235", key: "IRE", name: "IRE" },
  { code: "P245", key: "CRE", name: "CRE" },
  { code: "P250", key: "GEOG", name: "GEOGRAPHY" },
  { code: "P310", key: "LIT", name: "LIT. IN ENGLISH" },
  { code: "P320", key: "KISWA", name: "KISWAHILI" },
  { code: "", key: "sec-foreign-uace", name: "", section: "FOREIGN LANGUAGES" },
  { code: "P330", key: "FRENCH", name: "FRENCH" },
  { code: "P340", key: "GERMAN", name: "GERMAN" },
  { code: "P370", key: "ARABIC", name: "ARABIC" },
  { code: "", key: "sec-local-uace", name: "", section: "LOCAL LANGUAGES" },
  { code: "P360", key: "LUGANDA", name: "LUGANDA" },
  { code: "P364", key: "RUNY", name: "RUNYANKOLE / RUKIGA" },
  { code: "P366", key: "LUSOGA", name: "LUSOGA" },
  { code: "P425", key: "MATH", name: "MATHS" },
  { code: "P510", key: "PHY", name: "PHYSICS" },
  { code: "P515", key: "AGRIC", name: "AGRIC" },
  { code: "P525", key: "CHEM", name: "CHEMISTRY" },
  { code: "P530", key: "BIO", name: "BIOLOGY" },
  { code: "P615", key: "ART", name: "ART" },
  { code: "P640", key: "FN", name: "FOODS & NUTRITION" },
  { code: "S475", key: "SUB_MATHS", name: "SUB MATHS" },
  { code: "P720", key: "TD", name: "TECH. DRAWING" },
  { code: "S850", key: "SUB_ICT", name: "SUB COMPUTER" },
];

function buildSubjectLevelKey(subjectCode: string, level: "UCE" | "UACE") {
  return `${level}:${mapSubjectCode(subjectCode)}`;
}

function getOfficialSubjectRows(level: "UACE" | "UCE") {
  return level === "UACE" ? uaceOfficialSubjectRows : uceOfficialSubjectRows;
}

function getOfficialSubjectName(subjectCode: string, level: "UCE" | "UACE") {
  return (
    getOfficialSubjectRows(level).find((subject) => subject.key === mapSubjectCode(subjectCode))?.name ??
    subjectCode
  );
}

function getSummarySubjectSections(level: "UCE" | "UACE") {
  if (level === "UACE") {
    return [
      {
        title: "Core Subjects",
        keys: ["GP", "SUB_MATHS", "SUB_ICT", "HIST", "ENT", "CRE", "IRE", "GEOG", "LIT"],
      },
      {
        title: "Sciences",
        keys: ["MATH", "PHY", "CHEM", "BIO", "AGRIC", "FN", "TD", "ART"],
      },
      {
        title: "Languages",
        keys: ["KISWA", "FRENCH", "GERMAN", "ARABIC", "LUGANDA", "RUNY", "LUSOGA"],
      },
    ] as const;
  }

  return [
    {
      title: "Core Subjects",
      keys: ["ENG", "MATH", "HIST", "GEOG", "CRE", "IRE", "CPS", "ENT", "LIT"],
    },
    {
      title: "Sciences",
      keys: ["BIO", "CHEM", "PHY", "AGRIC", "FN", "TD", "ART"],
    },
    {
      title: "Languages",
      keys: ["KISWA", "FRENCH", "GERMAN", "ARABIC", "LUGANDA", "RUNY", "LUSOGA"],
    },
  ] as const;
}

function getSubjectStudentCount(
  studentsList: StudentLike[],
  subjectKey: string,
  level: "UCE" | "UACE",
) {
  return studentsList.reduce((total, student) => {
    if (student.examLevel !== level) return total;
    const hasSubject = student.subjects?.some(
      (subject) => mapSubjectCode(subject.subjectCode) === subjectKey,
    );
    return total + (hasSubject ? 1 : 0);
  }, 0);
}

function formatPaperCell(value: unknown) {
  const numeric = Number(value ?? 0);
  return numeric > 0 ? String(numeric) : "-";
}

function numberToWords(num: number): string {
  if (num === 0) return "Zero";

  const ones = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
  const tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];
  const scales = ["", "Thousand", "Million", "Billion"];

  function convertGroup(n: number): string {
    let res = "";
    if (n >= 100) {
      res += ones[Math.floor(n / 100)] + " Hundred ";
      n %= 100;
    }
    if (n >= 20) {
      res += tens[Math.floor(n / 10)] + " ";
      n %= 10;
    }
    if (n > 0) {
      res += ones[n] + " ";
    }
    return res.trim();
  }

  let result = "";
  let scaleIndex = 0;

  while (num > 0) {
    const group = num % 1000;
    if (group > 0) {
      const groupWords = convertGroup(group);
      result = groupWords + (scales[scaleIndex] ? " " + scales[scaleIndex] : "") + (result ? ", " + result : "");
    }
    num = Math.floor(num / 1000);
    scaleIndex++;
  }

  return result.trim() + " Shillings Only";
}

function getPaperNumber(paper: string | undefined) {
  if (!paper) return "-";
  const match = paper.match(/\d+/);
  return match?.[0] ?? "-";
}

function getAppendixRows(level: "UCE" | "UACE") {
  return level === "UCE" ? appendixUCE : appendixUACE;
}

function buildStudentSubjectsDisplay(
  student: {
    examLevel: "UCE" | "UACE";
    subjects?: Array<{
      subjectCode: string;
      subjectStandardCode?: string;
      subjectName?: string;
      paper?: string;
    }>;
  },
  subjectLookup: Map<string, { standardCode?: string; name?: string }>,
) {
  const seen = new Set<string>();
  const formattedSubjects: string[] = [];

  (student.subjects ?? []).forEach((subj) => {
    const lookupKey = `${student.examLevel}:${subj.subjectCode.toUpperCase()}`;
    const resolvedCode =
      subj.subjectStandardCode ??
      subjectLookup.get(lookupKey)?.standardCode ??
      subj.subjectCode;
    const resolvedName =
      subj.subjectName ||
      subjectLookup.get(lookupKey)?.name ||
      subj.subjectCode;
    const paperNumber = getPaperNumber(subj.paper);
    const descriptor = `${resolvedName} (${resolvedCode}/${paperNumber})`;

    if (!seen.has(descriptor)) {
      seen.add(descriptor);
      formattedSubjects.push(descriptor);
    }
  });

  return formattedSubjects.join(", ");
}

function getStatusBadge(status: string) {
  const variants = {
    verified: "info",
    pending: "warning",
    active: "success",
    payment_submitted: "payment",
  } as const;

  return (
    <Badge variant={variants[status as keyof typeof variants] || "secondary"}>
      {status.replace("_", " ")}
    </Badge>
  );
}

export function Reports({ onPageChange }: ReportsProps) {
  const { user, schools, students, subjects, zones, invoices } = useAuth();
  const isAdmin = user?.role === "admin";
  const scopedSchools =
    user?.role === "school"
      ? schools.filter((school) => school.code === user.schoolCode)
      : schools;
  const scopedStudents =
    user?.role === "school"
      ? students.filter((student) => student.schoolCode === user.schoolCode)
      : students;

  const schoolInvoices = invoices.filter((inv) => inv.schoolCode === user?.schoolCode);
  const hasCompletedRegistration = scopedStudents.some((student) => isStudentFullyRegistered(student, subjects));
  const hasGeneratedInvoice = schoolInvoices.length > 0;
  const [selectedSchool, setSelectedSchool] = useState("all");
  const [selectedZone, setSelectedZone] = useState("all");
  const [schoolSearch, setSchoolSearch] = useState("");
  const [districtSearch, setDistrictSearch] = useState("");
  const [telephoneSearch, setTelephoneSearch] = useState("");
  const [singleSchoolSearch, setSingleSchoolSearch] = useState("");
  const [selectedSubjectCode, setSelectedSubjectCode] = useState("all");
  const [studentTypeFilter, setStudentTypeFilter] = useState<"all" | "original" | "additional">("all");
  const [subjectWiseLevelFilter, setSubjectWiseLevelFilter] = useState<"UCE" | "UACE">("UCE");
  const [selectedSchoolReportLevel, setSelectedSchoolReportLevel] = useState<"UCE" | "UACE">("UCE");
  const [exportingKey, setExportingKey] = useState<string | null>(null);
  const [educationLevelFilter, setEducationLevelFilter] = useState<EducationLevelFilter>("UCE");

  const subjectLookup = useMemo(
    () =>
      new Map(
        subjects.map((subject) => [
          `${subject.educationLevel}:${subject.code.toUpperCase()}`,
          subject,
        ]),
      ),
    [subjects],
  );

  const uniqueZones = useMemo(() => {
    const zonesSet = new Set<string>();
    scopedSchools.forEach((school) => {
      if (school.zone) zonesSet.add(school.zone);
    });
    return Array.from(zonesSet).sort();
  }, [scopedSchools]);

  const filteredStudents = useMemo(() => {
    // Get schools in the selected zone to filter students
    const schoolsInZone = selectedZone === "all" 
      ? null 
      : new Set(scopedSchools.filter(s => s.zone === selectedZone).map(s => s.code));

    return scopedStudents.filter((student) => {
      // Filter by Zone (via schoolCode)
      if (schoolsInZone && !schoolsInZone.has(student.schoolCode)) return false;

      // Basic student type filter
      const matchesType = 
        studentTypeFilter === "all" || 
        (studentTypeFilter === "original" && !student.isAdditional) || 
        (studentTypeFilter === "additional" && student.isAdditional);
      
      if (!matchesType) return false;

      // Only include fully registered students in reports
      return isStudentFullyRegistered(student, subjects);
    });
  }, [scopedStudents, studentTypeFilter, subjects, selectedZone, scopedSchools]);

  useEffect(() => {
    if (user?.role === "school" && user.schoolCode) {
      setSelectedSchool(user.schoolCode);
    }
  }, [user?.role, user?.schoolCode]);

  const consolidatedRows = useMemo<FormRow[]>(() => {
    let filteredByZone = selectedZone === "all" 
      ? scopedSchools 
      : scopedSchools.filter(school => school.zone === selectedZone);

    if (schoolSearch) {
      const search = schoolSearch.toLowerCase();
      filteredByZone = filteredByZone.filter(school => 
        school.name.toLowerCase().includes(search) || 
        school.code.toLowerCase().includes(search)
      );
    }

    if (districtSearch) {
      const search = districtSearch.toLowerCase();
      filteredByZone = filteredByZone.filter(school => 
        school.district.toLowerCase().includes(search)
      );
    }

    if (telephoneSearch) {
      const search = telephoneSearch.toLowerCase();
      filteredByZone = filteredByZone.filter(school => 
        (school.phone && school.phone.toLowerCase().includes(search)) ||
        (school.telephone && school.telephone.toLowerCase().includes(search))
      );
    }

    // Include all schools in the zone, regardless of whether they have students for this level.
    // This ensures a true consolidated report for all schools in the zone/centre.
    return filteredByZone.map((school) => {
      const schoolStudents = filteredStudents.filter(
        (student) =>
          student.schoolCode === school.code &&
          student.examLevel === educationLevelFilter,
      );
      
      const subjectColumns =
        educationLevelFilter === "UACE" ? uaceSubjectColumns : uceSubjectColumns;

      // Calculate total students per subject (not entries or papers)
      const subjectCounts = schoolStudents.reduce<
        Record<string, number>
      >((acc, student) => {
        // For each subject the student is taking, increment the count
        student.subjects?.forEach((subj) => {
          const key = mapSubjectCode(subj.subjectCode);
          acc[key] = (acc[key] || 0) + 1;
        });
        return acc;
      }, {});

      const row: FormRow = {
        refNo: school.code,
        schoolName: school.name,
        district: school.district,
        zone: school.zone,
        candidatesRegistered: schoolStudents.length,
        telephone: school.phone,
      };

      // Add subject columns with student counts
      subjectColumns.forEach((subject) => {
        row[subject.key] = subjectCounts[subject.key] ?? 0;
      });

      return row;
    });
  }, [scopedSchools, filteredStudents, educationLevelFilter, selectedZone, schoolSearch]);

  const subjectWiseData = useMemo<SubjectWiseReportRow[]>(
    () =>
      getOfficialSubjectRows(subjectWiseLevelFilter).map((subject) => {
        const subjectStudents = new Set<string>();
        const subjectSchools = new Set<string>();
        let totalEntries = 0;

        filteredStudents.forEach((student) => {
          if (student.examLevel !== subjectWiseLevelFilter) return;

          const matchingEntries =
            student.subjects?.filter(
              (entry) => mapSubjectCode(entry.subjectCode) === subject.key,
            ) ?? [];

          if (matchingEntries.length > 0) {
            subjectStudents.add(student.id);
            subjectSchools.add(student.schoolCode);
            totalEntries += matchingEntries.length;
          }
        });

        return {
          key: buildSubjectLevelKey(subject.key, subjectWiseLevelFilter),
          code: subject.code,
          subject: subject.name,
          level: subjectWiseLevelFilter,
          totalSchools: subjectSchools.size,
          totalStudents: subjectStudents.size,
          totalEntries,
        };
      }),
    [filteredStudents, subjectWiseLevelFilter],
  );

  const subjectStudentsList = useMemo(() => {
    if (selectedSubjectCode === "all") return filteredStudents;
    return filteredStudents.filter((student) =>
      student.subjects?.some(
        (subject) => buildSubjectLevelKey(subject.subjectCode, student.examLevel) === selectedSubjectCode,
      ),
    );
  }, [filteredStudents, selectedSubjectCode]);

  const selectedSchoolData =
    selectedSchool !== "all"
      ? scopedSchools.find((school) => school.code === selectedSchool)
      : undefined;

  const selectedSchoolAvailableLevels = useMemo(() => {
    if (!selectedSchoolData) return [] as Array<"UCE" | "UACE">;

    const levels = new Set<"UCE" | "UACE">();
    filteredStudents.forEach((student) => {
      if (student.schoolCode === selectedSchoolData.code) {
        levels.add(student.examLevel);
      }
    });

    return Array.from(levels).sort();
  }, [selectedSchoolData, filteredStudents]);

  useEffect(() => {
    if (selectedSchoolAvailableLevels.length === 0) return;
    if (!selectedSchoolAvailableLevels.includes(selectedSchoolReportLevel)) {
      setSelectedSchoolReportLevel(selectedSchoolAvailableLevels[0]);
    }
  }, [selectedSchoolAvailableLevels, selectedSchoolReportLevel]);

  const selectedSchoolProfile = useMemo(() => {
    if (!selectedSchoolData) return undefined;
    const schoolStudents = filteredStudents.filter(
      (student) =>
        student.schoolCode === selectedSchoolData.code &&
        student.examLevel === selectedSchoolReportLevel,
    );
    return {
      totalStudents: schoolStudents.length,
      subjectsRegistered: new Set(
        schoolStudents.flatMap((student) => student.subjects?.map((s) => mapSubjectCode(s.subjectCode)) ?? []),
      ).size,
      lastUpdated: new Date().toLocaleDateString(),
    };
  }, [selectedSchoolData, filteredStudents, selectedSchoolReportLevel]);

  const buildSingleSchoolRow = (
    schoolCode: string,
    level: "UACE" | "UCE",
  ): FormRow | undefined => {
    const school = scopedSchools.find((record) => record.code === schoolCode);
    if (!school) return undefined;

    const schoolStudents = filteredStudents.filter(
      (student) => student.schoolCode === schoolCode && student.examLevel === level,
    );
    const subjectColumns = level === "UACE" ? uaceSubjectColumns : uceSubjectColumns;

    // Calculate total students per subject
    const subjectCounts = schoolStudents.reduce<
      Record<string, number>
    >((acc, student) => {
      student.subjects?.forEach((subj) => {
        const key = mapSubjectCode(subj.subjectCode);
        acc[key] = (acc[key] || 0) + 1;
      });
      return acc;
    }, {});

    const row: FormRow = {
      refNo: school.code,
      schoolName: school.name,
      district: school.district,
      zone: school.zone,
      registeredSubjects: new Set(
        schoolStudents.flatMap((student) => student.subjects?.map((s) => s.subjectCode) ?? [])
      ).size,
      telephone: school.phone,
    };

    subjectColumns.forEach((subject) => {
      row[subject.key] = subjectCounts[subject.key] ?? 0;
    });

    return row;
  };

  const summaryCards = isAdmin ? [
    {
      label: "Registered Schools",
      value: scopedSchools.length,
      className: "border-l-red-600",
      valueClass: "text-slate-900",
    },
    {
      label: "Total Candidates",
      value: filteredStudents.length,
      className: "border-l-amber-500",
      valueClass: "text-slate-900",
    },
    {
      label: "Active Schools",
      value: scopedSchools.filter((school) => school.status === "active").length,
      className: "border-l-green-500",
      valueClass: "text-slate-900",
    },
  ] : [
    {
      label: "Total Candidates",
      value: filteredStudents.length,
      className: "border-l-blue-600",
      valueClass: "text-slate-900",
    },
    {
      label: "Subjects Registered",
      value: new Set(filteredStudents.flatMap(s => s.subjects?.map(subj => mapSubjectCode(subj.subjectCode)) ?? [])).size,
      className: "border-l-orange-500",
      valueClass: "text-slate-900",
    },
    {
      label: "Total Papers",
      value: filteredStudents.reduce((acc, s) => acc + (s.subjects?.length ?? 0), 0),
      className: "border-l-indigo-500",
      valueClass: "text-slate-900",
    },
  ];

  const buildExportKey = (format: "pdf" | "excel", reportType: string) =>
    `${reportType}-${format}`;

  const isExporting = (format: "pdf" | "excel", reportType: string) =>
    exportingKey === buildExportKey(format, reportType);

  const computeFeeSummary = (rows: FormRow[]) => {
    const totalStudents = rows.reduce((sum, row) => sum + Number(row.registeredSubjects || 0), 0);
    const schoolFee = 25_000;
    const studentFee = 27_000 * totalStudents;
    const markingFee = rows.reduce((sum, row) => {
      const subjectCount = Object.keys(row).filter(key =>
        uaceSubjectColumns.some(col => col.key === key) ||
        uceSubjectColumns.some(col => col.key === key)
      ).reduce((acc, key) => acc + Number(row[key] || 0), 0);
      return sum + subjectCount * 100;
    }, 0);
    const totalAmount = schoolFee + studentFee + markingFee;

    return { schoolFee, studentFee, markingFee, totalAmount, totalStudents };
  };

  const buildTemplateTable = (rows: FormRow[], subjectsColumns: FormColumn[]) =>
    rows.map((row) => [
      row.refNo,
      row.schoolName,
      row.district,
      row.zone,
      row.candidatesRegistered,
      row.telephone,
      ...subjectsColumns.map((subject) => row[subject.key] ?? 0),
    ]);



  const generateAppendixSchoolPDF = (
    level: "UACE" | "UCE",
    fileName: string,
    schoolContext: {
      name: string;
      code: string;
      district: string;
      zone: string;
      telephone: string;
      contactPerson?: string;
      contactEmail?: string;
      academicYear?: string;
      totalCandidates?: number;
    },
  ) => {
    const schoolStudents = filteredStudents.filter(
      (student) => student.schoolCode === schoolContext.code && student.examLevel === level,
    );
    const rows = getAppendixRows(level);
    const subjectRows = rows.filter((row) => !row.section);

    const stats = new Map<
      string,
      { entries: Set<string>; p1: Set<string>; p2: Set<string>; p3: Set<string>; p4: Set<string> }
    >();
    subjectRows.forEach((row) => {
      stats.set(row.key, {
        entries: new Set<string>(),
        p1: new Set<string>(),
        p2: new Set<string>(),
        p3: new Set<string>(),
        p4: new Set<string>(),
      });
    });

    schoolStudents.forEach((student) => {
      const studentKey = student.registrationNumber || student.id;
      (student.subjects ?? []).forEach((subject) => {
        const lookupKey = `${student.examLevel}:${subject.subjectCode.toUpperCase()}`;
        const standardCode =
          subject.subjectStandardCode ??
          subjectLookup.get(lookupKey)?.standardCode ??
          subject.subjectCode;
        const paper = getPaperNumber(subject.paper);

        const candidateKeys =
          level === "UACE"
            ? [
                standardCode,
                standardCode === "475" ? "475S" : "",
                standardCode === "610" ? "850" : "",
                standardCode === "680" ? "720" : "",
                standardCode === "361" ? "370" : "",
                standardCode === "380" ? "360" : "",
                standardCode === "383" ? "364" : "",
                standardCode === "386" ? "366" : "",
                standardCode === "210" ? "210" : "",
                standardCode === "221" ? "245" : "",
                standardCode === "224" ? "235" : "",
                standardCode === "230" ? "250" : "",
                standardCode === "220" ? "310" : "",
                standardCode === "340" ? "320" : "",
                standardCode === "351" ? "330" : "",
                standardCode === "358" ? "340" : "",
                standardCode === "615" ? "615" : "",
                standardCode === "635" ? "640" : "",
              ].filter(Boolean)
            : [standardCode];

        candidateKeys.forEach((key) => {
          const rowStats = stats.get(key);
          if (!rowStats) return;
          rowStats.entries.add(studentKey);
          if (paper === "1") rowStats.p1.add(studentKey);
          if (paper === "2") rowStats.p2.add(studentKey);
          if (paper === "3") rowStats.p3.add(studentKey);
          if (paper === "4") rowStats.p4.add(studentKey);
        });
      });
    });

    const totalCandidates = schoolContext.totalCandidates ?? schoolStudents.length;
    const totalPaperRegistered = schoolStudents.reduce(
      (sum, student) => sum + (student.subjects?.length ?? 0),
      0,
    );
    const schoolRegFee = 25_000;
    const studentFeeRate = 27_000;
    const studentFeeTotal = totalCandidates * studentFeeRate;
    const lateRegFee = 0;
    const artsCodes = new Set(level === "UACE" ? ["615", "640", "310", "320", "330", "340", "370", "360", "364", "366"] : ["612", "662", "208", "336", "314", "309", "337", "335", "345", "355", "365"]);
    let artsPapers = 0;
    let sciencesPapers = 0;
    stats.forEach((value, key) => {
      const count = value.p1.size + value.p2.size + value.p3.size + value.p4.size;
      if (artsCodes.has(key)) artsPapers += count;
      else sciencesPapers += count;
    });
    const artsMarking = artsPapers * 100;
    const sciencesMarking = sciencesPapers * 100;
    const answerBookletRate = 25_000;
    const answerBookletQty = 0;
    const answerBookletTotal = answerBookletRate * answerBookletQty;
    const totalAmount =
      schoolRegFee +
      studentFeeTotal +
      artsMarking +
      sciencesMarking +
      answerBookletTotal;

    const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    const pageWidth = pdf.internal.pageSize.getWidth();
    const margin = 2;
    let y = 8;

    pdf.setFont("times", "bold");
    pdf.setFontSize(6.8);
    pdf.text("WAKISSHA JOINT MOCK EXAMINATIONS", pageWidth / 2, y, { align: "center" });
    pdf.text(level === "UACE" ? "Appendix 2" : "Appendix 1", pageWidth - 3, y - 3, {
      align: "right",
    });
    y += 3;

    pdf.setFont("times", "normal");
    pdf.setFontSize(6.6);
    pdf.text(
      `SUMMARY OF ENTRIES ${level}: YEAR ${schoolContext.academicYear ?? "2026"}        TOTAL CANDIDATES: ${totalCandidates}`,
      margin,
      y,
    );
    y += 3;
    pdf.text(`NAME OF SCHOOL: ................................................................................. REF No. .......`, margin, y);
    y += 3;
    pdf.text(`DISTRICT...................... ZONE:......................... TELEPHONE:............................`, margin, y);
    y += 3;
    pdf.text(`NAME & SIGN OF HEAD.....................................................................................`, margin, y);
    y += 3;
    pdf.text(`CONTACT E-MAIL ADDRESS: .................................................................................`, margin, y);
    y += 3.5;

    pdf.setFont("times", "bold");
    pdf.setFontSize(11);
    pdf.text("SUBJECT", 12, y);
    pdf.text("P      A      P      E      R      S", 70, y);
    y += 1.5;

    autoTable(pdf, {
      startY: y,
      margin: { left: margin, right: margin },
      tableWidth: pageWidth - margin * 2,
      head: [["CODE", "NAME", "ENTRIES", "1", "2", "3", "4"]],
      body: rows.map((row) => {
        if (row.section) {
          return ["", row.section, "", "", "", "", ""];
        }
        const rowStats = stats.get(row.key);
        return [
          row.code,
          row.name,
          String(rowStats?.entries.size ?? 0),
          String(rowStats?.p1.size ?? 0),
          String(rowStats?.p2.size ?? 0),
          String(rowStats?.p3.size ?? 0),
          String(rowStats?.p4.size ?? 0),
        ];
      }),
      theme: "grid",
      styles: {
        font: "times",
        fontSize: 6.3,
        lineWidth: 0.25,
        lineColor: [0, 0, 0],
        textColor: [0, 0, 0],
        cellPadding: { top: 0.8, right: 1, bottom: 0.8, left: 1 },
      },
      headStyles: {
        fillColor: [255, 255, 255],
        textColor: [0, 0, 0],
        lineWidth: 0.25,
        lineColor: [0, 0, 0],
        fontStyle: "bold",
      },
      columnStyles: {
        0: { cellWidth: 14, halign: "left", fontStyle: "bold" },
        1: { cellWidth: 65 },
        2: { cellWidth: 18, halign: "center", fontStyle: "bold" },
        3: { cellWidth: 16, halign: "center" },
        4: { cellWidth: 16, halign: "center" },
        5: { cellWidth: 16, halign: "center" },
        6: { cellWidth: 16, halign: "center" },
      },
      didParseCell: (hookData) => {
        const row = rows[hookData.row.index];
        if (hookData.section === "body" && row?.section) {
          hookData.cell.styles.fontStyle = "bold";
          if (hookData.column.index !== 1) hookData.cell.text = [""];
        }
      },
    });

    const summaryStartY = ((pdf as any).lastAutoTable?.finalY ?? y) - 0.4;
    
    // Finance section removed as per client requirements. 
    // Finance must come ONLY from Make Payments module.

    pdf.save(`${fileName}.pdf`);
    toast.success(`${level} official form exported successfully`);
  };

  const generateOfficialFormPDF = (
    level: "UACE" | "UCE",
    rows: FormRow[],
    fileName: string,
    schoolContext?: {
      name: string;
      code: string;
      district: string;
      zone: string;
      telephone: string;
      contactPerson?: string;
      contactDesignation?: string;
      contactEmail?: string;
      academicYear?: string;
      totalCandidates?: number;
    },
  ) => {
    try {
      const pdf = new jsPDF({
        orientation: "landscape",
        unit: "mm",
        format: "a4",
      });

      const pageWidth = pdf.internal.pageSize.getWidth();
      const margin = 10;
      let yPos = 10;

      // Title - Simple, no styling
      pdf.setFontSize(12);
      pdf.setFont("helvetica", "bold");
      pdf.text(`WAKISSHA JOINT MOCK EXAMINATIONS ${level} - 2026`, margin, yPos);
      yPos += 6;

      // School details header (if single school context)
      if (schoolContext) {
        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(10);
        pdf.text("SCHOOL INFORMATION", margin, yPos);
        yPos += 4;

        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(9);
        pdf.text(`School: ${schoolContext.name}`, margin + 2, yPos);
        yPos += 3;
        pdf.text(`Code: ${schoolContext.code} | District: ${schoolContext.district}`, margin + 2, yPos);
        yPos += 3;
        pdf.text(`Zone: ${schoolContext.zone} | Phone: ${schoolContext.telephone}`, margin + 2, yPos);
        yPos += 3;
        if (schoolContext.contactEmail) {
          pdf.text(`Email: ${schoolContext.contactEmail}`, margin + 2, yPos);
          yPos += 3;
        }
        const totalCandidates = schoolContext.totalCandidates ?? rows.reduce((sum, row) => sum + Number(row.candidatesRegistered || 0), 0);
        pdf.text(`Total Candidates: ${totalCandidates}`, margin + 2, yPos);
        yPos += 5;
      }

      // Get subject list and build data for table
      const subjectsColumns = level === "UACE" ? uaceSubjectColumns : uceSubjectColumns;

      // BUILD TABLE DIRECTLY FROM ROWS (which already have correct subject counts from UI)
      // Do NOT recalculate - use the pre-calculated data
      const tableHeaders = [
        ...formBaseColumns.map((col) => col.label),
        ...subjectsColumns.map((col) => col.label),
      ];

      // Build table rows: each row is a school with its subject counts
      const tableData = rows.map((row) => [
        row.refNo,
        row.schoolName,
        row.district,
        row.zone,
        row.candidatesRegistered,
        row.telephone,
        ...subjectsColumns.map((subject) => String(row[subject.key] ?? 0)),
      ]);

      // Add Totals Row - Aligned with the UI table structure
      const totalsRow = [
        "",
        "",
        "",
        "TOTALS",
        String(rows.reduce((sum, r) => sum + (Number(r.candidatesRegistered) || 0), 0)),
        "-",
        ...subjectsColumns.map((subj) => 
          String(rows.reduce((sum, r) => sum + (Number(r[subj.key]) || 0), 0))
        )
      ];
      tableData.push(totalsRow);

      // BLACK & WHITE TABLE ONLY - No colors, no styling
      // Calculate dynamic column widths to fit all subjects on landscape page
      const usableWidth = pageWidth - (margin * 2);
      const totalCols = tableHeaders.length;
      
      // Allocate proportional widths
      // Base columns: REF(12), School(45), District(20), Zone(25), Candidates(15), Phone(20)
      const columnStylesObj: Record<number, any> = {};
      columnStylesObj[0] = { cellWidth: 12, halign: "center", fontSize: 6.5 };   // REF
      columnStylesObj[1] = { cellWidth: 45, halign: "left", fontSize: 6.5 };     // NAME OF SCHOOL
      columnStylesObj[2] = { cellWidth: 20, halign: "center", fontSize: 6.5 };   // DISTRICT
      columnStylesObj[3] = { cellWidth: 25, halign: "center", fontSize: 6.5 };   // ZONE / CENTRE
      columnStylesObj[4] = { cellWidth: 15, halign: "center", fontSize: 6.5 };   // CANDIDATES REGISTERED
      columnStylesObj[5] = { cellWidth: 20, halign: "center", fontSize: 6.5 };   // TELEPHONE
      
      const baseWidthUsed = 12 + 45 + 20 + 25 + 15 + 20;
      const remainingWidth = usableWidth - baseWidthUsed;
      const numSubjectCols = totalCols - 6;
      const subjectColWidth = numSubjectCols > 0 ? remainingWidth / numSubjectCols : 10;

      for (let i = 6; i < totalCols; i++) {
        columnStylesObj[i] = { cellWidth: subjectColWidth, halign: "center", fontSize: 6 };
      }

      autoTable(pdf, {
        head: [tableHeaders],
        body: tableData,
        startY: yPos,
        margin: { left: margin, right: margin },
        columnStyles: columnStylesObj,
        headStyles: {
          fillColor: [255, 255, 255],  // WHITE - no color
          textColor: [0, 0, 0],        // BLACK text
          lineWidth: 0.3,
          lineColor: [0, 0, 0],        // BLACK borders only
          fontSize: 6,
          fontStyle: "bold",
          halign: "center",
          valign: "middle",
          padding: 0.8,
        },
        bodyStyles: {
          lineWidth: 0.3,
          lineColor: [0, 0, 0],        // BLACK borders only
          fontSize: 6,
          textColor: [0, 0, 0],        // BLACK text
          padding: 0.8,
          fillColor: [255, 255, 255], // WHITE background - no styling
          halign: "center",
        },
        alternateRowStyles: {
          fillColor: [255, 255, 255], // WHITE - NO alternating colors
          lineColor: [0, 0, 0],
          textColor: [0, 0, 0],
        },
        didParseCell: (data) => {
          // Style totals row
          if (data.row.index === tableData.length - 1) {
            data.cell.styles.fontStyle = "bold";
            if (data.column.index === 3) {
              data.cell.styles.halign = "right";
            }
          }
        }
      });

      // Signature section
      const finalY = (pdf as any).lastAutoTable?.finalY ?? 150;
      let sigY = finalY + 15;

      if (schoolContext && schoolContext.contactPerson) {
        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(9);
        pdf.text("_________________________", margin, sigY);
        sigY += 4;
        pdf.text(`${schoolContext.contactPerson}`, margin, sigY);
        if (schoolContext.contactDesignation) {
          sigY += 3;
          pdf.text(`(${schoolContext.contactDesignation})`, margin, sigY);
        }
      }

      pdf.save(`${fileName}.pdf`);
      toast.success(`${level} official form exported successfully`);
    } catch (error) {
      toast.error("Failed to export PDF");
      console.error(error);
    }
  };

  const generateUACEFormPDF = (rows: FormRow[], fileName: string) =>
    generateOfficialFormPDF("UACE", rows, fileName);

  const generateUCEFormPDF = (rows: FormRow[], fileName: string) =>
    generateOfficialFormPDF("UCE", rows, fileName);

  const generateSummaryPDF = (level: "UCE" | "UACE") => {
    console.log(`[DEBUG] Starting generateSummaryPDF for ${level}...`);
    try {
      const summaryStudents = filteredStudents.filter(
        (student) => student.examLevel === level
      );

      if (summaryStudents.length === 0) {
        toast.error(`No ${level} data available for PDF generation`);
        return;
      }

      const headerSchool =
        selectedSchool !== "all"
          ? scopedSchools.find((school) => school.code === selectedSchool)
          : (user?.role === "school" ? scopedSchools[0] : undefined);

      const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      const pageWidth = pdf.internal.pageSize.getWidth();
      const margin = 10;
      let y = 10;

      // Calculations
      const totalStudentsCount = summaryStudents.length;

      // Title
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(12);
      pdf.text("WAKISSHA JOINT MOCK EXAMINATIONS", pageWidth / 2, y, { align: "center" });
      y += 5;

      // Subtitle
      pdf.setFontSize(10);
      pdf.setFont("helvetica", "normal");
      pdf.text(`SUMMARY OF ENTRIES ${level}: YEAR 2026   TOTAL CANDIDATES: ${totalStudentsCount}`, margin, y);
      y += 5;

      // School Info Lines
      const schoolName = headerSchool?.name || "............................................................................";
      const schoolCode = headerSchool?.code || "..........";
      pdf.text(`NAME OF SCHOOL: ${schoolName}   REF No. ${schoolCode}`, margin, y);
      y += 5;

      const district = headerSchool?.district || "...........................";
      const zone = headerSchool?.zone || "...........................";
      const telephone = headerSchool?.telephone || headerSchool?.phone || "...........................";
      pdf.text(`DISTRICT: ${district}   ZONE: ${zone}   TELEPHONE: ${telephone}`, margin, y);
      y += 5;

      pdf.text("NAME & SIGN OF HEAD: ...................................................................................................", margin, y);
      y += 5;

      const email = headerSchool?.contactEmail || headerSchool?.email || "............................................................................";
      pdf.text(`CONTACT E-MAIL ADDRESS: ${email}`, margin, y);
      y += 6;

      // Subject Table Header Label
      pdf.setFont("helvetica", "bold");
      pdf.text("SUBJECT ENTRIES SUMMARY", margin, y);
      y += 1;

      // Prepare Table Data
      const appendixRows = level === "UCE" ? appendixUCE : appendixUACE;
      const tableData = appendixRows.map((subj) => {
        if (subj.section) {
          return [
            { content: subj.section, colSpan: 2, styles: { fontStyle: "bold", halign: "left" } },
            ""
          ];
        }

        const subjectStudents = summaryStudents.filter(s => 
          s.subjects?.some(sub => mapSubjectCode(sub.subjectCode) === subj.key)
        );
        
        const entries = subjectStudents.length;
        
        return [
          `${subj.code} ${subj.name}`,
          entries > 0 ? String(entries) : "-"
        ];
      });

      // Add Totals Row to Table Data
      const totalSubjectEntries = appendixRows.reduce((sum, subj) => {
        if (subj.section) return sum;
        const count = summaryStudents.filter(s => 
          s.subjects?.some(sub => mapSubjectCode(sub.subjectCode) === subj.key)
        ).length;
        return sum + count;
      }, 0);

      tableData.push([
        { content: "TOTAL CANDIDATES PER SUBJECT", styles: { fontStyle: "bold", halign: "right" } },
        { content: String(totalSubjectEntries), styles: { fontStyle: "bold", halign: "center" } }
      ]);

      autoTable(pdf, {
        startY: y,
        margin: { left: margin, right: margin },
        head: [["CODE NAME", "Total number of candidates registering that subject"]],
        body: tableData,
        theme: "grid",
        styles: {
          fontSize: 8,
          cellPadding: 1,
          lineWidth: 0.2,
          lineColor: [0, 0, 0],
          textColor: [0, 0, 0],
        },
        headStyles: {
          fillColor: [255, 255, 255],
          fontStyle: "bold",
          halign: "center",
        },
        columnStyles: {
          0: { cellWidth: 100, halign: "left" },
          1: { cellWidth: 90, halign: "center" },
        },
      });

      y = (pdf as any).lastAutoTable.finalY + 10;

      pdf.setFont("helvetica", "bold");
      pdf.text("CHECKED BY", margin, y);
      pdf.text(`DATE: ${new Date().toLocaleDateString()}`, pageWidth - margin - 80, y);

      pdf.save(`Summary-of-Entries-${level}.pdf`);
      toast.success(`${level} Summary of Entries PDF generated`);
    } catch (error) {
      toast.error(`Failed to generate ${level} Summary PDF`);
      console.error(error);
    }
  };

  const generateAppendix2PDF = () => generateSummaryPDF("UACE");
  const generateAppendix1PDF = () => generateSummaryPDF("UCE");

  const generateReadableSummaryPDF = () => {
    try {
      const summaryLevel = educationLevelFilter;
      const summarySchoolCodes = new Set(
        filteredStudents
          .filter((student) => student.examLevel === summaryLevel)
          .map((student) => student.schoolCode),
      );
      const summarySchools = scopedSchools.filter((school) => summarySchoolCodes.has(school.code));
      const summaryStudents = filteredStudents.filter(
        (student) =>
          student.examLevel === summaryLevel && summarySchoolCodes.has(student.schoolCode),
      );

      if (summarySchools.length === 0 || summaryStudents.length === 0) {
        toast.error("No report data available for the selected level");
        return;
      }

      const headerSchool =
        selectedSchool !== "all" && summarySchoolCodes.has(selectedSchool)
          ? scopedSchools.find((school) => school.code === selectedSchool)
          : undefined;
      const totalEntries = summaryStudents.reduce(
        (sum, student) => sum + (student.subjects?.length ?? 0),
        0,
      );
      const totalRegisteredSubjects = new Set(
        summaryStudents.flatMap((student) =>
          student.subjects?.map((subject) => mapSubjectCode(subject.subjectCode)) ?? [],
        ),
      ).size;
      const summarySections = getSummarySubjectSections(summaryLevel);

      const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 10;
      let y = 12;

      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(13);
      pdf.text(`WAKISSHA ${summaryLevel} SUMMARY REPORT 2026`, pageWidth / 2, y, {
        align: "center",
      });
      y += 6;

      autoTable(pdf, {
        startY: y,
        margin: { left: margin, right: margin },
        tableWidth: pageWidth - margin * 2,
        body: [
          [
            "School Name",
            headerSchool?.name ?? (summarySchools.length === 1 ? summarySchools[0].name : "ALL SCHOOLS"),
            "District",
            headerSchool?.district ??
              (summarySchools.length === 1 ? summarySchools[0].district : "ALL DISTRICTS"),
            "Zone",
            headerSchool?.zone ?? (summarySchools.length === 1 ? summarySchools[0].zone : "ALL ZONES"),
          ],
        ],
        theme: "grid",
        styles: {
          fontSize: 8,
          lineWidth: 0.35,
          lineColor: [0, 0, 0],
          textColor: [0, 0, 0],
          fillColor: [255, 255, 255],
          cellPadding: 1.4,
        },
        bodyStyles: {
          fontStyle: "normal",
        },
        columnStyles: {
          0: { cellWidth: 24, fontStyle: "bold" },
          1: { cellWidth: 47 },
          2: { cellWidth: 16, fontStyle: "bold" },
          3: { cellWidth: 31 },
          4: { cellWidth: 12, fontStyle: "bold" },
          5: { cellWidth: 50 },
        },
      });

      y = ((pdf as any).lastAutoTable?.finalY ?? y) + 3;

      for (const section of summarySections) {
        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(9);
        pdf.text(section.title.toUpperCase(), margin, y);
        y += 1;

        autoTable(pdf, {
          startY: y,
          margin: { left: margin, right: margin },
          tableWidth: pageWidth - margin * 2,
          head: [["Code", "Subject", "Students"]],
          body: section.keys.map((subjectKey) => {
            const subject = getOfficialSubjectRows(summaryLevel).find(
              (entry) => entry.key === subjectKey,
            );
            return [
              subject?.code ?? "",
              subject?.name ?? getOfficialSubjectName(subjectKey, summaryLevel),
              String(getSubjectStudentCount(summaryStudents, subjectKey, summaryLevel)),
            ];
          }),
          theme: "grid",
          styles: {
            fontSize: 7.2,
            lineWidth: 0.3,
            lineColor: [0, 0, 0],
            textColor: [0, 0, 0],
            fillColor: [255, 255, 255],
            cellPadding: 1.1,
          },
          headStyles: {
            fillColor: [255, 255, 255],
            textColor: [0, 0, 0],
            fontStyle: "bold",
            lineWidth: 0.35,
            lineColor: [0, 0, 0],
          },
          columnStyles: {
            0: { cellWidth: 18, halign: "center" },
            1: { cellWidth: 122 },
            2: { cellWidth: 30, halign: "center" },
          },
        });

        y = ((pdf as any).lastAutoTable?.finalY ?? y) + 3;
      }

      autoTable(pdf, {
        startY: y,
        margin: { left: margin, right: margin },
        tableWidth: pageWidth - margin * 2,
        body: [
          ["Total Schools", String(summarySchools.length), "Total Candidates", String(summaryStudents.length)],
          ["Registered Subjects", String(totalRegisteredSubjects), "", ""],
        ],
        theme: "grid",
        styles: {
          fontSize: 8,
          lineWidth: 0.35,
          lineColor: [0, 0, 0],
          textColor: [0, 0, 0],
          fillColor: [255, 255, 255],
          cellPadding: 1.4,
        },
        columnStyles: {
          0: { cellWidth: 35, fontStyle: "bold" },
          1: { cellWidth: 35, halign: "center" },
          2: { cellWidth: 35, fontStyle: "bold" },
          3: { cellWidth: 35, halign: "center" },
        },
      });

      if (((pdf as any).lastAutoTable?.finalY ?? y) > pageHeight - 10) {
        throw new Error("Summary PDF exceeds one page");
      }

      pdf.save(`Readable-${summaryLevel}-Summary.pdf`);
      toast.success("Readable summary PDF generated");
    } catch (error) {
      toast.error("Failed to generate readable summary PDF");
      console.error(error);
    }
  };

  const getRowTotalEntries = (row: FormRow) => {
    const subjectKeys = [
      ...uaceSubjectColumns.map(col => col.key),
      ...uceSubjectColumns.map(col => col.key)
    ];
    return subjectKeys.reduce((sum, key) => sum + Number(row[key] || 0), 0);
  };

  const generateReadableConsolidatedPDF = (rows: FormRow[], level: "UACE" | "UCE") => {
    try {
      const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      const margin = 14;
      let y = 16;

      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(15);
      pdf.text(`WAKISSHA ${level} CONSOLIDATED REPORT 2026`, 105, y, { align: "center" });
      y += 8;

      autoTable(pdf, {
        startY: y,
        margin: { left: margin, right: margin },
        head: [["Ref", "School", "District", "Zone", "Registered Subjects", "Total Entries"]],
        body: rows.map((row) => [
          String(row.refNo ?? ""),
          String(row.schoolName ?? ""),
          String(row.district ?? ""),
          String(row.zone ?? ""),
          String(row.registeredSubjects ?? 0),
          String(getRowTotalEntries(row)),
        ]),
        styles: { fontSize: 9, lineWidth: 0.2, lineColor: [140, 140, 140] },
        headStyles: { fillColor: [245, 247, 252], textColor: [15, 23, 42], fontStyle: "bold" },
      });

      pdf.save(`Readable-${level}-Consolidated.pdf`);
      toast.success("Readable consolidated PDF generated");
    } catch (error) {
      toast.error("Failed to export readable consolidated PDF");
      console.error(error);
    }
  };

  const generateReadableConsolidatedExcel = (rows: FormRow[], level: "UACE" | "UCE") => {
    try {
      const worksheet = XLSXUtils.json_to_sheet(
        rows.map((row) => ({
          Ref: row.refNo,
          School: row.schoolName,
          District: row.district,
          Zone: row.zone,
          RegisteredSubjects: row.registeredSubjects,
          TotalEntries: getRowTotalEntries(row),
        })),
      );
      const workbook = XLSXUtils.book_new();
      XLSXUtils.book_append_sheet(workbook, worksheet, "Consolidated");
      writeFile(workbook, `Readable-${level}-Consolidated.xlsx`);
      toast.success("Readable consolidated Excel generated");
    } catch (error) {
      toast.error("Failed to export readable consolidated Excel");
      console.error(error);
    }
  };

  const generateReadableSubjectWisePDF = () => {
    try {
      const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(15);
      pdf.text("WAKISSHA SUBJECT-WISE REPORT 2026", 105, 16, { align: "center" });

      autoTable(pdf, {
        startY: 24,
        margin: { left: 14, right: 14 },
        head: [[
          "Code",
          "Subject",
          "Level",
          "Total Schools",
          "Total Candidates",
          "Total Entries",
        ]],
        body: subjectWiseData.map((item) => [
          item.code,
          item.subject,
          item.level,
          String(item.totalSchools),
          String(item.totalStudents),
          String(item.totalEntries),
        ]),
        theme: "grid",
        styles: {
          fontSize: 8.3,
          lineWidth: 0.3,
          lineColor: [0, 0, 0],
          textColor: [0, 0, 0],
          fillColor: [255, 255, 255],
          cellPadding: 1.2,
        },
        headStyles: {
          fillColor: [255, 255, 255],
          textColor: [0, 0, 0],
          fontStyle: "bold",
          lineColor: [0, 0, 0],
          lineWidth: 0.35,
        },
        columnStyles: {
          0: { cellWidth: 18, halign: "center" },
          1: { cellWidth: 64 },
          2: { cellWidth: 18, halign: "center" },
          3: { cellWidth: 22, halign: "center" },
          4: { cellWidth: 24, halign: "center" },
          5: { cellWidth: 24, halign: "center" },
        },
      });

      pdf.save("Readable-Subject-Wise-Report.pdf");
      toast.success("Readable subject-wise PDF generated");
    } catch (error) {
      toast.error("Failed to export readable subject-wise PDF");
      console.error(error);
    }
  };

  const generateReadableSubjectWiseExcel = () => {
    try {
      const worksheet = XLSXUtils.json_to_sheet(
        subjectWiseData.map((item) => ({
          Code: item.code,
          Subject: item.subject,
          Level: item.level,
          "Total Schools": item.totalSchools,
          "Total Candidates": item.totalStudents,
          "Total Entries": item.totalEntries,
        })),
      );
      const workbook = XLSXUtils.book_new();
      XLSXUtils.book_append_sheet(workbook, worksheet, "SubjectWise");
      writeFile(workbook, "Readable-Subject-Wise-Report.xlsx");
      toast.success("Readable subject-wise Excel generated");
    } catch (error) {
      toast.error("Failed to export readable subject-wise Excel");
      console.error(error);
    }
  };

  const generateReadableSingleSchoolPDF = () => {
    try {
      const selected = scopedSchools.find((school) => school.code === selectedSchool);
      if (!selected) {
        toast.error("Please select a school");
        return;
      }
      const row = consolidatedRows.find((record) => record.schoolName === selected.name);
      if (!row) {
        toast.error("No data found for selected school");
        return;
      }

      const subjectsColumns =
        selectedSchoolReportLevel === "UACE" ? uaceSubjectColumns : uceSubjectColumns;
      const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      let y = 16;

      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(15);
      pdf.text("WAKISSHA SINGLE SCHOOL REPORT 2026", 105, y, { align: "center" });
      y += 8;

      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(10);
      pdf.text(`School: ${selected.name}`, 14, y);
      y += 5;
      pdf.text(`Code: ${selected.code}   District: ${selected.district}   Zone: ${selected.zone}`, 14, y);
      y += 7;

      autoTable(pdf, {
        startY: y,
        margin: { left: 14, right: 14 },
        head: [["Subject", "Students"]],
        body: subjectsColumns.map((subject) => [
          subject.label,
          String(row[subject.key] ?? 0),
        ]),
        styles: { fontSize: 9, lineWidth: 0.2, lineColor: [140, 140, 140] },
        headStyles: { fillColor: [245, 247, 252], textColor: [15, 23, 42], fontStyle: "bold" },
      });

      pdf.save(`Readable-Single-School-${selected.code}.pdf`);
      toast.success("Readable single school PDF generated");
    } catch (error) {
      toast.error("Failed to export readable single school PDF");
      console.error(error);
    }
  };

  const generateReadableSingleSchoolExcel = () => {
    try {
      const selected = scopedSchools.find((school) => school.code === selectedSchool);
      if (!selected) {
        toast.error("Please select a school");
        return;
      }
      const row = consolidatedRows.find((record) => record.schoolName === selected.name);
      if (!row) {
        toast.error("No data found for selected school");
        return;
      }
      const subjectsColumns =
        selectedSchoolReportLevel === "UACE" ? uaceSubjectColumns : uceSubjectColumns;
      const worksheet = XLSXUtils.json_to_sheet(
        subjectsColumns.map((subject) => ({
          Subject: subject.label,
          Students: row[subject.key] ?? 0,
        })),
      );
      const workbook = XLSXUtils.book_new();
      XLSXUtils.book_append_sheet(workbook, worksheet, "SingleSchool");
      writeFile(workbook, `Readable-Single-School-${selected.code}.xlsx`);
      toast.success("Readable single school Excel generated");
    } catch (error) {
      toast.error("Failed to export readable single school Excel");
      console.error(error);
    }
  };

  const generateOfficialFormExcel = (
    level: "UACE" | "UCE",
    rows: FormRow[],
    fileName: string,
  ) => {
    try {
      const subjectsColumns = level === "UACE" ? uaceSubjectColumns : uceSubjectColumns;
      const headerRow = [
        ...formBaseColumns.map((col) => col.label),
        ...subjectsColumns.map((subject) => subject.label),
      ];
      const bodyRows = buildTemplateTable(rows, subjectsColumns);

      // Add Totals row to Excel
      const totalsRow = [
        "TOTALS",
        "",
        "",
        "",
        rows.reduce((sum, r) => sum + (Number(r.candidatesRegistered) || 0), 0),
        "-",
        ...subjectsColumns.map((subj) => 
          rows.reduce((sum, r) => sum + (Number(r[subj.key]) || 0), 0)
        )
      ];
      bodyRows.push(totalsRow as any);

      const worksheet = XLSXUtils.aoa_to_sheet([
        [`WAKISSHA JOINT MOCK ${level} SUMMARY 2026`],
        headerRow,
        ...bodyRows,
      ]);
      const workbook = XLSXUtils.book_new();
      XLSXUtils.book_append_sheet(workbook, worksheet, "Sheet1");
      writeFile(workbook, `${fileName}.xlsx`);
      toast.success(`${level} official form exported successfully`);
    } catch (error) {
      toast.error("Failed to export Excel");
      console.error(error);
    }
  };

  const generateUACEFormExcel = (rows: FormRow[], fileName: string) =>
    generateOfficialFormExcel("UACE", rows, fileName);

  const generateUCEFormExcel = (rows: FormRow[], fileName: string) =>
    generateOfficialFormExcel("UCE", rows, fileName);

  const exportSingleSchoolToPDF = (fileName: string) => {
    try {
      const selected = scopedSchools.find((s) => s.code === selectedSchool);
      if (!selected) {
        toast.error("Please select a school");
        return;
      }

      const targetLevel: "UACE" | "UCE" = selectedSchoolReportLevel;
      const row = buildSingleSchoolRow(selected.code, targetLevel);
      if (!row) {
        toast.error("No data found for selected school");
        return;
      }
      const schoolStudents = filteredStudents.filter(
        (student) => student.schoolCode === selected.code && student.examLevel === targetLevel,
      );
      generateOfficialFormPDF(targetLevel, [row], fileName, {
        name: selected.name,
        code: selected.code,
        district: selected.district,
        zone: selected.zone,
        telephone: selected.phone,
        contactPerson: selected.contactPerson,
        contactDesignation: selected.contactDesignation,
        contactEmail: selected.email,
        academicYear: selected.academicYear,
        totalCandidates: schoolStudents.length,
      });
    } catch (error) {
      toast.error("Failed to export PDF");
      console.error(error);
    }
  };

  const exportSelectedSchoolStudentsPDF = () => {
    try {
      const selected = scopedSchools.find((s) => s.code === selectedSchool);
      if (!selected) {
        toast.error("Please select a school");
        return;
      }
      const rows = filteredStudents.filter(
        (student) =>
          student.schoolCode === selected.code &&
          student.examLevel === selectedSchoolReportLevel,
      );
      const groupedStudents = new Map<string, (typeof rows)[number]>();
      rows.forEach((student) => {
        const key = student.id || student.registrationNumber;
        if (!groupedStudents.has(key)) {
          groupedStudents.set(key, student);
        } else {
          const existing = groupedStudents.get(key)!;
          const mergedSubjects = [...(existing.subjects ?? []), ...(student.subjects ?? [])];
          groupedStudents.set(key, { ...existing, subjects: mergedSubjects });
        }
      });
      const studentRows = Array.from(groupedStudents.values());

      const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(14);
      pdf.text("WAKISSHA STUDENTS REGISTERED LIST", 105, 16, { align: "center" });
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(9.5);
      const headerY = 24;
      pdf.text(`School: ${selected.name}`, 14, headerY);
      pdf.text(`Level: ${selectedSchoolReportLevel}`, 100, headerY, { align: "center" });
      pdf.text(`Academic Year: ${selected.academicYear ?? "2026"}`, 196, headerY, { align: "right" });

      autoTable(pdf, {
        startY: 30,
        margin: { left: 12, right: 12 },
        head: [["Reg No", "Student Name", "Exam Level", "Subjects (Code/Paper)"]],
        body: studentRows.map((student) => [
          student.registrationNumber,
          student.studentName,
          student.examLevel,
          buildStudentSubjectsDisplay(student, subjectLookup),
        ]),
        styles: { fontSize: 8.5, lineWidth: 0.45, lineColor: [0, 0, 0], textColor: [0, 0, 0], cellPadding: 1.8, valign: "top" },
        headStyles: { fillColor: [255, 255, 255], textColor: [0, 0, 0], fontStyle: "bold", lineColor: [0, 0, 0], lineWidth: 0.5 },
        alternateRowStyles: { fillColor: [255, 255, 255], lineColor: [0, 0, 0], textColor: [0, 0, 0] },
        columnStyles: {
          0: { cellWidth: 40 },
          1: { cellWidth: 42 },
          2: { cellWidth: 20, halign: "center" },
          3: { cellWidth: "auto" },
        },
      });

      pdf.save(`Students-List-${selected.code}-${selectedSchoolReportLevel}.pdf`);
      toast.success("Students list PDF exported");
    } catch (error) {
      toast.error("Failed to export students list PDF");
      console.error(error);
    }
  };

  const exportSelectedSchoolStudentsExcel = () => {
    try {
      const selected = scopedSchools.find((s) => s.code === selectedSchool);
      if (!selected) {
        toast.error("Please select a school");
        return;
      }
      const rows = filteredStudents.filter(
        (student) =>
          student.schoolCode === selected.code &&
          student.examLevel === selectedSchoolReportLevel,
      );
      const groupedStudents = new Map<string, (typeof rows)[number]>();
      rows.forEach((student) => {
        const key = student.id || student.registrationNumber;
        if (!groupedStudents.has(key)) {
          groupedStudents.set(key, student);
        } else {
          const existing = groupedStudents.get(key)!;
          const mergedSubjects = [...(existing.subjects ?? []), ...(student.subjects ?? [])];
          groupedStudents.set(key, { ...existing, subjects: mergedSubjects });
        }
      });
      const studentRows = Array.from(groupedStudents.values());

      const worksheet = XLSXUtils.json_to_sheet(
        studentRows.map((student) => ({
          RegistrationNumber: student.registrationNumber,
          StudentName: student.studentName,
          ExamLevel: student.examLevel,
          Subjects: buildStudentSubjectsDisplay(student, subjectLookup),
        })),
      );
      const workbook = XLSXUtils.book_new();
      XLSXUtils.book_append_sheet(workbook, worksheet, "StudentsList");
      writeFile(workbook, `Students-List-${selected.code}-${selectedSchoolReportLevel}.xlsx`);
      toast.success("Students list Excel exported");
    } catch (error) {
      toast.error("Failed to export students list Excel");
      console.error(error);
    }
  };



  const onGenerateWPF = (level: "UCE" | "UACE") => {
    try {
      const selected = scopedSchools.find((s) => s.code === selectedSchool);
      if (!selected) {
        toast.error("Please select a school to generate WPF");
        return;
      }

      if (!selected.registrationFinalized && user?.role !== "admin") {
        toast.error("WPF can only be generated for schools with finalized registration");
        return;
      }

      const schoolZone = zones.find(z => z.id === selected.zone_id || z.name === selected.zone);

      generateWPF_PDF(level, {
        name: selected.name,
        code: selected.code,
        district: selected.district,
        zone: schoolZone?.name || selected.zone,
        telephone: selected.phone || selected.telephone || "",
        academicYear: user?.academicYear || "2026"
      }, filteredStudents);

    } catch (error) {
      toast.error("Failed to generate WPF");
      console.error(error);
    }
  };

  const handleExport = async (format: "pdf" | "excel", reportType: string) => {
    console.log(`[DEBUG] handleExport called with format: ${format}, reportType: ${reportType}`);
    const key = buildExportKey(format, reportType);
    if (exportingKey) return;
    setExportingKey(key);

    try {
      if (reportType === "Consolidated Report") {
        // consolidatedRows is ALREADY filtered by educationLevelFilter and Zone
        // Use it directly - do NOT filter again (causes missing schools)
        if (format === "pdf") {
          const levelToExport: "UACE" | "UCE" =
            educationLevelFilter === "UCE" ? "UCE" : "UACE";
          if (levelToExport === "UACE") {
            generateUACEFormPDF(consolidatedRows, "UACE_Consolidated_Report");
          } else {
            generateUCEFormPDF(consolidatedRows, "UCE_Consolidated_Report");
          }
        } else {
          const levelToExport: "UACE" | "UCE" =
            educationLevelFilter === "UCE" ? "UCE" : "UACE";
          if (levelToExport === "UACE") {
            generateUACEFormExcel(consolidatedRows, "UACE_Consolidated_Report");
          } else {
            generateUCEFormExcel(consolidatedRows, "UCE_Consolidated_Report");
          }
        }
      } else if (reportType === "Subject-Wise") {
        if (format === "pdf") {
          generateReadableSubjectWisePDF();
        } else {
          generateReadableSubjectWiseExcel();
        }
      } else if (reportType === "Quick Summary") {
        generateUACEFormExcel(consolidatedRows, "UACE-quick-summary");
      } else if (reportType === "Readable Summary") {
        console.log("[DEBUG] Triggering Appendix 2 PDF generator (NEW FORMAT)");
        // DISCONNECTED OLD LOGIC: generateReadableSummaryPDF();
        // CONNECTED NEW LOGIC:
        generateAppendix2PDF();
      } else if (reportType === "Single School") {
        if (format === "pdf") {
          exportSingleSchoolToPDF("Single-School-Report");
        } else {
          const selected = scopedSchools.find((s) => s.code === selectedSchool);
          if (!selected) {
            toast.error("Please select a school");
            return;
          }
          const row = buildSingleSchoolRow(selected.code, selectedSchoolReportLevel);
          if (!row) {
            toast.error("No data found for selected school");
            return;
          }
          const levelToExport: "UACE" | "UCE" = selectedSchoolReportLevel;
          if (levelToExport === "UACE") {
            generateUACEFormExcel([row], `Single-School-${selected.code}`);
          } else {
            generateUCEFormExcel([row], `Single-School-${selected.code}`);
          }
        }
      } else if (reportType === "School Students List") {
        if (format === "pdf") {
          exportSelectedSchoolStudentsPDF();
        } else {
          exportSelectedSchoolStudentsExcel();
        }
      } else if (reportType === "Summary of Entries (UACE)") {
        generateAppendix2PDF();
      } else if (reportType === "Summary of Entries (UCE)") {
        generateAppendix1PDF();
      }
    } finally {
      setExportingKey(null);
    }
  };

  const getReportsStatus = () => {
    if (isAdmin) return "ready";

    if (!hasCompletedRegistration) {
      return "registration_incomplete";
    }

    if (!hasGeneratedInvoice) {
      return "invoice_pending";
    }

    if (user?.status !== "verified" && user?.status !== "active") {
      return "verification_pending";
    }

    return "ready";
  };

  const reportsStatus = getReportsStatus();

  const renderStatusMessage = () => {
    if (reportsStatus === "registration_incomplete") {
      return (
        <div className="flex flex-col items-center justify-center py-16 px-4">
          <div className="bg-orange-50 border-2 border-orange-200 rounded-2xl p-8 max-w-lg text-center shadow-lg">
            <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FileQuestion className="h-8 w-8 text-orange-600" />
            </div>
            <h2 className="text-xl font-bold text-orange-900 mb-2">Student Registration Required</h2>
            <p className="text-orange-700 mb-6 text-sm">
              Reports will become available after completing student registration. Please add your students and their subject entries first.
            </p>
            <Button
              onClick={() => onPageChange("subject-entries")}
              className="bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-xl h-11 px-6 shadow-lg shadow-orange-200 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <PlusCircle className="mr-2 h-5 w-5" />
              Complete Registration
            </Button>
          </div>
        </div>
      );
    }

    if (reportsStatus === "invoice_pending") {
      return (
        <div className="flex flex-col items-center justify-center py-16 px-4">
          <div className="bg-amber-50 border-2 border-amber-200 rounded-2xl p-8 max-w-lg text-center shadow-lg">
            <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="h-8 w-8 text-amber-600" />
            </div>
            <h2 className="text-xl font-bold text-amber-900 mb-2">Invoice Generation Pending</h2>
            <p className="text-amber-700 mb-6 text-sm">
              Your registration has been completed, but an invoice has not been generated yet. Finalize your registration to generate an invoice and proceed with payment.
            </p>
            <Button
              onClick={() => onPageChange("subject-entries")}
              className="bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl h-11 px-6 shadow-lg shadow-amber-200 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <PlusCircle className="mr-2 h-5 w-5" />
              Finalize Registration
            </Button>
          </div>
        </div>
      );
    }

    if (reportsStatus === "verification_pending") {
      return (
        <div className="flex flex-col items-center justify-center py-16 px-4">
          <div className="bg-blue-50 border-2 border-blue-200 rounded-2xl p-8 max-w-lg text-center shadow-lg">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Clock className="h-8 w-8 text-blue-600" />
            </div>
            <h2 className="text-xl font-bold text-blue-900 mb-2">Awaiting Verification</h2>
            <p className="text-blue-700 mb-6 text-sm">
              Your payment is being processed and verified by the WAKISSHA admin team. Reports will become available once your account is verified and activated.
            </p>
            <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-800 px-4 py-2 rounded-full text-sm font-semibold">
              <Clock className="h-4 w-4" />
              Status: {user?.status?.replace("_", " ")}
            </div>
          </div>
        </div>
      );
    }

    return null;
  };

  const isReady = reportsStatus === "ready";

  return (
    <div className="mx-auto flex w-full max-w-[1400px] flex-col gap-4 anim-fade-up px-3 md:px-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between py-1.5">
        <div className="space-y-0.5">
          <p className="text-[10px] md:text-xs font-bold uppercase tracking-[0.2em] text-orange-500">
            Reporting Centre
          </p>
          <h1 className="text-xl md:text-3xl font-black text-slate-900 tracking-tight">Reports</h1>
          <p className="max-w-2xl text-xs md:text-sm text-slate-500 line-clamp-2 md:line-clamp-none">
            {isAdmin 
              ? "Generate UACE consolidated exports, subject-wise breakdowns, and dynamic single-school reports for the WAKISSHA portal."
              : "Generate and download your official school registration summary and student subject breakdown."}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="h-8 md:h-9 rounded-xl border-slate-200 text-xs font-semibold" onClick={() => onPageChange("timetable")}>
            Go to Timetable
          </Button>
        </div>
      </div>

      {!isReady ? (
        renderStatusMessage()
      ) : (
        <>
          <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        {summaryCards.map((card) => (
          <Card key={card.label} className="group overflow-hidden border border-slate-100 shadow-sm hover:shadow-md transition-all duration-300">
            <CardContent className="p-0">
              <div className={`h-1 w-full ${card.className.replace('border-l-4', 'bg').replace('border-l-', 'bg-')}`}></div>
              <div className="p-4 md:p-5">
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">{card.label}</p>
                <div className="flex items-baseline gap-2">
                  <p className={`text-2xl md:text-3xl font-black ${card.valueClass}`}>
                    {card.value}
                  </p>
                  <span className="text-[9px] font-bold text-slate-300 uppercase">System Data</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue={isAdmin ? "consolidated" : "school-wise"} className="space-y-4 md:space-y-6 mt-1">
        <div className="overflow-x-auto pb-1 -mx-3 px-3 scrollbar-hide">
          <TabsList className="inline-flex h-10 items-center justify-start rounded-xl bg-slate-100 p-1 text-slate-500 w-auto min-w-full lg:min-w-0">
            {isAdmin && (
              <TabsTrigger 
                value="consolidated" 
                className="inline-flex items-center justify-center whitespace-nowrap rounded-lg px-4 py-1.5 text-xs md:text-sm font-bold ring-offset-white transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-white data-[state=active]:text-slate-950 data-[state=active]:shadow-sm"
              >
                Consolidated
              </TabsTrigger>
            )}
            {isAdmin && (
              <TabsTrigger 
                value="subject-wise"
                className="inline-flex items-center justify-center whitespace-nowrap rounded-lg px-4 py-1.5 text-xs md:text-sm font-bold ring-offset-white transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-white data-[state=active]:text-slate-950 data-[state=active]:shadow-sm"
              >
                Subject-Wise
              </TabsTrigger>
            )}
            <TabsTrigger 
              value="school-wise"
              className="inline-flex items-center justify-center whitespace-nowrap rounded-lg px-4 py-1.5 text-xs md:text-sm font-bold ring-offset-white transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-white data-[state=active]:text-slate-950 data-[state=active]:shadow-sm"
            >
              {isAdmin ? "Single School" : "My School Report"}
            </TabsTrigger>
          </TabsList>
        </div>

        {isAdmin && (
        <TabsContent value="consolidated" className="mt-0 outline-none">
          <Card className="border-none shadow-none bg-transparent">
            <CardHeader className="px-0 pb-4">
              <div className="flex flex-col gap-4 lg:gap-6 bg-white p-4 md:p-6 rounded-2xl border border-slate-200 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-50 pb-4">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="outline" className="rounded-md border-orange-200 bg-orange-50 text-orange-700 font-bold px-2 py-0.5 text-[10px] uppercase">
                        Official Export
                      </Badge>
                      <CardTitle className="text-lg font-bold text-slate-900">
                        Summary Form ({educationLevelFilter})
                      </CardTitle>
                    </div>
                    <CardDescription className="text-slate-500 max-w-md text-xs">
                      Locked template consolidated report for the WAKISSHA portal.
                    </CardDescription>
                  </div>
                  <Badge className="bg-orange-600 text-white border-none px-3 py-1.5 rounded-lg text-sm font-black w-fit">
                    {consolidatedRows.reduce((sum, row) => sum + (Number(row.candidatesRegistered) || 0), 0)} Candidates
                  </Badge>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    <div className="relative group">
                      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 group-focus-within:text-orange-500 transition-colors" />
                      <Input
                        placeholder="Search school name/code..."
                        value={schoolSearch}
                        onChange={(e) => setSchoolSearch(e.target.value)}
                        className="h-10 pl-9 bg-slate-50 border-slate-200 rounded-xl focus-visible:ring-orange-500 transition-all"
                      />
                    </div>
                    <div className="relative group">
                      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 group-focus-within:text-orange-500 transition-colors" />
                      <Input
                        placeholder="Search district..."
                        value={districtSearch}
                        onChange={(e) => setDistrictSearch(e.target.value)}
                        className="h-10 pl-9 bg-slate-50 border-slate-200 rounded-xl focus-visible:ring-orange-500 transition-all"
                      />
                    </div>
                    <div className="relative group sm:col-span-2 lg:col-span-1">
                      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 group-focus-within:text-orange-500 transition-colors" />
                      <Input
                        placeholder="Search telephone..."
                        value={telephoneSearch}
                        onChange={(e) => setTelephoneSearch(e.target.value)}
                        className="h-10 pl-9 bg-slate-50 border-slate-200 rounded-xl focus-visible:ring-orange-500 transition-all"
                      />
                    </div>
                  </div>

                  <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
                    <div className="flex flex-wrap items-center gap-2 bg-slate-50 p-1 rounded-xl border border-slate-100 flex-1">
                      <Select value={selectedZone} onValueChange={setSelectedZone}>
                        <SelectTrigger className="h-9 min-w-[120px] flex-1 border-none bg-white shadow-sm rounded-lg text-xs font-semibold">
                          <SelectValue placeholder="Zone" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Zones</SelectItem>
                          {zones.map((zone) => (
                            <SelectItem key={zone.id} value={zone.name}>{zone.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Select value={educationLevelFilter} onValueChange={(value: any) => setEducationLevelFilter(value)}>
                        <SelectTrigger className="h-9 w-[100px] border-none bg-white shadow-sm rounded-lg text-xs font-semibold">
                          <SelectValue placeholder="Level" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="UCE">UCE</SelectItem>
                          <SelectItem value="UACE">UACE</SelectItem>
                        </SelectContent>
                      </Select>
                      <Select value={studentTypeFilter} onValueChange={(val: any) => setStudentTypeFilter(val)}>
                        <SelectTrigger className="h-9 min-w-[130px] flex-1 border-none bg-white shadow-sm rounded-lg text-xs font-semibold">
                          <SelectValue placeholder="Type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Types</SelectItem>
                          <SelectItem value="original">Original</SelectItem>
                          <SelectItem value="additional">Additional</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        variant="default"
                        size="sm"
                        className="flex-1 md:flex-none h-10 bg-slate-900 hover:bg-slate-800 text-white rounded-xl px-5 font-bold transition-all shadow-sm"
                        onClick={() => handleExport("pdf", "Consolidated Report")}
                        disabled={isExporting("pdf", "Consolidated Report")}
                      >
                        {isExporting("pdf", "Consolidated Report") ? (
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        ) : (
                          <FileText className="h-4 w-4 mr-2" />
                        )}
                        PDF
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 md:flex-none h-10 border-slate-200 bg-white text-slate-700 hover:bg-slate-50 rounded-xl px-5 font-bold transition-all shadow-sm"
                        onClick={() => handleExport("excel", "Consolidated Report")}
                        disabled={isExporting("excel", "Consolidated Report")}
                      >
                        {isExporting("excel", "Consolidated Report") ? (
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        ) : (
                          <FileSpreadsheet className="h-4 w-4 mr-2" />
                        )}
                        Excel
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="px-0">
              <div className="w-full bg-white shadow-sm border border-slate-200 rounded-2xl overflow-hidden">
                <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-slate-200">
                  <Table className="min-w-[1000px]">
                    <TableHeader className="bg-slate-50/80">
                      <TableRow className="hover:bg-transparent border-none">
                        {[...formBaseColumns, ...(educationLevelFilter === "UCE" ? uceSubjectColumns : uaceSubjectColumns)].map((header) => (
                          <TableHead key={header.key} className="whitespace-nowrap font-black text-slate-700 h-12 text-[10px] uppercase tracking-wider px-4">
                            {header.label}
                          </TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {consolidatedRows.map((row, idx) => (
                        <TableRow key={`${row.schoolName}-${idx}`} className="group hover:bg-slate-50/50 transition-colors">
                          <TableCell className="font-medium text-slate-500">{row.refNo}</TableCell>
                          <TableCell className="font-bold text-slate-900">{row.schoolName}</TableCell>
                          <TableCell className="text-slate-600">{row.district}</TableCell>
                          <TableCell className="text-slate-600">{row.zone}</TableCell>
                          <TableCell className="text-center font-semibold text-slate-900">{row.candidatesRegistered}</TableCell>
                          <TableCell className="text-slate-600">{row.telephone}</TableCell>
                          {(educationLevelFilter === "UCE" ? uceSubjectColumns : uaceSubjectColumns).map((subject) => (
                            <TableCell key={`${subject.key}-${idx}`} className="text-center font-medium text-slate-600">
                              {row[subject.key] ?? 0}
                            </TableCell>
                          ))}
                        </TableRow>
                      ))}
                      {/* Totals Row */}
                      <TableRow className="bg-slate-50 hover:bg-slate-100 border-t-2 border-slate-200 text-slate-900">
                        <TableCell colSpan={4} className="text-right font-bold uppercase tracking-widest h-12">
                          GRAND TOTALS
                        </TableCell>
                        <TableCell className="text-center font-black text-lg">
                          {consolidatedRows.reduce((sum, row) => sum + (Number(row.candidatesRegistered) || 0), 0)}
                        </TableCell>
                        <TableCell className="text-center">-</TableCell>
                        {(educationLevelFilter === "UCE" ? uceSubjectColumns : uaceSubjectColumns).map((subject) => (
                          <TableCell key={`total-${subject.key}`} className="text-center font-bold">
                            {consolidatedRows.reduce((sum, row) => sum + (Number(row[subject.key]) || 0), 0)}
                          </TableCell>
                        ))}
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        )}

        <TabsContent value="subject-wise" className="mt-0 outline-none">
          <Card className="border-none shadow-none bg-transparent">
            <CardHeader className="px-0 pb-4">
              <div className="flex flex-col gap-4 lg:gap-6 bg-white p-4 md:p-6 rounded-2xl border border-slate-200 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-50 pb-4">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="outline" className="rounded-md border-indigo-200 bg-indigo-50 text-indigo-700 font-bold px-2 py-0.5 text-[10px] uppercase">
                        Analytics
                      </Badge>
                      <CardTitle className="text-lg font-bold text-slate-900">Subject-Wise Breakdown</CardTitle>
                    </div>
                    <CardDescription className="text-slate-500 max-w-md text-xs">
                      System-wide student totals per subject. Review trends across all schools.
                    </CardDescription>
                  </div>
                  <Badge className="bg-indigo-600 text-white border-none px-3 py-1.5 rounded-lg text-sm font-black w-fit">
                    {filteredStudents.length} Candidates
                  </Badge>
                </div>
                
                <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
                  <div className="flex items-center gap-2 bg-slate-50 p-1 rounded-xl border border-slate-100 flex-1 md:flex-none">
                    <Select value={subjectWiseLevelFilter} onValueChange={(value: "UCE" | "UACE") => setSubjectWiseLevelFilter(value)}>
                      <SelectTrigger className="h-9 w-full md:w-[140px] border-none bg-white shadow-sm rounded-lg text-xs font-semibold">
                        <SelectValue placeholder="Level" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="UCE">UCE (O Level)</SelectItem>
                        <SelectItem value="UACE">UACE (A Level)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <Button
                    variant="default"
                    size="sm"
                    className="h-10 bg-slate-900 hover:bg-slate-800 text-white rounded-xl px-5 font-bold transition-all shadow-sm md:ml-auto"
                    onClick={() => handleExport("pdf", "Subject-Wise")}
                    disabled={isExporting("pdf", "Subject-Wise")}
                  >
                    {isExporting("pdf", "Subject-Wise") ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <FileText className="h-4 w-4 mr-2" />
                    )}
                    Export Report
                  </Button>
                </div>
              </div>
            </CardHeader>

            <CardContent className="px-0 space-y-4 md:space-y-6">
              <div className="bg-white p-4 md:p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-50 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 md:h-10 md:w-10 rounded-xl bg-indigo-50 flex items-center justify-center">
                      <School className="h-4 w-4 md:h-5 md:w-5 text-indigo-600" />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm md:text-base">Subject Distribution</h4>
                      <p className="text-[10px] md:text-xs text-slate-500">Filter and view specific subject enrollments</p>
                    </div>
                  </div>
                  <Select value={selectedSubjectCode} onValueChange={setSelectedSubjectCode}>
                    <SelectTrigger className="w-full sm:w-[300px] bg-slate-50 border-slate-200 rounded-xl h-10 text-xs font-semibold">
                      <SelectValue placeholder="Select subject to filter" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Subjects View</SelectItem>
                      {subjectWiseData.map((subject) => (
                        <SelectItem key={subject.key} value={subject.key}>
                          {subject.code} - {subject.subject}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="overflow-x-auto rounded-xl border border-slate-100">
                  <Table>
                    <TableHeader className="bg-slate-50/50">
                      <TableRow className="border-none">
                        <TableHead className="w-[100px] font-black text-[10px] uppercase tracking-wider h-10 px-4">CODE</TableHead>
                        <TableHead className="font-black text-[10px] uppercase tracking-wider h-10">SUBJECT NAME</TableHead>
                        <TableHead className="w-[100px] font-black text-[10px] uppercase tracking-wider h-10">LEVEL</TableHead>
                        <TableHead className="text-right font-black text-[10px] uppercase tracking-wider h-10">SCHOOLS</TableHead>
                        <TableHead className="text-right font-black text-[10px] uppercase tracking-wider h-10 px-4">CANDIDATES</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {subjectWiseData.map((subject) => (
                        <TableRow key={subject.key} className="hover:bg-slate-50/30 transition-colors group">
                          <TableCell className="px-4">
                            <Badge variant="outline" className="font-mono bg-white border-slate-200 text-slate-600 text-[10px] px-1.5 py-0">
                              {subject.code}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-bold text-slate-900 uppercase tracking-tight text-xs">
                            {subject.subject}
                          </TableCell>
                          <TableCell>
                            <Badge className="bg-slate-100 text-slate-500 border-none hover:bg-slate-100 text-[10px] px-2 py-0">
                              {subject.level}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right font-semibold text-slate-600 text-xs">
                            {subject.totalSchools}
                          </TableCell>
                          <TableCell className="text-right font-black text-indigo-600 text-xs px-4">
                            {subject.totalStudents}
                          </TableCell>
                        </TableRow>
                      ))}
                      <TableRow className="bg-slate-50 hover:bg-slate-100 font-bold border-t-2 border-slate-200 text-slate-900">
                        <TableCell colSpan={3} className="text-right uppercase tracking-widest h-11 text-[10px] px-4">
                          SYSTEM TOTALS
                        </TableCell>
                        <TableCell className="text-right text-sm">
                          {subjectWiseData.reduce((sum, s) => sum + s.totalSchools, 0)}
                        </TableCell>
                        <TableCell className="text-right text-sm text-indigo-600 px-4">
                          {subjectWiseData.reduce((sum, s) => sum + s.totalStudents, 0)}
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              </div>

              <Card className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <CardHeader className="bg-slate-50/50 border-b border-slate-100 py-3 md:py-4 px-4 md:px-6">
                  <div className="flex items-center justify-between gap-4">
                    <div className="space-y-0.5 min-w-0">
                      <CardTitle className="text-base md:text-lg font-bold text-slate-900 truncate">Candidate Directory</CardTitle>
                      <CardDescription className="text-[10px] md:text-xs truncate">
                        {selectedSubjectCode === "all"
                          ? "Master list of all students across all subjects"
                          : `Students enrolled in ${subjectWiseData.find(s => s.key === selectedSubjectCode)?.subject}`}
                      </CardDescription>
                    </div>
                    <Badge className="bg-indigo-600 text-white border-none px-2 py-1 text-[10px] md:text-xs font-bold whitespace-nowrap">
                      {subjectStudentsList.length} Total
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="max-h-[400px] overflow-y-auto scrollbar-thin scrollbar-thumb-slate-200">
                    <Table className="min-w-[600px]">
                      <TableHeader className="sticky top-0 bg-white z-10 shadow-sm">
                        <TableRow className="border-none">
                          <TableHead className="bg-white font-black text-[10px] uppercase h-10 px-4">REG NUMBER</TableHead>
                          <TableHead className="bg-white font-black text-[10px] uppercase h-10">CANDIDATE NAME</TableHead>
                          <TableHead className="bg-white font-black text-[10px] uppercase h-10">SCHOOL NAME</TableHead>
                          <TableHead className="bg-white text-right font-black text-[10px] uppercase h-10 px-4">SUBJECT</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {subjectStudentsList.map((student) => (
                          <TableRow key={student.id} className="hover:bg-slate-50/50 transition-colors border-slate-50">
                            <TableCell className="font-mono text-[10px] text-slate-500 px-4">{student.registrationNumber}</TableCell>
                            <TableCell className="font-bold text-slate-900 text-xs">{student.studentName}</TableCell>
                            <TableCell className="text-slate-600 text-xs max-w-[200px] truncate">{student.schoolName}</TableCell>
                            <TableCell className="text-right px-4">
                              <Badge variant="outline" className="font-mono text-[9px] bg-slate-50 border-slate-200 px-1 py-0">
                                {selectedSubjectCode === "all"
                                  ? "MULTI"
                                  : subjectWiseData.find((subject) => subject.key === selectedSubjectCode)?.code ?? "SEL"}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="school-wise" className="mt-0">
          <Card className="border-none shadow-none bg-transparent">
            <CardHeader className="px-0 pb-6">
              <div className="flex flex-col bg-white p-6 md:p-7 rounded-3xl border border-slate-200 shadow-sm gap-6">
                {/* First Row: Content Block */}
                <div className="flex flex-col gap-2 min-w-0">
                  <Badge variant="outline" className="w-fit rounded-md border-emerald-200 bg-emerald-50 text-emerald-700 font-bold px-2.5 py-1 text-[10px] uppercase tracking-[0.15em]">
                    School Records
                  </Badge>
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-3">
                      <CardTitle className="text-xl md:text-2xl font-black text-slate-900 tracking-tight leading-tight">
                        {isAdmin ? "Individual School Reports" : "My School Registration"}
                      </CardTitle>
                      {selectedSchoolProfile && (
                        <Badge className="bg-emerald-600 text-white border-none px-3 py-1.5 rounded-lg text-sm font-black whitespace-nowrap shadow-md">
                          {selectedSchoolProfile.totalStudents} Candidates
                        </Badge>
                      )}
                    </div>
                    <CardDescription className="text-slate-500 text-sm md:text-base leading-relaxed max-w-2xl">
                      Access detailed subject breakdowns, candidate lists, and official entry summaries for a specific institution.
                    </CardDescription>
                  </div>
                </div>

                {/* Second Row: Filter Controls */}
                <div className="w-full pt-4 border-t border-slate-100">
                  {isAdmin ? (
                    <div className="flex flex-wrap items-center gap-3 p-2 rounded-2xl border border-slate-100 bg-slate-50 shadow-inner w-full">
                      <div className="relative flex-1 min-w-[200px] max-w-sm">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                        <Input
                          placeholder="Search schools..."
                          value={singleSchoolSearch}
                          onChange={(e) => setSingleSchoolSearch(e.target.value)}
                          className="h-10 pl-9 bg-white border-none shadow-sm rounded-xl focus-visible:ring-emerald-500 w-full"
                        />
                      </div>
                      <Select 
                        value={selectedZone} 
                        onValueChange={(val) => {
                          setSelectedZone(val);
                          setSelectedSchool("all");
                        }}
                      >
                        <SelectTrigger className="h-10 w-[160px] border-none bg-white shadow-sm rounded-xl text-slate-700 font-medium">
                          <SelectValue placeholder="Select Zone" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Zones</SelectItem>
                          {uniqueZones.map((zone) => (
                            <SelectItem key={zone} value={zone}>
                              {zone}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Select value={selectedSchool} onValueChange={setSelectedSchool}>
                        <SelectTrigger className="h-10 flex-1 min-w-[200px] border-none bg-white shadow-sm rounded-xl text-slate-700 font-medium">
                          <SelectValue placeholder="Select a school" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Schools</SelectItem>
                          {scopedSchools
                            .filter(school => 
                              (selectedZone === "all" || school.zone === selectedZone) &&
                              (school.name.toLowerCase().includes(singleSchoolSearch.toLowerCase()) || 
                              school.code.toLowerCase().includes(singleSchoolSearch.toLowerCase()))
                            )
                            .map((school) => (
                              <SelectItem key={school.code} value={school.code}>
                                {school.name}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                      <Select
                        value={selectedSchoolReportLevel}
                        onValueChange={(value: "UCE" | "UACE") => setSelectedSchoolReportLevel(value)}
                      >
                        <SelectTrigger className="h-10 w-[100px] border-none bg-white shadow-sm rounded-xl text-slate-700 font-medium">
                          <SelectValue placeholder="Level" />
                        </SelectTrigger>
                        <SelectContent>
                          {(selectedSchoolAvailableLevels.length > 0
                            ? selectedSchoolAvailableLevels
                            : ["UCE", "UACE"]
                          ).map((level) => (
                            <SelectItem key={level} value={level}>
                              {level}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Select value={studentTypeFilter} onValueChange={(val: any) => setStudentTypeFilter(val)}>
                        <SelectTrigger className="h-10 w-[130px] border-none bg-white shadow-sm rounded-xl text-slate-700 font-medium">
                          <SelectValue placeholder="Type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Students</SelectItem>
                          <SelectItem value="original">Original</SelectItem>
                          <SelectItem value="additional">Additional</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  ) : (
                    <div className="flex flex-wrap items-center gap-3 p-2 rounded-2xl border border-slate-100 bg-slate-50 shadow-inner w-full">
                      <div className="px-4 py-2 text-sm font-bold text-slate-900 bg-white rounded-xl shadow-sm border border-slate-100 truncate max-w-[300px] flex-1">
                        {scopedSchools[0]?.name || user?.schoolCode}
                      </div>
                      <Select
                        value={selectedSchoolReportLevel}
                        onValueChange={(value: "UCE" | "UACE") => setSelectedSchoolReportLevel(value)}
                      >
                        <SelectTrigger className="h-10 w-32 border-none bg-white shadow-sm rounded-xl text-slate-700 font-medium">
                          <SelectValue placeholder="Level" />
                        </SelectTrigger>
                        <SelectContent>
                          {(selectedSchoolAvailableLevels.length > 0
                            ? selectedSchoolAvailableLevels
                            : ["UCE", "UACE"]
                          ).map((level) => (
                            <SelectItem key={level} value={level}>
                              {level}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Select value={studentTypeFilter} onValueChange={(val: any) => setStudentTypeFilter(val)}>
                        <SelectTrigger className="h-10 w-40 border-none bg-white shadow-sm rounded-xl text-slate-700 font-medium">
                          <SelectValue placeholder="Type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Students</SelectItem>
                          <SelectItem value="original">Original</SelectItem>
                          <SelectItem value="additional">Additional</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>
              </div>
            </CardHeader>

            <CardContent className="px-0">
              {!selectedSchoolData || !selectedSchoolProfile ? (
                <div className="bg-white p-20 rounded-2xl border border-slate-200 border-dashed text-center">
                  <div className="h-16 w-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <School className="h-8 w-8 text-slate-300" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 mb-1">No School Selected</h3>
                  <p className="text-slate-500 max-w-xs mx-auto">
                    Please select an institution from the dropdown above to view its detailed reporting dashboard.
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* School Profile Card */}
                  <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="p-6 sm:p-8 bg-slate-900 text-white">
                      <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
                        <div className="space-y-2">
                          <Badge className="bg-emerald-500 text-white border-none px-3 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider">
                            Institution Profile
                          </Badge>
                          <h3 className="text-3xl font-black tracking-tight">{selectedSchoolData.name}</h3>
                          <div className="flex flex-wrap items-center gap-y-2 gap-x-4 text-slate-400 text-sm">
                            <span className="flex items-center gap-1.5">
                              <Badge variant="outline" className="border-slate-700 text-slate-300 font-mono">
                                {selectedSchoolData.code}
                              </Badge>
                            </span>
                            <span className="flex items-center gap-1.5">
                              {selectedSchoolData.district}
                            </span>
                            <span className="h-1 w-1 bg-slate-700 rounded-full hidden sm:block"></span>
                            <span className="flex items-center gap-1.5">
                              {selectedSchoolData.zone}
                            </span>
                          </div>
                        </div>
                        <div className="flex flex-col gap-4 sm:items-end">
                          <div className="text-right">
                            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Status</p>
                            {getStatusBadge(selectedSchoolData.status)}
                          </div>
                          <div className="text-right">
                            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Academic Year</p>
                            <p className="text-xl font-bold">{selectedSchoolData.academicYear || "2026"}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-slate-100">
                      <div className="p-6 hover:bg-slate-50/50 transition-colors">
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Total Candidates</p>
                        <p className="text-4xl font-black text-slate-900">{selectedSchoolProfile.totalStudents}</p>
                        <p className="text-xs text-slate-400 mt-1">Registered for {selectedSchoolReportLevel}</p>
                      </div>
                      <div className="p-6 hover:bg-slate-50/50 transition-colors">
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Subjects Offered</p>
                        <p className="text-4xl font-black text-slate-900">{selectedSchoolProfile.subjectsRegistered}</p>
                        <p className="text-xs text-slate-400 mt-1">Unique course codes</p>
                      </div>
                      <div className="p-6 hover:bg-slate-50/50 transition-colors">
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Last Sync</p>
                        <p className="text-2xl font-bold text-slate-900 mt-2">{selectedSchoolProfile.lastUpdated}</p>
                        <p className="text-xs text-slate-400 mt-1">Data current as of today</p>
                      </div>
                    </div>
                  </div>

                  {/* Export Controls */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <Button
                      variant="outline"
                      className="h-14 rounded-2xl border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-300 group transition-all"
                      onClick={() => handleExport("pdf", "School Students List")}
                      disabled={isExporting("pdf", "School Students List")}
                    >
                      <div className="flex items-center gap-3 text-left">
                        <div className="h-9 w-9 rounded-xl bg-slate-100 flex items-center justify-center group-hover:bg-white transition-colors">
                          <FileText className="h-5 w-5 text-slate-600" />
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Candidates</p>
                          <p className="font-bold text-slate-900">PDF List</p>
                        </div>
                      </div>
                    </Button>

                    <Button
                      variant="outline"
                      className="h-14 rounded-2xl border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-300 group transition-all"
                      onClick={() => handleExport("excel", "School Students List")}
                      disabled={isExporting("excel", "School Students List")}
                    >
                      <div className="flex items-center gap-3 text-left">
                        <div className="h-9 w-9 rounded-xl bg-slate-100 flex items-center justify-center group-hover:bg-white transition-colors">
                          <FileSpreadsheet className="h-5 w-5 text-slate-600" />
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Candidates</p>
                          <p className="font-bold text-slate-900">Excel Data</p>
                        </div>
                      </div>
                    </Button>

                    <Button
                      variant="outline"
                      className="h-14 rounded-2xl border-orange-200 bg-orange-50/50 hover:bg-orange-100/50 hover:border-orange-300 group transition-all"
                      onClick={() => onGenerateWPF(selectedSchoolReportLevel)}
                    >
                      <div className="flex items-center gap-3 text-left">
                        <div className="h-9 w-9 rounded-xl bg-orange-100 flex items-center justify-center group-hover:bg-white transition-colors">
                          <FileText className="h-5 w-5 text-orange-600" />
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-orange-400 uppercase tracking-widest">WPF Form</p>
                          <p className="font-bold text-orange-900">Weekly Packing</p>
                        </div>
                      </div>
                    </Button>

                    <Button
                      variant="default"
                      className="h-14 rounded-2xl bg-orange-600 hover:bg-orange-700 text-white shadow-lg shadow-orange-200 border-none group transition-all"
                      onClick={() => handleExport("pdf", "Summary of Entries (UACE)")}
                      disabled={isExporting("pdf", "Summary of Entries (UACE)")}
                    >
                      <div className="flex items-center gap-3 text-left">
                        <div className="h-9 w-9 rounded-xl bg-white/20 flex items-center justify-center">
                          <Download className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-white/70 uppercase tracking-widest">Official</p>
                          <p className="font-bold text-white">UACE Summary</p>
                        </div>
                      </div>
                    </Button>

                    <Button
                      variant="default"
                      className="h-14 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-200 border-none group transition-all"
                      onClick={() => handleExport("pdf", "Summary of Entries (UCE)")}
                      disabled={isExporting("pdf", "Summary of Entries (UCE)")}
                    >
                      <div className="flex items-center gap-3 text-left">
                        <div className="h-9 w-9 rounded-xl bg-white/20 flex items-center justify-center">
                          <Download className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-white/70 uppercase tracking-widest">Official</p>
                          <p className="font-bold text-white">UCE Appendix</p>
                        </div>
                      </div>
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
        </>
      )}
    </div>
  );
}
