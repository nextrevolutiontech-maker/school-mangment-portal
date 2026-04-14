export interface Subject {
  id: string;
  name: string;
  code: string;
  educationLevel: "UCE" | "UACE" | "BOTH";
  optional: boolean;
}
