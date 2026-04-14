import { useMemo, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Badge } from "../ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import { Search, Plus, School, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { useAuth, type SchoolStatus } from "../auth-context";

interface SchoolsManagementProps {
  onPageChange: (page: string) => void;
}

function buildActivationCode(schoolCode: string) {
  const suffix = schoolCode.split("-").pop() ?? "0000";
  return `ACT-2026-${suffix}`;
}

function getStatusBadge(status: SchoolStatus) {
  const config = {
    active: { variant: "success" as const, label: "Active" },
    verified: { variant: "info" as const, label: "Verified" },
    pending: { variant: "warning" as const, label: "Pending" },
    payment_submitted: {
      variant: "payment" as const,
      label: "Payment Submitted",
    },
  };

  return <Badge variant={config[status].variant}>{config[status].label}</Badge>;
}

export function SchoolsManagement({ onPageChange }: SchoolsManagementProps) {
  const { schools, addSchool, updateSchoolStatus } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newSchool, setNewSchool] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
  });

  const filteredSchools = useMemo(() => {
    return schools.filter((school) => {
      const matchesSearch =
        school.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        school.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        school.district.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus =
        statusFilter === "all" || school.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [schools, searchTerm, statusFilter]);

  const handleAddSchool = () => {
    const nextCode = `WAK26-${String(schools.length + 1).padStart(4, "0")}`;
    addSchool(newSchool);
    setIsAddDialogOpen(false);
    setNewSchool({ name: "", email: "", phone: "", address: "" });

    toast.success("School Added", {
      description: `${newSchool.name} has been registered with code ${nextCode}.`,
    });
  };

  const handleStatusChange = (schoolCode: string, newStatus: SchoolStatus) => {
    const nextActivationCode =
      newStatus === "active" ? buildActivationCode(schoolCode) : "";

    updateSchoolStatus(schoolCode, newStatus, nextActivationCode);

    toast.success("School Status Updated", {
      description:
        newStatus === "active"
          ? `Activation code ${nextActivationCode} assigned to ${schoolCode}.`
          : `${schoolCode} moved to ${newStatus.replace("_", " ")}.`,
    });
  };

  const stats = [
    {
      label: "Total Schools",
      value: schools.length,
      className: "border-l-red-600",
      valueClass: "text-slate-900 dark:text-white",
    },
    {
      label: "Active",
      value: schools.filter((school) => school.status === "active").length,
      className: "border-l-green-500",
      valueClass: "text-green-600 dark:text-green-300",
    },
    {
      label: "Verified",
      value: schools.filter((school) => school.status === "verified").length,
      className: "border-l-blue-500",
      valueClass: "text-blue-600 dark:text-blue-300",
    },
    {
      label: "Payment Submitted",
      value: schools.filter((school) => school.status === "payment_submitted").length,
      className: "border-l-orange-500",
      valueClass: "text-orange-600 dark:text-orange-300",
    },
    {
      label: "Pending",
      value: schools.filter((school) => school.status === "pending").length,
      className: "border-l-amber-500",
      valueClass: "text-amber-600 dark:text-amber-300",
    },
  ];

  return (
    <div className="flex flex-col w-full gap-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-2">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-red-400 dark:text-red-400">
            School Administration
          </p>
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
              Schools Management
            </h1>
            <p className="mt-2 max-w-3xl text-slate-600 dark:text-slate-300">
              Track registration, payment verification, and activation progress
              for member schools across all WAKISSHA zones.
            </p>
          </div>
        </div>

        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="w-full lg:w-auto">
              <Plus className="h-4 w-4" />
              Add School
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-xl">
            <DialogHeader>
              <DialogTitle>Register New School</DialogTitle>
              <DialogDescription>
                Add a new school to the WAKISSHA portal. A school code will be
                generated automatically.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="name">School Name</Label>
                <Input
                  id="name"
                  placeholder="Enter school name"
                  value={newSchool.name}
                  onChange={(event) =>
                    setNewSchool({ ...newSchool, name: event.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@school.org"
                  value={newSchool.email}
                  onChange={(event) =>
                    setNewSchool({ ...newSchool, email: event.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  placeholder="+256 700 000 000"
                  value={newSchool.phone}
                  onChange={(event) =>
                    setNewSchool({ ...newSchool, phone: event.target.value })
                  }
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="address">Address</Label>
                <Input
                  id="address"
                  placeholder="School address"
                  value={newSchool.address}
                  onChange={(event) =>
                    setNewSchool({ ...newSchool, address: event.target.value })
                  }
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsAddDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={handleAddSchool}
                disabled={!newSchool.name || !newSchool.email || !newSchool.phone}
              >
                Add School
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        {stats.map((stat) => (
          <Card key={stat.label} className={`border-l-4 ${stat.className}`}>
            <CardContent className="pt-6">
              <p className="text-sm font-medium text-slate-600 dark:text-slate-400">{stat.label}</p>
              <p className={`mt-3 text-3xl font-bold ${stat.valueClass}`}>
                {stat.value}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4 lg:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
              <Input
                placeholder="Search by school name, code, or district..."
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full lg:w-[240px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="payment_submitted">Payment Submitted</SelectItem>
                <SelectItem value="verified">Verified</SelectItem>
                <SelectItem value="active">Active</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="border-b border-border/70">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <CardTitle className="text-slate-900 dark:text-white">Registered Schools</CardTitle>
              <CardDescription className="text-slate-600 dark:text-slate-400">
                {filteredSchools.length} school
                {filteredSchools.length !== 1 ? "s" : ""} found
              </CardDescription>
            </div>
            <Button variant="outline" onClick={() => onPageChange("students")}>
              <School className="h-4 w-4" />
              View Student Entries
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>School Name</TableHead>
                <TableHead>Code</TableHead>
                <TableHead>District / Zone</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Students</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Activation Info</TableHead>
                <TableHead>Registration Date</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSchools.map((school) => (
                <TableRow key={school.id}>
                  <TableCell className="font-semibold text-white">
                    {school.name}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{school.code}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <div className="text-white">{school.district}</div>
                      <div className="text-slate-400">{school.zone}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <div className="text-white">{school.email}</div>
                      <div className="text-slate-400">{school.phone}</div>
                    </div>
                  </TableCell>
                  <TableCell>{school.students}</TableCell>
                  <TableCell>{getStatusBadge(school.status)}</TableCell>
                  <TableCell>
                    {school.status === "active" && school.activationCode ? (
                      <div className="flex items-center gap-2 text-sm text-slate-200">
                        <ShieldCheck className="h-4 w-4 text-green-400" />
                        {school.activationCode}
                      </div>
                    ) : (
                      <span className="text-sm text-slate-500">Not active yet</span>
                    )}
                  </TableCell>
                  <TableCell className="text-slate-400">
                    {new Date(school.registrationDate).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <Select
                      value={school.status}
                      onValueChange={(value) =>
                        handleStatusChange(school.code, value as SchoolStatus)
                      }
                    >
                      <SelectTrigger className="w-[180px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="payment_submitted">
                          Payment Submitted
                        </SelectItem>
                        <SelectItem value="verified">Verified</SelectItem>
                        <SelectItem value="active">Active</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
