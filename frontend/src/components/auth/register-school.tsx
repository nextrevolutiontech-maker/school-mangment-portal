import { useState, useRef } from "react";
import { Loader2, ArrowLeft, School, Mail, Phone, MapPin, GraduationCap, Users, ImageIcon, Upload, X } from "lucide-react";
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
    <div className="w-full max-w-[650px] mx-auto flex flex-col justify-center space-y-4 relative z-10 py-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="text-center space-y-2">
        <div className="inline-flex items-center justify-center p-1.5 bg-slate-100/50 rounded-2xl mb-2 ring-1 ring-slate-200/50">
          <button 
            type="button"
            className="px-8 py-2 text-slate-500 hover:text-slate-900 transition-all text-[11px] font-black uppercase tracking-[0.1em]"
            onClick={onBackToLogin}
          >
            School Login
          </button>
          <button className="px-8 py-2 bg-white text-blue-600 shadow-sm rounded-xl text-[11px] font-black uppercase tracking-[0.1em] ring-1 ring-slate-200">
            Register School
          </button>
        </div>
        <h2 className="text-3xl font-black text-slate-900 tracking-tight leading-none">
          Institution Registration
        </h2>
        <p className="text-slate-500 font-bold text-xs uppercase tracking-widest">
          Join the WAKISSHA examination network
        </p>
      </div>

      <Card className="border-none shadow-[0_32px_64px_-12px_rgba(0,0,0,0.12)] rounded-[2.5rem] bg-white overflow-hidden ring-1 ring-slate-200/60">
        <CardContent className="p-8 lg:p-10">
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Logo Upload Section */}
            <div className="flex flex-col items-center justify-center pb-6 border-b border-slate-100">
              <Label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">
                Institution Logo
              </Label>
              <div className="relative group">
                <div className={`h-28 w-28 rounded-[2rem] border-2 border-dashed transition-all flex items-center justify-center overflow-hidden bg-slate-50/50 ${logoPreview ? 'border-blue-500 ring-4 ring-blue-50' : 'border-slate-200 group-hover:border-slate-300'}`}>
                  {logoPreview ? (
                    <img src={logoPreview} alt="School Logo" className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex flex-col items-center gap-1.5 text-slate-400">
                      <ImageIcon className="h-8 w-8" />
                      <span className="text-[9px] font-black uppercase tracking-wider">No Logo</span>
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
                <div className="absolute -bottom-2 -right-2 flex gap-1">
                  {logoPreview ? (
                    <Button
                      type="button"
                      size="icon"
                      variant="destructive"
                      className="h-8 w-8 rounded-xl shadow-lg transition-transform hover:scale-110"
                      onClick={removeLogo}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      size="icon"
                      className="h-8 w-8 rounded-xl bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-200 transition-transform hover:scale-110"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Upload className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
              <p className="text-[10px] text-slate-400 font-bold mt-4 uppercase tracking-widest">
                PNG, JPG or WebP • Max 2MB
              </p>
            </div>

            <div className="space-y-8">
              {/* Section 1: Institution Details */}
              <div className="space-y-5">
                <div className="flex items-center gap-3">
                  <div className="h-1 w-12 bg-blue-600 rounded-full"></div>
                  <h3 className="text-xs font-black text-slate-900 uppercase tracking-[0.2em]">Institution Details</h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
                  <div className="space-y-2 md:col-span-2">
                    <Label className="text-[11px] font-black text-slate-500 uppercase tracking-widest ml-1">
                      Full School Name
                    </Label>
                    <Input
                      placeholder="e.g. AMITY SECONDARY SCHOOL"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value.toUpperCase() })}
                      required
                      className="h-12 border-slate-200 rounded-2xl bg-slate-50/50 focus:bg-white focus:ring-4 focus:ring-blue-50 transition-all font-bold text-sm px-5"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-[11px] font-black text-slate-500 uppercase tracking-widest ml-1">
                      Official Email
                    </Label>
                    <Input
                      type="email"
                      placeholder="admin@school.ac.ug"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      required
                      className="h-12 border-slate-200 rounded-2xl bg-slate-50/50 focus:bg-white focus:ring-4 focus:ring-blue-50 transition-all font-bold text-sm px-5"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-[11px] font-black text-slate-500 uppercase tracking-widest ml-1">
                      Phone Number
                    </Label>
                    <Input
                      placeholder="+256 700 000 000"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      required
                      className="h-12 border-slate-200 rounded-2xl bg-slate-50/50 focus:bg-white focus:ring-4 focus:ring-blue-50 transition-all font-bold text-sm px-5"
                    />
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label className="text-[11px] font-black text-slate-500 uppercase tracking-widest ml-1">
                      Physical Address
                    </Label>
                    <Input
                      placeholder="Plot No, Street, City / Location"
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      required
                      className="h-12 border-slate-200 rounded-2xl bg-slate-50/50 focus:bg-white focus:ring-4 focus:ring-blue-50 transition-all font-bold text-sm px-5"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-[11px] font-black text-slate-500 uppercase tracking-widest ml-1">
                      Education Level
                    </Label>
                    <Select
                      value={formData.educationLevel}
                      onValueChange={(val: EducationLevel) => setFormData({ ...formData, educationLevel: val })}
                    >
                      <SelectTrigger className="h-12 border-slate-200 rounded-2xl bg-slate-50/50 focus:bg-white focus:ring-4 focus:ring-blue-50 font-bold text-sm px-5">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="rounded-2xl border-slate-200 p-2">
                        <SelectItem value="UCE" className="rounded-xl font-bold">UCE (O-Level)</SelectItem>
                        <SelectItem value="UACE" className="rounded-xl font-bold">UACE (A-Level)</SelectItem>
                        <SelectItem value="BOTH" className="rounded-xl font-bold">Both (O & A Level)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-[11px] font-black text-slate-500 uppercase tracking-widest ml-1">
                      School Zone
                    </Label>
                    <Select
                      value={formData.zone_id}
                      onValueChange={(val) => setFormData({ ...formData, zone_id: val })}
                    >
                      <SelectTrigger className="h-12 border-slate-200 rounded-2xl bg-slate-50/50 focus:bg-white focus:ring-4 focus:ring-blue-50 font-bold text-sm px-5">
                        <SelectValue placeholder="Select Zone" />
                      </SelectTrigger>
                      <SelectContent className="rounded-2xl border-slate-200 p-2 max-h-[250px]">
                        <SelectItem value="unknown" className="rounded-xl font-bold italic text-slate-400">Not Sure (Assign Later)</SelectItem>
                        {zones.map((zone) => (
                          <SelectItem key={zone.id} value={zone.id} className="rounded-xl font-bold">
                            {zone.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Section 2: Contact Person */}
              <div className="space-y-5 pt-4">
                <div className="flex items-center gap-3">
                  <div className="h-1 w-12 bg-emerald-500 rounded-full"></div>
                  <h3 className="text-xs font-black text-slate-900 uppercase tracking-[0.2em]">Contact Person</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
                  <div className="space-y-2">
                    <Label className="text-[11px] font-black text-slate-500 uppercase tracking-widest ml-1">
                      Full Name
                    </Label>
                    <Input
                      placeholder="e.g. JOHN DOE"
                      value={formData.contactPerson}
                      onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                      required
                      className="h-12 border-slate-200 rounded-2xl bg-slate-50/50 focus:bg-white focus:ring-4 focus:ring-emerald-50 transition-all font-bold text-sm px-5"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-[11px] font-black text-slate-500 uppercase tracking-widest ml-1">
                      Designation
                    </Label>
                    <Input
                      placeholder="e.g. HEADTEACHER"
                      value={formData.contactDesignation}
                      onChange={(e) => setFormData({ ...formData, contactDesignation: e.target.value })}
                      required
                      className="h-12 border-slate-200 rounded-2xl bg-slate-50/50 focus:bg-white focus:ring-4 focus:ring-emerald-50 transition-all font-bold text-sm px-5"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-[11px] font-black text-slate-500 uppercase tracking-widest ml-1">
                      Contact Mobile
                    </Label>
                    <Input
                      placeholder="+256 7xx xxx xxx"
                      value={formData.contactMobile}
                      onChange={(e) => setFormData({ ...formData, contactMobile: e.target.value })}
                      required
                      className="h-12 border-slate-200 rounded-2xl bg-slate-50/50 focus:bg-white focus:ring-4 focus:ring-emerald-50 transition-all font-bold text-sm px-5"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-[11px] font-black text-slate-500 uppercase tracking-widest ml-1">
                      WhatsApp Number
                    </Label>
                    <Input
                      placeholder="+256 7xx xxx xxx"
                      value={formData.contactWhatsApp}
                      onChange={(e) => setFormData({ ...formData, contactWhatsApp: e.target.value })}
                      className="h-12 border-slate-200 rounded-2xl bg-slate-50/50 focus:bg-white focus:ring-4 focus:ring-emerald-50 transition-all font-bold text-sm px-5"
                    />
                  </div>
                </div>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full h-14 bg-slate-900 hover:bg-blue-600 text-white font-black uppercase tracking-[0.2em] rounded-2xl shadow-xl shadow-slate-200 transition-all duration-500 active:scale-[0.98] text-xs mt-4 group"
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="flex items-center gap-3">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>Processing...</span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <span>Submit Registration</span>
                  <ArrowRightCircle className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </div>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
      
      <div className="pt-2">
        <button 
          type="button"
          onClick={onBackToLogin}
          className="w-full flex items-center justify-center gap-2 text-slate-400 hover:text-blue-600 transition-all font-black text-[11px] uppercase tracking-widest group"
        >
          <ArrowLeft className="h-3.5 w-3.5 group-hover:-translate-x-1 transition-transform" />
          Back to School Login
        </button>
      </div>
    </div>
  );
}
