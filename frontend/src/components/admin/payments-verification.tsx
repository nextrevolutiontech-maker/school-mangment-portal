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
import { useAuth, type SchoolRecord, type SchoolStatus } from "../auth-context";
import { toast } from "sonner";
import { CreditCard, Eye, Loader2, MailCheck, ShieldCheck, KeyRound } from "lucide-react";
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
  const { schools, updateSchoolStatus } = useAuth();
  const [activeFilter, setActiveFilter] = useState<"all" | SchoolStatus>("all");
  const [selectedSchool, setSelectedSchool] = useState<SchoolRecord | null>(null);
  const [activationCode, setActivationCode] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

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
    toast.message("Opening payment proof", {
      description: `${school.paymentProof} for ${school.name}`,
    });
  };

  const handleVerifyPayment = () => {
    if (!selectedSchool) return;

    setIsProcessing(true);

    setTimeout(() => {
      const nextCode = buildActivationCode(selectedSchool.code);
      updateSchoolStatus(selectedSchool.code, "verified");
      setActivationCode(nextCode);
      setIsProcessing(false);

      toast.success("Payment verified successfully.", {
        description: `${selectedSchool.name} moved to verified status.`,
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
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewProof(school)}
                    >
                      <Eye className="h-4 w-4" />
                      View File
                    </Button>
                  </TableCell>
                  <TableCell>{getStatusBadge(school.status)}</TableCell>
                  <TableCell>
                    {school.status === "payment_submitted" ? (
                      <Button size="sm" onClick={() => setSelectedSchool(school)}>
                        <ShieldCheck className="h-4 w-4" />
                        Verify Payment
                      </Button>
                    ) : school.status === "active" ? (
                      <div className="text-sm text-slate-500">
                        Activation:{" "}
                        <span className="font-medium text-slate-900">
                          {school.activationCode || "Generated"}
                        </span>
                      </div>
                    ) : (
                      <div className="text-sm text-slate-500">
                        Awaiting next action
                      </div>
                    )}
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
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Verification</DialogTitle>
            <DialogDescription>
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
    </div>
  );
}



