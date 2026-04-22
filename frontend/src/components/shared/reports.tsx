import { useEffect, useMemo, useState } from "react";
import {
  FileSpreadsheet,
  FileText,
  Download,
  Loader2,
  School,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { Button } from "../ui/button";
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
import { toast } from "sonner";
import { useAuth } from "../auth-context";
import { jsPDF } from "jspdf";
import { utils as XLSXUtils, writeFile } from "xlsx";
import autoTable from "jspdf-autotable";

interface ReportsProps {
  onPageChange: (page: string) => void;
}

type EducationLevelFilter = "UCE" | "UACE";

type FormColumn = {
  key: string;
  label: string;
};

const formBaseColumns: FormColumn[] = [
  { key: "refNo", label: "Ref" },
  { key: "schoolName", label: "Name of school" },
  { key: "district", label: "District" },
  { key: "zone", label: "Zone / Centre" },
  { key: "candidatesRegistered", label: "Candidates Registered" },
  { key: "telephone", label: "Telephone" },
];

const uaceSubjectColumns: FormColumn[] = [
  { key: "GP", label: "General Paper" },
  { key: "SUB_MATHS", label: "Subsidiary Mathematics" },
  { key: "SUB_ICT", label: "Subsidiary ICT" },
  { key: "HIST", label: "History" },
  { key: "ENT", label: "Entrepreneurship" },
  { key: "IRE", label: "IRE" },
  { key: "CRE", label: "CRE" },
  { key: "GEOG", label: "Geography" },
  { key: "LIT", label: "Literature" },
  { key: "KISWA", label: "Kiswahili" },
  { key: "ART", label: "Fine Art" },
  { key: "PHY", label: "Physics" },
  { key: "CHEM", label: "Chemistry" },
  { key: "BIO", label: "Biology" },
  { key: "MATH", label: "Mathematics" },
  { key: "AGRIC", label: "Agriculture" },
  { key: "FN", label: "Food & Nutrition" },
  { key: "TD", label: "Technical Drawing" },
  { key: "FRENCH", label: "French" },
  { key: "GERMAN", label: "German" },
  { key: "ARABIC", label: "Arabic" },
  { key: "LUGANDA", label: "Luganda" },
  { key: "RUNY", label: "Runy-Rukiga" },
  { key: "LUSOGA", label: "Lusoga" },
];

const uceSubjectColumns: FormColumn[] = [
  { key: "ENG", label: "English Language" },
  { key: "MATH", label: "Mathematics" },
  { key: "BIO", label: "Biology" },
  { key: "CHEM", label: "Chemistry" },
  { key: "PHY", label: "Physics" },
  { key: "HIST", label: "History & Political Education" },
  { key: "GEOG", label: "Geography" },
  { key: "CRE", label: "CRE" },
  { key: "IRE", label: "IRE" },
  { key: "CPS", label: "ICT" },
  { key: "FRENCH", label: "French" },
  { key: "GERMAN", label: "German" },
  { key: "ARABIC", label: "Arabic" },
  { key: "LUGANDA", label: "Luganda" },
  { key: "RUNY", label: "Runy-Rukiga" },
  { key: "LUSOGA", label: "Lusoga" },
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

function mapSubjectCode(subjectCode: string) {
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
  return aliases[normalized] ?? normalized;
}

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
  const { user, schools, students, subjects } = useAuth();
  const isAdmin = user?.role === "admin";
  const scopedSchools =
    user?.role === "school"
      ? schools.filter((school) => school.code === user.schoolCode)
      : schools;
  const scopedStudents =
    user?.role === "school"
      ? students.filter((student) => student.schoolCode === user.schoolCode)
      : students;
  const [selectedSchool, setSelectedSchool] = useState("all");
  const [selectedSubjectCode, setSelectedSubjectCode] = useState("all");
  const [subjectWiseLevelFilter, setSubjectWiseLevelFilter] = useState<"UCE" | "UACE">("UCE");
  const [selectedSchoolReportLevel, setSelectedSchoolReportLevel] = useState<"UCE" | "UACE">("UCE");
  const [exportingKey, setExportingKey] = useState<string | null>(null);
  const [educationLevelFilter, setEducationLevelFilter] = useState<EducationLevelFilter>("UCE");
  const [lateFee] = useState(0);
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

  useEffect(() => {
    if (user?.role === "school" && user.schoolCode) {
      setSelectedSchool(user.schoolCode);
    }
  }, [user?.role, user?.schoolCode]);

  const consolidatedRows = useMemo<FormRow[]>(() => {
    const schoolCodesForLevel = new Set(
      scopedStudents
        .filter((student) => student.examLevel === educationLevelFilter)
        .map((student) => student.schoolCode),
    );
    const filteredSchools = scopedSchools.filter((school) => schoolCodesForLevel.has(school.code));

    return filteredSchools.map((school) => {
      const schoolStudents = scopedStudents.filter(
        (student) =>
          student.schoolCode === school.code &&
          student.examLevel === educationLevelFilter,
      );
      const registeredSubjects = new Set(
        schoolStudents.flatMap((student) => student.subjects?.map((s) => s.subjectCode) ?? [])
      ).size;

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
        refNo: school.code, // Use school code as reference
        schoolName: school.name,
        district: school.district,
        zone: school.zone,
        candidatesRegistered: schoolStudents.length,
        telephone: school.phone,
      };

      // Add subject columns with student counts (not entry breakdowns)
      subjectColumns.forEach((subject) => {
        row[subject.key] = subjectCounts[subject.key] ?? 0;
      });

      return row;
    });
  }, [scopedSchools, scopedStudents, educationLevelFilter]);

  const subjectWiseData = useMemo<SubjectWiseReportRow[]>(
    () =>
      getOfficialSubjectRows(subjectWiseLevelFilter).map((subject) => {
        const subjectStudents = new Set<string>();
        const subjectSchools = new Set<string>();
        let totalEntries = 0;

        scopedStudents.forEach((student) => {
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
    [scopedStudents, subjectWiseLevelFilter],
  );

  const subjectStudentsList = useMemo(() => {
    if (selectedSubjectCode === "all") return scopedStudents;
    return scopedStudents.filter((student) =>
      student.subjects?.some(
        (subject) => buildSubjectLevelKey(subject.subjectCode, student.examLevel) === selectedSubjectCode,
      ),
    );
  }, [scopedStudents, selectedSubjectCode]);

  const selectedSchoolData =
    selectedSchool !== "all"
      ? scopedSchools.find((school) => school.code === selectedSchool)
      : undefined;

  const selectedSchoolAvailableLevels = useMemo(() => {
    if (!selectedSchoolData) return [] as Array<"UCE" | "UACE">;

    const levels = new Set<"UCE" | "UACE">();
    scopedStudents.forEach((student) => {
      if (student.schoolCode === selectedSchoolData.code) {
        levels.add(student.examLevel);
      }
    });

    return Array.from(levels).sort();
  }, [selectedSchoolData, scopedStudents]);

  useEffect(() => {
    if (selectedSchoolAvailableLevels.length === 0) return;
    if (!selectedSchoolAvailableLevels.includes(selectedSchoolReportLevel)) {
      setSelectedSchoolReportLevel(selectedSchoolAvailableLevels[0]);
    }
  }, [selectedSchoolAvailableLevels, selectedSchoolReportLevel]);

  const selectedSchoolProfile = useMemo(() => {
    if (!selectedSchoolData) return undefined;
    const schoolStudents = scopedStudents.filter(
      (student) =>
        student.schoolCode === selectedSchoolData.code &&
        student.examLevel === selectedSchoolReportLevel,
    );
    return {
      totalStudents: schoolStudents.length,
      subjectsRegistered: new Set(
        schoolStudents.flatMap((student) => student.subjects.map((s) => mapSubjectCode(s.subjectCode))),
      ).size,
      lastUpdated: new Date().toLocaleDateString(),
    };
  }, [selectedSchoolData, scopedStudents, selectedSchoolReportLevel]);

  const buildSingleSchoolRow = (
    schoolCode: string,
    level: "UACE" | "UCE",
  ): FormRow | undefined => {
    const school = scopedSchools.find((record) => record.code === schoolCode);
    if (!school) return undefined;

    const schoolStudents = scopedStudents.filter(
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
      label: "Total Students",
      value: scopedStudents.length,
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
      label: "My Registered Students",
      value: scopedStudents.length,
      className: "border-l-blue-600",
      valueClass: "text-slate-900",
    },
    {
      label: "Subjects Registered",
      value: new Set(scopedStudents.flatMap(s => s.subjects?.map(subj => mapSubjectCode(subj.subjectCode)) ?? [])).size,
      className: "border-l-orange-500",
      valueClass: "text-slate-900",
    },
    {
      label: "Total Papers",
      value: scopedStudents.reduce((acc, s) => acc + (s.subjects?.length ?? 0), 0),
      className: "border-l-indigo-500",
      valueClass: "text-slate-900",
    },
  ];

  const buildExportKey = (format: "pdf" | "excel", reportType: string) =>
    `${reportType}-${format}`;

  const isExporting = (format: "pdf" | "excel", reportType: string) =>
    exportingKey === buildExportKey(format, reportType);

  const calculateFeeSummary = (rows: FormRow[]) => {
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
    const totalAmount = schoolFee + studentFee + lateFee + markingFee;

    return { schoolFee, studentFee, lateFee, markingFee, totalAmount, totalStudents };
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
    const schoolStudents = scopedStudents.filter(
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
    const lateRegFee = lateFee;
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
      lateRegFee +
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
      `SUMMARY OF ENTRIES ${level}: YEAR ${schoolContext.academicYear ?? "2026"}.................... TOTAL CANDIDATES...............`,
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
    autoTable(pdf, {
      startY: summaryStartY,
      margin: { left: margin, right: margin },
      tableWidth: pageWidth - margin * 2,
      body: [
        ["", "", "", "FOR OFFICIAL USE", "", "AMOUNT"],
        ["", "", "", "SCHOOL REG FEE", "", schoolRegFee.toLocaleString()],
        ["", "", "", "STUDENTS’ FEE", `${studentFeeRate.toLocaleString()}   X ${totalCandidates}`, ""],
        ["", "", "", "LATE REG. FEE\n(If charged)", `2,000   X ______`, lateRegFee ? lateRegFee.toLocaleString() : ""],
        ["", "", "", "MARKING GUIDE\nFEE", "ARTS", artsMarking.toLocaleString()],
        ["", "", "", "", "SCIENCES", sciencesMarking.toLocaleString()],
        ["TOTAL SUBJECT PAPER\nREGISTERED", "", "", "ANSWER\nBOOKLETS\n(optional)", `${answerBookletRate.toLocaleString()}/=  X ${answerBookletQty}`, ""],
        ["", "", "", "TOTAL AMOUNT", "", totalAmount.toLocaleString()],
        ["AMOUNT IN WORDS:", "", "", "", "", ""],
        ["CHECKED BY", "", "", "", "DATE:", ""],
      ],
      theme: "grid",
      styles: {
        font: "times",
        fontSize: 6.3,
        lineWidth: 0.25,
        lineColor: [0, 0, 0],
        textColor: [0, 0, 0],
        cellPadding: { top: 0.8, right: 1, bottom: 0.8, left: 1 },
      },
      columnStyles: {
        0: { cellWidth: 14, fontStyle: "bold" },
        1: { cellWidth: 51 },
        2: { cellWidth: 16 },
        3: { cellWidth: 28, fontStyle: "bold" },
        4: { cellWidth: 30 },
        5: { cellWidth: 45, halign: "right", fontStyle: "bold" },
      },
      didParseCell: (hookData) => {
        if (hookData.row.index === 0) hookData.cell.styles.fontStyle = "bold";
        if (hookData.row.index === 6 && hookData.column.index === 0) hookData.cell.styles.halign = "center";
        if (hookData.row.index === 9 && hookData.column.index === 4) hookData.cell.styles.halign = "left";
      },
    });

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

      // Add Totals Row
      const totalsRow = [
        "TOTALS",
        "",
        "",
        "",
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
      // Base columns: Ref(10), School(35), District(15), Zone(18), Candidates(12), Phone(15) = 105mm
      // Remaining width for subject columns
      const baseColsWidth = 10 + 35 + 15 + 18 + 12 + 15;
      const subjectColsWidth = Math.max(usableWidth - baseColsWidth, 50);
      const numSubjectCols = totalCols - 6;
      const subjectColWidth = numSubjectCols > 0 ? subjectColsWidth / numSubjectCols : 10;

      const columnStylesObj: Record<number, any> = {};
      columnStylesObj[0] = { cellWidth: 10, halign: "center", fontSize: 6 };   // Ref
      columnStylesObj[1] = { cellWidth: 35, halign: "left", fontSize: 6 };    // School Name
      columnStylesObj[2] = { cellWidth: 15, halign: "center", fontSize: 6 };  // District
      columnStylesObj[3] = { cellWidth: 18, halign: "center", fontSize: 6 };  // Zone
      columnStylesObj[4] = { cellWidth: 12, halign: "center", fontSize: 6 };  // Candidates Registered
      columnStylesObj[5] = { cellWidth: 15, halign: "center", fontSize: 6 };  // Telephone
      for (let i = 6; i < totalCols; i++) {
        columnStylesObj[i] = { cellWidth: subjectColWidth, halign: "center", fontSize: 5.5 };
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
          fontSize: 5.5,
          fontStyle: "bold",
          halign: "center",
          valign: "middle",
          padding: 0.5,
        },
        bodyStyles: {
          lineWidth: 0.3,
          lineColor: [0, 0, 0],        // BLACK borders only
          fontSize: 5.5,
          textColor: [0, 0, 0],        // BLACK text
          padding: 0.5,
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
            data.cell.styles.fillColor = [245, 245, 245];
          }
        }
      });

      // Signature section
      const finalY = (pdf as any).lastAutoTable?.finalY ?? 150;
      let sigY = finalY + 15;

      // Add dynamic totals section below table if needed
      const summaryData = calculateFeeSummary(rows);
      
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(9);
      pdf.text("SUMMARY TOTALS:", margin, sigY);
      sigY += 5;
      pdf.setFont("helvetica", "normal");
      pdf.text(`Total Candidates: ${summaryData.totalStudents}`, margin + 2, sigY);
      sigY += 4;
      pdf.text(`Total Amount: ${summaryData.totalAmount.toLocaleString()} UGX`, margin + 2, sigY);
      sigY += 10;

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
      const summaryStudents = scopedStudents.filter(
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
      const schoolRegFee = 25000; // Fixed per school
      const studentFeeRate = level === "UACE" ? 27000 : 25000;
      const studentsFee = totalStudentsCount * studentFeeRate;
      
      const lateStudentsCount = summaryStudents.filter(s => {
        if (!s.registrationDate) return false;
        const regDate = new Date(s.registrationDate);
        const deadline = new Date("2026-04-15");
        return regDate > deadline;
      }).length;
      const lateRegFeeAmount = lateStudentsCount * (lateFee || 2000);

      const markingGuideFeeArts = 25000; 
      const markingGuideFeeSciences = 25000; 
      
      const bookletRequestedCount = totalStudentsCount; 
      const answerBookletsFee = bookletRequestedCount * 25000;
      
      const totalAmount = schoolRegFee + studentsFee + lateRegFeeAmount + markingGuideFeeArts + markingGuideFeeSciences + answerBookletsFee;

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

      y = (pdf as any).lastAutoTable.finalY;

      // Bottom Section
      const bottomTableData = [
        ["", "", "FOR OFFICIAL USE", "AMOUNT"],
        ["", "", "SCHOOL REG FEE", schoolRegFee.toLocaleString()],
        ["", "", { content: "STUDENTS’ FEE", styles: { valign: "middle" } }, { content: `${studentFeeRate.toLocaleString()} X ${totalStudentsCount} = ${studentsFee.toLocaleString()}`, styles: { halign: "left" } }],
        ["", "", { content: "LATE REG. FEE\n(If charged)", styles: { valign: "middle" } }, { content: `2,000 X ${lateStudentsCount} = ${lateRegFeeAmount.toLocaleString()}`, styles: { halign: "left" } }],
        ["", "", "MARKING GUIDE\nFEE", { content: `ARTS                       ${markingGuideFeeArts.toLocaleString()}\nSCIENCES                ${markingGuideFeeSciences.toLocaleString()}`, styles: { halign: "left" } }],
        [{ content: "TOTAL ENTRIES REGISTERED", colSpan: 2, rowSpan: 2, styles: { halign: "center", valign: "middle", fontStyle: "bold", fontSize: 10 } }, 
         { content: "ANSWER BOOKLETS\n(optional)", styles: { fontStyle: "bold" } }, `25,000/= X ${bookletRequestedCount} = ${answerBookletsFee.toLocaleString()}`],
        ["TOTAL AMOUNT", totalAmount.toLocaleString()],
      ];

      autoTable(pdf, {
        startY: y,
        margin: { left: margin, right: margin },
        body: bottomTableData,
        theme: "grid",
        styles: {
          fontSize: 8,
          cellPadding: 2,
          lineWidth: 0.2,
          lineColor: [0, 0, 0],
          textColor: [0, 0, 0],
        },
        columnStyles: {
          0: { cellWidth: 40 },
          1: { cellWidth: 40 },
          2: { cellWidth: 60, fontStyle: "bold" },
          3: { cellWidth: 50 },
        },
        didParseCell: (data) => {
          if (data.row.index === 0) {
            data.cell.styles.fontStyle = "bold";
            data.cell.styles.halign = "center";
          }
          if (data.row.index < 5 && data.column.index < 2) {
            data.cell.styles.lineWidth = 0;
          }
        }
      });

      y = (pdf as any).lastAutoTable.finalY + 5;

      pdf.setFont("helvetica", "normal");
      pdf.text(`AMOUNT IN WORDS: ${numberToWords(totalAmount)}`, margin, y);
      y += 7;

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
        scopedStudents
          .filter((student) => student.examLevel === summaryLevel)
          .map((student) => student.schoolCode),
      );
      const summarySchools = scopedSchools.filter((school) => summarySchoolCodes.has(school.code));
      const summaryStudents = scopedStudents.filter(
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
          ["Total Schools", String(summarySchools.length), "Total Students (Candidates)", String(summaryStudents.length)],
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
          "Total Students",
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
          "Total Students": item.totalStudents,
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
      const schoolStudents = scopedStudents.filter(
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
      const rows = scopedStudents.filter(
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
      const rows = scopedStudents.filter(
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

  const handleExport = async (format: "pdf" | "excel", reportType: string) => {
    console.log(`[DEBUG] handleExport called with format: ${format}, reportType: ${reportType}`);
    const key = buildExportKey(format, reportType);
    if (exportingKey) return;
    setExportingKey(key);

    try {
      if (reportType === "UACE Consolidated") {
        // consolidatedRows is ALREADY filtered by educationLevelFilter
        // Use it directly - do NOT filter again (causes missing schools)
        if (format === "pdf") {
          const levelToExport: "UACE" | "UCE" =
            educationLevelFilter === "UCE" ? "UCE" : "UACE";
          if (levelToExport === "UACE") {
            generateUACEFormPDF(consolidatedRows, "UACE-summary-form");
          } else {
            generateUCEFormPDF(consolidatedRows, "UCE-summary-form");
          }
        } else {
          const levelToExport: "UACE" | "UCE" =
            educationLevelFilter === "UCE" ? "UCE" : "UACE";
          if (levelToExport === "UACE") {
            generateUACEFormExcel(consolidatedRows, "UACE-summary-form");
          } else {
            generateUCEFormExcel(consolidatedRows, "UCE-summary-form");
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

  return (
    <div className="mx-auto flex w-full max-w-[1240px] flex-col gap-4 anim-fade-up">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-2">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-red-500">
            Reporting Centre
          </p>
          <h1 className="text-3xl font-bold text-shimmer">Reports</h1>
          <p className="max-w-3xl text-slate-500">
            {isAdmin 
              ? "Generate UACE consolidated exports, subject-wise breakdowns, and dynamic single-school reports for the WAKISSHA portal."
              : "Generate and download your official school registration summary and student subject breakdown."}
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Button variant="outline" onClick={() => onPageChange("timetable")}>
            Go to Timetable
          </Button>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        {summaryCards.map((card) => (
          <Card key={card.label} className={`border-l-4 ${card.className}`}>
            <CardContent className="pt-6">
              <p className="text-sm font-medium text-slate-500">{card.label}</p>
              <p className={`mt-3 text-3xl font-bold ${card.valueClass}`}>
                {card.value}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue={isAdmin ? "consolidated" : "school-wise"} className="space-y-3">
        <TabsList className={`grid w-full ${isAdmin ? "grid-cols-3" : "grid-cols-1"}`}>
          {isAdmin && <TabsTrigger value="consolidated">Consolidated</TabsTrigger>}
          {isAdmin && <TabsTrigger value="subject-wise">Subject-Wise</TabsTrigger>}
          <TabsTrigger value="school-wise">{isAdmin ? "Single School Report" : "My School Report"}</TabsTrigger>
        </TabsList>

        {isAdmin && (
        <TabsContent value="consolidated">
          <Card>
            <CardHeader className="border-b border-slate-200">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <CardTitle className="text-slate-900">
                    Official Summary Form ({educationLevelFilter === "UCE" ? "UCE" : "UACE"})
                  </CardTitle>
                  <CardDescription className="text-slate-500">
                    Client template-locked export with fixed columns and fee section.
                  </CardDescription>
                </div>
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
                  <Select value={educationLevelFilter} onValueChange={(value: any) => setEducationLevelFilter(value)}>
                    <SelectTrigger className="w-full lg:w-[180px]">
                      <SelectValue placeholder="Filter by level" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="UCE">UCE (O Level)</SelectItem>
                      <SelectItem value="UACE">UACE (A Level)</SelectItem>
                    </SelectContent>
                  </Select>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleExport("pdf", "School Students List")}
                      disabled={isExporting("pdf", "School Students List")}
                    >
                      {isExporting("pdf", "School Students List") ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Generating...
                        </>
                      ) : (
                        <>
                          <FileText className="h-4 w-4" />
                          Students List (PDF)
                        </>
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleExport("excel", "School Students List")}
                      disabled={isExporting("excel", "School Students List")}
                    >
                      {isExporting("excel", "School Students List") ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Generating...
                        </>
                      ) : (
                        <>
                          <FileSpreadsheet className="h-4 w-4" />
                          Students List (Excel)
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="w-full max-w-full overflow-x-auto bg-white shadow-sm border border-slate-200 rounded-2xl">
                <Table>
                  <TableHeader>
                    <TableRow>
                      {[...formBaseColumns, ...(educationLevelFilter === "UCE" ? uceSubjectColumns : uaceSubjectColumns)].map((header) => (
                        <TableHead key={header.key} className="whitespace-nowrap">
                          {header.label}
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {consolidatedRows.map((row, idx) => (
                      <TableRow key={`${row.schoolName}-${idx}`}>
                        <TableCell>{row.refNo}</TableCell>
                        <TableCell className="font-semibold text-slate-900">{row.schoolName}</TableCell>
                        <TableCell>{row.district}</TableCell>
                        <TableCell>{row.zone}</TableCell>
                        <TableCell>{row.candidatesRegistered}</TableCell>
                        <TableCell>{row.telephone}</TableCell>
                        {(educationLevelFilter === "UCE" ? uceSubjectColumns : uaceSubjectColumns).map((subject) => (
                          <TableCell key={`${subject.key}-${idx}`}>{row[subject.key] ?? 0}</TableCell>
                        ))}
                      </TableRow>
                    ))}
                    {/* Totals Row */}
                    <TableRow className="bg-slate-50 font-bold border-t-2 border-slate-200">
                      <TableCell colSpan={4} className="text-right">TOTALS</TableCell>
                      <TableCell>
                        {consolidatedRows.reduce((sum, row) => sum + (Number(row.candidatesRegistered) || 0), 0)}
                      </TableCell>
                      <TableCell>-</TableCell>
                      {(educationLevelFilter === "UCE" ? uceSubjectColumns : uaceSubjectColumns).map((subject) => (
                        <TableCell key={`total-${subject.key}`}>
                          {consolidatedRows.reduce((sum, row) => sum + (Number(row[subject.key]) || 0), 0)}
                        </TableCell>
                      ))}
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        )}

        <TabsContent value="subject-wise">
          <Card>
            <CardHeader className="border-b border-slate-200">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <CardTitle className="text-slate-900">Subject-Wise Report</CardTitle>
                  <CardDescription className="text-slate-500">
                    Review system-wide student totals per subject without
                    mixing UCE and UACE records.
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleExport("pdf", "School Students List")}
                    disabled={isExporting("pdf", "School Students List")}
                  >
                    {isExporting("pdf", "School Students List") ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <FileText className="h-4 w-4" />
                        Students List (PDF)
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6 space-y-5">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                  <Select value={subjectWiseLevelFilter} onValueChange={(value: "UCE" | "UACE") => setSubjectWiseLevelFilter(value)}>
                    <SelectTrigger className="w-full sm:w-[160px]">
                      <SelectValue placeholder="Select level" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="UCE">UCE (O Level)</SelectItem>
                      <SelectItem value="UACE">UACE (A Level)</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={selectedSubjectCode} onValueChange={setSelectedSubjectCode}>
                    <SelectTrigger className="w-full lg:w-[320px]">
                      <SelectValue placeholder="Select subject" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Subjects</SelectItem>
                      {subjectWiseData.map((subject) => (
                        <SelectItem key={subject.key} value={subject.key}>
                          {subject.code} - {subject.subject}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="text-sm text-slate-500">
                  Students in selected subject:{" "}
                  <span className="font-semibold text-slate-900">{subjectStudentsList.length}</span>
                </div>
              </div>

              <div>
                <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Code</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead>Level</TableHead>
                    <TableHead className="text-right">Total Schools</TableHead>
                    <TableHead className="text-right">Total Students (Candidates)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {subjectWiseData.map((subject) => (
                    <TableRow key={subject.key}>
                      <TableCell>
                        <Badge variant="outline">{subject.code}</Badge>
                      </TableCell>
                      <TableCell className="font-semibold text-slate-900">
                        {subject.subject}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{subject.level}</Badge>
                      </TableCell>
                      <TableCell className="text-right font-semibold text-slate-900">
                        {subject.totalSchools}
                      </TableCell>
                      <TableCell className="text-right font-semibold text-slate-900">
                        {subject.totalStudents}
                      </TableCell>
                    </TableRow>
                  ))}
                  {/* Totals Row */}
                  <TableRow className="bg-slate-50 font-bold border-t-2 border-slate-200">
                    <TableCell colSpan={3} className="text-right uppercase">System-Wide Totals</TableCell>
                    <TableCell className="text-right">
                      {subjectWiseData.reduce((sum, s) => sum + s.totalSchools, 0)}
                    </TableCell>
                    <TableCell className="text-right">
                      {subjectWiseData.reduce((sum, s) => sum + s.totalStudents, 0)}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
              </div>

              <Card className="border border-slate-200 shadow-none hover:shadow-none hover:translate-y-0">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Students List (Selected Subject)</CardTitle>
                  <CardDescription>
                    {selectedSubjectCode === "all"
                      ? "Showing all students in your current scope."
                      : "Showing students doing the selected subject."}
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Reg Number</TableHead>
                        <TableHead>Student Name</TableHead>
                        <TableHead>School</TableHead>
                        <TableHead>Subject</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {subjectStudentsList.map((student) => (
                        <TableRow key={student.id}>
                          <TableCell className="font-mono text-xs">{student.registrationNumber}</TableCell>
                          <TableCell className="font-semibold text-slate-900">{student.studentName}</TableCell>
                          <TableCell>{student.schoolName}</TableCell>
                          <TableCell>
                            {selectedSubjectCode === "all"
                              ? "All"
                              : subjectWiseData.find((subject) => subject.key === selectedSubjectCode)?.code ?? "Selected"}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="school-wise" className="mt-0">
          <Card>
            <CardHeader className="border-b border-slate-200 py-4">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <CardTitle className="text-base font-semibold text-slate-900">School Report</CardTitle>
                </div>
                {isAdmin ? (
                  <div className="flex w-full flex-col gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-2 lg:w-auto lg:flex-row lg:items-center">
                    <Select value={selectedSchool} onValueChange={setSelectedSchool}>
                      <SelectTrigger className="w-full border-white bg-white lg:w-[300px]">
                        <SelectValue placeholder="Select school" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Choose a school</SelectItem>
                        {scopedSchools.map((school) => (
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
                      <SelectTrigger className="w-full border-white bg-white lg:w-[160px]">
                        <SelectValue placeholder="Level" />
                      </SelectTrigger>
                      <SelectContent>
                        {(selectedSchoolAvailableLevels.length > 0
                          ? selectedSchoolAvailableLevels
                          : ["UCE", "UACE"]
                        ).map((level) => (
                          <SelectItem key={level} value={level}>
                            {level} Form
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ) : (
                  <div className="flex w-full flex-col gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-2 lg:w-auto lg:flex-row lg:items-center">
                    <div className="w-full rounded-xl border border-white bg-white px-4 py-2.5 text-sm text-slate-500 lg:w-[300px]">
                      School
                      <span className="mx-2 text-slate-300">|</span>
                      <span className="font-semibold text-slate-900">
                        {scopedSchools[0]?.name || user?.schoolCode}
                      </span>
                    </div>
                    <Select
                      value={selectedSchoolReportLevel}
                      onValueChange={(value: "UCE" | "UACE") => setSelectedSchoolReportLevel(value)}
                    >
                      <SelectTrigger className="w-full border-white bg-white lg:w-[160px]">
                        <SelectValue placeholder="Level" />
                      </SelectTrigger>
                      <SelectContent>
                        {(selectedSchoolAvailableLevels.length > 0
                          ? selectedSchoolAvailableLevels
                          : ["UCE", "UACE"]
                        ).map((level) => (
                          <SelectItem key={level} value={level}>
                            {level} Form
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent className="pt-4">
              {!selectedSchoolData || !selectedSchoolProfile ? (
                <div className="bg-white shadow-sm border border-slate-200 rounded-2xl py-16 text-center text-slate-500">
                  <School className="mx-auto mb-3 h-12 w-12 opacity-50" />
                  <p>Select a school to view the detailed report.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
                    <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
                      <div className="min-w-0 space-y-0.5">
                        <h3 className="text-xl font-bold text-slate-900">
                          {selectedSchoolData.name}
                        </h3>
                        <p className="text-sm text-slate-600">
                          {selectedSchoolData.code} / {selectedSchoolData.district} / {selectedSchoolData.zone}
                        </p>
                      </div>
                      <div className="grid gap-x-4 gap-y-2 text-sm sm:grid-cols-3 lg:max-w-[520px] lg:flex-1 lg:justify-end">
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                            Academic Year
                          </p>
                          <p className="mt-1 font-semibold text-slate-900">
                            {selectedSchoolData.academicYear || "2026"}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                            Payment Status
                          </p>
                          <div className="mt-1">{getStatusBadge(selectedSchoolData.status)}</div>
                        </div>
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                            Last Updated
                          </p>
                          <p className="mt-1 font-semibold text-slate-900">
                            {selectedSchoolProfile.lastUpdated}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-3 md:grid-cols-2">
                    <Card className="border-l-4 border-l-red-600">
                      <CardContent className="pt-6">
                        <p className="text-sm text-slate-500">Total Students</p>
                        <p className="mt-2 text-3xl font-bold text-slate-900">
                          {selectedSchoolProfile.totalStudents}
                        </p>
                      </CardContent>
                    </Card>
                    <Card className="border-l-4 border-l-amber-500">
                      <CardContent className="pt-6">
                        <p className="text-sm text-slate-500">
                          Subjects Registered
                        </p>
                        <p className="mt-2 text-3xl font-bold text-slate-900">
                          {selectedSchoolProfile.subjectsRegistered}
                        </p>
                      </CardContent>
                    </Card>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
                    <Button
                      variant="outline"
                      className="w-full justify-center h-11 rounded-xl border-slate-200"
                      onClick={() => handleExport("pdf", "School Students List")}
                      disabled={isExporting("pdf", "School Students List")}
                    >
                      {isExporting("pdf", "School Students List") ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : (
                        <FileText className="h-4 w-4 mr-2" />
                      )}
                      Students List (PDF)
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full justify-center h-11 rounded-xl border-slate-200"
                      onClick={() => handleExport("excel", "School Students List")}
                      disabled={isExporting("excel", "School Students List")}
                    >
                      {isExporting("excel", "School Students List") ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : (
                        <FileSpreadsheet className="h-4 w-4 mr-2" />
                      )}
                      Students List (Excel)
                    </Button>
                    <Button
                      variant="default"
                      className="w-full justify-center h-11 rounded-xl bg-red-600 hover:bg-red-700 text-white"
                      onClick={() => handleExport("pdf", "Summary of Entries (UACE)")}
                      disabled={isExporting("pdf", "Summary of Entries (UACE)")}
                    >
                      <FileText className="h-4 w-4 mr-2" />
                      UACE Summary of Entries (PDF)
                    </Button>
                    <Button
                      variant="default"
                      className="w-full justify-center h-11 rounded-xl bg-blue-600 hover:bg-blue-700 text-white"
                      onClick={() => handleExport("pdf", "Summary of Entries (UCE)")}
                      disabled={isExporting("pdf", "Summary of Entries (UCE)")}
                    >
                      <FileText className="h-4 w-4 mr-2" />
                      UCE Summary of Entries (Appendix 1)
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
