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
  const { user, students, subjects, addInvoice, schools, invoices } = useAuth();
  const [paymentLevel, setPaymentLevel] = useState<"UCE" | "UACE">("UCE");
  const [markingGuides, setMarkingGuides] = useState<{ arts: boolean; sciences: boolean }>({
    arts: false,
    sciences: false,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const currentSchool = useMemo(() => {
    return schools.find(s => s.code === user?.schoolCode);
  }, [schools, user]);

  const isUceFinalized = currentSchool?.uceRegistrationFinalized ?? false;
  const isUaceFinalized = currentSchool?.uaceRegistrationFinalized ?? false;
  const isLevelFinalized = paymentLevel === "UCE" ? isUceFinalized : isUaceFinalized;
  const hasAnyLevelFinalized = isUceFinalized || isUaceFinalized;

  const hasRegistrationInvoice = useMemo(() => {
    return invoices.some(inv => 
      inv.schoolCode === user?.schoolCode && 
      inv.items.some(item => item.description === "School Registration Fee")
    );
  }, [invoices, user]);

  const schoolStudents = useMemo(() => {
    return students.filter(s => 
      s.schoolCode === user?.schoolCode && 
      s.examLevel === paymentLevel &&
      !s.isInvoiced &&
      (isLevelFinalized ? s.isAdditional : !s.isAdditional)
    );
  }, [students, user, paymentLevel, isLevelFinalized]);

  const studentCount = useMemo(() => {
    return schoolStudents.length;
  }, [schoolStudents]);

  const markingGuideTotalCount = (markingGuides.arts ? 1 : 0) + (markingGuides.sciences ? 1 : 0);

  const toggleMarkingGuide = (type: 'arts' | 'sciences') => {
    setMarkingGuides(prev => ({ ...prev, [type]: !prev[type] }));
  };

  const pricing = {
    registration: 500000,
    student: 27000,
    booklets: 25000,
    markingGuide: 25000,
  };

  const totals = useMemo(() => {
    const registrationTotal = (!hasAnyLevelFinalized && !isLevelFinalized && !hasRegistrationInvoice) ? pricing.registration : 0;
    const studentTotal = studentCount * pricing.student;
    const bookletsTotal = studentCount * pricing.booklets;
    const markingGuideTotal = markingGuideTotalCount * pricing.markingGuide;

    return {
      registration: registrationTotal,
      student: studentTotal,
      booklets: bookletsTotal,
      markingGuide: markingGuideTotal,
      grandTotal: registrationTotal + studentTotal + bookletsTotal + markingGuideTotal
    };
  }, [studentCount, markingGuideTotalCount, isLevelFinalized, hasAnyLevelFinalized, hasRegistrationInvoice]);

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
        description: `${isLevelFinalized ? "Additional " : ""}${paymentLevel} Student Fee`, 
        quantity: studentCount, 
        unitPrice: pricing.student, 
        total: totals.student,
        formula: `${pricing.student.toLocaleString()} × ${studentCount} = ${totals.student.toLocaleString()}`
      },
      { 
        description: "Answer Booklets", 
        quantity: studentCount, 
        unitPrice: pricing.booklets, 
        total: totals.booklets,
        formula: `${pricing.booklets.toLocaleString()} × ${studentCount} = ${totals.booklets.toLocaleString()}`
      },
      { 
        description: `Marking Guide (${selectedGuides.join(" & ")})`, 
        quantity: markingGuideTotalCount, 
        unitPrice: pricing.markingGuide, 
        total: totals.markingGuide,
        formula: `${pricing.markingGuide.toLocaleString()} × ${markingGuideTotalCount} = ${totals.markingGuide.toLocaleString()}`
      },
    ].filter(item => item.total > 0 || (!isLevelFinalized && !hasAnyLevelFinalized && !hasRegistrationInvoice && item.description.includes("Registration")));

    const studentIds = schoolStudents.map(s => s.id);

    addInvoice({
      serialNumber: `INV-${user?.schoolCode}-${Date.now().toString().slice(-4)}`,
      schoolCode: user?.schoolCode || "",
      date: new Date().toISOString().split("T")[0],
      items,
      totalAmount: totals.grandTotal,
      status: "pending",
      type: isLevelFinalized ? "additional" : "original"
    }, studentIds);

    toast.success("Invoice Generated", {
      description: isLevelFinalized 
        ? `Your additional student invoice for ${paymentLevel} has been generated successfully.`
        : `Your payment invoice for ${paymentLevel} has been generated successfully.`
    });

    onPageChange("payment-status");
  };

  return (
    <div className="mx-auto w-full max-w-4xl space-y-6 pb-12 anim-fade-up">
      <div className="space-y-2">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">
          Step 2: {isLevelFinalized ? "Additional Students Payment" : "Payment Generation"}
        </p>
        <h1 className="text-3xl font-bold text-slate-900">
          {isLevelFinalized ? "Additional Payment" : "Make Payment"}
        </h1>
        <p className="text-slate-500">
          {isLevelFinalized 
            ? `Generate an invoice for ${paymentLevel} students added after finalization. Registration fee is not required.`
            : `Select the items you need for this ${paymentLevel} examination cycle. School registration and student fees are mandatory.`
          }
        </p>
      </div>

      {/* Level Selection */}
      <Card className="rounded-2xl border-slate-200 shadow-sm overflow-hidden mb-6">
        <CardHeader className="bg-slate-50/50 border-b pb-4">
          <CardTitle className="text-lg font-bold flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-blue-600" />
            Select Examination Level
          </CardTitle>
          <CardDescription>Choose the level you want to make payments for</CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <RadioGroup 
            value={paymentLevel} 
            onValueChange={(value: "UCE" | "UACE") => setPaymentLevel(value)}
            className="grid grid-cols-2 gap-4"
          >
            <div>
              <RadioGroupItem value="UCE" id="uce-pay" className="peer sr-only" />
              <Label
                htmlFor="uce-pay"
                className={`flex flex-col items-center justify-between rounded-xl border-2 bg-popover p-4 hover:bg-slate-50 peer-data-[state=checked]:border-slate-900 [&:has([data-state=checked])]:border-slate-900 cursor-pointer`}
              >
                <span className="text-sm font-bold">UCE (O-Level)</span>
                {isUceFinalized && <span className="text-[10px] text-emerald-600 font-bold mt-1">FINALIZED (Additional Mode)</span>}
                {!isUceFinalized && <span className="text-[10px] text-blue-600 font-bold mt-1">NOT FINALIZED (Original Mode)</span>}
              </Label>
            </div>
            <div>
              <RadioGroupItem value="UACE" id="uace-pay" className="peer sr-only" />
              <Label
                htmlFor="uace-pay"
                className={`flex flex-col items-center justify-between rounded-xl border-2 bg-popover p-4 hover:bg-slate-50 peer-data-[state=checked]:border-slate-900 [&:has([data-state=checked])]:border-slate-900 cursor-pointer`}
              >
                <span className="text-sm font-bold">UACE (A-Level)</span>
                {isUaceFinalized && <span className="text-[10px] text-emerald-600 font-bold mt-1">FINALIZED (Additional Mode)</span>}
                {!isUaceFinalized && <span className="text-[10px] text-blue-600 font-bold mt-1">NOT FINALIZED (Original Mode)</span>}
              </Label>
            </div>
          </RadioGroup>
        </CardContent>
      </Card>

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
                {isLevelFinalized 
                  ? `Calculated for additional ${paymentLevel} candidates` 
                  : `Automatically calculated based on your ${paymentLevel} registration`
                }
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              {(!hasAnyLevelFinalized && !isLevelFinalized) && (
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
                  <p className="font-bold text-slate-900">{isLevelFinalized ? "Additional " : ""}{paymentLevel} Student Fee</p>
                  <p className="text-xs text-slate-500">{pricing.student.toLocaleString()} × {studentCount} candidates</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-bold text-slate-900">{totals.student.toLocaleString()} UGX</p>
                <Badge variant="outline" className="text-[10px] uppercase font-black tracking-widest bg-blue-50 text-blue-700 border-blue-100">Mandatory</Badge>
              </div>
            </div>

              {studentCount === 0 && (
                <Alert variant="warning" className="bg-amber-50 border-amber-200 text-amber-800 rounded-xl">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="text-xs font-medium">
                    No fully submitted {isLevelFinalized ? "additional " : ""}{paymentLevel} candidates found. Student fees will be 0 UGX. 
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
              <CardDescription>Select marking guides for your school</CardDescription>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-bold text-slate-700">Select Marking Guide (25,000 UGX each) <span className="text-red-500">*</span></Label>
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
                    <span className="text-[11px] text-slate-400 font-bold italic">{pricing.student.toLocaleString()} × {studentCount}</span>
                  </div>
                  <span className="font-bold text-slate-900">{totals.student.toLocaleString()} UGX</span>
                </div>
                <div className="flex justify-between text-sm">
                  <div className="flex flex-col">
                    <span className="text-slate-500 font-bold uppercase text-[10px] tracking-wider">Answer Booklets</span>
                    <span className="text-[11px] text-slate-400 font-bold italic">{pricing.booklets.toLocaleString()} × {studentCount}</span>
                  </div>
                  <span className="font-bold text-slate-900">{totals.booklets.toLocaleString()} UGX</span>
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
