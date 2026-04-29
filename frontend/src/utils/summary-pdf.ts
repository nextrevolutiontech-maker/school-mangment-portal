import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

export const generateOfficialSummaryPDF = (
  schoolContext: {
    name: string;
    code: string;
    district: string;
    academicYear: string;
  },
  stats: {
    totalStudents: number;
    subjectsRegistered: number;
    totalEntries: number;
    paymentStatus: string;
  }
) => {
  const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageWidth = pdf.internal.pageSize.getWidth();
  let yPos = 20;

  // Title
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(22);
  pdf.text("WAKISSHA Summary Form", pageWidth / 2, yPos, { align: "center" });
  yPos += 15;

  // School Details
  pdf.setFontSize(12);
  pdf.setFont("helvetica", "normal");
  pdf.text(`School: ${schoolContext.name}`, 20, yPos);
  yPos += 7;
  pdf.text(`School Code: ${schoolContext.code}`, 20, yPos);
  yPos += 7;
  pdf.text(`District: ${schoolContext.district}`, 20, yPos);
  yPos += 7;
  pdf.text(`Academic Year: ${schoolContext.academicYear}`, 20, yPos);
  yPos += 15;

  // Summary Table
  autoTable(pdf, {
    startY: yPos,
    margin: { left: 20, right: 20 },
    head: [["Description", "Value"]],
    body: [
      ["Total Enrolled Students", stats.totalStudents.toString()],
      ["Subjects Registered", stats.subjectsRegistered.toString()],
      ["Total Entries", stats.totalEntries.toString()],
      ["Payment Status", stats.paymentStatus.toUpperCase()],
    ],
    theme: "striped",
    headStyles: {
      fillColor: [220, 38, 38], // Red-600
      textColor: [255, 255, 255],
      fontStyle: "bold",
    },
    styles: {
      fontSize: 11,
      cellPadding: 5,
    },
    columnStyles: {
      0: { cellWidth: 120 },
      1: { cellWidth: 50, halign: "center" },
    },
  });

  yPos = (pdf as any).lastAutoTable.finalY + 15;

  // Instructions
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(14);
  pdf.text("Instructions for Signing:", 20, yPos);
  yPos += 10;

  const instructions = [
    "1. Print this form on official school letterhead",
    "2. Sign at the designated area using authorized signature",
    "3. Apply the official school stamp/seal",
    "4. Attach payment proof as supporting document",
    "5. Scan all documents as a single PDF file",
    "6. Upload the scanned PDF via the portal",
  ];

  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(11);
  instructions.forEach((instruction) => {
    pdf.text(instruction, 20, yPos);
    yPos += 7;
  });

  yPos += 10;
  pdf.setFontSize(10);
  pdf.setTextColor(100);
  pdf.text(`Generated on: ${new Date().toLocaleString()}`, 20, yPos);
  yPos += 5;
  pdf.text("Please review all details before signing.", 20, yPos);

  pdf.save(`Official-Summary-${schoolContext.code}.pdf`);
};
