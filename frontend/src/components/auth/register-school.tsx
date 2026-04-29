import { useState } from "react";
import { Loader2, ArrowLeft, School, Mail, Phone, MapPin, GraduationCap, Users } from "lucide-react";
import { Card, CardContent } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { useAuth, EducationLevel } from "../auth-context";
import { toast } from "sonner";

interface RegisterSchoolProps {
  onBackToLogin: () => void;
}

export function RegisterSchool({ onBackToLogin }: RegisterSchoolProps) {
  const { zones, addSchool } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    educationLevel: "UCE" as EducationLevel,
    zone_id: "",
    contactPerson: "",
    contactDesignation: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.zone_id) {
      toast.error("Please select your school zone");
      return;
    }

    setIsLoading(true);
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1500));
      addSchool(formData);
      toast.success("Registration Successful", {
        description: "Your school has been registered. Please login with your school code.",
      });
      onBackToLogin();
    } catch (error) {
      toast.error("Registration Failed", {
        description: "An error occurred during registration. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-[550px] mx-auto flex flex-col justify-center space-y-2 relative z-10 py-2 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="text-center space-y-1">
        <div className="inline-flex items-center justify-center p-1 bg-slate-100 rounded-2xl mb-1">
          <button 
            type="button"
            className="px-6 py-1.5 text-slate-500 hover:text-slate-900 transition-colors text-[10px] font-bold uppercase tracking-wider"
            onClick={onBackToLogin}
          >
            School Login
          </button>
          <button className="px-6 py-1.5 bg-white text-teal-600 shadow-sm rounded-xl text-[10px] font-black uppercase tracking-wider">
            Register School
          </button>
        </div>
        <h2 className="text-2xl font-black text-gray-900 font-['Sora'] tracking-tight">
          School Registration
        </h2>
        <p className="text-gray-500 font-medium text-[11px]">
          Join the WAKISSHA examination network
        </p>
      </div>

      <Card className="border-none shadow-[0_32px_64px_-12px_rgba(0,0,0,0.14)] rounded-[32px] bg-white overflow-hidden ring-1 ring-gray-200/60">
        <CardContent className="p-5 lg:p-6">
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-3">
              <div className="space-y-1">
                <Label className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">
                  School Name
                </Label>
                <Input
                  placeholder="e.g. AMITY SECONDARY"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  className="h-9 border-slate-200 rounded-xl bg-slate-50/50 focus:bg-white focus:border-teal-500 transition-all font-bold text-xs"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">
                  Official Email
                </Label>
                <Input
                  type="email"
                  placeholder="school@example.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  className="h-9 border-slate-200 rounded-xl bg-slate-50/50 focus:bg-white focus:border-teal-500 transition-all font-bold text-xs"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">
                  Phone Number
                </Label>
                <Input
                  placeholder="+256..."
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  required
                  className="h-9 border-slate-200 rounded-xl bg-slate-50/50 focus:bg-white focus:border-teal-500 transition-all font-bold text-xs"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">
                  Physical Address
                </Label>
                <Input
                  placeholder="Plot, Street, City"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  required
                  className="h-9 border-slate-200 rounded-xl bg-slate-50/50 focus:bg-white focus:border-teal-500 transition-all font-bold text-xs"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">
                  Education Level
                </Label>
                <Select
                  value={formData.educationLevel}
                  onValueChange={(val: EducationLevel) => setFormData({ ...formData, educationLevel: val })}
                >
                  <SelectTrigger className="h-9 border-slate-200 rounded-xl bg-slate-50/50 font-bold text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-slate-200">
                    <SelectItem value="UCE">UCE (O-Level)</SelectItem>
                    <SelectItem value="UACE">UACE (A-Level)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">
                  School Zone
                </Label>
                <Select
                  value={formData.zone_id}
                  onValueChange={(val) => setFormData({ ...formData, zone_id: val })}
                >
                  <SelectTrigger className="h-9 border-slate-200 rounded-xl bg-slate-50/50 font-bold text-xs">
                    <SelectValue placeholder="Select Zone" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-slate-200 max-h-[150px]">
                    {zones.map((zone) => (
                      <SelectItem key={zone.id} value={zone.id}>
                        {zone.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">
                  Contact Person
                </Label>
                <Input
                  placeholder="Full Name"
                  value={formData.contactPerson}
                  onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                  required
                  className="h-9 border-slate-200 rounded-xl bg-slate-50/50 focus:bg-white focus:border-teal-500 transition-all font-bold text-xs"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">
                  Designation
                </Label>
                <Input
                  placeholder="e.g. Headteacher"
                  value={formData.contactDesignation}
                  onChange={(e) => setFormData({ ...formData, contactDesignation: e.target.value })}
                  required
                  className="h-9 border-slate-200 rounded-xl bg-slate-50/50 focus:bg-white focus:border-teal-500 transition-all font-bold text-xs"
                />
              </div>
            </div>

            <Button
              type="submit"
              className="w-full h-10 bg-teal-600 hover:bg-teal-700 text-white font-black tracking-wide rounded-2xl shadow-xl shadow-teal-600/20 transition-all duration-300 active:scale-[0.98] text-xs mt-1"
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Registering...</span>
                </div>
              ) : (
                "Submit Registration"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
      
      <button 
        type="button"
        onClick={onBackToLogin}
        className="flex items-center justify-center gap-2 text-slate-400 hover:text-teal-600 transition-colors font-bold text-[10px]"
      >
        <ArrowLeft className="h-3 w-3" />
        Back to Login
      </button>
    </div>
  );
}
