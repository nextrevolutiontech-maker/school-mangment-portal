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
      borderClass: "border-l-green-500",
      iconClass:
        "bg-orange-500/10 text-orange-600",
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
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between anim-fade-up-delay">
        <div className="space-y-2">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">
            Administrator Overview
          </p>
          <div>
            <h1 className="text-3xl font-bold text-shimmer">
              Organisation Admin Dashboard
            </h1>
            <p className="mt-2 max-w-2xl text-slate-500">
              Monitor school registrations, payment verification, and
              examination readiness across the WAKISSHA network.
            </p>
          </div>
        </div>
        <div className="bg-white shadow-sm border border-slate-200 rounded-2xl px-4 py-3 text-sm text-slate-500">
          Registration window:{" "}
          <span className="font-semibold text-slate-900">April 2026</span>
        </div>
      </div>

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
                      <p className="text-sm text-slate-500">
                        {stat.change}
                      </p>
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

      <div className="flex flex-col gap-6 w-full">
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
              <ArrowUpRight className="h-4 w-4" />
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

        <div className="flex flex-col w-full gap-6">
          <Card className="w-full">
            <CardHeader>
              <CardTitle className="text-slate-900">Quick Actions</CardTitle>
              <CardDescription className="text-slate-500">
                Common administrative tasks at a glance
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {quickActions.map((action) => {
                const Icon = action.icon;

                return (
                  <Button
                    key={action.label}
                    variant="outline"
                    className="h-auto w-full justify-start rounded-2xl px-4 py-4 text-left"
                    onClick={() => onPageChange(action.page)}
                  >
                    <div className="mr-3 flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600/10 text-blue-700">
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="space-y-1">
                      <div className="font-semibold text-slate-900">
                        {action.label}
                      </div>
                      <div className="text-xs text-slate-500">
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
                Current registration period status
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="bg-white shadow-sm border border-slate-200 rounded-2xl p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm text-slate-500">
                      Registration Period
                    </p>
                    <p className="mt-1 text-lg font-semibold text-slate-900">
                      April 2026
                    </p>
                  </div>
                  <Badge variant="success">Active</Badge>
                </div>
              </div>
              <div className="bg-white shadow-sm border border-slate-200 rounded-2xl p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm text-slate-500">Deadline</p>
                    <p className="mt-1 text-lg font-semibold text-slate-900">
                      April 30, 2026
                    </p>
                  </div>
                  <Badge variant="warning">17 days left</Badge>
                </div>
              </div>
              <div className="bg-white shadow-sm border border-slate-200 rounded-2xl p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm text-slate-500">Completion Rate</p>
                    <p className="mt-1 text-lg font-semibold text-slate-900">
                      75%
                    </p>
                  </div>
                  <Badge variant="secondary">18/24 schools</Badge>
                </div>
              </div>
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
      </div>
    </div>
  );
}


