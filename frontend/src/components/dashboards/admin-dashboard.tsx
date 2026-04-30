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
      change: `${schools.filter((school) => school.status === "active").length} active`,
      icon: School,
      color: "bg-red-50",
      border: "border-l-red-500",
      iconColor: "text-red-600",
    },
    {
      title: "Total Students",
      value: String(students.length),
      change: "Registered",
      icon: Users,
      color: "bg-amber-50",
      border: "border-l-amber-500",
      iconColor: "text-amber-600",
    },
    {
      title: "Pending Payments",
      value: String(schools.filter((school) => school.status === "payment_submitted").length),
      change: "For review",
      icon: BookOpen,
      color: "bg-blue-50",
      border: "border-l-blue-500",
      iconColor: "text-blue-600",
    },
    {
      title: "Verified Schools",
      value: String(schools.filter((school) => school.status === "verified").length),
      change: "Approved",
      icon: AlertCircle,
      color: "bg-emerald-50",
      border: "border-l-emerald-500",
      iconColor: "text-emerald-600",
    },
  ];

  const recentSubmissions = schools.slice(0, 6).map((school) => ({
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
      description: "Register new school",
      page: "schools",
    },
    {
      label: "Open Reports",
      icon: FileText,
      description: "View consolidated reports",
      page: "reports",
    },
    {
      label: "Manage Timetable",
      icon: Calendar,
      description: "Exam schedule",
      page: "timetable",
    },
  ];

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { bg: string; text: string; border: string }> = {
      active: { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-100" },
      verified: { bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-100" },
      pending: { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-100" },
      payment_submitted: { bg: "bg-orange-50", text: "text-orange-700", border: "border-orange-100" },
      rejected: { bg: "bg-red-50", text: "text-red-700", border: "border-red-100" },
    };

    const style = variants[status] || variants.pending;

    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${style.bg} ${style.text} ${style.border} border`}>
        {status.replace('_', ' ')}
      </span>
    );
  };

  return (
    <div className="w-full max-w-[1400px] mx-auto px-6 py-8">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-10">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.3em] text-slate-400 mb-3">
            ADMINISTRATOR OVERVIEW
          </p>
          <h1 className="text-3xl font-black text-slate-900 leading-tight mb-2">
            Organisation Admin Dashboard
          </h1>
          <p className="text-slate-500 text-sm max-w-xl">
            Monitor school registrations, payment verification, and
            examination readiness across the WAKISSHA network.
          </p>
        </div>

        <div className="mt-6 md:mt-0 flex items-center gap-3 bg-slate-100 px-5 py-3 rounded-full">
          <Calendar className="w-4 h-4 text-slate-500" />
          <span className="text-sm font-bold text-slate-700">
            Registration window: <span className="text-slate-900">April 2026</span>
          </span>
        </div>
      </div>

      {/* Stats Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
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
                      {stat.change}
                    </p>
                  </div>
                  <div className={`w-12 h-12 rounded-xl ${stat.color} flex items-center justify-center ${stat.iconColor}`}>
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
        {/* Left Column - Recent Submissions & Status */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-0 border-b border-slate-100 mb-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <CardTitle className="text-lg font-bold text-slate-900">Recent Submissions</CardTitle>
                  <CardDescription className="text-slate-500 text-sm mt-1">
                    Latest school registration activities
                  </CardDescription>
                </div>
                <Button
                  variant="ghost"
                  className="text-sm font-bold text-slate-700 hover:text-slate-900"
                  onClick={() => onPageChange("students")}
                >
                  View All
                  <ArrowUpRight className="ml-2 w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-b-0">
                      <TableHead className="text-xs font-bold uppercase tracking-wider text-slate-400 pb-3">
                        School
                      </TableHead>
                      <TableHead className="text-xs font-bold uppercase tracking-wider text-slate-400 pb-3">
                        Code
                      </TableHead>
                      <TableHead className="text-xs font-bold uppercase tracking-wider text-slate-400 pb-3">
                        Students
                      </TableHead>
                      <TableHead className="text-xs font-bold uppercase tracking-wider text-slate-400 pb-3">
                        Status
                      </TableHead>
                      <TableHead className="text-xs font-bold uppercase tracking-wider text-slate-400 pb-3 text-right">
                        Date
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentSubmissions.map((submission) => (
                      <TableRow key={submission.id} className="border-b border-slate-50 hover:bg-slate-50/50">
                        <TableCell className="py-4">
                          <div className="font-bold text-slate-900 text-sm">{submission.school}</div>
                        </TableCell>
                        <TableCell className="py-4">
                          <div className="text-slate-500 font-mono text-xs">{submission.code}</div>
                        </TableCell>
                        <TableCell className="py-4">
                          <div className="text-slate-700 font-bold text-sm">{submission.students}</div>
                        </TableCell>
                        <TableCell className="py-4">
                          {getStatusBadge(submission.status)}
                        </TableCell>
                        <TableCell className="py-4 text-right">
                          <div className="text-slate-500 text-xs font-medium">
                            {new Date(submission.date).toLocaleDateString()}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-bold text-slate-900">Status Distribution</CardTitle>
              <CardDescription className="text-slate-500 text-sm">
                Overview of school registration stages
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              {[
                { label: "Pending", value: schools.filter((s) => s.status === "pending").length, color: "bg-amber-500" },
                { label: "Payment Submitted", value: schools.filter((s) => s.status === "payment_submitted").length, color: "bg-orange-500" },
                { label: "Verified", value: schools.filter((s) => s.status === "verified").length, color: "bg-blue-500" },
                { label: "Active", value: schools.filter((s) => s.status === "active").length, color: "bg-emerald-500" },
              ].map((item) => {
                const max = Math.max(1, schools.length);
                const width = `${(item.value / max) * 100}%`;
                return (
                  <div key={item.label} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-slate-600">{item.label}</span>
                      <span className="text-sm font-black text-slate-900">{item.value}</span>
                    </div>
                    <div className="h-2.5 rounded-full bg-slate-100 overflow-hidden">
                      <div className={`h-full rounded-full ${item.color} transition-all duration-700`} style={{ width }} />
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Quick Actions & System Info */}
        <div className="space-y-6">
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-bold text-slate-900">Quick Actions</CardTitle>
              <CardDescription className="text-slate-500 text-sm">
                Common administration tasks
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
                      <div className="font-bold text-slate-900 text-sm">{action.label}</div>
                      <div className="text-xs text-slate-500">{action.description}</div>
                    </div>
                  </Button>
                );
              })}
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm bg-gradient-to-br from-slate-900 to-slate-800 text-white">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-bold text-white">System Overview</CardTitle>
              <CardDescription className="text-slate-400 text-sm">
                Registration period details
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                      Registration Period
                    </p>
                    <p className="text-base font-bold text-white">
                      April 2026
                    </p>
                  </div>
                  <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-400/30 border">Active</Badge>
                </div>
              </div>

              <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                      Deadline
                    </p>
                    <p className="text-base font-bold text-white">
                      April 30, 2026
                    </p>
                  </div>
                  <Badge className="bg-amber-500/20 text-amber-300 border-amber-400/30 border">
                    0 days left
                  </Badge>
                </div>
              </div>

              <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                      Completion
                    </p>
                    <p className="text-base font-bold text-white">
                      75%
                    </p>
                  </div>
                  <Badge className="bg-blue-500/20 text-blue-300 border-blue-400/30 border">
                    18/24 schools
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
