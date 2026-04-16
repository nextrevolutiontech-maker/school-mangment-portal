import { useState } from "react";
import { Menu } from "lucide-react";
import { AuthProvider, useAuth } from "./components/auth-context";
import { Login } from "./components/auth/login";
import { Sidebar } from "./components/layout/sidebar";
import { AdminDashboard } from "./components/dashboards/admin-dashboard";
import { SchoolDashboard } from "./components/dashboards/school-dashboard";
import { SchoolsManagement } from "./components/schools/schools-management";
import { StudentsEntries } from "./components/students/students-entries";
import { PaymentsVerification } from "./components/admin/payments-verification";
import { PaymentStatus } from "./components/school-pages/payment-status";
import { UploadPDF } from "./components/school-pages/upload-pdf";
import { Timetable } from "./components/shared/timetable";
import { Reports } from "./components/shared/reports";
import { SubjectsManagement } from "./components/subjects/subjects-management";
import { Button } from "./components/ui/button";
import { Toaster } from "./components/ui/sonner";
import { Avatar, AvatarFallback, AvatarImage } from "./components/ui/avatar";
import { Badge } from "./components/ui/badge";

function AppContent() {
  const { user, isAuthenticated } = useAuth();
  const [currentPage, setCurrentPage] = useState("dashboard");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  if (!isAuthenticated) {
    return <Login />;
  }

  const handlePageChange = (page: string) => {
    setCurrentPage(page);
  };

  const userInitials = user?.name
    ?.split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const renderPlaceholder = (pageTitle: string) => {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-center">
          <h2 className="mb-2 text-xl font-bold text-slate-900">{pageTitle}</h2>
          <p className="text-slate-500">This section is coming soon.</p>
          <button
            onClick={() => setCurrentPage("dashboard")}
            className="mt-4 text-primary hover:underline"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  };

  const renderPage = () => {
    if (user?.role === "admin") {
      switch (currentPage) {
        case "dashboard":
          return <AdminDashboard onPageChange={handlePageChange} />;
        case "schools":
          return <SchoolsManagement onPageChange={handlePageChange} />;
        case "students":
          return <StudentsEntries onPageChange={handlePageChange} />;
        case "payments":
          return <PaymentsVerification onPageChange={handlePageChange} />;
        case "reports":
          return <Reports onPageChange={handlePageChange} />;
        case "subjects":
          return <SubjectsManagement onPageChange={handlePageChange} />;
        case "academic-year":
          return renderPlaceholder("Academic Year Management - Coming in Phase 2");
        case "timetable":
          return <Timetable onPageChange={handlePageChange} />;
        case "settings":
          return renderPlaceholder("Settings - Coming in Phase 2");
        default:
          return <AdminDashboard onPageChange={handlePageChange} />;
      }
    }

    // School user routes - strict access control
    switch (currentPage) {
      case "dashboard":
        return <SchoolDashboard onPageChange={handlePageChange} />;
      case "my-students":
        return <StudentsEntries onPageChange={handlePageChange} />;
      case "add-student":
        return <StudentsEntries onPageChange={handlePageChange} />;
      case "students":
        return <StudentsEntries onPageChange={handlePageChange} />;
      case "payment-status":
        return <PaymentStatus onPageChange={handlePageChange} />;
      case "upload-pdf":
        return <UploadPDF onPageChange={handlePageChange} />;
      case "timetable":
        return <Timetable onPageChange={handlePageChange} />;
      case "reports":
        return <Reports onPageChange={handlePageChange} />;
      case "profile":
        return renderPlaceholder("School Profile - Coming in Phase 2");
      // Block admin pages from school users
      case "schools":
      case "payments":
      case "subjects":
      case "academic-year":
      case "settings":
        return renderPlaceholder("Access Denied - Admin Only");
      default:
        return <SchoolDashboard onPageChange={handlePageChange} />;
    }
  };

  return (
    <div className="h-screen w-full max-w-[100vw] flex overflow-hidden bg-background">
      <Sidebar
        currentPage={currentPage}
        onPageChange={handlePageChange}
        isMobileOpen={isSidebarOpen}
        onMobileClose={() => setIsSidebarOpen(false)}
      />
      <div className="flex-1 h-full min-w-0 max-w-full flex flex-col overflow-y-auto overflow-x-hidden">
        <header className="sticky top-0 z-20 border-b border-slate-200 bg-slate-50/90 backdrop-blur">
          <div className="flex items-center justify-between gap-4 px-4 py-4 sm:px-6">
            <div className="flex items-center gap-3">
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="md:hidden"
                onClick={() => setIsSidebarOpen(true)}
                aria-label="Open sidebar"
              >
                <Menu className="h-4 w-4" />
              </Button>
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">
                  WAKISSHA
                </p>
                <p className="text-xs text-slate-500">
                  Exam Portal
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-sm">
                <Avatar className="h-9 w-9 ring-1 ring-blue-100">
                  <AvatarImage src={user?.avatar} alt={user?.name} />
                  <AvatarFallback className="bg-blue-100 text-blue-700">
                    {userInitials}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-slate-900">{user?.name}</p>
                  <p className="truncate text-xs text-slate-500">
                    {user?.role === "admin" ? "Administrator" : user?.schoolCode}
                  </p>
                </div>
                {user?.status && (
                  <Badge
                    variant={
                      user.status === "active"
                        ? "success"
                        : user.status === "verified"
                          ? "info"
                          : user.status === "payment_submitted"
                            ? "payment"
                            : "warning"
                    }
                  >
                    {user.status.replace("_", " ")}
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </header>
        <main className="flex-1 overflow-x-hidden">
          <div className="w-full max-w-full p-4 sm:p-6">{renderPage()}</div>
        </main>
      </div>
      <Toaster />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}


