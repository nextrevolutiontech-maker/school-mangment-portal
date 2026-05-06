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
      icon: BookOpen,
      color: "text-slate-700",
      bg: "bg-slate-100",
    },
    {
      label: "Start Date",
      value: schedule.length > 0 ? new Date(sortedSchedule[0].date).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      }) : "TBA",
      icon: Calendar,
      color: "text-blue-700",
      bg: "bg-blue-100",
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
      icon: Clock,
      color: "text-emerald-700",
      bg: "bg-emerald-100",
    },
  ];

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label} className="h-full border-slate-200">
              <CardContent className="pt-5">
                <div className="flex items-center gap-3">
                  <div className={`p-2.5 rounded-xl ${stat.bg}`}>
                    <Icon className={`h-5 w-5 ${stat.color}`} />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      {stat.label}
                    </p>
                    <p className="text-2xl font-bold text-slate-900">
                      {stat.value}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Tabs defaultValue="table" className="space-y-4">
        <TabsList className="bg-slate-100 p-1">
          <TabsTrigger value="table" className="rounded-md data-[state=active]:bg-white data-[state=active]:shadow-sm">Table View</TabsTrigger>
          <TabsTrigger value="calendar" className="rounded-md data-[state=active]:bg-white data-[state=active]:shadow-sm">Calendar View</TabsTrigger>
        </TabsList>

        <TabsContent value="table">
          <Card className="border-slate-200">
            <CardHeader className="border-b border-slate-200 pb-4">
              <div className="flex flex-col gap-1">
                <CardTitle className="text-slate-900 font-semibold text-lg">{title}</CardTitle>
                <CardDescription className="text-slate-500">{description}</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="rounded-xl border border-slate-200 overflow-hidden">
                <Table>
                  <TableHeader className="bg-slate-50">
                    <TableRow className="hover:bg-slate-50">
                      <TableHead className="text-slate-600 font-semibold text-xs uppercase tracking-wider">Day & Date</TableHead>
                      <TableHead className="text-slate-600 font-semibold text-xs uppercase tracking-wider">Period</TableHead>
                      <TableHead className="text-slate-600 font-semibold text-xs uppercase tracking-wider">Code/Paper</TableHead>
                      <TableHead className="text-slate-600 font-semibold text-xs uppercase tracking-wider">Subject</TableHead>
                      <TableHead className="text-slate-600 font-semibold text-xs uppercase tracking-wider">Duration</TableHead>
                      {isAdmin && <TableHead className="text-slate-600 font-semibold text-xs uppercase tracking-wider text-right">Actions</TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortedSchedule.map((exam) => (
                      <TableRow key={exam.id} className="hover:bg-slate-50/80">
                        <TableCell className="font-semibold text-slate-900">
                          {exam.day},{" "}
                          {new Date(exam.date).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant="secondary"
                            className={
                              exam.period === "Morning" 
                                ? "bg-blue-50 text-blue-700 border-blue-100" 
                                : "bg-purple-50 text-purple-700 border-purple-100"
                            }
                          >
                            {exam.period}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-mono text-sm">
                          <span className="font-bold text-slate-900">{exam.code}</span>
                          <span className="text-blue-600 font-medium">/{getPaperNumberLabel(exam.paper)}</span>
                        </TableCell>
                        <TableCell className="font-semibold text-slate-900">
                          {exam.subject}
                        </TableCell>
                        <TableCell className="text-slate-600 font-medium">
                          {exam.duration}
                        </TableCell>
                        {isAdmin && (
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-8 w-8 text-slate-500 hover:text-slate-900 hover:bg-slate-100"
                                onClick={() => onEdit?.(exam)}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-8 w-8 text-slate-500 hover:text-red-600 hover:bg-red-50"
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
                        <TableCell colSpan={isAdmin ? 6 : 5} className="h-32 text-center text-slate-500">
                          No examination entries scheduled for this level yet.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="calendar" className="w-full space-y-4">
          {Object.entries(groupedSchedule).sort((a, b) => new Date(a[0]).getTime() - new Date(b[0]).getTime()).map(([date, exams]) => (
            <Card key={date} className="border-slate-200">
              <CardHeader className="border-b border-slate-200 bg-slate-50">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-blue-100 text-blue-700">
                    <Calendar className="h-5 w-5" />
                  </div>
                  <div>
                    <CardTitle className="text-slate-900 font-semibold">
                      {new Date(date).toLocaleDateString("en-US", {
                        weekday: "long",
                        month: "long",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </CardTitle>
                    <CardDescription className="text-slate-500 text-sm">
                      {exams.length} paper{exams.length > 1 ? "s" : ""} scheduled
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="grid gap-3 pt-5 lg:grid-cols-2">
                {exams.map((exam) => (
                  <div
                    key={exam.id}
                    className="bg-white border border-slate-200 rounded-lg p-4 hover:border-slate-300 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          <BookOpen className="h-4 w-4 text-slate-500" />
                          <span className="font-mono text-sm font-bold text-slate-700">
                            <span className="text-slate-900">{exam.code}</span>
                            <span className="text-blue-600">/{getPaperNumberLabel(exam.paper)}</span>
                          </span>
                        </div>
                        <h4 className="font-semibold text-slate-900 text-base mb-2">
                          {exam.subject}
                        </h4>
                        <div className="flex items-center gap-3 text-sm text-slate-600">
                          <div className="flex items-center gap-1.5">
                            <Clock className="h-3.5 w-3.5" />
                            <span className="font-medium">{exam.period} Session</span>
                          </div>
                          <span className="text-slate-400">•</span>
                          <div className="flex items-center gap-1.5">
                            <MapPin className="h-3.5 w-3.5" />
                            <span>{exam.duration}</span>
                          </div>
                        </div>
                      </div>
                      {isAdmin && (
                        <div className="flex items-center gap-1">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 text-slate-500 hover:text-slate-900 hover:bg-slate-100"
                            onClick={() => onEdit?.(exam)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}
          {schedule.length === 0 && (
            <div className="p-12 text-center bg-slate-50 rounded-xl border-2 border-dashed border-slate-200">
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
    duration: "2hrs 30mins",
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
      duration: level === "UCE" ? "2hrs 30mins" : "3hrs",
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
          <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-slate-500">
            EXAMINATION SCHEDULE
          </p>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">
            UCE &amp; UACE Timetable
          </h1>
          <p className="max-w-3xl text-slate-500 leading-relaxed">
            Browse separate UCE and UACE examination schedules with table and
            calendar views for planning, printing, and dashboard review.
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Button variant="outline" onClick={() => onPageChange("reports")} className="border-slate-200">
            Go to Reports
          </Button>
        </div>
      </div>

      <Tabs defaultValue="uce" className="w-full space-y-5">
        <TabsList className="grid w-full grid-cols-2 bg-slate-100 p-1">
          <TabsTrigger value="uce" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm font-semibold">UCE Timetable</TabsTrigger>
          <TabsTrigger value="uace" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm font-semibold">UACE Timetable</TabsTrigger>
        </TabsList>

        <TabsContent value="uce" className="w-full space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex-1" />
            <div className="flex items-center gap-2">
              {isAdmin && (
                <Button
                  variant="default"
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
                className="border-slate-200"
              >
                <Download className="h-4 w-4 mr-2" />
                {isExporting === "UCE" ? "Downloading..." : "Download UCE PDF"}
              </Button>
            </div>
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
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex-1" />
            <div className="flex items-center gap-2">
              {isAdmin && (
                <Button
                  variant="default"
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
                className="border-slate-200"
              >
                <Download className="h-4 w-4 mr-2" />
                {isExporting === "UACE" ? "Downloading..." : "Download UACE PDF"}
              </Button>
            </div>
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
        <DialogContent className="sm:max-w-[520px] rounded-2xl border-slate-200">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              {editingEntry ? <Pencil className="h-5 w-5 text-slate-700" /> : <Plus className="h-5 w-5 text-slate-700" />}
              {editingEntry ? "Edit Timetable Entry" : "Add New Timetable Entry"}
            </DialogTitle>
            <DialogDescription id="timetable-desc">
              Enter the examination details for {formData.level} below.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4 py-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="date" className="text-sm font-semibold text-slate-700">Examination Date</Label>
                <Input 
                  id="date" 
                  type="date" 
                  required 
                  value={formData.date}
                  onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                  className="border-slate-200 focus:border-slate-400"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="period" className="text-sm font-semibold text-slate-700">Period</Label>
                <Select 
                  value={formData.period} 
                  onValueChange={(val: any) => setFormData(prev => ({ ...prev, period: val }))}
                >
                  <SelectTrigger id="period" className="border-slate-200 focus:border-slate-400">
                    <SelectValue placeholder="Select period" />
                  </SelectTrigger>
                  <SelectContent className="border-slate-200">
                    <SelectItem value="Morning">Morning</SelectItem>
                    <SelectItem value="Afternoon">Afternoon</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="subject" className="text-sm font-semibold text-slate-700">Subject Name</Label>
              <Input 
                id="subject" 
                placeholder="e.g. Mathematics" 
                required 
                value={formData.subject}
                onChange={(e) => setFormData(prev => ({ ...prev, subject: e.target.value }))}
                className="border-slate-200 focus:border-slate-400"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="code" className="text-sm font-semibold text-slate-700">Subject Code</Label>
                <Input 
                  id="code" 
                  placeholder="e.g. 456" 
                  required 
                  value={formData.code}
                  onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value }))}
                  className="border-slate-200 focus:border-slate-400"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="paper" className="text-sm font-semibold text-slate-700">Paper</Label>
                <Select 
                  value={formData.paper} 
                  onValueChange={(val: any) => setFormData(prev => ({ ...prev, paper: val }))}
                >
                  <SelectTrigger id="paper" className="border-slate-200 focus:border-slate-400">
                    <SelectValue placeholder="Select paper" />
                  </SelectTrigger>
                  <SelectContent className="border-slate-200">
                    <SelectItem value="Paper 1">Paper 1</SelectItem>
                    <SelectItem value="Paper 2">Paper 2</SelectItem>
                    <SelectItem value="Paper 3">Paper 3</SelectItem>
                    <SelectItem value="Paper 4">Paper 4</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="duration" className="text-sm font-semibold text-slate-700">Duration</Label>
              <Input 
                id="duration" 
                placeholder="e.g. 2hrs 30mins" 
                required 
                value={formData.duration}
                onChange={(e) => setFormData(prev => ({ ...prev, duration: e.target.value }))}
                className="border-slate-200 focus:border-slate-400"
              />
            </div>

            <DialogFooter className="pt-4">
              <Button type="button" variant="ghost" onClick={() => setIsManageDialogOpen(false)} className="text-slate-600 hover:bg-slate-100">
                Cancel
              </Button>
              <Button type="submit" className="px-6">
                {editingEntry ? "Update Entry" : "Add to Timetable"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Card className="border-slate-200">
        <CardHeader className="pb-4">
          <CardTitle className="text-slate-900 font-semibold text-lg">Candidate Instructions</CardTitle>
          <CardDescription className="text-slate-500">
            Key reminders for schools, invigilators, and student candidates.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="space-y-3 text-sm">
            <li className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-700">
              Schools should display both UCE and UACE schedules on noticeboards
              at least one week before the first paper.
            </li>
            <li className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-700">
              Candidates must arrive at the assigned venue 30 minutes before
              start time with valid identification.
            </li>
            <li className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-700">
              Practical and science papers should only be sat in approved rooms
              listed on the timetable.
            </li>
            <li className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-700">
              Any timetable changes will be communicated through the WAKISSHA
              portal dashboard and school email.
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
