import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import { Badge } from "../ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Search, Plus, Trash2, AlertCircle, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { Alert, AlertDescription } from "../ui/alert";

interface StudentsEntriesProps {
  onPageChange: (page: string) => void;
}

interface StudentEntry {
  id: string;
  examLevel: "UCE" | "UACE";
  studentName: string;
  classLevel: string;
  subject: string;
  subjectCode: string;
  entry1: number;
  entry2: number;
  entry3: number;
  entry4: number;
  totalEntries: number;
  schoolCode: string;
  schoolName: string;
}

const availableSubjects = [
  { code: "MATH101", name: "Mathematics", level: "Advanced" },
  { code: "ENG101", name: "English Language", level: "Standard" },
  { code: "PHY101", name: "Physics", level: "Advanced" },
  { code: "CHEM101", name: "Chemistry", level: "Advanced" },
  { code: "BIO101", name: "Biology", level: "Advanced" },
  { code: "HIST101", name: "History", level: "Standard" },
  { code: "GEOG101", name: "Geography", level: "Standard" },
  { code: "COMP101", name: "Computer Science", level: "Advanced" },
];

export function StudentsEntries({ onPageChange }: StudentsEntriesProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [schoolFilter, setSchoolFilter] = useState("all");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  const [entries, setEntries] = useState<StudentEntry[]>([
    {
      id: "1",
      examLevel: "UCE",
      studentName: "John Smith",
      classLevel: "Grade 12",
      subject: "Mathematics",
      subjectCode: "MATH101",
      entry1: 2,
      entry2: 1,
      entry3: 0,
      entry4: 0,
      totalEntries: 3,
      schoolCode: "SCH001",
      schoolName: "Greenwood High School",
    },
    {
      id: "2",
      examLevel: "UCE",
      studentName: "Emma Johnson",
      classLevel: "Grade 11",
      subject: "English Language",
      subjectCode: "ENG101",
      entry1: 1,
      entry2: 1,
      entry3: 1,
      entry4: 0,
      totalEntries: 3,
      schoolCode: "SCH001",
      schoolName: "Greenwood High School",
    },
    {
      id: "3",
      examLevel: "UACE",
      studentName: "Michael Chen",
      classLevel: "Grade 12",
      subject: "Physics",
      subjectCode: "PHY101",
      entry1: 2,
      entry2: 0,
      entry3: 0,
      entry4: 0,
      totalEntries: 2,
      schoolCode: "SCH002",
      schoolName: "Riverside Academy",
    },
  ]);

  const [newEntry, setNewEntry] = useState({
    examLevel: "UCE",
    studentName: "",
    classLevel: "Grade 12",
    subjectCode: "",
    entry1: "",
    entry2: "",
    entry3: "",
    entry4: "",
  });

  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  const calculateTotal = () => {
    const e1 = parseInt(newEntry.entry1) || 0;
    const e2 = parseInt(newEntry.entry2) || 0;
    const e3 = parseInt(newEntry.entry3) || 0;
    const e4 = parseInt(newEntry.entry4) || 0;
    return e1 + e2 + e3 + e4;
  };

  const handleNumberInput = (field: string, value: string) => {
    if (value === "" || /^\d+$/.test(value)) {
      setNewEntry({ ...newEntry, [field]: value });
    }
  };

  const validateEntry = () => {
    const errors: string[] = [];

    if (!newEntry.studentName.trim()) {
      errors.push("Student name is required");
    }

    if (!newEntry.subjectCode) {
      errors.push("Subject selection is required");
    }

    if (calculateTotal() === 0) {
      errors.push("At least one entry must be greater than 0");
    }

    setValidationErrors(errors);
    return errors.length === 0;
  };

  const handleAddEntry = () => {
    if (!validateEntry()) return;

    const subject = availableSubjects.find(
      (record) => record.code === newEntry.subjectCode,
    );
    const total = calculateTotal();

    const entry: StudentEntry = {
      id: String(entries.length + 1),
      examLevel: newEntry.examLevel,
      studentName: newEntry.studentName,
      classLevel: newEntry.classLevel,
      subject: subject?.name || "",
      subjectCode: newEntry.subjectCode,
      entry1: parseInt(newEntry.entry1) || 0,
      entry2: parseInt(newEntry.entry2) || 0,
      entry3: parseInt(newEntry.entry3) || 0,
      entry4: parseInt(newEntry.entry4) || 0,
      totalEntries: total,
      schoolCode: "SCH001",
      schoolName: "Greenwood High School",
    };

    setEntries([...entries, entry]);
    setIsAddDialogOpen(false);
    setNewEntry({
      examLevel: "UCE",
      studentName: "",
      classLevel: "Grade 12",
      subjectCode: "",
      entry1: "",
      entry2: "",
      entry3: "",
      entry4: "",
    });
    setValidationErrors([]);

    toast.success("Student Entry Added", {
      description: `${newEntry.studentName} registered for ${subject?.name}`,
    });
  };

  const handleDeleteEntry = (id: string) => {
    const entry = entries.find((record) => record.id === id);
    setEntries(entries.filter((record) => record.id !== id));

    toast.success("Entry Deleted", {
      description: `Entry for ${entry?.studentName} has been removed`,
    });
  };

  const filteredEntries = entries.filter((entry) => {
    const matchesSearch =
      entry.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.subjectCode.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSchool =
      schoolFilter === "all" || entry.schoolCode === schoolFilter;

    return matchesSearch && matchesSchool;
  });

  const totalStudents = new Set(entries.map((entry) => entry.studentName)).size;
  const totalEntries = entries.reduce(
    (sum, entry) => sum + entry.totalEntries,
    0,
  );

  const statCards = [
    {
      label: "Total Students",
      value: totalStudents,
      className: "border-l-red-600",
      valueClass: "text-slate-900",
    },
    {
      label: "Total Entries",
      value: totalEntries,
      className: "border-l-amber-500",
      valueClass: "text-slate-900",
    },
    {
      label: "Subject Combinations",
      value: entries.length,
      className: "border-l-blue-500",
      valueClass: "text-slate-900",
    },
    {
      label: "Schools",
      value: new Set(entries.map((entry) => entry.schoolCode)).size,
      className: "border-l-green-500",
      valueClass: "text-slate-900",
    },
  ];

  return (
    <div className="flex flex-col w-full gap-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-2">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-red-400">
            Student Registry
          </p>
          <div>
            <h1 className="text-3xl font-bold text-slate-900">
              Students & Entries
            </h1>
            <p className="mt-2 max-w-2xl text-slate-500">
              Manage student examination entries, subject combinations, and
              numeric paper counts from a clean central registry.
            </p>
          </div>
        </div>

        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="w-full lg:w-auto">
              <UserPlus className="h-4 w-4" />
              Add Student Entry
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Add Student Entry</DialogTitle>
              <DialogDescription>
                Register a student for a subject and specify the numeric entry
                totals below.
              </DialogDescription>
            </DialogHeader>

            {validationErrors.length > 0 && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <ul className="list-disc list-inside space-y-1">
                    {validationErrors.map((error, index) => (
                      <li key={index}>{error}</li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="examLevel">Exam Level (UCE / UACE)</Label>
                <Select
                  value={newEntry.examLevel}
                  onValueChange={(value) =>
                    setNewEntry({
                      ...newEntry,
                      examLevel: value as "UCE" | "UACE",
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select exam level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="UCE">UCE (O' Level)</SelectItem>
                    <SelectItem value="UACE">UACE (A' Level)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="studentName">Student Name</Label>
                <Input
                  id="studentName"
                  placeholder="Enter student full name"
                  value={newEntry.studentName}
                  onChange={(e) =>
                    setNewEntry({ ...newEntry, studentName: e.target.value })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="classLevel">Class / Level</Label>
                <Select
                  value={newEntry.classLevel}
                  onValueChange={(value) =>
                    setNewEntry({ ...newEntry, classLevel: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Grade 9">Grade 9</SelectItem>
                    <SelectItem value="Grade 10">Grade 10</SelectItem>
                    <SelectItem value="Grade 11">Grade 11</SelectItem>
                    <SelectItem value="Grade 12">Grade 12</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="subject">Subject Selection</Label>
                <Select
                  value={newEntry.subjectCode}
                  onValueChange={(value) =>
                    setNewEntry({ ...newEntry, subjectCode: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a subject" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableSubjects.map((subject) => (
                      <SelectItem key={subject.code} value={subject.code}>
                        {subject.code} - {subject.name} ({subject.level})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3 rounded-2xl bg-white shadow-sm border border-slate-200 p-4 md:col-span-2">
                <Label className="text-sm font-semibold text-slate-900">
                  Entry Columns
                </Label>
                <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                  {(["entry1", "entry2", "entry3", "entry4"] as const).map(
                    (field, index) => (
                      <div key={field} className="space-y-1">
                        <Label
                          htmlFor={field}
                          className="text-xs text-slate-500"
                        >
                          Entry {index + 1}
                        </Label>
                        <Input
                          id={field}
                          type="text"
                          inputMode="numeric"
                          placeholder="0"
                          value={newEntry[field]}
                          onChange={(e) =>
                            handleNumberInput(field, e.target.value)
                          }
                          className="text-center"
                        />
                      </div>
                    ),
                  )}
                </div>
                <div className="rounded-xl bg-white shadow-sm border border-slate-200 px-4 py-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-slate-500">
                      Total Entries
                    </span>
                    <span className="text-xl font-bold text-red-600">
                      {calculateTotal()}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-slate-500">
                    Automatically calculated from Entry 1 to Entry 4
                  </p>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setIsAddDialogOpen(false);
                  setValidationErrors([]);
                }}
              >
                Cancel
              </Button>
              <Button onClick={handleAddEntry}>Add Entry</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {statCards.map((stat) => (
          <Card key={stat.label} className={`border-l-4 ${stat.className}`}>
            <CardContent className="pt-6">
              <p className="text-sm font-medium text-slate-500">{stat.label}</p>
              <p className={`mt-3 text-3xl font-bold ${stat.valueClass}`}>
                {stat.value}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4 lg:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
              <Input
                placeholder="Search by student name or subject code..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={schoolFilter} onValueChange={setSchoolFilter}>
              <SelectTrigger className="w-full lg:w-[240px]">
                <SelectValue placeholder="Filter by school" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Schools</SelectItem>
                <SelectItem value="SCH001">Greenwood High</SelectItem>
                <SelectItem value="SCH002">Riverside Academy</SelectItem>
                <SelectItem value="SCH003">Oak Valley</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              className="w-full lg:w-auto"
              onClick={() => onPageChange("schools")}
            >
              Manage Schools
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="border-b border-slate-200">
          <CardTitle className="text-slate-900">Student Entries</CardTitle>
          <CardDescription className="text-slate-500">
            {filteredEntries.length} entr
            {filteredEntries.length !== 1 ? "ies" : "y"} found
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student Name</TableHead>
                <TableHead>Class / Level</TableHead>
                <TableHead>Subject</TableHead>
                <TableHead className="text-center">1</TableHead>
                <TableHead className="text-center">2</TableHead>
                <TableHead className="text-center">3</TableHead>
                <TableHead className="text-center">4</TableHead>
                <TableHead className="text-center">Entries</TableHead>
                <TableHead>School</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
                {filteredEntries.map((entry) => (
                <TableRow key={entry.id}>
                  <TableCell className="font-semibold text-slate-900">
                    {entry.studentName}
                  </TableCell>
                  <TableCell>{entry.classLevel}</TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium text-slate-900">
                        {entry.subject}
                      </div>
                      <Badge variant="outline" className="mt-1">
                        {entry.subjectCode}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell className="text-center font-mono">
                    {entry.entry1}
                  </TableCell>
                  <TableCell className="text-center font-mono">
                    {entry.entry2}
                  </TableCell>
                  <TableCell className="text-center font-mono">
                    {entry.entry3}
                  </TableCell>
                  <TableCell className="text-center font-mono">
                    {entry.entry4}
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant="secondary">{entry.totalEntries}</Badge>
                  </TableCell>
                  <TableCell className="text-slate-500">
                    {entry.schoolCode}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-500 hover:bg-red-50 hover:text-red-600"
                      onClick={() => handleDeleteEntry(entry.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}


