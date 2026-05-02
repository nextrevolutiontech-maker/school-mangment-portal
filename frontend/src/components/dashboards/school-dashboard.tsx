import { useState, useMemo } from "react";
import {
  BookOpen,
  CheckCircle,
  Clock,
  CreditCard,
  AlertTriangle,
  Calendar,
  ImageIcon,
  Upload,
  Users,
  Phone,
  Mail,
  FileText,
  Lock,
  ChevronRight,
  ChevronLeft,
  Info,
  PlusCircle,
  ArrowRightCircle,
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
import { Progress } from "../ui/progress";
import { useAuth, isStudentFullyRegistered } from "../auth-context";
import { Alert, AlertDescription, AlertTitle } from "../ui/alert";
import { generateWPF_PDF } from "../../utils/wpf-pdf";
import { generateOfficialSummaryPDF } from "../../utils/summary-pdf";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import { RadioGroup, RadioGroupItem } from "../ui/radio-group";
import { Checkbox } from "../ui/checkbox";
import { toast } from "sonner";

interface SchoolDashboardProps {
  onPageChange: (page: string) => void;
}

export function SchoolDashboard({ onPageChange }: SchoolDashboardProps) {
  const { user, schools, students, invoices, zones, subjects, finalizeRegistration } = useAuth();
  const [isFinalizeDialogOpen, setIsFinalizeDialogOpen] = useState(false);
  const [finalizeStep, setFinalizeStep] = useState(1);
  const [isVerified, setIsVerified] = useState(false);
  const [markingGuide, setMarkingGuide] = useState<"Arts" | "Sciences" | "Both">("Arts");

  const currentSchool = schools.find((school) => school.code === user?.schoolCode);
  const isUceFinalized = currentSchool?.uceRegistrationFinalized ?? false;
  const isUaceFinalized = currentSchool?.uaceRegistrationFinalized ?? false;
  const isAllFinalized = (currentSchool?.educationLevel === "UCE" && isUceFinalized) || 
                         (currentSchool?.educationLevel === "UACE" && isUaceFinalized) ||
                         (isUceFinalized && isUaceFinalized);

  const [finalizeLevel, setFinalizeLevel] = useState<"UCE" | "UACE">("UCE");

  const schoolStudents = students.filter((student) => student.schoolCode === user?.schoolCode);
  const uceStudents = schoolStudents.filter((student) => student.examLevel === "UCE").length;
  const uaceStudents = schoolStudents.filter((student) => student.examLevel === "UACE").length;

  const showAdditionalLabel = (currentSchool?.educationLevel === "UCE" && isUceFinalized && uceStudents > 0) || 
                             (currentSchool?.educationLevel === "UACE" && isUaceFinalized && uaceStudents > 0) ||
                             (isUceFinalized && uceStudents > 0 && isUaceFinalized && uaceStudents > 0);

  const schoolInvoices = invoices.filter((inv) => inv.schoolCode === user?.schoolCode);
  const schoolSubjectsCount = new Set(schoolStudents.flatMap((student) => student.subjects.map((s) => s.subjectCode))).size;

  const originalInvoiced = schoolInvoices
    .filter((inv) => inv.type === "original")
    .reduce((sum, inv) => sum + inv.totalAmount, 0);

  const additionalInvoiced = schoolInvoices
    .filter((inv) => inv.type === "additional")
    .reduce((sum, inv) => sum + inv.totalAmount, 0);

  const totalInvoiced = originalInvoiced + additionalInvoiced;
  const totalPaid = schoolInvoices
    .filter((inv) => inv.status === "paid")
    .reduce((sum, inv) => sum + inv.totalAmount, 0);
  const outstandingBalance = totalInvoiced - totalPaid;

  const schoolZone = zones.find(z => z.id === currentSchool?.zone_id || z.name === currentSchool?.zone);

  const levelStudents = useMemo(() => {
    return schoolStudents.filter(s => s.examLevel === finalizeLevel && !s.isAdditional);
  }, [schoolStudents, finalizeLevel]);

  const levelStats = useMemo(() => {
    return {
      totalStudents: levelStudents.length,
      subjectsRegistered: new Set(levelStudents.flatMap(s => s.subjects.map(sub => sub.subjectCode))).size,
      totalEntries: levelStudents.reduce((sum, s) => sum + s.totalEntries, 0),
      paymentStatus: "Pending Verification"
    };
  }, [levelStudents]);

  const handleDownloadSummary = () => {
    if (!currentSchool) return;
    generateOfficialSummaryPDF(
      {
        name: currentSchool.name,
        code: currentSchool.code,
        district: currentSchool.district,
        academicYear: currentSchool.academicYear,
      },
      levelStats
    );
    toast.success("Summary Form Downloaded", {
      description: "Please review, sign, and stamp this form."
    });
  };

  const handleFinalize = () => {
    if (!user?.schoolCode) return;
    
    finalizeRegistration(user.schoolCode, markingGuide, finalizeLevel, levelStudents);
    setIsFinalizeDialogOpen(false);
    setFinalizeStep(1);
    setIsVerified(false);
    toast.success(`${finalizeLevel} Registration Finalized`, {
      description: `${finalizeLevel} records have been locked and your invoice has been generated.`
    });
    onPageChange("payment-status");
  };

  const stats = [
    {
      title: "Invoice Amount",
      value: `${totalInvoiced.toLocaleString()} UGX`,
      subtitle: "Total billed to date",
      icon: CreditCard,
      borderClass: "border-l-blue-600",
      iconClass: "bg-blue-600/10 text-blue-600",
    },
    {
      title: "Amount Paid",
      value: `${totalPaid.toLocaleString()} UGX`,
      subtitle: "Total payments received",
      icon: CheckCircle,
      borderClass: "border-l-emerald-500",
      iconClass: "bg-emerald-500/10 text-emerald-600",
    },
    {
      title: "Balance",
      value: `${outstandingBalance.toLocaleString()} UGX`,
      subtitle: "Outstanding payment",
      icon: AlertTriangle,
      borderClass: outstandingBalance > 0 ? "border-l-orange-500" : "border-l-slate-200",
      iconClass: outstandingBalance > 0 ? "bg-orange-500/10 text-orange-600" : "bg-slate-100 text-slate-400",
    },
  ];

  const subjectSummary = Object.values(
    schoolStudents
      .filter((student) => isStudentFullyRegistered(student, subjects))
      .reduce<Record<string, { subject: string; code: string; entries: number; level: "UCE" | "UACE" }>>(
        (acc, student) => {
          const uniqueSubjects = new Set(
            student.subjects.map((subject) => `${student.examLevel}:${subject.subjectCode}`),
          );

          uniqueSubjects.forEach((key) => {
            const match = student.subjects.find(
              (subject) => `${student.examLevel}:${subject.subjectCode}` === key,
            );
            if (!match) return;

            if (!acc[key]) {
              acc[key] = {
                subject: match.subjectName,
                code: match.subjectCode,
                entries: 0,
                level: student.examLevel,
              };
            }

            acc[key].entries += 1;
          });

          return acc;
        },
        {},
      ),
  )
    .sort((left, right) => right.entries - left.entries || left.code.localeCompare(right.code))
    .slice(0, 10); // Show more subjects if needed

  const upcomingExams = [
    {
      subject: "Mathematics",
      date: "2026-05-15",
      time: "09:00 AM",
      duration: "3 hours",
    },
    {
      subject: "English Language",
      date: "2026-05-16",
      time: "09:00 AM",
      duration: "2.5 hours",
    },
    {
      subject: "Physics",
      date: "2026-05-18",
      time: "09:00 AM",
      duration: "3 hours",
    },
  ];

  const completionSteps = [
    { label: "School Registration", completed: true },
    { label: "Add Students", completed: schoolStudents.length > 0 },
    { 
      label: "Subject Entries", 
      completed: schoolStudents.length > 0 && schoolStudents.every(s => isStudentFullyRegistered(s, subjects)) 
    },
    {
      label: "Payment Submission",
      completed: schoolInvoices.some(inv => inv.status === "paid" || inv.paymentProof),
    },
    { 
      label: "Signed Form Upload", 
      completed: 
        user?.status === "payment_submitted" || 
        user?.status === "verified" || 
        user?.status === "active" 
    },
  ];

  const completedSteps = completionSteps.filter((step) => step.completed).length;
  const completionPercentage = (completedSteps / completionSteps.length) * 100;

  return (
    <div className="mx-auto flex w-full max-w-[1240px] flex-col gap-6 anim-fade-up">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between anim-fade-up-delay">
        <div className="space-y-1">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">
            School Workspace
          </p>
          <div>
            <h1 className="text-3xl font-black tracking-tight text-slate-900">School Dashboard</h1>
            <p className="mt-1 max-w-2xl text-sm font-medium text-slate-500">
              Welcome back, {user?.name}. Track registration progress and entries in real-time.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-2.5 shadow-sm transition-all hover:shadow-md">
          <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-xl border border-slate-100 bg-slate-50">
            {currentSchool?.schoolLogo ? (
              <img
                src={currentSchool.schoolLogo}
                alt={`${currentSchool.name} logo`}
                className="h-full w-full object-cover"
              />
            ) : (
              <ImageIcon className="h-5 w-5 text-slate-300" />
            )}
          </div>
          <div className="pr-4">
            <p className="text-sm font-black text-slate-900 leading-tight">
              {currentSchool?.name ?? user?.name}
            </p>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">
              Academic year: <span className="text-slate-600">{user?.academicYear ?? "2026"}</span>
            </p>
          </div>
        </div>
      </div>

      {/* Registration Incomplete Alert - Enhanced with persistent orange button */}
      {user?.status !== "active" && (
        <Alert variant="warning" className="border-orange-200 bg-orange-50/50 shadow-sm">
          <Info className="h-5 w-5 text-orange-600" />
          <AlertTitle className="text-orange-900 font-bold text-base">Registration Action Required</AlertTitle>
          <AlertDescription className="text-orange-700 mt-1">
            {schoolInvoices.length === 0 
              ? "You must finalize your student registration to generate an invoice and proceed with payment."
              : "Please complete your payment and upload the signed form to activate your portal fully."}
            <div className="mt-4 flex flex-wrap gap-3">
              <Button 
                onClick={() => onPageChange(schoolInvoices.length === 0 ? "students" : "payment-status")}
                className="bg-[#f97316] hover:bg-[#ea580c] text-white font-black rounded-xl h-11 px-6 shadow-lg shadow-orange-200 transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center gap-2"
              >
                <ArrowRightCircle className="h-5 w-5" />
                <span className="text-sm">Complete Registration</span>
              </Button>
              {schoolInvoices.length > 0 && (
                <Button 
                  variant="outline"
                  onClick={() => onPageChange("reports")}
                  className="border-orange-200 text-orange-700 hover:bg-orange-100 rounded-xl h-11 px-6"
                >
                  View My Reports
                </Button>
              )}
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Legacy Alert - kept only if status is pending/verified but not active */}
      {user?.status !== "active" && user?.status !== "pending" && schoolInvoices.length > 0 && (
        <>
          {user?.status === "pending" && (
            <Alert variant="warning">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Account Pending Verification</AlertTitle>
              <AlertDescription>
                Your account is awaiting payment review. Some actions may remain
                limited until verification is complete.
              </AlertDescription>
            </Alert>
          )}

          {user?.status === "verified" && (
            <Alert variant="info">
              <Clock className="h-4 w-4" />
              <AlertTitle>Payment Confirmed</AlertTitle>
              <AlertDescription>
                Your payment has been confirmed and your school is awaiting final
                activation.
              </AlertDescription>
            </Alert>
          )}
        </>
      )}

      {user?.status === "active" && (
        <Alert variant="success" className="bg-emerald-50 border-emerald-100">
          <CheckCircle className="h-4 w-4 text-emerald-600" />
          <AlertTitle className="text-emerald-900 font-bold">Portal Fully Active</AlertTitle>
          <AlertDescription className="text-emerald-700">
            Your registration is complete and all school portal features are
            available.
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {stats.map((stat) => {
          const Icon = stat.icon;

          return (
            <Card key={stat.title} className={`h-full border-l-4 ${stat.borderClass} transition-all duration-200 hover:shadow-md`}>
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <p className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                      {stat.title}
                    </p>
                    <div className="flex flex-col">
                      <p className="text-2xl font-black text-slate-900 leading-tight">
                        {stat.value}
                      </p>
                      <p className="text-[10px] font-medium text-slate-400 mt-0.5">
                        {stat.subtitle}
                      </p>
                    </div>
                  </div>
                  <div
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${stat.iconClass}`}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg font-bold text-slate-900">Payment Summary</CardTitle>
                <CardDescription>Consolidated financial overview</CardDescription>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                className="h-8 rounded-lg border-slate-200"
                onClick={() => onPageChange("payment-status")}
              >
                <CreditCard className="mr-2 h-3.5 w-3.5" />
                View Invoices
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 mb-6">
              <div className="rounded-2xl border border-slate-100 bg-slate-50/50 p-4 transition-all hover:bg-white hover:shadow-sm">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Total Invoice Amount</p>
                <p className="mt-2 text-xl font-black text-slate-900">{totalInvoiced.toLocaleString()} <span className="text-[10px] font-bold text-slate-400">UGX</span></p>
              </div>
              <div className="rounded-2xl border border-green-100 bg-green-50/30 p-4 transition-all hover:bg-white hover:shadow-sm">
                <p className="text-xs font-bold uppercase tracking-wider text-green-600">Amount Paid</p>
                <p className="mt-2 text-xl font-black text-green-700">{totalPaid.toLocaleString()} <span className="text-[10px] font-bold text-green-400">UGX</span></p>
              </div>
              <div className="rounded-2xl border border-orange-100 bg-orange-50/30 p-4 transition-all hover:bg-white hover:shadow-sm">
                <p className="text-xs font-bold uppercase tracking-wider text-orange-600">Remaining Balance</p>
                <p className="mt-2 text-xl font-black text-orange-700">{outstandingBalance.toLocaleString()} <span className="text-[10px] font-bold text-orange-400">UGX</span></p>
              </div>
            </div>

            {additionalInvoiced > 0 && (
              <div className="pt-4 border-t border-slate-100">
                <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Invoice Breakdown</p>
                <div className="flex flex-wrap gap-4">
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-100">
                    <div className="h-2 w-2 rounded-full bg-blue-500" />
                    <span className="text-xs font-bold text-slate-600">Original:</span>
                    <span className="text-xs font-black text-slate-900">{originalInvoiced.toLocaleString()} UGX</span>
                  </div>
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-100">
                    <div className="h-2 w-2 rounded-full bg-orange-500" />
                    <span className="text-xs font-bold text-slate-600">Additional:</span>
                    <span className="text-xs font-black text-slate-900">{additionalInvoiced.toLocaleString()} UGX</span>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-bold text-slate-900">Status Check</CardTitle>
            <CardDescription>Registration health</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/50 p-3">
              <div className="flex items-center gap-3">
                <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${currentSchool?.registrationFinalized ? "bg-green-100 text-green-600" : "bg-slate-100 text-slate-400"}`}>
                  <CheckCircle className="h-4 w-4" />
                </div>
                <span className="text-sm font-semibold text-slate-700">Finalized</span>
              </div>
              <Badge variant={currentSchool?.registrationFinalized ? "success" : "secondary"}>
                {currentSchool?.registrationFinalized ? "YES" : "NO"}
              </Badge>
            </div>
            <div className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/50 p-3">
              <div className="flex items-center gap-3">
                <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${outstandingBalance === 0 && totalInvoiced > 0 ? "bg-green-100 text-green-600" : "bg-slate-100 text-slate-400"}`}>
                  <CreditCard className="h-4 w-4" />
                </div>
                <span className="text-sm font-semibold text-slate-700">Cleared</span>
              </div>
              <Badge variant={outstandingBalance === 0 && totalInvoiced > 0 ? "success" : "secondary"}>
                {outstandingBalance === 0 && totalInvoiced > 0 ? "YES" : "NO"}
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid w-full gap-4 xl:grid-cols-3">
        <Card className="w-full">
          <CardHeader>
            <CardTitle className="text-slate-900">Submission Progress</CardTitle>
            <CardDescription className="text-slate-500">
              Complete each step to finalise registration
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-white shadow-sm border border-slate-200 rounded-2xl p-4">
              <div className="mb-3 flex items-center justify-between text-sm">
                <span className="text-slate-500">Completion</span>
                <span className="font-semibold text-slate-900">
                  {completedSteps}/{completionSteps.length}
                </span>
              </div>
              <Progress value={completionPercentage} className="h-2.5" />
            </div>

            <div className="space-y-2.5">
              {completionSteps.map((step, index) => (
                <div
                  key={index}
                  className={`shadow-sm border rounded-2xl flex items-center gap-3 px-4 py-3 transition-all ${
                    step.completed
                      ? "bg-emerald-50/60 border-emerald-200"
                      : "bg-white border-slate-200"
                  }`}
                >
                  <div
                    className={`flex h-9 w-9 items-center justify-center rounded-full ${
                      step.completed
                        ? "bg-emerald-500 text-white shadow-md shadow-emerald-200"
                        : "bg-slate-100 text-slate-400"
                    }`}
                  >
                    {step.completed ? (
                      <CheckCircle className="h-5 w-5" />
                    ) : (
                      <span className="text-sm font-bold">{index + 1}</span>
                    )}
                  </div>
                  <div className="flex flex-col">
                    <span
                      className={`text-sm font-bold ${
                        step.completed ? "text-emerald-900" : "text-slate-500"
                      }`}
                    >
                      {step.label}
                    </span>
                    {step.completed && (
                      <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-tight">Step Completed</span>
                    )}
                  </div>
                  {step.completed && (
                    <div className="ml-auto">
                      <Badge className="bg-emerald-500 text-white border-none hover:bg-emerald-600">
                        <CheckCircle className="mr-1 h-3 w-3" />
                        Done
                      </Badge>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {user?.status !== "active" && (
              <Button className="w-full" onClick={() => onPageChange("payment-status")}>
                Continue Registration
              </Button>
            )}
          </CardContent>
        </Card>

        <Card className="w-full">
          <CardHeader className="border-b border-slate-200">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <CardTitle className="text-slate-900">Selected Subjects</CardTitle>
                <CardDescription className="text-slate-500">
                  Overview of registered subject entries
                </CardDescription>
              </div>
              <Button
                variant="outline"
                className="w-full lg:w-auto"
                onClick={() => onPageChange("students")}
              >
                Manage Subject Entries
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-2.5 pt-4">
            {subjectSummary.map((item) => (
              <div
                key={item.code}
                className="bg-white shadow-sm border border-slate-200 rounded-2xl flex items-center justify-between gap-4 p-3 transition-colors hover:bg-slate-50"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <BookOpen className="h-4 w-4 text-orange-500" />
                    <span className="truncate font-semibold text-slate-900">
                      {item.subject}
                    </span>
                    <Badge variant="secondary">{item.code}</Badge>
                  </div>
                  <p className="mt-1 text-xs text-slate-500">
                    {item.level} candidates
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-slate-900">
                    {item.entries}
                  </div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">No. of students</div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="w-full">
          <CardHeader className="border-b border-slate-200">
            <CardTitle className="text-slate-900">Examination Reports</CardTitle>
            <CardDescription className="text-slate-500">
              Generate and download official registration forms
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4 space-y-3">
            <div className="flex flex-col gap-3">
              {uceStudents > 0 && (
                <Button
                  variant="outline"
                  className="w-full justify-start gap-3 h-auto py-3 rounded-2xl border-slate-200 hover:bg-slate-50 transition-colors"
                  onClick={() => generateWPF_PDF("UCE", {
                    name: currentSchool?.name || "",
                    code: currentSchool?.code || "",
                    district: currentSchool?.district || "",
                    zone: schoolZone?.name || currentSchool?.zone || "",
                    telephone: currentSchool?.phone || "",
                    email: currentSchool?.email || "",
                    academicYear: user?.academicYear || "2026"
                  }, schoolStudents)}
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600">
                    <FileText className="h-5 w-5" />
                  </div>
                  <div className="text-left">
                    <div className="font-semibold text-slate-900 text-sm">UCE Weekly Packing Form (WPF)</div>
                    <div className="text-[10px] text-slate-500 uppercase font-bold tracking-tight">Official Packing List for O-Level</div>
                  </div>
                </Button>
              )}
              {uaceStudents > 0 && (
                <Button
                  variant="outline"
                  className="w-full justify-start gap-3 h-auto py-3 rounded-2xl border-slate-200 hover:bg-slate-50 transition-colors"
                  onClick={() => generateWPF_PDF("UACE", {
                    name: currentSchool?.name || "",
                    code: currentSchool?.code || "",
                    district: currentSchool?.district || "",
                    zone: schoolZone?.name || currentSchool?.zone || "",
                    telephone: currentSchool?.phone || "",
                    email: currentSchool?.email || "",
                    academicYear: user?.academicYear || "2026"
                  }, schoolStudents)}
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-500/10 text-purple-600">
                    <FileText className="h-5 w-5" />
                  </div>
                  <div className="text-left">
                    <div className="font-semibold text-slate-900 text-sm">UACE Weekly Packing Form (WPF)</div>
                    <div className="text-[10px] text-slate-500 uppercase font-bold tracking-tight">Official Packing List for A-Level</div>
                  </div>
                </Button>
              )}
              {schoolStudents.length === 0 && (
                <p className="text-sm text-slate-500 text-center py-4">
                  Add students to enable WPF generation.
                </p>
              )}
              
              <div className="mt-4 pt-4 border-t border-slate-100">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 text-center">Important Note</p>
                <p className="text-[10px] text-slate-500 text-center leading-relaxed">
                  The WPF must be printed and signed by the Headteacher before submission to the Secretariat.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="w-full">
        <CardHeader className="border-b border-slate-200">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <CardTitle className="text-slate-900">Timetable Preview</CardTitle>
              <CardDescription className="text-slate-500">
                Upcoming examinations for your school
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange("timetable")}
            >
              View Full Timetable
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {upcomingExams.map((exam, index) => (
              <div
                key={index}
                className="bg-white shadow-sm border border-slate-200 rounded-2xl p-3"
              >
                <div className="mb-2 flex items-center justify-between">
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-orange-600/10 text-orange-600">
                    <Calendar className="h-4 w-4" />
                  </div>
                  <Badge variant="info">Upcoming</Badge>
                </div>
                <h4 className="font-semibold text-slate-900">{exam.subject}</h4>
                <div className="mt-2 space-y-0.5 text-sm text-slate-500">
                  <p>Date: {new Date(exam.date).toLocaleDateString()}</p>
                  <p>Time: {exam.time}</p>
                  <p>Duration: {exam.duration}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {user?.status === "active" && schoolZone && (
        <div className="grid gap-4 md:grid-cols-2">
          <Card className="w-full border-l-4 border-l-primary">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-bold text-slate-900">Zone Leader</CardTitle>
              <CardDescription>Contact information for {schoolZone.name}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-2xl border border-slate-100 bg-slate-50/50 p-4">
                <p className="text-sm font-bold text-slate-900">{schoolZone.leaderName}</p>
                <div className="mt-3 space-y-2">
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <Phone className="h-4 w-4 text-primary" />
                    <span>{schoolZone.leaderPhone}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <Mail className="h-4 w-4 text-primary" />
                    <span>{schoolZone.leaderEmail}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="w-full border-l-4 border-l-amber-500">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-bold text-slate-900">WAKISSHA SECRETARIAT</CardTitle>
              <CardDescription>Portal support</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-2xl border border-slate-100 bg-slate-50/50 p-4">
                <p className="text-sm font-bold text-slate-900">{schoolZone.secretariatName}</p>
                <div className="mt-3 space-y-2">
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <Phone className="h-4 w-4 text-amber-500" />
                    <span>{schoolZone.secretariatPhone}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <Mail className="h-4 w-4 text-amber-500" />
                    <span>{schoolZone.secretariatEmail}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Button
          variant="outline"
          className="h-auto w-full items-start justify-start rounded-2xl px-4 py-4 text-left"
          onClick={() => onPageChange("add-student")}
        >
          <div className="mr-3 shrink-0 flex h-10 w-10 items-center justify-center rounded-xl bg-orange-600/10 text-orange-600">
            <Users className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="font-semibold text-slate-900 truncate">
              {showAdditionalLabel ? "Add Additional Student" : "Add Student"}
            </div>
            <div className="mt-1 text-xs text-slate-500 whitespace-normal line-clamp-2">
              {showAdditionalLabel 
                ? "Register a new candidate post-finalization" 
                : "Register a new candidate for examination entries"}
            </div>
          </div>
        </Button>

        <Button
          variant="outline"
          className="h-auto w-full items-start justify-start rounded-2xl px-4 py-4 text-left"
          onClick={() => onPageChange("upload-pdf")}
        >
          <div className="mr-3 shrink-0 flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600">
            <Upload className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="font-semibold text-slate-900 truncate">Upload Signed Form</div>
            <div className="mt-1 text-xs text-slate-500 whitespace-normal line-clamp-2">
              Submit the authorised registration form for review
            </div>
          </div>
        </Button>

        <Button
          variant="outline"
          className="h-auto w-full items-start justify-start rounded-2xl px-4 py-4 text-left"
          onClick={() => onPageChange("reports")}
        >
          <div className="mr-3 shrink-0 flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600">
            <CheckCircle className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="font-semibold text-slate-900 truncate">My Reports</div>
            <div className="mt-1 text-xs text-slate-500 whitespace-normal line-clamp-2">
              Review school registration summaries and downloads
            </div>
          </div>
        </Button>

        {!isAllFinalized ? (
          <Button
            variant="default"
            className="h-auto w-full items-start justify-start rounded-2xl px-4 py-4 text-left bg-slate-900 hover:bg-slate-800 border-none shadow-lg shadow-slate-200"
            onClick={() => setIsFinalizeDialogOpen(true)}
          >
            <div className="mr-3 shrink-0 flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-white">
              <Lock className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="font-semibold text-white truncate">
                Finalize {(!isUceFinalized && !isUaceFinalized) ? "" : (isUceFinalized ? "UACE " : "UCE ")}Registration
              </div>
              <div className="mt-1 text-xs text-slate-300 whitespace-normal line-clamp-2">
                Lock records and generate your invoice
              </div>
            </div>
          </Button>
        ) : (
          <Button
            variant="outline"
            className="h-auto w-full items-start justify-start rounded-2xl px-4 py-4 text-left border-emerald-100 bg-emerald-50/50 cursor-default hover:bg-emerald-50/50"
            disabled
          >
            <div className="mr-3 shrink-0 flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500 text-white">
              <CheckCircle className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="font-semibold text-emerald-900 truncate">Registration Finalized</div>
              <div className="mt-1 text-xs text-emerald-600 font-medium whitespace-normal line-clamp-2">
                Your records are locked and invoice generated
              </div>
            </div>
          </Button>
        )}
      </div>

      <Dialog open={isFinalizeDialogOpen} onOpenChange={(open) => {
        setIsFinalizeDialogOpen(open);
        if (!open) {
          setFinalizeStep(1);
          setIsVerified(false);
        }
      }}>
        <DialogContent className="sm:max-w-[600px] rounded-3xl" aria-describedby="finalize-description">
          <DialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="h-10 w-10 rounded-2xl bg-orange-600/10 flex items-center justify-center text-orange-600">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <div>
                <DialogTitle className="text-2xl font-bold text-slate-900">Finalize Registration</DialogTitle>
                <DialogDescription id="finalize-description" className="text-slate-500">
                  Step {finalizeStep} of 3: {finalizeStep === 1 ? "Configuration" : finalizeStep === 2 ? "Verification" : "Confirmation"}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          
          <div className="space-y-6 py-4">
            {finalizeStep === 1 && (
              <div className="space-y-6">
                <div className="space-y-4">
                  <Label className="text-sm font-bold text-slate-700">Select Exam Level to Finalize</Label>
                  <RadioGroup 
                    value={finalizeLevel} 
                    onValueChange={(value: "UCE" | "UACE") => setFinalizeLevel(value)}
                    className="grid grid-cols-2 gap-4"
                  >
                    <div>
                      <RadioGroupItem value="UCE" id="uce" disabled={isUceFinalized} className="peer sr-only" />
                      <Label
                        htmlFor="uce"
                        className={`flex flex-col items-center justify-between rounded-xl border-2 bg-popover p-4 hover:bg-slate-50 peer-data-[state=checked]:border-slate-900 [&:has([data-state=checked])]:border-slate-900 ${isUceFinalized ? "opacity-50 grayscale cursor-not-allowed" : "cursor-pointer"}`}
                      >
                        <span className="text-sm font-bold">UCE (O-Level)</span>
                        {isUceFinalized && <span className="text-[10px] text-emerald-600 font-bold mt-1">FINALIZED</span>}
                      </Label>
                    </div>
                    <div>
                      <RadioGroupItem value="UACE" id="uace" disabled={isUaceFinalized} className="peer sr-only" />
                      <Label
                        htmlFor="uace"
                        className={`flex flex-col items-center justify-between rounded-xl border-2 bg-popover p-4 hover:bg-slate-50 peer-data-[state=checked]:border-slate-900 [&:has([data-state=checked])]:border-slate-900 ${isUaceFinalized ? "opacity-50 grayscale cursor-not-allowed" : "cursor-pointer"}`}
                      >
                        <span className="text-sm font-bold">UACE (A-Level)</span>
                        {isUaceFinalized && <span className="text-[10px] text-emerald-600 font-bold mt-1">FINALIZED</span>}
                      </Label>
                    </div>
                  </RadioGroup>
                </div>

                <div className="space-y-4">
                  <Label className="text-sm font-bold text-slate-700">Select Marking Guide (25,000 UGX each)</Label>
                  <RadioGroup 
                    value={markingGuide} 
                    onValueChange={(value: "Arts" | "Sciences" | "Both") => setMarkingGuide(value)}
                    className="grid grid-cols-1 gap-3"
                  >
                    <div className="flex items-center space-x-3 p-4 rounded-2xl border border-slate-200 hover:bg-slate-50 transition-colors cursor-pointer">
                      <RadioGroupItem value="Arts" id="arts" />
                      <Label htmlFor="arts" className="flex-1 font-semibold cursor-pointer">Arts Only</Label>
                      <Badge variant="secondary">25,000 UGX</Badge>
                    </div>
                    <div className="flex items-center space-x-3 p-4 rounded-2xl border border-slate-200 hover:bg-slate-50 transition-colors cursor-pointer">
                      <RadioGroupItem value="Sciences" id="sciences" />
                      <Label htmlFor="sciences" className="flex-1 font-semibold cursor-pointer">Sciences Only</Label>
                      <Badge variant="secondary">25,000 UGX</Badge>
                    </div>
                    <div className="flex items-center space-x-3 p-4 rounded-2xl border border-slate-200 hover:bg-slate-50 transition-colors cursor-pointer">
                      <RadioGroupItem value="Both" id="both" />
                      <Label htmlFor="both" className="flex-1 font-semibold cursor-pointer">Both (Arts & Sciences)</Label>
                      <Badge variant="secondary">50,000 UGX</Badge>
                    </div>
                  </RadioGroup>
                </div>
              </div>
            )}

            {finalizeStep === 2 && (
              <div className="space-y-6">
                <div className="bg-slate-50 rounded-2xl border border-slate-200 overflow-hidden">
                  <div className="bg-slate-900 px-4 py-3 text-white">
                    <p className="text-sm font-bold flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Summary of Entries: {finalizeLevel}
                    </p>
                  </div>
                  <div className="divide-y divide-slate-100">
                    <div className="flex justify-between px-4 py-3 text-sm">
                      <span className="text-slate-500 font-medium">Total Enrolled Students</span>
                      <span className="font-bold text-slate-900">{levelStats.totalStudents}</span>
                    </div>
                    <div className="flex justify-between px-4 py-3 text-sm">
                      <span className="text-slate-500 font-medium">Subjects Registered</span>
                      <span className="font-bold text-slate-900">{levelStats.subjectsRegistered}</span>
                    </div>
                    <div className="flex justify-between px-4 py-3 text-sm">
                      <span className="text-slate-500 font-medium">Total Entries</span>
                      <span className="font-bold text-slate-900">{levelStats.totalEntries}</span>
                    </div>
                    <div className="flex justify-between px-4 py-3 text-sm">
                      <span className="text-slate-500 font-medium">Payment Status</span>
                      <span className="font-bold text-orange-600 uppercase tracking-wider text-xs">Awaiting Finalization</span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col items-center gap-4 p-6 border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
                  <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                    <Download className="h-6 w-6" />
                  </div>
                  <div className="text-center">
                    <p className="font-bold text-slate-900">Generate Official Summary Form</p>
                    <p className="text-xs text-slate-500 mt-1 max-w-[300px]">
                      Download and review the official WAKISSHA summary form for your school records.
                    </p>
                  </div>
                  <Button 
                    onClick={handleDownloadSummary}
                    variant="outline" 
                    className="rounded-xl font-bold border-blue-200 text-blue-600 hover:bg-blue-50"
                  >
                    <FileText className="mr-2 h-4 w-4" />
                    Download Official Summary (PDF)
                  </Button>
                </div>
              </div>
            )}

            {finalizeStep === 3 && (
              <div className="space-y-6">
                <Alert className="bg-amber-50 border-amber-100 text-amber-800 rounded-2xl">
                  <AlertTriangle className="h-5 w-5" />
                  <AlertTitle className="font-bold text-lg">Final Verification Required</AlertTitle>
                  <AlertDescription className="text-sm leading-relaxed">
                    By finalizing, you confirm that all student details and subject entries for <strong>{finalizeLevel}</strong> are correct. 
                    Once finalized, these records will be locked and an invoice will be generated.
                  </AlertDescription>
                </Alert>

                <div className="flex items-start space-x-3 p-5 rounded-2xl border-2 border-slate-900 bg-slate-50">
                  <Checkbox 
                    id="verify-checkbox" 
                    checked={isVerified} 
                    onCheckedChange={(checked) => setIsVerified(checked as boolean)}
                    className="mt-1 h-5 w-5 border-slate-900 data-[state=checked]:bg-slate-900"
                  />
                  <Label htmlFor="verify-checkbox" className="text-sm font-bold text-slate-900 leading-snug cursor-pointer">
                    I have reviewed the summary form and verified that all {levelStats.totalStudents} student records are accurate. I am ready to generate the invoice.
                  </Label>
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="gap-2 sm:gap-0 border-t pt-6">
            <div className="flex w-full justify-between items-center">
              {finalizeStep > 1 ? (
                <Button 
                  variant="ghost" 
                  onClick={() => setFinalizeStep(prev => prev - 1)} 
                  className="rounded-xl font-bold text-slate-500 hover:text-slate-900"
                >
                  <ChevronLeft className="mr-2 h-4 w-4" />
                  Back
                </Button>
              ) : (
                <Button variant="ghost" onClick={() => setIsFinalizeDialogOpen(false)} className="rounded-xl font-bold text-slate-500">
                  Cancel
                </Button>
              )}

              {finalizeStep < 3 ? (
                <Button 
                  onClick={() => setFinalizeStep(prev => prev + 1)} 
                  className="rounded-xl font-bold bg-slate-900 hover:bg-slate-800 px-8"
                >
                  Next Step
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              ) : (
                <Button 
                  onClick={handleFinalize} 
                  disabled={!isVerified}
                  className="rounded-xl font-bold bg-green-600 hover:bg-green-700 px-8 shadow-lg shadow-green-100 disabled:opacity-50"
                >
                  Finalize & Generate Invoice
                  <CheckCircle className="ml-2 h-4 w-4" />
                </Button>
              )}
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
