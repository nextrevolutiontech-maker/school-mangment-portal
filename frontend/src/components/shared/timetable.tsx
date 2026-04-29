import {
  Calendar,
  Clock,
  BookOpen,
  Download,
  MapPin,
  Plus,
  Pencil,
  Trash2,
  Save,
  X,
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { toast } from "sonner";
import { useState } from "react";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { useAuth, ScheduleEntry } from "../auth-context";

interface TimetableProps {
  onPageChange: (page: string) => void;
}

function getPaperNumberLabel(paper: string) {
  const paperNumber = paper.match(/\d+/)?.[0] ?? paper;
  return paperNumber;
}

function groupByDate(schedule: ScheduleEntry[]) {
  return schedule.reduce<Record<string, ScheduleEntry[]>>((acc, exam) => {
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
  onEdit,
  onDelete,
}: {
  title: string;
  description: string;
  schedule: ScheduleEntry[];
  onEdit?: (entry: ScheduleEntry) => void;
  onDelete?: (id: string) => void;
}) {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const groupedSchedule = groupByDate(schedule);
  
  const sortedSchedule = [...schedule].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const statCards = [
    {
      label: "Total Papers",
      value: schedule.length,
      className: "border-l-red-600",
      valueClass: "text-slate-900",
    },
    {
      label: "Start Date",
      value: schedule.length > 0 ? new Date(sortedSchedule[0].date).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      }) : "TBA",
      className: "border-l-amber-500",
      valueClass: "text-slate-900",
    },
    {
      label: "End Date",
      value: schedule.length > 0 ? new Date(sortedSchedule[sortedSchedule.length - 1].date).toLocaleDateString(
        "en-US",
        {
          month: "short",
          day: "numeric",
        },
      ) : "TBA",
      className: "border-l-blue-500",
      valueClass: "text-slate-900",
    },
  ];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        {statCards.map((stat) => (
          <Card key={stat.label} className={`h-full border-l-4 ${stat.className}`}>
            <CardContent className="pt-4">
              <p className="text-sm font-medium text-slate-500">{stat.label}</p>
              <p className={`mt-2 text-2xl font-bold ${stat.valueClass}`}>
                {stat.value}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="table" className="space-y-3">
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
            <CardContent className="pt-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Day & Date</TableHead>
                    <TableHead>Period</TableHead>
                    <TableHead>Code/Paper</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead>Duration</TableHead>
                    {isAdmin && <TableHead className="text-right">Actions</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedSchedule.map((exam) => (
                    <TableRow key={exam.id}>
                      <TableCell className="font-semibold text-slate-900">
                        {exam.day},{" "}
                        {new Date(exam.date).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={exam.period === "Morning" ? "bg-blue-50 text-blue-700 border-blue-100" : "bg-purple-50 text-purple-700 border-purple-100"}>
                          {exam.period}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-mono font-bold">
                        <span className="text-black">{exam.code}</span>
                        <span className="text-blue-600">/{getPaperNumberLabel(exam.paper)}</span>
                      </TableCell>
                      <TableCell className="font-semibold text-amber-600">
                        {exam.subject}
                      </TableCell>
                      <TableCell className="text-slate-500">
                        {exam.duration}
                      </TableCell>
                      {isAdmin && (
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8 text-slate-400 hover:text-blue-600"
                              onClick={() => onEdit?.(exam)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8 text-slate-400 hover:text-red-600"
                              onClick={() => onDelete?.(exam.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                  {sortedSchedule.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={isAdmin ? 6 : 5} className="h-24 text-center text-slate-500">
                        No examination entries scheduled for this level yet.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="calendar" className="w-full space-y-4">
          {Object.entries(groupedSchedule).sort((a, b) => new Date(a[0]).getTime() - new Date(b[0]).getTime()).map(([date, exams]) => (
            <Card key={date}>
              <CardHeader className="border-b border-slate-200 bg-slate-50/50">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-orange-600/15 text-orange-400">
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
                    <CardDescription className="text-slate-500 text-xs">
                      {exams.length} paper{exams.length > 1 ? "s" : ""} scheduled
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="grid gap-4 pt-6 lg:grid-cols-2">
                {exams.map((exam) => (
                  <div
                    key={exam.id}
                    className="bg-white shadow-sm border border-slate-200 rounded-2xl p-4 hover:border-orange-200 transition-colors group relative"
                  >
                    <div className="mb-3 flex flex-wrap items-center gap-2">
                      <BookOpen className="h-4 w-4 text-red-400" />
                      <span className="font-mono text-sm font-bold">
                        <span className="text-black">{exam.code}</span>
                        <span className="text-blue-600">/{getPaperNumberLabel(exam.paper)}</span>
                      </span>
                      <h4 className="font-semibold text-amber-600">
                        {exam.subject}
                      </h4>
                    </div>
                    <div className="space-y-2 text-sm text-slate-500">
                      <div className="flex items-center gap-2">
                        <Clock className="h-3.5 w-3.5" />
                        <span className="font-medium">{exam.period} Session</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-3.5 w-3.5" />
                        <span>{exam.duration}</span>
                      </div>
                    </div>
                    {isAdmin && (
                      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-7 w-7 bg-white shadow-sm border"
                          onClick={() => onEdit?.(exam)}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}
          {schedule.length === 0 && (
            <div className="p-12 text-center bg-slate-50 rounded-2xl border-2 border-dashed">
              <p className="text-slate-500">No calendar entries to display.</p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

export function Timetable({ onPageChange }: TimetableProps) {
  const { user, timetable, addTimetableEntry, updateTimetableEntry, deleteTimetableEntry } = useAuth();
  const isAdmin = user?.role === "admin";
  const [isExporting, setIsExporting] = useState<"UCE" | "UACE" | null>(null);
  
  const [isManageDialogOpen, setIsManageDialogOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<ScheduleEntry | null>(null);
  
  const [formData, setFormData] = useState({
    date: "",
    subject: "",
    code: "",
    paper: "Paper 1",
    level: "UCE" as "UCE" | "UACE",
    period: "Morning" as "Morning" | "Afternoon",
    duration: "2.5 hours",
  });

  const uceSchedule = timetable.filter(e => e.level === "UCE");
  const uaceSchedule = timetable.filter(e => e.level === "UACE");

  const handleEdit = (entry: ScheduleEntry) => {
    setEditingEntry(entry);
    setFormData({
      date: entry.date,
      subject: entry.subject,
      code: entry.code,
      paper: entry.paper,
      level: entry.level,
      period: entry.period,
      duration: entry.duration,
    });
    setIsManageDialogOpen(true);
  };

  const handleAddNew = (level: "UCE" | "UACE") => {
    setEditingEntry(null);
    setFormData({
      date: "",
      subject: "",
      code: "",
      paper: "Paper 1",
      level: level,
      period: "Morning",
      duration: level === "UCE" ? "2.5 hours" : "3 hours",
    });
    setIsManageDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingEntry) {
      updateTimetableEntry(editingEntry.id, formData);
      toast.success("Timetable entry updated");
    } else {
      addTimetableEntry(formData);
      toast.success("New examination entry added");
    }
    setIsManageDialogOpen(false);
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this timetable entry?")) {
      deleteTimetableEntry(id);
      toast.success("Entry removed from timetable");
    }
  };

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

      const tableColumns = ["Day & Date", "Period", "Code/Paper", "Subject", "Duration"];
      const tableRows = schedule.map((exam) => [
        `${exam.day}, ${new Date(exam.date).toLocaleDateString("en-GB")}`,
        exam.period,
        `${exam.code}/${getPaperNumberLabel(exam.paper)}`,
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
          2: { cellWidth: 25, textColor: [0, 0, 0], fontStyle: "bold", halign: "center" },
          3: { cellWidth: 96, textColor: [0, 0, 0], fontStyle: "bold" },
          4: { cellWidth: 24, halign: "center" },
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
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-orange-500">
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

      <Tabs defaultValue="uce" className="w-full space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="uce">UCE Timetable</TabsTrigger>
          <TabsTrigger value="uace">UACE Timetable</TabsTrigger>
        </TabsList>

        <TabsContent value="uce" className="w-full space-y-4">
          <div className="flex justify-end gap-2">
            {isAdmin && (
              <Button
                variant="default"
                className="bg-slate-900 hover:bg-slate-800"
                onClick={() => handleAddNew("UCE")}
              >
                <Plus className="mr-2 h-4 w-4" />
                Add UCE Entry
              </Button>
            )}
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
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        </TabsContent>

        <TabsContent value="uace" className="w-full space-y-4">
          <div className="flex justify-end gap-2">
            {isAdmin && (
              <Button
                variant="default"
                className="bg-slate-900 hover:bg-slate-800"
                onClick={() => handleAddNew("UACE")}
              >
                <Plus className="mr-2 h-4 w-4" />
                Add UACE Entry
              </Button>
            )}
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
            description="Official UACE paper schedule with sitting times."
            schedule={uaceSchedule}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        </TabsContent>
      </Tabs>

      <Dialog open={isManageDialogOpen} onOpenChange={setIsManageDialogOpen}>
        <DialogContent className="sm:max-w-[500px] rounded-3xl" aria-describedby="timetable-desc">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              {editingEntry ? <Pencil className="h-5 w-5 text-blue-600" /> : <Plus className="h-5 w-5 text-green-600" />}
              {editingEntry ? "Edit Timetable Entry" : "Add New Timetable Entry"}
            </DialogTitle>
            <DialogDescription id="timetable-desc">
              Enter the examination details for {formData.level} below.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="date">Examination Date</Label>
                <Input 
                  id="date" 
                  type="date" 
                  required 
                  value={formData.date}
                  onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="period">Period</Label>
                <Select 
                  value={formData.period} 
                  onValueChange={(val: any) => setFormData(prev => ({ ...prev, period: val }))}
                >
                  <SelectTrigger id="period">
                    <SelectValue placeholder="Select period" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Morning">Morning</SelectItem>
                    <SelectItem value="Afternoon">Afternoon</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="subject">Subject Name</Label>
              <Input 
                id="subject" 
                placeholder="e.g. Mathematics" 
                required 
                value={formData.subject}
                onChange={(e) => setFormData(prev => ({ ...prev, subject: e.target.value }))}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="code">Subject Code</Label>
                <Input 
                  id="code" 
                  placeholder="e.g. 456" 
                  required 
                  value={formData.code}
                  onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="paper">Paper</Label>
                <Select 
                  value={formData.paper} 
                  onValueChange={(val: any) => setFormData(prev => ({ ...prev, paper: val }))}
                >
                  <SelectTrigger id="paper">
                    <SelectValue placeholder="Select paper" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Paper 1">Paper 1</SelectItem>
                    <SelectItem value="Paper 2">Paper 2</SelectItem>
                    <SelectItem value="Paper 3">Paper 3</SelectItem>
                    <SelectItem value="Paper 4">Paper 4</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="duration">Duration</Label>
              <Input 
                id="duration" 
                placeholder="e.g. 2.5 hours" 
                required 
                value={formData.duration}
                onChange={(e) => setFormData(prev => ({ ...prev, duration: e.target.value }))}
              />
            </div>

            <DialogFooter className="pt-4">
              <Button type="button" variant="ghost" onClick={() => setIsManageDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" className="bg-slate-900 hover:bg-slate-800 px-8">
                {editingEntry ? "Update Entry" : "Add to Timetable"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

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
