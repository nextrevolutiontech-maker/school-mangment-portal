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
import loginBg from "../../assets/login.jpeg";

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

  return (
    <div className="min-h-screen bg-[#F4F7FC] p-4 text-slate-900 sm:p-6">
      <div className="mx-auto flex min-h-[calc(100vh-2rem)] w-full max-w-7xl flex-col justify-center gap-6">
        <Card className="overflow-hidden border-[#DCE4F2] shadow-md">
          <div className="grid lg:grid-cols-[1.2fr_0.8fr]">
            <div className="relative overflow-hidden border-b border-[#E8EDF7] bg-[#142C6E] p-8 lg:border-r lg:border-b-0 lg:p-12">
              {/* Background Image with Lighter Overlay */}
              <div 
                className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat transition-transform duration-700 hover:scale-105"
                style={{ 
                  backgroundImage: `linear-gradient(rgba(20, 44, 110, 0.45), rgba(20, 44, 110, 0.35)), url(${loginBg})` 
                }}
              />
              
              <div className="relative z-10 flex h-full flex-col justify-between gap-10">
                <div className="space-y-6">
                  <div className="inline-block">
                    <img
                      src={wakisshaLogo}
                      alt="WAKISSHA logo"
                      className="h-14 w-auto object-contain"
                    />
                  </div>

                  <div className="space-y-4">
                    <div className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-black/20 px-3 py-1 text-xs font-bold uppercase tracking-[0.22em] text-white backdrop-blur-sm">
                      <Sparkles className="h-3.5 w-3.5 text-orange-400" />
                      Digital Exam Portal
                    </div>

                    <div className="space-y-3">
                      <h1 className="text-4xl font-black tracking-tight text-white drop-shadow-md lg:text-5xl">
                        WAKISSHA PORTAL
                      </h1>
                      <p className="max-w-xl text-lg font-bold text-white drop-shadow-sm lg:text-xl">
                        Wakiso Secondary School Headteachers Association
                      </p>
                    </div>

                    <p className="max-w-2xl text-base font-medium leading-7 text-white/90 drop-shadow-sm">
                      A premium SaaS portal for school registration, student
                      entries, payment tracking, reporting, and examination
                      readiness across member schools.
                    </p>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="bg-black/30 backdrop-blur-[2px] shadow-sm border border-white/20 rounded-2xl p-5 transition-all duration-200 ease-in-out hover:-translate-y-1 hover:bg-black/40">
                    <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/30 text-white">
                      <ShieldCheck className="h-6 w-6" />
                    </div>
                    <p className="text-sm font-bold text-white">
                      Secure School Access
                    </p>
                    <p className="mt-2 text-sm font-medium leading-6 text-white/80">
                      Schools and administrators sign in from one protected
                      workspace with role-based navigation.
                    </p>
                  </div>

                  <div className="bg-black/30 backdrop-blur-[2px] shadow-sm border border-white/20 rounded-2xl p-5 transition-all duration-200 ease-in-out hover:-translate-y-1 hover:bg-black/40">
                    <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-orange-500/30 text-white">
                      <Sparkles className="h-6 w-6" />
                    </div>
                    <p className="text-sm font-bold text-white">
                      Registration Visibility
                    </p>
                    <p className="mt-2 text-sm font-medium leading-6 text-white/80">
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

                      {/* Quick Login Section */}
                      <div className="mt-6 pt-6 border-t border-slate-100">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center mb-3">
                          Quick Login (Testing Only)
                        </p>
                        <div className="grid grid-cols-2 gap-3">
                          <button
                            type="button"
                            onClick={() => {
                              setIdentifier("admin@wakissha.ug");
                              setPassword("wakissha2026");
                            }}
                            className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-50 py-2 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900"
                          >
                            Admin Access
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setIdentifier("WAK26-0001");
                              setPassword("demo123");
                            }}
                            className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-50 py-2 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900"
                          >
                            School Access
                          </button>
                        </div>
                      </div>
                    </form>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}



