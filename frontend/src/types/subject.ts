export interface Subject {
  id: string;
  name: string;
  code: string; // Abbreviation for display (e.g., MTH)
  educationLevel: "UCE" | "UACE" | "BOTH";
  optional: boolean;
  standardCode?: string; // Standard WAKISSHA code (e.g., 456/1 for Maths)
  papers?: number; // Number of papers for this subject (1-4)
}

// Standard WAKISSHA Subject Codes
export const STANDARD_SUBJECT_CODES: Record<string, string> = {
  "MTH": "456/1", // Mathematics
  "ENG": "456/2", // English Language
  "PHY": "612/1", // Physics
  "CHE": "612/2", // Chemistry
  "BIO": "612/3", // Biology
  "SM": "456/3",  // Subsidiary Mathematics
  "ICT": "456/4", // Computer Science/ICT
  "HIST": "456/5", // History
  "GEO": "456/6",  // Geography
  "CRE": "456/7",  // Christian Religious Education
  "IRE": "456/8",  // Islamic Religious Education
  "LIT": "456/9",  // Literature in English
  "KISWA": "456/10", // Kiswahili
  "ART": "456/11", // Art & Design
  "AGRIC": "456/12", // Agriculture
  "FN": "456/13",  // Family & Consumer Science
  "TD": "456/14",  // Technology & Design
  "GP": "456/15",  // General Paper (UACE)
  "FRENCH": "456/16", // French
  "GERMAN": "456/17", // German
  "ARABIC": "456/18", // Arabic
  "LUGANDA": "456/19", // Luganda
  "RUNY": "456/20", // Runyankole/Rukiga
  "LUSOGA": "456/21", // Lusoga
  "ENT": "456/22", // Entrepreneurship
  "ECN": "456/23", // Economics
};
