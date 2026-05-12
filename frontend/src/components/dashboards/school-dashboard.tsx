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
  Download,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { Button } from "../ui/button";
import { Input as FormInput } from "../ui/input";
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
import { RadioGroup, RadioGroupItem } from "../ui/radio-group";
import { Checkbox } from "../ui/checkbox";
import { toast } from "sonner";

interface SchoolDashboardProps {
  onPageChange: (page: string) => void;
}

export function SchoolDashboard({ onPageChange }: SchoolDashboardProps) {
  const { user, schools, students, invoices, zones, subjects, finaliseRegistration } = useAuth();
  const [isFinaliseDialogOpen, setIsFinaliseDialogOpen] = useState(false);
  const [finaliseStep, setFinaliseStep] = useState(1);
  const [isVerified, setIsVerified] = useState(false);
  const [markingGuide, setMarkingGuide] = useState<"Arts" | "Sciences" | "Both">("Arts");
  const [uceMarkingGuideQuantity, setUceMarkingGuideQuantity] = useState(1);
  const [uaceArtsMarkingGuideQuantity, setUaceArtsMarkingGuideQuantity] = useState(0);
  const [uaceSciencesMarkingGuideQuantity, setUaceSciencesMarkingGuideQuantity] = useState(0);
  const [answerBookletsQuantity, setAnswerBookletsQuantity] = useState(0);

  const currentSchool = schools.find((school) => school.code === user?.schoolCode);
  const isUceFinalised = currentSchool?.uceRegistrationFinalised ?? false;
  const isUaceFinalised = currentSchool?.uaceRegistrationFinalised ?? false;
  const isAllFinalised = (currentSchool?.educationLevel === "UCE" && isUceFinalised) || 
                         (currentSchool?.educationLevel === "UACE" && isUaceFinalised) ||
                         (isUceFinalised && isUaceFinalised);

  const [finaliseLevel, setFinaliseLevel] = useState<"UCE" | "UACE">("UCE");

  const schoolStudents = students.filter((student) => student.schoolCode === user?.schoolCode);
  const uceStudents = schoolStudents.filter((student) => student.examLevel === "UCE").length;
  const uaceStudents = schoolStudents.filter((student) => student.examLevel === "UACE").length;

  const showAdditionalLabel = (currentSchool?.educationLevel === "UCE" && isUceFinalised && uceStudents > 0) || 
                             (currentSchool?.educationLevel === "UACE" && isUaceFinalised && uaceStudents > 0) ||
                             (isUceFinalised && uceStudents > 0 && isUaceFinalised && uaceStudents > 0);

  const schoolInvoices = invoices.filter((inv) => inv.schoolCode === user?.schoolCode);

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
    return schoolStudents.filter(s => s.examLevel === finaliseLevel && !s.isAdditional);
  }, [schoolStudents, finaliseLevel]);

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

  const handleFinalise = () => {
    if (!user?.schoolCode) return;
    
    finaliseRegistration(
      user.schoolCode, 
      finaliseLevel, 
      levelStudents, 
      uceMarkingGuideQuantity, 
      uaceArtsMarkingGuideQuantity, 
      uaceSciencesMarkingGuideQuantity, 
      answerBookletsQuantity
    );
    setIsFinaliseDialogOpen(false);
    setFinaliseStep(1);
    setIsVerified(false);
    toast.success(`${finaliseLevel} Registration Finalised`, {
      description: `${finaliseLevel} records have been locked. Proceed to select marking guides and generate your invoice.`
    });
    onPageChange("make-payments");
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
    .slice(0, 10);

  const upcomingExams = [
    {
      subject: "Mathematics",
      date: "2026-05-15",
      time: "09:00 AM",
      duration: "3hrs",
    },
    {
      subject: "English Language",
      date: "2026-05-16",
      time: "09:00 AM",
      duration: "2hrs 30mins",
    },
    {
      subject: "Physics",
      date: "2026-05-18",
      time: "09:00 AM",
      duration: "3hrs",
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

      {user?.status !== "active" && (
        <Alert variant="warning" className="border-orange-200 bg-orange-50/50 shadow-sm">
          <Info className="h-5 w-5 text-orange-600" />
          <AlertTitle className="text-orange-900 font-bold text-base">Registration Action Required</AlertTitle>
          <AlertDescription className="text-orange-700 mt-1">
            {schoolInvoices.length === 0 
              ? "You must finalise your student registration to generate an invoice and proceed with payment."
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

      {user?.status === "active" && (
        <Alert variant="success" className="bg-emerald-50 border-emerald-100">
          <CheckCircle className="h-4 w-4 text-emerald-600" />
          <AlertTitle className="text-emerald-900 font-bold">Portal Fully Active</AlertTitle>
          <AlertDescription className="text-emerald-700">
            Your registration is complete and all school portal features are available.
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title} className={`h-full border-l-4 ${stat.borderClass} transition-all duration-200 hover:shadow-md`}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <p className="text-[9px] font-black uppercase tracking-wider text-slate-500">{stat.title}</p>
                    <div className="flex items-baseline gap-1">
                      <p className="text-xl font-black text-slate-900 leading-none">{stat.value}</p>
                      <p className="text-[9px] font-medium text-slate-400">{stat.subtitle}</p>
                    </div>
                  </div>
                  <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${stat.iconClass}`}>
                    <Icon className="h-4 w-4" />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg font-bold text-slate-900">Status Check</CardTitle>
                <CardDescription>Registration & payment health</CardDescription>
              </div>
              <Button variant="outline" size="sm" className="h-8 rounded-lg border-slate-200" onClick={() => onPageChange("payment-status")}>
                <CreditCard className="mr-2 h-3.5 w-3.5" />
                View Invoices
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/50 p-3">
              <div className="flex items-center gap-3">
                <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${currentSchool?.registrationFinalised ? "bg-green-100 text-green-600" : "bg-slate-100 text-slate-400"}`}>
                  <CheckCircle className="h-4 w-4" />
                </div>
                <span className="text-sm font-semibold text-slate-700">Finalised</span>
              </div>
              <Badge variant={currentSchool?.registrationFinalised ? "success" : "secondary"}>
                {currentSchool?.registrationFinalised ? "YES" : "NO"}
              </Badge>
            </div>
            <div className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/50 p-3">
              <div className="flex items-center gap-3">
                <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${currentSchool?.invoiceGenerated ? "bg-green-100 text-green-600" : "bg-slate-100 text-slate-400"}`}>
                  <FileText className="h-4 w-4" />
                </div>
                <span className="text-sm font-semibold text-slate-700">Invoice Generated</span>
              </div>
              <Badge variant={currentSchool?.invoiceGenerated ? "success" : "secondary"}>
                {currentSchool?.invoiceGenerated ? "YES" : "NO"}
              </Badge>
            </div>
            <div className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/50 p-3">
              <div className="flex items-center gap-3">
                <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${outstandingBalance === 0 && totalInvoiced > 0 ? "bg-green-100 text-green-600" : "bg-slate-100 text-slate-400"}`}>
                  <CreditCard className="h-4 w-4" />
                </div>
                <span className="text-sm font-semibold text-slate-700">Payment Cleared</span>
              </div>
              <Badge variant={outstandingBalance === 0 && totalInvoiced > 0 ? "success" : "secondary"}>
                {outstandingBalance === 0 && totalInvoiced > 0 ? "YES" : "NO"}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-bold text-slate-900">Quick Actions</CardTitle>
            <CardDescription>Common tasks</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button variant="outline" className="w-full justify-start rounded-xl h-11 border-slate-200 hover:bg-slate-50" onClick={() => onPageChange("add-student")}>
              <Users className="mr-3 h-4 w-4 text-orange-600" />
              <span className="font-semibold text-slate-700">{showAdditionalLabel ? "Add Additional Student" : "Add Student"}</span>
            </Button>
            <Button variant="outline" className="w-full justify-start rounded-xl h-11 border-slate-200 hover:bg-slate-50" onClick={() => onPageChange("upload-pdf")}>
              <Upload className="mr-3 h-4 w-4 text-amber-600" />
              <span className="font-semibold text-slate-700">Upload Signed Form</span>
            </Button>
            <Button variant="outline" className="w-full justify-start rounded-xl h-11 border-slate-200 hover:bg-slate-50" onClick={() => onPageChange("reports")}>
              <FileText className="mr-3 h-4 w-4 text-blue-600" />
              <span className="font-semibold text-slate-700">My Reports</span>
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="grid w-full gap-4 xl:grid-cols-3">
        <Card className="w-full">
          <CardHeader className="border-b border-slate-200 bg-slate-50/50">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-slate-900 flex items-center gap-2">
                  <Download className="h-5 w-5 text-emerald-600" />
                  Download Centre
                </CardTitle>
                <CardDescription className="text-slate-500">Access your generated documents</CardDescription>
              </div>
              <Badge variant="outline" className="bg-white">{isAllFinalised ? "Active" : "Locked"}</Badge>
            </div>
          </CardHeader>
          <CardContent className="pt-4 space-y-3">
            {!isUceFinalised && !isUaceFinalised ? (
              <div className="py-8 text-center space-y-3">
                <div className="mx-auto h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                  <Lock className="h-6 w-6" />
                </div>
                <p className="text-sm font-medium text-slate-500 max-w-[200px] mx-auto">Downloads become available after registration is finalised.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {isUceFinalised && (
                  <Button
                    variant="ghost"
                    className="w-full justify-between h-auto py-3 px-4 rounded-xl border border-slate-100 hover:bg-slate-50 hover:border-slate-200 transition-all group"
                    onClick={() => toast.info("Downloading UCE Summary...")}
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors">
                        <FileText className="h-5 w-5" />
                      </div>
                      <div className="text-left">
                        <p className="text-sm font-bold text-slate-900 leading-none">UCE Official Summary</p>
                        <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">Finalised O-Level</p>
                      </div>
                    </div>
                    <Download className="h-4 w-4 text-slate-300 group-hover:text-blue-600" />
                  </Button>
                )}
                {isUaceFinalised && (
                  <Button
                    variant="ghost"
                    className="w-full justify-between h-auto py-3 px-4 rounded-xl border border-slate-100 hover:bg-slate-50 hover:border-slate-200 transition-all group"
                    onClick={() => toast.info("Downloading UACE Summary...")}
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center group-hover:bg-purple-600 group-hover:text-white transition-colors">
                        <FileText className="h-5 w-5" />
                      </div>
                      <div className="text-left">
                        <p className="text-sm font-bold text-slate-900 leading-none">UACE Official Summary</p>
                        <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">Finalised A-Level</p>
                      </div>
                    </div>
                    <Download className="h-4 w-4 text-slate-300 group-hover:text-purple-600" />
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="w-full">
          <CardHeader>
            <CardTitle className="text-slate-900">Submission Progress</CardTitle>
            <CardDescription className="text-slate-500">Complete each step to finalise registration</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-white shadow-sm border border-slate-200 rounded-2xl p-4">
              <div className="mb-3 flex items-center justify-between text-sm">
                <span className="text-slate-500">Completion</span>
                <span className="font-semibold text-slate-900">{completedSteps}/{completionSteps.length}</span>
              </div>
              <Progress value={completionPercentage} className="h-2.5" />
            </div>
            <div className="space-y-2.5">
              {completionSteps.map((step, index) => (
                <div key={index} className={`shadow-sm border rounded-2xl flex items-center gap-3 px-4 py-3 transition-all ${step.completed ? "bg-emerald-50/60 border-emerald-200" : "bg-white border-slate-200"}`}>
                  <div className={`flex h-9 w-9 items-center justify-center rounded-full ${step.completed ? "bg-emerald-500 text-white shadow-md shadow-emerald-200" : "bg-slate-100 text-slate-400"}`}>
                    {step.completed ? <CheckCircle className="h-5 w-5" /> : <span className="text-sm font-bold">{index + 1}</span>}
                  </div>
                  <div className="flex flex-col">
                    <span className={`text-sm font-bold ${step.completed ? "text-emerald-900" : "text-slate-500"}`}>{step.label}</span>
                    {step.completed && <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-tight">Step Completed</span>}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="w-full">
          <CardHeader className="border-b border-slate-200">
            <CardTitle className="text-slate-900">Examination Reports</CardTitle>
            <CardDescription className="text-slate-500">Generate official registration forms</CardDescription>
          </CardHeader>
          <CardContent className="pt-4 space-y-3">
            <div className="flex flex-col gap-3">
              {uceStudents > 0 && (
                <Button variant="outline" className="w-full justify-start gap-3 h-auto py-3 rounded-2xl" onClick={() => generateWPF_PDF("UCE", {
                  name: currentSchool?.name || "",
                  code: currentSchool?.code || "",
                  district: currentSchool?.district || "",
                  zone: schoolZone?.name || currentSchool?.zone || "",
                  telephone: currentSchool?.phone || "",
                  email: currentSchool?.email || "",
                  academicYear: user?.academicYear || "2026"
                }, schoolStudents)}>
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600"><FileText className="h-5 w-5" /></div>
                  <div className="text-left"><div className="font-semibold text-slate-900 text-sm">UCE WPF</div></div>
                </Button>
              )}
              {uaceStudents > 0 && (
                <Button variant="outline" className="w-full justify-start gap-3 h-auto py-3 rounded-2xl" onClick={() => generateWPF_PDF("UACE", {
                  name: currentSchool?.name || "",
                  code: currentSchool?.code || "",
                  district: currentSchool?.district || "",
                  zone: schoolZone?.name || currentSchool?.zone || "",
                  telephone: currentSchool?.phone || "",
                  email: currentSchool?.email || "",
                  academicYear: user?.academicYear || "2026"
                }, schoolStudents)}>
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-500/10 text-purple-600"><FileText className="h-5 w-5" /></div>
                  <div className="text-left"><div className="font-semibold text-slate-900 text-sm">UACE WPF</div></div>
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {!isAllFinalised ? (
          <Button variant="default" className="h-auto w-full items-start justify-start rounded-2xl px-4 py-4 text-left bg-slate-900 hover:bg-slate-800" onClick={() => setIsFinaliseDialogOpen(true)}>
            <div className="mr-3 shrink-0 flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-white"><Lock className="h-5 w-5" /></div>
            <div className="min-w-0 flex-1">
              <div className="font-semibold text-white truncate">Finalise Registration</div>
              <div className="mt-1 text-xs text-slate-300">Lock records and generate invoice</div>
            </div>
          </Button>
        ) : (
          <Button variant="outline" className="h-auto w-full items-start justify-start rounded-2xl px-4 py-4 text-left border-emerald-100 bg-emerald-50/50" disabled>
            <div className="mr-3 shrink-0 flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500 text-white"><CheckCircle className="h-5 w-5" /></div>
            <div className="min-w-0 flex-1">
              <div className="font-semibold text-emerald-900 truncate">Registration Finalised</div>
            </div>
          </Button>
        )}
      </div>

      <Dialog open={isFinaliseDialogOpen} onOpenChange={(open) => {
        setIsFinaliseDialogOpen(open);
        if (!open) { setFinaliseStep(1); setIsVerified(false); }
      }}>
        <DialogContent className="sm:max-w-[800px] rounded-3xl">
          <DialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="h-10 w-10 rounded-2xl bg-orange-600/10 flex items-center justify-center text-orange-600"><ShieldCheck className="h-6 w-6" /></div>
              <div>
                <DialogTitle className="text-2xl font-bold text-slate-900">Finalise Registration</DialogTitle>
                <DialogDescription className="text-slate-500">Step {finaliseStep} of 3</DialogDescription>
              </div>
            </div>
          </DialogHeader>
          
          <div className="space-y-6 py-4">
            {finaliseStep === 1 && (
              <div className="space-y-6">
                <div className="space-y-4">
                  <Label className="text-sm font-bold text-slate-700">Select Exam Level to Finalise</Label>
                  <RadioGroup value={finaliseLevel} onValueChange={(value: "UCE" | "UACE") => setFinaliseLevel(value)} className="grid grid-cols-2 gap-4">
                    <div>
                      <RadioGroupItem value="UCE" id="uce" disabled={isUceFinalised} className="peer sr-only" />
                      <Label htmlFor="uce" className={`flex flex-col items-center justify-between rounded-xl border-2 p-4 ${isUceFinalised ? "opacity-50 grayscale cursor-not-allowed" : "cursor-pointer"} peer-data-[state=checked]:border-slate-900`}>
                        <span className="text-sm font-bold">UCE (O-Level)</span>
                        {isUceFinalised && <span className="text-[10px] text-emerald-600 font-bold mt-1">FINALISED</span>}
                      </Label>
                    </div>
                    <div>
                      <RadioGroupItem value="UACE" id="uace" disabled={isUaceFinalised} className="peer sr-only" />
                      <Label htmlFor="uace" className={`flex flex-col items-center justify-between rounded-xl border-2 p-4 ${isUaceFinalised ? "opacity-50 grayscale cursor-not-allowed" : "cursor-pointer"} peer-data-[state=checked]:border-slate-900`}>
                        <span className="text-sm font-bold">UACE (A-Level)</span>
                        {isUaceFinalised && <span className="text-[10px] text-emerald-600 font-bold mt-1">FINALISED</span>}
                      </Label>
                    </div>
                  </RadioGroup>
                </div>

                {finaliseLevel === "UCE" && (
                  <div className="space-y-4">
                    <Label className="text-sm font-bold text-slate-700">UCE Marking Guide (35,000 UGX per guide)</Label>
                    <div className="flex items-center space-x-3 p-4 rounded-2xl border border-slate-200 bg-slate-50">
                      <FormInput
                        type="number"
                        min="0"
                        value={uceMarkingGuideQuantity}
                        onChange={(e) => setUceMarkingGuideQuantity(parseInt(e.target.value))}
                        className="w-24 text-center font-bold"
                      />
                      <span className="font-semibold text-slate-700">Quantity</span>
                      <Badge variant="secondary">Total: {(uceMarkingGuideQuantity * 35000).toLocaleString()} UGX</Badge>
                    </div>
                  </div>
                )}

                {finaliseLevel === "UACE" && (
                  <div className="space-y-4">
                    <Label className="text-sm font-bold text-slate-700">UACE Marking Guides (25,000 UGX per guide)</Label>
                    <div className="space-y-3">
                      <div className="flex items-center space-x-3 p-4 rounded-2xl border border-slate-200 bg-slate-50">
                        <FormInput
                          type="number"
                          min="0"
                          value={uaceArtsMarkingGuideQuantity}
                          onChange={(e) => setUaceArtsMarkingGuideQuantity(parseInt(e.target.value))}
                          className="w-24 text-center font-bold"
                        />
                        <span className="font-semibold text-slate-700">Arts Guide Quantity</span>
                        <Badge variant="secondary">Total: {(uaceArtsMarkingGuideQuantity * 25000).toLocaleString()} UGX</Badge>
                      </div>
                      <div className="flex items-center space-x-3 p-4 rounded-2xl border border-slate-200 bg-slate-50">
                        <FormInput
                          type="number"
                          min="0"
                          value={uaceSciencesMarkingGuideQuantity}
                          onChange={(e) => setUaceSciencesMarkingGuideQuantity(parseInt(e.target.value))}
                          className="w-24 text-center font-bold"
                        />
                        <span className="font-semibold text-slate-700">Sciences Guide Quantity</span>
                        <Badge variant="secondary">Total: {(uaceSciencesMarkingGuideQuantity * 25000).toLocaleString()} UGX</Badge>
                      </div>
                    </div>
                  </div>
                )}

                <div className="space-y-4">
                  <Label className="text-sm font-bold text-slate-700">Answer Booklets (25,000 UGX per booklet)</Label>
                  <div className="flex items-center space-x-3 p-4 rounded-2xl border border-slate-200 bg-slate-50">
                    <FormInput
                      type="number"
                      min="0"
                      value={answerBookletsQuantity}
                      onChange={(e) => setAnswerBookletsQuantity(parseInt(e.target.value))}
                      className="w-24 text-center font-bold"
                    />
                    <span className="font-semibold text-slate-700">Quantity</span>
                    <Badge variant="secondary">Total: {(answerBookletsQuantity * 25000).toLocaleString()} UGX</Badge>
                  </div>
                </div>
              </div>
            )}

            {finaliseStep === 2 && (
              <div className="space-y-6">
                <div className="bg-slate-50 rounded-xl border border-slate-200 p-6 text-center space-y-4">
                  <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 text-blue-600"><Download className="h-6 w-6" /></div>
                  <div>
                    <p className="text-slate-900 font-semibold text-lg">Generate Official Summary Form</p>
                    <p className="text-slate-600 text-sm mt-1">Download and review the official summary form.</p>
                  </div>
                  <Button onClick={handleDownloadSummary} variant="outline" className="w-full rounded-xl">Download Summary (PDF)</Button>
                </div>
              </div>
            )}

            {finaliseStep === 3 && (
              <div className="space-y-6">
                <Alert className="bg-amber-50 border-amber-100 text-amber-800 rounded-2xl">
                  <AlertTriangle className="h-5 w-5" />
                  <AlertTitle className="font-bold">Final Verification Required</AlertTitle>
                  <AlertDescription>By finalising, you confirm all details are correct. Records will be locked.</AlertDescription>
                </Alert>
                <div className="flex items-start space-x-3 p-5 rounded-2xl border-2 border-slate-900 bg-slate-50">
                  <Checkbox id="verify-checkbox" checked={isVerified} onCheckedChange={(checked) => setIsVerified(checked as boolean)} />
                  <Label htmlFor="verify-checkbox" className="text-sm font-bold text-slate-900 cursor-pointer">I have reviewed and verified all student records.</Label>
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="gap-2 sm:gap-0 border-t pt-6">
            <div className="flex w-full justify-between items-center">
              {finaliseStep > 1 ? (
                <Button variant="ghost" onClick={() => setFinaliseStep(prev => prev - 1)}>Back</Button>
              ) : (
                <Button variant="ghost" onClick={() => setIsFinaliseDialogOpen(false)}>Cancel</Button>
              )}
              {finaliseStep < 3 ? (
                <Button onClick={() => setFinaliseStep(prev => prev + 1)}>Next Step</Button>
              ) : (
                <Button onClick={handleFinalise} disabled={!isVerified} className="bg-green-600 hover:bg-green-700">Finalise & Generate Invoice</Button>
              )}
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
