import { useState, useMemo } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { useAuth, isStudentFullyRegistered } from "../auth-context";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { RadioGroup, RadioGroupItem } from "../ui/radio-group";
import { toast } from "sonner";
import { 
  CreditCard, 
  ChevronRight, 
  Info, 
  CheckCircle,
  AlertCircle,
  BookOpen,
  FileText,
  Calculator
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "../ui/alert";

interface MakePaymentsProps {
  onPageChange: (page: string) => void;
}

import { Checkbox } from "../ui/checkbox";

export function MakePayments({ onPageChange }: MakePaymentsProps) {
  const { user, students, subjects, addInvoice, schools } = useAuth();
  const [bookletsCount, setBookletsCount] = useState<number>(0);
  const [markingGuides, setMarkingGuides] = useState<{ arts: boolean; sciences: boolean }>({
    arts: false,
    sciences: false,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const markingGuideTotalCount = (markingGuides.arts ? 1 : 0) + (markingGuides.sciences ? 1 : 0);

  const toggleMarkingGuide = (type: 'arts' | 'sciences') => {
    setMarkingGuides(prev => ({ ...prev, [type]: !prev[type] }));
  };

  const currentSchool = useMemo(() => {
    return schools.find(s => s.code === user?.schoolCode);
  }, [schools, user]);

  const isFinalized = currentSchool?.registrationFinalized ?? false;

  const schoolStudents = useMemo(() => {
    return students.filter(s => 
      s.schoolCode === user?.schoolCode && 
      !s.isInvoiced &&
      (isFinalized ? s.isAdditional : !s.isAdditional)
    );
  }, [students, user, isFinalized]);

  const fullySubmittedCount = useMemo(() => {
    return schoolStudents.filter(student => isStudentFullyRegistered(student, subjects)).length;
  }, [schoolStudents, subjects]);

  const pricing = {
    registration: 500000,
    student: 27000,
    booklet: 25000,
    markingGuide: 25000,
  };

  const totals = useMemo(() => {
    const registrationTotal = isFinalized ? 0 : pricing.registration;
    const studentTotal = fullySubmittedCount * pricing.student;
    const bookletTotal = bookletsCount * pricing.booklet;
    const markingGuideTotal = markingGuideTotalCount * pricing.markingGuide;

    return {
      registration: registrationTotal,
      student: studentTotal,
      booklet: bookletTotal,
      markingGuide: markingGuideTotal,
      grandTotal: registrationTotal + studentTotal + bookletTotal + markingGuideTotal
    };
  }, [fullySubmittedCount, bookletsCount, markingGuideTotalCount, isFinalized]);

  const handleGenerateInvoice = () => {
    if (markingGuideTotalCount === 0) {
      toast.error("Selection Required", {
        description: "Please select at least one marking guide (Arts or Sciences)."
      });
      return;
    }

    setIsSubmitting(true);

    const selectedGuides = [];
    if (markingGuides.arts) selectedGuides.push("Arts");
    if (markingGuides.sciences) selectedGuides.push("Sciences");

    const items = [
      { 
        description: "School Registration Fee", 
        quantity: 1, 
        unitPrice: pricing.registration, 
        total: totals.registration,
        formula: "Fixed Amount"
      },
      { 
        description: `${isFinalized ? "Additional " : ""}Student Fee`, 
        quantity: fullySubmittedCount, 
        unitPrice: pricing.student, 
        total: totals.student,
        formula: `${pricing.student.toLocaleString()} × ${fullySubmittedCount} = ${totals.student.toLocaleString()}`
      },
      { 
        description: "Answer Booklets", 
        quantity: bookletsCount, 
        unitPrice: pricing.booklet, 
        total: totals.booklet,
        formula: `${pricing.booklet.toLocaleString()} × ${bookletsCount} = ${totals.booklet.toLocaleString()}`
      },
      { 
        description: `Marking Guide (${selectedGuides.join(" & ")})`, 
        quantity: markingGuideTotalCount, 
        unitPrice: pricing.markingGuide, 
        total: totals.markingGuide,
        formula: `${pricing.markingGuide.toLocaleString()} × ${markingGuideTotalCount} = ${totals.markingGuide.toLocaleString()}`
      },
    ].filter(item => item.total > 0 || (!isFinalized && item.description.includes("Registration")));

    const studentIds = schoolStudents
      .filter(student => isStudentFullyRegistered(student, subjects))
      .map(s => s.id);

    addInvoice({
      serialNumber: `INV-${user?.schoolCode}-${Date.now().toString().slice(-4)}`,
      schoolCode: user?.schoolCode || "",
      date: new Date().toISOString().split("T")[0],
      items,
      totalAmount: totals.grandTotal,
      status: "pending",
      type: isFinalized ? "additional" : "original"
    }, studentIds);

    toast.success("Invoice Generated", {
      description: isFinalized 
        ? "Your additional student invoice has been generated successfully."
        : "Your payment invoice has been generated successfully."
    });

    onPageChange("payment-status");
  };

  return (
    <div className="mx-auto w-full max-w-4xl space-y-6 pb-12 anim-fade-up">
      <div className="space-y-2">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">
          Step 2: {isFinalized ? "Additional Students Payment" : "Payment Generation"}
        </p>
        <h1 className="text-3xl font-bold text-slate-900">
          {isFinalized ? "Additional Payment" : "Make Payment"}
        </h1>
        <p className="text-slate-500">
          {isFinalized 
            ? "Generate an invoice for students added after finalization. Registration fee is not required."
            : "Select the items you need for this examination cycle. School registration and student fees are mandatory."
          }
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2 space-y-6">
          {/* Mandatory Fees */}
          <Card className="rounded-2xl border-slate-200 shadow-sm overflow-hidden">
            <CardHeader className="bg-slate-50/50 border-b pb-4">
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                Mandatory Fees
              </CardTitle>
              <CardDescription>
                {isFinalized 
                  ? "Calculated for additional candidates" 
                  : "Automatically calculated based on your registration"
                }
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              {!isFinalized && (
                <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-white shadow-sm flex items-center justify-center text-primary border border-slate-100">
                      <FileText className="h-5 w-5" />
                    </div>
                    <div>
                    <p className="font-bold text-slate-900">School Registration Fee</p>
                    <p className="text-xs text-slate-500">Fixed annual registration amount</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-slate-900">{pricing.registration.toLocaleString()} UGX</p>
                  <p className="text-[10px] font-bold text-slate-400">FIXED AMOUNT</p>
                </div>
              </div>
            )}

            <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-100">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-white shadow-sm flex items-center justify-center text-primary border border-slate-100">
                  <BookOpen className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-bold text-slate-900">{isFinalized ? "Additional " : ""}Student Fee</p>
                  <p className="text-xs text-slate-500">{pricing.student.toLocaleString()} × {fullySubmittedCount} candidates</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-bold text-slate-900">{totals.student.toLocaleString()} UGX</p>
                <Badge variant="outline" className="text-[10px] uppercase font-black tracking-widest bg-blue-50 text-blue-700 border-blue-100">Mandatory</Badge>
              </div>
            </div>

              {fullySubmittedCount === 0 && (
                <Alert variant="warning" className="bg-amber-50 border-amber-200 text-amber-800 rounded-xl">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="text-xs font-medium">
                    No fully submitted {isFinalized ? "additional " : ""}candidates found. Student fees will be 0 UGX. 
                    Ensure candidates have all compulsory subjects selected.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          {/* Optional Items */}
          <Card className="rounded-2xl border-slate-200 shadow-sm overflow-hidden">
            <CardHeader className="bg-slate-50/50 border-b pb-4">
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <Calculator className="h-5 w-5 text-blue-600" />
                Additional Items
              </CardTitle>
              <CardDescription>Select booklets and marking guides</CardDescription>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              <div className="space-y-3">
                <Label className="text-sm font-bold text-slate-700">Answer Booklets (25,000 UGX per booklet)</Label>
                <div className="flex items-center gap-4">
                  <Input 
                    type="number" 
                    min="0" 
                    value={bookletsCount} 
                    onChange={(e) => setBookletsCount(parseInt(e.target.value) || 0)}
                    className="max-w-[120px] rounded-xl font-bold"
                  />
                  <p className="text-sm text-slate-500 font-medium">= {pricing.booklet.toLocaleString()} × {bookletsCount} = {totals.booklet.toLocaleString()} UGX</p>
                </div>
              </div>

              <div className="space-y-4 border-t pt-6">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-bold text-slate-700">Marking Guide (25,000 UGX per selection) <span className="text-red-500">*</span></Label>
                  {markingGuideTotalCount === 0 && <Badge variant="destructive" className="text-[10px]">REQUIRED</Badge>}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div 
                    className={`flex items-center space-x-3 p-4 rounded-xl border-2 transition-all cursor-pointer ${markingGuides.arts ? 'border-primary bg-primary/5 shadow-sm' : 'border-slate-100 hover:border-slate-200'}`} 
                    onClick={() => toggleMarkingGuide('arts')}
                  >
                    <Checkbox checked={markingGuides.arts} onCheckedChange={() => toggleMarkingGuide('arts')} id="arts" />
                    <div>
                      <Label htmlFor="arts" className="font-bold cursor-pointer">Arts</Label>
                      <p className="text-[10px] text-slate-400 font-bold uppercase">{pricing.markingGuide.toLocaleString()} × 1</p>
                    </div>
                  </div>
                  <div 
                    className={`flex items-center space-x-3 p-4 rounded-xl border-2 transition-all cursor-pointer ${markingGuides.sciences ? 'border-primary bg-primary/5 shadow-sm' : 'border-slate-100 hover:border-slate-200'}`} 
                    onClick={() => toggleMarkingGuide('sciences')}
                  >
                    <Checkbox checked={markingGuides.sciences} onCheckedChange={() => toggleMarkingGuide('sciences')} id="sciences" />
                    <div>
                      <Label htmlFor="sciences" className="font-bold cursor-pointer">Sciences</Label>
                      <p className="text-[10px] text-slate-400 font-bold uppercase">{pricing.markingGuide.toLocaleString()} × 1</p>
                    </div>
                  </div>
                </div>
                <p className="text-xs text-slate-500 italic">You must select at least one marking guide to proceed. You can select both if needed.</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Payment Summary Sticky */}
        <div className="md:col-span-1">
          <Card className="rounded-2xl border-slate-200 shadow-lg sticky top-6 overflow-hidden">
            <CardHeader className="bg-slate-900 text-white pb-6">
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Payment Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="p-5 space-y-4">
                <div className="flex justify-between text-sm">
                  <div className="flex flex-col">
                    <span className="text-slate-500 font-bold uppercase text-[10px] tracking-wider">Registration Fee</span>
                    <span className="text-[11px] text-slate-400 font-bold italic">Fixed Amount</span>
                  </div>
                  <span className="font-bold text-slate-900">{totals.registration.toLocaleString()} UGX</span>
                </div>
                <div className="flex justify-between text-sm">
                  <div className="flex flex-col">
                    <span className="text-slate-500 font-bold uppercase text-[10px] tracking-wider">Student Fee</span>
                    <span className="text-[11px] text-slate-400 font-bold italic">{pricing.student.toLocaleString()} × {fullySubmittedCount}</span>
                  </div>
                  <span className="font-bold text-slate-900">{totals.student.toLocaleString()} UGX</span>
                </div>
                <div className="flex justify-between text-sm">
                  <div className="flex flex-col">
                    <span className="text-slate-500 font-bold uppercase text-[10px] tracking-wider">Answer Booklets</span>
                    <span className="text-[11px] text-slate-400 font-bold italic">{pricing.booklet.toLocaleString()} × {bookletsCount}</span>
                  </div>
                  <span className="font-bold text-slate-900">{totals.booklet.toLocaleString()} UGX</span>
                </div>
                <div className="flex justify-between text-sm">
                  <div className="flex flex-col">
                    <span className="text-slate-500 font-bold uppercase text-[10px] tracking-wider">Marking Guide</span>
                    <span className="text-[11px] text-slate-400 font-bold italic">{markingGuideTotalCount > 0 ? `${pricing.markingGuide.toLocaleString()} × ${markingGuideTotalCount}` : "Not Selected"}</span>
                  </div>
                  <span className="font-bold text-slate-900">{totals.markingGuide.toLocaleString()} UGX</span>
                </div>
                
                <div className="border-t pt-4 mt-4">
                  <div className="flex justify-between items-end">
                    <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Total Payable</span>
                    <div className="text-right">
                      <p className="text-2xl font-black text-slate-900">{totals.grandTotal.toLocaleString()}</p>
                      <p className="text-[10px] font-bold text-slate-400">UGANDAN SHILLINGS</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-5 bg-slate-50 border-t space-y-3">
                <Button 
                  className="w-full h-12 rounded-xl font-bold text-base shadow-md"
                  disabled={markingGuideTotalCount === 0 || isSubmitting}
                  onClick={handleGenerateInvoice}
                >
                  Generate Invoice
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
                <Button 
                  variant="ghost" 
                  className="w-full text-slate-500 font-bold"
                  onClick={() => onPageChange("payment-status")}
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
