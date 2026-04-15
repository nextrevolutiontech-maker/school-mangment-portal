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
import { Checkbox } from "../ui/checkbox";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import { Badge } from "../ui/badge";
import { Search, UserPlus, AlertCircle, Info } from "lucide-react";
import { toast } from "sonner";
import { Alert, AlertDescription } from "../ui/alert";
import { useAuth, CLASS_LEVELS } from "../auth-context";
import type { StudentSubjectEntry } from "../auth-context";

interface StudentsEntriesProps {
  onPageChange: (page: string) => void;
}

export function StudentsEntries({ onPageChange }: StudentsEntriesProps) {
  const { user, schools, students, subjects, addStudentEntry } = useAuth();
  const isAdmin = user?.role === "admin";

  const scopedStudents = useMemo(() => {
    return user?.role === "school"
      ? students.filter((entry) => entry.schoolCode === user.schoolCode)
      : students;
  }, [students, user]);

  const scopedSchools = useMemo(() => {
    return user?.role === "school"
      ? schools.filter((school) => school.code === user.schoolCode)
      : schools;
  }, [schools, user]);

  const [searchTerm, setSearchTerm] = useState("");
  const [schoolFilter, setSchoolFilter] = useState("all");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  // Form state
  const [studentName, setStudentName] = useState("");
  const [classLevel, setClassLevel] = useState<"S.1" | "S.2" | "S.3" | "S.4" | "S.5" | "S.6">("S.1");
  const [schoolCode, setSchoolCode] = useState(user?.role === "school" ? user.schoolCode ?? "WAK26-0001" : "WAK26-0001");
  const [selectedSubjects, setSelectedSubjects] = useState<{
    [subjectId: string]: {
      entry1: boolean;
      entry2: boolean;
      entry3: boolean;
      entry4: boolean;
      paper: "Paper 1" | "Paper 2" | "Paper 3" | "Paper 4";
    };
  }>({});

  // Determine exam level from class level
  const examLevel: "UCE" | "UACE" =
    ["S.1", "S.2", "S.3", "S.4"].includes(classLevel) ? "UCE" : "UACE";

  // Filter subjects by exam level
  const filteredSubjects = useMemo(() => {
    return subjects.filter(
      (subject) =>
        subject.educationLevel === examLevel || subject.educationLevel === "BOTH"
    );
  }, [subjects, examLevel]);

  // Calculate total entries
  const calculateTotalEntries = () => {
    let total = 0;
    Object.values(selectedSubjects).forEach((subject) => {
      if (subject.entry1) total++;
      if (subject.entry2) total++;
      if (subject.entry3) total++;
      if (subject.entry4) total++;
    });
    return total;
  };

  // Toggle subject entry
  const toggleEntry = (
    subjectId: string,
    entryNum: "entry1" | "entry2" | "entry3" | "entry4"
  ) => {
    setSelectedSubjects((prev) => ({
      ...prev,
      [subjectId]: {
        ...prev[subjectId],
        [entryNum]: !prev[subjectId]?.[entryNum],
      },
    }));
  };

  // Toggle subject selection
  const toggleSubject = (subjectId: string) => {
    setSelectedSubjects((prev) => {
      if (prev[subjectId]) {
        // Remove subject
        const newState = { ...prev };
        delete newState[subjectId];
        return newState;
      } else {
        // Add subject with all entries unchecked
        return {
          ...prev,
          [subjectId]: {
            entry1: false,
            entry2: false,
            entry3: false,
            entry4: false,
            paper: "Paper 1",
          },
        };
      }
    });
  };

  // Handle form submission
  const handleAddStudent = () => {
    const errors: string[] = [];

    if (!studentName.trim()) errors.push("Student name is required");
    if (Object.keys(selectedSubjects).length === 0) {
      errors.push("At least one subject must be selected");
    }

    const totalEntries = calculateTotalEntries();
    if (totalEntries === 0) {
      errors.push("At least one entry must be checked");
    }

    if (errors.length > 0) {
      setValidationErrors(errors);
      return;
    }

    // Build subjects array
    const subjectsArray: StudentSubjectEntry[] = Object.entries(
      selectedSubjects
    ).map(([subjectId, entries]) => {
      const subject = subjects.find((s) => s.id === subjectId);
      return {
        subjectId,
        subjectCode: subject?.code || "",
        subjectName: subject?.name || "",
        paper: entries.paper,
        entry1: entries.entry1,
        entry2: entries.entry2,
        entry3: entries.entry3,
        entry4: entries.entry4,
      };
    });

    addStudentEntry({
      schoolCode,
      studentName,
      classLevel,
      subjects: subjectsArray,
      totalEntries,
    });

    toast.success("Student registered successfully", {
      description: `${studentName} has been added to the system.`,
    });

    // Reset form
    setStudentName("");
    setClassLevel("S.1");
    setSelectedSubjects({});
    setValidationErrors([]);
    setIsAddDialogOpen(false);
  };

  // Filtered and searched students
  const filteredStudents = useMemo(() => {
    return scopedStudents.filter((student) => {
      const matchesSearch =
        student.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.registrationNumber.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesSchool =
        schoolFilter === "all" || student.schoolCode === schoolFilter;
      return matchesSearch && matchesSchool;
    });
  }, [scopedStudents, searchTerm, schoolFilter]);

  return (
    <div className="flex flex-col w-full gap-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-2">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-red-500">
            Student Registration
          </p>
          <h1 className="text-3xl font-bold text-slate-900">Student Entries</h1>
          <p className="max-w-3xl text-slate-500">
            Register students, select exam level, choose subjects, and specify
            entry numbers for the examination session.
          </p>
        </div>

        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="w-full lg:w-auto">
              <UserPlus className="h-4 w-4" />
              Add Student
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>Register New Student</DialogTitle>
              <DialogDescription>
                Add a new student, select their class level, choose subjects, and specify entry numbers.
              </DialogDescription>
            </DialogHeader>

            {validationErrors.length > 0 && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <ul className="list-disc list-inside mt-2 space-y-1">
                    {validationErrors.map((error, i) => (
                      <li key={i}>{error}</li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}

            <div className="grid gap-4 md:grid-cols-2">
              {/* Student Name */}
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="student-name">Student Name *</Label>
                <Input
                  id="student-name"
                  placeholder="Enter student's full name"
                  value={studentName}
                  onChange={(e) => setStudentName(e.target.value)}
                />
              </div>

              {/* Class Level */}
              <div className="space-y-2">
                <Label htmlFor="class-level">Class Level *</Label>
                <Select value={classLevel} onValueChange={(value: any) => setClassLevel(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {["S.1", "S.2", "S.3", "S.4", "S.5", "S.6"].map((level) => (
                      <SelectItem key={level} value={level}>
                        {level} {["S.1", "S.2", "S.3", "S.4"].includes(level) ? "(UCE)" : "(UACE)"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Exam Level (Auto) */}
              <div className="space-y-2">
                <Label>Exam Level</Label>
                <div className="flex items-center gap-2 px-3 py-2 border border-slate-200 rounded-lg bg-slate-50">
                  <Badge variant={examLevel === "UCE" ? "secondary" : "default"}>
                    {examLevel}
                  </Badge>
                </div>
              </div>

              {/* School Selection */}
              {isAdmin && (
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="school">School *</Label>
                  <Select value={schoolCode} onValueChange={setSchoolCode}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {scopedSchools.map((school) => (
                        <SelectItem key={school.code} value={school.code}>
                          {school.name} ({school.code})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Subject Selection */}
              <div className="space-y-3 md:col-span-2">
                <Label>Select Subjects *</Label>
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    Check subjects to select them. Then mark Entry 1-4 for how many students take each subject.
                  </AlertDescription>
                </Alert>
              </div>

              {/* Subject List with Entry Checkboxes */}
              <div className="md:col-span-2 space-y-3 max-h-96 overflow-y-auto border border-slate-200 rounded-lg p-4">
                {filteredSubjects.length === 0 ? (
                  <p className="text-sm text-slate-500">No subjects available for {examLevel}</p>
                ) : (
                  filteredSubjects.map((subject) => (
                    <div key={subject.id} className="border-b pb-3 last:border-b-0">
                      <div className="flex items-start gap-3 mb-2">
                        <Checkbox
                          id={subject.id}
                          checked={!!selectedSubjects[subject.id]}
                          onCheckedChange={() => toggleSubject(subject.id)}
                          className="mt-1"
                        />
                        <div className="flex-1">
                          <Label htmlFor={subject.id} className="font-semibold cursor-pointer">
                            {subject.name}
                          </Label>
                          <p className="text-xs text-slate-500">{subject.code}</p>
                        </div>
                        {subject.optional && (
                          <Badge variant="outline" className="text-xs">
                            Optional
                          </Badge>
                        )}
                      </div>

                      {/* Entry Checkboxes (shown only if subject is selected) */}
                      {selectedSubjects[subject.id] && (
                        <div className="ml-6 pl-3 border-l-2 border-slate-200 space-y-2">
                          <div className="grid grid-cols-4 gap-2">
                            {(["entry1", "entry2", "entry3", "entry4"] as const).map((entry) => (
                              <div key={entry} className="flex items-center gap-2">
                                <Checkbox
                                  id={`${subject.id}-${entry}`}
                                  checked={selectedSubjects[subject.id]?.[entry] || false}
                                  onCheckedChange={() => toggleEntry(subject.id, entry)}
                                />
                                <Label
                                  htmlFor={`${subject.id}-${entry}`}
                                  className="text-xs cursor-pointer"
                                >
                                  {entry.replace("entry", "Entry ")}
                                </Label>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>

              {/* Total Entries Display */}
              <div className="md:col-span-2">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p className="text-sm text-slate-600">
                    Total Entries: <span className="font-bold text-blue-600">{calculateTotalEntries()}</span>
                  </p>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddStudent}>Register Student</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Students Table */}
      <Card>
        <CardHeader className="border-b border-slate-200">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <CardTitle className="text-slate-900">Registered Students</CardTitle>
              <CardDescription className="text-slate-500">
                {filteredStudents.length} student{filteredStudents.length !== 1 ? "s" : ""} found
              </CardDescription>
            </div>
            <div className="flex flex-col gap-2 lg:flex-row">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  placeholder="Search by name or registration..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              {isAdmin && scopedSchools.length > 1 && (
                <Select value={schoolFilter} onValueChange={setSchoolFilter}>
                  <SelectTrigger className="w-full lg:w-[200px]">
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
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          {filteredStudents.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-slate-500">No students registered yet</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Registration Number</TableHead>
                    <TableHead>Student Name</TableHead>
                    <TableHead>Class</TableHead>
                    <TableHead>Exam Level</TableHead>
                    <TableHead>Subjects</TableHead>
                    <TableHead>Total Entries</TableHead>
                    <TableHead>School</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredStudents.map((student) => (
                    <TableRow key={student.id}>
                      <TableCell className="font-mono text-sm text-slate-900">
                        {student.registrationNumber}
                      </TableCell>
                      <TableCell className="font-semibold text-slate-900">
                        {student.studentName}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{student.classLevel}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={student.examLevel === "UCE" ? "secondary" : "default"}>
                          {student.examLevel}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">
                        {student.subjects.length} subject{student.subjects.length !== 1 ? "s" : ""}
                      </TableCell>
                      <TableCell className="font-semibold text-slate-900">
                        {student.totalEntries}
                      </TableCell>
                      <TableCell className="text-sm text-slate-600">
                        {student.schoolName}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
