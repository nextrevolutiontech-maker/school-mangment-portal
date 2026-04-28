import { useState } from "react";
import { Eye, EyeOff, Loader2, Shield, FileText, LayoutDashboard, Lock } from "lucide-react";
import { Card, CardContent } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Alert, AlertDescription } from "../ui/alert";
import { useAuth } from "../auth-context";
import wakisshaLogo from "../../assets/logo.png";
import loginImage from "../../assets/login.jpeg";

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
    <div className="h-screen w-full flex bg-white font-['Inter'] overflow-hidden">
      {/* Left Section - Image with Gradient Overlay */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        {/* Background Image */}
        <div 
          className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url(${loginImage})` }}
        />
        
        {/* Dark Gradient Overlay for high text visibility */}
        <div 
          className="absolute inset-0 z-10"
          style={{ 
            background: 'linear-gradient(to right, rgba(20, 40, 70, 0.92), rgba(10, 80, 80, 0.85))' 
          }}
        />

        {/* Content on Left Panel */}
        <div className="relative z-20 flex flex-col p-16 w-full text-white">
          <div className="flex items-center gap-4 mb-12">
            <div className="bg-white p-2 rounded-2xl shadow-2xl shadow-black/20 ring-1 ring-white/20">
              <img
                src={wakisshaLogo}
                alt="WAKISSHA logo"
                className="w-9 h-9 object-contain"
              />
            </div>
            <div>
              <h2 className="text-xl font-black tracking-tighter font-['Sora'] text-white">WAKISSHA</h2>
              <p className="text-[9px] text-teal-300 font-bold uppercase tracking-[0.25em]">Examination Portal</p>
            </div>
          </div>

          <div className="space-y-10">
            <div className="space-y-4">
              <h1 className="text-4xl font-extrabold leading-tight font-['Sora'] tracking-tight text-white">
                Welcome back to your <br />
                <span className="text-teal-300">Examination Workspace</span>
              </h1>
              <p className="text-base text-white/90 max-w-md font-medium leading-relaxed">
                The official portal for Wakiso Secondary School Headteachers Association. 
                Manage registration, entries, and reports in one place.
              </p>
            </div>

            <div className="space-y-6 pt-2">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20 flex-shrink-0">
                  <Shield className="w-5 h-5 text-teal-300" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Secure Access</h3>
                  <p className="text-sm text-white/60 font-medium leading-snug">Role-based security for schools and administrators.</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20 flex-shrink-0">
                  <LayoutDashboard className="w-5 h-5 text-teal-300" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Real-time Visibility</h3>
                  <p className="text-sm text-white/60 font-medium leading-snug">Track registration progress and financial status live.</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20 flex-shrink-0">
                  <FileText className="w-5 h-5 text-teal-300" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Automated Reporting</h3>
                  <p className="text-sm text-white/60 font-medium leading-snug">Generate and download official exam forms instantly.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Section - Login Form */}
      <div className="w-full lg:w-1/2 flex flex-col items-center justify-between p-6 lg:p-12 bg-white relative overflow-hidden">
        {/* Decorative background elements for Right Panel */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-teal-50/30 rounded-full blur-[120px] -mr-64 -mt-64 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-blue-50/20 rounded-full blur-[100px] -ml-48 -mb-48 pointer-events-none" />

        {/* Mobile Logo Only */}
        <div className="lg:hidden flex items-center justify-center gap-3 mb-4 relative z-10">
          <div className="bg-white p-2 rounded-xl shadow-lg ring-1 ring-gray-100">
            <img src={wakisshaLogo} alt="Logo" className="w-8 h-8 object-contain" />
          </div>
          <h1 className="text-xl font-black tracking-tight text-gray-900 font-['Sora']">WAKISSHA</h1>
        </div>

        {/* Main Content Area - Centered Card */}
        <div className="max-w-[440px] w-full mx-auto flex-1 flex flex-col justify-center space-y-4 relative z-10 min-h-0">
          <div className="w-full">
            <div className="text-center mb-4">
              <h2 className="text-2xl font-black text-gray-900 font-['Sora'] tracking-tight mb-1">
                Secure Login
              </h2>
              <p className="text-gray-600 font-semibold text-[13px]">
                Enter your credentials to access the portal
              </p>
            </div>

            <Card className="border-none shadow-[0_32px_64px_-12px_rgba(0,0,0,0.14)] rounded-[32px] bg-white overflow-hidden ring-1 ring-gray-200/60">
              <CardContent className="p-6 lg:p-8">
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="identifier" className="text-[10px] font-bold text-gray-600 uppercase tracking-[0.18em] ml-1">
                      School Code or Email
                    </Label>
                    <div className="relative group">
                      <Input
                        id="identifier"
                        type="text"
                        placeholder="e.g. WAK-001 or admin@wakissha.ug"
                        value={identifier}
                        onChange={(e) => setIdentifier(e.target.value)}
                        required
                        className="h-11 border-gray-200 rounded-2xl bg-gray-50/50 focus:bg-white focus:border-teal-500 focus:ring-4 focus:ring-teal-500/5 transition-all duration-300 placeholder:text-gray-400 font-medium pl-5 text-gray-900 text-sm"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between ml-1">
                      <Label htmlFor="password" className="text-[10px] font-bold text-gray-600 uppercase tracking-[0.18em]">
                        Password
                      </Label>
                      <button type="button" className="text-[10px] font-bold text-teal-700 hover:text-teal-800 transition-colors">
                        Forgot?
                      </button>
                    </div>
                    <div className="relative group">
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        className="h-11 border-gray-200 rounded-2xl bg-gray-50/50 pr-14 focus:bg-white focus:border-teal-500 focus:ring-4 focus:ring-teal-500/5 transition-all duration-300 placeholder:text-gray-400 font-medium pl-5 text-gray-900 text-sm"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-teal-600 transition-colors p-1"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  {error && (
                    <Alert variant="destructive" className="rounded-2xl border-red-50 bg-red-50/50 py-2">
                      <AlertDescription className="text-[11px] font-semibold text-red-600 text-center">
                        {error}
                      </AlertDescription>
                    </Alert>
                  )}

                  <Button
                    type="submit"
                    className="w-full h-11 bg-teal-600 hover:bg-teal-700 text-white font-bold tracking-wide rounded-2xl shadow-lg shadow-teal-600/20 transition-all duration-300 active:scale-[0.98] font-['Sora'] text-sm mt-1"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <div className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Verifying...</span>
                      </div>
                    ) : (
                      "Sign In to Portal"
                    )}
                  </Button>
                </form>

                {/* Quick Access Section */}
                <div className="space-y-3 pt-1 mt-3">
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t border-gray-100" />
                    </div>
                    <div className="relative flex justify-center text-[9px] uppercase tracking-[0.25em] font-black">
                      <span className="bg-white px-4 text-gray-400">Quick Access</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 mt-3">
                    <button 
                      onClick={() => {
                        setIdentifier("admin@wakissha.ug");
                        setPassword("admin123");
                      }}
                      className="h-10 flex items-center justify-center rounded-xl border border-gray-200 bg-white hover:bg-gray-50 hover:border-teal-500/30 transition-all duration-300 group"
                    >
                      <span className="text-[11px] font-bold text-gray-600 group-hover:text-teal-700">Admin</span>
                    </button>
                    <button 
                      onClick={() => {
                        setIdentifier("WAK26-0001");
                        setPassword("demo123");
                      }}
                      className="h-10 flex items-center justify-center rounded-xl border border-gray-200 bg-white hover:bg-gray-50 hover:border-teal-500/30 transition-all duration-300 group"
                    >
                      <span className="text-[11px] font-bold text-gray-600 group-hover:text-teal-700">School</span>
                    </button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Footer Below Login Card */}
        <div className="w-full text-center space-y-1 pb-4 pt-2 relative z-10">
          <p className="text-[9px] font-bold text-gray-400 uppercase tracking-[0.2em]">
            © 2026 WAKISSHA • ALL RIGHTS RESERVED
          </p>
          <p className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.05em]">
            Developed by <span className="text-teal-600">INFOSIGHT TECH-SYSTEMS</span>
          </p>
        </div>
      </div>
    </div>
  );
}