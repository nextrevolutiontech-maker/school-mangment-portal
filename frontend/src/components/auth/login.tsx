import { useState } from "react";
import { Eye, EyeOff, Loader2, Shield, FileText, LayoutDashboard, Lock, School } from "lucide-react";
import { Card, CardContent } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Alert, AlertDescription } from "../ui/alert";
import { useAuth } from "../auth-context";
import wakisshaLogo from "../../assets/logo.png";
import loginImage from "../../assets/login.jpeg";
import { RegisterSchool } from "./register-school";

export function Login() {
  const [view, setView] = useState<"login" | "register">("login");
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
    <div className="flex flex-col lg:flex-row min-h-screen w-full bg-white overflow-hidden font-['Sora']">
      {/* Left Section - Hero */}
      <div className="hidden lg:flex w-1/2 relative overflow-hidden shrink-0">
        {/* Background Image */}
        <div 
          className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat transition-transform duration-[20s] hover:scale-110"
          style={{ backgroundImage: `url(${loginImage})` }}
        />
        
        {/* Gradient Overlay - Matching the second reference image */}
        <div 
          className="absolute inset-0 z-10"
          style={{ 
            background: 'linear-gradient(135deg, rgba(20, 50, 60, 0.95) 0%, rgba(10, 80, 80, 0.85) 50%, rgba(15, 60, 60, 0.9) 100%)' 
          }}
        />

        {/* Content Overlay */}
        <div className="relative z-20 flex flex-col justify-between h-full w-full p-12 lg:p-14">
          <div className="flex items-center gap-4 animate-in fade-in slide-in-from-left-4 duration-700">
            <div className="bg-white p-2 rounded-2xl shadow-2xl ring-1 ring-white/20">
              <img src={wakisshaLogo} alt="WAKISSHA Logo" className="w-10 h-10 object-contain" />
            </div>
            <div>
              <h1 className="text-xl font-black tracking-tight text-white leading-none">WAKISSHA</h1>
              <p className="text-teal-400 text-[8px] font-bold uppercase tracking-[0.25em] mt-1">Examination Portal</p>
            </div>
          </div>

          <div className="max-w-xl animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-300">
            <h2 className="text-3xl xl:text-4xl font-black text-white leading-[1.1] tracking-tight mb-4">
              {view === "login" ? "Welcome back to your" : "Start your journey with"} <br/>
              <span className="text-teal-400">Examination Workspace</span>
            </h2>
            <p className="text-slate-300 text-sm font-medium leading-relaxed mb-6 max-w-sm">
              The official portal for Wakiso Secondary School Headteachers Association. 
              Manage registration, entries, and reports in one place.
            </p>

            <div className="space-y-4">
              <div className="flex items-center gap-4 group">
                <div className="h-9 w-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center group-hover:bg-teal-400/10 group-hover:border-teal-400/20 transition-all duration-500">
                  <Shield className="h-4.5 w-4.5 text-teal-400" />
                </div>
                <div>
                  <h4 className="text-white font-bold text-[13px]">Secure Access</h4>
                  <p className="text-slate-400 text-[11px]">Role-based security for schools and administrators.</p>
                </div>
              </div>
              <div className="flex items-center gap-4 group">
                <div className="h-9 w-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center group-hover:bg-teal-400/10 group-hover:border-teal-400/20 transition-all duration-500">
                  <LayoutDashboard className="h-4.5 w-4.5 text-teal-400" />
                </div>
                <div>
                  <h4 className="text-white font-bold text-[13px]">Real-time Visibility</h4>
                  <p className="text-slate-400 text-[11px]">Track registration progress and financial status live.</p>
                </div>
              </div>
              <div className="flex items-center gap-4 group">
                <div className="h-9 w-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center group-hover:bg-teal-400/10 group-hover:border-teal-400/20 transition-all duration-500">
                  <FileText className="h-4.5 w-4.5 text-teal-400" />
                </div>
                <div>
                  <h4 className="text-white font-bold text-[13px]">Automated Reporting</h4>
                  <p className="text-slate-400 text-[11px]">Generate and download official exam forms instantly.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-6 border-t border-white/10 opacity-60">
            <p className="text-slate-400 text-[9px] font-bold uppercase tracking-widest">© 2026 WAKISSHA Portal</p>
            <div className="flex gap-2.5">
              <div className="h-1.5 w-1.5 rounded-full bg-teal-400"></div>
              <div className="h-1.5 w-1.5 rounded-full bg-teal-400/20"></div>
              <div className="h-1.5 w-1.5 rounded-full bg-teal-400/20"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Section - Forms */}
      <div className="w-full lg:w-1/2 flex flex-col bg-white relative h-screen overflow-y-auto scrollbar-hide">
        <div className={`flex-1 flex flex-col items-center p-6 lg:p-10 relative z-10 ${view === 'login' ? 'justify-center' : 'justify-start pt-12 lg:pt-16'}`}>
          {/* Mobile Logo Only */}
          <div className="lg:hidden flex items-center justify-center gap-3 mb-6">
            <div className="bg-white p-2 rounded-xl shadow-lg ring-1 ring-gray-100">
              <img src={wakisshaLogo} alt="Logo" className="w-7 h-7 object-contain" />
            </div>
            <h1 className="text-lg font-black tracking-tight text-gray-900">WAKISSHA</h1>
          </div>

          {view === "login" ? (
            <div className="w-full max-w-[400px] animate-in fade-in slide-in-from-bottom-4 duration-700">
              <div className="text-center mb-6">
                <div className="inline-flex items-center justify-center p-1 bg-slate-100/50 rounded-xl mb-4 ring-1 ring-slate-200/50">
                  <button className="px-5 py-1.5 bg-white text-teal-600 shadow-sm rounded-lg text-[9px] font-black uppercase tracking-widest ring-1 ring-slate-200">
                    School Login
                  </button>
                  <button
                    className="px-5 py-1.5 text-slate-500 hover:text-slate-900 transition-all text-[9px] font-black uppercase tracking-widest"
                    onClick={() => setView("register")}
                  >
                    Register School
                  </button>
                </div>
                <h2 className="text-2xl font-black text-slate-900 tracking-tight leading-none mb-2">
                  Welcome Back
                </h2>
                <p className="text-slate-500 font-bold text-[9px] uppercase tracking-widest opacity-80">
                  Enter your credentials to access your school portal
                </p>
              </div>

              <Card className="border-none shadow-[0_20px_50px_-12px_rgba(0,0,0,0.06)] rounded-[1.5rem] bg-white ring-1 ring-slate-200/60 overflow-hidden">
                <CardContent className="p-6 lg:p-7">
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-1.5">
                      <Label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">
                        School Code or Email
                      </Label>
                      <div className="relative group">
                        <School className="absolute left-4 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 transition-colors group-focus-within:text-teal-600" />
                        <Input
                          placeholder="admin@wakissha.ug"
                          value={identifier}
                          onChange={(e) => setIdentifier(e.target.value)}
                          required
                          className="h-11 pl-11 border-slate-200 rounded-xl bg-slate-50/50 focus:bg-white focus:ring-4 focus:ring-teal-50 transition-all font-bold text-xs"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between ml-1">
                        <Label title="Password" className="text-[9px] font-black text-slate-500 uppercase tracking-widest">
                          Password
                        </Label>
                        <button
                          type="button"
                          className="text-[8px] font-black text-teal-600 hover:text-teal-700 uppercase tracking-widest"
                        >
                          Forgot Password?
                        </button>
                      </div>
                      <div className="relative group">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 transition-colors group-focus-within:text-teal-600" />
                        <Input
                          type={showPassword ? "text" : "password"}
                          placeholder="••••••••"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          required
                          className="h-11 pl-11 border-slate-200 rounded-xl bg-slate-50/50 focus:bg-white focus:ring-4 focus:ring-teal-50 transition-all font-bold text-xs pr-11"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-teal-600 transition-colors p-1"
                        >
                          {showPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                        </button>
                      </div>
                    </div>

                    {error && (
                      <Alert variant="destructive" className="rounded-xl border-red-50 bg-red-50/50 py-1.5">
                        <AlertDescription className="text-[9px] font-bold text-red-600 text-center">
                          {error}
                        </AlertDescription>
                      </Alert>
                    )}

                    <Button
                      type="submit"
                      className="w-full h-11 bg-teal-600 hover:bg-teal-700 text-white font-black uppercase tracking-[0.2em] rounded-xl shadow-lg shadow-teal-100 transition-all duration-500 active:scale-[0.98] text-[9px] mt-1 flex items-center justify-center"
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        "Sign In to Portal"
                      )}
                    </Button>
                  </form>

                  <div className="mt-6 text-center">
                    <p className="text-[11px] font-medium text-slate-500">
                      Don't have an account yet?{" "}
                      <button 
                        onClick={() => setView("register")}
                        className="text-teal-600 font-black hover:underline underline-offset-4"
                      >
                        Register school
                      </button>
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <div className="w-full max-w-[500px] animate-in fade-in slide-in-from-bottom-4 duration-700 pb-10">
              <RegisterSchool onBackToLogin={() => setView("login")} />
            </div>
          )}
        </div>

        {/* Global Footer - Exactly matching reference image */}
        <div className="mt-auto py-6 text-center pointer-events-none z-20 px-4 w-full max-w-full opacity-60">
          <p className="text-[8px] font-bold text-slate-400 uppercase tracking-[0.15em] leading-relaxed break-words">
            © 2026 WAKISSHA • ALL RIGHTS RESERVED <br className="sm:hidden" />
            <span className="hidden sm:inline mx-1.5">•</span>
            DEVELOPED BY <span className="text-teal-600">INFOSIGHT TECH-SYSTEMS</span>
          </p>
        </div>
      </div>
    </div>
  );
}