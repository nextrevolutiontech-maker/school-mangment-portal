import { useMemo, useState, useEffect } from "react";
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
import { Search, UserPlus, AlertCircle, Info, Edit2, Trash2, MoreVertical, Eye } from "lucide-react";
import { toast } from "sonner";
import { Alert, AlertDescription } from "../ui/alert";
import { useAuth, CLASS_LEVELS_ARRAY } from "../auth-context";
import type { StudentSubjectEntry } from "../auth-context";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";

interface StudentsEntriesProps {
  onPageChange: (page: string) => void;
  autoOpenAddDialog?: boolean;
}

export function StudentsEntries({ onPageChange, autoOpenAddDialog = false }: StudentsEntriesProps) {
  const { user, schools, students, subjects, addStudentEntry, updateStudentEntry, deleteStudentEntry } = useAuth();
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
  const [levelFilter, setLevelFilter] = useState<"all" | "UCE" | "UACE">("all");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(autoOpenAddDialog);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  // View Student Modal
  const [viewingStudent, setViewingStudent] = useState<typeof students[0] | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);

  // Edit Student Modal
  const [editingStudent, setEditingStudent] = useState<typeof students[0] | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editStudentName, setEditStudentName] = useState("");
  const [editClassLevel, setEditClassLevel] = useState<"S.1" | "S.2" | "S.3" | "S.4" | "S.5" | "S.6">("S.1");
  const [editStream, setEditStream] = useState("");
  const [editSelectedSubjects, setEditSelectedSubjects] = useState<{
    [subjectId: string]: {
      paper: "Paper 1" | "Paper 2" | "Paper 3" | "Paper 4";
    };
  }>({});

  // Delete Confirmation
  const [deletingStudent, setDeletingStudent] = useState<typeof students[0] | null>(null);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);

  // Auto-open add dialog when navigating from sidebar
  useEffect(() => {
    if (autoOpenAddDialog) {
      setIsAddDialogOpen(true);
    }
  }, [autoOpenAddDialog]);

  // Form state
  const [studentName, setStudentName] = useState("");
  const [classLevel, setClassLevel] = useState<"S.1" | "S.2" | "S.3" | "S.4" | "S.5" | "S.6">("S.1");
  const [stream, setStream] = useState("");
  const [schoolCode, setSchoolCode] = useState(user?.role === "school" ? user.schoolCode ?? "WAK26-0001" : "WAK26-0001");
  const [selectedSubjects, setSelectedSubjects] = useState<{
    [subjectId: string]: {
      paper: "Paper 1" | "Paper 2" | "Paper 3" | "Paper 4";
    };
  }>({});

  // Determine exam level from class level
  const examLevel: "UCE" | "UACE" =
    ["S.1", "S.2", "S.3", "S.4"].includes(classLevel) ? "UCE" : "UACE";

  // Filter subjects by exam level
  const filteredSubjects = useMemo(() => {
    return subjects.filter(
      (subject) => subject.educationLevel === examLevel
    );
  }, [subjects, examLevel]);

  // Filter subjects by exam level for edit modal
  const filteredSubjectsForEdit = useMemo(() => {
    const editExamLevel = editClassLevel === "S.1" || editClassLevel === "S.2" || editClassLevel === "S.3" || editClassLevel === "S.4" ? "UCE" : "UACE";
    return subjects.filter(
      (subject) => subject.educationLevel === editExamLevel
    );
  }, [subjects, editClassLevel]);

  // Calculate total entries - one entry per subject selected
  const calculateTotalEntries = () => {
    return Object.keys(selectedSubjects).length;
  };

  // Update paper selection for a subject
  const setPaper = (
    subjectId: string,
    paper: "Paper 1" | "Paper 2" | "Paper 3" | "Paper 4"
  ) => {
    setSelectedSubjects((prev) => ({
      ...prev,
      [subjectId]: {
        paper,
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
        // Add subject with Paper 1 as default
        return {
          ...prev,
          [subjectId]: {
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

    if (errors.length > 0) {
      setValidationErrors(errors);
      return;
    }

    // Build subjects array with correct structure
    const subjectsArray: StudentSubjectEntry[] = Object.entries(
      selectedSubjects
    ).map(([subjectId, data]) => {
      const subject = subjects.find((s) => s.id === subjectId);
      return {
        subjectId,
        subjectCode: subject?.code || "",
        subjectName: subject?.name || "",
        paper: data.paper,
        entry1: false,
        entry2: false,
        entry3: false,
        entry4: false,
      };
    });

    const totalEntries = calculateTotalEntries();

    addStudentEntry({
      schoolCode,
      studentName,
      classLevel,
      stream,
      subjects: subjectsArray,
      totalEntries,
    });

    toast.success("Student registered successfully", {
      description: `${studentName} has been added to the system.`,
    });

    // Reset form
    setStudentName("");
    setClassLevel("S.1");
    setStream("");
    setSelectedSubjects({});
    setValidationErrors([]);
    setIsAddDialogOpen(false);
  };

  // Handle View Student
  const handleViewStudent = (student: typeof students[0]) => {
    setViewingStudent(student);
    setIsViewModalOpen(true);
  };

  // Handle Edit Student - Open Modal
  const handleEditStudent = (student: typeof students[0]) => {
    setEditingStudent(student);
    setEditStudentName(student.studentName);
    setEditClassLevel(student.classLevel);
    setEditStream(student.stream || "");
    
    // Convert subjects to edit format
    const editSubjects: typeof editSelectedSubjects = {};
    student.subjects.forEach((subj) => {
      const subjectId = subjects.find(
        (s) =>
          s.code === subj.subjectCode &&
          s.educationLevel === student.examLevel,
      )?.id;
      if (subjectId) {
        editSubjects[subjectId] = {
          paper: subj.paper as "Paper 1" | "Paper 2" | "Paper 3" | "Paper 4",
        };
      }
    });
    setEditSelectedSubjects(editSubjects);
    setIsEditModalOpen(true);
  };

  // Handle Save Edit
  const handleSaveEdit = () => {
    if (!editingStudent) return;

    const errors: string[] = [];
    if (!editStudentName.trim()) errors.push("Student name is required");
    if (Object.keys(editSelectedSubjects).length === 0) {
      errors.push("At least one subject must be selected");
    }

    if (errors.length > 0) {
      setValidationErrors(errors);
      return;
    }

    const subjectsArray: StudentSubjectEntry[] = Object.entries(
      editSelectedSubjects
    ).map(([subjectId, data]) => {
      const subject = subjects.find((s) => s.id === subjectId);
      return {
        subjectId,
        subjectCode: subject?.code || "",
        subjectName: subject?.name || "",
        paper: data.paper,
        entry1: false,
        entry2: false,
        entry3: false,
        entry4: false,
      };
    });

    updateStudentEntry(editingStudent.id, {
      studentName: editStudentName,
      classLevel: editClassLevel,
      stream: editStream,
      subjects: subjectsArray,
      totalEntries: subjectsArray.length,
    });

    toast.success("Student updated successfully", {
      description: `${editStudentName} has been updated.`,
    });

    setIsEditModalOpen(false);
    setEditingStudent(null);
    setValidationErrors([]);
  };

  // Handle Delete Student - Show Confirmation
  const handleDeleteStudent = (student: typeof students[0]) => {
    setDeletingStudent(student);
    setIsDeleteConfirmOpen(true);
  };

  // Handle Confirm Delete
  const handleConfirmDelete = () => {
    if (!deletingStudent) return;

    deleteStudentEntry(deletingStudent.id);

    toast.success("Student deleted successfully", {
      description: `${deletingStudent.studentName} has been removed.`,
    });

    setIsDeleteConfirmOpen(false);
    setDeletingStudent(null);
  };

  // Filtered and searched students
  const filteredStudents = useMemo(() => {
    return scopedStudents.filter((student) => {
      const matchesSearch =
        student.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.registrationNumber.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesSchool =
        schoolFilter === "all" || student.schoolCode === schoolFilter;
      const matchesLevel =
        levelFilter === "all" || student.examLevel === levelFilter;
      return matchesSearch && matchesSchool && matchesLevel;
    });
  }, [scopedStudents, searchTerm, schoolFilter, levelFilter]);

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

              {/* Stream (for internal use) */}
              <div className="space-y-2">
                <Label htmlFor="stream">Stream (Optional)</Label>
                <Input
                  id="stream"
                  placeholder="e.g., A, B, C (internal use only)"
                  value={stream}
                  onChange={(e) => setStream(e.target.value)}
                />
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
                <Label>Select Subjects & Papers *</Label>
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    Check subjects to select them. Then choose which paper (1, 2, 3, or 4) the student will take for each subject.
                  </AlertDescription>
                </Alert>
              </div>

              {/* Subject List with Paper Selection */}
              <div className="md:col-span-2 space-y-3 max-h-96 overflow-y-auto border border-slate-200 rounded-lg p-4">
                {filteredSubjects.length === 0 ? (
                  <p className="text-sm text-slate-500">No subjects available for {examLevel}</p>
                ) : (
                  filteredSubjects.map((subject) => (
                    <div key={subject.id} className="border-b pb-3 last:border-b-0">
                      <div className="flex items-start gap-3 mb-3">
                        <Checkbox
                          id={subject.id}
                          checked={!!selectedSubjects[subject.id]}
                          onCheckedChange={() => toggleSubject(subject.id)}
                          className="mt-1"
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs font-mono font-bold text-black">{subject.code}</span>
                            {selectedSubjects[subject.id] && (
                              <span className="text-xs font-semibold text-blue-600">/{selectedSubjects[subject.id].paper.split(" ")[1]}</span>
                            )}
                            <Label htmlFor={subject.id} className="font-semibold cursor-pointer text-amber-600">
                              {subject.name}
                            </Label>
                          </div>
                          <p className="text-xs text-slate-500 mt-1">
                            {subject.optional ? "Optional" : "Required"}
                          </p>
                        </div>
                        {subject.optional && (
                          <Badge variant="outline" className="text-xs">
                            Optional
                          </Badge>
                        )}
                      </div>

                      {/* Paper Selection (shown only if subject is selected) */}
                      {selectedSubjects[subject.id] && (
                        <div className="ml-6 pl-3 border-l-2 border-slate-200">
                          <Label className="text-xs font-semibold text-slate-600 mb-2 block">
                            Select Paper:
                          </Label>
                          <Select 
                            value={selectedSubjects[subject.id]?.paper || "Paper 1"} 
                            onValueChange={(value: any) => setPaper(subject.id, value)}
                          >
                            <SelectTrigger className="w-full">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Paper 1">Paper 1</SelectItem>
                              <SelectItem value="Paper 2">Paper 2</SelectItem>
                              <SelectItem value="Paper 3">Paper 3</SelectItem>
                              <SelectItem value="Paper 4">Paper 4</SelectItem>
                            </SelectContent>
                          </Select>
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
                    Subjects Selected: <span className="font-bold text-blue-600">{calculateTotalEntries()}</span>
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
              <div className="flex gap-4 mt-2">
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase">School</p>
                  <p className="text-sm font-semibold text-slate-900">{scopedSchools[0]?.name || "N/A"}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase">Total Registered</p>
                  <p className="text-sm font-semibold text-slate-900">{filteredStudents.length}</p>
                </div>
              </div>
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
              <Select value={levelFilter} onValueChange={(value: any) => setLevelFilter(value)}>
                <SelectTrigger className="w-full lg:w-[150px]">
                  <SelectValue placeholder="Filter by level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Levels</SelectItem>
                  <SelectItem value="UCE">UCE</SelectItem>
                  <SelectItem value="UACE">UACE</SelectItem>
                </SelectContent>
              </Select>
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
                    <TableHead>Actions</TableHead>
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
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleViewStudent(student)}
                            title="View student details"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                title="Edit or delete student"
                              >
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleEditStudent(student)}>
                                <Edit2 className="h-4 w-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleDeleteStudent(student)} className="text-red-600">
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* View Student Modal */}
      <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Student Details</DialogTitle>
            <DialogDescription>
              View complete information for {viewingStudent?.studentName}
            </DialogDescription>
          </DialogHeader>
          {viewingStudent && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase">Registration Number</p>
                  <p className="text-sm font-medium text-slate-900">{viewingStudent.registrationNumber}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase">Student Name</p>
                  <p className="text-sm font-medium text-slate-900">{viewingStudent.studentName}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase">Class Level</p>
                  <p className="text-sm font-medium text-slate-900">{viewingStudent.classLevel}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase">Exam Level</p>
                  <Badge variant={viewingStudent.examLevel === "UCE" ? "default" : "secondary"}>
                    {viewingStudent.examLevel}
                  </Badge>
                </div>
                {viewingStudent.stream && (
                  <div className="col-span-2">
                    <p className="text-xs font-semibold text-slate-500 uppercase">Stream</p>
                    <p className="text-sm font-medium text-slate-900">{viewingStudent.stream}</p>
                  </div>
                )}
              </div>

              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase mb-3">Subjects ({viewingStudent.subjects.length})</p>
                <div className="space-y-2 bg-slate-50 p-3 rounded-lg border">
                  {viewingStudent.subjects.map((subject) => (
                    <div key={subject.subjectId} className="flex items-center justify-between p-2 bg-white rounded border border-slate-200">
                      <div className="flex-1">
                        <p className="text-xs font-mono font-bold text-black">{subject.subjectCode}</p>
                        <p className="text-sm font-medium text-slate-900">{subject.subjectName}</p>
                      </div>
                      <Badge variant="outline" className="text-blue-600 border-blue-200">
                        {subject.paper}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase">Total Entries</p>
                <p className="text-sm font-medium text-slate-900">{viewingStudent.totalEntries}</p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsViewModalOpen(false)}>
              Close
            </Button>
            <Button onClick={() => {
              setIsViewModalOpen(false);
              handleEditStudent(viewingStudent!);
            }}>
              Edit Student
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Student Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Student</DialogTitle>
            <DialogDescription>
              Update information for {editingStudent?.studentName}
            </DialogDescription>
          </DialogHeader>
          
          {validationErrors.length > 0 && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <ul className="list-disc list-inside">
                  {validationErrors.map((error, idx) => (
                    <li key={idx}>{error}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          <div className="space-y-4">
            {/* Student Name */}
            <div>
              <Label htmlFor="edit-student-name" className="font-semibold">
                Student Name
              </Label>
              <Input
                id="edit-student-name"
                value={editStudentName}
                onChange={(e) => setEditStudentName(e.target.value)}
                placeholder="Enter student name"
              />
            </div>

            {/* Class Level */}
            <div>
              <Label className="font-semibold">Class Level</Label>
              <Select value={editClassLevel} onValueChange={(value: any) => setEditClassLevel(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CLASS_LEVELS_ARRAY.map((level) => (
                    <SelectItem key={level} value={level}>
                      {level}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Stream */}
            <div>
              <Label htmlFor="edit-stream" className="font-semibold">
                Stream (Optional)
              </Label>
              <Input
                id="edit-stream"
                value={editStream}
                onChange={(e) => setEditStream(e.target.value)}
                placeholder="e.g., Science, Arts"
              />
            </div>

            {/* Subjects Selection */}
            <div>
              <Label className="font-semibold mb-3 block">Select Subjects</Label>
              <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                {filteredSubjectsForEdit.map((subject) => (
                  <div key={subject.id} className="border border-slate-200 rounded-lg p-3">
                    <div className="flex items-start gap-3">
                      <Checkbox
                        id={`edit-${subject.id}`}
                        checked={!!editSelectedSubjects[subject.id]}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setEditSelectedSubjects((prev) => ({
                              ...prev,
                              [subject.id]: { paper: "Paper 1" },
                            }));
                          } else {
                            setEditSelectedSubjects((prev) => {
                              const updated = { ...prev };
                              delete updated[subject.id];
                              return updated;
                            });
                          }
                        }}
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono font-bold text-black">
                            {subject.code}
                          </span>
                          <span className="text-xs font-semibold text-blue-600">/
                            {editSelectedSubjects[subject.id]?.paper.split(" ")[1]}
                          </span>
                          <Label htmlFor={`edit-${subject.id}`} className="font-semibold cursor-pointer text-amber-600">
                            {subject.name}
                          </Label>
                        </div>
                        <p className="text-xs text-slate-500 mt-1">
                          {subject.optional ? "Optional" : "Required"}
                        </p>
                      </div>
                      {subject.optional && (
                        <Badge variant="outline" className="text-xs">
                          Optional
                        </Badge>
                      )}
                    </div>

                    {/* Paper Selection */}
                    {editSelectedSubjects[subject.id] && (
                      <div className="ml-6 pl-3 border-l-2 border-slate-200 mt-2">
                        <Label className="text-xs font-semibold text-slate-600 mb-2 block">
                          Select Paper:
                        </Label>
                        <Select 
                          value={editSelectedSubjects[subject.id]?.paper || "Paper 1"} 
                          onValueChange={(value: any) => {
                            setEditSelectedSubjects((prev) => ({
                              ...prev,
                              [subject.id]: { paper: value },
                            }));
                          }}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {[1, 2, 3, 4].map((paper) => (
                              <SelectItem key={paper} value={`Paper ${paper}`}>
                                Paper {paper}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setIsEditModalOpen(false);
              setValidationErrors([]);
            }}>
              Cancel
            </Button>
            <Button onClick={handleSaveEdit}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteConfirmOpen} onOpenChange={setIsDeleteConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Student</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {deletingStudent?.studentName}?
            </DialogDescription>
          </DialogHeader>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              This action cannot be undone. The student record will be permanently removed from the system.
            </AlertDescription>
          </Alert>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteConfirmOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleConfirmDelete}>
              Delete Student
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
