import { useMemo, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { useAuth, type SchoolRecord, type SchoolStatus, type Invoice } from "../auth-context";
import { toast } from "sonner";
import { CreditCard, Eye, Loader2, MailCheck, ShieldCheck, KeyRound, FileText, Download, X } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";

interface PaymentsVerificationProps {
  onPageChange: (page: string) => void;
}

const filterOptions: Array<{ label: string; value: "all" | SchoolStatus }> = [
  { label: "All", value: "all" },
  { label: "Pending", value: "pending" },
  { label: "Payment Submitted", value: "payment_submitted" },
  { label: "Verified", value: "verified" },
  { label: "Active", value: "active" },
];

const examLevelMap: Record<string, "UCE" | "UACE"> = {
  "WAK26-0001": "UCE",
  "WAK26-0002": "UACE",
  "WAK26-0003": "UCE",
  "WAK26-0004": "UACE",
};

function getStatusBadge(status: SchoolStatus) {
  const badgeMap = {
    active: { variant: "success" as const, label: "Active" },
    verified: { variant: "info" as const, label: "Verified" },
    pending: { variant: "warning" as const, label: "Pending" },
    payment_submitted: {
      variant: "payment" as const,
      label: "Payment Submitted",
    },
  };

  return <Badge variant={badgeMap[status].variant}>{badgeMap[status].label}</Badge>;
}

function buildActivationCode(schoolCode: string) {
  const suffix = schoolCode.split("-").pop() ?? "0000";
  return `ACT-2026-${suffix}`;
}

export function PaymentsVerification({
  onPageChange,
}: PaymentsVerificationProps) {
  const { schools, updateSchoolStatus, invoices, markInvoiceAsPaid } = useAuth();
  const [activeFilter, setActiveFilter] = useState<"all" | SchoolStatus>("all");
  const [selectedSchool, setSelectedSchool] = useState<SchoolRecord | null>(null);
  const [activationCode, setActivationCode] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [previewInvoice, setPreviewInvoice] = useState<Invoice | null>(null);

  const filteredSchools = useMemo(() => {
    if (activeFilter === "all") return schools;
    return schools.filter((school) => school.status === activeFilter);
  }, [activeFilter, schools]);

  const summaryCards = [
    {
      label: "Pending Review",
      value: schools.filter((school) => school.status === "pending").length,
      border: "border-l-yellow-500",
      valueClass: "text-slate-900",
    },
    {
      label: "Payment Submitted",
      value: schools.filter((school) => school.status === "payment_submitted").length,
      border: "border-l-orange-500",
      valueClass: "text-slate-900",
    },
    {
      label: "Verified",
      value: schools.filter((school) => school.status === "verified").length,
      border: "border-l-blue-500",
      valueClass: "text-slate-900",
    },
    {
      label: "Activated",
      value: schools.filter((school) => school.status === "active").length,
      border: "border-l-green-500",
      valueClass: "text-slate-900",
    },
  ];

  const handleViewProof = (school: SchoolRecord) => {
    const schoolInvoicesWithProof = invoices
      .filter(inv => inv.schoolCode === school.code && inv.paymentProof && inv.paymentProof !== "")
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    const latestInvoiceWithProof = schoolInvoicesWithProof[0];

    if (latestInvoiceWithProof) {
      setPreviewInvoice(latestInvoiceWithProof);
      if (schoolInvoicesWithProof.length > 1) {
        toast.info(`Showing latest of ${schoolInvoicesWithProof.length} payment proofs`, {
          description: "Multiple transactions found for this school."
        });
      }
    } else if (school.paymentProof && 
               school.paymentProof !== "" && 
               !school.paymentProof.includes("not-submitted.pdf") && 
               !school.paymentProof.includes("signed-form-")) {
      // Fallback for legacy data
      toast.info("Showing school profile payment proof", {
        description: "This proof was uploaded directly to the school profile."
      });
      window.open(school.paymentProof, "_blank");
    } else {
      toast.error("No valid payment proof found", {
        description: "Please ask the school to re-upload their receipt."
      });
    }
  };

  const handleVerifyPayment = () => {
    if (!selectedSchool) return;

    setIsProcessing(true);

    setTimeout(() => {
      const nextCode = buildActivationCode(selectedSchool.code);
      updateSchoolStatus(selectedSchool.code, "verified");
      
      // Mark the invoice being previewed as paid
      if (previewInvoice) {
        markInvoiceAsPaid(previewInvoice.id);
      } else {
        // Fallback: mark all pending invoices with proof for this school as paid
        invoices
          .filter(inv => inv.schoolCode === selectedSchool.code && inv.status === "pending" && inv.paymentProof)
          .forEach(inv => markInvoiceAsPaid(inv.id));
      }

      setActivationCode(nextCode);
      setIsProcessing(false);

      toast.success("Payment verified successfully.", {
        description: `${selectedSchool.name} moved to verified status and registration numbers assigned.`,
      });
    }, 1500);
  };

  const handleActivateSchool = () => {
    if (!selectedSchool || !activationCode) return;
    updateSchoolStatus(selectedSchool.code, "active", activationCode);
    toast.success("School activated", {
      description: `${selectedSchool.name} activated with code ${activationCode}.`,
    });
    setActivationCode("");
    setSelectedSchool(null);
  };

  return (
    <div className="flex flex-col w-full gap-6">
      <div className="w-full flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-2">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-orange-500">
            Finance Control
          </p>
          <div>
            <h1 className="text-3xl font-bold text-slate-900">
              Payments &amp; Verification
            </h1>
            <p className="mt-2 max-w-3xl text-slate-500">
              Review school submissions, verify uploaded payment proof, and
              activate school accounts for the 2026 examination cycle.
            </p>
          </div>
        </div>

        <Button variant="outline" onClick={() => onPageChange("reports")}>
          <MailCheck className="h-4 w-4" />
          Go to Reports
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {summaryCards.map((card) => (
          <Card key={card.label} className={`border-l-4 ${card.border}`}>
            <CardContent className="pt-6">
              <p className="text-sm font-medium text-slate-500">{card.label}</p>
              <p className={`mt-3 text-3xl font-bold ${card.valueClass}`}>
                {card.value}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="w-full mt-6">
        <CardHeader className="border-b border-slate-200">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <CardTitle className="text-slate-900">Verification Queue</CardTitle>
              <CardDescription className="text-slate-500">
                Filter and action school payment submissions from a single admin
                workspace.
              </CardDescription>
            </div>
            <div className="flex flex-wrap gap-2">
              {filterOptions.map((filter) => (
                <Button
                  key={filter.value}
                  variant={activeFilter === filter.value ? "default" : "outline"}
                  size="sm"
                  onClick={() => setActiveFilter(filter.value)}
                >
                  {filter.label}
                </Button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>School Code</TableHead>
                <TableHead>School Name</TableHead>
                <TableHead>Exam Level</TableHead>
                <TableHead>Amount Paid</TableHead>
                <TableHead>Payment Proof</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSchools.map((school) => (
                <TableRow key={school.id}>
                  <TableCell>
                    <Badge variant="outline">{school.code}</Badge>
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="font-semibold text-slate-900">{school.name}</p>
                      <p className="text-xs text-slate-500">
                        {school.district} / {school.zone}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell className="font-medium text-slate-900">
                    {examLevelMap[school.code] ?? "UCE"}
                  </TableCell>
                  <TableCell className="font-medium text-slate-900">
                    {school.amountPaid}
                  </TableCell>
                  <TableCell>
                    {(() => {
                      const schoolInvoices = invoices.filter(inv => inv.schoolCode === school.code);
                      const hasInvoiceProof = schoolInvoices.some(inv => inv.paymentProof);
                      const hasSchoolProof = school.paymentProof && 
                                           school.paymentProof !== "" && 
                                           !school.paymentProof.includes("not-submitted.pdf") &&
                                           !school.paymentProof.includes("signed-form-");
                      
                      if (hasInvoiceProof || hasSchoolProof) {
                        return (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewProof(school)}
                            className="font-bold border-blue-100 text-blue-600 hover:bg-blue-50"
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            View File
                          </Button>
                        );
                      }
                      
                      return (
                        <Button
                          variant="outline"
                          size="sm"
                          disabled
                          className="font-bold opacity-40 grayscale"
                        >
                          <FileText className="h-4 w-4 mr-1" />
                          No File
                        </Button>
                      );
                    })()}
                  </TableCell>
                  <TableCell>{getStatusBadge(school.status)}</TableCell>
                  <TableCell>
                    <div className="flex items-center justify-start min-h-[40px]">
                      {school.status === "payment_submitted" ? (
                        <Button 
                          size="sm" 
                          onClick={() => setSelectedSchool(school)} 
                          className="bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-sm"
                        >
                          <ShieldCheck className="h-4 w-4 mr-1" />
                          Verify Payment
                        </Button>
                      ) : school.status === "verified" ? (
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg border border-blue-100">
                          <ShieldCheck className="h-4 w-4" />
                          <span className="text-xs font-bold uppercase tracking-wider">Verification Complete</span>
                        </div>
                      ) : school.status === "active" ? (
                        <div className="flex flex-col gap-1">
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Activation Ref</p>
                          <div className="flex items-center gap-2 text-sm">
                            <KeyRound className="h-3.5 w-3.5 text-green-600" />
                            <span className="font-mono font-black text-slate-900 bg-slate-100 px-2 py-0.5 rounded border border-slate-200 shadow-sm">
                              {school.activationCode || "ACT-XXXX-XXXX"}
                            </span>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 text-slate-400 rounded-lg border border-slate-200 italic">
                          <Loader2 className="h-4 w-4 opacity-50" />
                          <span className="text-xs font-bold uppercase tracking-wider">Pending Submission</span>
                        </div>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog
        open={selectedSchool !== null}
        onOpenChange={(open) => {
          if (!isProcessing && !open) {
            setSelectedSchool(null);
            setActivationCode("");
          }
        }}
      >
        <DialogContent aria-describedby="verify-school-description">
          <DialogHeader>
            <DialogTitle>Confirm Verification</DialogTitle>
            <DialogDescription id="verify-school-description">
              {selectedSchool
                ? activationCode
                  ? `Payment verified for ${selectedSchool.name}. Confirm activation with generated code.`
                  : `Verify payment for ${selectedSchool.name}.`
                : "Verify this school payment submission."}
            </DialogDescription>
          </DialogHeader>

          <div className="rounded-2xl bg-white shadow-sm border border-slate-200 p-4">
            <div className="flex items-start gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-orange-600/15 text-orange-400">
                {isProcessing ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  activationCode ? <KeyRound className="h-5 w-5" /> : <CreditCard className="h-5 w-5" />
                )}
              </div>
              <div className="space-y-1">
                <p className="font-semibold text-slate-900">
                  {isProcessing
                    ? "Processing verification..."
                    : activationCode
                      ? "Activation code generated"
                      : "Ready to verify"}
                </p>
                <p className="text-sm text-slate-500">
                  {isProcessing
                    ? "Reviewing payment proof and updating payment status."
                    : activationCode
                      ? `Activation Code: ${activationCode}`
                      : "This will update school status to verified."}
                </p>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setSelectedSchool(null)}
              disabled={isProcessing}
            >
              Cancel
            </Button>
            <Button
              onClick={activationCode ? handleActivateSchool : handleVerifyPayment}
              disabled={isProcessing}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Processing
                </>
              ) : (
                <>
                  {activationCode ? <KeyRound className="h-4 w-4" /> : <ShieldCheck className="h-4 w-4" />}
                  {activationCode ? "Activate School" : "Confirm Verification"}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Proof Preview Dialog */}
      <Dialog open={previewInvoice !== null} onOpenChange={(open) => !open && setPreviewInvoice(null)}>
        <DialogContent className="sm:max-w-[700px] rounded-3xl p-0 overflow-hidden border-none shadow-2xl" aria-describedby="proof-preview-description">
          <DialogHeader className="p-6 bg-slate-900 text-white flex-row items-center justify-between">
            <div>
              <DialogTitle className="text-xl font-bold flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Payment Proof Verification
              </DialogTitle>
              <DialogDescription id="proof-preview-description" className="text-slate-300">
                Reviewing receipt for Invoice: {previewInvoice?.serialNumber}
              </DialogDescription>
            </div>
            <Button variant="ghost" size="icon" onClick={() => setPreviewInvoice(null)} className="text-white hover:bg-white/10">
              <X className="h-5 w-5" />
            </Button>
          </DialogHeader>
          <div className="p-6 space-y-6 bg-slate-50">
            <div className="aspect-[4/3] w-full rounded-2xl border-2 border-slate-200 bg-white overflow-hidden flex items-center justify-center shadow-inner relative group">
              {previewInvoice?.paymentProof?.startsWith('data:application/pdf') ? (
                <div className="text-center space-y-4">
                  <div className="mx-auto w-20 h-20 rounded-2xl bg-blue-100 flex items-center justify-center">
                    <FileText className="h-10 w-10 text-blue-600" />
                  </div>
                  <p className="font-bold text-slate-700">PDF Receipt Document</p>
                  <Button asChild variant="outline" className="rounded-xl font-bold">
                    <a href={previewInvoice.paymentProof} download={`receipt-${previewInvoice.serialNumber}.pdf`}>
                      <Download className="h-4 w-4 mr-2" />
                      Download to View
                    </a>
                  </Button>
                </div>
              ) : (
                <>
                  <img 
                    src={previewInvoice?.paymentProof} 
                    alt="Payment Receipt" 
                    className="max-w-full max-h-full object-contain"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Button asChild variant="secondary" className="rounded-xl font-bold shadow-xl">
                      <a href={previewInvoice?.paymentProof} target="_blank" rel="noopener noreferrer">
                        <Eye className="h-4 w-4 mr-2" />
                        Open Full Image
                      </a>
                    </Button>
                  </div>
                </>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-white border border-slate-200">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Amount</p>
                <p className="text-xl font-black text-slate-900">UGX {previewInvoice?.totalAmount.toLocaleString()}</p>
              </div>
              <div className="p-4 rounded-xl bg-white border border-slate-200">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Invoice Date</p>
                <p className="text-xl font-black text-slate-900">{previewInvoice?.date}</p>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <Button variant="outline" className="flex-1 h-12 rounded-xl font-bold" onClick={() => setPreviewInvoice(null)}>
                Close Preview
              </Button>
              <Button 
                className="flex-1 h-12 rounded-xl font-bold bg-green-600 hover:bg-green-700"
                onClick={() => {
                  const school = schools.find(s => s.code === previewInvoice?.schoolCode);
                  if (school) {
                    setSelectedSchool(school);
                    setPreviewInvoice(null);
                  }
                }}
              >
                Proceed to Verify
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}



