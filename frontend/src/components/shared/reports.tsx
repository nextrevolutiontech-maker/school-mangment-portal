import { useMemo, useState, useRef } from "react";
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
import html2canvas from "html2canvas";
import autoTable from "jspdf-autotable";

interface ReportsProps {
  onPageChange: (page: string) => void;
}

type EducationLevelFilter = "all" | "UCE" | "UACE";


const uaceHeaders = [
  "Ref No",
  "School Name",
  "District",
  "Zone/Centre",
  "Registered Subjects",
  "Telephone",
  "GP",
  "S/Maths",
  "S/ICT",
  "Hist",
  "Ent",
  "Geog",
  "IRE",
  "CRE",
  "LIT",
  "Kiswa",
  "Art",
  "PHY",
  "Chem",
  "BIO",
  "Maths",
  "Agric",
  "F/N",
  "TD",
  "French",
  "German",
  "Arabic",
  "Luganda",
  "Runy-Rukiga",
  "Lusoga",
] as const;

type UaceHeader = (typeof uaceHeaders)[number];
type UaceRow = Record<UaceHeader, string>;

const subjectWiseData = [
  {
    subject: "English Language",
    code: "ENG",
    level: "UCE",
    totalStudents: 364,
    schools: 4,
    average: 91,
  },
  {
    subject: "General Paper",
    code: "GP",
    level: "UACE",
    totalStudents: 281,
    schools: 4,
    average: 70,
  },
  {
    subject: "Mathematics",
    code: "MTH",
    level: "UCE/UACE",
    totalStudents: 332,
    schools: 4,
    average: 83,
  },
  {
    subject: "Biology",
    code: "BIO",
    level: "UACE",
    totalStudents: 143,
    schools: 3,
    average: 48,
  },
  {
    subject: "Chemistry",
    code: "CHE",
    level: "UACE",
    totalStudents: 136,
    schools: 3,
    average: 45,
  },
];

const schoolReportProfiles: Record<
  string,
  {
    totalStudents: number;
    subjectsRegistered: number;
    feesStatus: string;
    reportNote: string;
    lastUpdated: string;
  }
