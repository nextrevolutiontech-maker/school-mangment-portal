import { useEffect, useMemo, useState } from "react";
import {
  FileSpreadsheet,
  FileText,
  BarChart3,
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

type EducationLevelFilter = "all" | "UCE" | "UACE";

type FormColumn = {
  key: string;
  label: string;
};

const formBaseColumns: FormColumn[] = [
  { key: "refNo", label: "Ref No." },
  { key: "schoolName", label: "Name of school" },
  { key: "district", label: "District" },
  { key: "zone", label: "Zone / Centre" },
  { key: "registeredSubjects", label: "Registered subjects" },
  { key: "telephone", label: "Telephone" },
];

const uaceSubjectColumns: FormColumn[] = [
  { key: "GP", label: "GP" },
  { key: "SUB_MATHS", label: "Sub Maths" },
  { key: "SUB_ICT", label: "Sub ICT" },
  { key: "HIST", label: "History" },
  { key: "ENT", label: "Ent" },
  { key: "IRE", label: "IRE" },
  { key: "CRE", label: "CRE" },
  { key: "GEOG", label: "Geography" },
  { key: "LIT", label: "Literature" },
  { key: "KISWA", label: "Kiswahili" },
  { key: "ART", label: "Art" },
  { key: "PHY", label: "Physics" },
  { key: "CHEM", label: "Chemistry" },
  { key: "BIO", label: "Biology" },
  { key: "MATH", label: "Maths" },
  { key: "AGRIC", label: "Agriculture" },
  { key: "FN", label: "F/N" },
  { key: "TD", label: "TD" },
  { key: "FRENCH", label: "French" },
  { key: "GERMAN", label: "German" },
  { key: "ARABIC", label: "Arabic" },
  { key: "LUGANDA", label: "Luganda" },
  { key: "RUNY", label: "Runy-Rukiga" },
  { key: "LUSOGA", label: "Lusoga" },
];

const uceSubjectColumns: FormColumn[] = [
  { key: "ENG", label: "English" },
  { key: "MATH", label: "Maths" },
  { key: "BIO", label: "Biology" },
  { key: "CHEM", label: "Chemistry" },
  { key: "PHY", label: "Physics" },
  { key: "HIST", label: "History" },
  { key: "GEOG", label: "Geography" },
  { key: "CRE", label: "CRE" },
  { key: "IRE", label: "IRE" },
  { key: "CPS", label: "Comp" },
  { key: "FRENCH", label: "French" },
  { key: "GERMAN", label: "German" },
  { key: "ARABIC", label: "Arabic" },
  { key: "LUGANDA", label: "Luganda" },
  { key: "RUNY", label: "Runy-Rukiga" },
  { key: "LUSOGA", label: "Lusoga" },
];

const entryColumns: FormColumn[] = [
  { key: "entries", label: "Entries" },
  { key: "p1", label: "P1" },
  { key: "p2", label: "P2" },
  { key: "p3", label: "P3" },
  { key: "p4", label: "P4" },
];

type FormRow = Record<string, string | number>;

type OfficialSubjectRow = {
  key: string;
  code: string;
  name: string;
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

function mapSubjectCode(subjectCode: string) {
  const normalized = subjectCode.toUpperCase();
  const aliases: Record<string, string> = {
    ENG: "ENG",
    MTH: "MATH",
    CPS: "CPS",
    ETP: "ENT",
    ECN: "ENT",
    GEO: "GEOG",
    HIS: "HIST",
    CHM: "CHEM",
    BIO: "BIO",
    PHY: "PHY",
    GP: "GP",
    LIT: "LIT",
    CRE: "CRE",
    IRE: "IRE",
  };
  return aliases[normalized] ?? normalized;
}

function getOfficialSubjectRows(level: "UACE" | "UCE") {
  return level === "UACE" ? uaceOfficialSubjectRows : uceOfficialSubjectRows;
}

function formatPaperCell(value: unknown) {
  const numeric = Number(value ?? 0);
  return numeric > 0 ? String(numeric) : "-";
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
  const [selectedSchoolReportLevel, setSelectedSchoolReportLevel] = useState<"UCE" | "UACE">("UCE");
  const [exportingKey, setExportingKey] = useState<string | null>(null);
  const [educationLevelFilter, setEducationLevelFilter] = useState<EducationLevelFilter>("all");
  const [lateFee] = useState(0);

  useEffect(() => {
    if (user?.role === "school" && user.schoolCode) {
      setSelectedSchool(user.schoolCode);
    }
  }, [user?.role, user?.schoolCode]);

  const consolidatedRows = useMemo<FormRow[]>(() => {
    const filteredSchools = scopedSchools.filter((school) => {
      if (educationLevelFilter === "all") return true;
      return school.educationLevel === educationLevelFilter || school.educationLevel === "BOTH";
    });

    return filteredSchools.map((school, index) => {
      const schoolStudents = scopedStudents.filter((student) => student.schoolCode === school.code);
      const registeredSubjects = new Set(schoolStudents.map((student) => student.subjectCode)).size;
      const isUaceForm = educationLevelFilter === "UACE" || school.educationLevel === "UACE";
      const subjectColumns = isUaceForm ? uaceSubjectColumns : uceSubjectColumns;

      const subjectCounts = schoolStudents.reduce<
        Record<string, { entries: number; p1: number; p2: number; p3: number; p4: number }>
      >((acc, student) => {
        const key = mapSubjectCode(student.subjectCode);
        if (!acc[key]) {
          acc[key] = { entries: 0, p1: 0, p2: 0, p3: 0, p4: 0 };
        }
        acc[key].entries += student.totalEntries;
        acc[key].p1 += student.entry1;
        acc[key].p2 += student.entry2;
        acc[key].p3 += student.entry3;
        acc[key].p4 += student.entry4;
        return acc;
      }, {});

      const row: FormRow = {
        refNo: index + 1,
        schoolName: school.name,
        district: school.district,
        zone: school.zone,
        registeredSubjects,
        telephone: school.phone,
      };

      subjectColumns.forEach((subject) => {
        const metrics = subjectCounts[subject.key] ?? {
          entries: 0,
          p1: 0,
          p2: 0,
          p3: 0,
          p4: 0,
        };
        row[`${subject.key}_entries`] = metrics.entries;
        row[`${subject.key}_p1`] = metrics.p1;
        row[`${subject.key}_p2`] = metrics.p2;
        row[`${subject.key}_p3`] = metrics.p3;
        row[`${subject.key}_p4`] = metrics.p4;
      });

      return row;
    });
  }, [scopedSchools, scopedStudents, educationLevelFilter]);

  const subjectWiseData = useMemo(
    () =>
      subjects.map((subject) => {
        const subjectStudents = scopedStudents.filter((student) => student.subjectCode === subject.code);
        return {
          subject: subject.name,
          code: subject.code,
          level: subject.educationLevel,
          totalStudents: subjectStudents.length,
          schools: new Set(subjectStudents.map((student) => student.schoolCode)).size,
          average:
            subjectStudents.length > 0
              ? Math.round(
                  subjectStudents.reduce((sum, student) => sum + student.totalEntries, 0) /
                    subjectStudents.length,
                )
              : 0,
        };
      }),
    [subjects, scopedStudents],
  );

  const subjectStudentsList = useMemo(() => {
    if (selectedSubjectCode === "all") return scopedStudents;
    return scopedStudents.filter((student) => student.subjectCode === selectedSubjectCode);
  }, [scopedStudents, selectedSubjectCode]);

  const selectedSchoolData =
    selectedSchool !== "all"
      ? scopedSchools.find((school) => school.code === selectedSchool)
      : undefined;

  useEffect(() => {
    if (!selectedSchoolData) return;
    if (selectedSchoolData.educationLevel === "UACE") {
      setSelectedSchoolReportLevel("UACE");
    } else if (selectedSchoolData.educationLevel === "UCE") {
      setSelectedSchoolReportLevel("UCE");
    }
  }, [selectedSchoolData?.code, selectedSchoolData?.educationLevel]);

  const selectedSchoolProfile = useMemo(() => {
    if (!selectedSchoolData) return undefined;
    const schoolStudents = scopedStudents.filter((student) => student.schoolCode === selectedSchoolData.code);
    return {
      totalStudents: schoolStudents.length,
      subjectsRegistered: new Set(schoolStudents.map((student) => student.subjectCode)).size,
      reportNote: "Report generated from current frontend simulation state.",
      lastUpdated: new Date().toLocaleDateString(),
    };
  }, [selectedSchoolData, scopedStudents]);

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
    const subjectCounts = schoolStudents.reduce<
      Record<string, { entries: number; p1: number; p2: number; p3: number; p4: number }>
    >((acc, student) => {
      const key = mapSubjectCode(student.subjectCode);
      if (!acc[key]) {
        acc[key] = { entries: 0, p1: 0, p2: 0, p3: 0, p4: 0 };
      }
      acc[key].entries += student.totalEntries;
      acc[key].p1 += student.entry1;
      acc[key].p2 += student.entry2;
      acc[key].p3 += student.entry3;
      acc[key].p4 += student.entry4;
      return acc;
    }, {});

    const row: FormRow = {
      refNo: 1,
      schoolName: school.name,
      district: school.district,
      zone: school.zone,
      registeredSubjects: new Set(schoolStudents.map((student) => student.subjectCode)).size,
      telephone: school.phone,
    };

    subjectColumns.forEach((subject) => {
      const metrics = subjectCounts[subject.key] ?? {
        entries: 0,
        p1: 0,
        p2: 0,
        p3: 0,
        p4: 0,
      };
      row[`${subject.key}_entries`] = metrics.entries;
      row[`${subject.key}_p1`] = metrics.p1;
      row[`${subject.key}_p2`] = metrics.p2;
      row[`${subject.key}_p3`] = metrics.p3;
      row[`${subject.key}_p4`] = metrics.p4;
    });

    return row;
  };

  const getPaperSelectionText = (student: (typeof scopedStudents)[number]) => {
    const papers: string[] = [];
    if (student.entry1 > 0) papers.push("P1");
    if (student.entry2 > 0) papers.push("P2");
    if (student.entry3 > 0) papers.push("P3");
    if (student.entry4 > 0) papers.push("P4");
    return papers.length > 0 ? papers.join(", ") : "-";
  };

  const summaryCards = [
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
    {
      label: "Payment Submitted",
      value: scopedSchools.filter((school) => school.status === "payment_submitted").length,
      className: "border-l-blue-500",
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
      const entriesKeys = Object.keys(row).filter((key) => key.endsWith("_entries"));
      return sum + entriesKeys.reduce((entrySum, key) => entrySum + Number(row[key] || 0), 0) * 100;
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
      row.registeredSubjects,
      row.telephone,
      ...subjectsColumns.flatMap((subject) => [
        row[`${subject.key}_entries`] ?? 0,
        row[`${subject.key}_p1`] ?? 0,
        row[`${subject.key}_p2`] ?? 0,
        row[`${subject.key}_p3`] ?? 0,
        row[`${subject.key}_p4`] ?? 0,
      ]),
    ]);

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
      let yPos = 15;
      const subjectsColumns = level === "UACE" ? uaceSubjectColumns : uceSubjectColumns;
      const fee = calculateFeeSummary(rows);

      // Title
      pdf.setFontSize(14);
      pdf.setFont("helvetica", "bold");
      pdf.text(`WAKISSHA JOINT MOCK ${level} SUMMARY 2026`, pageWidth / 2, yPos, {
        align: "center",
      });
      yPos += 8;

      // Header info with better spacing
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(9);
      const totalCandidates =
        schoolContext?.totalCandidates ??
        rows.reduce((sum, row) => sum + Number(row.registeredSubjects || 0), 0);
      
      pdf.text(`YEAR: ${schoolContext?.academicYear ?? "2026"}`, margin, yPos);
      pdf.text(`TOTAL CANDIDATES: ${totalCandidates}`, 100, yPos);
      yPos += 6;

      if (schoolContext) {
        pdf.setFont("helvetica", "bold");
        pdf.text("SCHOOL DETAILS", margin, yPos);
        yPos += 5;
        
        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(8.5);
        pdf.text(`School: ${schoolContext.name}`, margin + 2, yPos);
        yPos += 4;
        pdf.text(`Reference: ${schoolContext.code} | District: ${schoolContext.district}`, margin + 2, yPos);
        yPos += 4;
        pdf.text(`Zone: ${schoolContext.zone} | Phone: ${schoolContext.telephone}`, margin + 2, yPos);
        yPos += 4;
        
        if (schoolContext.contactPerson) {
          pdf.text(`Contact: ${schoolContext.contactPerson} (${schoolContext.contactDesignation || "Head"})`, margin + 2, yPos);
          yPos += 4;
        }
        
        yPos += 3;
      }

      if (schoolContext && rows.length === 1) {
        const row = rows[0];
        const officialSubjectRows = getOfficialSubjectRows(level);
        
        autoTable(pdf, {
          head: [["CODE", "SUBJECT NAME", "ENTRIES", "P1", "P2", "P3", "P4"]],
          body: officialSubjectRows.map((subject) => [
            subject.code,
            subject.name,
            String(row[`${subject.key}_entries`] ?? 0),
            formatPaperCell(row[`${subject.key}_p1`]),
            formatPaperCell(row[`${subject.key}_p2`]),
            formatPaperCell(row[`${subject.key}_p3`]),
            formatPaperCell(row[`${subject.key}_p4`]),
          ]),
          startY: yPos,
          margin: { left: margin, right: margin, top: 5 },
          columnStyles: {
            0: { cellWidth: 16, halign: "center" },
            1: { cellWidth: 100 },
            2: { cellWidth: 18, halign: "center" },
            3: { cellWidth: 14, halign: "center" },
            4: { cellWidth: 14, halign: "center" },
            5: { cellWidth: 14, halign: "center" },
            6: { cellWidth: 14, halign: "center" },
          },
          headStyles: {
            fillColor: [41, 128, 185],
            textColor: [255, 255, 255],
            lineWidth: 0.5,
            lineColor: [41, 128, 185],
            fontSize: 10,
            fontStyle: "bold",
            halign: "center",
            padding: 4,
          },
          bodyStyles: {
            lineWidth: 0.3,
            lineColor: [200, 200, 200],
            fontSize: 9,
            textColor: [0, 0, 0],
            padding: 3,
          },
          alternateRowStyles: {
            fillColor: [245, 250, 255],
          },
        });
      } else {
        // Multi-school consolidated report - PLAIN BLACK AND WHITE FORM
        // Calculate optimal column widths
        const pageWidth = pdf.internal.pageSize.getWidth();
        const margins = 5;
        const usableWidth = pageWidth - (margins * 2);
        
        // Base columns with proper widths for readability
        const baseColWidths = {
          ref: 7,
          school: 30,
          district: 15,
          zone: 16,
          subs: 14,
          phone: 14,
        };
        const baseColsTotal = Object.values(baseColWidths).reduce((a, b) => a + b, 0);
        
        // Subject columns - calculate to fill remaining space
        const subjectColWidth = (usableWidth - baseColsTotal) / subjectsColumns.length;
        
        // Build header row with exact column names from reference image
        const headerRow = [
          "Ref No",
          "Name of School",
          "District",
          "Zone / Centre",
          "Registered Subjects",
          "Telephone",
          ...subjectsColumns.map((s) => s.label),
        ];

        // Build body rows
        const bodyRows = rows.map((row) => [
          String(row.refNo),
          String(row.schoolName),
          String(row.district),
          String(row.zone),
          String(row.registeredSubjects),
          String(row.telephone),
          ...subjectsColumns.map((subject) => String(row[`${subject.key}_entries`] ?? 0)),
        ]);

        // Calculate totals
        const totalRow = [
          "",
          "",
          "",
          "",
          "",
          "",
          ...subjectsColumns.map((subject) =>
            String(
              rows.reduce((sum, row) => sum + Number(row[`${subject.key}_entries`] ?? 0), 0)
            )
          ),
        ];

        // Combine all rows
        const allRows = [...bodyRows, totalRow];

        // Build column styles - PLAIN BLACK AND WHITE
        const columnStyles: any = {
          0: { cellWidth: baseColWidths.ref, halign: "center", fontSize: 8, padding: 1.5 },
          1: { cellWidth: baseColWidths.school, halign: "left", fontSize: 8, padding: 1.5 },
          2: { cellWidth: baseColWidths.district, halign: "center", fontSize: 8, padding: 1.5 },
          3: { cellWidth: baseColWidths.zone, halign: "center", fontSize: 8, padding: 1.5 },
          4: { cellWidth: baseColWidths.subs, halign: "center", fontSize: 8, padding: 1.5 },
          5: { cellWidth: baseColWidths.phone, halign: "center", fontSize: 8, padding: 1.5 },
        };

        // Add subject column styles
        subjectsColumns.forEach((_, idx) => {
          columnStyles[6 + idx] = {
            cellWidth: subjectColWidth,
            halign: "center",
            fontSize: 7,
            padding: 1,
          };
        });

        // Create plain black and white table
        autoTable(pdf, {
          head: [headerRow],
          body: allRows,
          startY: yPos,
          margin: { left: margins, right: margins },
          columnStyles: columnStyles,
          headStyles: {
            fillColor: [255, 255, 255], // White background
            textColor: [0, 0, 0], // Black text
            lineWidth: 0.5,
            lineColor: [0, 0, 0], // Black borders
            fontSize: 8,
            fontStyle: "bold",
            halign: "center",
            valign: "middle",
            padding: 1.5,
          },
          bodyStyles: {
            lineWidth: 0.5,
            lineColor: [0, 0, 0], // Black borders
            fontSize: 7,
            textColor: [0, 0, 0], // Black text
            padding: 1,
            fillColor: [255, 255, 255], // White background
          },
          alternateRowStyles: {
            fillColor: [255, 255, 255], // Keep white, no alternating colors
          },
          didParseCell: (data: any) => {
            // Make TOTAL row bold
            if (data.row.index === allRows.length - 1) {
              data.cell.styles.fontStyle = "bold";
              data.cell.styles.lineWidth = 0.5;
            }
          },
        });
      }

      // Fee summary - always on current or new page
      const lastTableY = (pdf as any).lastAutoTable?.finalY ?? 200;
      let feeSummaryY = lastTableY + 12;

      if (feeSummaryY > 250) {
        pdf.addPage();
        feeSummaryY = 20;
      }

      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(12);
      pdf.text("FEE SUMMARY", margin, feeSummaryY);
      feeSummaryY += 7;
      
      const feeSummaryData = [
        ["School Fee", `UGX ${fee.schoolFee.toLocaleString()}`],
        ["Student Fee", `UGX ${fee.studentFee.toLocaleString()}`],
        ["Late Fee", `UGX ${fee.lateFee.toLocaleString()}`],
        ["Marking Fee", `UGX ${fee.markingFee.toLocaleString()}`],
      ];
      
      autoTable(pdf, {
        head: [["Description", "Amount"]],
        body: feeSummaryData,
        startY: feeSummaryY,
        margin: { left: margin, right: pageWidth - margin - 100 },
        tableWidth: 100,
        columnStyles: {
          0: { cellWidth: 60 },
          1: { cellWidth: 40 },
        },
        headStyles: {
          fillColor: [255, 255, 255], // White background
          textColor: [0, 0, 0], // Black text
          fontSize: 10,
          fontStyle: "bold",
          lineWidth: 0.5,
          lineColor: [0, 0, 0], // Black borders
          padding: 3,
        },
        bodyStyles: {
          fontSize: 10,
          textColor: [0, 0, 0], // Black text
          padding: 2,
          lineWidth: 0.5,
          lineColor: [0, 0, 0], // Black borders
          fillColor: [255, 255, 255], // White background
        },
        alternateRowStyles: {
          fillColor: [255, 255, 255], // Keep white
        },
      });
      
      const totalEndY = (pdf as any).lastAutoTable.finalY + 5;
      pdf.setFontSize(12);
      pdf.setFont("helvetica", "bold");
      pdf.text(`TOTAL AMOUNT: UGX ${fee.totalAmount.toLocaleString()}`, margin, totalEndY);

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

  const generateReadableSummaryPDF = () => {
    try {
      const preferredSchool =
        (selectedSchool !== "all"
          ? scopedSchools.find((school) => school.code === selectedSchool)
          : scopedSchools.find(
              (school) =>
                school.educationLevel === "UACE" || school.educationLevel === "BOTH",
            )) ?? scopedSchools[0];

      if (!preferredSchool) {
        toast.error("No school data available");
        return;
      }

      const row = consolidatedRows.find((record) => record.schoolName === preferredSchool.name);
      if (!row) {
        toast.error("No report data available for selected school");
        return;
      }

      const schoolStudents = scopedStudents.filter(
        (student) => student.schoolCode === preferredSchool.code,
      );
      const totalEntries = uaceSubjectColumns.reduce(
        (sum, subject) => sum + Number(row[`${subject.key}_entries`] || 0),
        0,
      );
      const fee = calculateFeeSummary([row]);

      const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      const pageWidth = pdf.internal.pageSize.getWidth();
      const margin = 14;
      let y = 16;

      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(15);
      pdf.text("WAKISSHA UACE SUMMARY REPORT 2026", pageWidth / 2, y, { align: "center" });
      y += 8;

      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(10);
      pdf.text(`School Name: ${preferredSchool.name}`, margin, y);
      y += 5;
      pdf.text(`District: ${preferredSchool.district}`, margin, y);
      y += 5;
      pdf.text(`Zone: ${preferredSchool.zone}`, margin, y);
      y += 5;
      pdf.text(`Total Students: ${schoolStudents.length}`, margin, y);
      y += 8;

      const subjectGroups = [
        {
          title: "Core Subjects",
          keys: ["GP", "HIST", "ECON", "ENT", "MATH"],
        },
        {
          title: "Sciences",
          keys: ["PHY", "CHEM", "BIO", "AGRIC", "FN", "TD"],
        },
        {
          title: "Languages",
          keys: ["LIT", "KISWA", "FRENCH", "GERMAN", "ARABIC", "LUGANDA", "RUNY", "LUSOGA"],
        },
      ] as const;

      for (const group of subjectGroups) {
        if (y > 240) {
          pdf.addPage();
          y = 18;
        }

        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(11);
        pdf.text(group.title, margin, y);
        y += 5;

        let xCol = margin;
        let colY = y;
        const colWidth = 86;

        group.keys.forEach((key, index) => {
          const subject = uaceSubjectColumns.find((subjectCol) => subjectCol.key === key);
          if (!subject) return;

          const metrics = [
            ["Entries", String(row[`${key}_entries`] ?? 0)],
            ["P1", String(row[`${key}_p1`] ?? 0)],
            ["P2", String(row[`${key}_p2`] ?? 0)],
            ["P3", String(row[`${key}_p3`] ?? 0)],
            ["P4", String(row[`${key}_p4`] ?? 0)],
          ];

          pdf.setFont("helvetica", "bold");
          pdf.setFontSize(9);
          pdf.text(`SUBJECT: ${subject.label}`, xCol, colY);

          autoTable(pdf, {
            startY: colY + 1.5,
            margin: { left: xCol, right: pageWidth - xCol - colWidth },
            tableWidth: colWidth,
            head: [["Metric", "Value"]],
            body: metrics,
            styles: {
              fontSize: 8,
              lineWidth: 0.2,
              lineColor: [120, 120, 120],
            },
            headStyles: {
              fillColor: [245, 247, 252],
              textColor: [15, 23, 42],
              fontStyle: "bold",
            },
          });

          const endY = (pdf as any).lastAutoTable.finalY + 4;
          const goNextColumn = index % 2 === 0;
          if (goNextColumn) {
            xCol = margin + colWidth + 8;
          } else {
            xCol = margin;
            colY = endY;
            if (colY > 235 && index < group.keys.length - 1) {
              pdf.addPage();
              colY = 18;
            }
          }
        });

        y = colY + 4;
      }

      if (y > 245) {
        pdf.addPage();
        y = 18;
      }

      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(11);
      pdf.text("Summary", margin, y);
      y += 3;
      autoTable(pdf, {
        startY: y,
        margin: { left: margin, right: margin },
        head: [["Metric", "Value"]],
        body: [
          ["Total Students", String(schoolStudents.length)],
          ["Total Entries", String(totalEntries)],
          ["Total Subjects Registered", String(row.registeredSubjects ?? 0)],
        ],
        styles: { fontSize: 9, lineWidth: 0.2, lineColor: [120, 120, 120] },
        headStyles: { fillColor: [245, 247, 252], textColor: [15, 23, 42], fontStyle: "bold" },
      });

      y = (pdf as any).lastAutoTable.finalY + 6;
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(11);
      pdf.text("Fee Section", margin, y);
      y += 3;
      autoTable(pdf, {
        startY: y,
        margin: { left: margin, right: margin },
        head: [["Item", "Amount (UGX)"]],
        body: [
          ["School Fee", fee.schoolFee.toLocaleString()],
          ["Student Fee", fee.studentFee.toLocaleString()],
          ["Total Amount", fee.totalAmount.toLocaleString()],
        ],
        styles: { fontSize: 9, lineWidth: 0.2, lineColor: [120, 120, 120] },
        headStyles: { fillColor: [245, 247, 252], textColor: [15, 23, 42], fontStyle: "bold" },
      });

      pdf.save(`Readable-UACE-Summary-${preferredSchool.code}.pdf`);
      toast.success("Readable summary PDF generated");
    } catch (error) {
      toast.error("Failed to generate readable summary PDF");
      console.error(error);
    }
  };

  const getRowTotalEntries = (row: FormRow) =>
    Object.keys(row)
      .filter((key) => key.endsWith("_entries"))
      .reduce((sum, key) => sum + Number(row[key] || 0), 0);

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
        head: [["Subject", "Code", "Level", "Total Students", "Schools", "Average Entries"]],
        body: subjectWiseData.map((item) => [
          item.subject,
          item.code,
          item.level,
          String(item.totalStudents),
          String(item.schools),
          String(item.average),
        ]),
        styles: { fontSize: 9, lineWidth: 0.2, lineColor: [140, 140, 140] },
        headStyles: { fillColor: [245, 247, 252], textColor: [15, 23, 42], fontStyle: "bold" },
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
      const worksheet = XLSXUtils.json_to_sheet(subjectWiseData);
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
        selected.educationLevel === "UACE" ? uaceSubjectColumns : uceSubjectColumns;
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
        head: [["Subject", "Entries", "P1", "P2", "P3", "P4"]],
        body: subjectsColumns.map((subject) => [
          subject.label,
          String(row[`${subject.key}_entries`] ?? 0),
          String(row[`${subject.key}_p1`] ?? 0),
          String(row[`${subject.key}_p2`] ?? 0),
          String(row[`${subject.key}_p3`] ?? 0),
          String(row[`${subject.key}_p4`] ?? 0),
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
        selected.educationLevel === "UACE" ? uaceSubjectColumns : uceSubjectColumns;
      const worksheet = XLSXUtils.json_to_sheet(
        subjectsColumns.map((subject) => ({
          Subject: subject.label,
          Entries: row[`${subject.key}_entries`] ?? 0,
          P1: row[`${subject.key}_p1`] ?? 0,
          P2: row[`${subject.key}_p2`] ?? 0,
          P3: row[`${subject.key}_p3`] ?? 0,
          P4: row[`${subject.key}_p4`] ?? 0,
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
        ...subjectsColumns.flatMap((subject) =>
          entryColumns.map((entry) => `${subject.label}-${entry.label}`),
        ),
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
      const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(14);
      pdf.text("WAKISSHA STUDENTS REGISTERED LIST", 105, 16, { align: "center" });
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(10);
      pdf.text(`School: ${selected.name}`, 14, 24);
      pdf.text(`Level: ${selectedSchoolReportLevel}   Academic Year: ${selected.academicYear}`, 14, 29);

      autoTable(pdf, {
        startY: 34,
        margin: { left: 12, right: 12 },
        head: [["Reg No", "Student Name", "Subject Code", "Subject Name", "Papers", "Total"]],
        body: rows.map((student) => [
          student.registrationNumber,
          student.studentName,
          student.subjectCode,
          student.subjectName,
          getPaperSelectionText(student),
          String(student.totalEntries),
        ]),
        styles: { fontSize: 8.2, lineWidth: 0.2, lineColor: [120, 120, 120] },
        headStyles: { fillColor: [245, 247, 252], textColor: [15, 23, 42], fontStyle: "bold" },
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
      const worksheet = XLSXUtils.json_to_sheet(
        rows.map((student) => ({
          RegistrationNumber: student.registrationNumber,
          StudentName: student.studentName,
          ExamLevel: student.examLevel,
          SubjectCode: student.subjectCode,
          SubjectName: student.subjectName,
          PapersSelected: getPaperSelectionText(student),
          TotalEntries: student.totalEntries,
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
    const key = buildExportKey(format, reportType);
    if (exportingKey) return;
    setExportingKey(key);

    try {
      if (reportType === "UACE Consolidated") {
        const levelToExport: "UACE" | "UCE" =
          educationLevelFilter === "UCE" ? "UCE" : "UACE";
        const rowsForLevel = consolidatedRows.filter((row) => {
          const school = scopedSchools.find((record) => record.name === row.schoolName);
          if (!school) return false;
          if (levelToExport === "UACE") {
            return school.educationLevel === "UACE" || school.educationLevel === "BOTH";
          }
          return school.educationLevel === "UCE" || school.educationLevel === "BOTH";
        });
        if (format === "pdf") {
          if (levelToExport === "UACE") {
            generateUACEFormPDF(rowsForLevel, "UACE-summary-form");
          } else {
            generateUCEFormPDF(rowsForLevel, "UCE-summary-form");
          }
        } else {
          if (levelToExport === "UACE") {
            generateUACEFormExcel(rowsForLevel, "UACE-summary-form");
          } else {
            generateUCEFormExcel(rowsForLevel, "UCE-summary-form");
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
        generateReadableSummaryPDF();
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
      }
    } finally {
      setExportingKey(null);
    }
  };

  return (
    <div className="mx-auto flex w-full max-w-[1240px] flex-col gap-6 anim-fade-up">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-2">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-red-500">
            Reporting Centre
          </p>
          <h1 className="text-3xl font-bold text-shimmer">Reports</h1>
          <p className="max-w-3xl text-slate-500">
            Generate UACE consolidated exports, subject-wise breakdowns, and
            dynamic single-school reports for the Phase 1 frontend demo.
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Button variant="outline" onClick={() => onPageChange("timetable")}>
            Go to Timetable
          </Button>
          <Button
            variant="outline"
            onClick={() => handleExport("pdf", "Readable Summary")}
            disabled={isExporting("pdf", "Readable Summary")}
          >
            {isExporting("pdf", "Readable Summary") ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Download className="h-4 w-4" />
                User-Friendly PDF
              </>
            )}
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
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

      <Tabs defaultValue={isAdmin ? "consolidated" : "subject-wise"} className="space-y-4">
        <TabsList className={`grid w-full ${isAdmin ? "grid-cols-3" : "grid-cols-2"}`}>
          {isAdmin && <TabsTrigger value="consolidated">Consolidated</TabsTrigger>}
          <TabsTrigger value="subject-wise">Subject-Wise</TabsTrigger>
          <TabsTrigger value="school-wise">Single School Report</TabsTrigger>
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
                      <SelectItem value="all">All Levels</SelectItem>
                      <SelectItem value="UCE">UCE (O Level)</SelectItem>
                      <SelectItem value="UACE">UACE (A Level)</SelectItem>
                    </SelectContent>
                  </Select>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleExport("pdf", "UACE Consolidated")}
                      disabled={isExporting("pdf", "UACE Consolidated")}
                    >
                      {isExporting("pdf", "UACE Consolidated") ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Generating...
                        </>
                      ) : (
                        <>
                          <FileText className="h-4 w-4" />
                          Export PDF
                        </>
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleExport("excel", "UACE Consolidated")}
                      disabled={isExporting("excel", "UACE Consolidated")}
                    >
                      {isExporting("excel", "UACE Consolidated") ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Generating...
                        </>
                      ) : (
                        <>
                          <FileSpreadsheet className="h-4 w-4" />
                          Export Excel
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
                        <TableCell>{row.registeredSubjects}</TableCell>
                        <TableCell>{row.telephone}</TableCell>
                        {(educationLevelFilter === "UCE" ? uceSubjectColumns : uaceSubjectColumns).map((subject) => (
                          <TableCell key={`${subject.key}-${idx}`}>{row[`${subject.key}_entries`] ?? 0}</TableCell>
                        ))}
                      </TableRow>
                    ))}
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
                    Compare total student counts and school participation by
                    subject.
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleExport("pdf", "Subject-Wise")}
                    disabled={isExporting("pdf", "Subject-Wise")}
                  >
                    {isExporting("pdf", "Subject-Wise") ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <FileText className="h-4 w-4" />
                        Export PDF
                      </>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleExport("excel", "Subject-Wise")}
                    disabled={isExporting("excel", "Subject-Wise")}
                  >
                    {isExporting("excel", "Subject-Wise") ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <FileSpreadsheet className="h-4 w-4" />
                        Export Excel
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6 space-y-5">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <Select value={selectedSubjectCode} onValueChange={setSelectedSubjectCode}>
                  <SelectTrigger className="w-full lg:w-[320px]">
                    <SelectValue placeholder="Select subject" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Subjects</SelectItem>
                    {subjects.map((subject) => (
                      <SelectItem key={subject.code} value={subject.code}>
                        {subject.name} ({subject.code})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="text-sm text-slate-500">
                  Students in selected subject:{" "}
                  <span className="font-semibold text-slate-900">{subjectStudentsList.length}</span>
                </div>
              </div>

              <div>
                <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Subject</TableHead>
                    <TableHead>Code</TableHead>
                    <TableHead>Level</TableHead>
                    <TableHead className="text-right">Total Students</TableHead>
                    <TableHead className="text-right">Schools</TableHead>
                    <TableHead className="text-right">Average</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {subjectWiseData.map((subject) => (
                    <TableRow key={subject.code}>
                      <TableCell className="font-semibold text-slate-900">
                        {subject.subject}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{subject.code}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{subject.level}</Badge>
                      </TableCell>
                      <TableCell className="text-right font-semibold text-slate-900">
                        {subject.totalStudents}
                      </TableCell>
                      <TableCell className="text-right">{subject.schools}</TableCell>
                      <TableCell className="text-right">{subject.average}</TableCell>
                    </TableRow>
                  ))}
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
                          <TableCell>{student.subjectCode}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="school-wise">
          <Card>
            <CardHeader className="border-b border-slate-200">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <CardTitle className="text-slate-900">Single School Report</CardTitle>
                  <CardDescription className="text-slate-500">
                    Export the official school summary form with school details
                    and subject registration data.
                  </CardDescription>
                </div>
                {isAdmin ? (
                  <div className="flex w-full flex-col gap-2 lg:w-auto lg:flex-row">
                    <Select value={selectedSchool} onValueChange={setSelectedSchool}>
                      <SelectTrigger className="w-full lg:w-[320px]">
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
                      <SelectTrigger className="w-full lg:w-[180px]">
                        <SelectValue placeholder="Level" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="UCE">UCE Form</SelectItem>
                        <SelectItem value="UACE">UACE Form</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                ) : (
                  <div className="flex w-full flex-col gap-2 lg:w-auto lg:flex-row">
                    <div className="w-full lg:w-[320px] rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-500">
                      School:{" "}
                      <span className="font-semibold text-slate-900">
                        {scopedSchools[0]?.name || user?.schoolCode}
                      </span>
                    </div>
                    <Select
                      value={selectedSchoolReportLevel}
                      onValueChange={(value: "UCE" | "UACE") => setSelectedSchoolReportLevel(value)}
                    >
                      <SelectTrigger className="w-full lg:w-[180px]">
                        <SelectValue placeholder="Level" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="UCE">UCE Form</SelectItem>
                        <SelectItem value="UACE">UACE Form</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              {!selectedSchoolData || !selectedSchoolProfile ? (
                <div className="bg-white shadow-sm border border-slate-200 rounded-2xl py-16 text-center text-slate-500">
                  <School className="mx-auto mb-3 h-12 w-12 opacity-50" />
                  <p>Select a school to view the detailed report.</p>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="grid gap-4 md:grid-cols-3">
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
                    <Card className="border-l-4 border-l-blue-500">
                      <CardContent className="pt-6">
                        <p className="text-sm text-slate-500">Fees Status</p>
                        <div className="mt-3">
                          {getStatusBadge(selectedSchoolData.status)}
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
                    <Card>
                      <CardContent className="pt-6">
                        <div className="mb-4 flex items-center gap-3">
                          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-red-600/10 text-red-600">
                            <BarChart3 className="h-5 w-5" />
                          </div>
                          <div>
                            <p className="font-semibold text-slate-900">
                              {selectedSchoolData.name}
                            </p>
                            <p className="text-sm text-slate-500">
                              {selectedSchoolData.code} / {selectedSchoolData.district} /{" "}
                              {selectedSchoolData.zone}
                            </p>
                          </div>
                        </div>
                        <p className="text-sm leading-6 text-slate-500">
                          {selectedSchoolProfile.reportNote}
                        </p>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardContent className="space-y-4 pt-6">
                        <div className="bg-white shadow-sm border border-slate-200 rounded-2xl p-4">
                          <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                            Academic Year
                          </p>
                          <p className="mt-2 text-lg font-semibold text-slate-900">
                            {selectedSchoolData.academicYear}
                          </p>
                        </div>
                        <div className="bg-white shadow-sm border border-slate-200 rounded-2xl p-4">
                          <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                            Activation Code
                          </p>
                          <p className="mt-2 text-lg font-semibold text-slate-900">
                            {selectedSchoolData.activationCode || "Pending activation"}
                          </p>
                        </div>
                        <div className="bg-white shadow-sm border border-slate-200 rounded-2xl p-4">
                          <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                            Last Updated
                          </p>
                          <p className="mt-2 text-lg font-semibold text-slate-900">
                            {selectedSchoolProfile.lastUpdated}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  <div className="flex flex-wrap justify-end gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleExport("pdf", "Single School")}
                      disabled={isExporting("pdf", "Single School")}
                    >
                      {isExporting("pdf", "Single School") ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Generating...
                        </>
                      ) : (
                        <>
                          <FileText className="h-4 w-4" />
                          Export PDF
                        </>
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleExport("excel", "Single School")}
                      disabled={isExporting("excel", "Single School")}
                    >
                      {isExporting("excel", "Single School") ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Generating...
                        </>
                      ) : (
                        <>
                          <FileSpreadsheet className="h-4 w-4" />
                          Export Excel
                        </>
                      )}
                    </Button>
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
                          Students List PDF
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
                          Students List Excel
                        </>
                      )}
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




