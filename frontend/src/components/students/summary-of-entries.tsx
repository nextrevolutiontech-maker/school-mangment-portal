import { useMemo, useState } from "react";
import { Button } from "../ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "../ui/dialog";
import { useAuth, SchoolRecord, StudentRecord, Subject, Invoice } from "../auth-context";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { FileText, ChevronDown, CheckCircle, Lock, AlertCircle } from "lucide-react";
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
        const subject = subjects.find(s => s.subjectCode === subjectCode && s.examLevel === examLevel);
        return {
          code: subjectCode,
          name: subject?.subjectName || "Unknown Subject",
          count: subjectCounts[key],
          examLevel
        };
      })
      .sort((a, b) => a.code.localeCompare(b.code));

    return {
      totalStudents: filteredStudents.length,
      subjectList,
      totalEntries: filteredStudents.reduce((sum, s) => sum + s.totalEntries, 0),
      subjectCountsMap: new Map(Object.entries(subjectCounts).map(([k, v]) => [k.split(":")[1], v]))
    };
  }, [filteredStudents, subjects]);

  const subjectCounts = stats.subjectCountsMap;

  const foreignLanguages = ["309", "314", "337", "396"];
  const localLanguages = ["335", "336", "345", "355", "365"];

  const uceSubjects = subjects.filter(s => s.educationLevel === "UCE");
  const uaceSubjects = subjects.filter(s => s.educationLevel === "UACE");

  const levelSubjects = useMemo(() => {
    if (level === "UCE") return uceSubjects;
    if (level === "UACE") return uaceSubjects;
    return subjects;
  }, [level, uceSubjects, uaceSubjects, subjects]);

  // Financial calculations based on new quantity fields
  const pricing = {
    uceMarkingGuide: 35000,
    uaceMarkingGuide: 25000,
    answerBooklet: 25000,
    studentFee: 27000,
    schoolRegistrationFee: 500000,
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
  const uceMarkingGuideTotal = (level === "UCE" && school.uceMarkingGuideQuantity) ? school.uceMarkingGuideQuantity * pricing.uceMarkingGuide : 0;
  const uaceArtsMarkingGuideTotal = (level === "UACE" && school.uaceArtsMarkingGuideQuantity) ? school.uaceArtsMarkingGuideQuantity * pricing.uaceMarkingGuide : 0;
  const uaceSciencesMarkingGuideTotal = (level === "UACE" && school.uaceSciencesMarkingGuideQuantity) ? school.uaceSciencesMarkingGuideQuantity * pricing.uaceMarkingGuide : 0;
  const answerBookletsTotal = school.answerBookletsQuantity ? school.answerBookletsQuantity * pricing.answerBooklet : 0;

  const totalAmount = schoolRegFeeTotal + studentFeeTotal + uceMarkingGuideTotal + uaceArtsMarkingGuideTotal + uaceSciencesMarkingGuideTotal + answerBookletsTotal;

  const handleDownloadPDF = () => {
    const doc = new jsPDF({
      orientation: "portrait",
      unit: "pt",
      format: "a4",
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 30;
    let yPos = margin;

    doc.setFontSize(9);
    doc.text("Appendix 2", pageWidth - margin - 40, yPos);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.text("WAKISSHA JOINT MOCK EXAMINATIONS", pageWidth / 2, yPos, { align: "center" });
    yPos += 20;

    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    const line1Text = `SUMMARY OF ENTRIES ${level === "Combined" ? "UCE & UACE" : level}: YEAR`;
    doc.text(line1Text, margin, yPos);
    doc.line(margin + doc.getTextWidth(line1Text) + 4, yPos + 2, margin + doc.getTextWidth(line1Text) + 80, yPos + 2);
    
    doc.text("TOTAL CANDIDATES", margin + doc.getTextWidth(line1Text) + 100, yPos);
    doc.line(margin + doc.getTextWidth(line1Text) + 100 + doc.getTextWidth("TOTAL CANDIDATES") + 4, yPos + 2, pageWidth - margin - 80, yPos + 2);
    
    doc.text("Ref No", pageWidth - margin - 50, yPos);
    doc.line(pageWidth - margin - 50 + doc.getTextWidth("Ref No") + 4, yPos + 2, pageWidth - margin, yPos + 2);
    yPos += 20;

    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    const line2Text = "NAME OF SCHOOL:";
    doc.text(line2Text, margin, yPos);
    doc.line(margin + doc.getTextWidth(line2Text) + 4, yPos + 2, margin + doc.getTextWidth(line2Text) + 140, yPos + 2);
    
    doc.text("DISTRICT:", margin + doc.getTextWidth(line2Text) + 160, yPos);
    doc.line(margin + doc.getTextWidth(line2Text) + 160 + doc.getTextWidth("DISTRICT:") + 4, yPos + 2, margin + doc.getTextWidth(line2Text) + 160 + doc.getTextWidth("DISTRICT:") + 100, yPos + 2);
    
    doc.text("ZONE:", margin + doc.getTextWidth(line2Text) + 160 + doc.getTextWidth("DISTRICT:") + 130, yPos);
    doc.line(margin + doc.getTextWidth(line2Text) + 160 + doc.getTextWidth("DISTRICT:") + 130 + doc.getTextWidth("ZONE:") + 4, yPos + 2, pageWidth - margin - 120, yPos + 2);
    
    doc.text("TELEPHONE:", pageWidth - margin - 80, yPos);
    doc.line(pageWidth - margin - 80 + doc.getTextWidth("TELEPHONE:") + 4, yPos + 2, pageWidth - margin, yPos + 2);
    yPos += 20;

    doc.setFont("helvetica", "bold");
    doc.text("NAME & SIGN OF HEAD:", margin, yPos);
    doc.line(margin + doc.getTextWidth("NAME & SIGN OF HEAD:") + 4, yPos + 2, pageWidth - margin, yPos + 2);
    yPos += 20;

    doc.text("CONTACT E-MAIL ADDRESS:", margin, yPos);
    doc.line(margin + doc.getTextWidth("CONTACT E-MAIL ADDRESS:") + 4, yPos + 2, pageWidth - margin, yPos + 2);
    yPos += 22;

    const tableData: any[] = [];

    levelSubjects.filter(s => !foreignLanguages.includes(s.standardCode) && !localLanguages.includes(s.standardCode)).forEach(subject => {
      tableData.push([
        subject.standardCode,
        subject.name,
        subjectCounts.get(subject.standardCode) || "-",
        "", "", "", ""
      ]);
    });

    tableData.push([{ content: "FOREIGN LANGUAGES", colSpan: 7, styles: { fontStyle: "bold", fillColor: [220, 220, 220] } }]);
    levelSubjects.filter(s => foreignLanguages.includes(s.standardCode)).forEach(subject => {
      tableData.push([
        subject.standardCode,
        subject.name,
        subjectCounts.get(subject.standardCode) || "-",
        "", "", "", ""
      ]);
    });

    tableData.push([{ content: "LOCAL LANGUAGES", colSpan: 7, styles: { fontStyle: "bold", fillColor: [220, 220, 220] } }]);
    levelSubjects.filter(s => localLanguages.includes(s.standardCode)).forEach(subject => {
      tableData.push([
        subject.standardCode,
        subject.name,
        subjectCounts.get(subject.standardCode) || "-",
        "", "", "", ""
      ]);
    });

    autoTable(doc, {
      startY: yPos,
      head: [["CODE", "SUBJECT NAME", "ENTRIES", "P 1", "P 2", "P 3", "P 4"]],
      body: tableData,
      theme: "grid",
      styles: { fontSize: 8, cellPadding: 2, lineWidth: 0.5 },
      headStyles: { fillColor: [0, 0, 0], textColor: 255, fontStyle: "bold", lineWidth: 0.5 },
      columnStyles: {
        0: { cellWidth: 40, halign: "center" },
        1: { cellWidth: "auto" },
        2: { cellWidth: 50, halign: "center" },
        3: { cellWidth: 30, halign: "center" },
        4: { cellWidth: 30, halign: "center" },
        5: { cellWidth: 30, halign: "center" },
        6: { cellWidth: 30, halign: "center" }
      },
      margin: { left: margin, right: margin }
    });

    yPos = (doc as any).lastAutoTable.finalY + 12;

    const feeTableBody = [];

    if (schoolRegFeeTotal > 0) {
      feeTableBody.push(["SCHOOL REG FEE", schoolRegFeeTotal.toLocaleString()]);
    }
    feeTableBody.push([`STUDENTS FEE (${pricing.studentFee.toLocaleString()} X ${filteredStudents.length})`, studentFeeTotal.toLocaleString()]);
    
    if (uceMarkingGuideTotal > 0) {
      feeTableBody.push([`UCE MARKING GUIDE (${pricing.uceMarkingGuide.toLocaleString()} X ${school.uceMarkingGuideQuantity})`, uceMarkingGuideTotal.toLocaleString()]);
    }
    if (uaceArtsMarkingGuideTotal > 0) {
      feeTableBody.push([`UACE ARTS MARKING GUIDE (${pricing.uaceMarkingGuide.toLocaleString()} X ${school.uaceArtsMarkingGuideQuantity})`, uaceArtsMarkingGuideTotal.toLocaleString()]);
    }
    if (uaceSciencesMarkingGuideTotal > 0) {
      feeTableBody.push([`UACE SCIENCES MARKING GUIDE (${pricing.uaceMarkingGuide.toLocaleString()} X ${school.uaceSciencesMarkingGuideQuantity})`, uaceSciencesMarkingGuideTotal.toLocaleString()]);
    }
    if (answerBookletsTotal > 0) {
      feeTableBody.push([`ANSWER BOOKLETS (${pricing.answerBooklet.toLocaleString()} X ${school.answerBookletsQuantity})`, answerBookletsTotal.toLocaleString()]);
    }

    feeTableBody.push([{ content: "TOTAL AMOUNT", styles: { fontStyle: "bold" } }, { content: totalAmount.toLocaleString(), styles: { fontStyle: "bold" } }]);
    feeTableBody.push([{ content: `AMOUNT IN WORDS:\n${numberToWords(totalAmount)}`, colSpan: 2, styles: { cellPadding: 3 } }]);

    autoTable(doc, {
      startY: yPos,
      head: [["FOR OFFICIAL USE", "AMOUNT"]],
      body: feeTableBody,
      theme: "grid",
      styles: { fontSize: 8, cellPadding: 2, lineWidth: 0.5 },
      headStyles: { fillColor: [0, 0, 0], textColor: 255, fontStyle: "bold", lineWidth: 0.5 },
      columnStyles: {
        0: { cellWidth: "auto" },
        1: { cellWidth: 80, halign: "right" }
      },
      margin: { left: margin, right: pageWidth / 1.8 }
    });

    const signY = yPos + 100;
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text("CHECKED BY:", pageWidth / 1.8, signY);
    doc.line(pageWidth / 1.8 + doc.getTextWidth("CHECKED BY:") + 6, signY + 3, pageWidth - margin, signY + 3);
    
    yPos = (doc as any).lastAutoTable.finalY + 25;
    
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text("DATE:", pageWidth / 1.8, yPos);
    doc.line(pageWidth / 1.8 + doc.getTextWidth("DATE:") + 6, yPos + 3, pageWidth - margin, yPos + 3);

    doc.save(`Summary_of_Entries_${level}_${school.code}.pdf`);
  };

  return (
    <div>
      <div className="mb-4 flex justify-end">
        <Button onClick={handleDownloadPDF} className="bg-blue-600 hover:bg-blue-700">
          Download PDF
        </Button>
      </div>

      <div className="bg-white p-6 max-w-5xl mx-auto border border-slate-200 rounded-lg shadow-sm">
          <div className="text-center mb-6">
            <h1 className="text-xl font-bold uppercase">WAKISSHA JOINT MOCK EXAMINATIONS</h1>
            <h2 className="text-sm font-bold">{level === "Combined" ? "UCE & UACE" : level} SUMMARY OF ENTRIES</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-6 text-sm">
            <div className="flex">
              <span className="font-bold min-w-[120px]">NAME OF SCHOOL:</span> {school.name}
            </div>
            <div className="flex">
              <span className="font-bold min-w-[120px]">TOTAL CANDIDATES:</span> {filteredStudents.length}
            </div>
            <div className="flex">
              <span className="font-bold min-w-[120px]">DISTRICT:</span> {school.district}
            </div>
            <div className="flex">
              <span className="font-bold min-w-[120px]">ZONE:</span> {school.zone}
            </div>
            <div className="flex">
              <span className="font-bold min-w-[120px]">REF NO:</span> {school.code}
            </div>
            <div className="flex">
              <span className="font-bold min-w-[120px]">TELEPHONE:</span> {school.phone}
            </div>
            <div className="flex md:col-span-2">
              <span className="font-bold min-w-[120px]">CONTACT OF HEAD:</span> {school.contactPerson || "_________________________"}
            </div>
            <div className="flex md:col-span-2">
              <span className="font-bold min-w-[120px]">SIGNATURE & EMAIL ADDRESS:</span> {school.email}
            </div>
          </div>

          <div className="text-sm text-slate-600 mb-4">
            <h3 className="font-bold text-lg mb-2">Financial Summary</h3>
            <div className="space-y-1">
              {schoolRegFeeTotal > 0 && (
                <div className="flex justify-between">
                  <span>School Registration Fee:</span>
                  <span>{schoolRegFeeTotal.toLocaleString()} UGX</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>Students Fee ({pricing.studentFee.toLocaleString()} X {filteredStudents.length}):</span>
                <span>{studentFeeTotal.toLocaleString()} UGX</span>
              </div>
              {uceMarkingGuideTotal > 0 && (
                <div className="flex justify-between">
                  <span>UCE Marking Guide ({pricing.uceMarkingGuide.toLocaleString()} X {school.uceMarkingGuideQuantity}):</span>
                  <span>{uceMarkingGuideTotal.toLocaleString()} UGX</span>
                </div>
              )}
              {uaceArtsMarkingGuideTotal > 0 && (
                <div className="flex justify-between">
                  <span>UACE Arts Marking Guide ({pricing.uaceMarkingGuide.toLocaleString()} X {school.uaceArtsMarkingGuideQuantity}):</span>
                  <span>{uaceArtsMarkingGuideTotal.toLocaleString()} UGX</span>
                </div>
              )}
              {uaceSciencesMarkingGuideTotal > 0 && (
                <div className="flex justify-between">
                  <span>UACE Sciences Marking Guide ({pricing.uaceMarkingGuide.toLocaleString()} X {school.uaceSciencesMarkingGuideQuantity}):</span>
                  <span>{uaceSciencesMarkingGuideTotal.toLocaleString()} UGX</span>
                </div>
              )}
              {answerBookletsTotal > 0 && (
                <div className="flex justify-between">
                  <span>Answer Booklets ({pricing.answerBooklet.toLocaleString()} X {school.answerBookletsQuantity}):</span>
                  <span>{answerBookletsTotal.toLocaleString()} UGX</span>
                </div>
              )}
              <div className="flex justify-between font-bold border-t pt-2 mt-2">
                <span>TOTAL AMOUNT:</span>
                <span>{totalAmount.toLocaleString()} UGX</span>
              </div>
              <div className="text-right text-xs mt-1">
                <span>AMOUNT IN WORDS: {numberToWords(totalAmount)}</span>
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

      <DialogContent className="max-w-6xl w-[98vw] max-h-[95vh] overflow-y-auto rounded-3xl" aria-describedby={undefined}>
        <DialogHeader className="border-b pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-2xl bg-green-100 flex items-center justify-center text-green-600">
                <FileText className="h-6 w-6" />
              </div>
              <div>
                <DialogTitle className="text-xl font-black text-slate-900">
                  {selectedLevel} Summary of Entries
                </DialogTitle>
                <DialogDescription className="text-sm font-medium text-slate-500">
                  Review and download the summary of entries for {currentSchool.name}
                </DialogDescription>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={isLevelFinalised ? "success" : "warning"} className="rounded-lg px-3 py-1">
                {isLevelFinalised ? "Finalised" : "Pending Finalisation"}
              </Badge>
            </div>
          </div>
        </DialogHeader>

        {!canAccessSummary ? (
          <div className="py-12 flex flex-col items-center justify-center text-center space-y-6">
            <div className="h-20 w-20 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
              <Lock className="h-10 w-10" />
            </div>
            <div className="max-w-md space-y-2">
              <h3 className="text-xl font-bold text-slate-900">Summary Locked</h3>
              <p className="text-slate-500 font-medium">
                Official Summary of Entries PDFs are only accessible after registration is <strong>finalised</strong> and an <strong>invoice</strong> has been generated.
              </p>
            </div>
            <Alert variant="warning" className="max-w-md bg-orange-50 border-orange-200 text-orange-800 rounded-2xl">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-xs font-bold uppercase tracking-wider">
                Action Required: Finalise {selectedLevel} registration to unlock
              </AlertDescription>
            </Alert>
            <Button 
              variant="outline" 
              className="rounded-xl font-bold border-slate-200"
              onClick={() => setOpen(false)}
            >
              Close Preview
            </Button>
          </div>
        ) : (
          <div className="py-4">
            <SummaryOfEntries 
              school={currentSchool}
              students={scopedStudents}
              subjects={subjects}
              level={selectedLevel}
              invoices={invoices}
            />
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
