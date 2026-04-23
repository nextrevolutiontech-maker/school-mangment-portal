import {
  CheckCircle,
  Clock,
  AlertTriangle,
  Download,
  Upload,
  Landmark,
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
import { useAuth } from "../auth-context";
import { Alert, AlertDescription, AlertTitle } from "../ui/alert";
import { useState } from "react";
import { toast } from "sonner";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

interface PaymentStatusProps {
  onPageChange: (page: string) => void;
}

function formatUGX(amount: number) {
  return `${amount.toLocaleString()} UGX`;
}

export function PaymentStatus({ onPageChange }: PaymentStatusProps) {
  const { user } = useAuth();
  const [isDownloading, setIsDownloading] = useState(false);

  const registrationFee = 500_000;
  const perStudentFee = 30_000;
  const totalStudents = 85;
  const totalAmount = registrationFee + perStudentFee * totalStudents;

  const paymentStatus = user?.status || "pending";

  const getStatusContent = () => {
    switch (paymentStatus) {
      case "active":
        return {
          title: "Payment Verified",
          description:
            "Your payment has been approved and your school is fully activated in the portal.",
          variant: "success" as const,
          badgeVariant: "success" as const,
          icon: CheckCircle,
        };
      case "verified":
        return {
          title: "Payment Confirmed",
          description:
            "Your payment is confirmed and awaiting final activation processing.",
          variant: "info" as const,
          badgeVariant: "info" as const,
          icon: Clock,
        };
      case "payment_submitted":
        return {
          title: "Payment Submitted",
          description:
            "Your payment receipt has been submitted and is pending administrative review.",
          variant: "warning" as const,
          badgeVariant: "payment" as const,
          icon: Clock,
        };
      default:
        return {
          title: "Payment Pending",
          description:
            "Please review the payment summary and submit your proof of payment to continue registration.",
          variant: "warning" as const,
          badgeVariant: "warning" as const,
          icon: AlertTriangle,
        };
    }
  };

  const status = getStatusContent();
  const StatusIcon = status.icon;

  const downloadInvoice = async () => {
    try {
      setIsDownloading(true);
      const pdf = new jsPDF();
      const pageWidth = pdf.internal.pageSize.getWidth();
      let yPos = 15;

      // Header
      pdf.setFontSize(18);
      pdf.text("WAKISSHA Payment Invoice", pageWidth / 2, yPos, {
        align: "center",
      });
      yPos += 8;

      // School Details
      pdf.setFontSize(11);
      pdf.text(`School: ${user?.name}`, 15, yPos);
      yPos += 7;
      pdf.setFontSize(10);
      pdf.text(`School Code: ${user?.schoolCode}`, 15, yPos);
      yPos += 6;
      pdf.text(`District: ${user?.district}`, 15, yPos);
      yPos += 8;

      // Invoice Details
      const invoiceTableData = [
        {
          Item: "School Registration Fee",
          Amount: `${formatUGX(registrationFee)}`,
        },
        {
          Item: `Per Student Fee (${totalStudents} students)`,
          Amount: `${formatUGX(perStudentFee * totalStudents)}`,
        },
      ];

      autoTable(pdf, {
        head: [["Description", "Amount"]],
        body: invoiceTableData.map((row) => [row.Item, row.Amount]),
        startY: yPos,
        margin: { left: 15, right: 15 },
        headStyles: {
          fillColor: [220, 38, 38],
          textColor: [255, 255, 255],
          fontSize: 11,
          fontStyle: "bold",
        },
        bodyStyles: {
          fontSize: 10,
        },
      });

      yPos = (pdf as any).lastAutoTable.finalY + 10;

      // Total
      pdf.setFontSize(12);
      pdf.setFont(undefined, "bold");
      pdf.text(`Total Amount: ${formatUGX(totalAmount)}`, 15, yPos);
      yPos += 8;

      // Payment Status
      pdf.setFontSize(10);
      pdf.setFont(undefined, "normal");
      pdf.text(`Status: ${paymentStatus.toUpperCase()}`, 15, yPos);
      yPos += 6;
      pdf.text(`Date Generated: ${new Date().toLocaleDateString()}`, 15, yPos);
      yPos += 8;

      // Bank Details
      pdf.setFontSize(9);
      pdf.text("Bank Details:", 15, yPos);
      yPos += 5;
      pdf.text("Account: 1234-5678-9012", 15, yPos);
      yPos += 4;
      pdf.text("Bank: Education Bank", 15, yPos);
      yPos += 4;
      pdf.text(`Reference: ${user?.schoolCode}-2026`, 15, yPos);

      pdf.save(`payment-invoice-${user?.schoolCode}.pdf`);
      toast.success("Invoice downloaded successfully");
    } catch (error) {
      toast.error("Failed to download invoice");
      console.error(error);
    } finally {
      setIsDownloading(false);
    }
  };

  const instructions = [
    {
      title: "Bank Transfer",
      description: "Send the total amount to the official WAKISSHA account.",
      meta: [
        "Account: 1234-5678-9012",
        "Bank: Education Bank",
        `Reference: ${user?.schoolCode}-2026`,
      ],
    },
    {
      title: "Upload Payment Proof",
      description: "Upload your payment receipt or transaction confirmation.",
      meta: ["PDF or scanned receipt", "Clearly visible amount and reference"],
    },
    {
      title: "Await Verification",
      description: "The administration reviews submissions within 24-48 hours.",
      meta: ["Status will update in the portal", "Email confirmation follows"],
    },
  ];

  return (
    <div className="flex flex-col w-full gap-6">
      <div className="space-y-2">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-orange-500">
          Finance & Activation
        </p>
        <h1 className="text-3xl font-bold text-slate-900">Payment Status</h1>
        <p className="max-w-2xl text-slate-500">
          Review your payment summary, see your verification stage, and complete
          any remaining finance requirements for activation.
        </p>
      </div>

      <Alert variant={status.variant}>
        <StatusIcon className="h-4 w-4" />
        <AlertTitle>{status.title}</AlertTitle>
        <AlertDescription>{status.description}</AlertDescription>
      </Alert>

      <div className="flex flex-col w-full gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-slate-900">Payment Summary</CardTitle>
            <CardDescription className="text-slate-500">
              Breakdown of registration and student entry fees
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="font-semibold text-slate-900">
                      School Registration Fee
                    </p>
                    <p className="text-sm text-slate-500">
                      One-time portal registration
                    </p>
                  </div>
                  <p className="text-lg font-semibold text-slate-900">
                    {formatUGX(registrationFee)}
                  </p>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="font-semibold text-slate-900">Per Student Fee</p>
                    <p className="text-sm text-slate-500">
                      {formatUGX(perStudentFee)} x {totalStudents} students
                    </p>
                  </div>
                  <p className="text-lg font-semibold text-slate-900">
                    {formatUGX(perStudentFee * totalStudents)}
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-orange-200 bg-orange-50 p-5">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm uppercase tracking-[0.16em] text-orange-600 font-semibold">
                    Total Amount
                  </p>
                  <p className="mt-2 text-sm text-slate-500">
                    {totalStudents} students registered
                  </p>
                </div>
                <p className="text-3xl font-bold text-slate-900">
                  {formatUGX(totalAmount)}
                </p>
              </div>
            </div>

            <div className="rounded-2xl bg-white shadow-sm border border-slate-200 p-4 shadow-sm">
              <div className="grid gap-3 text-sm md:grid-cols-2">
                <div className="flex items-center justify-between gap-4">
                  <span className="text-slate-500">Payment Status</span>
                  <Badge variant={status.badgeVariant}>
                    {paymentStatus.toUpperCase()}
                  </Badge>
                </div>
                {paymentStatus !== "pending" && (
                  <>
                    <div className="flex items-center justify-between gap-4">
                      <span className="text-slate-500">Submission Date</span>
                      <span className="text-slate-900">April 12, 2026</span>
                    </div>
                    <div className="flex items-center justify-between gap-4 md:col-span-2">
                      <span className="text-slate-500">Reference Number</span>
                      <span className="font-mono text-slate-900">
                        PAY-2026-001-{user?.schoolCode}
                      </span>
                    </div>
                  </>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-slate-900">Payment Instructions</CardTitle>
            <CardDescription className="text-slate-500">
              Complete the following steps to activate your portal access
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {instructions.map((item, index) => (
              <div
                key={item.title}
                className="rounded-2xl bg-white shadow-sm border border-slate-200 p-4 shadow-sm"
              >
                <div className="mb-3 flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-orange-600/10 text-sm font-semibold text-orange-600">
                    {index + 1}
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900">{item.title}</p>
                    <p className="text-sm text-slate-500">{item.description}</p>
                  </div>
                </div>
                <div className="space-y-1 pl-11 text-sm text-slate-500">
                  {item.meta.map((line) => (
                    <p key={line}>{line}</p>
                  ))}
                </div>
              </div>
            ))}

            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
              <div className="flex items-start gap-3">
                <Landmark className="mt-0.5 h-5 w-5 text-amber-600" />
                <div>
                  <p className="font-semibold text-slate-900">Need help?</p>
                  <p className="mt-1 text-sm text-slate-500">
                    Contact finance support at{" "}
                    <a
                      href="mailto:payments@wakissha.ug"
                      className="text-orange-600 hover:underline"
                    >
                      payments@wakissha.ug
                    </a>{" "}
                    or call +256 700 000 000.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Button
          variant="outline"
          className="h-auto justify-between px-5 py-4"
          onClick={downloadInvoice}
          disabled={isDownloading}
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600">
              <Download className="h-5 w-5" />
            </div>
            <div className="text-left">
              <div className="font-semibold text-slate-900">
                {isDownloading ? "Generating..." : "Download Invoice"}
              </div>
              <div className="text-xs text-slate-500">
                Save the payment summary as PDF
              </div>
            </div>
          </div>
        </Button>

        {(paymentStatus === "pending" || paymentStatus === "payment_submitted") && (
          <Button
            className="h-auto justify-between px-5 py-4"
            onClick={() => onPageChange("upload-pdf")}
          >
            <div className="flex items-center gap-3">
              <Upload className="h-5 w-5" />
              <div className="text-left">
                <div className="font-semibold">Submit Payment Proof</div>
                <div className="text-xs opacity-90">
                  Upload receipt or confirmation
                </div>
              </div>
            </div>
          </Button>
        )}
      </div>
    </div>
  );
}


