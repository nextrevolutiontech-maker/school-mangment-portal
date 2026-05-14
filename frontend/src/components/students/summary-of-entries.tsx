import { useMemo, useState } from "react";
import { Button } from "../ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "../ui/dialog";
import { useAuth, SchoolRecord, StudentRecord, Subject, Invoice } from "../auth-context";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { FileText, ChevronDown, CheckCircle, Lock, AlertCircle, Download } from "lucide-react";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "../ui/dropdown-menu";
import { Badge } from "../ui/badge";
import { Alert, AlertDescription } from "../ui/alert";
import { toast } from "sonner";

function numberToWords(num: number): string {
  const ones = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine"];
  const teens = ["Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
  const tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];
  const scales = ["", "Thousand", "Million", "Billion"];

  function convertLessThanOneThousand(n: number): string {
    let result = "";
    const hundreds = Math.floor(n / 100);
    const remainder = n % 100;

    if (hundreds > 0) {
      result += `${ones[hundreds]} Hundred`;
      if (remainder > 0) result += " ";
    }

    if (remainder > 0) {
      if (remainder < 20) {
        result += teens[remainder - 10] || ones[remainder];
      } else {
        result += tens[Math.floor(remainder / 10)];
        const onesDigit = remainder % 10;
        if (onesDigit > 0) {
          result += ` ${ones[onesDigit]}`;
        }
      }
    }

    return result;
  }

  if (num === 0) return "Zero Shillings Only";

  let words = "";
  let scaleIndex = 0;
  let remaining = num;

  while (remaining > 0) {
    const chunk = remaining % 1000;
    if (chunk > 0) {
      const chunkWords = convertLessThanOneThousand(chunk);
      words = `${chunkWords} ${scales[scaleIndex]} ${words}`;
    }
    remaining = Math.floor(remaining / 1000);
    scaleIndex++;
  }

  return `${words.trim()} Shillings Only`;
}

interface SummaryOfEntriesProps {
  school: SchoolRecord;
  students: StudentRecord[];
  subjects: Subject[];
  level: "UCE" | "UACE" | "Combined";
  invoices: Invoice[];
}