> = {
  "WAK26-0001": {
    totalStudents: 120,
    subjectsRegistered: 8,
    feesStatus: "Active",
    reportNote: "All candidate entries submitted and approved for printing.",
    lastUpdated: "April 13, 2026",
  },
  "WAK26-0002": {
    totalStudents: 98,
    subjectsRegistered: 7,
    feesStatus: "Verified",
    reportNote: "Payment confirmed and final activation notice pending dispatch.",
    lastUpdated: "April 12, 2026",
  },
  "WAK26-0003": {
    totalStudents: 84,
    subjectsRegistered: 6,
    feesStatus: "Pending",
    reportNote: "Awaiting signed summary form and payment confirmation upload.",
    lastUpdated: "April 10, 2026",
  },
  "WAK26-0004": {
    totalStudents: 73,
    subjectsRegistered: 7,
    feesStatus: "Payment Submitted",
    reportNote: "Documents uploaded and queued for admin verification review.",
    lastUpdated: "April 13, 2026",
  },
};

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
  const { schools } = useAuth();
  const [selectedSchool, setSelectedSchool] = useState("all");
  const [exportingKey, setExportingKey] = useState<string | null>(null);
  const [educationLevelFilter, setEducationLevelFilter] = useState<EducationLevelFilter>("all");
  const consolidatedTableRef = useRef<HTMLDivElement>(null);
  const subjectWiseTableRef = useRef<HTMLDivElement>(null);

  const consolidatedRows = useMemo<UaceRow[]>(() => {
    const defaultRows: UaceRow[] = [
      {
        "Ref No": "1",
        "School Name": "AMITY SECONDARY SCHOOL",
        District: "Kampala",
        "Zone/Centre": "Central Zone",
        "Registered Subjects": "12",
        Telephone: "+256 700 101 001",
        GP: "120",
        "S/Maths": "118",
        "S/ICT": "92",
        Hist: "41",
        Ent: "28",
        Geog: "64",
        IRE: "12",
        CRE: "58",
        LIT: "36",
        Kiswa: "26",
        Art: "18",
        PHY: "52",
        Chem: "49",
        BIO: "55",
        Maths: "88",
        Agric: "21",
        "F/N": "17",
        TD: "14",
        French: "9",
        German: "0",
        Arabic: "4",
        Luganda: "31",
        "Runy-Rukiga": "0",
        Lusoga: "0",
      },
      {
        "Ref No": "2",
        "School Name": "Wakiso Hills College",
        District: "Wakiso",
        "Zone/Centre": "North Zone",
        "Registered Subjects": "11",
        Telephone: "+256 700 101 002",
        GP: "98",
        "S/Maths": "96",
        "S/ICT": "74",
        Hist: "33",
        Ent: "19",
        Geog: "52",
        IRE: "8",
        CRE: "49",
        LIT: "25",
        Kiswa: "18",
        Art: "12",
        PHY: "40",
        Chem: "42",
        BIO: "44",
        Maths: "73",
        Agric: "16",
        "F/N": "13",
        TD: "9",
        French: "5",
        German: "0",
        Arabic: "0",
        Luganda: "22",
        "Runy-Rukiga": "10",
        Lusoga: "0",
      },
      {
        "Ref No": "3",
        "School Name": "Entebbe High School",
        District: "Entebbe",
        "Zone/Centre": "South Zone",
        "Registered Subjects": "10",
        Telephone: "+256 700 101 003",
        GP: "84",
        "S/Maths": "81",
        "S/ICT": "61",
        Hist: "27",
        Ent: "14",
        Geog: "38",
        IRE: "7",
        CRE: "44",
        LIT: "19",
        Kiswa: "14",
        Art: "11",
        PHY: "31",
        Chem: "28",
        BIO: "35",
        Maths: "59",
        Agric: "13",
        "F/N": "9",
        TD: "7",
        French: "0",
        German: "0",
        Arabic: "0",
        Luganda: "0",
        "Runy-Rukiga": "0",
        Lusoga: "18",
      },
      {
        "Ref No": "4",
        "School Name": "Nansana Modern School",
        District: "Wakiso",
        "Zone/Centre": "West Zone",
        "Registered Subjects": "9",
        Telephone: "+256 700 101 004",
        GP: "73",
        "S/Maths": "70",
        "S/ICT": "55",
        Hist: "20",
        Ent: "11",
        Geog: "35",
        IRE: "4",
        CRE: "29",
        LIT: "12",
        Kiswa: "15",
        Art: "9",
        PHY: "28",
        Chem: "17",
        BIO: "24",
        Maths: "51",
        Agric: "14",
        "F/N": "8",
        TD: "6",
        French: "0",
        German: "0",
        Arabic: "0",
        Luganda: "19",
        "Runy-Rukiga": "0",
        Lusoga: "12",
      },
    ];

    let filtered = schools.length > 0 ? defaultRows : [];

    if (educationLevelFilter !== "all") {
      filtered = filtered.filter((row) => {
        const school = schools.find((s) => s.code === `WAK26-${String(row["Ref No"]).padStart(4, "0")}`);
        if (!school) return true;
        if (educationLevelFilter === "UCE") return school.educationLevel === "UCE" || school.educationLevel === "BOTH";
        if (educationLevelFilter === "UACE") return school.educationLevel === "UACE" || school.educationLevel === "BOTH";
        return true;
      });
    }

    return filtered;
  }, [schools, educationLevelFilter]);

  const selectedSchoolData =
    selectedSchool !== "all"
      ? schools.find((school) => school.code === selectedSchool)
      : undefined;

  const selectedSchoolProfile =
    selectedSchoolData &&
    schoolReportProfiles[selectedSchoolData.code]
      ? schoolReportProfiles[selectedSchoolData.code]
      : undefined;

  const summaryCards = [
    {
      label: "Registered Schools",
      value: schools.length,
      className: "border-l-red-600",
      valueClass: "text-slate-900",
    },
    {
      label: "Total Students",
      value: schools.reduce((sum, school) => sum + school.students, 0),
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

  const exportConsolidatedToPDF = (fileName: string) => {
    try {
      const pdf = new jsPDF({
        orientation: "landscape",
        unit: "mm",
        format: "a4",
      });

      const pageWidth = pdf.internal.pageSize.getWidth();
      let yPos = 15;

      // Title
      pdf.setFontSize(16);
      pdf.text("UACE Consolidated Report", pageWidth / 2, yPos, {
        align: "center",
      });
      yPos += 10;

      // Metadata
      pdf.setFontSize(10);
      pdf.text(`WAKISSHA Exam Portal - ${new Date().toLocaleDateString()}`, 15, yPos);
      yPos += 8;

      // Table
      const tableColumn = uaceHeaders.slice(0, 10);
      const tableRows = consolidatedRows.map((row) =>
        tableColumn.map((col) => row[col])
      );

      autoTable(pdf, {
        head: [tableColumn],
        body: tableRows,
        startY: yPos,
        margin: { left: 10, right: 10 },
        columnStyles: {
          0: { cellWidth: 8 },
          1: { cellWidth: 25 },
          2: { cellWidth: 15 },
        },
        headStyles: {
          fillColor: [22, 101, 174],
          textColor: [255, 255, 255],
          fontSize: 8,
          fontStyle: "bold",
        },
        bodyStyles: {
          fontSize: 7,
          textColor: [50, 50, 50],
        },
        alternateRowStyles: {
          fillColor: [240, 245, 250],
        },
      });

      pdf.save(`${fileName}.pdf`);
      toast.success("PDF exported successfully");
    } catch (error) {
      toast.error("Failed to export PDF");
      console.error(error);
    }
  };

  const exportSubjectWiseToPDF = (fileName: string) => {
    try {
      const pdf = new jsPDF();
      const pageWidth = pdf.internal.pageSize.getWidth();
      let yPos = 15;

      // Title
      pdf.setFontSize(16);
      pdf.text("Subject-Wise Report", pageWidth / 2, yPos, { align: "center" });
      yPos += 10;

      // Metadata
      pdf.setFontSize(10);
      pdf.text(`WAKISSHA Exam Portal - ${new Date().toLocaleDateString()}`, 15, yPos);
      yPos += 8;

      // Table
      const tableColumn = ["Subject", "Code", "Level", "Total Students", "Schools", "Average"];
      const tableRows = subjectWiseData.map((row) => [
        row.subject,
        row.code,
        row.level,
        row.totalStudents.toString(),
        row.schools.toString(),
        row.average.toString(),
      ]);

      autoTable(pdf, {
        head: [tableColumn],
        body: tableRows,
        startY: yPos,
        margin: { left: 15, right: 15 },
        headStyles: {
          fillColor: [22, 101, 174],
          textColor: [255, 255, 255],
          fontSize: 10,
          fontStyle: "bold",
        },
        bodyStyles: {
          fontSize: 9,
          textColor: [50, 50, 50],
        },
        alternateRowStyles: {
          fillColor: [240, 245, 250],
        },
      });

      pdf.save(`${fileName}.pdf`);
      toast.success("PDF exported successfully");
    } catch (error) {
      toast.error("Failed to export PDF");
      console.error(error);
    }
  };

  const exportSingleSchoolToPDF = (fileName: string) => {
    try {
      const selected = schools.find((s) => s.code === selectedSchool);
      if (!selected) {
        toast.error("Please select a school");
        return;
      }

      const profileData =
        schoolReportProfiles[selected.code] ||
        schoolReportProfiles["WAK26-0001"];

      const pdf = new jsPDF();
      const pageWidth = pdf.internal.pageSize.getWidth();
      let yPos = 15;

      // Header
      pdf.setFontSize(16);
      pdf.text("Single School Report", pageWidth / 2, yPos, { align: "center" });
      yPos += 10;

      // School Details
      pdf.setFontSize(11);
      pdf.text(`School: ${selected.name}`, 15, yPos);
      yPos += 7;
      pdf.setFontSize(10);
      pdf.text(`Code: ${selected.code}`, 15, yPos);
      yPos += 6;
      pdf.text(`District: ${selected.district}`, 15, yPos);
      yPos += 6;
      pdf.text(`Total Students: ${profileData.totalStudents}`, 15, yPos);
      yPos += 6;
      pdf.text(`Subjects Registered: ${profileData.subjectsRegistered}`, 15, yPos);
      yPos += 6;
      pdf.text(`Fees Status: ${selected.status}`, 15, yPos);
      yPos += 6;
      pdf.text(`Last Updated: ${profileData.lastUpdated}`, 15, yPos);
      yPos += 10;

      // Report Note
      pdf.setFontSize(9);
      pdf.text("Report Note:", 15, yPos);
      yPos += 5;
      const splitText = pdf.splitTextToSize(profileData.reportNote, 180);
      pdf.text(splitText, 15, yPos);

      pdf.save(`${fileName}.pdf`);
      toast.success("PDF exported successfully");
    } catch (error) {
      toast.error("Failed to export PDF");
      console.error(error);
    }
  };

  const exportToExcel = (data: any[], fileName: string) => {
    try {
      const worksheet = XLSXUtils.json_to_sheet(data);
      const workbook = XLSXUtils.book_new();
      XLSXUtils.book_append_sheet(workbook, worksheet, "Report");
      writeFile(workbook, `${fileName}.xlsx`);
      toast.success("Excel file exported successfully");
    } catch (error) {
      toast.error("Failed to export Excel");
      console.error(error);
    }
  };

  const handleExport = async (format: "pdf" | "excel", reportType: string) => {
    const key = buildExportKey(format, reportType);
    if (exportingKey) return;
    setExportingKey(key);

    try {
      if (reportType === "UACE Consolidated") {
        if (format === "pdf") {
          exportConsolidatedToPDF("UACE-Consolidated-Report");
        } else {
          exportToExcel(
            consolidatedRows.map((row) => ({
              "Ref No": row["Ref No"],
              "School Name": row["School Name"],
              District: row.District,
              "Zone/Centre": row["Zone/Centre"],
              GP: row.GP,
              "S/Maths": row["S/Maths"],
              Maths: row.Maths,
              PHY: row.PHY,
              Chem: row.Chem,
              BIO: row.BIO,
            })),
            "UACE-Consolidated-Report"
          );
        }
      } else if (reportType === "Subject-Wise") {
        if (format === "pdf") {
          exportSubjectWiseToPDF("Subject-Wise-Report");
        } else {
          exportToExcel(subjectWiseData, "Subject-Wise-Report");
        }
      } else if (reportType === "Quick Summary") {
        exportToExcel(
          [
            {
              Metric: "Registered Schools",
              Value: schools.length,
            },
            {
              Metric: "Total Students",
              Value: schools.reduce((sum, school) => sum + school.students, 0),
            },
            {
              Metric: "Active Schools",
              Value: schools.filter((s) => s.status === "active").length,
            },
          ],
          "Quick-Summary"
        );
      } else if (reportType === "Single School") {
        if (format === "pdf") {
          exportSingleSchoolToPDF("Single-School-Report");
        } else {
          const selected = schools.find((s) => s.code === selectedSchool);
          if (selected) {
            const profileData =
              schoolReportProfiles[selected.code] ||
              schoolReportProfiles["WAK26-0001"];
            exportToExcel(
              [
                {
                  Field: "School Name",
                  Value: selected.name,
                },
                {
                  Field: "School Code",
                  Value: selected.code,
                },
                {
                  Field: "District",
                  Value: selected.district,
                },
                {
                  Field: "Zone",
                  Value: selected.zone,
                },
                {
                  Field: "Total Students",
                  Value: profileData.totalStudents,
                },
                {
                  Field: "Subjects Registered",
                  Value: profileData.subjectsRegistered,
                },
                {
                  Field: "Fees Status",
                  Value: selected.status,
                },
                {
                  Field: "Last Updated",
                  Value: profileData.lastUpdated,
                },
              ],
              `Single-School-${selected.code}`
            );
          }
        }
      }
    } finally {
      setExportingKey(null);
    }
  };

  return (
    <div className="flex flex-col w-full gap-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-2">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-red-500">
            Reporting Centre
          </p>
          <h1 className="text-3xl font-bold text-slate-900">Reports</h1>
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
            onClick={() => handleExport("pdf", "Quick Summary")}
            disabled={isExporting("pdf", "Quick Summary")}
          >
            {isExporting("pdf", "Quick Summary") ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Download className="h-4 w-4" />
                Quick Export
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
                    UACE Consolidated Report
                  </CardTitle>
                  <CardDescription className="text-slate-500">
                    Full subject-by-subject consolidated sheet formatted for
                    WAKISSHA UACE reporting.
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
              <div className="w-full max-w-full overflow-x-auto bg-white shadow-sm border border-slate-200 rounded-2xl" ref={consolidatedTableRef}>
                <Table>
                  <TableHeader>
                    <TableRow>
                      {uaceHeaders.map((header) => (
                        <TableHead key={header} className="whitespace-nowrap">
                          {header}
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {consolidatedRows.map((row) => (
                      <TableRow key={row["Ref No"]}>
                        {uaceHeaders.map((header) => (
                          <TableCell
                            key={`${row["Ref No"]}-${header}`}
                            className={
                              header === "School Name" ? "font-semibold text-slate-900" : ""
                            }
                          >
                            {row[header]}
                          </TableCell>
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
              <div ref={subjectWiseTableRef}>
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




