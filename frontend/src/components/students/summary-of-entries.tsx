import { useMemo, useState } from "react";
import { Button } from "../ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "../ui/dialog";
import { useAuth, SchoolRecord, StudentRecord, Subject } from "../auth-context";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

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
}

export function SummaryOfEntries({ school, students, subjects }: SummaryOfEntriesProps) {
  const uceStudents = students.filter(s => s.examLevel === "UCE");
  const uaceStudents = students.filter(s => s.examLevel === "UACE");
  
  const subjectCounts = useMemo(() => {
    const counts = new Map<string, number>();
    
    students.forEach(student => {
      const uniqueSubjects = new Set<string>();
      student.subjects.forEach(subj => {
        uniqueSubjects.add(subj.subjectStandardCode || subj.subjectCode);
      });
      uniqueSubjects.forEach(code => {
        counts.set(code, (counts.get(code) || 0) + 1);
      });
    });

    return counts;
  }, [students]);

  const foreignLanguages = ["309", "314", "337", "396"];
  const localLanguages = ["335", "336", "345", "355", "365"];

  const uceSubjects = subjects.filter(s => s.educationLevel === "UCE");
  const uaceSubjects = subjects.filter(s => s.educationLevel === "UACE");

  const schoolRegFee = 25000;
  const perStudentFee = 27000;
  const lateFee = 2000;
  const markingGuideFee = school.markingGuide === "Both" ? 35000 : (school.markingGuide === "Arts" || school.markingGuide === "Sciences" ? 35000 : 0);
  const totalAmount = schoolRegFee + (students.length * perStudentFee) + markingGuideFee;

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
    const line1Text = "SUMMARY OF ENTRIES UCE: YEAR";
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

    uceSubjects.filter(s => !foreignLanguages.includes(s.standardCode) && !localLanguages.includes(s.standardCode)).forEach(subject => {
      tableData.push([
        subject.standardCode,
        subject.name,
        subjectCounts.get(subject.standardCode) || "-",
        "", "", "", ""
      ]);
    });

    tableData.push([{ content: "FOREIGN LANGUAGES", colSpan: 7, styles: { fontStyle: "bold", fillColor: [220, 220, 220] } }]);
    uceSubjects.filter(s => foreignLanguages.includes(s.standardCode)).forEach(subject => {
      tableData.push([
        subject.standardCode,
        subject.name,
        subjectCounts.get(subject.standardCode) || "-",
        "", "", "", ""
      ]);
    });

    tableData.push([{ content: "LOCAL LANGUAGES", colSpan: 7, styles: { fontStyle: "bold", fillColor: [220, 220, 220] } }]);
    uceSubjects.filter(s => localLanguages.includes(s.standardCode)).forEach(subject => {
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

    const feeTable = [
      ["SCHOOL REG FEE", "25,000"],
      [`STUDENTS FEE (27,000 X ${students.length})`, (perStudentFee * students.length).toLocaleString()],
      ["LATE FEE (SHS 2,000 X 0)", "0"],
      ["MARKING GUIDE FEE (ARTS/SCIENCES/BOTH)", "25,000"],
      ["ANSWER BOOKLETS (25,000 X)", ""],
      [{ content: "TOTAL SUBJECT PAPER REGISTERED", styles: { fontStyle: "bold" } }, { content: totalAmount.toLocaleString(), styles: { fontStyle: "bold" } }],
      [{ content: `AMOUNT IN WORDS:\n${numberToWords(totalAmount)}`, colSpan: 2, styles: { cellPadding: 3 } }]
    ];

    autoTable(doc, {
      startY: yPos,
      head: [["FOR OFFICIAL USE", "AMOUNT"]],
      body: feeTable,
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

    doc.save(`Summary_of_Entries_${school.code}.pdf`);
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
          <h2 className="text-sm font-bold">SUMMARY OF ENTRIES</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-6 text-sm">
          <div className="flex">
            <span className="font-bold min-w-[120px]">NAME OF SCHOOL:</span> {school.name}
          </div>
          <div className="flex">
            <span className="font-bold min-w-[120px]">TOTAL CANDIDATES:</span> {students.length}
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
          (PDF will be downloaded in professional format with proper tables)
        </div>
      </div>
    </div>
  );
}

export function SummaryDialog() {
  const { user, schools, students, subjects } = useAuth();
  const [open, setOpen] = useState(false);

  const currentSchool = useMemo(() => {
    if (user?.role === "admin") return schools[0];
    return schools.find(s => s.code === user?.schoolCode);
  }, [schools, user]);

  const scopedStudents = useMemo(() => {
    if (!currentSchool) return [];
    return students.filter(s => s.schoolCode === currentSchool.code);
  }, [students, currentSchool]);

  if (!currentSchool) return null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-green-600 hover:bg-green-700">
          Summary of Entries
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-6xl w-[98vw] max-h-[95vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Summary of Entries - {currentSchool.name}</DialogTitle>
        </DialogHeader>
        <SummaryOfEntries 
          school={currentSchool}
          students={scopedStudents}
          subjects={subjects}
        />
      </DialogContent>
    </Dialog>
  );
}
