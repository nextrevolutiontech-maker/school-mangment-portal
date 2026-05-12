import { useState, useRef } from "react";
import { Loader2, ArrowLeft, School, Mail, Phone, MapPin, GraduationCap, Users, ImageIcon, Upload, X, ArrowRightCircle } from "lucide-react";
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
  const [logoPreview, setLogoPreview] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    educationLevel: "UCE" as EducationLevel,
    zone_id: "",
    contactPerson: "",
    contactDesignation: "",
    contactMobile: "",
    contactWhatsApp: "",
    schoolLogo: "",
  });

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

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

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      setLogoPreview(base64);
      setFormData({ ...formData, schoolLogo: base64 });
    };
    reader.readAsDataURL(file);
  };

  const removeLogo = () => {
    setLogoPreview("");
    setFormData({ ...formData, schoolLogo: "" });
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
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
    <div className="w-full max-w-[540px] mx-auto flex flex-col space-y-2 relative z-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="text-center space-y-1 mb-2">
        <div className="inline-flex items-center justify-center p-1 bg-slate-100/50 rounded-xl mb-3 ring-1 ring-slate-200/50">
          <button 
            type="button"
            className="px-4 py-1.5 text-slate-500 hover:text-slate-900 transition-all text-[9px] font-black uppercase tracking-widest"
            onClick={onBackToLogin}
          >
            School Login
          </button>
          <button className="px-4 py-1.5 bg-white text-teal-600 shadow-sm rounded-lg text-[9px] font-black uppercase tracking-widest ring-1 ring-slate-200">
            Register School
          </button>
        </div>
        <h2 className="text-xl font-black text-slate-900 tracking-tight leading-none mb-1">
          Institution Registration
        </h2>
        <p className="text-slate-500 font-bold text-[8px] uppercase tracking-widest opacity-80">
          Join the WAKISSHA examination network
        </p>
      </div>

      <Card className="border-none shadow-[0_20px_50px_-12px_rgba(0,0,0,0.06)] rounded-[1.5rem] bg-white ring-1 ring-slate-200/60 overflow-hidden">
        <CardContent className="p-5 lg:p-5">
          <form onSubmit={handleSubmit} className="space-y-3">
            {/* Logo Upload Section - Simplified */}
            <div className="flex flex-col items-center justify-center pb-2.5 border-b border-slate-50">
              <div className="relative group">
                <div className={`h-12 w-12 rounded-xl border-2 border-dashed transition-all flex items-center justify-center overflow-hidden bg-slate-50/50 ${logoPreview ? 'border-teal-500 ring-4 ring-teal-50' : 'border-slate-200 group-hover:border-slate-300'}`}>
                  {logoPreview ? (
                    <img src={logoPreview} alt="School Logo" className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex flex-col items-center gap-0 text-slate-400">
                      <span className="text-[6px] font-black uppercase tracking-wider">Logo</span>
                    </div>
                  )}
                </div>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleLogoChange}
                  accept="image/*"
                  className="hidden"
                />
                <div className="absolute -bottom-1 -right-1 flex gap-1">
                  {logoPreview ? (
                    <Button
                      type="button"
                      size="icon"
                      variant="destructive"
                      className="h-5 w-5 rounded-lg shadow-md transition-transform hover:scale-110"
                      onClick={removeLogo}
                    >
                      <X className="h-2.5 w-2.5" />
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      size="icon"
                      className="h-5 w-5 rounded-lg bg-teal-600 hover:bg-teal-700 shadow-md transition-transform hover:scale-110"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Upload className="h-2.5 w-2.5" />
                    </Button>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-3">
              {/* Section 1: Institution Details */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="h-0.5 w-4 bg-teal-600 rounded-full"></div>
                  <h3 className="text-[8px] font-black text-slate-900 uppercase tracking-widest">Institution Details</h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-3 gap-y-2.5">
                  <div className="space-y-1 md:col-span-2">
                    <Label className="text-[8px] font-black text-slate-500 uppercase tracking-tight ml-1">
                      Full School Name
                    </Label>
                    <Input
                      placeholder="e.g. AMITY SECONDARY SCHOOL"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value.toUpperCase() })}
                      required
                      className="h-8.5 border-slate-200 rounded-xl bg-slate-50/50 focus:bg-white transition-all font-bold text-[11px] px-3"
                    />
                  </div>

                  <div className="space-y-1">
                    <Label className="text-[8px] font-black text-slate-500 uppercase tracking-tight ml-1">
                      Official Email
                    </Label>
                    <Input
                      type="email"
                      placeholder="admin@school.ac.ug"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      required
                      className="h-8.5 border-slate-200 rounded-xl bg-slate-50/50 focus:bg-white transition-all font-bold text-[11px] px-3"
                    />
                  </div>

                  <div className="space-y-1">
                    <Label className="text-[8px] font-black text-slate-500 uppercase tracking-tight ml-1">
                      Phone Number
                    </Label>
                    <Input
                      placeholder="+256 700 000 000"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      required
                      className="h-8.5 border-slate-200 rounded-xl bg-slate-50/50 focus:bg-white transition-all font-bold text-[11px] px-3"
                    />
                  </div>

                  <div className="space-y-1 md:col-span-2">
                    <Label className="text-[8px] font-black text-slate-500 uppercase tracking-tight ml-1">
                      Physical Address
                    </Label>
                    <Input
                      placeholder="Plot No, Street, City / Location"
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      required
                      className="h-8.5 border-slate-200 rounded-xl bg-slate-50/50 focus:bg-white transition-all font-bold text-[11px] px-3"
                    />
                  </div>

                  <div className="space-y-1">
                    <Label className="text-[8px] font-black text-slate-500 uppercase tracking-tight ml-1">
                      Level
                    </Label>
                    <Select
                      value={formData.educationLevel}
                      onValueChange={(val: EducationLevel) => setFormData({ ...formData, educationLevel: val })}
                    >
                      <SelectTrigger className="h-8.5 border-slate-200 rounded-xl bg-slate-50/50 focus:bg-white font-bold text-[10px] px-3">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl border-slate-200">
                        <SelectItem value="UCE" className="text-[10px] font-bold">UCE (O-Level)</SelectItem>
                        <SelectItem value="UACE" className="text-[10px] font-bold">UACE (A-Level)</SelectItem>
                        <SelectItem value="BOTH" className="text-[10px] font-bold">Both Levels</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-[8px] font-black text-slate-500 uppercase tracking-tight ml-1">
                      School Zone
                    </Label>
                    <Select
                      value={formData.zone_id}
                      onValueChange={(val) => setFormData({ ...formData, zone_id: val })}
                    >
                      <SelectTrigger className="h-8.5 border-slate-200 rounded-xl bg-slate-50/50 focus:bg-white font-bold text-[10px] px-3">
                        <SelectValue placeholder="Select Zone" />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl border-slate-200 max-h-[150px]">
                        <SelectItem value="unknown" className="text-[10px] font-bold italic text-slate-400">Not Sure</SelectItem>
                        {zones.map((zone) => (
                          <SelectItem key={zone.id} value={zone.id} className="text-[10px] font-bold">
                            {zone.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Section 2: Contact Person */}
              <div className="space-y-2 pt-0.5">
                <div className="flex items-center gap-2">
                  <div className="h-0.5 w-4 bg-teal-500 rounded-full"></div>
                  <h3 className="text-[8px] font-black text-slate-900 uppercase tracking-widest">Contact Person</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-3 gap-y-2.5">
                  <div className="space-y-1">
                    <Label className="text-[8px] font-black text-slate-500 uppercase tracking-tight ml-1">
                      Full Name
                    </Label>
                    <Input
                      placeholder="e.g. JOHN DOE"
                      value={formData.contactPerson}
                      onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                      required
                      className="h-8.5 border-slate-200 rounded-xl bg-slate-50/50 focus:bg-white transition-all font-bold text-[11px] px-3"
                    />
                  </div>

                  <div className="space-y-1">
                    <Label className="text-[8px] font-black text-slate-500 uppercase tracking-tight ml-1">
                      Designation
                    </Label>
                    <Input
                      placeholder="e.g. HEADTEACHER"
                      value={formData.contactDesignation}
                      onChange={(e) => setFormData({ ...formData, contactDesignation: e.target.value })}
                      required
                      className="h-8.5 border-slate-200 rounded-xl bg-slate-50/50 focus:bg-white transition-all font-bold text-[11px] px-3"
                    />
                  </div>

                  <div className="space-y-1">
                    <Label className="text-[8px] font-black text-slate-500 uppercase tracking-tight ml-1">
                      Mobile
                    </Label>
                    <Input
                      placeholder="+256 7xx xxx xxx"
                      value={formData.contactMobile}
                      onChange={(e) => setFormData({ ...formData, contactMobile: e.target.value })}
                      required
                      className="h-8.5 border-slate-200 rounded-xl bg-slate-50/50 focus:bg-white transition-all font-bold text-[11px] px-3"
                    />
                  </div>

                  <div className="space-y-1">
                    <Label className="text-[8px] font-black text-slate-500 uppercase tracking-tight ml-1">
                      WhatsApp
                    </Label>
                    <Input
                      placeholder="+256 7xx xxx xxx"
                      value={formData.contactWhatsApp}
                      onChange={(e) => setFormData({ ...formData, contactWhatsApp: e.target.value })}
                      className="h-8.5 border-slate-200 rounded-xl bg-slate-50/50 focus:bg-white transition-all font-bold text-[11px] px-3"
                    />
                  </div>
                </div>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full h-10 bg-teal-600 hover:bg-teal-700 text-white font-black uppercase tracking-[0.2em] rounded-xl shadow-lg transition-all duration-300 active:scale-[0.98] text-[9px] mt-0.5"
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                "Submit Registration"
              )}
            </Button>
          </form>
          
          <div className="mt-4 text-center">
            <button 
              type="button"
              onClick={onBackToLogin}
              className="text-slate-500 hover:text-teal-600 transition-all font-black text-[9px] uppercase tracking-widest mx-auto"
            >
              Back to School Login
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
