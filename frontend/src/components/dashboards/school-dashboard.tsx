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
import { useAuth } from "../auth-context";
import { Alert, AlertDescription, AlertTitle } from "../ui/alert";

interface SchoolDashboardProps {
  onPageChange: (page: string) => void;
}

export function SchoolDashboard({ onPageChange }: SchoolDashboardProps) {
  const { user, schools, students } = useAuth();
  const currentSchool = schools.find((school) => school.code === user?.schoolCode);
  const schoolStudents = students.filter((student) => student.schoolCode === user?.schoolCode);
  const uceStudents = schoolStudents.filter((student) => student.examLevel === "UCE").length;
  const uaceStudents = schoolStudents.filter((student) => student.examLevel === "UACE").length;
  const schoolSubjectsCount = new Set(schoolStudents.flatMap((student) => student.subjects.map((s) => s.subjectCode))).size;

  const stats = [
    {
      title: "Registered Students",
      value: String(schoolStudents.length),
      subtitle: "Across all levels",
      icon: Users,
      borderClass: "border-l-red-600",
      iconClass: "bg-red-600/10 text-red-600",
    },
    {
      title: "UCE Students",
      value: String(uceStudents),
      subtitle: "O Level candidates",
      icon: BookOpen,
      borderClass: "border-l-amber-500",
      iconClass:
        "bg-amber-500/10 text-amber-600",
    },
    {
      title: "UACE Students",
      value: String(uaceStudents),
      subtitle: "A Level candidates",
      icon: CheckCircle,
      borderClass: "border-l-blue-500",
      iconClass: "bg-blue-500/10 text-blue-600",
    },
    {
      title: "Subjects Registered",
      value: String(schoolSubjectsCount || 0),
      subtitle: "Unique selected subjects",
      icon: CreditCard,
      borderClass: "border-l-orange-500",
      iconClass:
        user?.status === "active"
          ? "bg-green-500/10 text-green-600"
          : "bg-orange-500/10 text-orange-600",
    },
  ];

  const subjectSummary = Object.values(
    schoolStudents.reduce<Record<string, { subject: string; code: string; entries: number; level: "UCE" | "UACE" }>>(
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
    { label: "Add Students", completed: true },
    { label: "Subject Entries", completed: true },
    {
      label: "Payment Submission",
      completed:
        user?.status === "active" ||
        user?.status === "verified" ||
        user?.status === "payment_submitted",
    },
    { label: "Signed Form Upload", completed: user?.status === "active" },
  ];

  const completedSteps = completionSteps.filter((step) => step.completed).length;
  const completionPercentage = (completedSteps / completionSteps.length) * 100;

  return (
    <div className="mx-auto flex w-full max-w-[1240px] flex-col gap-6 anim-fade-up">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div className="space-y-2">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">
            School Workspace
          </p>
          <div>
            <h1 className="text-3xl font-bold text-shimmer">School Dashboard</h1>
            <p className="mt-2 max-w-2xl text-slate-500">
              Welcome back, {user?.name}. Track registration progress, subject
              entries, payment status, and your examination timetable from one
              place.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
          <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
            {currentSchool?.schoolLogo ? (
              <img
                src={currentSchool.schoolLogo}
                alt={`${currentSchool.name} logo`}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex flex-col items-center gap-1 text-slate-400">
                <ImageIcon className="h-5 w-5" />
                <span className="text-[10px] font-semibold uppercase tracking-[0.16em]">
                  Logo
                </span>
              </div>
            )}
          </div>
          <div className="text-sm">
            <p className="font-semibold text-slate-900">
              {currentSchool?.name ?? user?.name}
            </p>
            <p className="text-slate-500">
              Academic year:{" "}
              <span className="font-semibold text-slate-900">
                {user?.academicYear ?? "2026"}
              </span>
            </p>
            {!currentSchool?.schoolLogo && (
              <p className="text-xs text-slate-400">
                Upload a school logo to personalise this dashboard.
              </p>
            )}
          </div>
        </div>
      </div>

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

      {user?.status === "active" && (
        <Alert variant="success">
          <CheckCircle className="h-4 w-4" />
          <AlertTitle>Portal Fully Active</AlertTitle>
          <AlertDescription>
            Your registration is complete and all school portal features are
            available.
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-[repeat(auto-fit,minmax(250px,1fr))] gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon;

          return (
            <Card key={stat.title} className={`h-full border-l-4 ${stat.borderClass} transition-all duration-200 ease-in-out hover:scale-105 hover:shadow-md`}>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-3">
                    <p className="text-sm font-medium text-slate-500">
                      {stat.title}
                    </p>
                    <div className="space-y-1">
                      <p className="text-3xl font-bold text-slate-900">
                        {stat.value}
                      </p>
                      <p className="text-sm text-slate-500">{stat.subtitle}</p>
                    </div>
                  </div>
                  <div
                    className={`flex h-11 w-11 items-center justify-center rounded-2xl ${stat.iconClass}`}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="flex flex-col w-full gap-6">
        <Card className="w-full">
          <CardHeader>
            <CardTitle className="text-slate-900">Submission Progress</CardTitle>
            <CardDescription className="text-slate-500">
              Complete each step to finalise registration
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="bg-white shadow-sm border border-slate-200 rounded-2xl p-4">
              <div className="mb-3 flex items-center justify-between text-sm">
                <span className="text-slate-500">Completion</span>
                <span className="font-semibold text-slate-900">
                  {completedSteps}/{completionSteps.length}
                </span>
              </div>
              <Progress value={completionPercentage} className="h-2.5" />
            </div>

            <div className="space-y-3">
              {completionSteps.map((step, index) => (
                <div
                  key={index}
                  className="bg-white shadow-sm border border-slate-200 rounded-2xl flex items-center gap-3 px-4 py-3"
                >
                  <div
                    className={`flex h-8 w-8 items-center justify-center rounded-full ${
                      step.completed
                        ? "bg-green-500/10 text-green-600"
                        : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    {step.completed ? (
                      <CheckCircle className="h-4 w-4" />
                    ) : (
                      <span className="text-xs font-semibold">{index + 1}</span>
                    )}
                  </div>
                  <span
                    className={`text-sm ${
                      step.completed ? "text-slate-900" : "text-slate-500"
                    }`}
                  >
                    {step.label}
                  </span>
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
          <CardContent className="space-y-3 pt-6">
            {subjectSummary.map((item) => (
              <div
                key={item.code}
                className="bg-white shadow-sm border border-slate-200 rounded-2xl flex items-center justify-between gap-4 p-4 transition-colors hover:bg-slate-50"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <BookOpen className="h-4 w-4 text-red-500" />
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
                  <div className="text-lg font-semibold text-slate-900">
                    {item.entries}
                  </div>
                  <div className="text-xs text-slate-500">entries</div>
                </div>
              </div>
            ))}
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
        <CardContent className="pt-6">
          <div className="grid gap-4 lg:grid-cols-3">
            {upcomingExams.map((exam, index) => (
              <div
                key={index}
                className="bg-white shadow-sm border border-slate-200 rounded-2xl p-4"
              >
                <div className="mb-3 flex items-center justify-between">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-600/10 text-red-600">
                    <Calendar className="h-4 w-4" />
                  </div>
                  <Badge variant="info">Upcoming</Badge>
                </div>
                <h4 className="font-semibold text-slate-900">{exam.subject}</h4>
                <div className="mt-3 space-y-1 text-sm text-slate-500">
                  <p>Date: {new Date(exam.date).toLocaleDateString()}</p>
                  <p>Time: {exam.time}</p>
                  <p>Duration: {exam.duration}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-3">
        <Button
          variant="outline"
          className="h-auto items-start justify-start rounded-2xl px-4 py-4 text-left"
          onClick={() => onPageChange("add-student")}
        >
          <div className="mr-3 flex h-10 w-10 items-center justify-center rounded-xl bg-red-600/10 text-red-600">
            <Users className="h-5 w-5" />
          </div>
          <div>
            <div className="font-semibold text-slate-900">Add Student</div>
            <div className="mt-1 text-xs text-slate-500">
              Register a new candidate for examination entries
            </div>
          </div>
        </Button>

        <Button
          variant="outline"
          className="h-auto items-start justify-start rounded-2xl px-4 py-4 text-left"
          onClick={() => onPageChange("upload-pdf")}
        >
          <div className="mr-3 flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600">
            <Upload className="h-5 w-5" />
          </div>
          <div>
            <div className="font-semibold text-slate-900">Upload Signed Form</div>
            <div className="mt-1 text-xs text-slate-500">
              Submit the authorised registration form for review
            </div>
          </div>
        </Button>

        <Button
          variant="outline"
          className="h-auto items-start justify-start rounded-2xl px-4 py-4 text-left"
          onClick={() => onPageChange("reports")}
        >
          <div className="mr-3 flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600">
            <CheckCircle className="h-5 w-5" />
          </div>
          <div>
            <div className="font-semibold text-slate-900">My Reports</div>
            <div className="mt-1 text-xs text-slate-500">
              Review school registration summaries and downloads
            </div>
          </div>
        </Button>
      </div>
    </div>
  );
}
