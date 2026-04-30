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
  FileText,
  Lock,
  Info,
  ArrowRightCircle,
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

  const [finalizeLevel, setFinalizeLevel] = useState<"UCE" | "UACE">("UCE");

  const schoolStudents = students.filter((student) => student.schoolCode === user?.schoolCode);
  const uceStudents = schoolStudents.filter((student) => student.examLevel === "UCE").length;
  const uaceStudents = schoolStudents.filter((student) => student.examLevel === "UACE").length;

  const showAdditionalLabel = (currentSchool?.educationLevel === "UCE" && isUceFinalized && uceStudents > 0) || 
                             (currentSchool?.educationLevel === "UACE" && isUaceFinalized && uaceStudents > 0) ||
                             (isUceFinalized && uceStudents > 0 && isUaceFinalized && uaceStudents > 0);

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
      bg: "bg-blue-50",
      border: "border-l-blue-500",
      color: "text-blue-600",
    },
    {
      title: "Amount Paid",
      value: `${totalPaid.toLocaleString()} UGX`,
      subtitle: "Total payments received",
      icon: CheckCircle,
      bg: "bg-emerald-50",
      border: "border-l-emerald-500",
      color: "text-emerald-600",
    },
    {
      title: "Balance",
      value: `${outstandingBalance.toLocaleString()} UGX`,
      subtitle: "Outstanding payment",
      icon: AlertTriangle,
      bg: outstandingBalance > 0 ? "bg-orange-50" : "bg-slate-50",
      border: outstandingBalance > 0 ? "border-l-orange-500" : "border-l-slate-200",
      color: outstandingBalance > 0 ? "text-orange-600" : "text-slate-400",
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
    .slice(0, 6);

  const quickActions = [
    {
      label: "Add Student",
      icon: Users,
      description: "Register a new candidate",
      page: "add-student",
    },
    {
      label: "Upload Signed Form",
      icon: Upload,
      description: "Submit signed registration form",
      page: "payment-status",
    },
    {
      label: "My Reports",
      icon: FileText,
      description: "Review school registration summary",
      page: "reports",
    },
  ];

  return (
    <div className="w-full max-w-[1400px] mx-auto px-6 py-8">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-10">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.3em] text-slate-400 mb-3">
            SCHOOL WORKSPACE
          </p>
          <h1 className="text-3xl font-black text-slate-900 leading-tight mb-2">
            School Dashboard
          </h1>
          <p className="text-slate-500 text-sm max-w-xl">
            Welcome back, {user?.name}. Track registration progress and entries in real-time.
          </p>
        </div>

        <div className="mt-6 md:mt-0 flex items-center gap-4 bg-white px-6 py-4 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-xl border border-slate-100 bg-slate-50">
            {currentSchool?.schoolLogo ? (
              <img
                src={currentSchool.schoolLogo}
                alt={`${currentSchool.name} logo`}
                className="h-full w-full object-cover"
              />
            ) : (
              <ImageIcon className="h-6 w-6 text-slate-300" />
            )}
          </div>
          <div>
            <p className="text-base font-black text-slate-900 leading-tight">
              {currentSchool?.name ?? user?.name}
            </p>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mt-0.5">
              Academic year: <span className="text-slate-600">{user?.academicYear ?? "2026"}</span>
            </p>
          </div>
        </div>
      </div>

      {/* Registration Alert */}
      {user?.status !== "active" && (
        <Alert className="mb-8 border-none bg-gradient-to-r from-orange-50 to-amber-50 shadow-sm">
          <Info className="h-5 w-5 text-orange-600" />
          <AlertTitle className="text-orange-900 font-black text-lg">Registration Action Required</AlertTitle>
          <AlertDescription className="text-orange-700 mt-2">
            {schoolInvoices.length === 0 
              ? "You must finalize your student registration to generate an invoice and proceed with payment."
              : "Please complete your payment and upload the signed form to activate your portal fully."}
            <div className="mt-4 flex flex-wrap gap-3">
              <Button 
                onClick={() => onPageChange(schoolInvoices.length === 0 ? "students" : "payment-status")}
                className="bg-orange-600 hover:bg-orange-700 text-white font-black rounded-xl h-11 px-6 shadow-lg shadow-orange-200 transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center gap-2"
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
        <Alert className="mb-8 border-none bg-emerald-50 shadow-sm">
          <CheckCircle className="h-5 w-5 text-emerald-600" />
          <AlertTitle className="text-emerald-900 font-black text-lg">Portal Fully Active</AlertTitle>
          <AlertDescription className="text-emerald-700 mt-2">
            Your registration is complete and all school portal features are available.
          </AlertDescription>
        </Alert>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card 
              key={stat.title} 
              className={`border-0 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden ${stat.border} border-l-4`}
            >
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                      {stat.title}
                    </p>
                    <p className="text-3xl font-black text-slate-900 mb-1">
                      {stat.value}
                    </p>
                    <p className="text-xs font-semibold text-slate-400">
                      {stat.subtitle}
                    </p>
                  </div>
                  <div className={`w-12 h-12 rounded-xl ${stat.bg} flex items-center justify-center ${stat.color}`}>
                    <Icon className="w-6 h-6" />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Payment Summary & Progress */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-0 border-b border-slate-100 mb-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <CardTitle className="text-lg font-black text-slate-900">Payment Summary</CardTitle>
                  <CardDescription className="text-slate-500 text-sm mt-1">
                    Consolidated financial overview
                  </CardDescription>
                </div>
                <Button 
                  variant="ghost" 
                  className="text-sm font-bold text-slate-700 hover:text-slate-900"
                  onClick={() => onPageChange("payment-status")}
                >
                  View Invoices
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div className="rounded-2xl bg-slate-50 border border-slate-100 p-5">
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Total Invoice Amount</p>
                  <p className="text-2xl font-black text-slate-900">{totalInvoiced.toLocaleString()} <span className="text-xs font-bold text-slate-400">UGX</span></p>
                </div>
                <div className="rounded-2xl bg-emerald-50 border border-emerald-100 p-5">
                  <p className="text-xs font-bold uppercase tracking-wider text-emerald-600 mb-1">Amount Paid</p>
                  <p className="text-2xl font-black text-emerald-700">{totalPaid.toLocaleString()} <span className="text-xs font-bold text-emerald-400">UGX</span></p>
                </div>
                <div className="rounded-2xl bg-orange-50 border border-orange-100 p-5">
                  <p className="text-xs font-bold uppercase tracking-wider text-orange-600 mb-1">Remaining Balance</p>
                  <p className="text-2xl font-black text-orange-700">{outstandingBalance.toLocaleString()} <span className="text-xs font-bold text-orange-400">UGX</span></p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-black text-slate-900">Registration Progress</CardTitle>
              <CardDescription className="text-slate-500 text-sm">
                Complete each step to finalise registration
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-white border border-slate-100 rounded-xl p-5">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-bold text-slate-500">Overall Completion</span>
                  <span className="text-sm font-black text-slate-900">
                    {completedSteps}/{completionSteps.length}
                  </span>
                </div>
                <Progress value={completionPercentage} className="h-3" />
              </div>

              <div className="space-y-3">
                {completionSteps.map((step, index) => (
                  <div
                    key={index}
                    className={`rounded-xl flex items-center gap-4 px-5 py-4 transition-all ${
                      step.completed
                        ? "bg-emerald-50/50 border border-emerald-100"
                        : "bg-slate-50/50 border border-slate-100"
                    }`}
                  >
                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-full ${
                        step.completed
                          ? "bg-emerald-500 text-white"
                          : "bg-slate-200 text-slate-500"
                      }`}
                    >
                      {step.completed ? (
                        <CheckCircle className="h-5 w-5" />
                      ) : (
                        <span className="text-sm font-black">{index + 1}</span>
                      )}
                    </div>
                    <div className="flex-1">
                      <span
                        className={`text-sm font-black ${
                          step.completed ? "text-emerald-900" : "text-slate-600"
                        }`}
                      >
                        {step.label}
                      </span>
                    </div>
                    {step.completed && (
                      <Badge className="bg-emerald-500 text-white border-none hover:bg-emerald-600">
                        Done
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Quick Actions & Subjects */}
        <div className="space-y-6">
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-black text-slate-900">Quick Actions</CardTitle>
              <CardDescription className="text-slate-500 text-sm">
                Common school portal tasks
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {quickActions.map((action) => {
                const Icon = action.icon;
                return (
                  <Button
                    key={action.label}
                    variant="ghost"
                    className="w-full justify-start h-auto p-4 rounded-2xl hover:bg-slate-50 text-left group"
                    onClick={() => onPageChange(action.page)}
                  >
                    <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-700 group-hover:text-slate-900 group-hover:bg-slate-200 mr-3">
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <div className="font-black text-slate-900 text-sm">{action.label}</div>
                      <div className="text-xs text-slate-500">{action.description}</div>
                    </div>
                  </Button>
                );
              })}
            </CardContent>
          </Card>

          {subjectSummary.length > 0 && (
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg font-black text-slate-900">Top Subjects</CardTitle>
                <CardDescription className="text-slate-500 text-sm">
                  Overview of registered entries
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {subjectSummary.map((item) => (
                  <div
                    key={item.code}
                    className="bg-slate-50/50 border border-slate-100 rounded-xl flex items-center justify-between gap-4 p-4"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <BookOpen className="h-4 w-4 text-orange-500" />
                        <span className="truncate font-black text-slate-900 text-sm">
                          {item.subject}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-slate-500">
                        {item.code} • {item.level}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-xl font-black text-slate-900">
                        {item.entries}
                      </div>
                      <div className="text-[10px] font-black uppercase tracking-wider text-slate-400">students</div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Finalize Registration Dialog */}
      <Dialog open={isFinalizeDialogOpen} onOpenChange={setIsFinalizeDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black">Finalize Registration</DialogTitle>
            <DialogDescription>
              You can only finalize registration for one level at a time.
            </DialogDescription>
          </DialogHeader>

          {finalizeStep === 1 && (
            <div className="space-y-4 py-4">
              <div className="space-y-3">
                <Label className="text-sm font-semibold">Select Level to Finalize</Label>
                <RadioGroup 
                  value={finalizeLevel} 
                  onValueChange={(v: "UCE" | "UACE") => setFinalizeLevel(v)}
                  className="grid grid-cols-2 gap-3"
                >
                  <div className="flex items-center space-x-3 border border-slate-200 rounded-xl p-4 cursor-pointer hover:border-teal-300 transition-colors">
                    <RadioGroupItem value="UCE" id="finalize-uce" />
                    <Label htmlFor="finalize-uce" className="flex-1 cursor-pointer font-bold text-slate-700">
                      UCE (O-Level)
                    </Label>
                  </div>
                  <div className="flex items-center space-x-3 border border-slate-200 rounded-xl p-4 cursor-pointer hover:border-teal-300 transition-colors">
                    <RadioGroupItem value="UACE" id="finalize-uace" />
                    <Label htmlFor="finalize-uace" className="flex-1 cursor-pointer font-bold text-slate-700">
                      UACE (A-Level)
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
                <p className="text-sm font-bold text-blue-800">
                  Selected: {finalizeLevel}
                </p>
                <p className="text-sm text-blue-700 mt-1">
                  {levelStudents.length} students will be finalized.
                </p>
              </div>
            </div>
          )}

          {finalizeStep === 2 && (
            <div className="space-y-4 py-4">
              <div className="space-y-3">
                <Label className="text-sm font-semibold">School Marking Guide</Label>
                <RadioGroup 
                  value={markingGuide} 
                  onValueChange={(v: "Arts" | "Sciences" | "Both") => setMarkingGuide(v)}
                  className="grid grid-cols-1 gap-3"
                >
                  {["Arts", "Sciences", "Both"].map((val) => (
                    <div key={val} className="flex items-center space-x-3 border border-slate-200 rounded-xl p-4 cursor-pointer hover:border-teal-300 transition-colors">
                      <RadioGroupItem value={val} id={`guide-${val.toLowerCase()}`} />
                      <Label htmlFor={`guide-${val.toLowerCase()}`} className="flex-1 cursor-pointer font-bold text-slate-700">
                        {val}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>
            </div>
          )}

          {finalizeStep === 3 && (
            <div className="space-y-4 py-4">
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <Checkbox 
                    id="verify-summary" 
                    checked={isVerified} 
                    onCheckedChange={(c) => setIsVerified(c as boolean)} 
                  />
                  <Label htmlFor="verify-summary" className="text-sm font-semibold text-slate-700">
                    I confirm I have reviewed, downloaded, and signed the official summary form for {finalizeLevel}.
                  </Label>
                </div>
                <Button 
                  variant="outline" 
                  onClick={handleDownloadSummary}
                  className="w-full border-slate-200 hover:bg-slate-50 text-slate-700"
                >
                  <FileText className="w-4 h-4 mr-2" />
                  Download Summary Form Now
                </Button>
              </div>
            </div>
          )}

          <DialogFooter className="flex justify-between pt-4 border-t border-slate-100">
            {finalizeStep > 1 && (
              <Button 
                variant="outline" 
                onClick={() => setFinalizeStep(prev => Math.max(1, prev - 1))}
                disabled={isLoading}
                className="border-slate-200 hover:bg-slate-50 text-slate-700"
              >
                Back
              </Button>
            )}
            {finalizeStep < 3 && (
              <Button 
                onClick={() => setFinalizeStep(prev => prev + 1)}
                className="bg-slate-900 hover:bg-slate-800 text-white"
              >
                Next
              </Button>
            )}
            {finalizeStep === 3 && (
              <Button 
                onClick={handleFinalize} 
                disabled={!isVerified}
                className="bg-teal-600 hover:bg-teal-700 text-white font-black"
              >
                <Lock className="w-4 h-4 mr-2" />
                Finalize & Lock {finalizeLevel}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
