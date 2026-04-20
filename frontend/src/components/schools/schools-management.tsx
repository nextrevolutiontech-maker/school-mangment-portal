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
  const { user, schools, zones, addSchool, updateSchoolStatus } = useAuth();

  // Permission check - admin only
  if (user?.role !== "admin") {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-center">
          <h2 className="mb-2 text-xl font-bold text-slate-900">Access Denied</h2>
          <p className="text-slate-500">Only administrators can manage schools.</p>
        </div>
      </div>
    );
  }

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [logoPreview, setLogoPreview] = useState<string>("");
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [newSchool, setNewSchool] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    educationLevel: "UCE" as const,
    zone_id: "zone-1",
    schoolLogo: "",
    contactPerson: "",
    contactDesignation: "",
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

  const handleLogoChange = (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const file = files[0];
    if (!["image/png", "image/jpeg", "image/webp"].includes(file.type)) {
      toast.error("Invalid file type", {
        description: "Please upload PNG, JPEG, or WebP image",
      });
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast.error("File too large", {
        description: "Logo must be under 2MB",
      });
      return;
    }

    setLogoFile(file);
    const reader = new FileReader();
    reader.onload = (e) => {
      const base64 = e.target?.result as string;
      setLogoPreview(base64);
      setNewSchool({ ...newSchool, schoolLogo: base64 });
    };
    reader.readAsDataURL(file);
  };

  const handleAddSchool = () => {
    addSchool(newSchool);
    setIsAddDialogOpen(false);
    setNewSchool({
      name: "",
      email: "",
      phone: "",
      address: "",
      educationLevel: "UCE",
      zone_id: "zone-1",
      schoolLogo: "",
      contactPerson: "",
      contactDesignation: "",
    });
    setLogoPreview("");
    setLogoFile(null);

    toast.success("School Added", {
      description: `${newSchool.name} has been registered successfully.`,
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
      className: "border-l-4 border-l-primary",
      valueClass: "text-foreground",
    },
    {
      label: "Active",
      value: schools.filter((school) => school.status === "active").length,
      className: "border-l-4 border-l-success",
      valueClass: "text-foreground",
    },
    {
      label: "Verified",
      value: schools.filter((school) => school.status === "verified").length,
      className: "border-l-4 border-l-primary",
      valueClass: "text-foreground",
    },
    {
      label: "Payment Submitted",
      value: schools.filter((school) => school.status === "payment_submitted").length,
      className: "border-l-4 border-l-warning",
      valueClass: "text-foreground",
    },
    {
      label: "Pending",
      value: schools.filter((school) => school.status === "pending").length,
      className: "border-l-4 border-l-destructive",
      valueClass: "text-foreground",
    },
  ];

  return (
    <div className="flex flex-col w-full gap-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-2">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">
            School Administration
          </p>
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              Schools Management
            </h1>
            <p className="mt-2 max-w-3xl text-muted-foreground">
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
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto sm:p-8">
            <DialogHeader className="mb-6">
              <DialogTitle className="text-2xl font-bold text-slate-900">Register New School</DialogTitle>
              <DialogDescription className="text-slate-500 mt-1">
                Add a new school to the WAKISSHA portal. A school code will be
                generated automatically.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="name" className="text-sm font-semibold text-slate-700">School Name *</Label>
                <Input
                  id="name"
                  placeholder="Enter full school name"
                  value={newSchool.name}
                  onChange={(event) =>
                    setNewSchool({ ...newSchool, name: event.target.value })
                  }
                  className="h-11 rounded-xl border-slate-200 focus:border-blue-500 focus:ring-blue-500"
                  autoFocus
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-semibold text-slate-700">Email Address *</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@school.org"
                  value={newSchool.email}
                  onChange={(event) =>
                    setNewSchool({ ...newSchool, email: event.target.value })
                  }
                  className="h-11 rounded-xl border-slate-200 focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone" className="text-sm font-semibold text-slate-700">Phone Number *</Label>
                <Input
                  id="phone"
                  placeholder="+256 700 000 000"
                  value={newSchool.phone}
                  onChange={(event) =>
                    setNewSchool({ ...newSchool, phone: event.target.value })
                  }
                  className="h-11 rounded-xl border-slate-200 focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="address" className="text-sm font-semibold text-slate-700">Address *</Label>
                <Input
                  id="address"
                  placeholder="Physical school address / Location"
                  value={newSchool.address}
                  onChange={(event) =>
                    setNewSchool({ ...newSchool, address: event.target.value })
                  }
                  className="h-11 rounded-xl border-slate-200 focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="educationLevel" className="text-sm font-semibold text-slate-700">Education Level *</Label>
                <Select
                  value={newSchool.educationLevel}
                  onValueChange={(value: any) =>
                    setNewSchool({ ...newSchool, educationLevel: value })
                  }
                >
                  <SelectTrigger className="h-11 rounded-xl border-slate-200">
                    <SelectValue placeholder="Select level" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-slate-200">
                    <SelectItem value="UCE">UCE (O' Level)</SelectItem>
                    <SelectItem value="UACE">UACE (A' Level)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="zone" className="text-sm font-semibold text-slate-700">Zone *</Label>
                <Select value={newSchool.zone_id} onValueChange={(value) =>
                    setNewSchool({ ...newSchool, zone_id: value })
                  }
                >
                  <SelectTrigger className="h-11 rounded-xl border-slate-200">
                    <SelectValue placeholder="Select zone" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-slate-200">
                    <SelectItem value="unknown">I don't know (Admin will allocate)</SelectItem>
                    {zones.map((zone) => (
                      <SelectItem key={zone.id} value={zone.id}>
                        {zone.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-slate-500 leading-relaxed">
                  If a school does not know its zone, select 'I don't know'. WAKISSHA admin will allocate the correct zone.
                </p>
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="schoolLogo" className="text-sm font-semibold text-slate-700">School Logo (Optional)</Label>
                <div className="flex flex-col gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 h-11 px-3 rounded-xl border border-slate-200 bg-slate-50/50">
                      <Input
                        id="schoolLogo"
                        type="file"
                        accept="image/png,image/jpeg,image/webp"
                        onChange={(e) => handleLogoChange(e.target.files)}
                        className="flex-1 border-0 bg-transparent p-0 h-auto focus-visible:ring-0 cursor-pointer text-sm"
                      />
                    </div>
                    <p className="text-xs text-slate-500 mt-2">
                      PNG, JPEG or WebP. Max 2MB.
                    </p>
                  </div>
                  {logoPreview && (
                    <div className="flex items-center justify-center w-20 h-20 border border-slate-200 rounded-xl bg-slate-50 overflow-hidden shadow-sm">
                      <img
                        src={logoPreview}
                        alt="Logo preview"
                        className="max-w-full max-h-full object-contain"
                      />
                    </div>
                  )}
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="contactPerson" className="text-sm font-semibold text-slate-700">Contact Person (Optional)</Label>
                <Input
                  id="contactPerson"
                  placeholder="Name of school contact"
                  value={newSchool.contactPerson}
                  onChange={(event) =>
                    setNewSchool({
                      ...newSchool,
                      contactPerson: event.target.value,
                    })
                  }
                  className="h-11 rounded-xl border-slate-200 focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contactDesignation" className="text-sm font-semibold text-slate-700">Contact Designation (Optional)</Label>
                <Input
                  id="contactDesignation"
                  placeholder="e.g. Head Teacher / DOS"
                  value={newSchool.contactDesignation}
                  onChange={(event) =>
                    setNewSchool({
                      ...newSchool,
                      contactDesignation: event.target.value,
                    })
                  }
                  className="h-11 rounded-xl border-slate-200 focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              <div className="md:col-span-2">
                <p className="text-xs text-slate-500 leading-relaxed italic">
                  After designation, please add mobile contact for the contact person WAKISSHA will be contacting
                </p>
              </div>
            </div>
            <DialogFooter className="mt-8 gap-3 sm:gap-0">
              <Button
                variant="outline"
                onClick={() => {
                  setIsAddDialogOpen(false);
                  setLogoPreview("");
                  setLogoFile(null);
                }}
                className="h-11 rounded-xl px-6 font-semibold"
              >
                Cancel
              </Button>
              <Button
                onClick={handleAddSchool}
                disabled={
                  !newSchool.name ||
                  !newSchool.email ||
                  !newSchool.phone ||
                  !newSchool.address ||
                  !newSchool.educationLevel ||
                  !newSchool.zone_id
                }
                className="h-11 rounded-xl px-8 font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-200"
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
              <p className="text-sm font-medium text-slate-500">{stat.label}</p>
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
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
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
        <CardHeader className="border-b border-slate-200">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <CardTitle className="text-slate-900">Registered Schools</CardTitle>
              <CardDescription className="text-slate-500">
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
                  <TableCell className="font-semibold text-slate-900">
                    {school.name}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{school.code}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <div className="text-slate-900">{school.district}</div>
                      <div className="text-slate-500">{school.zone}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <div className="text-slate-900">{school.email}</div>
                      <div className="text-slate-500">{school.phone}</div>
                    </div>
                  </TableCell>
                  <TableCell>{school.students}</TableCell>
                  <TableCell>{getStatusBadge(school.status)}</TableCell>
                  <TableCell>
                    {school.status === "active" && school.activationCode ? (
                      <div className="flex items-center gap-2 text-sm text-slate-900">
                        <ShieldCheck className="h-4 w-4 text-green-400" />
                        {school.activationCode}
                      </div>
                    ) : (
                      <span className="text-sm text-slate-500">Not active yet</span>
                    )}
                  </TableCell>
                  <TableCell className="text-slate-500">
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



