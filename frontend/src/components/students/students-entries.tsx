import { useMemo, useState } from "react";
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
import { Search, AlertCircle, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { Alert, AlertDescription } from "../ui/alert";
import { useAuth } from "../auth-context";

interface StudentsEntriesProps {
  onPageChange: (page: string) => void;
}

export function StudentsEntries({ onPageChange }: StudentsEntriesProps) {
  const { user, schools, students, subjects, addStudentEntry } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [schoolFilter, setSchoolFilter] = useState("all");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  const [newEntry, setNewEntry] = useState({
    examLevel: "UCE",
    studentName: "",
    classLevel: "S4",
    schoolCode: user?.role === "school" ? user.schoolCode ?? "WAK26-0001" : "WAK26-0001",
    subjectCode: "",
    entry1: "",
    entry2: "",
    entry3: "",
    entry4: "",
    totalEntries: "",
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
    const enteredTotal = parseInt(newEntry.totalEntries) || 0;
    if (enteredTotal !== calculateTotal()) {
      errors.push("Grade1 + Grade2 + Grade3 + Grade4 must equal total entries");
    }

    setValidationErrors(errors);
    return errors.length === 0;
  };

  const handleAddEntry = () => {
    if (!validateEntry()) return;

    const subject = subjects.find((record) => record.code === newEntry.subjectCode);
    const total = calculateTotal();
    addStudentEntry({
      schoolCode: newEntry.schoolCode,
      studentName: newEntry.studentName,
      examLevel: newEntry.examLevel as "UCE" | "UACE",
      classLevel: newEntry.classLevel,
      subjectCode: newEntry.subjectCode,
      subjectName: subject?.name ?? "",
      entry1: parseInt(newEntry.entry1) || 0,
      entry2: parseInt(newEntry.entry2) || 0,
      entry3: parseInt(newEntry.entry3) || 0,
      entry4: parseInt(newEntry.entry4) || 0,
      totalEntries: total,
    });
    setIsAddDialogOpen(false);
    setNewEntry({
      examLevel: "UCE",
      studentName: "",
      classLevel: "S4",
      schoolCode: user?.role === "school" ? user.schoolCode ?? "WAK26-0001" : "WAK26-0001",
      subjectCode: "",
      entry1: "",
      entry2: "",
      entry3: "",
      entry4: "",
      totalEntries: "",
    });
    setValidationErrors([]);

    toast.success("Student Entry Added", {
      description: `${newEntry.studentName} registered successfully`,
    });
  };

  const filteredEntries = students.filter((entry) => {
    const matchesSearch =
      entry.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.subjectCode.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSchool =
      schoolFilter === "all" || entry.schoolCode === schoolFilter;

    return matchesSearch && matchesSchool;
  });

  const totalStudents = new Set(students.map((entry) => entry.studentName)).size;
  const totalEntries = students.reduce(
    (sum, entry) => sum + entry.totalEntries,
    0,
  );
  const allowedSubjects = useMemo(
    () =>
      subjects.filter(
        (subject) =>
          subject.educationLevel === "BOTH" ||
          subject.educationLevel === newEntry.examLevel,
      ),
    [subjects, newEntry.examLevel],
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
      value: students.length,
      className: "border-l-blue-500",
      valueClass: "text-slate-900",
    },
    {
      label: "Schools",
      value: new Set(students.map((entry) => entry.schoolCode)).size,
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
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-4 sm:p-6">
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
                    <SelectItem value="S4">S4</SelectItem>
                    <SelectItem value="S6">S6</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="schoolCode">School</Label>
                <Select
                  value={newEntry.schoolCode}
                  onValueChange={(value) =>
                    setNewEntry({ ...newEntry, schoolCode: value })
                  }
                  disabled={user?.role === "school"}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {schools.map((school) => (
                      <SelectItem key={school.code} value={school.code}>
                        {school.name}
                      </SelectItem>
                    ))}
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
                    {allowedSubjects.map((subject) => (
                      <SelectItem key={subject.code} value={subject.code}>
                        {subject.code} - {subject.name}
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
                <div className="rounded-xl bg-white shadow-sm border border-slate-200 px-4 py-3 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-slate-500">
                      Calculated Total Entries
                    </span>
                    <span className="text-xl font-bold text-red-600">
                      {calculateTotal()}
                    </span>
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="totalEntries" className="text-xs text-slate-500">
                      Entered Total Entries (required)
                    </Label>
                    <Input
                      id="totalEntries"
                      type="text"
                      inputMode="numeric"
                      placeholder="Enter total"
                      value={newEntry.totalEntries}
                      onChange={(e) => handleNumberInput("totalEntries", e.target.value)}
                    />
                  </div>
                  <p className="mt-1 text-xs text-slate-500">
                    Grade1 + Grade2 + Grade3 + Grade4 must match entered total
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
                {schools.map((school) => (
                  <SelectItem key={school.code} value={school.code}>
                    {school.name}
                  </SelectItem>
                ))}
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
          <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Reg No</TableHead>
                <TableHead>Student Name</TableHead>
                <TableHead>Level</TableHead>
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
                  <TableCell className="font-mono text-xs">{entry.registrationNumber}</TableCell>
                  <TableCell className="font-semibold text-slate-900">
                    {entry.studentName}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">{entry.examLevel}</Badge>
                  </TableCell>
                  <TableCell>{entry.classLevel}</TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium text-slate-900">
                        {entry.subjectName}
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
                  <TableCell className="text-xs text-slate-500">Managed via state</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}


