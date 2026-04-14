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

interface AdminDashboardProps {
  onPageChange: (page: string) => void;
}

export function AdminDashboard({ onPageChange }: AdminDashboardProps) {
  const stats = [
    {
      title: "Total Schools",
      value: "24",
      change: "+3 new registrations",
      icon: School,
      borderClass: "border-l-red-600",
      iconClass: "bg-red-600/10 text-red-600",
    },
    {
      title: "Total Students",
      value: "1,847",
      change: "+127 this month",
      icon: Users,
      borderClass: "border-l-amber-500",
      iconClass:
        "bg-amber-500/10 text-amber-600",
    },
    {
      title: "Subjects Registered",
      value: "42",
      change: "All active this term",
      icon: BookOpen,
      borderClass: "border-l-blue-500",
      iconClass: "bg-blue-500/10 text-blue-600",
    },
    {
      title: "Pending Payments",
      value: "8",
      change: "Require verification",
      icon: AlertCircle,
      borderClass: "border-l-orange-500",
      iconClass:
        "bg-orange-500/10 text-orange-600",
    },
  ];

  const recentSubmissions = [
    {
      id: 1,
      school: "AMITY SECONDARY SCHOOL",
      code: "WAK26-0001",
      students: 120,
      status: "verified",
      date: "2026-04-12",
      amount: "3,600,000 UGX",
    },
    {
      id: 2,
      school: "Wakiso Hills College",
      code: "WAK26-0002",
      students: 98,
      status: "pending",
      date: "2026-04-11",
      amount: "2,940,000 UGX",
    },
    {
      id: 3,
      school: "Entebbe High School",
      code: "WAK26-0003",
      students: 84,
      status: "pending",
      date: "2026-04-10",
      amount: "0 UGX",
    },
    {
      id: 4,
      school: "Nansana Modern School",
      code: "WAK26-0004",
      students: 73,
      status: "verified",
      date: "2026-04-09",
      amount: "2,190,000 UGX",
    },
  ];

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
    <div className="flex flex-col w-full gap-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-2">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-red-500">
            Administrator Overview
          </p>
          <div>
            <h1 className="text-3xl font-bold text-slate-900">
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

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;

          return (
            <Card key={stat.title} className={`border-l-4 ${stat.borderClass}`}>
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
                    <div className="mr-3 flex h-10 w-10 items-center justify-center rounded-xl bg-red-600/10 text-red-600">
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
        </div>
      </div>
    </div>
  );
}


