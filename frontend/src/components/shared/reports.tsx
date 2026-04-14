import { useMemo, useState } from "react";
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
  { key: "HIST", label: "Hist" },
  { key: "ECON", label: "Econ" },
  { key: "ENT", label: "Ent" },
  { key: "IRE", label: "IRE" },
  { key: "CRE", label: "CRE" },
  { key: "GEOG", label: "Geog" },
  { key: "LIT", label: "LIT" },
  { key: "KISWA", label: "Kiswa" },
  { key: "ART", label: "Art" },
  { key: "PHY", label: "PHY" },
  { key: "CHEM", label: "Chem" },
  { key: "BIO", label: "BIO" },
  { key: "MATH", label: "Maths" },
  { key: "AGRIC", label: "Agric" },
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
  };
  return aliases[normalized] ?? normalized;
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
  const { schools, students, subjects } = useAuth();
  const [selectedSchool, setSelectedSchool] = useState("all");
  const [exportingKey, setExportingKey] = useState<string | null>(null);
  const [educationLevelFilter, setEducationLevelFilter] = useState<EducationLevelFilter>("all");
  const [lateFee] = useState(0);

  const consolidatedRows = useMemo<FormRow[]>(() => {
    const filteredSchools = schools.filter((school) => {
      if (educationLevelFilter === "all") return true;
      return school.educationLevel === educationLevelFilter || school.educationLevel === "BOTH";
    });

    return filteredSchools.map((school, index) => {
      const schoolStudents = students.filter((student) => student.schoolCode === school.code);
      const registeredSubjects = new Set(schoolStudents.map((student) => student.subjectCode)).size;
      const isUaceForm = educationLevelFilter === "UACE" || school.educationLevel === "UACE";
      const subjectColumns = isUaceForm ? uaceSubjectColumns : uceSubjectColumns;

      const subjectCounts = schoolStudents.reduce<Record<string, number>>((acc, student) => {
        const key = mapSubjectCode(student.subjectCode);
        acc[key] = (acc[key] ?? 0) + student.totalEntries;
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
        const entries = subjectCounts[subject.key] ?? 0;
        const p1 = Math.floor(entries * 0.35);
        const p2 = Math.floor(entries * 0.25);
        const p3 = Math.floor(entries * 0.2);
        const p4 = entries - (p1 + p2 + p3);
        row[`${subject.key}_entries`] = entries;
        row[`${subject.key}_p1`] = p1;
        row[`${subject.key}_p2`] = p2;
        row[`${subject.key}_p3`] = p3;
        row[`${subject.key}_p4`] = p4;
      });

      return row;
    });
  }, [schools, students, educationLevelFilter]);

  const subjectWiseData = useMemo(
    () =>
      subjects.map((subject) => {
        const subjectStudents = students.filter((student) => student.subjectCode === subject.code);
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
    [subjects, students],
  );

  const selectedSchoolData =
    selectedSchool !== "all"
      ? schools.find((school) => school.code === selectedSchool)
      : undefined;

  const selectedSchoolProfile = useMemo(() => {
    if (!selectedSchoolData) return undefined;
    const schoolStudents = students.filter((student) => student.schoolCode === selectedSchoolData.code);
    return {
      totalStudents: schoolStudents.length,
      subjectsRegistered: new Set(schoolStudents.map((student) => student.subjectCode)).size,
      reportNote: "Report generated from current frontend simulation state.",
      lastUpdated: new Date().toLocaleDateString(),
    };
  }, [selectedSchoolData, students]);

  const summaryCards = [
    {
      label: "Registered Schools",
      value: schools.length,
      className: "border-l-red-600",
      valueClass: "text-slate-900",
    },
    {
      label: "Total Students",
      value: students.length,
      className: "border-l-amber-500",
      valueClass: "text-slate-900",
    },
    {
      label: "Active Schools",
      value: schools.filter((school) => school.status === "active").length,
      className: "border-l-green-500",
      valueClass: "text-slate-900",
    },
    {
      label: "Payment Submitted",
      value: schools.filter((school) => school.status === "payment_submitted").length,
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
  ) => {
    try {
      const pdf = new jsPDF({
        orientation: "landscape",
        unit: "mm",
        format: "a4",
      });

      const pageWidth = pdf.internal.pageSize.getWidth();
      let yPos = 12;
      const subjectsColumns = level === "UACE" ? uaceSubjectColumns : uceSubjectColumns;
      const fee = calculateFeeSummary(rows);

      pdf.setFontSize(11);
      pdf.setFont("helvetica", "bold");
      pdf.text(`WAKISSHA JOINT MOCK ${level} SUMMARY 2026`, pageWidth / 2, yPos, {
        align: "center",
      });
      yPos += 5;

      const headerRow = [
        ...formBaseColumns.map((col) => col.label),
        ...subjectsColumns.flatMap((subject) =>
          entryColumns.map((entry) => `${subject.label}-${entry.label}`),
        ),
      ];
      const bodyRows = buildTemplateTable(rows, subjectsColumns);

      autoTable(pdf, {
        head: [headerRow],
        body: bodyRows,
        startY: yPos,
        margin: { left: 6, right: 6 },
        headStyles: {
          fillColor: [255, 255, 255],
          textColor: [0, 0, 0],
          lineWidth: 0.2,
          lineColor: [0, 0, 0],
          fontSize: 6,
          fontStyle: "bold",
        },
        bodyStyles: {
          lineWidth: 0.2,
          lineColor: [0, 0, 0],
          fontSize: 6,
          textColor: [0, 0, 0],
        },
      });

      const endY = (pdf as any).lastAutoTable.finalY + 5;
      pdf.setFontSize(8);
      pdf.setFont("helvetica", "normal");
      pdf.text(`School Fee: UGX ${fee.schoolFee.toLocaleString()}`, 8, endY);
      pdf.text(`Student Fee: UGX ${fee.studentFee.toLocaleString()}`, 60, endY);
      pdf.text(`Late Fee: UGX ${fee.lateFee.toLocaleString()}`, 115, endY);
      pdf.text(`Marking Fee: UGX ${fee.markingFee.toLocaleString()}`, 160, endY);
      pdf.setFont("helvetica", "bold");
      pdf.text(`TOTAL AMOUNT: UGX ${fee.totalAmount.toLocaleString()}`, 220, endY);

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
          ? schools.find((school) => school.code === selectedSchool)
          : schools.find(
              (school) =>
                school.educationLevel === "UACE" || school.educationLevel === "BOTH",
            )) ?? schools[0];

      if (!preferredSchool) {
        toast.error("No school data available");
        return;
      }

      const row = consolidatedRows.find((record) => record.schoolName === preferredSchool.name);
      if (!row) {
        toast.error("No report data available for selected school");
        return;
      }

      const schoolStudents = students.filter(
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
      const selected = schools.find((school) => school.code === selectedSchool);
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
      const selected = schools.find((school) => school.code === selectedSchool);
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
      const selected = schools.find((s) => s.code === selectedSchool);
      if (!selected) {
        toast.error("Please select a school");
        return;
      }

      const targetLevel: "UACE" | "UCE" =
        selected.educationLevel === "UACE" ? "UACE" : "UCE";
      const row = consolidatedRows.find((record) => record.schoolName === selected.name);
      if (!row) {
        toast.error("No data found for selected school");
        return;
      }
      generateOfficialFormPDF(targetLevel, [row], fileName);
    } catch (error) {
      toast.error("Failed to export PDF");
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
          const school = schools.find((record) => record.name === row.schoolName);
          if (!school) return false;
          if (levelToExport === "UACE") {
            return school.educationLevel === "UACE" || school.educationLevel === "BOTH";
          }
          return school.educationLevel === "UCE" || school.educationLevel === "BOTH";
        });
        if (format === "pdf") {
          generateReadableConsolidatedPDF(rowsForLevel, levelToExport);
        } else {
          generateReadableConsolidatedExcel(rowsForLevel, levelToExport);
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
          generateReadableSingleSchoolPDF();
        } else {
          generateReadableSingleSchoolExcel();
        }
      }
    } finally {
      setExportingKey(null);
    }
  };

  return (
    <div className="flex flex-col w-full gap-6 anim-fade-up">
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

      <Tabs defaultValue="consolidated" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="consolidated">Consolidated</TabsTrigger>
          <TabsTrigger value="subject-wise">Subject-Wise</TabsTrigger>
          <TabsTrigger value="school-wise">Single School Report</TabsTrigger>
        </TabsList>

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
            <CardContent className="pt-6">
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
                    Select a school to view a simulated reporting breakdown for
                    the frontend demo.
                  </CardDescription>
                </div>
                <Select value={selectedSchool} onValueChange={setSelectedSchool}>
                  <SelectTrigger className="w-full lg:w-[320px]">
                    <SelectValue placeholder="Select school" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Choose a school</SelectItem>
                    {schools.map((school) => (
                      <SelectItem key={school.code} value={school.code}>
                        {school.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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

                  <div className="flex justify-end gap-2">
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




