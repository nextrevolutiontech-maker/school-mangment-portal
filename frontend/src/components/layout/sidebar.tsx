import { useState } from "react";
import {
  BookOpen,
  Calendar,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  FileText,
  LayoutDashboard,
  LogOut,
  School,
  Settings,
  Upload,
  UserCircle,
  UserPlus,
  Users,
  X,
  type LucideIcon,
} from "lucide-react";
import { useAuth } from "../auth-context";
import { Button } from "../ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import wakisshaLogo from "../../assets/logo.png";

interface SidebarProps {
  currentPage: string;
  onPageChange: (page: string) => void;
  isMobileOpen: boolean;
  onMobileClose: () => void;
}

interface NavigationItem {
  id: string;
  label: string;
  icon: LucideIcon;
}

const adminNavigation: NavigationItem[] = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "schools", label: "Schools Management", icon: School },
  { id: "students", label: "Students & Entries", icon: Users },
  { id: "payments", label: "Payments & Verification", icon: CreditCard },
  { id: "reports", label: "Reports", icon: FileText },
  { id: "subjects", label: "Subjects Management", icon: BookOpen },
  { id: "academic-year", label: "Academic Year", icon: CalendarDays },
  { id: "timetable", label: "Timetable", icon: Calendar },
  { id: "settings", label: "Settings", icon: Settings },
];

const schoolNavigation: NavigationItem[] = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "my-students", label: "My Students", icon: Users },
  { id: "add-student", label: "Add Student", icon: UserPlus },
  { id: "students", label: "Subject Entries", icon: BookOpen },
  { id: "payment-status", label: "Payment Status", icon: CreditCard },
  { id: "upload-pdf", label: "Upload Signed Form", icon: Upload },
  { id: "timetable", label: "Timetable", icon: Calendar },
  { id: "reports", label: "My Reports", icon: FileText },
  { id: "profile", label: "Profile", icon: UserCircle },
];

const statusStyles: Record<
  "active" | "verified" | "pending" | "payment_submitted",
  string
> = {
  active: "border-green-200 bg-green-50 text-green-700",
  verified: "border-blue-200 bg-blue-50 text-blue-700",
  pending: "border-yellow-200 bg-yellow-50 text-yellow-700",
  payment_submitted:
    "border-orange-200 bg-orange-50 text-orange-700",
};

const statusLabels: Record<
  "active" | "verified" | "pending" | "payment_submitted",
  string
> = {
  active: "Active",
  verified: "Verified",
  pending: "Pending",
  payment_submitted: "Payment Submitted",
};

export function Sidebar({
  currentPage,
  onPageChange,
  isMobileOpen,
  onMobileClose,
}: SidebarProps) {
  const { user, logout } = useAuth();
  const [isCollapsed, setIsCollapsed] = useState(false);

  if (!user) return null;

  const navigation = user.role === "admin" ? adminNavigation : schoolNavigation;

  const userInitials = user.name
    .split(" ")
    .map((name) => name[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const handleNavigation = (page: string) => {
    onPageChange(page);
    onMobileClose();
  };

  return (
    <>
      {isMobileOpen && (
        <button
          type="button"
          className="fixed inset-0 z-30 bg-slate-950/45 backdrop-blur-sm md:hidden"
          onClick={onMobileClose}
          aria-label="Close sidebar overlay"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-40 h-full flex-shrink-0 flex flex-col overflow-y-auto overflow-x-hidden border-r border-slate-200 bg-white text-slate-900 transition-[width,transform] duration-300 md:static md:translate-x-0 ${
          isCollapsed ? "md:w-20" : "md:w-64"
        } w-[19rem] ${isMobileOpen ? "translate-x-0" : "-translate-x-full"}`}
      >
        <div
          className={`relative border-b border-slate-200 px-4 py-5 ${
            isCollapsed ? "flex justify-center" : ""
          }`}
        >
          <div
            className={`flex items-start ${
              isCollapsed ? "w-full justify-center" : "justify-between gap-3"
            }`}
          >
            <div
              className={`min-w-0 ${
                isCollapsed ? "flex items-center justify-center" : "flex-1"
              }`}
            >
              {isCollapsed ? (
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white shadow-sm border border-slate-200 text-lg font-bold tracking-[0.12em] text-[#DC2626] shadow-sm">
                  W
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <img
                      src={wakisshaLogo}
                      alt="WAKISSHA logo"
                      className="h-12 w-auto object-contain"
                    />
                    <div className="min-w-0">
                      <p className="text-lg font-bold tracking-[0.14em] text-[#DC2626]">
                        WAKISSHA
                      </p>
                      <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
                        Exam Portal
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 rounded-2xl bg-white shadow-sm border border-slate-200 p-3">
                    <Avatar className="h-10 w-10 shrink-0 ring-1 ring-slate-200">
                      <AvatarImage src={user.avatar} alt={user.name} />
                      <AvatarFallback className="bg-red-600/10 text-red-600">
                        {userInitials}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1 overflow-hidden">
                      <p className="truncate text-sm font-semibold text-slate-900">
                        {user.name}
                      </p>
                      <p className="truncate text-xs text-slate-500">
                        {user.role === "school" ? user.schoolCode : "Administrator"}
                      </p>
                      {user.status && (
                        <span
                          className={`mt-2 inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold ${
                            statusStyles[user.status]
                          }`}
                        >
                          {statusLabels[user.status]}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div
              className={`flex items-center gap-2 ${
                isCollapsed
                  ? "absolute right-2 top-1/2 -translate-y-1/2"
                  : ""
              }`}
            >
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="md:hidden"
                onClick={onMobileClose}
                aria-label="Close sidebar"
              >
                <X className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="hidden md:inline-flex"
                onClick={() => setIsCollapsed((prev) => !prev)}
                aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
              >
                {isCollapsed ? (
                  <ChevronRight className="h-4 w-4" />
                ) : (
                  <ChevronLeft className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        </div>

        <nav className="flex-1 space-y-1.5 overflow-y-auto px-3 py-4">
          {navigation.map((item) => {
            const Icon = item.icon;
            const isActive = currentPage === item.id;

            return (
              <Button
                key={item.id}
                type="button"
                variant="ghost"
                title={item.label}
                className={`h-11 w-full rounded-full ${
                  isCollapsed ? "justify-center px-0" : "justify-start px-4"
                } ${
                  isActive
                    ? "bg-[#DC2626] text-white shadow-sm hover:bg-[#b91c1c]"
                    : "text-slate-500 hover:bg-red-50 hover:text-[#DC2626]"
                }`}
                onClick={() => handleNavigation(item.id)}
              >
                <Icon
                  className={`${isCollapsed ? "" : "mr-3"} h-4 w-4 shrink-0`}
                />
                {!isCollapsed && <span className="truncate">{item.label}</span>}
              </Button>
            );
          })}
        </nav>

        <div className="border-t border-slate-200 px-4 py-4">
          <Button
            type="button"
            variant="ghost"
            className={`w-full ${
              isCollapsed ? "justify-center px-0" : "justify-start px-3"
            } text-red-500 hover:bg-red-50 hover:text-red-600`}
            onClick={logout}
          >
            <LogOut className={`${isCollapsed ? "" : "mr-3"} h-4 w-4`} />
            {!isCollapsed && "Logout"}
          </Button>
        </div>
      </aside>
    </>
  );
}


