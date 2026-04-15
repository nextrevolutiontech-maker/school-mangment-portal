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
import { Search, AlertCircle, UserPlus, Info } from "lucide-react";
import { toast } from "sonner";
import { Alert, AlertDescription } from "../ui/alert";
import { useAuth, CLASS_LEVELS } from "../auth-context";

interface StudentsEntriesProps {
  onPageChange: (page: string) => void;
}

export function StudentsEntries({ onPageChange }: StudentsEntriesProps) {
  const { user, schools, students, subjects, addStudentEntry } = useAuth();
  const isAdmin = user?.role === "admin";
  const scopedStudents =
    user?.role === "school"
      ? students.filter((entry) => entry.schoolCode === user.schoolCode)
      : students;
  const scopedSchools =
    user?.role === "school"
      ? schools.filter((school) => school.code === user.schoolCode)
      : schools;
  const [searchTerm, setSearchTerm] = useState("");
  const [schoolFilter, setSchoolFilter] = useState("all");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  const [newEntry, setNewEntry] = useState({
    examLevel: "UCE" as "UCE" | "UACE",
    studentName: "",
    classLevel: "S.1",
    schoolCode: user?.role === "school" ? user.schoolCode ?? "WAK26-0001" : "WAK26-0001",
    subjectCode: "",
    entry1: false,
    entry2: false,
    entry3: false,
    entry4: false,
  });

  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  const calculateTotal = () =>
    (newEntry.entry1 ? 1 : 0) +
    (newEntry.entry2 ? 1 : 0) +
    (newEntry.entry3 ? 1 : 0) +
    (newEntry.entry4 ? 1 : 0);

  const handlePaperToggle = (
    field: "entry1" | "entry2" | "entry3" | "entry4",
    checked: boolean,
  ) => {
    setNewEntry({
      ...newEntry,
      [field]: checked,
    });
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
      errors.push("At least one paper must be selected");
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
      examLevel: newEntry.examLevel,
      classLevel: newEntry.classLevel,
      subjectCode: newEntry.subjectCode,
      subjectName: subject?.name ?? "",
      entry1: newEntry.entry1 ? 1 : 0,
      entry2: newEntry.entry2 ? 1 : 0,
      entry3: newEntry.entry3 ? 1 : 0,
      entry4: newEntry.entry4 ? 1 : 0,
      totalEntries: total,
    });
    setIsAddDialogOpen(false);
    setNewEntry({
      examLevel: "UCE" as "UCE" | "UACE",
      studentName: "",
      classLevel: "S.1",
      schoolCode: user?.role === "school" ? user.schoolCode ?? "WAK26-0001" : "WAK26-0001",
      subjectCode: "",
      entry1: false,
      entry2: false,
      entry3: false,
      entry4: false,
    });
    setValidationErrors([]);

    toast.success("Student Entry Added", {
      description: `${newEntry.studentName} registered successfully`,
    });
  };

  const filteredEntries = scopedStudents.filter((entry) => {
    const matchesSearch =
      entry.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.subjectCode.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSchool =
      schoolFilter === "all" || entry.schoolCode === schoolFilter;

    return matchesSearch && matchesSchool;
  });

  const totalStudents = new Set(scopedStudents.map((entry) => entry.studentName)).size;
  const totalEntries = scopedStudents.reduce(
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

  const availableClassLevels = useMemo(
    () => CLASS_LEVELS[newEntry.examLevel],
    [newEntry.examLevel],
  );

  const selectedSubject = useMemo(
    () => subjects.find((s) => s.code === newEntry.subjectCode),
    [subjects, newEntry.subjectCode],
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
      value: scopedStudents.length,
      className: "border-l-blue-500",
      valueClass: "text-slate-900",
    },
    {
      label: "Schools",
      value: new Set(scopedStudents.map((entry) => entry.schoolCode)).size,
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
            <p className="mt-2 max-w-3xl text-sm text-slate-500">
              Subjects are pre-configured by the association admin. Schools do
              not type subjects manually; they only select from the approved
              subject list for the chosen exam level.
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
                Register a student for a subject and select which papers
                (1-4) the student is sitting for.
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
                    {availableClassLevels.map((level) => (
                      <SelectItem key={level} value={level}>
                        {level}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-slate-500">
                  Class levels are predetermined by WAKISSHA Admin
                </p>
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
                    {scopedSchools.map((school) => (
                      <SelectItem key={school.code} value={school.code}>
                        {school.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2 md:col-span-2">
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
                <p className="text-xs text-slate-500">
                  Standard subjects and subject codes are controlled by WAKISSHA admin.
                </p>
                
                {selectedSubject && (
                  <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 space-y-2">
                    <div className="flex items-center gap-2">
                      <Info className="h-4 w-4 text-blue-600" />
                      <span className="text-sm font-medium text-blue-900">Preview</span>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm">
                        <span className="font-semibold text-slate-900">{selectedSubject.name}</span>
                        <Badge variant="outline" className="ml-2">
                          {selectedSubject.code}
                        </Badge>
                      </p>
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-3 rounded-2xl bg-white shadow-sm border border-slate-200 p-4 md:col-span-2">
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-slate-900">
                    Subject Papers
                  </Label>
                  <p className="text-xs text-slate-500">
                    Select which papers the student will take for this subject (click to toggle)
                  </p>
                </div>
                
                <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                  {(["entry1", "entry2", "entry3", "entry4"] as const).map(
                    (field, index) => (
                      <label
                        key={field}
                        className="flex cursor-pointer items-center justify-between rounded-lg border-2 border-slate-200 bg-white px-3 py-2 transition-all hover:border-blue-400 hover:bg-blue-50"
                      >
                        <span className="text-sm font-medium text-slate-700">
                          Paper {index + 1}
                        </span>
                        <input
                          type="checkbox"
                          checked={newEntry[field]}
                          onChange={(e) => handlePaperToggle(field, e.target.checked)}
                          className="h-4 w-4 accent-blue-600 cursor-pointer"
                        />
                      </label>
                    ),
                  )}
                </div>

                <div className="rounded-lg bg-blue-50 border border-blue-200 px-4 py-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-slate-700">
                      Total Papers Selected
                    </span>
                    <Badge className="text-lg px-3 py-1">
                      {calculateTotal()}
                    </Badge>
                  </div>
                  <p className="text-xs text-slate-600">
                    Each student can take any combination of Paper 1, 2, 3, and 4.
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
            {isAdmin ? (
              <>
                <Select value={schoolFilter} onValueChange={setSchoolFilter}>
                  <SelectTrigger className="w-full lg:w-[240px]">
                    <SelectValue placeholder="Filter by school" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Schools</SelectItem>
                    {scopedSchools.map((school) => (
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
              </>
            ) : (
              <div className="w-full lg:w-[260px] rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-500">
                School:{" "}
                <span className="font-semibold text-slate-900">
                  {scopedSchools[0]?.name || user?.schoolCode}
                </span>
              </div>
            )}
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


