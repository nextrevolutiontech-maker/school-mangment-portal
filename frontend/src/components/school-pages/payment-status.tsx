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

      // Header
      pdf.setFontSize(22);
      pdf.setTextColor(0, 0, 0);
      pdf.text("WAKISSHA JOINT MOCK EXAMINATIONS", pageWidth / 2, yPos, { align: "center" });
      yPos += 10;
      
      pdf.setFontSize(16);
      pdf.text("PAYMENT INVOICE", pageWidth / 2, yPos, { align: "center" });
      yPos += 15;

      // Invoice info
      pdf.setFontSize(11);
      pdf.setTextColor(100);
      pdf.text(`Invoice Serial: ${invoice.serialNumber}`, 15, yPos);
      pdf.text(`Date: ${invoice.date}`, pageWidth - 15, yPos, { align: "right" });
      yPos += 10;

      // School info
      pdf.setTextColor(0);
      pdf.setFont(undefined, "bold");
      pdf.text("BILL TO:", 15, yPos);
      yPos += 6;
      pdf.setFont(undefined, "normal");
      pdf.text(`${user?.name}`, 15, yPos);
      yPos += 5;
      pdf.text(`School Code: ${user?.schoolCode}`, 15, yPos);
      yPos += 5;
      pdf.text(`Zone: ${currentSchool?.zone || "N/A"}`, 15, yPos);
      yPos += 15;

      // Items Table
      autoTable(pdf, {
        head: [["Description", "Formula", "Quantity", "Unit Price", "Total"]],
        body: invoice.items.map(item => [
          item.description,
          (item as any).formula || "-",
          item.quantity.toString(),
          formatUGX(item.unitPrice),
          formatUGX(item.total)
        ]),
        startY: yPos,
        margin: { left: 15, right: 15 },
        headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255], fontStyle: "bold" },
        columnStyles: {
          0: { cellWidth: "auto" },
          1: { halign: "center" },
          2: { halign: "center" },
          3: { halign: "right" },
          4: { halign: "right" }
        }
      });

      yPos = (pdf as any).lastAutoTable.finalY + 10;

      // Total
      pdf.setFontSize(14);
      pdf.setFont(undefined, "bold");
      pdf.text(`TOTAL AMOUNT: ${formatUGX(invoice.totalAmount)}`, pageWidth - 15, yPos, { align: "right" });
      yPos += 20;

      // Bank Details
      pdf.setFontSize(11);
      pdf.text("BANK PAYMENT DETAILS:", 15, yPos);
      yPos += 7;
      pdf.setFont(undefined, "normal");
      pdf.setFontSize(10);
      pdf.text("Bank Name: CENTENARY BANK", 15, yPos);
      yPos += 5;
      pdf.text("Account Name: WAKISSHA JOINT MOCK", 15, yPos);
      yPos += 5;
      pdf.text("Account Number: 3100054321", 15, yPos);
      yPos += 5;
      pdf.text(`Reference: ${invoice.serialNumber}`, 15, yPos);
      yPos += 20;

      // Signature section
      pdf.text("__________________________", 15, yPos);
      pdf.text("__________________________", pageWidth - 15, yPos, { align: "right" });
      yPos += 5;
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
                                onClick={() => window.open(invoice.paymentProof, "_blank")}
                                className="h-8 px-2 text-slate-600 hover:text-blue-600 hover:bg-blue-50 font-bold"
                              >
                                <Eye className="h-4 w-4 mr-1" />
                                View
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
                            className="h-8 w-8 p-0" 
                            onClick={() => downloadInvoicePDF(invoice)}
                            title="Print / Download PDF"
                          >
                            <Printer className="h-4 w-4 text-slate-600" />
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
    </div>
  );
}


