import { useMemo, useState } from "react";
import { BookOpen, PencilLine, PlusCircle, ShieldCheck, Trash2, Layers } from "lucide-react";
import { useAuth } from "../auth-context";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Badge } from "../ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";
import { toast } from "sonner";
import { SubjectPaper } from "../../types/subject";

interface SubjectsManagementProps {
  onPageChange: (page: string) => void;
}

export function SubjectsManagement({ onPageChange }: SubjectsManagementProps) {
  const { user, subjects, students, addSubject, updateSubject, deleteSubject } = useAuth();

  // Permission check - admin only
  if (user?.role !== "admin") {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-center">
          <h2 className="mb-2 text-xl font-bold text-slate-900">Access Denied</h2>
          <p className="text-slate-500">Only administrators can manage subjects.</p>
        </div>
      </div>
    );
  }

  const [editingSubjectId, setEditingSubjectId] = useState<string | null>(null);
  const [levelFilter, setLevelFilter] = useState<"UCE" | "UACE">("UCE");
  const [newSubject, setNewSubject] = useState({
    name: "",
    code: "",
    standardCode: "",
    educationLevel: "UCE" as "UCE" | "UACE",
    optional: "yes" as "yes" | "no",
    papers: [] as SubjectPaper[],
    minPapers: "" as string | number,
    maxPapers: "" as string | number,
  });

  const [paperName, setPaperName] = useState("");
  const [paperType, setPaperType] = useState<"compulsory" | "optional">("compulsory");

  const addPaper = () => {
    if (!paperName.trim()) {
      toast.error("Please enter a paper name");
      return;
    }
    
    const paper: SubjectPaper = {
      id: `paper-${Date.now()}`,
      name: paperName.trim(),
      isCompulsory: paperType === "compulsory"
    };

    const updatedPapers = [...newSubject.papers, paper];
    
    // Auto-rule: If only 1 paper, it must be compulsory
    if (updatedPapers.length === 1) {
      updatedPapers[0].isCompulsory = true;
    }

    setNewSubject({ ...newSubject, papers: updatedPapers });
    setPaperName("");
  };

  const removePaper = (id: string) => {
    const updatedPapers = newSubject.papers.filter(p => p.id !== id);
    
    // Re-apply rule: If only 1 paper remains, it must be compulsory
    if (updatedPapers.length === 1) {
      updatedPapers[0].isCompulsory = true;
    }
    
    setNewSubject({ ...newSubject, papers: updatedPapers });
  };

  const togglePaperCompulsory = (id: string) => {
    // If only 1 paper, it must stay compulsory
    if (newSubject.papers.length === 1) return;

    setNewSubject({
      ...newSubject,
      papers: newSubject.papers.map(p => 
        p.id === id ? { ...p, isCompulsory: !p.isCompulsory } : p
      )
    });
  };

  const stats = useMemo(
    () => [
      { label: "Total Standard Subjects", value: subjects.length },
      {
        label: "UCE Subjects",
        value: subjects.filter((subject) => subject.educationLevel === "UCE").length,
      },
      {
        label: "UACE Subjects",
        value: subjects.filter((subject) => subject.educationLevel === "UACE").length,
      },
    ],
    [subjects],
  );

  const subjectTotals = useMemo(
    () =>
      students.reduce<Record<string, number>>((acc, student) => {
        const keys = new Set(
          (student.subjects ?? []).map(
            (subject) => `${student.examLevel}:${subject.subjectCode.toUpperCase()}`,
          ),
        );

        keys.forEach((key) => {
          acc[key] = (acc[key] || 0) + 1;
        });

        return acc;
      }, {}),
    [students],
  );

  const filteredSubjects = useMemo(
    () =>
      subjects
        .filter((subject) => subject.educationLevel === levelFilter)
        .sort((left, right) => left.code.localeCompare(right.code)),
    [subjects, levelFilter],
  );

  const handleSubmitSubject = () => {
    if (!newSubject.name.trim() || !newSubject.code.trim() || !newSubject.standardCode.trim()) {
      toast.error("Subject name, short code, and standard code are required");
      return;
    }

    const exists = subjects.some(
      (subject) =>
        (
          subject.code.toUpperCase() === newSubject.code.trim().toUpperCase() ||
          subject.standardCode.toUpperCase() === newSubject.standardCode.trim().toUpperCase()
        ) &&
        subject.educationLevel === newSubject.educationLevel &&
        subject.id !== editingSubjectId,
    );
    if (exists) {
      toast.error("This short code or standard code already exists for the selected level");
      return;
    }

    if (editingSubjectId) {
      updateSubject(editingSubjectId, {
        name: newSubject.name,
        code: newSubject.code,
        standardCode: newSubject.standardCode,
        educationLevel: newSubject.educationLevel,
        optional: newSubject.optional === "yes",
        papers: newSubject.papers,
        minPapers: newSubject.minPapers ? Number(newSubject.minPapers) : undefined,
        maxPapers: newSubject.maxPapers ? Number(newSubject.maxPapers) : undefined,
      });
    } else {
      addSubject({
        name: newSubject.name,
        code: newSubject.code,
        standardCode: newSubject.standardCode,
        educationLevel: newSubject.educationLevel,
        optional: newSubject.optional === "yes",
        papers: newSubject.papers,
        minPapers: newSubject.minPapers ? Number(newSubject.minPapers) : undefined,
        maxPapers: newSubject.maxPapers ? Number(newSubject.maxPapers) : undefined,
      });
    }

    setNewSubject({
      name: "",
      code: "",
      standardCode: "",
      educationLevel: "UCE",
      optional: "yes",
      papers: [],
      minPapers: "",
      maxPapers: "",
    });
    setEditingSubjectId(null);

    toast.success(
      editingSubjectId
        ? "Standard subject updated successfully"
        : "Standard subject added to admin registry",
    );
  };

  return (
    <div className="mx-auto flex w-full max-w-[1240px] flex-col gap-6 anim-fade-up">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-2">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-orange-500">
            Subjects Registry
          </p>
          <h1 className="text-3xl font-bold text-shimmer">Subjects Management</h1>
          <p className="max-w-3xl text-slate-500">
            Manage the standard subject registry used during student registration.
          </p>
        </div>
        <Button variant="outline" onClick={() => onPageChange("students")}>
          Go to Student Entries
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {stats.map((item) => (
          <Card key={item.label} className="border-l-4 border-l-blue-500">
            <CardContent className="pt-6">
              <p className="text-sm text-slate-500">{item.label}</p>
              <p className="mt-2 text-3xl font-bold text-slate-900">{item.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader className="border-b border-slate-200">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 text-blue-700">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <CardTitle>Subject Setup</CardTitle>
              <CardDescription>Define standard subject names and codes.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="grid gap-4 pt-6 md:grid-cols-2 xl:grid-cols-5">
          <div className="space-y-2">
            <Label htmlFor="subjectCode">Short Code</Label>
            <Input
              id="subjectCode"
              placeholder="e.g. ECON"
              value={newSubject.code}
              onChange={(event) => setNewSubject({ ...newSubject, code: event.target.value.toUpperCase() })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="standardCode">Standard Code</Label>
            <Input
              id="standardCode"
              placeholder="e.g. 268"
              value={newSubject.standardCode}
              onChange={(event) => setNewSubject({ ...newSubject, standardCode: event.target.value.toUpperCase() })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="subjectName">Subject Name</Label>
            <Input
              id="subjectName"
              placeholder="e.g. Economics"
              value={newSubject.name}
              onChange={(event) => setNewSubject({ ...newSubject, name: event.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label>Education Level</Label>
            <Select
              value={newSubject.educationLevel}
              onValueChange={(value: "UCE" | "UACE") =>
                setNewSubject({ ...newSubject, educationLevel: value })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="UCE">UCE</SelectItem>
                <SelectItem value="UACE">UACE</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Subject Type</Label>
            <Select
              value={newSubject.optional}
              onValueChange={(value: "yes" | "no") => setNewSubject({ ...newSubject, optional: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="no">Compulsory</SelectItem>
                <SelectItem value="yes">Optional</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Subject Papers Section */}
          <div className="md:col-span-2 xl:col-span-5 space-y-4 pt-4 border-t border-slate-100 mt-2">
            <div className="flex items-center gap-2 text-slate-900 font-semibold">
              <Layers className="h-4 w-4 text-blue-500" />
              <h3>Subject Papers Configuration</h3>
            </div>

            {newSubject.papers.length > 1 && (
              <div className="grid gap-4 md:grid-cols-2 p-4 bg-blue-50/50 rounded-xl border border-blue-100">
                <div className="space-y-2">
                  <Label htmlFor="minPapers">Min Papers Selection</Label>
                  <Input
                    id="minPapers"
                    type="number"
                    placeholder="e.g. 2"
                    value={newSubject.minPapers}
                    onChange={(e) => setNewSubject({ ...newSubject, minPapers: e.target.value })}
                  />
                  <p className="text-[10px] text-slate-500 italic">Minimum number of papers a student must select for this subject.</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="maxPapers">Max Papers Selection</Label>
                  <Input
                    id="maxPapers"
                    type="number"
                    placeholder="e.g. 3"
                    value={newSubject.maxPapers}
                    onChange={(e) => setNewSubject({ ...newSubject, maxPapers: e.target.value })}
                  />
                  <p className="text-[10px] text-slate-500 italic">Maximum number of papers a student can select for this subject.</p>
                </div>
              </div>
            )}
            
            <div className="grid gap-4 md:grid-cols-4 items-end bg-slate-50/50 p-4 rounded-xl border border-slate-100">
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="paperName">Paper Name</Label>
                <Input
                  id="paperName"
                  placeholder="e.g. Paper 1"
                  value={paperName}
                  onChange={(e) => setPaperName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Paper Type</Label>
                <Select
                  value={paperType}
                  onValueChange={(value: "compulsory" | "optional") => setPaperType(value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="compulsory">Compulsory</SelectItem>
                    <SelectItem value="optional">Optional</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button type="button" variant="secondary" onClick={addPaper}>
                <PlusCircle className="h-4 w-4" />
                Add Paper
              </Button>
            </div>

            {newSubject.papers.length > 0 && (
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {newSubject.papers.map((paper) => (
                  <div 
                    key={paper.id} 
                    className="flex items-center justify-between p-3 bg-white border border-slate-200 rounded-lg shadow-sm group hover:border-blue-200 transition-colors"
                  >
                    <div className="flex flex-col gap-1">
                      <span className="text-sm font-bold text-slate-900">{paper.name}</span>
                      <Badge 
                        variant={paper.isCompulsory ? "success" : "secondary"}
                        className="w-fit text-[10px] py-0 px-1.5 cursor-pointer"
                        onClick={() => togglePaperCompulsory(paper.id)}
                      >
                        {paper.isCompulsory ? "Compulsory" : "Optional"}
                      </Badge>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => removePaper(paper.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
            
            {newSubject.papers.length === 0 && (
              <p className="text-xs text-slate-500 italic">No papers defined. Add papers above to configure selection rules.</p>
            )}
          </div>

          <div className="md:col-span-2 xl:col-span-5 flex justify-end pt-4">
            <Button onClick={handleSubmitSubject} className="w-full sm:w-auto">
              <PlusCircle className="h-4 w-4" />
              {editingSubjectId ? "Save Subject Changes" : "Add Standard Subject"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="border-b border-slate-200">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-50 text-amber-700">
                <BookOpen className="h-5 w-5" />
              </div>
              <div>
                <CardTitle>Registered Standard Subjects</CardTitle>
                <CardDescription>Subjects available for school registration forms.</CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">Filter Level:</Label>
              <Select value={levelFilter} onValueChange={(val: any) => setLevelFilter(val)}>
                <SelectTrigger className="w-[120px] bg-slate-50 border-slate-200 rounded-xl h-10 font-bold">
                  <SelectValue placeholder="Level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="UCE">UCE</SelectItem>
                  <SelectItem value="UACE">UACE</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Short Code</TableHead>
                  <TableHead>Standard Code</TableHead>
                  <TableHead>Subject Name</TableHead>
                  <TableHead>Level</TableHead>
                  <TableHead className="text-right">Totals</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSubjects.map((subject) => (
                  <TableRow key={subject.id}>
                    <TableCell className="font-mono text-xs">{subject.code}</TableCell>
                    <TableCell className="font-mono text-xs">{subject.standardCode}</TableCell>
                    <TableCell className="font-semibold text-slate-900">{subject.name}</TableCell>
                    <TableCell>
                      {subject.educationLevel === "UCE" ? (
                        <Badge variant="secondary" className="bg-blue-50 text-blue-700 border-blue-100 font-bold">UCE</Badge>
                      ) : (
                        <Badge variant="default" className="bg-indigo-600 text-white font-bold">UACE</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right font-semibold text-slate-900">
                      {subjectTotals[`${subject.educationLevel}:${subject.code.toUpperCase()}`] ?? 0}
                    </TableCell>
                    <TableCell>
                      <Badge variant={subject.optional ? "outline" : "success"}>
                        {subject.optional ? "Optional" : "Compulsory"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setEditingSubjectId(subject.id);
                            setNewSubject({
                              name: subject.name,
                              code: subject.code,
                              standardCode: subject.standardCode,
                              educationLevel: subject.educationLevel,
                              optional: subject.optional ? "yes" : "no",
                              papers: subject.papers,
                              minPapers: subject.minPapers ?? "",
                              maxPapers: subject.maxPapers ?? "",
                            });
                          }}
                        >
                          <PencilLine className="h-4 w-4" />
                          Edit
                        </Button>
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          onClick={() => {
                            if (window.confirm(`Are you sure you want to delete ${subject.name}?`)) {
                              deleteSubject(subject.id);
                              toast.success("Subject deleted successfully");
                            }
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                          Delete
                        </Button>
                      </div>
                    </TableCell>
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
