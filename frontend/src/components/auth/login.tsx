import { useState } from "react";
import { Eye, EyeOff, Loader2, ShieldCheck, FileText, LayoutDashboard, CheckCircle2 } from "lucide-react";
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
import loginBackground from "../../assets/login.jpeg";

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
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div className="flex min-h-screen">
        {/* Left Section - Content & Branding with Background Image */}
        <div className="hidden w-1/2 flex-col justify-between p-12 lg:flex relative overflow-hidden">
          {/* Background Image with Light Overlay */}
          <div className="absolute inset-0 z-0">
            <img
              src={loginBackground}
              alt=""
              className="h-full w-full object-cover opacity-25 grayscale-[40%]"
            />
            <div className="absolute inset-0 bg-gradient-to-br from-white/40 via-white/20 to-transparent" />
          </div>

          <div className="relative space-y-12">
            <div className="inline-block">
              <img
                src={wakisshaLogo}
                alt="WAKISSHA logo"
                className="h-10 w-auto opacity-80"
              />
            </div>

            <div className="space-y-8">
              <div className="space-y-3">
                <h1 className="text-3xl font-bold tracking-tight text-slate-900 lg:text-4xl leading-tight">
                  Welcome back to your <br />
                  <span className="text-[#2347A2]">Examination Workspace</span>
                </h1>
                <p className="max-w-md text-sm leading-relaxed text-slate-600">
                  The official portal for Wakiso Secondary School Headteachers Association. 
                  Manage registration, entries, and reports in one place.
                </p>
              </div>

              <div className="space-y-5">
                <div className="flex items-start gap-4">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white shadow-sm border border-slate-100">
                    <ShieldCheck className="h-4 w-4 text-[#2347A2]" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900">Secure Access</h3>
                    <p className="text-xs text-slate-600 mt-0.5">Role-based security for schools and administrators.</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white shadow-sm border border-slate-100">
                    <LayoutDashboard className="h-4 w-4 text-[#2347A2]" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900">Real-time Visibility</h3>
                    <p className="text-xs text-slate-600 mt-0.5">Track registration progress and financial status live.</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white shadow-sm border border-slate-100">
                    <FileText className="h-4 w-4 text-[#2347A2]" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900">Automated Reporting</h3>
                    <p className="text-xs text-slate-600 mt-0.5">Generate and download official exam forms instantly.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="relative">
            <div className="absolute inset-0 -inset-x-4 -inset-y-2 bg-white/30 backdrop-blur-[2px] rounded-xl -z-10" />
            <div className="space-y-4">
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-600">
                Trusted by 1000+ Schools
              </p>
              <div className="flex gap-6 opacity-60 grayscale italic font-serif text-lg text-slate-900">
                <span>WAKISSHA</span>
                <span>UNEP</span>
                <span>MOES</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Section - Login Form */}
        <div className="flex w-full items-center justify-center p-6 lg:w-1/2 lg:p-12">
          <div className="w-full max-w-[400px] space-y-8">
            <div className="lg:hidden">
              <img
                src={wakisshaLogo}
                alt="WAKISSHA logo"
                className="mb-8 h-10 w-auto"
              />
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl font-bold tracking-tight text-slate-900">
                Sign in to your account
              </h2>
              <p className="text-sm text-slate-500">
                Enter your credentials to access your workspace
              </p>
            </div>

            <Card className="border-slate-200 shadow-2xl shadow-slate-300/40 rounded-2xl overflow-hidden">
              <CardContent className="p-8 space-y-5">
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="identifier" className="text-xs font-semibold text-slate-600">
                      School Code / Admin Email
                    </Label>
                    <Input
                      id="identifier"
                      type="text"
                      placeholder="name@school.ug"
                      value={identifier}
                      onChange={(e) => setIdentifier(e.target.value)}
                      required
                      className="h-11 bg-slate-50/50 border-slate-200 focus:bg-white focus:border-[#2347A2] focus:ring-1 focus:ring-[#2347A2]/20 transition-all"
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="password" className="text-xs font-semibold text-slate-600">
                        Password
                      </Label>
                      <button type="button" className="text-[11px] font-medium text-[#2347A2] hover:text-[#1a357a] transition-colors">
                        Forgot?
                      </button>
                    </div>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        className="h-11 bg-slate-50/50 border-slate-200 pr-10 focus:bg-white focus:border-[#2347A2] focus:ring-1 focus:ring-[#2347A2]/20 transition-all"
                      />
                      <button
                        type="button"
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                        onClick={() => setShowPassword((prev) => !prev)}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <input type="checkbox" id="remember" className="h-3.5 w-3.5 rounded border-slate-300 text-[#2347A2] focus:ring-[#2347A2] focus:ring-offset-0" />
                    <label htmlFor="remember" className="text-xs text-slate-500 font-medium cursor-pointer">
                      Remember me for 30 days
                    </label>
                  </div>

                  {error && (
                    <Alert variant="destructive" className="py-2.5">
                      <AlertDescription className="text-xs">{error}</AlertDescription>
                    </Alert>
                  )}

                  <Button
                    type="submit"
                    className="w-full h-11 bg-[#2347A2] hover:bg-[#1a357a] hover:shadow-lg hover:shadow-[#2347A2]/25 text-white font-semibold transition-all duration-200 active:scale-[0.98]"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Signing in...
                      </>
                    ) : (
                      "Sign in to Dashboard"
                    )}
                  </Button>

                  {/* Quick Login - Subtle */}
                  <div className="pt-2">
                    <div className="relative mb-5">
                      <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-slate-100"></div>
                      </div>
                      <div className="relative flex justify-center text-[10px] uppercase tracking-widest font-bold">
                        <span className="bg-white px-3 text-slate-400">Quick Access</span>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => {
                          setIdentifier("admin@wakissha.ug");
                          setPassword("wakissha2026");
                        }}
                        className="flex h-10 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-[11px] font-semibold text-slate-500 transition-all duration-150 hover:bg-slate-100 hover:border-slate-300 hover:text-slate-700"
                      >
                        Admin
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setIdentifier("WAK26-0001");
                          setPassword("demo123");
                        }}
                        className="flex h-10 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-[11px] font-semibold text-slate-500 transition-all duration-150 hover:bg-slate-100 hover:border-slate-300 hover:text-slate-700"
                      >
                        School
                      </button>
                    </div>
                  </div>
                </form>
              </CardContent>
            </Card>

            <div className="text-center pt-8 mt-auto">
              <p className="text-[10px] text-slate-500 tracking-wide">
                Developed by <span className="font-semibold text-slate-600">Infosight Tech-Systems</span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}



