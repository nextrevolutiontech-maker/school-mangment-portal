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
  const [uceMarkingGuideQuantity, setUceMarkingGuideQuantity] = useState(0);
  const [uaceArtsMarkingGuideQuantity, setUaceArtsMarkingGuideQuantity] = useState(0);
  const [uaceSciencesMarkingGuideQuantity, setUaceSciencesMarkingGuideQuantity] = useState(0);
  const [answerBookletsQuantity, setAnswerBookletsQuantity] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const currentSchool = useMemo(() => {
    return schools.find(s => s.code === user?.schoolCode);
  }, [schools, user]);

  const isUceFinalised = currentSchool?.uceRegistrationFinalised ?? false;
  const isUaceFinalised = currentSchool?.uaceRegistrationFinalised ?? false;
  const isLevelFinalised = paymentLevel === "UCE" ? isUceFinalised : isUaceFinalised;
  const hasAnyLevelFinalised = isUceFinalised || isUaceFinalised;

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
      (isLevelFinalised ? s.isAdditional : !s.isAdditional)
    );
  }, [students, user, paymentLevel, isLevelFinalised]);

  const studentCount = useMemo(() => {
    return schoolStudents.length;
  }, [schoolStudents]);

  const pricing = {
    registration: 500000,
    student: 27000,
    uceMarkingGuide: 35000,
    uaceMarkingGuide: 25000,
    answerBooklet: 25000,
  };

  const totals = useMemo(() => {
    const registrationTotal = (!hasAnyLevelFinalised && !isLevelFinalised && !hasRegistrationInvoice) ? pricing.registration : 0;
    const studentTotal = studentCount * pricing.student;
    const uceMarkingGuideTotal = (paymentLevel === "UCE") ? uceMarkingGuideQuantity * pricing.uceMarkingGuide : 0;
    const uaceArtsMarkingGuideTotal = (paymentLevel === "UACE") ? uaceArtsMarkingGuideQuantity * pricing.uaceMarkingGuide : 0;
    const uaceSciencesMarkingGuideTotal = (paymentLevel === "UACE") ? uaceSciencesMarkingGuideQuantity * pricing.uaceMarkingGuide : 0;
    const answerBookletsTotal = answerBookletsQuantity * pricing.answerBooklet;

    const totalMarkingGuide = uceMarkingGuideTotal + uaceArtsMarkingGuideTotal + uaceSciencesMarkingGuideTotal;

    return {
      registration: registrationTotal,
      student: studentTotal,
      uceMarkingGuide: uceMarkingGuideTotal,
      uaceArtsMarkingGuide: uaceArtsMarkingGuideTotal,
      uaceSciencesMarkingGuide: uaceSciencesMarkingGuideTotal,
      answerBooklet: answerBookletsTotal,
      grandTotal: registrationTotal + studentTotal + totalMarkingGuide + answerBookletsTotal
    };
  }, [studentCount, uceMarkingGuideQuantity, uaceArtsMarkingGuideQuantity, uaceSciencesMarkingGuideQuantity, answerBookletsQuantity, isLevelFinalised, hasAnyLevelFinalised, hasRegistrationInvoice, paymentLevel]);

  const handleGenerateInvoice = () => {
    if (paymentLevel === "UCE" && uceMarkingGuideQuantity === 0) {
      toast.error("Selection Required", {
        description: "Please specify quantity for UCE Marking Guide."
      });
      return;
    }
    if (paymentLevel === "UACE" && uaceArtsMarkingGuideQuantity === 0 && uaceSciencesMarkingGuideQuantity === 0) {
      toast.error("Selection Required", {
        description: "Please specify quantity for at least one UACE Marking Guide (Arts or Sciences)."
      });
      return;
    }
    if (answerBookletsQuantity === 0) {
      toast.error("Selection Required", {
        description: "Please specify quantity for Answer Booklets."
      });
      return;
    }

    setIsSubmitting(true);

    const items = [];

    if (totals.registration > 0) {
      items.push({ 
        description: "School Registration Fee", 
        quantity: 1, 
        unitPrice: pricing.registration, 
        total: totals.registration,
        formula: "Fixed Amount"
      });
    }
    
    items.push({ 
      description: `${isLevelFinalised ? "Additional " : ""}${paymentLevel} Student Fee`, 
      quantity: studentCount, 
      unitPrice: pricing.student, 
      total: totals.student,
      formula: `${pricing.student.toLocaleString()} × ${studentCount} = ${totals.student.toLocaleString()}`
    });

    if (paymentLevel === "UCE" && uceMarkingGuideQuantity > 0) {
      items.push({ 
        description: "UCE Marking Guide (All Papers)", 
        quantity: uceMarkingGuideQuantity, 
        unitPrice: pricing.uceMarkingGuide, 
        total: totals.uceMarkingGuide,
        formula: `${pricing.uceMarkingGuide.toLocaleString()} × ${uceMarkingGuideQuantity} = ${totals.uceMarkingGuide.toLocaleString()}`
      });
    } else if (paymentLevel === "UACE") {
      if (uaceArtsMarkingGuideQuantity > 0) {
        items.push({ 
          description: "UACE Arts Marking Guide", 
          quantity: uaceArtsMarkingGuideQuantity, 
          unitPrice: pricing.uaceMarkingGuide, 
          total: totals.uaceArtsMarkingGuide,
          formula: `${pricing.uaceMarkingGuide.toLocaleString()} × ${uaceArtsMarkingGuideQuantity} = ${totals.uaceArtsMarkingGuide.toLocaleString()}`
        });
      }
      if (uaceSciencesMarkingGuideQuantity > 0) {
        items.push({ 
          description: "UACE Sciences Marking Guide", 
          quantity: uaceSciencesMarkingGuideQuantity, 
          unitPrice: pricing.uaceMarkingGuide, 
          total: totals.uaceSciencesMarkingGuide,
          formula: `${pricing.uaceMarkingGuide.toLocaleString()} × ${uaceSciencesMarkingGuideQuantity} = ${totals.uaceSciencesMarkingGuide.toLocaleString()}`
        });
      }
    }

    if (answerBookletsQuantity > 0) {
      items.push({ 
        description: "Answer Booklets", 
        quantity: answerBookletsQuantity, 
        unitPrice: pricing.answerBooklet, 
        total: totals.answerBooklet,
        formula: `${pricing.answerBooklet.toLocaleString()} × ${answerBookletsQuantity} = ${totals.answerBooklet.toLocaleString()}`
      });
    }

    const studentIds = schoolStudents.map(s => s.id);

    addInvoice({
      serialNumber: `INV-${user?.schoolCode}-${Date.now().toString().slice(-4)}`,
      schoolCode: user?.schoolCode || "",
      date: new Date().toISOString().split("T")[0],
      items,
      totalAmount: totals.grandTotal,
      status: "pending",
      type: isLevelFinalised ? "additional" : "original"
    }, studentIds);

    toast.success("Invoice Generated", {
      description: isLevelFinalised 
        ? `Your additional student invoice for ${paymentLevel} has been generated successfully.`
        : `Your payment invoice for ${paymentLevel} has been generated successfully.`
    });

    onPageChange("payment-status");
  };

  return (
    <div className="mx-auto w-full max-w-4xl space-y-6 pb-12 anim-fade-up">
      <div className="space-y-2">
        <p className="text-sm font-black uppercase tracking-[0.2em] text-blue-600">
          Registration Completion Workflow
        </p>
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">
          {isLevelFinalised ? "Marking Guide & Booklets" : "Complete Registration"}
        </h1>
        <p className="text-slate-500 font-medium">
          {isLevelFinalised 
            ? `Your ${paymentLevel} registration is finalised. Now, select your required marking guides and answer booklets to generate the final invoice.`
            : `Select the items you need for this ${paymentLevel} examination cycle. School registration and student fees are mandatory.`
          }
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3 mb-6">
        <div className={`flex flex-col gap-2 p-4 rounded-2xl border-2 transition-all ${isLevelFinalised ? "border-emerald-500 bg-emerald-50" : "border-slate-200 bg-white"}`}>
          <div className="flex items-center justify-between">
            <Badge className={isLevelFinalised ? "bg-emerald-500" : "bg-slate-200 text-slate-600"}>Step 1</Badge>
            {isLevelFinalised && <CheckCircle className="h-4 w-4 text-emerald-600" />}
          </div>
          <p className="font-bold text-sm mt-1">Finalise Entries</p>
          <p className="text-[10px] text-slate-500 font-medium">Lock student records</p>
        </div>
        <div className="flex flex-col gap-2 p-4 rounded-2xl border-2 border-blue-500 bg-blue-50">
          <Badge className="bg-blue-600">Step 2</Badge>
          <p className="font-bold text-sm mt-1">Guides & Booklets</p>
          <p className="text-[10px] text-slate-500 font-medium">Select additional materials</p>
        </div>
        <div className="flex flex-col gap-2 p-4 rounded-2xl border-2 border-slate-200 bg-white opacity-50">
          <Badge className="bg-slate-200 text-slate-600">Step 3</Badge>
          <p className="font-bold text-sm mt-1">Invoice & Payment</p>
          <p className="text-[10px] text-slate-500 font-medium">Generate and pay</p>
        </div>
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
                {isUceFinalised && <span className="text-[10px] text-emerald-600 font-bold mt-1">FINALISED (Additional Mode)</span>}
                {!isUceFinalised && <span className="text-[10px] text-blue-600 font-bold mt-1">NOT FINALISED (Original Mode)</span>}
              </Label>
            </div>
            <div>
              <RadioGroupItem value="UACE" id="uace-pay" className="peer sr-only" />
              <Label
                htmlFor="uace-pay"
                className={`flex flex-col items-center justify-between rounded-xl border-2 bg-popover p-4 hover:bg-slate-50 peer-data-[state=checked]:border-slate-900 [&:has([data-state=checked])]:border-slate-900 cursor-pointer`}
              >
                <span className="text-sm font-bold">UACE (A-Level)</span>
                {isUaceFinalised && <span className="text-[10px] text-emerald-600 font-bold mt-1">FINALISED (Additional Mode)</span>}
                {!isUaceFinalised && <span className="text-[10px] text-blue-600 font-bold mt-1">NOT FINALISED (Original Mode)</span>}
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
                {isLevelFinalised 
                  ? `Calculated for additional ${paymentLevel} candidates` 
                  : `Automatically calculated based on your ${paymentLevel} registration`
                }
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              {(!hasAnyLevelFinalised && !isLevelFinalised) && (
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
                  <p className="font-bold text-slate-900">{isLevelFinalised ? "Additional " : ""}{paymentLevel} Student Fee</p>
                  <p className="text-xs text-slate-500">{pricing.student.toLocaleString()} × {studentCount} candidates</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-bold text-slate-900">{totals.student.toLocaleString()} UGX</p>
                <Badge variant="outline" className="text-[10px] uppercase font-black tracking-widest bg-blue-50 text-blue-700 border-blue-100">Mandatory</Badge>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-100">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-white shadow-sm flex items-center justify-center text-primary border border-slate-100">
                  <BookOpen className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-bold text-slate-900">Answer Booklets</p>
                  <p className="text-xs text-slate-500">{pricing.answerBooklet.toLocaleString()} × {studentCount} candidates</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-bold text-slate-900">{totals.answerBooklet.toLocaleString()} UGX</p>
                <Badge variant="outline" className="text-[10px] uppercase font-black tracking-widest bg-blue-50 text-blue-700 border-blue-100">Required</Badge>
              </div>
            </div>

              {studentCount === 0 && (
                <Alert variant="warning" className="bg-amber-50 border-amber-200 text-amber-800 rounded-xl">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="text-xs font-medium">
                    No fully submitted {isLevelFinalised ? "additional " : ""}{paymentLevel} candidates found. Student fees will be 0 UGX. 
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
              <CardDescription>Select marking guides and answer booklets for your school</CardDescription>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              {paymentLevel === "UCE" && (
                <div className="space-y-4">
                  <Label className="text-sm font-bold text-slate-700">UCE Marking Guide (All Papers) <span className="text-red-500">*</span></Label>
                  <div className="flex items-center space-x-3 p-4 rounded-2xl border border-slate-200 bg-slate-50">
                    <Input
                      type="number"
                      min="0"
                      value={uceMarkingGuideQuantity}
                      onChange={(e) => setUceMarkingGuideQuantity(parseInt(e.target.value))}
                      className="w-24 text-center font-bold"
                    />
                    <span className="font-semibold text-slate-700">Quantity</span>
                    <Badge variant="secondary">Total: {totals.uceMarkingGuide.toLocaleString()} UGX</Badge>
                  </div>
                </div>
              )}

              {paymentLevel === "UACE" && (
                <div className="space-y-4">
                  <Label className="text-sm font-bold text-slate-700">UACE Marking Guides <span className="text-red-500">*</span></Label>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3 p-4 rounded-2xl border border-slate-200 bg-slate-50">
                      <Input
                        type="number"
                        min="0"
                        value={uaceArtsMarkingGuideQuantity}
                        onChange={(e) => setUaceArtsMarkingGuideQuantity(parseInt(e.target.value))}
                        className="w-24 text-center font-bold"
                      />
                      <span className="font-semibold text-slate-700">Arts Guide Quantity</span>
                      <Badge variant="secondary">Total: {totals.uaceArtsMarkingGuide.toLocaleString()} UGX</Badge>
                    </div>
                    <div className="flex items-center space-x-3 p-4 rounded-2xl border border-slate-200 bg-slate-50">
                      <Input
                        type="number"
                        min="0"
                        value={uaceSciencesMarkingGuideQuantity}
                        onChange={(e) => setUaceSciencesMarkingGuideQuantity(parseInt(e.target.value))}
                        className="w-24 text-center font-bold"
                      />
                      <span className="font-semibold text-slate-700">Sciences Guide Quantity</span>
                      <Badge variant="secondary">Total: {totals.uaceSciencesMarkingGuide.toLocaleString()} UGX</Badge>
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-4">
                <Label className="text-sm font-bold text-slate-700">Answer Booklets <span className="text-red-500">*</span></Label>
                <div className="flex items-center space-x-3 p-4 rounded-2xl border border-slate-200 bg-slate-50">
                  <Input
                    type="number"
                    min="0"
                    value={answerBookletsQuantity}
                    onChange={(e) => setAnswerBookletsQuantity(parseInt(e.target.value))}
                    className="w-24 text-center font-bold"
                  />
                  <span className="font-semibold text-slate-700">Quantity</span>
                  <Badge variant="secondary">Total: {totals.answerBooklet.toLocaleString()} UGX</Badge>
                </div>
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
                    <span className="text-[11px] text-slate-400 font-bold italic">{pricing.answerBooklet.toLocaleString()} × {answerBookletsQuantity}</span>
                  </div>
                  <span className="font-bold text-slate-900">{totals.answerBooklet.toLocaleString()} UGX</span>
                </div>
                {paymentLevel === "UCE" && uceMarkingGuideQuantity > 0 && (
                  <div className="flex justify-between text-sm">
                    <div className="flex flex-col">
                      <span className="text-slate-500 font-bold uppercase text-[10px] tracking-wider">UCE Marking Guide</span>
                      <span className="text-[11px] text-slate-400 font-bold italic">{pricing.uceMarkingGuide.toLocaleString()} × {uceMarkingGuideQuantity}</span>
                    </div>
                    <span className="font-bold text-slate-900">{totals.uceMarkingGuide.toLocaleString()} UGX</span>
                  </div>
                )}
                {paymentLevel === "UACE" && uaceArtsMarkingGuideQuantity > 0 && (
                  <div className="flex justify-between text-sm">
                    <div className="flex flex-col">
                      <span className="text-slate-500 font-bold uppercase text-[10px] tracking-wider">UACE Arts Guide</span>
                      <span className="text-[11px] text-slate-400 font-bold italic">{pricing.uaceMarkingGuide.toLocaleString()} × {uaceArtsMarkingGuideQuantity}</span>
                    </div>
                    <span className="font-bold text-slate-900">{totals.uaceArtsMarkingGuide.toLocaleString()} UGX</span>
                  </div>
                )}
                {paymentLevel === "UACE" && uaceSciencesMarkingGuideQuantity > 0 && (
                  <div className="flex justify-between text-sm">
                    <div className="flex flex-col">
                      <span className="text-slate-500 font-bold uppercase text-[10px] tracking-wider">UACE Sciences Guide</span>
                      <span className="text-[11px] text-slate-400 font-bold italic">{pricing.uaceMarkingGuide.toLocaleString()} × {uaceSciencesMarkingGuideQuantity}</span>
                    </div>
                    <span className="font-bold text-slate-900">{totals.uaceSciencesMarkingGuide.toLocaleString()} UGX</span>
                  </div>
                )}
                
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
                  disabled={
                    isSubmitting || 
                    (paymentLevel === "UCE" && uceMarkingGuideQuantity === 0) ||
                    (paymentLevel === "UACE" && uaceArtsMarkingGuideQuantity === 0 && uaceSciencesMarkingGuideQuantity === 0) ||
                    answerBookletsQuantity === 0
                  }
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
