import { useMemo, useState } from "react";
import { BookOpen, PencilLine, PlusCircle, ShieldCheck } from "lucide-react";
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

interface SubjectsManagementProps {
  onPageChange: (page: string) => void;
}

export function SubjectsManagement({ onPageChange }: SubjectsManagementProps) {
  const { user, subjects, students, addSubject, updateSubject } = useAuth();

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
  const [newSubject, setNewSubject] = useState({
    name: "",
    code: "",
    standardCode: "",
    educationLevel: "UCE" as "UCE" | "UACE",
    optional: "yes" as "yes" | "no",
  });

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

  const orderedSubjects = useMemo(
    () =>
      [...subjects].sort((left, right) => {
        if (left.educationLevel !== right.educationLevel) {
          return left.educationLevel.localeCompare(right.educationLevel);
        }
        return left.code.localeCompare(right.code);
      }),
    [subjects],
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
      });
    } else {
      addSubject({
        name: newSubject.name,
        code: newSubject.code,
        standardCode: newSubject.standardCode,
        educationLevel: newSubject.educationLevel,
        optional: newSubject.optional === "yes",
      });
    }

    setNewSubject({
      name: "",
      code: "",
      standardCode: "",
      educationLevel: "UCE",
      optional: "yes",
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
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-red-500">
            Subjects Registry
          </p>
          <h1 className="text-3xl font-bold text-shimmer">Subjects Management</h1>
          <p className="max-w-3xl text-slate-500">
            Association admin sets up the standard subject list here. Schools only select from this registry when registering students for UCE or UACE.
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
              <CardTitle>Association-Controlled Subject Setup</CardTitle>
              <CardDescription>
                Only admin should define and edit standard subject names, short
                codes, and standard codes. Once saved here, they become visible to all
                schools for the matching level.
              </CardDescription>
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
          <div className="md:col-span-2 xl:col-span-4 flex justify-end">
            <Button onClick={handleSubmitSubject}>
              <PlusCircle className="h-4 w-4" />
              {editingSubjectId ? "Save Subject Changes" : "Add Standard Subject"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-50 text-amber-700">
              <BookOpen className="h-5 w-5" />
            </div>
            <div>
              <CardTitle>Registered Standard Subjects</CardTitle>
              <CardDescription>
                These are the subjects schools see when entering student registrations.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Short Code</TableHead>
                  <TableHead>Standard Code</TableHead>
                  <TableHead>Subject Name</TableHead>
                  <TableHead>Level</TableHead>
                  <TableHead>Totals</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orderedSubjects.map((subject) => (
                  <TableRow key={subject.id}>
                    <TableCell className="font-mono text-xs">{subject.code}</TableCell>
                    <TableCell className="font-mono text-xs">{subject.standardCode}</TableCell>
                    <TableCell className="font-semibold text-slate-900">{subject.name}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{subject.educationLevel}</Badge>
                    </TableCell>
                    <TableCell className="font-semibold text-slate-900">
                      {subjectTotals[`${subject.educationLevel}:${subject.code.toUpperCase()}`] ?? 0}
                    </TableCell>
                    <TableCell>
                      <Badge variant={subject.optional ? "outline" : "success"}>
                        {subject.optional ? "Optional" : "Compulsory"}
                      </Badge>
                    </TableCell>
                    <TableCell>
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
                          });
                        }}
                      >
                        <PencilLine className="h-4 w-4" />
                        Edit
                      </Button>
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
