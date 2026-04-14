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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { Progress } from "../ui/progress";
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

interface ReportsProps {
  onPageChange: (page: string) => void;
}

interface ExportState {
  open: boolean;
  format: "pdf" | "excel";
  reportType: string;
  ready: boolean;
}

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
  const [exportState, setExportState] = useState<ExportState>({
    open: false,
    format: "pdf",
    reportType: "Consolidated",
    ready: false,
  });
  const [progressValue, setProgressValue] = useState(14);

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

    return schools.length > 0 ? defaultRows : [];
  }, [schools]);

  useEffect(() => {
    if (!exportState.open || exportState.ready) {
      return;
    }

    setProgressValue(14);
    const interval = setInterval(() => {
      setProgressValue((prev) => (prev >= 88 ? prev : prev + 12));
    }, 250);

    const timeout = setTimeout(() => {
      clearInterval(interval);
      setProgressValue(100);
      setExportState((prev) => ({ ...prev, ready: true }));
    }, 2000);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [exportState.open, exportState.ready]);

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
      valueClass: "text-slate-900 dark:text-white",
    },
    {
      label: "Total Students",
      value: schools.reduce((sum, school) => sum + school.students, 0),
      className: "border-l-amber-500",
      valueClass: "text-amber-600 dark:text-amber-300",
    },
    {
      label: "Active Schools",
      value: schools.filter((school) => school.status === "active").length,
      className: "border-l-green-500",
      valueClass: "text-green-600 dark:text-green-300",
    },
    {
      label: "Payment Submitted",
      value: schools.filter((school) => school.status === "payment_submitted").length,
      className: "border-l-blue-500",
      valueClass: "text-blue-600 dark:text-blue-300",
    },
  ];

  const handleExport = (format: "pdf" | "excel", reportType: string) => {
    setExportState({
      open: true,
      format,
      reportType,
      ready: false,
    });
  };

  const handleDownload = () => {
    toast.success("Document download started", {
      description: `${exportState.reportType} report ${exportState.format.toUpperCase()} is ready for demo download.`,
    });
    setExportState((prev) => ({ ...prev, open: false }));
  };

  const closeExportDialog = () => {
    setExportState((prev) => ({ ...prev, open: false }));
  };

  return (
    <div className="flex flex-col w-full gap-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-2">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-red-500 dark:text-red-400">
            Reporting Centre
          </p>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Reports</h1>
          <p className="max-w-3xl text-slate-600 dark:text-slate-300">
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
          >
            <Download className="h-4 w-4" />
            Quick Export
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {summaryCards.map((card) => (
          <Card key={card.label} className={`border-l-4 ${card.className}`}>
            <CardContent className="pt-6">
              <p className="text-sm font-medium text-slate-600 dark:text-slate-400">{card.label}</p>
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
            <CardHeader className="border-b border-border/70">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <CardTitle className="text-slate-900 dark:text-white">
                    UACE Consolidated Report
                  </CardTitle>
                  <CardDescription className="text-slate-600 dark:text-slate-400">
                    Full subject-by-subject consolidated sheet formatted for
                    WAKISSHA UACE reporting.
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleExport("pdf", "UACE Consolidated")}
                  >
                    <FileText className="h-4 w-4" />
                    Export PDF
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleExport("excel", "UACE Consolidated")}
                  >
                    <FileSpreadsheet className="h-4 w-4" />
                    Export Excel
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-[#1e1e2e]">
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
                              header === "School Name" ? "font-semibold text-slate-900 dark:text-white" : ""
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
            <CardHeader className="border-b border-border/70">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <CardTitle className="text-slate-900 dark:text-white">Subject-Wise Report</CardTitle>
                  <CardDescription className="text-slate-600 dark:text-slate-400">
                    Compare total student counts and school participation by
                    subject.
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleExport("pdf", "Subject-Wise")}
                  >
                    <FileText className="h-4 w-4" />
                    Export PDF
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleExport("excel", "Subject-Wise")}
                  >
                    <FileSpreadsheet className="h-4 w-4" />
                    Export Excel
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
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
                      <TableCell className="font-semibold text-white">
                        {subject.subject}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{subject.code}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{subject.level}</Badge>
                      </TableCell>
                      <TableCell className="text-right font-semibold text-white">
                        {subject.totalStudents}
                      </TableCell>
                      <TableCell className="text-right">{subject.schools}</TableCell>
                      <TableCell className="text-right">{subject.average}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="school-wise">
          <Card>
            <CardHeader className="border-b border-border/70">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <CardTitle className="text-white">Single School Report</CardTitle>
                  <CardDescription>
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
                <div className="rounded-2xl border border-white/6 bg-white/[0.02] py-16 text-center text-slate-400">
                  <School className="mx-auto mb-3 h-12 w-12 opacity-50" />
                  <p>Select a school to view the detailed report.</p>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="grid gap-4 md:grid-cols-3">
                    <Card className="border-l-4 border-l-red-600">
                      <CardContent className="pt-6">
                        <p className="text-sm text-slate-400">Total Students</p>
                        <p className="mt-2 text-3xl font-bold text-white">
                          {selectedSchoolProfile.totalStudents}
                        </p>
                      </CardContent>
                    </Card>
                    <Card className="border-l-4 border-l-amber-500">
                      <CardContent className="pt-6">
                        <p className="text-sm text-slate-400">
                          Subjects Registered
                        </p>
                        <p className="mt-2 text-3xl font-bold text-amber-300">
                          {selectedSchoolProfile.subjectsRegistered}
                        </p>
                      </CardContent>
                    </Card>
                    <Card className="border-l-4 border-l-blue-500">
                      <CardContent className="pt-6">
                        <p className="text-sm text-slate-400">Fees Status</p>
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
                          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-red-600/15 text-red-400">
                            <BarChart3 className="h-5 w-5" />
                          </div>
                          <div>
                            <p className="font-semibold text-white">
                              {selectedSchoolData.name}
                            </p>
                            <p className="text-sm text-slate-400">
                              {selectedSchoolData.code} / {selectedSchoolData.district} /{" "}
                              {selectedSchoolData.zone}
                            </p>
                          </div>
                        </div>
                        <p className="text-sm leading-6 text-slate-400">
                          {selectedSchoolProfile.reportNote}
                        </p>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardContent className="space-y-4 pt-6">
                        <div className="rounded-2xl border border-white/6 bg-white/[0.02] p-4">
                          <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                            Academic Year
                          </p>
                          <p className="mt-2 text-lg font-semibold text-white">
                            {selectedSchoolData.academicYear}
                          </p>
                        </div>
                        <div className="rounded-2xl border border-white/6 bg-white/[0.02] p-4">
                          <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                            Activation Code
                          </p>
                          <p className="mt-2 text-lg font-semibold text-white">
                            {selectedSchoolData.activationCode || "Pending activation"}
                          </p>
                        </div>
                        <div className="rounded-2xl border border-white/6 bg-white/[0.02] p-4">
                          <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                            Last Updated
                          </p>
                          <p className="mt-2 text-lg font-semibold text-white">
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
                    >
                      <FileText className="h-4 w-4" />
                      Export PDF
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleExport("excel", "Single School")}
                    >
                      <FileSpreadsheet className="h-4 w-4" />
                      Export Excel
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={exportState.open} onOpenChange={(open) => !open && closeExportDialog()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {exportState.ready ? "Document Ready" : "Compiling WAKISSHA Data..."}
            </DialogTitle>
            <DialogDescription>
              {exportState.ready
                ? `${exportState.reportType} ${exportState.format.toUpperCase()} is prepared and ready to download.`
                : `Preparing ${exportState.reportType} ${exportState.format.toUpperCase()} export for the portal demo.`}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 rounded-2xl border border-white/6 bg-white/[0.03] p-5">
            <div className="flex items-center gap-3">
              {exportState.ready ? (
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-green-500/15 text-green-300">
                  <Download className="h-6 w-6" />
                </div>
              ) : (
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-600/15 text-red-400">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              )}
              <div>
                <p className="font-semibold text-white">
                  {exportState.ready ? "Compilation complete" : "Building report package"}
                </p>
                <p className="text-sm text-slate-400">
                  {exportState.ready
                    ? "The document package has been assembled successfully."
                    : "Collecting school data, validating totals, and packaging the final report."}
                </p>
              </div>
            </div>
            <Progress value={progressValue} className="h-2.5" />
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={closeExportDialog}>
              Close
            </Button>
            {exportState.ready && (
              <Button onClick={handleDownload}>
                <Download className="h-4 w-4" />
                Download File
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
