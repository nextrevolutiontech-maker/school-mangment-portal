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
import { Search, UserPlus, AlertCircle, Info, Edit2, Trash2, MoreVertical, Eye, BookOpen, Sparkles, Lock, CheckCircle2 } from "lucide-react";
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
  const { user, schools, students, subjects, addStudentEntry, updateStudentEntry, deleteStudentEntry, finalizeRegistration } = useAuth();
  const isAdmin = user?.role === "admin";

  const currentSchool = useMemo(() => {
    const code = user?.role === "school" ? user.schoolCode : "all";
    return schools.find(s => s.code === code);
  }, [schools, user]);

  const scopedSchools = useMemo(() => {
    if (user?.role === "admin") return schools;
    return schools.filter(s => s.code === user?.schoolCode);
  }, [schools, user]);

  const scopedStudents = useMemo(() => {
    if (user?.role === "admin") return students;
    return students.filter(s => s.schoolCode === user?.schoolCode);
  }, [students, user]);

  const [searchTerm, setSearchTerm] = useState("");
  const [zoneFilter, setZoneFilter] = useState("all");
  const [schoolFilter, setSchoolFilter] = useState("all");
  const [levelFilter, setLevelFilter] = useState<"all" | "UCE" | "UACE">("all");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(autoOpenAddDialog);

  const uniqueZones = useMemo(() => {
    return [...new Set(schools.map(s => s.zone))].filter(Boolean).sort();
  }, [schools]);

  const zoneFilteredSchools = useMemo(() => {
    if (zoneFilter === "all") return scopedSchools;
    return scopedSchools.filter(s => s.zone === zoneFilter);
  }, [scopedSchools, zoneFilter]);

  const isUceFinalized = currentSchool?.uceRegistrationFinalized ?? false;
  const isUaceFinalized = currentSchool?.uaceRegistrationFinalized ?? false;
  const isAllFinalized = (currentSchool?.educationLevel === "UCE" && isUceFinalized) || 
                         (currentSchool?.educationLevel === "UACE" && isUaceFinalized) ||
                         (isUceFinalized && isUaceFinalized);

  // Reset school filter when zone changes
  useEffect(() => {
    setSchoolFilter("all");
  }, [zoneFilter]);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [isFinalizeDialogOpen, setIsFinalizeDialogOpen] = useState(false);
  const [finalizeLevel, setFinalizeLevel] = useState<"UCE" | "UACE">("UCE");
  const [finalizeMarkingGuide, setFinalizeMarkingGuide] = useState<"Arts" | "Sciences" | "Both">("Arts");

  // Set default finalize level based on what's not finalized
  useEffect(() => {
    if (isUceFinalized && !isUaceFinalized) setFinalizeLevel("UACE");
    else if (!isUceFinalized) setFinalizeLevel("UCE");
  }, [isUceFinalized, isUaceFinalized]);

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
  const [stream, setStream] = useState<"Arts" | "Sciences" | "">("");
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
  const calculateTotalEntries = (selected: typeof selectedSubjects) => {
    return Object.values(selected).reduce((sum, item) => sum + item.selectedPapers.length, 0);
  };

  // Live validation rules
  const getValidationStatus = (level: "UCE" | "UACE", selected: typeof selectedSubjects) => {
    const selectedIds = Object.keys(selected);
    const selectedData = selectedIds.map(id => subjects.find(s => s.id === id)).filter(Boolean);
    const rules: { label: string; met: boolean; critical: boolean }[] = [];

    if (level === "UCE") {
      const uceSubjects = subjects.filter(s => s.educationLevel === "UCE");
      const compulsory = uceSubjects.filter(s => !s.optional);
      const missingCompulsory = compulsory.filter(cs => !selectedIds.includes(cs.id));
      
      rules.push({
        label: `Compulsory Subjects (${compulsory.length - missingCompulsory.length}/${compulsory.length})`,
        met: missingCompulsory.length === 0,
        critical: true
      });

      rules.push({
        label: `Total Subjects (${selectedIds.length} - Min 8, Max 9)`,
        met: selectedIds.length >= 8 && selectedIds.length <= 9,
        critical: true
      });
    } else {
      const hasGP = selectedData.some(s => s?.code === "GP" || s?.standardCode === "101");
      const hasSubMath = selectedData.some(s => s?.code === "SUB_MATHS" || s?.standardCode === "475S");
      const hasSubIct = selectedData.some(s => s?.code === "SUB_ICT" || s?.standardCode === "610");
      
      rules.push({
        label: "General Paper (GP) Selected",
        met: hasGP,
        critical: true
      });

      rules.push({
        label: "Exactly one Subsidiary (Sub Math/ICT)",
        met: (hasSubMath || hasSubIct) && !(hasSubMath && hasSubIct),
        critical: true
      });

      const mainSubjects = selectedData.filter(s => s?.code !== "GP" && s?.standardCode !== "101" && s?.code !== "SUB_MATHS" && s?.standardCode !== "475S" && s?.code !== "SUB_ICT" && s?.standardCode !== "610");
      rules.push({
        label: `Main Subjects (${mainSubjects.length} - Max 3)`,
        met: mainSubjects.length <= 3 && mainSubjects.length > 0,
        critical: true
      });
    }

    return rules;
  };

  const getSubjectCategory = (code: string) => {
    const arts = ["LIT", "HIST", "GEOG", "KISWA", "CRE", "IRE", "FRENCH", "GERMAN", "ARABIC", "LUGANDA", "RUNY", "LUSOGA", "ART", "MUSIC", "PE", "COM", "ACC", "ECON", "ENG", "CHINESE", "ATESO"];
    return arts.includes(code) ? "Arts" : "Sciences";
  };

  const togglePaperForSubject = (
    subjectId: string,
    paper: PaperOption,
    checked: boolean,
  ) => {
    const subject = subjects.find(s => s.id === subjectId);
    if (!subject) return;

    // Special logic for Physics, Chemistry, Biology
    const isSpecialSubject = ["PHYSICS", "CHEMISTRY", "BIOLOGY"].includes(subject.name.toUpperCase()) || 
                            ["PHY", "CHEM", "BIO"].includes(subject.code?.toUpperCase() || "");

    if (isSpecialSubject) {
      if (paper === 1) {
        toast.error("Paper 1 is compulsory and cannot be deselected");
        return;
      }
      
      if (checked && (paper === 2 || paper === 3)) {
        // Mutually exclusive: If checking 2, keep 1 and 2. If checking 3, keep 1 and 3.
        setSelectedSubjects((prev) => {
          if (!prev[subjectId]) return prev;
          return {
            ...prev,
            [subjectId]: { selectedPapers: [1, paper] },
          };
        });
        return;
      }

      if (!checked && (paper === 2 || paper === 3)) {
        // Automatically toggle to the other optional paper to ensure exactly two papers are always selected
        const otherPaper = paper === 2 ? 3 : 2;
        setSelectedSubjects((prev) => {
          if (!prev[subjectId]) return prev;
          return {
            ...prev,
            [subjectId]: { selectedPapers: [1, otherPaper] },
          };
        });
        toast.info(`Switched to Paper ${otherPaper} to maintain the required 2 papers for ${subject.name}`);
        return;
      }
    }

    // Check if paper is compulsory
    const paperName = `Paper ${paper}`;
    const paperDef = subject.papers.find(p => 
      p.name === paperName || p.name.includes(String(paper))
    );
    
    if (paperDef?.isCompulsory && !checked) {
      toast.error(`${paperName} is compulsory for ${subject.name}`);
      return;
    }

    setSelectedSubjects((prev) => {
      if (!prev[subjectId]) return prev;
      const currentPapers = prev[subjectId].selectedPapers;
      
      // Enforce maxPapers rule
      if (checked && subject.maxPapers && currentPapers.length >= subject.maxPapers) {
        toast.error(`You can only select up to ${subject.maxPapers} papers for ${subject.name}`);
        return prev;
      }

      const nextPapers = checked
        ? Array.from(new Set([...currentPapers, paper]))
        : currentPapers.filter((item) => item !== paper);

      if (nextPapers.length === 0) {
        // Only allow removing subject if it's optional
        if (!subject.optional) {
          toast.error(`${subject.name} is a compulsory subject`);
          return prev;
        }
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
        // Add subject with dynamic papers
        const isSpecialSubject = ["PHYSICS", "CHEMISTRY", "BIOLOGY"].includes(subject.name.toUpperCase()) || 
                                ["PHY", "CHEM", "BIO"].includes(subject.code?.toUpperCase() || "");

        if (isSpecialSubject) {
          return {
            ...prev,
            [subjectId]: {
              selectedPapers: [1, 2], // Default to Paper 1 and Paper 2 to ensure exactly two papers
            },
          };
        }

        const autoPapers: PaperOption[] = subject.papers
          .filter(p => p.isCompulsory)
          .map(p => {
            const match = p.name.match(/\d+/);
            return (match ? parseInt(match[0]) : subject.papers.indexOf(p) + 1) as PaperOption;
          });

        if (autoPapers.length === 0 && subject.papers.length > 0) {
          const match = subject.papers[0].name.match(/\d+/);
          autoPapers.push((match ? parseInt(match[0]) : 1) as PaperOption);
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
        const isSpecialSubject = ["PHYSICS", "CHEMISTRY", "BIOLOGY"].includes(subj.name.toUpperCase()) || 
                                ["PHY", "CHEM", "BIO"].includes(subj.code?.toUpperCase() || "");

        if (isSpecialSubject) {
          acc[subj.id] = { selectedPapers: [1, 2] }; // Default to Paper 1 and Paper 2 to ensure exactly two papers
          return acc;
        }

        const papers: PaperOption[] = subj.papers
          .filter(p => p.isCompulsory)
          .map(p => {
            const match = p.name.match(/\d+/);
            return (match ? parseInt(match[0]) : subj.papers.indexOf(p) + 1) as PaperOption;
          });

        if (papers.length === 0 && subj.papers.length > 0) {
          const match = subj.papers[0].name.match(/\d+/);
          papers.push((match ? parseInt(match[0]) : 1) as PaperOption);
        }
        
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
    const selectedSubjectsData = selectedSubjectIds.map(id => subjects.find(s => s.id === id));
    
    if (selectedSubjectIds.length === 0) {
      errors.push("At least one subject must be selected");
    }

    // UCE RULES: 7 Compulsory + 1 or 2 Optional (Total 8-9)
    if (registrationLevel === "UCE") {
      const uceSubjects = subjects.filter(s => s.educationLevel === "UCE");
      const compulsorySubjects = uceSubjects.filter(s => !s.optional);
      const missingCompulsory = compulsorySubjects.filter(cs => !selectedSubjectIds.includes(cs.id));
      
      if (missingCompulsory.length > 0) {
        errors.push(`COMPULSORY SUBJECT MISSING: ${missingCompulsory.map(s => s.name).join(", ")}`);
      }

      if (selectedSubjectIds.length < 8) {
        errors.push("REJECTED: UCE students must have a minimum of 8 subjects (7 Compulsory + at least 1 Optional)");
      } else if (selectedSubjectIds.length > 9) {
        errors.push("REJECTED: UCE students can register for a maximum of 9 subjects only");
      }
    }

    // UACE RULES
    if (registrationLevel === "UACE") {
      const selectedSubjectCodes = selectedSubjectsData.map(s => s?.code);
      const selectedStandardCodes = selectedSubjectsData.map(s => s?.standardCode);
      
      // General Paper = compulsory
      if (!selectedSubjectCodes.includes("GP") && !selectedStandardCodes.includes("101")) {
        errors.push("REJECTED: General Paper (GP) is compulsory for UACE students");
      }

      // Must select Exactly one Subsidiary (Sub Math OR Sub ICT)
      const hasSubMath = selectedSubjectCodes.includes("SUB_MATHS") || selectedStandardCodes.includes("475S");
      const hasSubIct = selectedSubjectCodes.includes("SUB_ICT") || selectedStandardCodes.includes("610");
      
      if (!hasSubMath && !hasSubIct) {
        errors.push("REJECTED: UACE students must select one subsidiary subject (Subsidiary Mathematics or Subsidiary ICT)");
      } else if (hasSubMath && hasSubIct) {
        errors.push("REJECTED: UACE students cannot select both Subsidiary Mathematics and Subsidiary ICT");
      }

      // Max 3 main subjects (Not GP and Not Subsidiary)
      const mainSubjects = selectedSubjectsData.filter(s => 
        s?.code !== "GP" && s?.standardCode !== "101" && 
        s?.code !== "SUB_MATHS" && s?.standardCode !== "475S" && 
        s?.code !== "SUB_ICT" && s?.standardCode !== "610"
      );

      if (mainSubjects.length > 3) {
        errors.push(`REJECTED: UACE students can register for a maximum of 3 main subjects. You selected ${mainSubjects.length}.`);
      }
    }

    // Subject-specific paper validation
    Object.entries(selectedSubjects).forEach(([subjectId, data]) => {
      const subject = subjects.find(s => s.id === subjectId);
      if (subject) {
        const isSpecialSubject = ["PHYSICS", "CHEMISTRY", "BIOLOGY"].includes(subject.name.toUpperCase()) || 
                                ["PHY", "CHEM", "BIO"].includes(subject.code?.toUpperCase() || "");
        
        if (isSpecialSubject) {
          if (!data.selectedPapers.includes(1)) {
            errors.push(`${subject.name}: Paper 1 is compulsory`);
          }
          if (!data.selectedPapers.includes(2) && !data.selectedPapers.includes(3)) {
            errors.push(`${subject.name}: You must select either Paper 2 or Paper 3`);
          }
          if (data.selectedPapers.includes(2) && data.selectedPapers.includes(3)) {
            errors.push(`${subject.name}: You cannot select both Paper 2 and Paper 3`);
          }
          if (data.selectedPapers.length !== 2) {
            errors.push(`${subject.name}: Exactly 2 papers must be selected (Paper 1 + Paper 2 or 3)`);
          }
        } else {
          if (subject.minPapers && data.selectedPapers.length < subject.minPapers) {
            errors.push(`${subject.name}: Minimum ${subject.minPapers} papers required (currently ${data.selectedPapers.length})`);
          }
          if (subject.maxPapers && data.selectedPapers.length > subject.maxPapers) {
            errors.push(`${subject.name}: Maximum ${subject.maxPapers} papers allowed (currently ${data.selectedPapers.length})`);
          }
          
          // Ensure compulsory papers are selected
          const compulsoryPapers = subject.papers.filter(p => p.isCompulsory);
          compulsoryPapers.forEach(cp => {
            const match = cp.name.match(/\d+/);
            const paperNum = (match ? parseInt(match[0]) : 0) as PaperOption;
            if (paperNum && !data.selectedPapers.includes(paperNum)) {
              errors.push(`${subject.name}: ${cp.name} is compulsory`);
            }
          });
        }
      }
    });

    if (errors.length > 0) {
      setValidationErrors(errors);
      return;
    }

    // Persist one entry per selected subject paper for compatibility with reporting/export flows.
    const subjectsArray: StudentSubjectEntry[] = Object.entries(selectedSubjects).flatMap(
      ([subjectId, data]) => {
        const subject = subjects.find((s) => s.id === subjectId);
        if (!subject) return [];

        return data.selectedPapers.map((paperNum) => {
          // Find the paper definition that corresponds to this paperNum
          // We try to match by digit in name, or fallback to index
          const paperDef = subject.papers.find((p, idx) => {
            const match = p.name.match(/\d+/);
            const pNum = match ? parseInt(match[0]) : idx + 1;
            return pNum === paperNum;
          }) || subject.papers[paperNum - 1] || subject.papers[0];

          return {
            subjectId,
            subjectCode: subject.code || "",
            subjectStandardCode: subject.standardCode || "",
            subjectName: subject.name || "",
            paper: paperDef?.name || `Paper ${paperNum}`,
            entry1: false,
            entry2: false,
            entry3: false,
            entry4: false,
          };
        });
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

  const togglePaperForEdit = (
    subjectId: string,
    paper: PaperOption,
    checked: boolean,
  ) => {
    const subject = subjects.find(s => s.id === subjectId);
    if (!subject) return;

    // Special logic for Physics, Chemistry, Biology
    const isSpecialSubject = ["PHYSICS", "CHEMISTRY", "BIOLOGY"].includes(subject.name.toUpperCase()) || 
                            ["PHY", "CHEM", "BIO"].includes(subject.code?.toUpperCase() || "");

    if (isSpecialSubject) {
      if (paper === 1) {
        toast.error("Paper 1 is compulsory and cannot be deselected");
        return;
      }
      
      if (checked && (paper === 2 || paper === 3)) {
        // Mutually exclusive: If checking 2, keep 1 and 2. If checking 3, keep 1 and 3.
        setEditSelectedSubjects((prev) => {
          if (!prev[subjectId]) return prev;
          return {
            ...prev,
            [subjectId]: { selectedPapers: [1, paper] },
          };
        });
        return;
      }

      if (!checked && (paper === 2 || paper === 3)) {
        // Automatically toggle to the other optional paper to ensure exactly two papers are always selected
        const otherPaper = paper === 2 ? 3 : 2;
        setEditSelectedSubjects((prev) => {
          if (!prev[subjectId]) return prev;
          return {
            ...prev,
            [subjectId]: { selectedPapers: [1, otherPaper] },
          };
        });
        toast.info(`Switched to Paper ${otherPaper} to maintain the required 2 papers for ${subject.name}`);
        return;
      }
    }

    // Check if paper is compulsory
    const paperName = `Paper ${paper}`;
    const paperDef = subject.papers.find(p => 
      p.name === paperName || p.name.includes(String(paper))
    );
    
    if (paperDef?.isCompulsory && !checked) {
      toast.error(`${paperName} is compulsory for ${subject.name}`);
      return;
    }

    setEditSelectedSubjects((prev) => {
      if (!prev[subjectId]) return prev;
      const currentPapers = prev[subjectId].selectedPapers;
      
      // Enforce maxPapers rule
      if (checked && subject.maxPapers && currentPapers.length >= subject.maxPapers) {
        toast.error(`You can only select up to ${subject.maxPapers} papers for ${subject.name}`);
        return prev;
      }

      const nextPapers = checked
        ? Array.from(new Set([...currentPapers, paper]))
        : currentPapers.filter((item) => item !== paper);

      if (nextPapers.length === 0) {
        // Only allow removing subject if it's optional
        if (!subject.optional) {
          toast.error(`${subject.name} is a compulsory subject`);
          return prev;
        }
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

  // Toggle subject selection for edit
  const toggleSubjectForEdit = (subjectId: string) => {
    const subject = subjects.find((s) => s.id === subjectId);
    if (!subject) return;

    setEditSelectedSubjects((prev) => {
      if (prev[subjectId]) {
        // Remove subject (unless it's compulsory)
        if (!subject.optional) return prev;
        const newState = { ...prev };
        delete newState[subjectId];
        return newState;
      } else {
        // Add subject with dynamic papers
        const isSpecialSubject = ["PHYSICS", "CHEMISTRY", "BIOLOGY"].includes(subject.name.toUpperCase()) || 
                                ["PHY", "CHEM", "BIO"].includes(subject.code?.toUpperCase() || "");

        if (isSpecialSubject) {
          return {
            ...prev,
            [subjectId]: {
              selectedPapers: [1, 2], // Default to Paper 1 and Paper 2 to ensure exactly two papers
            },
          };
        }

        const autoPapers: PaperOption[] = subject.papers
          .filter(p => p.isCompulsory)
          .map(p => {
            const match = p.name.match(/\d+/);
            return (match ? parseInt(match[0]) : subject.papers.indexOf(p) + 1) as PaperOption;
          });

        if (autoPapers.length === 0 && subject.papers.length > 0) {
          const match = subject.papers[0].name.match(/\d+/);
          autoPapers.push((match ? parseInt(match[0]) : 1) as PaperOption);
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
      const subject = subjects.find(
        (s) =>
          s.code === subj.subjectCode &&
          s.educationLevel === student.examLevel,
      );
      
      if (subject) {
        const subjectId = subject.id;
        const existingPapers = editSubjects[subjectId]?.selectedPapers ?? [];
        
        // Find the paper number by matching the paper name
        const paperDef = subject.papers.find(p => p.name === subj.paper);
        let paperNum: PaperOption;
        
        if (paperDef) {
          const match = paperDef.name.match(/\d+/);
          paperNum = (match ? parseInt(match[0]) : subject.papers.indexOf(paperDef) + 1) as PaperOption;
        } else {
          // Fallback if not found in definitions (maybe it was "Paper X")
          const match = subj.paper.match(/\d+/);
          paperNum = (match ? parseInt(match[0]) : 1) as PaperOption;
        }

        if (!existingPapers.includes(paperNum)) {
          editSubjects[subjectId] = {
            selectedPapers: [...existingPapers, paperNum],
          };
        }
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
    
    const selectedSubjectIds = Object.keys(editSelectedSubjects);
    const selectedSubjectsData = selectedSubjectIds.map(id => subjects.find(s => s.id === id));
    
    if (selectedSubjectIds.length === 0) {
      errors.push("At least one subject must be selected");
    }

    const editExamLevel = editClassLevel === "S.5" || editClassLevel === "S.6" ? "UACE" : "UCE";

    // UCE RULES
    if (editExamLevel === "UCE") {
      const uceSubjects = subjects.filter(s => s.educationLevel === "UCE");
      const compulsorySubjects = uceSubjects.filter(s => !s.optional);
      const missingCompulsory = compulsorySubjects.filter(cs => !selectedSubjectIds.includes(cs.id));
      
      if (missingCompulsory.length > 0) {
        errors.push(`COMPULSORY SUBJECT MISSING: ${missingCompulsory.map(s => s.name).join(", ")}`);
      }

      if (selectedSubjectIds.length < 8) {
        errors.push("REJECTED: UCE students must have a minimum of 8 subjects (7 Compulsory + at least 1 Optional)");
      } else if (selectedSubjectIds.length > 9) {
        errors.push("REJECTED: UCE students can register for a maximum of 9 subjects only");
      }
    }

    // UACE RULES
    if (editExamLevel === "UACE") {
      const selectedSubjectCodes = selectedSubjectsData.map(s => s?.code);
      const selectedStandardCodes = selectedSubjectsData.map(s => s?.standardCode);
      
      // General Paper = compulsory
      if (!selectedSubjectCodes.includes("GP") && !selectedStandardCodes.includes("101")) {
        errors.push("REJECTED: General Paper (GP) is compulsory for UACE students");
      }

      // Must select Exactly one Subsidiary (Sub Math OR Sub ICT)
      const hasSubMath = selectedSubjectCodes.includes("SUB_MATHS") || selectedStandardCodes.includes("475S");
      const hasSubIct = selectedSubjectCodes.includes("SUB_ICT") || selectedStandardCodes.includes("610");
      
      if (!hasSubMath && !hasSubIct) {
        errors.push("REJECTED: UACE students must select one subsidiary subject (Subsidiary Mathematics or Subsidiary ICT)");
      } else if (hasSubMath && hasSubIct) {
        errors.push("REJECTED: UACE students cannot select both Subsidiary Mathematics and Subsidiary ICT");
      }

      // Max 3 main subjects (Not GP and Not Subsidiary)
      const mainSubjects = selectedSubjectsData.filter(s => 
        s?.code !== "GP" && s?.standardCode !== "101" && 
        s?.code !== "SUB_MATHS" && s?.standardCode !== "475S" && 
        s?.code !== "SUB_ICT" && s?.standardCode !== "610"
      );

      if (mainSubjects.length > 3) {
        errors.push(`REJECTED: UACE students can register for a maximum of 3 main subjects. You selected ${mainSubjects.length}.`);
      }
    }

    // Subject-specific paper validation
    Object.entries(editSelectedSubjects).forEach(([subjectId, data]) => {
      const subject = subjects.find(s => s.id === subjectId);
      if (subject) {
        const isSpecialSubject = ["PHYSICS", "CHEMISTRY", "BIOLOGY"].includes(subject.name.toUpperCase()) || 
                                ["PHY", "CHEM", "BIO"].includes(subject.code?.toUpperCase() || "");
        
        if (isSpecialSubject) {
          if (!data.selectedPapers.includes(1)) {
            errors.push(`${subject.name}: Paper 1 is compulsory`);
          }
          if (!data.selectedPapers.includes(2) && !data.selectedPapers.includes(3)) {
            errors.push(`${subject.name}: You must select either Paper 2 or Paper 3`);
          }
          if (data.selectedPapers.includes(2) && data.selectedPapers.includes(3)) {
            errors.push(`${subject.name}: You cannot select both Paper 2 and Paper 3`);
          }
          if (data.selectedPapers.length !== 2) {
            errors.push(`${subject.name}: Exactly 2 papers must be selected (Paper 1 + Paper 2 or 3)`);
          }
        } else {
          if (subject.minPapers && data.selectedPapers.length < subject.minPapers) {
            errors.push(`${subject.name}: Minimum ${subject.minPapers} papers required (currently ${data.selectedPapers.length})`);
          }
          if (subject.maxPapers && data.selectedPapers.length > subject.maxPapers) {
            errors.push(`${subject.name}: Maximum ${subject.maxPapers} papers allowed (currently ${data.selectedPapers.length})`);
          }
          
          // Ensure compulsory papers are selected
          const compulsoryPapers = subject.papers.filter(p => p.isCompulsory);
          compulsoryPapers.forEach(cp => {
            const match = cp.name.match(/\d+/);
            const paperNum = (match ? parseInt(match[0]) : 0) as PaperOption;
            if (paperNum && !data.selectedPapers.includes(paperNum)) {
              errors.push(`${subject.name}: ${cp.name} is compulsory`);
            }
          });
        }
      }
    });

    if (errors.length > 0) {
      setValidationErrors(errors);
      return;
    }

    const subjectsArray: StudentSubjectEntry[] = Object.entries(editSelectedSubjects).flatMap(
      ([subjectId, data]) => {
        const subject = subjects.find((s) => s.id === subjectId);
        if (!subject) return [];

        return data.selectedPapers.map((paperNum) => {
          // Find the paper definition that corresponds to this paperNum
          const paperDef = subject.papers.find((p, idx) => {
            const match = p.name.match(/\d+/);
            const pNum = match ? parseInt(match[0]) : idx + 1;
            return pNum === paperNum;
          }) || subject.papers[paperNum - 1] || subject.papers[0];

          return {
            subjectId,
            subjectCode: subject.code || "",
            subjectStandardCode: subject.standardCode || "",
            subjectName: subject.name || "",
            paper: paperDef?.name || `Paper ${paperNum}`,
            entry1: false,
            entry2: false,
            entry3: false,
            entry4: false,
          };
        });
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
          (student.registrationNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false);
        const matchesSchool = schoolFilter === "all" || student.schoolCode === schoolFilter;
        const matchesLevel = levelFilter === "all" || student.examLevel === levelFilter;
        
        let matchesZone = true;
        if (zoneFilter !== "all") {
          const school = schools.find(s => s.code === student.schoolCode);
          matchesZone = school?.zone === zoneFilter;
        }

        return matchesSearch && matchesSchool && matchesLevel && matchesZone;
      });
  }, [scopedStudents, searchTerm, schoolFilter, levelFilter, zoneFilter, schools]);

  const hasAnyRegistrationNumber = useMemo(() => {
    return filteredStudents.some(s => !!s.registrationNumber);
  }, [filteredStudents]);

  const registrationPreview = useMemo(
    () =>
      Object.entries(selectedSubjects)
        .map(([subjectId, data]) => {
          const subject = subjects.find((s) => s.id === subjectId);
          if (!subject) return null;
          
          const paperNames = data.selectedPapers.map(paperNum => {
            const paperDef = subject.papers.find((p, idx) => {
              const match = p.name.match(/\d+/);
              const pNum = match ? parseInt(match[0]) : idx + 1;
              return pNum === paperNum;
            }) || subject.papers[paperNum - 1] || subject.papers[0];
            return paperDef?.name || `Paper ${paperNum}`;
          });

          return {
            subjectId,
            subjectName: subject.name,
            papers: paperNames,
          };
        })
        .filter((item): item is NonNullable<typeof item> => item !== null && item.papers.length > 0),
    [selectedSubjects, subjects],
  );

  const editRegistrationPreview = useMemo(
    () =>
      Object.entries(editSelectedSubjects)
        .map(([subjectId, data]) => {
          const subject = subjects.find((s) => s.id === subjectId);
          if (!subject) return null;

          const paperNames = data.selectedPapers.map((paperNum) => {
            const paperDef = subject.papers.find((p, idx) => {
              const match = p.name.match(/\d+/);
              const pNum = match ? parseInt(match[0]) : idx + 1;
              return pNum === paperNum;
            }) || subject.papers[paperNum - 1] || subject.papers[0];
            return paperDef?.name || `Paper ${paperNum}`;
          });

          return {
            subjectId,
            subjectName: subject.name,
            papers: paperNames,
          };
        })
        .filter((item): item is NonNullable<typeof item> => item !== null && item.papers.length > 0),
    [editSelectedSubjects, subjects],
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
      {(isUceFinalized || isUaceFinalized) && !isAdmin && (
        <Alert className="bg-blue-50 border-blue-200 text-blue-800 rounded-2xl mb-2">
          <Lock className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-sm font-medium">
            Your {isUceFinalized && isUaceFinalized ? "complete" : (isUceFinalized ? "UCE" : "UACE")} registration has been finalized. Original student entries for finalized levels are now locked. 
            To edit locked records, please contact the WAKISSHA Secretariat or your Zone Leader.
          </AlertDescription>
        </Alert>
      )}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-2">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-orange-500">
            Student Registration
          </p>
          <h1 className="text-3xl font-bold text-slate-900">Student Entries</h1>
          <p className="max-w-3xl text-slate-500">
            Register students, select exam level, choose subjects, and specify
            entry numbers for the examination session.
          </p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row lg:w-auto">
          {!isAdmin && (!isUceFinalized || !isUaceFinalized) && (
            <Dialog open={isFinalizeDialogOpen} onOpenChange={setIsFinalizeDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="border-orange-200 bg-orange-50 text-orange-700 hover:bg-orange-100 hover:text-orange-800">
                  <Sparkles className="mr-2 h-4 w-4" />
                  Finalize {(!isUceFinalized && !isUaceFinalized) ? "" : (isUceFinalized ? "UACE " : "UCE ")}Registration
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md rounded-3xl">
                <DialogHeader>
                  <DialogTitle className="text-xl font-black text-slate-900">Finalize Registration</DialogTitle>
                  <DialogDescription className="text-slate-500 font-medium">
                    Once finalized, you will no longer be able to edit or delete existing students for this level. 
                    Any students added after this will be treated as "Additional Students" with separate invoices.
                  </DialogDescription>
                </DialogHeader>
                <div className="py-6 space-y-4">
                  <div className="space-y-3">
                    <Label className="text-sm font-black text-slate-700 uppercase tracking-widest">Select Exam Level to Finalize</Label>
                    <Select value={finalizeLevel} onValueChange={(value: "UCE" | "UACE") => setFinalizeLevel(value)}>
                      <SelectTrigger className="h-12 border-2 rounded-xl font-bold">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="UCE" disabled={isUceFinalized} className="font-bold">UCE (O-Level) {isUceFinalized ? "(Finalized)" : ""}</SelectItem>
                        <SelectItem value="UACE" disabled={isUaceFinalized} className="font-bold">UACE (A-Level) {isUaceFinalized ? "(Finalized)" : ""}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-3">
                    <Label className="text-sm font-black text-slate-700 uppercase tracking-widest">Select Marking Guide Package</Label>
                    <Select value={finalizeMarkingGuide} onValueChange={(value: any) => setFinalizeMarkingGuide(value)}>
                      <SelectTrigger className="h-12 border-2 rounded-xl font-bold">
                        <SelectValue placeholder="Select marking guide" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Arts" className="font-bold">Arts (UGX 25,000)</SelectItem>
                        <SelectItem value="Sciences" className="font-bold">Sciences (UGX 25,000)</SelectItem>
                        <SelectItem value="Both" className="font-bold">Both (Arts & Sciences) (UGX 50,000)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter className="gap-2 sm:gap-0">
                  <Button variant="outline" className="rounded-xl font-bold" onClick={() => setIsFinalizeDialogOpen(false)}>Cancel</Button>
                  <Button 
                    className="bg-orange-600 hover:bg-orange-700 text-white rounded-xl font-bold"
                    onClick={() => {
                      if (user?.schoolCode) {
                        finalizeRegistration(user.schoolCode, finalizeMarkingGuide, finalizeLevel);
                        toast.success(`${finalizeLevel} Registration Finalized`, {
                          description: "Your registration has been locked. Generating payment items..."
                        });
                        setIsFinalizeDialogOpen(false);
                        onPageChange("make-payments");
                      }
                    }}
                  >
                    Confirm & Finalize {finalizeLevel}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}

          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="w-full lg:w-auto bg-blue-600 hover:bg-blue-700">
                <UserPlus className="h-4 w-4 mr-2" />
                {isAllFinalized ? "Add Additional Student" : "Add Student"}
              </Button>
            </DialogTrigger>
          <DialogContent className="w-[96vw] sm:max-w-[850px] h-[90vh] max-h-[90vh] overflow-hidden p-0 border-none shadow-2xl" aria-describedby="register-description">
            <div className="h-full overflow-y-auto px-4 py-4 sm:px-5 sm:py-5 bg-slate-50/50">
            <DialogHeader className="mb-4">
              <div className="flex items-center gap-2.5 mb-1">
                <div className="p-1.5 rounded-lg bg-blue-600 text-white shadow-lg shadow-blue-200">
                  <UserPlus className="h-5 w-5" />
                </div>
                <div>
                  <DialogTitle className="text-lg font-black text-slate-900">
                    {(registrationLevel === "UCE" ? isUceFinalized : isUaceFinalized) ? `Register Additional ${registrationLevel} Student` : `Register ${registrationLevel} Student`}
                  </DialogTitle>
                  <DialogDescription id="register-description" className="sr-only">
                    Fill in the details to register a new student for examinations.
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>

            {validationErrors.length > 0 && (
              <Alert variant="destructive" className="mb-4 border-2 border-blue-100 bg-blue-50/50 rounded-xl">
                <AlertCircle className="h-4 w-4 text-blue-600" />
                <AlertDescription>
                  <p className="font-black text-blue-900 mb-0.5 uppercase tracking-wider text-[9px]">Registration Errors</p>
                  <ul className="list-disc list-inside space-y-0.5 text-xs font-bold text-blue-800">
                    {validationErrors.map((error, i) => (
                      <li key={i}>{error}</li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}

            <div className="grid gap-4 md:grid-cols-2 bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
              {/* Student Name */}
              <div className="space-y-1.5 md:col-span-2">
                <Label htmlFor="student-name" className="text-[11px] font-black text-slate-700 uppercase tracking-widest flex items-center gap-2">
                  Student Full Name <span className="text-blue-600">*</span>
                </Label>
                <div className="relative">
                  <Input
                    id="student-name"
                    placeholder="e.g. NAMUTEBI SHAKIRAH"
                    value={studentName}
                    onChange={(e) => setStudentName(e.target.value.toUpperCase())}
                    className="h-10 text-sm font-bold border-2 focus-visible:ring-blue-600 rounded-lg transition-all"
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <Sparkles className="h-4 w-4 text-blue-400 opacity-50" />
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="exam-level" className="text-[11px] font-black text-slate-700 uppercase tracking-widest">Exam Level <span className="text-blue-600">*</span></Label>
                <Select value={registrationLevel} onValueChange={(value: "UCE" | "UACE") => setRegistrationLevel(value)}>
                  <SelectTrigger id="exam-level" className="h-10 text-sm font-bold border-2 rounded-lg">
                  <SelectValue />
                </SelectTrigger>
                  <SelectContent className="rounded-lg border-2">
                    <SelectItem value="UCE" className="font-bold py-2">UCE (O-Level)</SelectItem>
                    <SelectItem value="UACE" className="font-bold py-2">UACE (A-Level)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Class Level */}
              <div className="space-y-1.5">
                <Label htmlFor="class-level" className="text-[11px] font-black text-slate-700 uppercase tracking-widest">Class Level <span className="text-blue-600">*</span></Label>
                <Select value={classLevel} onValueChange={(value: any) => setClassLevel(value)}>
                  <SelectTrigger className="h-10 text-sm font-bold border-2 rounded-lg">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-lg border-2">
                    {availableClassLevels.map((level) => (
                      <SelectItem key={level} value={level} className="font-bold py-2">
                        {level}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* School Selection */}
              {isAdmin && (
                <div className="space-y-1.5">
                  <Label htmlFor="school" className="text-[11px] font-black text-slate-700 uppercase tracking-widest">School <span className="text-blue-600">*</span></Label>
                  <Select value={schoolCode} onValueChange={setSchoolCode}>
                    <SelectTrigger className="h-10 text-sm font-bold border-2 rounded-lg">
                    <SelectValue />
                  </SelectTrigger>
                    <SelectContent className="rounded-lg border-2">
                      {zoneFilteredSchools.map((school) => (
                        <SelectItem key={school.code} value={school.code} className="font-bold py-2">
                          {school.name} ({school.code})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Subject Selection */}
              <div className="space-y-3 md:col-span-2 pt-2">
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-[11px] font-black text-slate-900 uppercase tracking-[0.2em] flex items-center gap-2">
                      <BookOpen className="h-3.5 w-3.5 text-blue-600" />
                      Select Subjects <span className="text-blue-600">*</span>
                    </Label>
                  </div>

                  <div className="text-xs font-bold text-blue-800 bg-blue-50 border-2 border-blue-200 rounded-xl px-4 py-2.5 flex items-start gap-2.5 shadow-sm">
                    <Info className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
                    <p className="leading-relaxed text-[11px]">
                      {registrationLevel === "UCE" 
                        ? "7 compulsory subjects + 1 or 2 optional (Total 8 or 9)" 
                        : "GP is compulsory + exactly one Subsidiary + max 3 main subjects"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Subject List with Paper Selection */}
              <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-h-[42vh] overflow-y-auto border-2 border-slate-200 rounded-[1.5rem] p-4 bg-slate-50 shadow-inner">
                {filteredSubjects.length === 0 ? (
                  <div className="col-span-full py-10 flex flex-col items-center justify-center text-slate-400 gap-2.5 bg-white rounded-2xl border-2 border-dashed border-slate-200">
                    <BookOpen className="h-8 w-8 opacity-20" />
                    <p className="text-[11px] font-bold uppercase tracking-widest">No subjects available for {registrationLevel}</p>
                  </div>
                ) : (
                  (() => {
                    const selectedSubjectData = Object.keys(selectedSubjects).map(id => subjects.find(s => s.id === id));
                    const hasSubMathSelected = selectedSubjectData.some(s => s?.code === "SUB_MATHS" || s?.standardCode === "475S");
                    const hasSubIctSelected = selectedSubjectData.some(s => s?.code === "SUB_ICT" || s?.standardCode === "610");

                    return filteredSubjects.map((subject) => {
                      const isSelected = !!selectedSubjects[subject.id];
                      const isCompulsory = !subject.optional;
                      const category = getSubjectCategory(subject.code);
                      
                      const isSubMath = subject.code === "SUB_MATHS" || subject.standardCode === "475S";
                      const isSubIct = subject.code === "SUB_ICT" || subject.standardCode === "610";
                      const isSubsidiaryDisabled = (isSubMath && hasSubIctSelected) || (isSubIct && hasSubMathSelected);
                      
                      return (
                        <div 
                          key={subject.id} 
                          className={`group relative rounded-2xl border-2 transition-all duration-300 p-4 ${
                            isSelected 
                              ? (category === "Arts" ? "border-amber-500 bg-white shadow-lg shadow-amber-100/30" : "border-blue-600 bg-white shadow-lg shadow-blue-100/30") 
                              : (isSubsidiaryDisabled ? "border-slate-100 bg-slate-50/50 opacity-40 grayscale-[0.5]" : "border-slate-200 bg-white hover:border-slate-300 shadow-sm hover:shadow-md")
                          } scale-[1.0] ${!isSubsidiaryDisabled ? 'hover:scale-[1.01]' : ''}`}
                        >
                          <div className="flex flex-col h-full gap-3">
                            <div className="flex items-start justify-between gap-2.5">
                              <div className="flex flex-col gap-1 min-w-0">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className={`text-[9px] font-black font-mono px-1.5 py-0.5 rounded-md uppercase tracking-tighter shadow-sm ${
                                    isSelected 
                                      ? (category === "Arts" ? "bg-amber-600 text-white" : "bg-blue-600 text-white") 
                                      : "bg-slate-100 text-slate-600"
                                  }`}>
                                    {subject.standardCode}
                                  </span>
                                  {isCompulsory ? (
                                    <Badge className="bg-slate-900 text-white border-none text-[8px] px-1.5 h-4 font-black uppercase tracking-widest shadow-sm">
                                      COMPULSORY
                                    </Badge>
                                  ) : (
                                    <Badge variant="outline" className={`text-[8px] px-1.5 h-4 font-bold uppercase tracking-widest border-2 ${
                                      category === "Arts" ? "text-amber-600 border-amber-100 bg-amber-50/50" : "text-blue-600 border-blue-100 bg-blue-50/50"
                                    }`}>
                                      OPTIONAL
                                    </Badge>
                                  )}
                                </div>
                                <Label 
                                  htmlFor={subject.id} 
                                  className={`font-black text-[13px] leading-tight transition-colors ${!isSubsidiaryDisabled ? 'cursor-pointer' : 'cursor-not-allowed'} ${
                                    isSelected ? (category === "Arts" ? "text-amber-900" : "text-blue-900") : "text-slate-800"
                                  }`}
                                >
                                  {subject.name}
                                </Label>
                              </div>

                              <Checkbox
                                id={subject.id}
                                checked={isSelected}
                                onCheckedChange={() => toggleSubject(subject.id)}
                                disabled={isCompulsory || isSubsidiaryDisabled}
                                className={`h-6 w-6 rounded-md border-2 transition-all duration-200 ${
                                  isSelected 
                                    ? (category === "Arts" ? "bg-amber-600 border-amber-600 text-white shadow-md shadow-amber-200" : "bg-blue-600 border-blue-600 text-white shadow-md shadow-blue-200") 
                                    : (isSubsidiaryDisabled ? "border-slate-200 bg-slate-100 cursor-not-allowed" : "border-slate-300 bg-white hover:border-blue-400")
                                }`}
                              />
                            </div>
                            
                            <div className="mt-auto pt-3 border-t-2 border-slate-50">
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-1">
                                <BookOpen className={`h-3 w-3 ${isSelected ? (category === "Arts" ? "text-amber-500" : "text-blue-500") : "text-slate-300"}`} />
                                <p className={`text-[10px] font-bold leading-none ${isSelected ? (category === "Arts" ? "text-amber-800" : "text-blue-800") : "text-slate-500"}`}>
                                  {subject.papers.length} {subject.papers.length === 1 ? 'Paper' : 'Papers'}
                                </p>
                              </div>
                              
                              {isSelected && (
                                <Badge className={`${category === "Arts" ? "bg-amber-100 text-amber-700" : "bg-blue-100 text-blue-700"} border-none text-[9px] px-1.5 h-5 font-black rounded-md`}>
                                  {selectedSubjects[subject.id].selectedPapers.length} Selected
                                </Badge>
                              )}
                            </div>

                            {/* Dynamic Paper Selection Logic */}
                            {isSelected && subject.papers.length > 0 && (
                              <div className={`mt-2.5 space-y-1.5 p-2.5 rounded-xl border ${category === "Arts" ? "bg-amber-50/50 border-amber-100" : "bg-blue-50/50 border-blue-100"}`}>
                                <div className="flex items-center justify-between mb-0.5">
                                  <Label className={`text-[8px] font-black uppercase tracking-widest block ${category === "Arts" ? "text-amber-600" : "text-blue-600"}`}>
                                    Select Papers:
                                  </Label>
                                  {(subject.minPapers || subject.maxPapers) && (
                                    <span className="text-[7px] font-bold text-slate-400">
                                      {subject.minPapers ? `Min: ${subject.minPapers}` : ""} {subject.maxPapers ? `Max: ${subject.maxPapers}` : ""}
                                    </span>
                                  )}
                                </div>
                                <div className="flex flex-wrap gap-x-3 gap-y-1.5">
                                  {(() => {
                                    const isSpecialSubject = ["PHYSICS", "CHEMISTRY", "BIOLOGY"].includes(subject.name.toUpperCase()) || 
                                                            ["PHY", "CHEM", "BIO"].includes(subject.code?.toUpperCase() || "");
                                    
                                    return subject.papers.map((p, idx) => {
                                      const paperNum = (p.name.match(/\d+/) ? parseInt(p.name.match(/\d+/)![0]) : idx + 1) as PaperOption;
                                      const isPaperSelected = selectedSubjects[subject.id].selectedPapers.includes(paperNum);
                                      const isPaperFixed = isSpecialSubject && paperNum === 1;
                                      
                                      return (
                                        <label 
                                          key={p.id} 
                                          className={`flex items-center gap-1.5 text-[10px] font-bold cursor-pointer group/paper ${(p.isCompulsory && !isSpecialSubject) || isPaperFixed ? 'cursor-default opacity-80' : ''}`}
                                        >
                                          <div className="relative flex items-center">
                                            <input 
                                              type={isSpecialSubject && (paperNum === 2 || paperNum === 3) ? "radio" : "checkbox"}
                                              name={isSpecialSubject && (paperNum === 2 || paperNum === 3) ? `subject-${subject.id}-paper23` : undefined}
                                              className={`h-3 w-3 rounded border-2 transition-all ${
                                                category === "Arts" 
                                                  ? "border-amber-300 text-amber-600 focus:ring-amber-500" 
                                                  : "border-blue-300 text-blue-600 focus:ring-blue-500"
                                              } ${(p.isCompulsory && !isSpecialSubject) || isPaperFixed ? 'bg-slate-200 border-slate-300' : ''} ${isSpecialSubject && (paperNum === 2 || paperNum === 3) ? 'rounded-full' : 'rounded'}`}
                                              checked={isPaperSelected}
                                              disabled={(p.isCompulsory && !isSpecialSubject) || isPaperFixed}
                                              onChange={(e) => togglePaperForSubject(subject.id, paperNum, e.target.checked)}
                                            />
                                            {((p.isCompulsory && !isSpecialSubject) || isPaperFixed) && (
                                              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                                <div className="h-1 w-1 rounded-full bg-slate-400" />
                                              </div>
                                            )}
                                          </div>
                                          <span className={`transition-colors uppercase tracking-wider text-[9px] ${
                                            isPaperSelected 
                                              ? (category === "Arts" ? "text-amber-800" : "text-blue-800") 
                                              : "text-slate-400 group-hover/paper:text-slate-600"
                                          }`}>
                                            {p.name} {((p.isCompulsory && !isSpecialSubject) || isPaperFixed) && <span className="text-[7px] opacity-60">(Fixed)</span>}
                                          </span>
                                        </label>
                                      );
                                    });
                                  })()}
                                </div>
                              </div>
                            )}
                          </div>
                            </div>
                          </div>
                        );
                      });
                    })()
                  )}
                </div>

              {/* Total Entries Display */}
              <div className="md:col-span-2">
                <div className="rounded-xl border-2 border-blue-500 bg-blue-50 px-5 py-3 shadow-sm">
                  <p className="text-sm font-bold text-blue-900 flex items-center justify-center gap-6">
                    <span className="flex items-center gap-2">
                      Subjects Selected: <span className="text-lg font-black text-blue-600 tracking-tighter">{Object.keys(selectedSubjects).length}</span>
                  </span>
                  <span className="h-6 w-px bg-blue-200"></span>
                  <span className="flex items-center gap-2">
                    Total Entries: <span className="text-lg font-black text-blue-600 tracking-tighter">{calculateTotalEntries(selectedSubjects)}</span>
                  </span>
                  </p>
                </div>
              </div>

              <div className="md:col-span-2">
                <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-sm space-y-3">
                  <div>
                    <p className="mb-2 text-[10px] font-black text-slate-500 uppercase tracking-widest">Registration Status</p>
                    <div className="flex flex-wrap gap-2">
                      {getValidationStatus(registrationLevel, selectedSubjects).map((rule, idx) => (
                        <div 
                          key={idx} 
                          className={`flex items-center gap-1.5 px-2 py-1 rounded-md border-2 transition-all ${
                            rule.met 
                              ? "bg-green-50 border-green-100 text-green-700" 
                              : "bg-red-50 border-red-100 text-red-600"
                          }`}
                        >
                          {rule.met ? (
                            <CheckCircle2 className="h-3 w-3" />
                          ) : (
                            <AlertCircle className="h-3 w-3" />
                          )}
                          <span className="text-[10px] font-black uppercase tracking-tight">{rule.label}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className="mb-1.5 text-[10px] font-black text-slate-500 uppercase tracking-widest">Live Preview</p>
                    {registrationPreview.length === 0 ? (
                      <p className="text-xs text-slate-500">No subject papers selected yet.</p>
                    ) : (
                      <div className="space-y-1">
                        {registrationPreview.map((item) => (
                          <p key={item.subjectId} className="text-[11px] font-bold text-slate-700">
                            {item.subjectName} {"\u2192"} <span className="text-blue-600">{item.papers.join(", ")}</span>
                          </p>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <DialogFooter className="mt-4">
              <Button variant="outline" size="sm" onClick={() => setIsAddDialogOpen(false)}>
                Cancel
              </Button>
              <Button size="sm" onClick={handleAddStudent}>Register Student</Button>
          </DialogFooter>
          </div>
        </DialogContent>
        </Dialog>
      </div>
    </div>

    {/* Students Table */}
      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="border-b border-slate-200 pb-3">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div className="space-y-1">
                  <CardTitle className="text-slate-900 text-base font-semibold">Registered Students</CardTitle>
                  <div className="flex items-center gap-4 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                    <div className="min-w-0">
                      <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide mb-0.5">School</p>
                      <p className="text-sm font-semibold text-slate-900 truncate max-w-[200px]">
                        {user?.role === "school" ? user.name : (scopedSchools.find(s => s.code === schoolFilter)?.name || "All Schools")}
                      </p>
                    </div>
                    <div className="h-6 w-px bg-slate-200"></div>
                    <div>
                      <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide mb-0.5">Total Registered</p>
                      <p className="text-lg font-bold text-slate-900 leading-none">{filteredStudents.length}</p>
                    </div>
                  </div>
                </div>
            <div className="flex flex-col gap-2 lg:flex-row">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  placeholder="Search by name or registration..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 border-slate-200 focus:border-slate-400"
                />
              </div>
              {isAdmin && (
                <Select value={zoneFilter} onValueChange={setZoneFilter}>
                  <SelectTrigger className="w-full lg:w-[150px] border-slate-200">
                    <SelectValue placeholder="Filter by zone" />
                  </SelectTrigger>
                  <SelectContent className="border-slate-200">
                    <SelectItem value="all">All Zones</SelectItem>
                    {uniqueZones.map((zone) => (
                      <SelectItem key={zone} value={zone}>
                        {zone}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              <Select value={levelFilter} onValueChange={(value: any) => setLevelFilter(value)}>
                <SelectTrigger className="w-full lg:w-[150px] border-slate-200">
                  <SelectValue placeholder="Filter by level" />
                </SelectTrigger>
                <SelectContent className="border-slate-200">
                  <SelectItem value="all">All Levels</SelectItem>
                  <SelectItem value="UCE">UCE</SelectItem>
                  <SelectItem value="UACE">UACE</SelectItem>
                </SelectContent>
              </Select>
              {isAdmin && scopedSchools.length > 1 && (
                <Select value={schoolFilter} onValueChange={setSchoolFilter}>
                  <SelectTrigger className="w-full lg:w-[200px] border-slate-200">
                    <SelectValue placeholder="Filter by school" />
                  </SelectTrigger>
                  <SelectContent className="border-slate-200">
                    <SelectItem value="all">All Schools</SelectItem>
                    {zoneFilteredSchools.map((school) => (
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
        <CardContent className="pt-4">
          {filteredStudents.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-slate-500 text-sm">No students registered yet</p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-slate-200">
              <Table>
                <TableHeader className="bg-slate-50">
                  <TableRow className="hover:bg-slate-50">
                    {hasAnyRegistrationNumber && <TableHead className="text-slate-600 font-semibold text-xs uppercase tracking-wide">Registration Number</TableHead>}
                    <TableHead className="text-slate-600 font-semibold text-xs uppercase tracking-wide">Student Name</TableHead>
                    <TableHead className="text-slate-600 font-semibold text-xs uppercase tracking-wide">Class</TableHead>
                    <TableHead className="text-slate-600 font-semibold text-xs uppercase tracking-wide">Exam Level</TableHead>
                    <TableHead className="text-slate-600 font-semibold text-xs uppercase tracking-wide text-right">Subjects</TableHead>
                    <TableHead className="text-slate-600 font-semibold text-xs uppercase tracking-wide text-right">Total Entries</TableHead>
                    <TableHead className="text-slate-600 font-semibold text-xs uppercase tracking-wide text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredStudents.map((student) => (
                    <TableRow key={student.id} className="hover:bg-slate-50/80">
                    {hasAnyRegistrationNumber && (
                      <TableCell className="font-mono text-sm text-slate-600">
                        {student.registrationNumber || "-"}
                      </TableCell>
                    )}
                      <TableCell className="font-semibold text-slate-900 text-sm">
                        <div className="flex flex-col gap-0.5">
                          {student.studentName}
                          {student.isAdditional && (
                            <Badge variant="outline" className="w-fit text-[10px] bg-slate-50 text-slate-700 border-slate-200 font-semibold uppercase tracking-wide">
                              Additional Student
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="text-xs">{student.classLevel}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={student.examLevel === "UCE" ? "info" : "default"} className="text-xs">
                          {student.examLevel}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-slate-600 text-right tabular-nums">
                        {getUniqueSubjectCount(student)}
                      </TableCell>
                      <TableCell className="font-semibold text-slate-900 text-sm text-right tabular-nums">
                        {student.totalEntries}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-slate-500 hover:text-slate-900 hover:bg-slate-100"
                            onClick={() => handleViewStudent(student)}
                            title="View student details"
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </Button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-slate-500 hover:text-slate-900 hover:bg-slate-100"
                                title={(student.examLevel === "UCE" ? isUceFinalized : isUaceFinalized) && !student.isAdditional ? "Cannot edit/delete after level finalization" : "Edit or delete student"}
                                disabled={(student.examLevel === "UCE" ? isUceFinalized : isUaceFinalized) && !student.isAdditional && !isAdmin}
                              >
                                <MoreVertical className="h-3.5 w-3.5" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="border-slate-200">
                              <DropdownMenuItem onClick={() => handleEditStudent(student)} className="text-sm">
                                <Edit2 className="h-4 w-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleDeleteStudent(student)} className="text-orange-600 text-sm">
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
                {viewingStudent.registrationNumber && (
                  <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase">Registration Number</p>
                    <p className="text-sm font-medium text-slate-900">
                      {viewingStudent.registrationNumber}
                    </p>
                  </div>
                )}
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
            <Button 
              disabled={(viewingStudent?.examLevel === "UCE" ? isUceFinalized : isUaceFinalized) && !viewingStudent?.isAdditional && !isAdmin}
              title={(viewingStudent?.examLevel === "UCE" ? isUceFinalized : isUaceFinalized) && !viewingStudent?.isAdditional && !isAdmin ? "Cannot edit after finalization" : ""}
              onClick={() => {
                setIsViewModalOpen(false);
                handleEditStudent(viewingStudent!);
              }}
            >
              Edit Student
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Student Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="w-[96vw] sm:max-w-[850px] h-[90vh] max-h-[90vh] overflow-hidden p-0 border-none shadow-2xl" aria-describedby="edit-description">
          <div className="h-full overflow-y-auto px-4 py-4 sm:px-5 sm:py-5 bg-slate-50/50">
          <DialogHeader className="mb-4">
            <div className="flex items-center gap-2.5 mb-1">
              <div className="p-1.5 rounded-lg bg-blue-600 text-white shadow-lg shadow-blue-200">
                <Edit2 className="h-5 w-5" />
              </div>
              <div>
                <DialogTitle className="text-lg font-black text-slate-900">Edit Student</DialogTitle>
                <DialogDescription id="edit-description" className="sr-only">
                  Update student registration details and subject entries.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          
          {validationErrors.length > 0 && (
            <Alert variant="destructive" className="mb-4 border-2 border-blue-100 bg-blue-50/50 rounded-xl">
              <AlertCircle className="h-4 w-4 text-blue-600" />
              <AlertDescription>
                <p className="font-black text-blue-900 mb-0.5 uppercase tracking-wider text-[9px]">Registration Errors</p>
                <ul className="list-disc list-inside space-y-0.5 text-xs font-bold text-blue-800">
                  {validationErrors.map((error, idx) => (
                    <li key={idx}>{error}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          <div className="grid gap-4 md:grid-cols-2 bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
            {/* Student Name */}
            <div className="space-y-1.5 md:col-span-2">
              <Label htmlFor="edit-student-name" className="text-[11px] font-black text-slate-700 uppercase tracking-widest flex items-center gap-2">
                Student Full Name <span className="text-blue-600">*</span>
              </Label>
              <Input
                id="student-name"
                value={studentName}
                onChange={(e) => setStudentName(e.target.value.toUpperCase())}
                placeholder="e.g. NAMUTEBI SHAKIRAH"
                className="h-10 text-sm font-bold border-2 focus-visible:ring-blue-600 rounded-lg transition-all"
              />
            </div>

            {/* Class Level */}
            <div className="space-y-1.5">
              <Label className="text-[11px] font-black text-slate-700 uppercase tracking-widest">Class Level <span className="text-blue-600">*</span></Label>
              <Select value={editClassLevel} onValueChange={(value: any) => setEditClassLevel(value)}>
                <SelectTrigger className="h-10 text-sm font-bold border-2 rounded-lg">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-lg border-2">
                  {CLASS_LEVELS_ARRAY.map((level) => (
                    <SelectItem key={level} value={level} className="font-bold py-2">
                      {level}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Subjects Selection */}
            <div className="space-y-3 md:col-span-2 pt-2">
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <Label className="text-[11px] font-black text-slate-900 uppercase tracking-[0.2em] flex items-center gap-2">
                    <BookOpen className="h-3.5 w-3.5 text-blue-600" />
                    Select Subjects <span className="text-blue-600">*</span>
                  </Label>
                </div>
                
                <div className="text-xs font-bold text-blue-800 bg-blue-50 border-2 border-blue-200 rounded-xl px-4 py-2.5 flex items-start gap-2.5 shadow-sm">
                  <Info className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
                  <p className="leading-relaxed text-[11px]">
                    {(editClassLevel === "S.5" || editClassLevel === "S.6")
                      ? "GP is compulsory + at least one Subsidiary + max 3 main subjects"
                      : "7 compulsory subjects + 1 or 2 optional (Total 8 or 9)"}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-h-[42vh] overflow-y-auto border-2 border-slate-200 rounded-[1.5rem] p-4 bg-slate-50 shadow-inner">
                {filteredSubjectsForEdit.length === 0 ? (
                  <div className="col-span-full py-10 flex flex-col items-center justify-center text-slate-400 gap-2.5 bg-white rounded-2xl border-2 border-dashed border-slate-200">
                    <BookOpen className="h-8 w-8 opacity-20" />
                    <p className="text-[11px] font-bold uppercase tracking-widest">No subjects available</p>
                  </div>
                ) : (
                  (() => {
                    const selectedSubjectData = Object.keys(editSelectedSubjects).map(id => subjects.find(s => s.id === id));
                    const hasSubMathSelected = selectedSubjectData.some(s => s?.code === "SUB_MATHS" || s?.standardCode === "475S");
                    const hasSubIctSelected = selectedSubjectData.some(s => s?.code === "SUB_ICT" || s?.standardCode === "610");

                    return filteredSubjectsForEdit.map((subject) => {
                      const isSelected = !!editSelectedSubjects[subject.id];
                      const isCompulsory = !subject.optional;
                      const category = getSubjectCategory(subject.code);
                      
                      const isSubMath = subject.code === "SUB_MATHS" || subject.standardCode === "475S";
                      const isSubIct = subject.code === "SUB_ICT" || subject.standardCode === "610";
                      const isSubsidiaryDisabled = (isSubMath && hasSubIctSelected) || (isSubIct && hasSubMathSelected);
                      
                      return (
                        <div 
                          key={subject.id} 
                          className={`group relative rounded-2xl border-2 transition-all duration-300 p-4 ${
                            isSelected 
                              ? (category === "Arts" ? "border-amber-500 bg-white shadow-lg shadow-amber-100/30" : "border-blue-600 bg-white shadow-lg shadow-blue-100/30") 
                              : (isSubsidiaryDisabled ? "border-slate-100 bg-slate-50/50 opacity-40 grayscale-[0.5]" : "border-slate-200 bg-white hover:border-slate-300 shadow-sm hover:shadow-md")
                          } scale-[1.0] ${!isSubsidiaryDisabled ? 'hover:scale-[1.01]' : ''}`}
                        >
                          <div className="flex flex-col h-full gap-3">
                            <div className="flex items-start justify-between gap-2.5">
                              <div className="flex flex-col gap-1 min-w-0">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className={`text-[9px] font-black font-mono px-1.5 py-0.5 rounded-md uppercase tracking-tighter shadow-sm ${
                                    isSelected 
                                      ? (category === "Arts" ? "bg-amber-600 text-white" : "bg-blue-600 text-white") 
                                      : "bg-slate-100 text-slate-600"
                                  }`}>
                                    {subject.standardCode}
                                  </span>
                                  {isCompulsory ? (
                                    <Badge className="bg-slate-900 text-white border-none text-[8px] px-1.5 h-4 font-black uppercase tracking-widest shadow-sm">
                                      COMPULSORY
                                    </Badge>
                                  ) : (
                                    <Badge variant="outline" className={`text-[8px] px-1.5 h-4 font-bold uppercase tracking-widest border-2 ${
                                      category === "Arts" ? "text-amber-600 border-amber-100 bg-amber-50/50" : "text-blue-600 border-blue-100 bg-blue-50/50"
                                    }`}>
                                      OPTIONAL
                                    </Badge>
                                  )}
                                </div>
                                <Label 
                                  htmlFor={`edit-${subject.id}`} 
                                  className={`font-black text-[13px] leading-tight transition-colors ${!isSubsidiaryDisabled ? 'cursor-pointer' : 'cursor-not-allowed'} ${
                                    isSelected ? (category === "Arts" ? "text-amber-900" : "text-blue-900") : "text-slate-800"
                                  }`}
                                >
                                  {subject.name}
                                </Label>
                              </div>

                              <Checkbox
                                id={`edit-${subject.id}`}
                                checked={isSelected}
                                onCheckedChange={() => toggleSubjectForEdit(subject.id)}
                                disabled={isCompulsory || isSubsidiaryDisabled}
                                className={`h-6 w-6 rounded-md border-2 transition-all duration-200 ${
                                  isSelected 
                                    ? (category === "Arts" ? "bg-amber-600 border-amber-600 text-white shadow-md shadow-amber-200" : "bg-blue-600 border-blue-600 text-white shadow-md shadow-blue-200") 
                                    : (isSubsidiaryDisabled ? "border-slate-200 bg-slate-100 cursor-not-allowed" : "border-slate-300 bg-white hover:border-blue-400")
                                }`}
                              />
                            </div>
                            
                            <div className="mt-auto pt-3 border-t-2 border-slate-50">
                              <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-1">
                                <BookOpen className={`h-3 w-3 ${isSelected ? (category === "Arts" ? "text-amber-500" : "text-blue-500") : "text-slate-300"}`} />
                                <p className={`text-[10px] font-bold leading-none ${isSelected ? (category === "Arts" ? "text-amber-800" : "text-blue-800") : "text-slate-500"}`}>
                                  {subject.papers.length} {subject.papers.length === 1 ? 'Paper' : 'Papers'}
                                </p>
                              </div>
                              
                              {isSelected && (
                                <Badge className={`${category === "Arts" ? "bg-amber-100 text-amber-700" : "bg-blue-100 text-blue-700"} border-none text-[9px] px-1.5 h-5 font-black rounded-md`}>
                                  {editSelectedSubjects[subject.id].selectedPapers.length} Selected
                                </Badge>
                              )}
                            </div>

                            {/* Dynamic Paper Selection Logic for Edit Modal */}
                            {isSelected && subject.papers.length > 0 && (
                              <div className={`mt-2.5 space-y-1.5 p-2.5 rounded-xl border ${category === "Arts" ? "bg-amber-50/50 border-amber-100" : "bg-blue-50/50 border-blue-100"}`}>
                                <div className="flex items-center justify-between mb-0.5">
                                  <Label className={`text-[8px] font-black uppercase tracking-widest block ${category === "Arts" ? "text-amber-600" : "text-blue-600"}`}>
                                    Select Papers:
                                  </Label>
                                  {(subject.minPapers || subject.maxPapers) && (
                                    <span className="text-[7px] font-bold text-slate-400">
                                      {subject.minPapers ? `Min: ${subject.minPapers}` : ""} {subject.maxPapers ? `Max: ${subject.maxPapers}` : ""}
                                    </span>
                                  )}
                                </div>
                                <div className="flex flex-wrap gap-x-3 gap-y-1.5">
                                  {(() => {
                                    const isSpecialSubject = ["PHYSICS", "CHEMISTRY", "BIOLOGY"].includes(subject.name.toUpperCase()) || 
                                                            ["PHY", "CHEM", "BIO"].includes(subject.code?.toUpperCase() || "");
                                    
                                    return subject.papers.map((p, idx) => {
                                      const paperNum = (p.name.match(/\d+/) ? parseInt(p.name.match(/\d+/)![0]) : idx + 1) as PaperOption;
                                      const isPaperSelected = editSelectedSubjects[subject.id].selectedPapers.includes(paperNum);
                                      const isPaperFixed = isSpecialSubject && paperNum === 1;
                                      
                                      return (
                                        <label 
                                          key={p.id} 
                                          className={`flex items-center gap-1.5 text-[10px] font-bold cursor-pointer group/paper ${(p.isCompulsory && !isSpecialSubject) || isPaperFixed ? 'cursor-default opacity-80' : ''}`}
                                        >
                                          <div className="relative flex items-center">
                                            <input 
                                              type={isSpecialSubject && (paperNum === 2 || paperNum === 3) ? "radio" : "checkbox"}
                                              name={isSpecialSubject && (paperNum === 2 || paperNum === 3) ? `edit-subject-${subject.id}-paper23` : undefined}
                                              className={`h-3 w-3 rounded border-2 transition-all ${
                                                category === "Arts" 
                                                  ? "border-amber-300 text-amber-600 focus:ring-amber-500" 
                                                  : "border-blue-300 text-blue-600 focus:ring-blue-500"
                                              } ${(p.isCompulsory && !isSpecialSubject) || isPaperFixed ? 'bg-slate-200 border-slate-300' : ''} ${isSpecialSubject && (paperNum === 2 || paperNum === 3) ? 'rounded-full' : 'rounded'}`}
                                              checked={isPaperSelected}
                                              disabled={(p.isCompulsory && !isSpecialSubject) || isPaperFixed}
                                              onChange={(e) => togglePaperForEdit(subject.id, paperNum, e.target.checked)}
                                            />
                                            {((p.isCompulsory && !isSpecialSubject) || isPaperFixed) && (
                                              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                                <div className="h-1 w-1 rounded-full bg-slate-400" />
                                              </div>
                                            )}
                                          </div>
                                          <span className={`transition-colors uppercase tracking-wider text-[9px] ${
                                            isPaperSelected 
                                              ? (category === "Arts" ? "text-amber-800" : "text-blue-800") 
                                              : "text-slate-400 group-hover/paper:text-slate-600"
                                          }`}>
                                            {p.name} {((p.isCompulsory && !isSpecialSubject) || isPaperFixed) && <span className="text-[7px] opacity-60">(Fixed)</span>}
                                          </span>
                                        </label>
                                      );
                                    });
                                  })()}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  });
                })()
              )}
            </div>
              </div>

            {/* Total Entries Display */}
            <div className="md:col-span-2">
              <div className="rounded-xl border-2 border-blue-500 bg-blue-50 px-5 py-3 shadow-sm">
                <p className="text-sm font-bold text-blue-900 flex items-center justify-center gap-6">
                  <span className="flex items-center gap-2">
                    Subjects Selected: <span className="text-lg font-black text-blue-600 tracking-tighter">{Object.keys(editSelectedSubjects).length}</span>
                  </span>
                  <span className="h-6 w-px bg-blue-200"></span>
                  <span className="flex items-center gap-2">
                    Total Entries: <span className="text-lg font-black text-blue-600 tracking-tighter">{calculateTotalEntries(editSelectedSubjects)}</span>
                  </span>
                </p>
              </div>
            </div>

            <div className="md:col-span-2">
              <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-sm space-y-3">
                <div>
                  <p className="mb-2 text-[10px] font-black text-slate-500 uppercase tracking-widest">Registration Status</p>
                  <div className="flex flex-wrap gap-2">
                    {getValidationStatus((editClassLevel === "S.5" || editClassLevel === "S.6") ? "UACE" : "UCE", editSelectedSubjects).map((rule, idx) => (
                      <div 
                        key={idx} 
                        className={`flex items-center gap-1.5 px-2 py-1 rounded-md border-2 transition-all ${
                          rule.met 
                            ? "bg-green-50 border-green-100 text-green-700" 
                            : "bg-red-50 border-red-100 text-red-600"
                        }`}
                      >
                        {rule.met ? (
                          <CheckCircle2 className="h-3 w-3" />
                        ) : (
                          <AlertCircle className="h-3 w-3" />
                        )}
                        <span className="text-[10px] font-black uppercase tracking-tight">{rule.label}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="mb-1.5 text-[10px] font-black text-slate-500 uppercase tracking-widest">Live Preview</p>
                  {editRegistrationPreview.length === 0 ? (
                    <p className="text-xs text-slate-500">No subject papers selected yet.</p>
                  ) : (
                    <div className="space-y-1">
                      {editRegistrationPreview.map((item) => (
                        <p key={item.subjectId} className="text-[11px] font-bold text-slate-700">
                          {item.subjectName} {"\u2192"} <span className="text-blue-600">{item.papers.join(", ")}</span>
                        </p>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="mt-4">
            <Button variant="outline" size="sm" onClick={() => {
              setIsEditModalOpen(false);
              setValidationErrors([]);
            }}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleSaveEdit}>
              Save Changes
            </Button>
          </DialogFooter>
          </div>
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
