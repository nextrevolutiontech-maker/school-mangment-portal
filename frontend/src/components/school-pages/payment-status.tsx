import {
  CheckCircle,
  Clock,
  AlertTriangle,
  Download,
  Upload,
  Landmark,
  FileText,
  PlusCircle,
  CreditCard,
  Printer,
  X,
  Eye,
  Info,
  ShieldCheck,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { useAuth, Invoice, isStudentFullyRegistered } from "../auth-context";
import { Alert, AlertDescription, AlertTitle } from "../ui/alert";
import { useState, useMemo, useRef } from "react";
import { toast } from "sonner";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";

interface PaymentStatusProps {
  onPageChange: (page: string) => void;
}

function formatUGX(amount: number) {
  return `${amount.toLocaleString()} UGX`;
}

export function PaymentStatus({ onPageChange }: PaymentStatusProps) {
  const { user, schools, students, subjects, invoices, addInvoice, uploadPaymentProof } = useAuth();
  const [isDownloading, setIsDownloading] = useState(false);
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [viewingInvoice, setViewingInvoice] = useState<Invoice | null>(null);
  const [viewingReceipt, setViewingReceipt] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const currentSchool = useMemo(() => {
    return schools.find(s => s.code === user?.schoolCode);
  }, [schools, user]);

  const schoolInvoices = useMemo(() => {
    return invoices.filter(inv => inv.schoolCode === user?.schoolCode);
  }, [invoices, user]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("File too large", { description: "Maximum size is 5MB" });
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const submitProof = () => {
    if (selectedInvoiceId && previewUrl) {
      uploadPaymentProof(selectedInvoiceId, previewUrl);
      toast.success("Payment proof uploaded", {
        description: "Your receipt has been submitted for verification."
      });
      setIsUploadDialogOpen(false);
      setPreviewUrl(null);
      setSelectedInvoiceId(null);
    }
  };

  const additionalStudents = useMemo(() => {
    return students.filter(s => s.schoolCode === user?.schoolCode && s.isAdditional);
  }, [students, user]);

  const hasUninvoicedAdditional = useMemo(() => {
    if (additionalStudents.length === 0) return false;
    // Check if there's an invoice of type 'additional' that covers these students
    // For simplicity, we'll just check if any additional invoice exists
    // In a real app, you'd track which students are covered by which invoice
    const additionalInvoices = schoolInvoices.filter(inv => inv.type === "additional");
    return additionalInvoices.length === 0; // Simple logic: if no additional invoice, but additional students exist
  }, [additionalStudents, schoolInvoices]);

  const generateAdditionalInvoice = () => {
    const schoolStudents = students.filter(s => s.schoolCode === user?.schoolCode && s.isAdditional && !s.isInvoiced);
    const studentCount = schoolStudents.length;

    const items = [
      { 
        description: "Additional Student Fee", 
        quantity: studentCount, 
        unitPrice: 27000, 
        total: studentCount * 27000,
        formula: `27,000 × ${studentCount} = ${(studentCount * 27000).toLocaleString()}`
      },
      { 
        description: "Answer Booklets (Additional)", 
        quantity: studentCount, 
        unitPrice: 25000, 
        total: studentCount * 25000,
        formula: `25,000 × ${studentCount} = ${(studentCount * 25000).toLocaleString()}`
      },
    ];

    const totalAmount = items.reduce((sum, item) => sum + item.total, 0);

    if (totalAmount === 0) {
      toast.error("No additional students to invoice");
      return;
    }

    const studentIds = schoolStudents.map(s => s.id);

    addInvoice({
      serialNumber: `INV-${user?.schoolCode}-ADD-${Date.now().toString().slice(-4)}`,
      schoolCode: user?.schoolCode || "",
      date: new Date().toISOString().split("T")[0],
      items,
      totalAmount,
      status: "pending",
      type: "additional"
    }, studentIds);

    toast.success("Additional invoice generated successfully");
  };

  const downloadInvoicePDF = async (invoice: Invoice) => {
    try {
      setIsDownloading(true);
      const pdf = new jsPDF();
      const pageWidth = pdf.internal.pageSize.getWidth();
      let yPos = 20;

      // Header with professional styling
      pdf.setFontSize(24);
      pdf.setTextColor(30, 41, 59);
      pdf.setFont(undefined, "bold");
      pdf.text("WAKISSHA JOINT MOCK EXAMINATIONS", pageWidth / 2, yPos, { align: "center" });
      yPos += 12;
      
      pdf.setFontSize(18);
      pdf.setTextColor(71, 85, 105);
      pdf.setFont(undefined, "normal");
      pdf.text("PAYMENT INVOICE", pageWidth / 2, yPos, { align: "center" });
      yPos += 18;

      // Invoice info with better spacing
      pdf.setFontSize(10);
      pdf.setTextColor(107, 114, 128);
      pdf.setFont(undefined, "normal");
      pdf.text(`Invoice Serial: ${invoice.serialNumber}`, 15, yPos);
      pdf.text(`Date: ${invoice.date}`, pageWidth - 15, yPos, { align: "right" });
      yPos += 12;

      // School info with improved typography
      pdf.setTextColor(30, 41, 59);
      pdf.setFont(undefined, "bold");
      pdf.setFontSize(11);
      pdf.text("BILL TO:", 15, yPos);
      yPos += 8;
      pdf.setFont(undefined, "normal");
      pdf.setFontSize(10);
      pdf.text(`${user?.name}`, 15, yPos);
      yPos += 6;
      pdf.text(`School Code: ${user?.schoolCode}`, 15, yPos);
      yPos += 6;
      pdf.text(`Zone: ${currentSchool?.zone || "N/A"}`, 15, yPos);
      yPos += 18;

      // Items Table with professional styling
      autoTable(pdf, {
        head: [["DESCRIPTION", "FORMULA", "QTY", "UNIT PRICE", "TOTAL"]],
        body: invoice.items.map(item => [
          item.description,
          (item as any).formula || "-",
          item.quantity.toString(),
          formatUGX(item.unitPrice),
          formatUGX(item.total)
        ]),
        startY: yPos,
        margin: { left: 15, right: 15 },
        headStyles: { 
          fillColor: [30, 41, 59], 
          textColor: [255, 255, 255], 
          fontStyle: "bold",
          fontSize: 10,
          cellPadding: 8
        },
        bodyStyles: {
          fontSize: 9,
          cellPadding: 6,
          lineColor: [220, 220, 220],
          lineWidth: 0.1
        },
        alternateRowStyles: {
          fillColor: [248, 250, 252]
        },
        columnStyles: {
          0: { cellWidth: "auto", fontStyle: "normal" },
          1: { halign: "center", fontStyle: "italic" },
          2: { halign: "center", cellWidth: 30 },
          3: { halign: "right", cellWidth: 50 },
          4: { halign: "right", cellWidth: 50, fontStyle: "bold" }
        }
      });

      yPos = (pdf as any).lastAutoTable.finalY + 15;

      // Total with enhanced styling
      pdf.setFillColor(30, 41, 59);
      pdf.rect(pageWidth - 100, yPos - 8, 85, 12, "F");
      pdf.setFontSize(12);
      pdf.setFont(undefined, "bold");
      pdf.setTextColor(255, 255, 255);
      pdf.text(`TOTAL: ${formatUGX(invoice.totalAmount)}`, pageWidth - 15, yPos, { align: "right" });
      yPos += 25;

      // Bank Details with professional formatting
      pdf.setTextColor(30, 41, 59);
      pdf.setFontSize(11);
      pdf.setFont(undefined, "bold");
      pdf.text("BANK PAYMENT DETAILS", 15, yPos);
      yPos += 8;
      
      // Bank details box
      pdf.setDrawColor(200, 200, 200);
      pdf.setLineWidth(0.5);
      pdf.rect(15, yPos - 2, pageWidth - 30, 45);
      
      pdf.setFont(undefined, "normal");
      pdf.setFontSize(10);
      pdf.setTextColor(60, 60, 60);
      pdf.text("Bank Name: CENTENARY BANK", 20, yPos);
      yPos += 6;
      pdf.text("Account Name: WAKISSHA JOINT MOCK", 20, yPos);
      yPos += 6;
      pdf.text("Account Number: 3100054321", 20, yPos);
      yPos += 6;
      pdf.text(`Reference: ${invoice.serialNumber}`, 20, yPos);
      yPos += 8;
      pdf.setFont(undefined, "italic");
      pdf.setFontSize(9);
      pdf.setTextColor(100, 100, 100);
      pdf.text("Please use the invoice serial as reference when making payment", 20, yPos);
      yPos += 20;

      // Signature section with better spacing
      pdf.setFont(undefined, "normal");
      pdf.setFontSize(10);
      pdf.setTextColor(30, 41, 59);
      pdf.text("__________________________", 15, yPos);
      pdf.text("__________________________", pageWidth - 15, yPos, { align: "right" });
      yPos += 6;
      pdf.setFont(undefined, "bold");
      pdf.text("School Headteacher / Bursar", 15, yPos);
      pdf.text("WAKISSHA Secretariat", pageWidth - 15, yPos, { align: "right" });

      pdf.save(`invoice-${invoice.serialNumber}.pdf`);
      toast.success("Invoice downloaded successfully");
    } catch (error) {
      toast.error("Failed to generate PDF");
      console.error(error);
    } finally {
      setIsDownloading(false);
    }
  };

  const paymentStatus = user?.status || "pending";
  const getStatusContent = () => {
    // Priority: If no invoices exist, we must show "Awaiting Registration Finalization"
    if (schoolInvoices.length === 0) {
      return {
        title: "Awaiting Registration Finalization",
        description: "Your student registration must be completed and finalized before an invoice can be generated. Once finalized, you can download your payment slip and upload proof of payment.",
        variant: "warning" as const,
        badgeVariant: "warning" as const,
        icon: Info,
        needsFinalization: true
      };
    }

    switch (paymentStatus) {
      case "active":
        return {
          title: "Payment Verified",
          description: "Your payment has been approved and your school is fully activated in the portal.",
          variant: "success" as const,
          badgeVariant: "success" as const,
          icon: CheckCircle,
        };
      case "verified":
        return {
          title: "Payment Confirmed",
          description: "Your payment is confirmed and awaiting final activation processing.",
          variant: "info" as const,
          badgeVariant: "info" as const,
          icon: Clock,
        };
      case "payment_submitted":
        return {
          title: "Payment Submitted",
          description: "Your payment receipt has been submitted and is pending administrative review.",
          variant: "warning" as const,
          badgeVariant: "payment" as const,
          icon: Clock,
        };
      default:
        return {
          title: "Payment Pending",
          description: "Please review the payment summary and submit your proof of payment to continue registration.",
          variant: "warning" as const,
          badgeVariant: "warning" as const,
          icon: AlertTriangle,
        };
    }
  };

  const status = getStatusContent();
  const StatusIcon = status.icon;

  return (
    <div className="flex flex-col w-full gap-6 pb-12">
      <div className="space-y-2">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-orange-500">
          Finance & Invoices
        </p>
        <h1 className="text-3xl font-bold text-slate-900">Payment Summary</h1>
        <p className="max-w-2xl text-slate-500 text-sm">
          Review your generated invoices, download payment slips, and upload proof of payment. 
          <span className="block mt-1 font-bold text-slate-700 italic">
            Note: Fees are calculated based on fully submitted candidates only (UGX 27,000 per student).
          </span>
        </p>
      </div>

      <Alert variant={status.variant} className="rounded-2xl border-2 shadow-sm bg-white overflow-hidden relative group block px-0 py-0">
        <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${
          status.variant === 'success' ? 'bg-emerald-500' : 
          status.variant === 'info' ? 'bg-blue-500' : 
          'bg-orange-500'
        }`} />
        <div className="flex flex-row items-start gap-4 p-5 w-full">
          <div className={`shrink-0 p-2.5 rounded-xl ${
            status.variant === 'success' ? 'bg-emerald-50 text-emerald-600' : 
            status.variant === 'info' ? 'bg-blue-50 text-blue-600' : 
            'bg-orange-50 text-orange-600'
          }`}>
            <StatusIcon className="h-6 w-6" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-xl font-bold text-slate-900 mb-1.5 tracking-tight">{status.title}</h3>
            <p className="text-slate-600 font-medium leading-relaxed text-base">
              {status.description}
            </p>
            {(status as any).needsFinalization && (
              <div className="mt-5 flex flex-wrap items-center gap-4">
                <Button 
                  onClick={() => onPageChange("subject-entries")}
                  className="bg-orange-600 hover:bg-orange-700 text-white rounded-xl font-bold h-12 px-8 shadow-lg shadow-orange-200 transition-all hover:scale-[1.02] active:scale-[0.98]"
                >
                  <PlusCircle className="mr-2 h-5 w-5" />
                  Complete Registration
                </Button>
                <div className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <Info className="h-4 w-4" />
                  Required to generate invoice
                </div>
              </div>
            )}
          </div>
        </div>
      </Alert>

      {/* Invoice History */}
      <Card className="rounded-3xl border-slate-200 overflow-hidden shadow-sm">
        <CardHeader className="bg-slate-50 border-b">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-slate-900 flex items-center gap-2">
                <FileText className="h-5 w-5 text-blue-600" />
                Invoice History
              </CardTitle>
              <CardDescription>All generated invoices for your school</CardDescription>
            </div>
            {hasUninvoicedAdditional && (
              <Button 
                onClick={generateAdditionalInvoice}
                className="bg-orange-600 hover:bg-orange-700 text-white rounded-xl font-bold h-10"
              >
                <PlusCircle className="mr-2 h-4 w-4" />
                Generate Additional Invoice
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {schoolInvoices.length === 0 ? (
            <div className="p-12 text-center">
              <div className="mx-auto w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mb-4">
                <FileText className="h-6 w-6 text-slate-400" />
              </div>
              <p className="text-slate-500 font-medium">No invoices generated yet.</p>
              {!currentSchool?.registrationFinalized && (
                <p className="text-sm text-slate-400 mt-2">
                  Finalize your student registration to generate your first invoice.
                </p>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/50 border-b text-xs font-black text-slate-500 uppercase tracking-widest">
                    <th className="px-6 py-4">Invoice Serial</th>
                    <th className="px-6 py-4">Date</th>
                    <th className="px-6 py-4">Type</th>
                    <th className="px-6 py-4">Amount</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {schoolInvoices.map((invoice) => (
                    <tr key={invoice.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 font-mono font-bold text-slate-900">{invoice.serialNumber}</td>
                      <td className="px-6 py-4 text-sm font-medium text-slate-600">{invoice.date}</td>
                      <td className="px-6 py-4">
                        <Badge variant="outline" className={invoice.type === "original" ? "bg-blue-50 text-blue-700 border-blue-100" : "bg-orange-50 text-orange-700 border-orange-100"}>
                          {invoice.type.toUpperCase()}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 font-black text-slate-900">{formatUGX(invoice.totalAmount)}</td>
                      <td className="px-6 py-4">
                        <Badge variant={invoice.status === "paid" ? "success" : "warning"} className="font-bold">
                          {invoice.status.toUpperCase()}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {invoice.paymentProof ? (
                            <div className="flex items-center gap-2">
                              <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-500 text-white rounded-full text-[10px] font-black shadow-sm shadow-emerald-100">
                                <CheckCircle className="h-3 w-3" />
                                PROOF SUBMITTED
                              </div>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => {
                                  if (invoice.paymentProof && invoice.paymentProof.trim() !== "") {
                                    setViewingReceipt(invoice.paymentProof);
                                  } else {
                                    toast.error("No receipt available to view.");
                                  }
                                }}
                                className="h-8 px-2 text-slate-600 hover:text-blue-600 hover:bg-blue-50 font-bold"
                                title="View Payment Receipt"
                              >
                                <Eye className="h-4 w-4 mr-1" />
                                Receipt
                              </Button>
                            </div>
                          ) : (
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="h-8 rounded-lg font-bold border-blue-100 text-blue-600 hover:bg-blue-50"
                              onClick={() => {
                                setSelectedInvoiceId(invoice.id);
                                setIsUploadDialogOpen(true);
                              }}
                            >
                              <Upload className="h-4 w-4 mr-1" />
                              Upload Receipt
                            </Button>
                          )}
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-8 px-2 text-slate-600 hover:text-emerald-600 hover:bg-emerald-50 font-bold"
                            onClick={() => setViewingInvoice(invoice)}
                            title="View Invoice Details"
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            Invoice
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-8 w-8 p-0" 
                            onClick={() => downloadInvoicePDF(invoice)}
                            title="Download PDF"
                          >
                            <Download className="h-4 w-4 text-slate-600" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="rounded-3xl border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <Landmark className="h-5 w-5 text-orange-600" />
              Bank Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
              <div className="flex justify-between items-center border-b pb-2">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Bank Name</span>
                <span className="font-bold text-slate-900">CENTENARY BANK</span>
              </div>
              <div className="flex justify-between items-center border-b pb-2">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Account Name</span>
                <span className="font-bold text-slate-900">WAKISSHA JOINT MOCK</span>
              </div>
              <div className="flex justify-between items-center border-b pb-2">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Account Number</span>
                <span className="font-mono font-bold text-slate-900">3100054321</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Branch</span>
                <span className="font-bold text-slate-900">WAKISO</span>
              </div>
            </div>
            <p className="text-[11px] text-slate-400 italic">
              * Please use your Invoice Serial Number as the payment reference.
            </p>
          </CardContent>
        </Card>

        <Card className="rounded-3xl border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <Upload className="h-5 w-5 text-blue-600" />
              Upload Payment Proof
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div 
              className="border-2 border-dashed border-blue-200 bg-blue-50/30 rounded-2xl p-8 text-center hover:border-blue-400 hover:bg-blue-50/50 transition-all cursor-pointer group"
              onClick={() => {
                const firstUnpaid = schoolInvoices.find(inv => !inv.paymentProof);
                if (firstUnpaid) {
                  setSelectedInvoiceId(firstUnpaid.id);
                  setIsUploadDialogOpen(true);
                } else if (schoolInvoices.length > 0) {
                  setSelectedInvoiceId(schoolInvoices[0].id);
                  setIsUploadDialogOpen(true);
                }
              }}
            >
              <div className="mx-auto w-14 h-14 rounded-2xl bg-blue-600 text-white flex items-center justify-center mb-4 shadow-lg shadow-blue-200 group-hover:scale-110 transition-transform">
                <Upload className="h-7 w-7" />
              </div>
              <p className="font-bold text-slate-900 text-lg">Click to upload receipt</p>
              
              <div className="mt-5 space-y-3">
                <div className="flex items-start gap-3 text-left bg-white/80 p-3 rounded-xl border border-blue-100 shadow-sm">
                  <ShieldCheck className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" />
                  <p className="text-xs text-slate-600 leading-relaxed">
                    <strong>Recommended:</strong> Scanning your bank slip is better for clear quality and faster verification.
                  </p>
                </div>
                <div className="flex items-start gap-3 text-left bg-white/80 p-3 rounded-xl border border-blue-100 shadow-sm">
                  <Info className="h-4 w-4 text-blue-500 mt-0.5 shrink-0" />
                  <p className="text-xs text-slate-600 leading-relaxed">
                    <strong>Mobile Users:</strong> If taking a photo, ensure the picture is bright, flat, and all text is <strong>readable</strong>.
                  </p>
                </div>
              </div>

              <p className="text-[10px] font-bold text-slate-400 mt-5 uppercase tracking-widest">PDF, JPG or PNG (Max 5MB)</p>
            </div>
            {paymentStatus === "payment_submitted" && (
              <div className="flex items-center justify-center gap-2 py-3 bg-amber-50 text-amber-700 border border-amber-100 rounded-xl font-bold text-xs uppercase tracking-wider">
                <Clock className="h-4 w-4 animate-pulse" />
                Receipt Under Review
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
        <DialogContent className="sm:max-w-[500px] rounded-3xl p-0 overflow-hidden border-none shadow-2xl" aria-describedby="upload-proof-description">
          <DialogHeader className="p-6 bg-slate-900 text-white">
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Upload Payment Proof
            </DialogTitle>
            <DialogDescription id="upload-proof-description" className="text-slate-300">
              Upload your bank deposit slip or electronic transfer receipt.
            </DialogDescription>
          </DialogHeader>
          <div className="p-6 space-y-6 bg-white">
            <div 
              className={`border-2 border-dashed rounded-2xl p-8 text-center transition-all ${previewUrl ? 'border-green-400 bg-green-50/30' : 'border-slate-200 hover:border-blue-400 hover:bg-blue-50/50'}`}
              onClick={() => fileInputRef.current?.click()}
            >
              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept="image/*,.pdf" 
                onChange={handleFileUpload} 
              />
              
              {previewUrl ? (
                <div className="space-y-3">
                  <div className="mx-auto w-16 h-16 rounded-xl bg-green-100 flex items-center justify-center">
                    {previewUrl.startsWith('data:application/pdf') ? (
                      <FileText className="h-8 w-8 text-green-600" />
                    ) : (
                      <img src={previewUrl} alt="Preview" className="h-12 w-12 object-cover rounded" />
                    )}
                  </div>
                  <p className="font-bold text-green-700">File Selected Successfully</p>
                  <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); setPreviewUrl(null); }} className="text-red-500 hover:text-red-600 font-bold">
                    Remove & Change
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="mx-auto w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center">
                    <Upload className="h-6 w-6 text-slate-400" />
                  </div>
                  <div>
                    <p className="font-bold text-slate-700">Click to Select File</p>
                    <p className="text-xs text-slate-400 mt-1">Supports PDF, JPG, PNG (Max 5MB)</p>
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center gap-3 p-4 rounded-xl bg-blue-50 border border-blue-100">
              <Info className="h-5 w-5 text-blue-600 shrink-0" />
              <p className="text-xs font-medium text-blue-800 leading-relaxed">
                Ensure the transaction reference, date, and amount are clearly visible on the receipt to avoid verification delays.
              </p>
            </div>

            <div className="flex gap-3">
              <Button variant="outline" className="flex-1 h-12 rounded-xl font-bold" onClick={() => setIsUploadDialogOpen(false)}>
                Cancel
              </Button>
              <Button 
                className="flex-1 h-12 rounded-xl font-bold bg-slate-900 hover:bg-slate-800" 
                disabled={!previewUrl}
                onClick={submitProof}
              >
                Submit Receipt
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Invoice Detail View Dialog */}
      <Dialog open={viewingInvoice !== null} onOpenChange={(open) => !open && setViewingInvoice(null)}>
        <DialogContent className="sm:max-w-[700px] rounded-3xl p-0 overflow-hidden border-none shadow-2xl" aria-describedby="invoice-detail-description">
          <DialogHeader className="p-6 bg-slate-900 text-white flex-row items-center justify-between">
            <div>
              <DialogTitle className="text-xl font-bold flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Invoice Details
              </DialogTitle>
              <DialogDescription id="invoice-detail-description" className="text-slate-300">
                {viewingInvoice?.serialNumber} — {viewingInvoice?.type.toUpperCase()} INVOICE
              </DialogDescription>
            </div>
            <Button variant="ghost" size="icon" onClick={() => setViewingInvoice(null)} className="text-white hover:bg-white/10">
              <X className="h-5 w-5" />
            </Button>
          </DialogHeader>
          <div className="p-6 space-y-5 bg-slate-50">
            {/* Invoice Meta */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-white border border-slate-200">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Invoice Serial</p>
                <p className="text-lg font-black text-slate-900 font-mono">{viewingInvoice?.serialNumber}</p>
              </div>
              <div className="p-4 rounded-xl bg-white border border-slate-200">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Date Issued</p>
                <p className="text-lg font-black text-slate-900">{viewingInvoice?.date}</p>
              </div>
              <div className="p-4 rounded-xl bg-white border border-slate-200">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Invoice Type</p>
                <Badge variant="outline" className={viewingInvoice?.type === "original" ? "bg-blue-50 text-blue-700 border-blue-100 font-bold" : "bg-orange-50 text-orange-700 border-orange-100 font-bold"}>
                  {viewingInvoice?.type.toUpperCase()}
                </Badge>
              </div>
              <div className="p-4 rounded-xl bg-white border border-slate-200">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Payment Status</p>
                <Badge variant={viewingInvoice?.status === "paid" ? "success" : "warning"} className="font-bold">
                  {viewingInvoice?.status.toUpperCase()}
                </Badge>
              </div>
            </div>

            {/* Bill To */}
            <div className="p-4 rounded-xl bg-white border border-slate-200">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">BILL TO</p>
              <p className="font-bold text-slate-900">{user?.name}</p>
              <p className="text-sm text-slate-500">School Code: {user?.schoolCode} | Zone: {currentSchool?.zone || "N/A"}</p>
            </div>

            {/* Items Table */}
            <div className="rounded-xl bg-white border border-slate-200 overflow-hidden">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-800 text-white text-xs font-black uppercase tracking-widest">
                    <th className="px-4 py-3">Description</th>
                    <th className="px-4 py-3 text-center">Qty</th>
                    <th className="px-4 py-3 text-right">Unit Price</th>
                    <th className="px-4 py-3 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {viewingInvoice?.items.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3">
                        <p className="font-bold text-slate-900 text-sm">{item.description}</p>
                        {item.formula && <p className="text-[11px] text-slate-400 font-medium">{item.formula}</p>}
                      </td>
                      <td className="px-4 py-3 text-center font-bold text-slate-700">{item.quantity}</td>
                      <td className="px-4 py-3 text-right font-medium text-slate-600">{formatUGX(item.unitPrice)}</td>
                      <td className="px-4 py-3 text-right font-black text-slate-900">{formatUGX(item.total)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-slate-50 border-t-2 border-slate-200">
                    <td colSpan={3} className="px-4 py-3 text-right font-black text-slate-900 uppercase tracking-wider">Total Amount</td>
                    <td className="px-4 py-3 text-right font-black text-lg text-orange-600">{formatUGX(viewingInvoice?.totalAmount || 0)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Bank Details */}
            <div className="p-4 rounded-xl bg-blue-50 border border-blue-100">
              <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-2">BANK PAYMENT DETAILS</p>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div><span className="text-slate-500 font-medium">Bank:</span> <span className="font-bold text-slate-900">CENTENARY BANK</span></div>
                <div><span className="text-slate-500 font-medium">Account:</span> <span className="font-bold text-slate-900">WAKISSHA JOINT MOCK</span></div>
                <div><span className="text-slate-500 font-medium">Acc No:</span> <span className="font-mono font-bold text-slate-900">3100054321</span></div>
                <div><span className="text-slate-500 font-medium">Reference:</span> <span className="font-mono font-bold text-slate-900">{viewingInvoice?.serialNumber}</span></div>
              </div>
            </div>

            {/* Payment Proof Status */}
            {viewingInvoice?.paymentProof && (
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center gap-3">
                <CheckCircle className="h-5 w-5 text-emerald-600 shrink-0" />
                <div>
                  <p className="font-bold text-emerald-800 text-sm">Payment Proof Submitted</p>
                  <p className="text-xs text-emerald-600">Your receipt has been uploaded and is pending admin verification.</p>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <Button variant="outline" className="flex-1 h-12 rounded-xl font-bold" onClick={() => setViewingInvoice(null)}>
                Close
              </Button>
              <Button 
                className="flex-1 h-12 rounded-xl font-bold bg-slate-900 hover:bg-slate-800"
                onClick={() => {
                  if (viewingInvoice) downloadInvoicePDF(viewingInvoice);
                }}
              >
                <Download className="h-4 w-4 mr-2" />
                Download PDF
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Receipt Preview Modal */}
      <Dialog open={!!viewingReceipt} onOpenChange={() => setViewingReceipt(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden p-0 border-none shadow-2xl">
          <DialogHeader className="p-4 border-b bg-slate-50">
            <div className="flex items-center justify-between">
              <DialogTitle className="text-lg font-black text-slate-900 flex items-center gap-2">
                <FileText className="h-5 w-5 text-blue-600" />
                Payment Receipt
              </DialogTitle>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setViewingReceipt(null)}
                className="h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </DialogHeader>
          <div className="p-4 overflow-y-auto max-h-[calc(90vh-80px)]">
            {viewingReceipt && (
              <div className="space-y-4">
                <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
                  <p className="text-sm font-medium text-blue-800 mb-2">
                    <strong>Receipt Preview:</strong> This is the payment proof you submitted.
                  </p>
                  <div className="bg-white rounded-lg border border-slate-200 p-2">
                    {viewingReceipt.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                      <img 
                        src={viewingReceipt} 
                        alt="Payment Receipt" 
                        className="w-full h-auto max-h-[500px] object-contain rounded"
                        onError={(e) => {
                          console.error("Image load error:", e);
                          toast.error("Failed to load receipt image. The file may be corrupted or not an image.");
                        }}
                        onLoad={() => {
                          console.log("Image loaded successfully");
                        }}
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center h-[300px] bg-slate-50 rounded-lg border-2 border-dashed border-slate-300">
                        <FileText className="h-12 w-12 text-slate-400 mb-3" />
                        <p className="text-slate-600 font-medium mb-2">Receipt Document</p>
                        <p className="text-slate-500 text-sm mb-4">This receipt may not be an image file</p>
                        <div className="flex gap-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => {
                              if (viewingReceipt) {
                                window.open(viewingReceipt, '_blank');
                              }
                            }}
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            Open Document
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => {
                              if (viewingReceipt) {
                                const link = document.createElement('a');
                                link.href = viewingReceipt;
                                link.download = `receipt-${Date.now()}`;
                                link.click();
                                toast.success("Receipt downloaded successfully");
                              }
                            }}
                          >
                            <Download className="h-4 w-4 mr-2" />
                            Download
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="flex gap-3">
                  <Button 
                    variant="outline" 
                    className="flex-1 h-10 rounded-lg font-bold"
                    onClick={() => {
                      if (viewingReceipt) {
                        const link = document.createElement('a');
                        link.href = viewingReceipt;
                        link.download = `receipt-${Date.now()}.jpg`;
                        link.click();
                        toast.success("Receipt downloaded successfully");
                      }
                    }}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download Receipt
                  </Button>
                  <Button 
                    variant="outline" 
                    className="flex-1 h-10 rounded-lg font-bold"
                    onClick={() => {
                      if (viewingReceipt) {
                        window.open(viewingReceipt, '_blank');
                      }
                    }}
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    Open in New Tab
                  </Button>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}


