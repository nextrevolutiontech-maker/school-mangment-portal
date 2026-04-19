import {
  Calendar,
  Clock,
  BookOpen,
  Download,
  MapPin,
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
import { useState } from "react";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

interface TimetableProps {
  onPageChange: (page: string) => void;
}

interface ScheduleRow {
  date: string;
  day: string;
  subject: string;
  code: string;
  paper: string;
  level: "UCE" | "UACE";
  period: "Morning" | "Afternoon";
  duration: string;
}

const uceSchedule: ScheduleRow[] = [
  {
    date: "2026-05-12",
    day: "Tuesday",
    subject: "English Language",
    code: "112",
    paper: "Paper 1",
    level: "UCE",
    period: "Morning",
    duration: "2.5 hours",
  },
  {
    date: "2026-05-14",
    day: "Thursday",
    subject: "Mathematics",
    code: "456",
    paper: "Paper 1",
    level: "UCE",
    period: "Morning",
    duration: "2.5 hours",
  },
  {
    date: "2026-05-18",
    day: "Monday",
    subject: "Biology",
    code: "553",
    paper: "Paper 2",
    level: "UCE",
    period: "Afternoon",
    duration: "2.5 hours",
  },
  {
    date: "2026-05-20",
    day: "Wednesday",
    subject: "History & Political Education",
    code: "241",
    paper: "Paper 1",
    level: "UCE",
    period: "Morning",
    duration: "2.5 hours",
  },
  {
    date: "2026-05-22",
    day: "Friday",
    subject: "Geography",
    code: "273",
    paper: "Paper 1",
    level: "UCE",
    period: "Morning",
    duration: "2.5 hours",
  },
];

const uaceSchedule: ScheduleRow[] = [
  {
    date: "2026-06-03",
    day: "Wednesday",
    subject: "General Paper",
    code: "101",
    paper: "Paper 1",
    level: "UACE",
    period: "Morning",
    duration: "3 hours",
  },
  {
    date: "2026-06-05",
    day: "Friday",
    subject: "Subsidiary Mathematics",
    code: "475",
    paper: "Paper 1",
    level: "UACE",
    period: "Morning",
    duration: "2.5 hours",
  },
  {
    date: "2026-06-09",
    day: "Tuesday",
    subject: "Physics",
    code: "525",
    paper: "Paper 2",
    level: "UACE",
    period: "Morning",
    duration: "3 hours",
  },
  {
    date: "2026-06-11",
    day: "Thursday",
    subject: "Chemistry",
    code: "535",
    paper: "Paper 2",
    level: "UACE",
    period: "Morning",
    duration: "3 hours",
  },
  {
    date: "2026-06-15",
    day: "Monday",
    subject: "Biology",
    code: "545",
    paper: "Paper 2",
    level: "UACE",
    period: "Morning",
    duration: "3 hours",
  },
  {
    date: "2026-06-18",
    day: "Thursday",
    subject: "Geography",
    code: "230",
    paper: "Paper 1",
    level: "UACE",
    period: "Afternoon",
    duration: "3 hours",
  },
];

function groupByDate(schedule: ScheduleRow[]) {
  return schedule.reduce<Record<string, ScheduleRow[]>>((acc, exam) => {
    if (!acc[exam.date]) {
      acc[exam.date] = [];
    }

    acc[exam.date].push(exam);
    return acc;
  }, {});
}

function SchedulePanel({
  title,
  description,
  schedule,
}: {
  title: string;
  description: string;
  schedule: ScheduleRow[];
}) {
  const groupedSchedule = groupByDate(schedule);
  const statCards = [
    {
      label: "Total Papers",
      value: schedule.length,
      className: "border-l-red-600",
      valueClass: "text-slate-900",
    },
    {
      label: "Start Date",
      value: new Date(schedule[0].date).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      }),
      className: "border-l-amber-500",
      valueClass: "text-slate-900",
    },
    {
      label: "End Date",
      value: new Date(schedule[schedule.length - 1].date).toLocaleDateString(
        "en-US",
        {
          month: "short",
          day: "numeric",
        },
      ),
      className: "border-l-blue-500",
      valueClass: "text-slate-900",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-[repeat(auto-fit,minmax(250px,1fr))] gap-4">
        {statCards.map((stat) => (
          <Card key={stat.label} className={`h-full border-l-4 ${stat.className}`}>
            <CardContent className="pt-6">
              <p className="text-sm font-medium text-slate-500">{stat.label}</p>
              <p className={`mt-3 text-3xl font-bold ${stat.valueClass}`}>
                {stat.value}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="table" className="space-y-4">
        <TabsList>
          <TabsTrigger value="table">Table View</TabsTrigger>
          <TabsTrigger value="calendar">Calendar View</TabsTrigger>
        </TabsList>

        <TabsContent value="table">
          <Card>
            <CardHeader className="border-b border-slate-200">
              <CardTitle className="text-slate-900">{title}</CardTitle>
              <CardDescription className="text-slate-500">{description}</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Day & Date</TableHead>
                    <TableHead>Period</TableHead>
                    <TableHead>Code</TableHead>
                    <TableHead>Paper</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead>Duration</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {schedule.map((exam) => (
                    <TableRow key={`${exam.code}-${exam.date}`}>
                      <TableCell className="font-semibold text-slate-900">
                        {exam.day},{" "}
                        {new Date(exam.date).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{exam.period}</Badge>
                      </TableCell>
                      <TableCell className="font-mono font-bold text-black">
                        {exam.code}
                      </TableCell>
                      <TableCell className="font-semibold text-blue-600">
                        {exam.paper}
                      </TableCell>
                      <TableCell className="font-medium text-amber-600">
                        {exam.subject}
                      </TableCell>
                      <TableCell className="text-slate-500">
                        {exam.duration}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="calendar" className="w-full space-y-4">
          {Object.entries(groupedSchedule).map(([date, exams]) => (
            <Card key={date}>
              <CardHeader className="border-b border-slate-200">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-red-600/15 text-red-400">
                    <Calendar className="h-5 w-5" />
                  </div>
                  <div>
                    <CardTitle className="text-slate-900">
                      {new Date(date).toLocaleDateString("en-US", {
                        weekday: "long",
                        month: "long",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </CardTitle>
                    <CardDescription className="text-slate-500">
                      {exams.length} paper{exams.length > 1 ? "s" : ""} scheduled
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="grid gap-4 pt-6 lg:grid-cols-2">
                {exams.map((exam) => (
                  <div
                    key={`${exam.code}-${exam.date}`}
                    className="bg-white shadow-sm border border-slate-200 rounded-2xl p-4"
                  >
                    <div className="mb-3 flex flex-wrap items-center gap-2">
                      <BookOpen className="h-4 w-4 text-red-400" />
                      <span className="font-mono text-sm font-bold text-black">{exam.code}</span>
                      <span className="text-sm font-semibold text-blue-600">{exam.paper}</span>
                      <h4 className="font-semibold text-amber-600">{exam.subject}</h4>
                    </div>
                    <div className="space-y-2 text-sm text-slate-500">
                      <div className="flex items-center gap-2">
                        <Clock className="h-3.5 w-3.5" />
                        <span>{exam.period}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-3.5 w-3.5" />
                        <span>{exam.duration}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}

export function Timetable({ onPageChange }: TimetableProps) {
  const [isExporting, setIsExporting] = useState<"UCE" | "UACE" | null>(null);

  const handleExport = async (level: "UCE" | "UACE") => {
    try {
      setIsExporting(level);
      const schedule = level === "UCE" ? uceSchedule : uaceSchedule;
      const pdf = new jsPDF("landscape");
      const pageWidth = pdf.internal.pageSize.getWidth();
      let yPos = 15;

      // Header
      pdf.setFontSize(14);
      pdf.setFont("helvetica", "bold");
      pdf.text(`WAKISSHA JOINT MOCK EXAMINATIONS, 2026 ${level} TIME TABLE (SECOND DRAFT)`, pageWidth / 2, yPos, {
        align: "center",
      });
      yPos += 10;

      const tableColumns = ["Day & Date", "Period", "Code", "Paper", "Subject", "Duration"];
      const tableRows = schedule.map((exam) => [
        `${exam.day}, ${new Date(exam.date).toLocaleDateString("en-GB")}`,
        exam.period,
        exam.code,
        exam.paper,
        exam.subject,
        exam.duration,
      ]);

      autoTable(pdf, {
        head: [tableColumns],
        body: tableRows,
        startY: yPos,
        margin: { left: 10, right: 10 },
        columnStyles: {
          0: { cellWidth: 34 },
          1: { cellWidth: 22 },
          2: { cellWidth: 18, textColor: [0, 0, 0], fontStyle: "bold" },
          3: { cellWidth: 24, textColor: [37, 99, 235], fontStyle: "bold" },
          4: { cellWidth: 82, textColor: [217, 119, 6], fontStyle: "bold" },
          5: { cellWidth: 22 },
        },
        headStyles: {
          fillColor: [200, 200, 200],
          textColor: [0, 0, 0],
          fontSize: 10,
          fontStyle: "bold",
          halign: "center",
          padding: 3,
          lineWidth: 0.5,
          lineColor: [0, 0, 0],
        },
        bodyStyles: {
          fontSize: 9,
          textColor: [0, 0, 0],
          padding: 2.5,
          lineWidth: 0.5,
          lineColor: [0, 0, 0],
          fillColor: [255, 255, 255],
        },
        alternateRowStyles: {
          fillColor: [245, 245, 245],
        },
      });

      pdf.save(`${level}-Timetable-Draft-2026.pdf`);
      toast.success(`${level} timetable downloaded successfully`);
    } catch (error) {
      toast.error(`Failed to export ${level} timetable`);
      console.error(error);
    } finally {
      setIsExporting(null);
    }
  };

  return (
    <div className="mx-auto flex w-full max-w-[1240px] flex-col gap-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-2">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-red-500">
            Examination Schedule
          </p>
          <h1 className="text-3xl font-bold text-slate-900">
            UCE &amp; UACE Timetable
          </h1>
          <p className="max-w-3xl text-slate-500">
            Browse separate UCE and UACE examination schedules with table and
            calendar views for planning, printing, and dashboard review.
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Button variant="outline" onClick={() => onPageChange("reports")}>
            Go to Reports
          </Button>
        </div>
      </div>

      <Tabs defaultValue="uce" className="w-full space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="uce">UCE Timetable</TabsTrigger>
          <TabsTrigger value="uace">UACE Timetable</TabsTrigger>
        </TabsList>

        <TabsContent value="uce" className="w-full space-y-6">
          <div className="flex justify-end">
            <Button
              variant="outline"
              onClick={() => handleExport("UCE")}
              disabled={isExporting === "UCE"}
            >
              <Download className="h-4 w-4" />
              {isExporting === "UCE" ? "Downloading..." : "Download UCE PDF"}
            </Button>
          </div>
          <SchedulePanel
            title="UCE Timetable"
            description="Official UCE paper schedule for the current examination season."
            schedule={uceSchedule}
          />
        </TabsContent>

        <TabsContent value="uace" className="w-full space-y-6">
          <div className="flex justify-end">
            <Button
              variant="outline"
              onClick={() => handleExport("UACE")}
              disabled={isExporting === "UACE"}
            >
              <Download className="h-4 w-4" />
              {isExporting === "UACE" ? "Downloading..." : "Download UACE PDF"}
            </Button>
          </div>
          <SchedulePanel
            title="UACE Timetable"
            description="Official UACE paper schedule with dedicated venues and sitting times."
            schedule={uaceSchedule}
          />
        </TabsContent>
      </Tabs>

      <Card>
        <CardHeader>
          <CardTitle className="text-slate-900">Candidate Instructions</CardTitle>
          <CardDescription className="text-slate-500">
            Key reminders for schools, invigilators, and student candidates.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="space-y-3 text-sm text-slate-500">
            <li className="bg-white shadow-sm border border-slate-200 rounded-xl px-4 py-3">
              Schools should display both UCE and UACE schedules on noticeboards
              at least one week before the first paper.
            </li>
            <li className="bg-white shadow-sm border border-slate-200 rounded-xl px-4 py-3">
              Candidates must arrive at the assigned venue 30 minutes before
              start time with valid identification.
            </li>
            <li className="bg-white shadow-sm border border-slate-200 rounded-xl px-4 py-3">
              Practical and science papers should only be sat in approved rooms
              listed on the timetable.
            </li>
            <li className="bg-white shadow-sm border border-slate-200 rounded-xl px-4 py-3">
              Any timetable changes will be communicated through the WAKISSHA
              portal dashboard and school email.
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}



