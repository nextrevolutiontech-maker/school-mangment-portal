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
  { key: "refNo", label: "Ref" },
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
      const registeredSubjects = new Set(
        schoolStudents.flatMap((student) => student.subjects?.map((s) => s.subjectCode) ?? [])
      ).size;

      // Determine which subject columns to use based on education level
      const isUaceForm = educationLevelFilter === "UACE" || school.educationLevel === "UACE";
      const subjectColumns = isUaceForm ? uaceSubjectColumns : uceSubjectColumns;

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
        registeredSubjects,
        telephone: school.phone,
      };

      // Add subject columns with student counts (not entry breakdowns)
      subjectColumns.forEach((subject) => {
        row[subject.key] = subjectCounts[subject.key] ?? 0;
      });

      return row;
    });
  }, [scopedSchools, scopedStudents, educationLevelFilter]);

  const subjectWiseData = useMemo(
    () =>
      subjects.map((subject) => {
        // Flatten students - each student might have this subject multiple times, count unique
        const subjectStudents = new Set<string>();
        scopedStudents.forEach((student) => {
          if (student.subjects?.some((s) => s.subjectCode === subject.code)) {
            subjectStudents.add(student.id);
          }
        });

        const totalStudentCount = subjectStudents.size;
        const schools = new Set<string>();
        scopedStudents.forEach((student) => {
          if (student.subjects?.some((s) => s.subjectCode === subject.code)) {
            schools.add(student.schoolCode);
          }
        });

        return {
          subject: subject.name,
          code: subject.code,
          level: subject.educationLevel,
          totalStudents: totalStudentCount,
          schools: schools.size,
          average: totalStudentCount > 0 ? Math.round(totalStudentCount / Math.max(schools.size, 1)) : 0,
        };
      }),
    [subjects, scopedStudents],
  );

  const subjectStudentsList = useMemo(() => {
    if (selectedSubjectCode === "all") return scopedStudents;
    // Filter students that have the selected subject
    return scopedStudents.filter((student) =>
      student.subjects?.some((s) => s.subjectCode === selectedSubjectCode)
    );
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
      subjectsRegistered: new Set(schoolStudents.flatMap((student) => student.subjects.map((s) => s.subjectCode))).size,
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
      row.registeredSubjects,
      row.telephone,
      ...subjectsColumns.map((subject) => row[subject.key] ?? 0),
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
        const totalCandidates = schoolContext.totalCandidates ?? rows.reduce((sum, row) => sum + Number(row.registeredSubjects || 0), 0);
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
        row.registeredSubjects,
        row.telephone,
        ...subjectsColumns.map((subject) => String(row[subject.key] ?? 0)),
      ]);

      // BLACK & WHITE TABLE ONLY - No colors, no styling
      // Calculate dynamic column widths to fit all subjects on landscape page
      const usableWidth = pageWidth - (margin * 2);
      const totalCols = tableHeaders.length;
      
      // Allocate proportional widths
      // Base columns: Ref(10), School(35), District(15), Zone(18), Subjects(12), Phone(15) = 105mm
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
      columnStylesObj[4] = { cellWidth: 12, halign: "center", fontSize: 6 };  // Registered Subjects
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
            ["Students", String(row[key] ?? 0)],
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
        selected.educationLevel === "UACE" ? uaceSubjectColumns : uceSubjectColumns;
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
        head: [["Reg No", "Student Name", "Subject Code", "Subject Name", "Paper"]],
        body: rows.flatMap((student) =>
          (student.subjects ?? []).map((subj) => [
            student.registrationNumber,
            student.studentName,
            subj.subjectCode,
            subj.subjectName,
            subj.paper || "-",
          ])
        ),
        styles: { fontSize: 8.2, lineWidth: 0.5, lineColor: [0, 0, 0], textColor: [0, 0, 0] },
        headStyles: { fillColor: [255, 255, 255], textColor: [0, 0, 0], fontStyle: "bold", lineColor: [0, 0, 0], lineWidth: 0.5 },
        alternateRowStyles: { fillColor: [255, 255, 255], lineColor: [0, 0, 0], textColor: [0, 0, 0] },
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
        rows.flatMap((student) =>
          (student.subjects ?? []).map((subj) => ({
            RegistrationNumber: student.registrationNumber,
            StudentName: student.studentName,
            ExamLevel: student.examLevel,
            SubjectCode: subj.subjectCode,
            SubjectName: subj.subjectName,
            Paper: subj.paper || "-",
          }))
        ),
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

      <Tabs defaultValue={isAdmin ? "consolidated" : "school-wise"} className="space-y-4">
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
                          <TableCell key={`${subject.key}-${idx}`}>{row[subject.key] ?? 0}</TableCell>
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
                          <TableCell>{selectedSubjectCode === "all" ? "All" : selectedSubjectCode}</TableCell>
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




