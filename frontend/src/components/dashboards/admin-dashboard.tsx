import {
  AlertCircle,
  ArrowUpRight,
  BookOpen,
  Calendar,
  FileText,
  Plus,
  School,
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import { useAuth } from "../auth-context";

interface AdminDashboardProps {
  onPageChange: (page: string) => void;
}

export function AdminDashboard({ onPageChange }: AdminDashboardProps) {
  const { schools, students } = useAuth();
  const stats = [
    {
      title: "Total Schools",
      value: String(schools.length),
      change: `${schools.filter((school) => school.status === "active").length} active schools`,
      icon: School,
      borderClass: "border-l-red-600",
      iconClass: "bg-orange-600/10 text-orange-600",
    },
    {
      title: "Total Students",
      value: String(students.length),
      change: "Live from frontend state",
      icon: Users,
      borderClass: "border-l-amber-500",
      iconClass:
        "bg-amber-500/10 text-amber-600",
    },
    {
      title: "Pending Payments",
      value: String(schools.filter((school) => school.status === "payment_submitted").length),
      change: "Require verification",
      icon: BookOpen,
      borderClass: "border-l-blue-500",
      iconClass: "bg-blue-500/10 text-blue-600",
    },
    {
      title: "Verified Schools",
      value: String(schools.filter((school) => school.status === "verified").length),
      change: "Ready for activation",
      icon: AlertCircle,
      borderClass: "border-l-emerald-500",
      iconClass: "bg-emerald-500/10 text-emerald-600",
    },
  ];

  const recentSubmissions = schools.map((school) => ({
    id: school.id,
    school: school.name,
    code: school.code,
    students: students.filter((student) => student.schoolCode === school.code).length,
    status: school.status,
    date: school.registrationDate,
    amount: school.amountPaid,
  }));

  const quickActions = [
    {
      label: "Add School",
      icon: Plus,
      description: "Register a new school in the portal",
      page: "schools",
    },
    {
      label: "Open Reports",
      icon: FileText,
      description: "Review consolidated exam registrations",
      page: "reports",
    },
    {
      label: "Manage Timetable",
      icon: Calendar,
      description: "Inspect the latest examination schedule",
      page: "timetable",
    },
  ];

  const getStatusBadge = (status: string) => {
    const variants = {
      verified: "info",
      pending: "warning",
      rejected: "destructive",
    } as const;

    return (
      <Badge variant={variants[status as keyof typeof variants] || "secondary"}>
        {status}
      </Badge>
    );
  };

  return (
    <div className="mx-auto flex w-full max-w-[1240px] flex-col gap-6 anim-fade-up">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between anim-fade-up-delay">
        <div className="space-y-1">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">
            Administrator Overview
          </p>
          <div>
            <h1 className="text-3xl font-black tracking-tight text-slate-900">
              Organisation Admin Dashboard
            </h1>
            <p className="mt-1 max-w-2xl text-sm font-medium text-slate-500">
              Monitor school registrations, payment verification, and
              examination readiness across the WAKISSHA network.
            </p>
          </div>
        </div>
        <div className="bg-slate-900 text-white shadow-lg shadow-slate-200 rounded-2xl px-5 py-2.5 text-xs font-bold flex items-center gap-2">
          <Calendar className="h-3.5 w-3.5 text-slate-400" />
          <span>Registration window: <span className="text-primary-foreground">April 2026</span></span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;

          return (
            <Card key={stat.title} className={`h-full border-l-4 ${stat.borderClass} transition-all duration-200 hover:shadow-md`}>
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                      {stat.title}
                    </p>
                    <div className="flex flex-col">
                      <p className="text-2xl font-black text-slate-900">
                        {stat.value}
                      </p>
                      <p className="text-[10px] font-medium text-slate-400">
                        {stat.change}
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
        <div className="xl:col-span-2 flex flex-col gap-4">
          <Card className="w-full">
            <CardHeader className="flex flex-col gap-4 border-b border-slate-200 md:flex-row md:items-center md:justify-between">
              <div>
                <CardTitle className="text-slate-900">Recent Submissions</CardTitle>
                <CardDescription className="text-slate-500">
                  Latest student registration submissions from schools
                </CardDescription>
              </div>
              <Button
                variant="outline"
                className="w-full md:w-auto"
                onClick={() => onPageChange("students")}
              >
                View All Entries
                <ArrowUpRight className="ml-2 h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent className="pt-6">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>School</TableHead>
                    <TableHead>Code</TableHead>
                    <TableHead>Students</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentSubmissions.map((submission) => (
                    <TableRow key={submission.id}>
                      <TableCell className="font-semibold text-slate-900">
                        {submission.school}
                      </TableCell>
                      <TableCell className="text-slate-500">
                        {submission.code}
                      </TableCell>
                      <TableCell>{submission.students}</TableCell>
                      <TableCell className="font-semibold text-slate-900">
                        {submission.amount}
                      </TableCell>
                      <TableCell>{getStatusBadge(submission.status)}</TableCell>
                      <TableCell className="text-slate-500">
                        {new Date(submission.date).toLocaleDateString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card className="w-full">
            <CardHeader>
              <CardTitle className="text-slate-900">Status Distribution</CardTitle>
              <CardDescription className="text-slate-500">
                Visual snapshot of school lifecycle stages
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                { label: "Pending", value: schools.filter((s) => s.status === "pending").length, color: "bg-amber-500" },
                { label: "Payment Submitted", value: schools.filter((s) => s.status === "payment_submitted").length, color: "bg-orange-500" },
                { label: "Verified", value: schools.filter((s) => s.status === "verified").length, color: "bg-blue-500" },
                { label: "Active", value: schools.filter((s) => s.status === "active").length, color: "bg-green-500" },
              ].map((item) => {
                const max = Math.max(1, schools.length);
                const width = `${(item.value / max) * 100}%`;
                return (
                  <div key={item.label} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-500">{item.label}</span>
                      <span className="font-semibold text-slate-900">{item.value}</span>
                    </div>
                    <div className="h-2 rounded-full bg-slate-100">
                      <div className={`h-2 rounded-full ${item.color}`} style={{ width }} />
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-col gap-4">
          <Card className="w-full">
            <CardHeader>
              <CardTitle className="text-slate-900">Quick Actions</CardTitle>
              <CardDescription className="text-slate-500">
                Common administrative tasks
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {quickActions.map((action) => {
                const Icon = action.icon;

                return (
                  <Button
                    key={action.label}
                    variant="outline"
                    className="h-auto w-full justify-start rounded-2xl px-4 py-3 text-left hover:bg-slate-50 border-slate-200"
                    onClick={() => onPageChange(action.page)}
                  >
                    <div className="mr-3 flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600/10 text-blue-700">
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="space-y-0.5">
                      <div className="font-semibold text-slate-900 text-sm">
                        {action.label}
                      </div>
                      <div className="text-[10px] text-slate-500 leading-tight">
                        {action.description}
                      </div>
                    </div>
                  </Button>
                );
              })}
            </CardContent>
          </Card>

          <Card className="w-full">
            <CardHeader>
              <CardTitle className="text-slate-900">System Overview</CardTitle>
              <CardDescription className="text-slate-500">
                Registration period status
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="bg-slate-50/50 border border-slate-100 rounded-xl p-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Registration Period
                    </p>
                    <p className="mt-0.5 text-base font-bold text-slate-900">
                      April 2026
                    </p>
                  </div>
                  <Badge className="bg-emerald-500 hover:bg-emerald-500">Active</Badge>
                </div>
              </div>
              <div className="bg-slate-50/50 border border-slate-100 rounded-xl p-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Deadline</p>
                    <p className="mt-0.5 text-base font-bold text-slate-900">
                      April 30, 2026
                    </p>
                  </div>
                  <Badge variant="warning">17 days left</Badge>
                </div>
              </div>
              <div className="bg-slate-50/50 border border-slate-100 rounded-xl p-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Completion Rate</p>
                    <p className="mt-0.5 text-base font-bold text-slate-900">
                      75%
                    </p>
                  </div>
                  <Badge variant="secondary">18/24 schools</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}


