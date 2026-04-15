export type ClassLevel = "S.1" | "S.2" | "S.3" | "S.4" | "S.5" | "S.6";
export type EducationLevel = "UCE" | "UACE";

export interface ClassInfo {
  level: ClassLevel;
  educationLevel: EducationLevel;
  description: string;
}

// Fixed system - predefined by super admin
export const PREDEFINED_CLASSES: ClassInfo[] = [
  { level: "S.1", educationLevel: "UCE", description: "Senior 1 - O' Level" },
  { level: "S.2", educationLevel: "UCE", description: "Senior 2 - O' Level" },
  { level: "S.3", educationLevel: "UCE", description: "Senior 3 - O' Level" },
  { level: "S.4", educationLevel: "UCE", description: "Senior 4 - O' Level" },
  { level: "S.5", educationLevel: "UACE", description: "Senior 5 - A' Level" },
  { level: "S.6", educationLevel: "UACE", description: "Senior 6 - A' Level" },
];

export interface Student {
  id: string;
  registrationNumber: string; // Format: WAK/YY-SCHOOLCODE/STUDENTNO (e.g., WAK/26-0001-001)
  name: string;
  classLevel: ClassLevel;
  schoolCode: string;
  schoolId: string;
  academicYear: string;
  subjects: StudentSubject[];
  totalEntries: number;
  registrationDate: string;
}

export interface StudentSubject {
  subjectId: string;
  subjectCode: string; // Standard code (e.g., 456/1 for Maths)
  subjectName: string;
  educationLevel: EducationLevel;
  paper: "Paper 1" | "Paper 2" | "Paper 3" | "Paper 4"; // For subjects with multiple papers
  entryCount: number; // Number of students taking this entry for this subject
}