export function SummaryOfEntries({ school, students, subjects, level, invoices }: SummaryOfEntriesProps) {
  const filteredStudents = useMemo(() => {
    if (level === "Combined") return students;
    return students.filter(s => s.examLevel === level);
  }, [students, level]);

  const stats = useMemo(() => {
    const studentSubjects = filteredStudents.flatMap((s) => s.subjects.map(sub => ({
      ...sub,
      examLevel: s.examLevel
    })));
    
    // Group subjects by code and exam level to avoid mixing UCE/UACE with same codes
    const subjectCounts = studentSubjects.reduce((acc, sub) => {
      const key = `${sub.examLevel}:${sub.subjectCode}`;
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const subjectList = Array.from(new Set(studentSubjects.map(s => `${s.examLevel}:${s.subjectCode}`)))
      .map(key => {
        const [examLevel, subjectCode] = key.split(":");
        const subject = subjects.find(s => s.code === subjectCode && s.educationLevel === examLevel);
        return {
          code: subjectCode,
          name: subject?.name || "Unknown Subject",
          count: subjectCounts[key],
          examLevel
        };
      })
      .sort((a, b) => a.code.localeCompare(b.code));

    return {
      totalStudents: filteredStudents.length,
      subjectList,
      totalEntries: filteredStudents.reduce((sum, s) => sum + s.totalEntries, 0),
      subjectCountsMap: new Map(Object.entries(subjectCounts).map(([k, v]) => {
        const [examLevel, subjectCode] = k.split(":");
        return [`${examLevel}:${subjectCode}`, v];
      }))
    };
  }, [filteredStudents, subjects]);

  const subjectCountsMap = stats.subjectCountsMap;

  const foreignLanguages = ["309", "314", "337", "396"];
  const localLanguages = ["335", "336", "345", "355", "365"];

  const uceSubjects = useMemo(() => subjects.filter(s => s.educationLevel === "UCE"), [subjects]);
  const uaceSubjects = useMemo(() => subjects.filter(s => s.educationLevel === "UACE"), [subjects]);

  const levelSubjects = useMemo(() => {
    if (level === "UCE") return uceSubjects;
    if (level === "UACE") return uaceSubjects;
    return subjects;
  }, [level, uceSubjects, uaceSubjects, subjects]);

  // Financial calculations based on new quantity fields
  const pricing = {
    uceMarkingGuide: 0,
    uaceMarkingGuide: 0,
    answerBooklet: 25000,
    studentFee: 27000,
    schoolRegistrationFee: 25000,
  };

  const schoolRegFeeTotal = useMemo(() => {
    // Check if any invoice exists with "School Registration Fee"
    const hasRegistrationInvoice = invoices.some(inv => 
      inv.schoolCode === school.code && inv.items.some(item => item.description === "School Registration Fee")
    );
    // Only include if no level was finalised before and no registration invoice exists
    return (!school.uceRegistrationFinalised && !school.uaceRegistrationFinalised && !hasRegistrationInvoice) ? pricing.schoolRegistrationFee : 0;
  }, [school, invoices]);

  const studentFeeTotal = filteredStudents.length * pricing.studentFee;
  const uceMarkingGuideTotal = (level !== "UACE" && school.uceMarkingGuideQuantity) ? school.uceMarkingGuideQuantity * pricing.uceMarkingGuide : 0;
  const uaceArtsMarkingGuideTotal = (level !== "UCE" && school.uaceArtsMarkingGuideQuantity) ? school.uaceArtsMarkingGuideQuantity * pricing.uaceMarkingGuide : 0;
  const uaceSciencesMarkingGuideTotal = (level !== "UCE" && school.uaceSciencesMarkingGuideQuantity) ? school.uaceSciencesMarkingGuideQuantity * pricing.uaceMarkingGuide : 0;
  const answerBookletsTotal = school.answerBookletsQuantity ? school.answerBookletsQuantity * pricing.answerBooklet : 0;

  const totalAmount = schoolRegFeeTotal + studentFeeTotal + uceMarkingGuideTotal + uaceArtsMarkingGuideTotal + uaceSciencesMarkingGuideTotal + answerBookletsTotal;

  const handleDownloadPDF = () => {
    const doc = new jsPDF({
      orientation: "portrait",
      unit: "pt",
      format: "a4",
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 30; // Reduced margin
    let yPos = 30; // Reduced starting yPos

    // Header
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12); // Slightly smaller header
    doc.setTextColor(0, 0, 0); // Proper black
    doc.text("WAKISSHA JOINT MOCK EXAMINATIONS", pageWidth / 2, yPos, { align: "center" });
    yPos += 15;

    doc.setFontSize(10); // Slightly smaller
    doc.setTextColor(0, 0, 0);
    doc.text(`${level === "Combined" ? "UCE & UACE" : level} SUMMARY OF ENTRIES`, pageWidth / 2, yPos, { align: "center" });
    yPos += 20;

    // School Details
    doc.setFontSize(9); // Smaller font for details
    doc.setTextColor(0, 0, 0);
    doc.setFont("helvetica", "normal");
    
    const drawField = (label: string, value: string, x: number, y: number) => {
      doc.setFont("helvetica", "bold");
      doc.setTextColor(0, 0, 0);
      doc.text(label, x, y);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(0, 0, 0);
      doc.text(value, x + doc.getTextWidth(label) + 5, y);
    };

    drawField("NAME OF SCHOOL:", school.name, margin, yPos);
    drawField("TOTAL CANDIDATES:", filteredStudents.length.toString(), pageWidth - margin - 120, yPos);
    yPos += 15;

    drawField("DISTRICT:", school.district, margin, yPos);
    drawField("ZONE:", school.zone || "N/A", margin + 180, yPos);
    yPos += 15;

    drawField("REF NO:", school.code, margin, yPos);
    drawField("TELEPHONE:", school.phone || "N/A", margin + 180, yPos);
    yPos += 15;

    drawField("CONTACT OF HEAD:", school.contactPerson || "_________________________", margin, yPos);
    yPos += 15;

    drawField("SIGNATURE & EMAIL:", school.email || "N/A", margin, yPos);
    yPos += 20;

    // Subjects Table
    const tableData: any[] = [];
    
    const addSubjectRows = (title: string, subjectsToFilter: any[]) => {
      if (subjectsToFilter.length > 0) {
        tableData.push([{ content: title, colSpan: 6, styles: { fontStyle: "bold", fillColor: [245, 245, 245], cellPadding: 2 } }]);
        subjectsToFilter.forEach(subject => {
          const key = `${subject.educationLevel}:${subject.code}`;
          tableData.push([
            subject.code,
            subject.name,
            subjectCountsMap.get(key) || "-",
            "", "", ""
          ]);
        });
      }
    };

    const coreSubjects = levelSubjects.filter(s => !foreignLanguages.includes(s.standardCode) && !localLanguages.includes(s.standardCode));
    const foreignSubjs = levelSubjects.filter(s => foreignLanguages.includes(s.standardCode));
    const localSubjs = levelSubjects.filter(s => localLanguages.includes(s.standardCode));

    addSubjectRows("GENERAL SUBJECTS", coreSubjects);
    addSubjectRows("FOREIGN LANGUAGES", foreignSubjs);
    addSubjectRows("LOCAL LANGUAGES", localSubjs);

    autoTable(doc, {
      startY: yPos,
      head: [["CODE", "SUBJECT NAME", "NO. OF\nCANDIDATES", "P 1", "P 2", "P 3"]],
      body: tableData,
      theme: "grid",
      styles: { 
        fontSize: 8, // Reduced font size for table
        cellPadding: 2, // Reduced padding
        lineWidth: 0.5, 
        textColor: [0, 0, 0], 
        lineColor: [0, 0, 0] 
      },
      headStyles: { 
        fillColor: [255, 255, 255], 
        textColor: [0, 0, 0], 
        fontStyle: "bold", 
        lineWidth: 0.5,
        halign: "center",
        valign: "middle"
      },
      columnStyles: {
        0: { cellWidth: 40, halign: "center" },
        1: { cellWidth: "auto" },
        2: { cellWidth: 65, halign: "center" }, 
        3: { cellWidth: 35, halign: "center" },
        4: { cellWidth: 35, halign: "center" },
        5: { cellWidth: 35, halign: "center" }
      },
      margin: { left: margin, right: margin }
    });

    yPos = (doc as any).lastAutoTable.finalY + 15;

    // Financial Summary Table
    const feeTableBody = [];
    if (schoolRegFeeTotal > 0) feeTableBody.push(["School Registration Fee", `${schoolRegFeeTotal.toLocaleString()} UGX`]);
    feeTableBody.push([`Students Fee (${pricing.studentFee.toLocaleString()} X ${filteredStudents.length})`, `${studentFeeTotal.toLocaleString()} UGX`]);
    if (answerBookletsTotal > 0) feeTableBody.push([`Answer Booklets (${pricing.answerBooklet.toLocaleString()} X ${school.answerBookletsQuantity})`, `${answerBookletsTotal.toLocaleString()} UGX`]);
    
    feeTableBody.push([{ content: "TOTAL AMOUNT", styles: { fontStyle: "bold" } }, { content: `${totalAmount.toLocaleString()} UGX`, styles: { fontStyle: "bold" } }]);
    feeTableBody.push([{ content: `AMOUNT IN WORDS: ${numberToWords(totalAmount)}`, colSpan: 2, styles: { fontSize: 7, fontStyle: "italic", cellPadding: 1 } }]);

    autoTable(doc, {
      startY: yPos,
      head: [["FINANCIAL SUMMARY", "AMOUNT"]],
      body: feeTableBody,
      theme: "plain",
      styles: { 
        fontSize: 8, 
        cellPadding: 1.5,
        textColor: [0, 0, 0] 
      },
      headStyles: { 
        fontStyle: "bold", 
        borderBottom: 0.5,
        textColor: [0, 0, 0] 
      },
      columnStyles: {
        0: { cellWidth: "auto" },
        1: { cellWidth: 120, halign: "right" }
      },
      margin: { left: margin, right: margin }
    });

    yPos = (doc as any).lastAutoTable.finalY + 25; // Reduced space before footer

    // Footer
    doc.setFontSize(9);
    doc.setTextColor(0, 0, 0);
    doc.text("Official Stamp & Signature: ___________________________________", margin, yPos);
    yPos += 15;
    doc.text(`Date: ${new Date().toLocaleDateString()}`, margin, yPos);

    doc.save(`Summary_of_Entries_${level}_${school.code}.pdf`);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Button onClick={handleDownloadPDF} className="bg-blue-600 hover:bg-blue-700 font-bold rounded-xl shadow-lg shadow-blue-200">
          <Download className="mr-2 h-4 w-4" />
          Download PDF
        </Button>
      </div>

      <div className="bg-white p-6 md:p-12 lg:p-20 w-full max-w-full mx-auto border border-slate-200 rounded-3xl shadow-sm space-y-12 font-sans overflow-hidden relative">
        {/* Header */}
        <div className="text-center space-y-4 px-4">
          <h1 className="text-2xl md:text-3xl lg:text-4xl font-black text-slate-900 uppercase tracking-tight break-words leading-tight">WAKISSHA JOINT MOCK EXAMINATIONS</h1>
          <h2 className="text-base md:text-xl font-bold text-slate-600 uppercase tracking-widest border-b-2 border-slate-100 pb-4 inline-block px-4 md:px-12">{level === "Combined" ? "UCE & UACE" : level} SUMMARY OF ENTRIES</h2>
        </div>

        {/* School Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 lg:gap-x-16 gap-y-6 text-sm py-10 px-4 md:px-8">
          <div className="flex flex-col sm:flex-row sm:items-baseline gap-2 sm:gap-4">
            <span className="font-bold text-slate-400 uppercase text-[11px] tracking-widest min-w-[140px] shrink-0">Name of School:</span>
            <span className="font-bold text-slate-900 text-base lg:text-lg">{school.name}</span>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-baseline gap-2 sm:gap-4">
            <span className="font-bold text-slate-400 uppercase text-[11px] tracking-widest min-w-[140px] shrink-0">Total Candidates:</span>
            <span className="font-black text-blue-600 text-xl lg:text-3xl leading-none">{filteredStudents.length}</span>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-baseline gap-2 sm:gap-4">
            <span className="font-bold text-slate-400 uppercase text-[11px] tracking-widest min-w-[140px] shrink-0">District:</span>
            <span className="font-bold text-slate-800 text-base">{school.district}</span>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-baseline gap-2 sm:gap-4">
            <span className="font-bold text-slate-400 uppercase text-[11px] tracking-widest min-w-[140px] shrink-0">Zone:</span>
            <span className="font-bold text-slate-800 text-base">{school.zone || "N/A"}</span>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-baseline gap-2 sm:gap-4">
            <span className="font-bold text-slate-400 uppercase text-[11px] tracking-widest min-w-[140px] shrink-0">Ref No:</span>
            <span className="font-mono font-black text-slate-700 text-base bg-slate-100 px-3 py-1 rounded-lg w-fit">{school.code}</span>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-baseline gap-2 sm:gap-4">
            <span className="font-bold text-slate-400 uppercase text-[11px] tracking-widest min-w-[140px] shrink-0">Telephone:</span>
            <span className="font-bold text-slate-800 text-base">{school.phone || "N/A"}</span>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-baseline gap-2 sm:gap-4 md:col-span-2">
            <span className="font-bold text-slate-400 uppercase text-[11px] tracking-widest min-w-[140px] shrink-0">Contact of Head:</span>
            <span className="font-bold text-slate-800 text-base border-b-2 border-slate-100 flex-1 pb-1">{school.contactPerson || "________________________________________________"}</span>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-baseline gap-2 sm:gap-4 md:col-span-2">
            <span className="font-bold text-slate-400 uppercase text-[11px] tracking-widest min-w-[140px] shrink-0">Email Address:</span>
            <span className="font-bold text-slate-800 text-base truncate">{school.email}</span>
          </div>
        </div>

        {/* Subjects Table */}
        <div className="overflow-x-auto rounded-3xl border border-slate-200 shadow-sm mx-4 md:mx-8">
          <table className="w-full min-w-[600px] text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th rowSpan={2} className="px-4 py-3 text-[10px] font-black text-slate-500 uppercase tracking-wider w-20 border-r border-slate-200">Code</th>
                <th rowSpan={2} className="px-4 py-3 text-[10px] font-black text-slate-500 uppercase tracking-wider border-r border-slate-200">Subject Name</th>
                <th rowSpan={2} className="px-4 py-3 text-[10px] font-black text-slate-500 uppercase tracking-wider text-center w-32 border-r border-slate-200">No. of Candidates</th>
                <th colSpan={3} className="px-4 py-2 text-[10px] font-black text-slate-500 uppercase tracking-wider text-center border-b border-slate-200">Papers</th>
              </tr>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-4 py-2 text-[9px] font-black text-slate-500 uppercase tracking-wider text-center w-16 border-r border-slate-200">P1</th>
                <th className="px-4 py-2 text-[9px] font-black text-slate-500 uppercase tracking-wider text-center w-16 border-r border-slate-200">P2</th>
                <th className="px-4 py-2 text-[9px] font-black text-slate-500 uppercase tracking-wider text-center w-16">P3</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {levelSubjects.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-slate-400 font-medium italic">No subjects registered for this level</td>
                </tr>
              ) : (
                <>
                  {/* General Subjects */}
                  <tr className="bg-slate-50/50">
                    <td colSpan={6} className="px-4 py-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-slate-50/50">General Subjects</td>
                  </tr>
                  {levelSubjects.filter(s => !foreignLanguages.includes(s.standardCode) && !localLanguages.includes(s.standardCode)).map(subject => (
                    <tr key={`${subject.educationLevel}:${subject.code}`} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-4 py-3 font-mono font-bold text-slate-600 border-r border-slate-100">{subject.code}</td>
                      <td className="px-4 py-3 font-semibold text-slate-900 border-r border-slate-100">{subject.name}</td>
                      <td className="px-4 py-3 text-center font-black text-blue-600 border-r border-slate-100">{subjectCountsMap.get(`${subject.educationLevel}:${subject.code}`) || "-"}</td>
                      <td className="px-4 py-3 text-center border-r border-slate-100 bg-slate-50/20"></td>
                      <td className="px-4 py-3 text-center border-r border-slate-100 bg-slate-50/20"></td>
                      <td className="px-4 py-3 text-center bg-slate-50/20"></td>
                    </tr>
                  ))}
                  
                  {/* Foreign Languages */}
                  {levelSubjects.some(s => foreignLanguages.includes(s.standardCode)) && (
                    <>
                      <tr className="bg-slate-50/50">
                        <td colSpan={6} className="px-4 py-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Foreign Languages</td>
                      </tr>
                      {levelSubjects.filter(s => foreignLanguages.includes(s.standardCode)).map(subject => (
                        <tr key={`${subject.educationLevel}:${subject.code}`} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-4 py-3 font-mono font-bold text-slate-600 border-r border-slate-100">{subject.code}</td>
                          <td className="px-4 py-3 font-semibold text-slate-900 border-r border-slate-100">{subject.name}</td>
                          <td className="px-4 py-3 text-center font-black text-blue-600 border-r border-slate-100">{subjectCountsMap.get(`${subject.educationLevel}:${subject.code}`) || "-"}</td>
                          <td className="px-4 py-3 text-center border-r border-slate-100 bg-slate-50/20"></td>
                          <td className="px-4 py-3 text-center border-r border-slate-100 bg-slate-50/20"></td>
                          <td className="px-4 py-3 text-center bg-slate-50/20"></td>
                        </tr>
                      ))}
                    </>
                  )}

                  {/* Local Languages */}
                  {levelSubjects.some(s => localLanguages.includes(s.standardCode)) && (
                    <>
                      <tr className="bg-slate-50/50">
                        <td colSpan={6} className="px-4 py-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Local Languages</td>
                      </tr>
                      {levelSubjects.filter(s => localLanguages.includes(s.standardCode)).map(subject => (
                        <tr key={`${subject.educationLevel}:${subject.code}`} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-4 py-3 font-mono font-bold text-slate-600 border-r border-slate-100">{subject.code}</td>
                          <td className="px-4 py-3 font-semibold text-slate-900 border-r border-slate-100">{subject.name}</td>
                          <td className="px-4 py-3 text-center font-black text-blue-600 border-r border-slate-100">{subjectCountsMap.get(`${subject.educationLevel}:${subject.code}`) || "-"}</td>
                          <td className="px-4 py-3 text-center border-r border-slate-100 bg-slate-50/20"></td>
                          <td className="px-4 py-3 text-center border-r border-slate-100 bg-slate-50/20"></td>
                          <td className="px-4 py-3 text-center bg-slate-50/20"></td>
                        </tr>
                      ))}
                    </>
                  )}
                </>
              )}
            </tbody>
          </table>
        </div>

        {/* Financial Summary */}
        <div className="bg-slate-50 rounded-[2.5rem] p-12 border border-slate-200 space-y-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-8 w-2 bg-blue-600 rounded-full"></div>
            <h3 className="font-black text-slate-900 uppercase tracking-widest text-base">Official Financial Summary</h3>
          </div>
          
          <div className="space-y-4 text-base">
            {schoolRegFeeTotal > 0 && (
              <div className="flex justify-between items-center py-2 border-b border-slate-200/50">
                <span className="text-slate-500 font-bold uppercase text-xs tracking-wider">School Registration Fee</span>
                <span className="font-black text-slate-900">{schoolRegFeeTotal.toLocaleString()} UGX</span>
              </div>
            )}
            <div className="flex justify-between items-center py-2 border-b border-slate-200/50">
              <span className="text-slate-500 font-bold uppercase text-xs tracking-wider">Students Fee ({pricing.studentFee.toLocaleString()} X {filteredStudents.length})</span>
              <span className="font-black text-slate-900">{studentFeeTotal.toLocaleString()} UGX</span>
            </div>
            {answerBookletsTotal > 0 && (
              <div className="flex justify-between items-center py-2 border-b border-slate-200/50">
                <span className="text-slate-500 font-bold uppercase text-xs tracking-wider">Answer Booklets ({pricing.answerBooklet.toLocaleString()} X {school.answerBookletsQuantity})</span>
                <span className="font-black text-slate-900">{answerBookletsTotal.toLocaleString()} UGX</span>
              </div>
            )}
            
            <div className="flex justify-between items-center pt-8">
              <span className="text-xl font-black text-slate-900 uppercase tracking-tighter">Total Amount Due</span>
              <div className="text-right">
                <span className="text-4xl font-black text-blue-600 tracking-tight">{totalAmount.toLocaleString()} UGX</span>
              </div>
            </div>
            <div className="text-right pt-4 border-t-2 border-slate-200">
              <span className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Amount in Words</span>
              <p className="text-sm font-black text-slate-700 italic mt-2 bg-white px-6 py-3 rounded-2xl border border-slate-100 shadow-sm inline-block">{numberToWords(totalAmount)}</p>
            </div>
          </div>
        </div>

        {/* Signatures */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 pt-12 pb-4">
          <div className="space-y-8">
            <div className="space-y-2">
              <div className="h-px bg-slate-300 w-full"></div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">Official School Stamp & Date</p>
            </div>
          </div>
          <div className="space-y-8">
            <div className="space-y-2">
              <div className="h-px bg-slate-300 w-full"></div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">Signature of Headteacher</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function SummaryDialog() {
  const { user, schools, students, subjects, invoices } = useAuth();
  const [open, setOpen] = useState(false);
  const [selectedLevel, setSelectedLevel] = useState<"UCE" | "UACE" | "Combined">("UCE");

  const currentSchool = useMemo(() => {
    if (user?.role === "admin") return schools[0];
    return schools.find(s => s.code === user?.schoolCode);
  }, [schools, user]);

  const scopedStudents = useMemo(() => {
    if (!currentSchool) return [];
    return students.filter(s => s.schoolCode === currentSchool.code);
  }, [students, currentSchool]);

  const schoolInvoices = useMemo(() => {
    return invoices.filter(inv => inv.schoolCode === currentSchool?.code);
  }, [invoices, currentSchool]);

  const isUceFinalised = currentSchool?.uceRegistrationFinalised ?? false;
  const isUaceFinalised = currentSchool?.uaceRegistrationFinalised ?? false;
  
  const isLevelFinalised = useMemo(() => {
    if (selectedLevel === "UCE") return isUceFinalised;
    if (selectedLevel === "UACE") return isUaceFinalised;
    return isUceFinalised && isUaceFinalised;
  }, [selectedLevel, isUceFinalised, isUaceFinalised]);

  const hasInvoiceForLevel = useMemo(() => {
    if (selectedLevel === "Combined") return schoolInvoices.length > 0;
    return schoolInvoices.some(inv => 
      inv.items.some(item => item.description.includes(selectedLevel))
    );
  }, [selectedLevel, schoolInvoices]);

  const canAccessSummary = isLevelFinalised && hasInvoiceForLevel;

  if (!currentSchool) return null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button className="bg-green-600 hover:bg-green-700 font-bold rounded-xl h-11 shadow-lg shadow-green-200">
            <FileText className="mr-2 h-4 w-4" />
            Summary of Entries
            <ChevronDown className="ml-2 h-4 w-4 opacity-50" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56 rounded-xl shadow-xl border-slate-100">
          <DropdownMenuItem 
            className="font-bold py-3 cursor-pointer"
            onClick={() => {
              setSelectedLevel("UCE");
              setOpen(true);
            }}
          >
            UCE Summary
          </DropdownMenuItem>
          <DropdownMenuItem 
            className="font-bold py-3 cursor-pointer"
            onClick={() => {
              setSelectedLevel("UACE");
              setOpen(true);
            }}
          >
            UACE Summary
          </DropdownMenuItem>
          <DropdownMenuItem 
            className="font-bold py-3 cursor-pointer"
            onClick={() => {
              setSelectedLevel("Combined");
              setOpen(true);
            }}
          >
            Combined Summary
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <DialogContent className="max-w-[95vw] md:max-w-[1200px] lg:max-w-[1400px] w-full max-h-[95vh] overflow-y-auto overflow-x-hidden rounded-3xl p-0 md:p-0 border-none shadow-[0_32px_80px_rgba(0,0,0,0.5)]" aria-describedby={undefined}>
        <div className="flex flex-col h-full w-full max-w-full overflow-x-hidden">
          <DialogHeader className="p-6 md:p-8 border-b bg-white/90 backdrop-blur-xl sticky top-0 z-20 rounded-t-3xl">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-2xl bg-green-100 flex items-center justify-center text-green-600 shadow-inner">
                  <FileText className="h-7 w-7" />
                </div>
                <div>
                  <DialogTitle className="text-2xl font-black text-slate-900 tracking-tight">
                    {selectedLevel} Summary of Entries
                  </DialogTitle>
                  <DialogDescription className="text-sm font-semibold text-slate-500">
                    Official registration summary for {currentSchool.name}
                  </DialogDescription>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Badge variant={isLevelFinalised ? "success" : "warning"} className="rounded-xl px-4 py-1.5 font-bold text-xs uppercase tracking-widest shadow-sm">
                  {isLevelFinalised ? "Finalised" : "Pending Finalisation"}
                </Badge>
              </div>
            </div>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto overflow-x-hidden bg-slate-50/30">
            {!canAccessSummary ? (
              <div className="py-32 flex flex-col items-center justify-center text-center space-y-8 px-6">
                <div className="h-24 w-24 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 shadow-inner">
                  <Lock className="h-12 w-12" />
                </div>
                <div className="max-w-md space-y-3">
                  <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Summary Locked</h3>
                  <p className="text-slate-500 font-bold leading-relaxed">
                    Official Summary of Entries PDFs are only accessible after registration is <span className="text-slate-900 underline decoration-green-500 decoration-2">finalised</span> and an <span className="text-slate-900 underline decoration-blue-500 decoration-2">invoice</span> has been generated.
                  </p>
                </div>
                <div className="w-full max-w-md">
                  <Alert variant="warning" className="bg-orange-50 border-orange-200 text-orange-800 rounded-[2rem] p-6 shadow-sm">
                    <AlertCircle className="h-5 w-5" />
                    <AlertDescription className="text-[11px] font-black uppercase tracking-[0.1em] ml-2 text-left">
                      Action Required: Finalise {selectedLevel} registration to unlock
                    </AlertDescription>
                  </Alert>
                </div>
                <Button 
                  variant="outline" 
                  className="rounded-2xl h-12 px-8 font-black uppercase tracking-widest border-slate-200 hover:bg-white hover:border-slate-300 transition-all"
                  onClick={() => setOpen(false)}
                >
                  Close Preview
                </Button>
              </div>
            ) : (
              <div className="p-4 md:p-10 lg:p-16 w-full max-w-full overflow-x-hidden">
                <SummaryOfEntries 
                  school={currentSchool}
                  students={scopedStudents}
                  subjects={subjects}
                  level={selectedLevel}
                  invoices={invoices}
                />
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
