import { useState } from "react";
import { Eye, EyeOff, Loader2, ShieldCheck, Sparkles } from "lucide-react";
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
import { Alert, AlertDescription } from "../ui/alert";
import { useAuth } from "../auth-context";
import wakisshaLogo from "../../assets/logo.png";

export function Login() {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      await login(identifier, password);
    } catch {
      setError(
        "Invalid credentials. Please check your school code/admin email and password.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const demoAccounts = [
    {
      identifier: "admin@wakissha.org",
      password: "wakissha2026",
      role: "WAKISSHA Admin",
      description: "Full system access - schools, payments, reports",
    },
    {
      identifier: "WAK26-0001",
      password: "demo123",
      role: "AMITY SECONDARY SCHOOL",
      description: "Active school - can add students and submit forms",
    },
    {
      identifier: "WAK26-0002",
      password: "demo123",
      role: "Wakiso Hills College",
      description: "Verified - payment confirmed, awaiting activation",
    },
    {
      identifier: "WAK26-0003",
      password: "demo123",
      role: "Entebbe High School",
      description: "Pending - awaiting payment verification",
    },
  ];

  return (
    <div className="min-h-screen bg-[#F4F7FC] p-4 text-slate-900 sm:p-6">
      <div className="mx-auto flex min-h-[calc(100vh-2rem)] w-full max-w-7xl flex-col justify-center gap-6">
        <Card className="overflow-hidden border-[#DCE4F2] shadow-md">
          <div className="grid lg:grid-cols-[1.2fr_0.8fr]">
            <div className="relative overflow-hidden border-b border-[#E8EDF7] bg-[#FBFCFF] p-8 lg:border-r lg:border-b-0 lg:p-12">
              <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(30,58,138,0.03),transparent_45%),radial-gradient(circle_at_bottom_right,rgba(245,158,11,0.08),transparent_30%)]" />
              <div className="relative z-10 flex h-full flex-col justify-between gap-10">
                <div className="space-y-6">
                  <img
                    src={wakisshaLogo}
                    alt="WAKISSHA logo"
                    className="h-12 w-auto object-contain"
                  />

                  <div className="space-y-4">
                    <div className="inline-flex items-center gap-2 rounded-full border border-[#D9C38A] bg-[#FDF9ED] px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-[#8B6A19]">
                      <Sparkles className="h-3.5 w-3.5" />
                      Digital Exam Portal
                    </div>

                    <div className="space-y-3">
                      <h1 className="text-4xl font-extrabold tracking-tight text-[#142C6E] lg:text-5xl">
                        WAKISSHA PORTAL
                      </h1>
                      <p className="max-w-xl text-base text-slate-500 lg:text-lg">
                        Wakiso Secondary School Headteachers Association
                      </p>
                    </div>

                    <p className="max-w-2xl text-sm leading-7 text-slate-500 lg:text-base">
                      A premium SaaS portal for school registration, student
                      entries, payment tracking, reporting, and examination
                      readiness across member schools.
                    </p>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="bg-white shadow-sm border border-[#E1E8F5] rounded-2xl p-4 transition-all duration-200 ease-in-out hover:-translate-y-1 hover:shadow-md">
                    <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600/10 text-blue-700">
                      <ShieldCheck className="h-5 w-5" />
                    </div>
                    <p className="text-sm font-semibold text-slate-900">
                      Secure School Access
                    </p>
                    <p className="mt-2 text-sm leading-6 text-slate-500">
                      Schools and administrators sign in from one protected
                      workspace with role-based navigation.
                    </p>
                  </div>

                  <div className="bg-white shadow-sm border border-[#E1E8F5] rounded-2xl p-4 transition-all duration-200 ease-in-out hover:-translate-y-1 hover:shadow-md">
                    <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-[#FDF9ED] text-[#A07514]">
                      <Sparkles className="h-5 w-5" />
                    </div>
                    <p className="text-sm font-semibold text-slate-900">
                      Registration Visibility
                    </p>
                    <p className="mt-2 text-sm leading-6 text-slate-500">
                      Track entries, finance progress, uploads, reports, and
                      exam schedules in one place.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="relative bg-[linear-gradient(150deg,#F8FAFF,#F4F7FC)] p-6 lg:p-10">
              <div className="mx-auto flex h-full max-w-md flex-col justify-center">
                <Card className="bg-white shadow-md border border-[#DCE4F2] rounded-3xl">
                  <CardHeader className="space-y-2">
                    <CardTitle className="text-2xl font-semibold text-slate-900">
                      Sign In
                    </CardTitle>
                    <CardDescription className="text-slate-500">
                      Enter your school code or admin email to access your
                      portal.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-5">
                      <div className="space-y-2">
                        <Label htmlFor="identifier" className="text-slate-500">
                          School Code / Admin Email
                        </Label>
                        <Input
                          id="identifier"
                          type="text"
                          placeholder="Enter school code or admin email"
                          value={identifier}
                          onChange={(e) => setIdentifier(e.target.value)}
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="password" className="text-slate-500">
                          Password
                        </Label>
                        <div className="relative">
                          <Input
                            id="password"
                            type={showPassword ? "text" : "password"}
                            placeholder="Enter your password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            className="pr-10"
                          />
                          <button
                            type="button"
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                            onClick={() => setShowPassword((prev) => !prev)}
                            aria-label={showPassword ? "Hide password" : "Show password"}
                          >
                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                      </div>

                      {error && (
                        <Alert variant="destructive">
                          <AlertDescription>{error}</AlertDescription>
                        </Alert>
                      )}

                      <Button
                        type="submit"
                        className="w-full bg-gradient-to-b from-[#2347A2] to-[#112E7E] text-white shadow-md hover:from-[#1F3F95] hover:to-[#0F286D]"
                        disabled={isLoading}
                      >
                        {isLoading ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Signing in...
                          </>
                        ) : (
                          "Sign In"
                        )}
                      </Button>
                      <p className="pt-1 text-right text-sm text-slate-500 hover:text-primary cursor-pointer transition-colors duration-200">
                        Forgot Password?
                      </p>
                    </form>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </Card>

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {demoAccounts.map((account) => (
            <button
              key={account.identifier}
              type="button"
              className="rounded-2xl bg-white shadow-sm border border-slate-200 p-4 text-left transition-all duration-200 ease-in-out hover:border-blue-200 hover:bg-blue-50 hover:-translate-y-1 hover:shadow-md"
              onClick={() => {
                setIdentifier(account.identifier);
                setPassword(account.password);
              }}
            >
              <p className="text-sm font-semibold text-slate-900">
                {account.role}
              </p>
              <p className="mt-1 text-xs font-medium text-blue-700">
                {account.identifier}
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                {account.description}
              </p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}



