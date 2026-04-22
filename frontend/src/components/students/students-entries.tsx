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
import { useAuth, CLASS_LEVELS, CLASS_LEVELS_ARRAY } from "../auth-context";
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

type PaperOption = 1 | 2 | 3 | 4;

const PAPER_OPTIONS: PaperOption[] = [1, 2, 3, 4];

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
      selectedPapers: PaperOption[];
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
  const [registrationLevel, setRegistrationLevel] = useState<"UCE" | "UACE">("UCE");
  const [classLevel, setClassLevel] = useState<"S.1" | "S.2" | "S.3" | "S.4" | "S.5" | "S.6">("S.1");
  const [stream, setStream] = useState("");
  const [schoolCode, setSchoolCode] = useState(user?.role === "school" ? user.schoolCode ?? "WAK26-0001" : "WAK26-0001");
  const [selectedSubjects, setSelectedSubjects] = useState<{
    [subjectId: string]: {
      selectedPapers: PaperOption[];
    };
  }>({});

  const availableClassLevels = registrationLevel === "UCE" ? CLASS_LEVELS.UCE : CLASS_LEVELS.UACE;

  // Filter subjects by selected level
  const filteredSubjects = useMemo(() => {
    return subjects.filter(
      (subject) => subject.educationLevel === registrationLevel
    );
  }, [subjects, registrationLevel]);

  // Filter subjects by exam level for edit modal
  const filteredSubjectsForEdit = useMemo(() => {
    const editExamLevel = editClassLevel === "S.1" || editClassLevel === "S.2" || editClassLevel === "S.3" || editClassLevel === "S.4" ? "UCE" : "UACE";
    return subjects.filter(
      (subject) => subject.educationLevel === editExamLevel
    );
  }, [subjects, editClassLevel]);

  useEffect(() => {
    setClassLevel((current) => {
      if (availableClassLevels.includes(current as any)) {
        return current;
      }
      return availableClassLevels[0];
    });
    setSelectedSubjects({});
  }, [registrationLevel]);

  // Calculate total entries - one entry per selected paper
  const calculateTotalEntries = () => {
    return Object.values(selectedSubjects).reduce((sum, item) => sum + item.selectedPapers.length, 0);
  };

  const togglePaperForSubject = (
    subjectId: string,
    paper: PaperOption,
    checked: boolean,
  ) => {
    setSelectedSubjects((prev) => {
      if (!prev[subjectId]) return prev;
      const currentPapers = prev[subjectId].selectedPapers;
      const nextPapers = checked
        ? Array.from(new Set([...currentPapers, paper]))
        : currentPapers.filter((item) => item !== paper);

      if (nextPapers.length === 0) {
        const updated = { ...prev };
        delete updated[subjectId];
        return updated;
      }

      return {
        ...prev,
        [subjectId]: { selectedPapers: nextPapers },
      };
    });
  };

  // Toggle subject selection
  const toggleSubject = (subjectId: string) => {
    const subject = subjects.find((s) => s.id === subjectId);
    if (!subject) return;

    setSelectedSubjects((prev) => {
      if (prev[subjectId]) {
        // Remove subject (unless it's compulsory)
        if (!subject.optional) return prev;
        const newState = { ...prev };
        delete newState[subjectId];
        return newState;
      } else {
        // Add subject with auto-applied paper rules
        let autoPapers: PaperOption[] = [1, 2]; // Default: Paper 1 & 2

        // Apply EXACT rules from prompt
        if (subject.code === "GP" || subject.standardCode === "101") {
          autoPapers = [1]; // General Paper -> Only Paper 1
        } else if (subject.code === "MATH" || subject.standardCode === "456" || subject.standardCode === "475") {
          autoPapers = [1]; // Mathematics -> Only Paper 1
        } else if (subject.code === "PHY" || subject.code === "CHEM" || subject.standardCode === "535" || subject.standardCode === "545") {
          autoPapers = [1, 2]; // Physics & Chemistry -> Paper 1 & 2 auto
        } else if (subject.code === "TD" || subject.standardCode === "680" || subject.standardCode === "745") {
          autoPapers = [1, 2, 3]; // Technical Drawing / Design -> Paper 1, 2, 3
        } else if (subject.code === "GEOG" || subject.standardCode === "273" || subject.standardCode === "230") {
          autoPapers = [1]; // Geography -> Only Paper 1
        } else if (subject.code === "SUB_MATHS" || subject.standardCode === "475S") {
          autoPapers = [1]; // Subsidiary Mathematics -> Only Paper 1
        } else if (subject.code === "SUB_ICT" || subject.standardCode === "610" || subject.standardCode === "840") {
          autoPapers = [1, 2]; // Subsidiary ICT -> P1 compulsory, default P2
        } else if (subject.code === "CHINESE" || subject.standardCode === "396") {
          autoPapers = [1, 2]; // Chinese -> Paper 1 & 2
        } else if (subject.code === "ATESO" || subject.standardCode === "365") {
          autoPapers = [1, 2]; // Ateso -> Paper 1 & 2
        }

        return {
          ...prev,
          [subjectId]: {
            selectedPapers: autoPapers,
          },
        };
      }
    });
  };

  // Pre-select compulsory subjects on level change
  useEffect(() => {
    const compulsory = subjects
      .filter((s) => s.educationLevel === registrationLevel && !s.optional)
      .reduce((acc, subj) => {
        let papers: PaperOption[] = [1, 2];
        if (subj.code === "GP" || subj.standardCode === "101") papers = [1];
        if (subj.code === "MATH" || subj.standardCode === "456" || subj.standardCode === "475") papers = [1];
        if (subj.code === "GEOG" || subj.standardCode === "273" || subj.standardCode === "230") papers = [1];
        if (subj.code === "ENG" || subj.standardCode === "112") papers = [1, 2];
        if (subj.code === "TD" || subj.standardCode === "680" || subj.standardCode === "745") papers = [1, 2, 3];
        
        acc[subj.id] = { selectedPapers: papers };
        return acc;
      }, {} as any);
    
    setSelectedSubjects(compulsory);
  }, [registrationLevel, subjects]);

  // Handle form submission
  const handleAddStudent = () => {
    const errors: string[] = [];

    if (!studentName.trim()) errors.push("Student name is required");
    
    const selectedSubjectIds = Object.keys(selectedSubjects);
    if (selectedSubjectIds.length === 0) {
      errors.push("At least one subject must be selected");
    }

    // UCE RULES: Max subjects = 9
    if (registrationLevel === "UCE" && selectedSubjectIds.length > 9) {
      errors.push("UCE students can register for a maximum of 9 subjects");
    }

    // UACE RULES
    if (registrationLevel === "UACE") {
      const selectedSubjectCodes = selectedSubjectIds.map(id => subjects.find(s => s.id === id)?.code);
      
      // General Paper = compulsory
      if (!selectedSubjectCodes.includes("GP")) {
        errors.push("General Paper (GP) is compulsory for UACE students");
      }

      // Must select Either Sub Math OR Sub ICT
      const hasSubMath = selectedSubjectCodes.includes("SUB_MATHS");
      const hasSubIct = selectedSubjectCodes.includes("SUB_ICT");
      if (!hasSubMath && !hasSubIct) {
        errors.push("UACE students must select either Subsidiary Mathematics or Subsidiary ICT");
      }
      if (hasSubMath && hasSubIct) {
        errors.push("UACE students cannot take both Subsidiary Mathematics and Subsidiary ICT");
      }
    }

    if (errors.length > 0) {
      setValidationErrors(errors);
      return;
    }

    // Persist one entry per selected subject paper for compatibility with reporting/export flows.
    const subjectsArray: StudentSubjectEntry[] = Object.entries(selectedSubjects).flatMap(
      ([subjectId, data]) => {
        const subject = subjects.find((s) => s.id === subjectId);
        return data.selectedPapers.map((paper) => ({
          subjectId,
          subjectCode: subject?.code || "",
          subjectStandardCode: subject?.standardCode || "",
          subjectName: subject?.name || "",
          paper: `Paper ${paper}` as "Paper 1" | "Paper 2" | "Paper 3" | "Paper 4",
          entry1: false,
          entry2: false,
          entry3: false,
          entry4: false,
        }));
      },
    );

    const totalEntries = subjectsArray.length;

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
    setRegistrationLevel("UCE");
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
        const existingPapers = editSubjects[subjectId]?.papers ?? [];
        const paper = Number(subj.paper.split(" ")[1]) as PaperOption;
        editSubjects[subjectId] = {
          selectedPapers: existingPapers.includes(paper)
            ? existingPapers
            : [...existingPapers, paper],
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

    const subjectsArray: StudentSubjectEntry[] = Object.entries(editSelectedSubjects).flatMap(
      ([subjectId, data]) => {
        const subject = subjects.find((s) => s.id === subjectId);
        return data.selectedPapers.map((paper) => ({
          subjectId,
          subjectCode: subject?.code || "",
          subjectStandardCode: subject?.standardCode || "",
          subjectName: subject?.name || "",
          paper: `Paper ${paper}` as "Paper 1" | "Paper 2" | "Paper 3" | "Paper 4",
          entry1: false,
          entry2: false,
          entry3: false,
          entry4: false,
        }));
      },
    );

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
    return scopedStudents
      .filter((student) => {
        const matchesSearch =
          student.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          student.registrationNumber.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesSchool = schoolFilter === "all" || student.schoolCode === schoolFilter;
        const matchesLevel = levelFilter === "all" || student.examLevel === levelFilter;
        return matchesSearch && matchesSchool && matchesLevel;
      })
      .map((student, idx) => {
        // Format: WAK/26-0001/001
        const codePart = student.schoolCode?.split("-")[1] || "0000";
        const serial = String(idx + 1).padStart(3, "0");
        
        // MASKING LOGIC:
        // Admin always sees full number.
        // Schools only see full number if status is 'active' OR they have an activationCode.
        const isMasked = user?.role === "school" && 
                        user.status !== "active" && 
                        !user.activationCode;
        
        const formattedRegNo = isMasked 
          ? `WAK/26-${codePart}/XXX`
          : `WAK/26-${codePart}/${serial}`;
          
        return { ...student, registrationNumber: formattedRegNo };
      });
  }, [scopedStudents, searchTerm, schoolFilter, levelFilter, user]);

  const registrationPreview = useMemo(
    () =>
      Object.entries(selectedSubjects)
        .map(([subjectId, data]) => {
          const subject = subjects.find((s) => s.id === subjectId);
          return {
            subjectId,
            subjectName: subject?.name ?? "Unknown Subject",
            papers: data.selectedPapers,
          };
        })
        .filter((item) => item.papers.length > 0),
    [selectedSubjects, subjects],
  );

  const groupedViewingSubjects = useMemo(() => {
    if (!viewingStudent) return [];

    const grouped = new Map<
      string,
      { subjectId: string; code: string; name: string; papers: string[] }
    >();

    viewingStudent.subjects.forEach((subject) => {
      const code = subject.subjectStandardCode ?? subject.subjectCode;
      const key = `${code}::${subject.subjectName}`;
      const paper = subject.paper;

      if (!grouped.has(key)) {
        grouped.set(key, {
          subjectId: subject.subjectId,
          code,
          name: subject.subjectName,
          papers: [paper],
        });
        return;
      }

      const current = grouped.get(key)!;
      if (!current.papers.includes(paper)) {
        current.papers.push(paper);
      }
    });

    return Array.from(grouped.values());
  }, [viewingStudent]);

  const getUniqueSubjectCount = (student: { subjects: StudentSubjectEntry[] }) =>
    new Set(student.subjects.map((subject) => subject.subjectCode)).size;

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
          <DialogContent className="w-[96vw] sm:max-w-[920px] h-[94vh] max-h-[94vh] overflow-hidden p-0">
            <div className="h-full overflow-y-auto px-5 py-5 sm:px-6 sm:py-6 lg:px-7 lg:py-7">
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

            <div className="mt-5 grid gap-5 md:grid-cols-2">
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

              <div className="space-y-2">
                <Label htmlFor="exam-level">Exam Level *</Label>
                <Select value={registrationLevel} onValueChange={(value: "UCE" | "UACE") => setRegistrationLevel(value)}>
                  <SelectTrigger id="exam-level">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="UCE">UCE</SelectItem>
                    <SelectItem value="UACE">UACE</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Class Level */}
              <div className="space-y-2">
                <Label htmlFor="class-level">Class Level *</Label>
                <Select value={classLevel} onValueChange={(value: any) => setClassLevel(value)}>
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
              </div>

              {/* Exam Level */}
              <div className="space-y-2">
                <Label>Exam Level</Label>
                <div className="flex items-center gap-2 px-3 py-2 border border-slate-200 rounded-lg bg-slate-50">
                  <Badge variant={registrationLevel === "UCE" ? "secondary" : "default"}>
                    {registrationLevel}
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
                <Label>Select Subjects *</Label>
              </div>

              {/* Subject List with Paper Selection */}
              <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-h-[52vh] overflow-y-auto border border-slate-200 rounded-xl p-4">
                {filteredSubjects.length === 0 ? (
                  <p className="text-sm text-slate-500 col-span-full">No subjects available for {registrationLevel}</p>
                ) : (
                  filteredSubjects.map((subject) => {
                    const isSelected = !!selectedSubjects[subject.id];
                    const isCompulsory = !subject.optional;
                    
                    return (
                      <div 
                        key={subject.id} 
                        className={`rounded-lg border p-3 transition-colors ${
                          isSelected ? "border-blue-200 bg-blue-50/30" : "border-slate-200 bg-white"
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <Checkbox
                            id={subject.id}
                            checked={isSelected}
                            onCheckedChange={() => toggleSubject(subject.id)}
                            disabled={isCompulsory}
                            className="mt-1"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="text-[11px] font-mono font-bold text-slate-500">{subject.standardCode}</span>
                              <Label 
                                htmlFor={subject.id} 
                                className={`font-semibold text-sm truncate cursor-pointer ${
                                  isCompulsory ? "text-slate-900" : "text-amber-700"
                                }`}
                              >
                                {subject.name}
                              </Label>
                            </div>
                            
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant={isCompulsory ? "default" : "outline"} className="text-[10px] px-1.5 h-4">
                                {isCompulsory ? "Compulsory" : "Optional"}
                              </Badge>
                              {isSelected && (
                                <span className="text-[10px] font-bold text-blue-600">
                                  Papers: {selectedSubjects[subject.id].selectedPapers.join(",")}
                                </span>
                              )}
                            </div>

                            {/* Rule description text */}
                            <p className="text-[10px] text-slate-500 mt-1.5 leading-tight font-medium">
                              {subject.code === "GP" || subject.standardCode === "101" ? "Paper 1 (Compulsory)" :
                               subject.code === "MATH" || subject.standardCode === "456" || subject.standardCode === "475" ? "Paper 1 (Compulsory)" :
                               subject.code === "GEOG" || subject.standardCode === "273" || subject.standardCode === "230" ? "Paper 1 (Compulsory)" :
                               subject.code === "TD" || subject.standardCode === "680" || subject.standardCode === "745" ? "Papers 1, 2, 3 (Compulsory)" :
                               subject.code === "SUB_ICT" || subject.standardCode === "610" || subject.standardCode === "840" ? "P1 (Comp) + (P2 or P3)" :
                               subject.code === "PHY" || subject.code === "CHEM" ? "Papers 1 & 2" :
                               subject.code === "SUB_MATHS" || subject.standardCode === "475S" ? "Paper 1" :
                               subject.code === "CHINESE" || subject.standardCode === "396" ? "Papers 1 & 2" :
                               subject.code === "ATESO" || subject.standardCode === "365" ? "Papers 1 & 2" :
                               "Papers 1 & 2"}
                            </p>

                            {/* Special Rule Logic Display for Subsidiary ICT */}
                            {subject.code === "SUB_ICT" && isSelected && (
                              <div className="mt-2 space-y-2 pt-2 border-t border-blue-100">
                                <Label className="text-[10px] font-bold text-slate-600 uppercase">Choose Paper 2 OR 3:</Label>
                                <div className="flex gap-4">
                                  {[2, 3].map((p) => (
                                    <label key={p} className="flex items-center gap-2 text-xs cursor-pointer">
                                      <input 
                                        type="radio"
                                        name={`ict-paper-${subject.id}`}
                                        className="h-3.5 w-3.5 border-slate-300 text-blue-600 focus:ring-blue-500"
                                        checked={selectedSubjects[subject.id].selectedPapers.includes(p as any)}
                                        onChange={() => {
                                          setSelectedSubjects(prev => ({
                                            ...prev,
                                            [subject.id]: { selectedPapers: [1, p as any] }
                                          }));
                                        }}
                                      />
                                      <span className="font-medium text-slate-700">P{p}</span>
                                    </label>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Special Logic for TD / Technical Drawing (Auto 1,2,3) */}
                            {subject.code === "TD" && isSelected && (
                              <div className="mt-2 space-y-1 pt-2 border-t border-blue-100">
                                <span className="text-[10px] font-bold text-blue-600">Auto-assigned: P1, P2, P3</span>
                              </div>
                            )}

                            {/* Special Logic for PHY/CHEM (Auto 1,2) */}
                            {(subject.code === "PHY" || subject.code === "CHEM") && isSelected && (
                              <div className="mt-2 space-y-1 pt-2 border-t border-blue-100">
                                <span className="text-[10px] font-bold text-blue-600">Auto-assigned: P1, P2</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Total Entries Display */}
              <div className="md:col-span-2">
                <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3">
                  <p className="text-sm font-medium text-slate-700">
                    Subjects Selected:{" "}
                    <span className="font-bold text-blue-700">{Object.keys(selectedSubjects).length}</span>
                    <span className="mx-2 text-blue-300">|</span>
                    Total Entries: <span className="font-bold text-blue-700">{calculateTotalEntries()}</span>
                  </p>
                </div>
              </div>

              <div className="md:col-span-2">
                <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                  <p className="mb-2 text-sm font-semibold text-slate-800">Live Preview</p>
                  {registrationPreview.length === 0 ? (
                    <p className="text-sm text-slate-500">No subject papers selected yet.</p>
                  ) : (
                    <div className="space-y-1.5">
                      {registrationPreview.map((item) => (
                        <p key={item.subjectId} className="text-sm text-slate-700">
                          {item.subjectName} {"\u2192"} {item.papers.map((paper) => `Paper ${paper}`).join(", ")}
                        </p>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <DialogFooter className="mt-6">
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddStudent}>Register Student</Button>
            </DialogFooter>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Students Table */}
      <Card>
        <CardHeader className="border-b border-slate-200">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <CardTitle className="text-slate-900">Registered Students</CardTitle>
                  <div className="flex items-center gap-8 mt-3 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                    <div>
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">School</p>
                      <p className="text-sm font-bold text-slate-800 truncate max-w-[200px]">
                        {user?.role === "school" ? user.name : (scopedSchools.find(s => s.code === schoolFilter)?.name || "All Schools")}
                      </p>
                    </div>
                    <div className="h-10 w-px bg-slate-200"></div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Total Registered</p>
                      <p className="text-lg font-black text-red-600 leading-none">{filteredStudents.length}</p>
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
                        {getUniqueSubjectCount(student)} subject{getUniqueSubjectCount(student) !== 1 ? "s" : ""}
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
                <p className="text-xs font-semibold text-slate-500 uppercase mb-3">
                  Subjects ({groupedViewingSubjects.length})
                </p>
                <div className="space-y-2 bg-slate-50 p-3 rounded-lg border">
                  {groupedViewingSubjects.map((subject) => (
                    <div
                      key={`${subject.code}-${subject.name}`}
                      className="flex items-center justify-between p-2 bg-white rounded border border-slate-200"
                    >
                      <div className="flex-1">
                        <p className="text-xs font-mono font-bold text-black">{subject.code}</p>
                        <p className="text-sm font-medium text-slate-900">{subject.name}</p>
                      </div>
                      <div className="flex flex-wrap justify-end gap-1.5">
                        {subject.papers.map((paper) => (
                          <Badge
                            key={`${subject.code}-${subject.name}-${paper}`}
                            variant="outline"
                            className="text-blue-600 border-blue-200"
                          >
                            {paper}
                          </Badge>
                        ))}
                      </div>
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
                              [subject.id]: { selectedPapers: [1] },
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
                            {subject.standardCode}
                          </span>
                          {editSelectedSubjects[subject.id] && (
                            <span className="text-xs font-semibold text-blue-600">
                              /{editSelectedSubjects[subject.id].selectedPapers.join(",")}
                            </span>
                          )}
                          <Label htmlFor={`edit-${subject.id}`} className="font-semibold cursor-pointer text-amber-600">
                            {subject.name}
                          </Label>
                        </div>
                        <p className="text-xs text-slate-500 mt-1">
                          {subject.optional ? "Optional" : "Compulsory"}
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
                          Select Paper(s):
                        </Label>
                        <div className="flex flex-wrap gap-4">
                          {PAPER_OPTIONS.map((paper) => (
                            <label
                              key={`edit-${subject.id}-${paper}`}
                              className="flex items-center gap-2 text-sm text-slate-700"
                            >
                              <Checkbox
                                checked={editSelectedSubjects[subject.id].selectedPapers.includes(paper)}
                                onCheckedChange={(checked) => {
                                  setEditSelectedSubjects((prev) => {
                                    if (!prev[subject.id]) return prev;
                                    const currentPapers = prev[subject.id].selectedPapers;
                                    const nextPapers = checked
                                      ? Array.from(new Set([...currentPapers, paper]))
                                      : currentPapers.filter((item) => item !== paper);
                                    if (nextPapers.length === 0) {
                                      const updated = { ...prev };
                                      delete updated[subject.id];
                                      return updated;
                                    }
                                    return {
                                      ...prev,
                                      [subject.id]: { selectedPapers: nextPapers },
                                    };
                                  });
                                }}
                              />
                              <span>{`Paper ${paper}`}</span>
                            </label>
                          ))}
                        </div>
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
