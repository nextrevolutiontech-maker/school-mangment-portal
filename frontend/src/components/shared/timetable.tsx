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
  time: string;
  duration: string;
  venue: string;
}

const uceSchedule: ScheduleRow[] = [
  {
    date: "2026-05-12",
    day: "Tuesday",
    subject: "English Language",
    code: "UCE-ENG",
    paper: "Paper 1",
    level: "UCE",
    time: "09:00 AM - 11:30 AM",
    duration: "2.5 hours",
    venue: "Main Hall",
  },
  {
    date: "2026-05-14",
    day: "Thursday",
    subject: "Mathematics",
    code: "UCE-MTH",
    paper: "Paper 1",
    level: "UCE",
    time: "09:00 AM - 11:30 AM",
    duration: "2.5 hours",
    venue: "Main Hall",
  },
  {
    date: "2026-05-18",
    day: "Monday",
    subject: "Biology",
    code: "UCE-BIO",
    paper: "Paper 2",
    level: "UCE",
    time: "02:00 PM - 04:30 PM",
    duration: "2.5 hours",
    venue: "Science Block",
  },
  {
    date: "2026-05-20",
    day: "Wednesday",
    subject: "History & Political Education",
    code: "UCE-HIS",
    paper: "Paper 1",
    level: "UCE",
    time: "09:00 AM - 11:30 AM",
    duration: "2.5 hours",
    venue: "Auditorium B",
  },
  {
    date: "2026-05-22",
    day: "Friday",
    subject: "Geography",
    code: "UCE-GEO",
    paper: "Paper 1",
    level: "UCE",
    time: "09:00 AM - 11:30 AM",
    duration: "2.5 hours",
    venue: "Auditorium B",
  },
];

const uaceSchedule: ScheduleRow[] = [
  {
    date: "2026-06-03",
    day: "Wednesday",
    subject: "General Paper",
    code: "UACE-GP",
    paper: "Paper 1",
    level: "UACE",
    time: "09:00 AM - 12:00 PM",
    duration: "3 hours",
    venue: "Main Hall",
  },
  {
    date: "2026-06-05",
    day: "Friday",
    subject: "Subsidiary Mathematics",
    code: "UACE-SM",
    paper: "Paper 1",
    level: "UACE",
    time: "09:00 AM - 11:30 AM",
    duration: "2.5 hours",
    venue: "Main Hall",
  },
  {
    date: "2026-06-09",
    day: "Tuesday",
    subject: "Physics",
    code: "UACE-PHY",
    paper: "Paper 2",
    level: "UACE",
    time: "09:00 AM - 12:00 PM",
    duration: "3 hours",
    venue: "Science Block",
  },
  {
    date: "2026-06-11",
    day: "Thursday",
    subject: "Chemistry",
    code: "UACE-CHE",
    paper: "Paper 2",
    level: "UACE",
    time: "09:00 AM - 12:00 PM",
    duration: "3 hours",
    venue: "Science Block",
  },
  {
    date: "2026-06-15",
    day: "Monday",
    subject: "Biology",
    code: "UACE-BIO",
    paper: "Paper 2",
    level: "UACE",
    time: "09:00 AM - 12:00 PM",
    duration: "3 hours",
    venue: "Science Block",
  },
  {
    date: "2026-06-18",
    day: "Thursday",
    subject: "Geography",
    code: "UACE-GEO",
    paper: "Paper 1",
    level: "UACE",
    time: "02:00 PM - 05:00 PM",
    duration: "3 hours",
    venue: "Auditorium A",
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
    {
      label: "Exam Centres",
      value: new Set(schedule.map((exam) => exam.venue)).size,
      className: "border-l-green-500",
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
                    <TableHead>Date</TableHead>
                    <TableHead>Day</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead>Code</TableHead>
                    <TableHead>Paper</TableHead>
                    <TableHead>Time</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Venue</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {schedule.map((exam) => (
                    <TableRow key={`${exam.code}-${exam.date}`}>
                      <TableCell className="font-semibold text-slate-900">
                        {new Date(exam.date).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                        })}
                      </TableCell>
                      <TableCell className="text-slate-900">{exam.day}</TableCell>
                      <TableCell className="font-medium text-slate-900">
                        {exam.subject}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{exam.code}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{exam.paper}</Badge>
                      </TableCell>
                      <TableCell className="text-slate-900">{exam.time}</TableCell>
                      <TableCell className="text-slate-500">
                        {exam.duration}
                      </TableCell>
                      <TableCell className="text-slate-900">{exam.venue}</TableCell>
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
                    key={`${exam.code}-${exam.time}`}
                    className="bg-white shadow-sm border border-slate-200 rounded-2xl p-4"
                  >
                    <div className="mb-3 flex flex-wrap items-center gap-2">
                      <BookOpen className="h-4 w-4 text-red-400" />
                      <h4 className="font-semibold text-slate-900">{exam.subject}</h4>
                      <Badge variant="outline">{exam.code}</Badge>
                      <Badge variant="secondary">{exam.paper}</Badge>
                    </div>
                    <div className="space-y-2 text-sm text-slate-500">
                      <div className="flex items-center gap-2">
                        <Clock className="h-3.5 w-3.5" />
                        <span>{exam.time}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-3.5 w-3.5" />
                        <span>{exam.duration}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-3.5 w-3.5" />
                        <span>{exam.venue}</span>
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
      const pdf = new jsPDF();
      const pageWidth = pdf.internal.pageSize.getWidth();
      let yPos = 15;

      // Header
      pdf.setFontSize(18);
      pdf.text(`${level} Examination Timetable`, pageWidth / 2, yPos, {
        align: "center",
      });
      yPos += 8;

      // Metadata
      pdf.setFontSize(10);
      pdf.text(`WAKISSHA - ${new Date().toLocaleDateString()}`, 15, yPos);
      yPos += 8;

      // Table
      const tableColumns = [
        "Date",
        "Day",
        "Subject",
        "Code",
        "Paper",
        "Time",
        "Duration",
        "Venue",
      ];
      const tableRows = schedule.map((exam) => [
        new Date(exam.date).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        }),
        exam.day,
        exam.subject,
        exam.code,
        exam.paper,
        exam.time,
        exam.duration,
        exam.venue,
      ]);

      autoTable(pdf, {
        head: [tableColumns],
        body: tableRows,
        startY: yPos,
        margin: { left: 10, right: 10 },
        headStyles: {
          fillColor: level === "UCE" ? [59, 130, 246] : [34, 197, 94],
          textColor: [255, 255, 255],
          fontSize: 9,
          fontStyle: "bold",
        },
        bodyStyles: {
          fontSize: 8,
        },
        alternateRowStyles: {
          fillColor: [240, 245, 250],
        },
        columnStyles: {
          0: { cellWidth: 15 },
          1: { cellWidth: 15 },
          2: { cellWidth: 30 },
          3: { cellWidth: 15 },
        },
      });

      pdf.save(`${level}-timetable-${new Date().getTime()}.pdf`);
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
              {isExporting === "UCE" ? "Exporting..." : "Export UCE PDF"}
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
              {isExporting === "UACE" ? "Exporting..." : "Export UACE PDF"}
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




