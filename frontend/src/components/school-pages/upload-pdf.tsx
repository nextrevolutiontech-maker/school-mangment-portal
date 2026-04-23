import { useEffect, useMemo, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { Button } from "../ui/button";
import { Label } from "../ui/label";
import { Badge } from "../ui/badge";
import {
  Upload,
  FileText,
  Download,
  CheckCircle,
  AlertCircle,
  MailCheck,
} from "lucide-react";
import { useAuth } from "../auth-context";
import { Alert, AlertDescription, AlertTitle } from "../ui/alert";
import { toast } from "sonner";
import { Progress } from "../ui/progress";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

interface UploadPDFProps {
  onPageChange: (page: string) => void;
}

export function UploadPDF({ onPageChange }: UploadPDFProps) {
  const { user, students, submitSchoolDocuments } = useAuth();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [documentsSubmitted, setDocumentsSubmitted] = useState(
    user?.status === "payment_submitted" ||
      user?.status === "verified" ||
      user?.status === "active",
  );
  const [uploadedFiles, setUploadedFiles] = useState<
    Array<{
      name: string;
      date: string;
      status: "pending" | "verified";
    }>
  >(() => {
    if (
      user?.status === "payment_submitted" ||
      user?.status === "verified" ||
      user?.status === "active"
    ) {
      return [
        {
          name: `signed-form-${user.schoolCode?.toLowerCase()}.pdf`,
          date: "2026-04-12",
          status:
            user?.status === "verified" || user?.status === "active"
              ? "verified"
              : "pending",
        },
      ];
    }

    return [];
  });

  useEffect(() => {
    const isSubmitted =
      user?.status === "payment_submitted" ||
      user?.status === "verified" ||
      user?.status === "active";

    setDocumentsSubmitted(Boolean(isSubmitted));

    if (user?.status === "verified" || user?.status === "active") {
      setUploadedFiles((prevFiles) =>
        prevFiles.map((file) => ({ ...file, status: "verified" })),
      );
    }
  }, [user?.status]);

  const currentStatusMessage = useMemo(() => {
    if (user?.status === "active") {
      return {
        title: "Documents Verified",
        description:
          "Your signed summary form and payment proof have been verified. Your school account is active for the 2026 cycle.",
        badge: "Active",
      };
    }

    if (user?.status === "verified") {
      return {
        title: "Verification Completed",
        description:
          "Your uploaded documents have been confirmed. Final activation details are being finalized by the WAKISSHA admin team.",
        badge: "Verified",
      };
    }

    return {
      title: "Documents Submitted. Awaiting Admin Verification.",
      description:
        "Your signed summary form and payment proof have been received. The admin team will verify the documents before activation.",
      badge: "Payment Submitted",
    };
  }, [user?.status]);

  const schoolEntriesSummary = useMemo(() => {
    const schoolStudents = students.filter(
      (student) => student.schoolCode === user?.schoolCode,
    );
    const uniqueSubjects = new Set(
      schoolStudents.flatMap((student) =>
        (student.subjects ?? []).map((subject) => `${student.examLevel}:${subject.subjectCode}`),
      ),
    );

    return {
      totalStudents: schoolStudents.length,
      totalSubjects: uniqueSubjects.size,
      totalEntries: schoolStudents.reduce(
        (sum, student) => sum + (student.totalEntries ?? 0),
        0,
      ),
    };
  }, [students, user?.schoolCode]);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (file) {
      if (file.type === "application/pdf") {
        setSelectedFile(file);
      } else {
        toast.error("Invalid File Type", {
          description: "Please select a PDF file",
        });
      }
    }
  };

  const handleUpload = () => {
    if (!selectedFile || !user?.schoolCode) return;

    setIsUploading(true);
    setUploadProgress(0);

    const interval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsUploading(false);
          setDocumentsSubmitted(true);
          submitSchoolDocuments(user.schoolCode);

          setUploadedFiles((prevFiles) => [
            {
              name: selectedFile.name,
              date: new Date().toISOString().split("T")[0],
              status: "pending",
            },
            ...prevFiles,
          ]);

          setSelectedFile(null);

          toast.success("Upload Successful", {
            description: "Documents submitted. Awaiting admin verification.",
          });
          toast.success("Confirmation email sent to school and admin.");

          return 100;
        }

        return prev + 10;
      });
    }, 180);
  };

  const handleGeneratePDF = async () => {
    try {
      setIsGeneratingPDF(true);
      const pdf = new jsPDF();
      const pageWidth = pdf.internal.pageSize.getWidth();
      let yPos = 15;

      // Header
      pdf.setFontSize(16);
      pdf.text("WAKISSHA Summary Form", pageWidth / 2, yPos, {
        align: "center",
      });
      yPos += 8;

      // School Details
      pdf.setFontSize(11);
      pdf.text(`School: ${user?.name}`, 15, yPos);
      yPos += 6;
      pdf.setFontSize(10);
      pdf.text(`School Code: ${user?.schoolCode}`, 15, yPos);
      yPos += 5;
      pdf.text(`District: ${user?.district}`, 15, yPos);
      yPos += 5;
      pdf.text(`Academic Year: ${user?.academicYear}`, 15, yPos);
      yPos += 8;

      // Student Summary Table
      const studentTableData = [
        ["Total Enrolled Students", String(schoolEntriesSummary.totalStudents)],
        ["Subjects Registered", String(schoolEntriesSummary.totalSubjects)],
        ["Total Entries", String(schoolEntriesSummary.totalEntries)],
        ["Payment Status", user?.status?.toUpperCase() || "PENDING"],
      ];

      autoTable(pdf, {
        head: [["Description", "Value"]],
        body: studentTableData,
        startY: yPos,
        margin: { left: 15, right: 15 },
        headStyles: {
          fillColor: [220, 38, 38],
          textColor: [255, 255, 255],
          fontSize: 10,
          fontStyle: "bold",
        },
        bodyStyles: {
          fontSize: 9,
        },
      });

      yPos = (pdf as any).lastAutoTable.finalY + 10;

      // Instructions
      pdf.setFontSize(11);
      pdf.setFont(undefined, "bold");
      pdf.text("Instructions for Signing:", 15, yPos);
      yPos += 6;
      pdf.setFontSize(9);
      pdf.setFont(undefined, "normal");

      const instructions = [
        "1. Print this form on official school letterhead",
        "2. Sign at the designated area using authorized signature",
        "3. Apply the official school stamp/seal",
        "4. Attach payment proof as supporting document",
        "5. Scan all documents as a single PDF file",
        "6. Upload the scanned PDF via the portal",
      ];

      instructions.forEach((instruction) => {
        pdf.text(instruction, 15, yPos);
        yPos += 5;
      });

      yPos += 5;
      pdf.setFontSize(8);
      pdf.text(`Generated on: ${new Date().toLocaleString()}`, 15, yPos);
      pdf.text("Please review all details before signing.", 15, yPos + 4);

      pdf.save(`summary-form-${user?.schoolCode}.pdf`);
      toast.success("Summary form generated successfully");
    } catch (error) {
      toast.error("Failed to generate PDF");
      console.error(error);
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const steps = [
    "Download the filled summary form PDF",
    "Print the form and sign it with the authorized signature",
    "Apply the official school stamp and attach payment proof",
    "Scan the signed document as a PDF file",
    "Upload the signed PDF to submit it for admin verification",
  ];

  return (
    <div className="flex flex-col w-full gap-6">
      <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-2">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-orange-400">
            Signed Form Workflow
          </p>
          <h1 className="text-3xl font-bold text-slate-900">Upload Signed PDF</h1>
          <p className="max-w-2xl text-slate-500">
            Download your filled summary form, sign and stamp it, then upload the
            signed PDF for final review.
          </p>
        </div>
        {!documentsSubmitted && (
          <Button
            className="w-full lg:w-auto"
            onClick={handleUpload}
            disabled={!selectedFile || isUploading}
          >
            <Upload className="h-4 w-4" />
            {isUploading ? "Uploading..." : "Upload Signed PDF"}
          </Button>
        )}
      </div>

      <Alert variant="info">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Important Instructions</AlertTitle>
        <AlertDescription>
          <ol className="mt-2 list-decimal list-inside space-y-1 text-sm">
            {steps.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
        </AlertDescription>
      </Alert>

      <div className="flex flex-col w-full gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-slate-900">
              Step 1: Download Summary
            </CardTitle>
            <CardDescription className="text-slate-500">
              Download the filled PDF that summarizes your student entries
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                  Total Students
                </p>
                <p className="mt-2 text-2xl font-bold text-slate-900">
                  {schoolEntriesSummary.totalStudents}
                </p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                  Subjects Registered
                </p>
                <p className="mt-2 text-2xl font-bold text-slate-900">
                  {schoolEntriesSummary.totalSubjects}
                </p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                  Total Entries
                </p>
                <p className="mt-2 text-2xl font-bold text-slate-900">
                  {schoolEntriesSummary.totalEntries}
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-4 rounded-2xl bg-white shadow-sm border border-slate-200 p-5 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-600/15 text-orange-400">
                  <FileText className="h-6 w-6" />
                </div>
                <div>
                  <p className="font-semibold text-slate-900">WAKISSHA Summary Form</p>
                  <p className="text-sm text-slate-500">
                    School: {user?.name} ({user?.schoolCode})
                  </p>
                  <p className="text-sm text-slate-500">
                    Download, sign, stamp, and upload for approval
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                onClick={handleGeneratePDF}
                disabled={isGeneratingPDF}
                className="w-full lg:w-auto"
              >
                <Download className="h-4 w-4" />
                {isGeneratingPDF ? "Generating..." : "Download PDF"}
              </Button>
            </div>

            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
              <p className="text-sm text-slate-500">
                <strong className="text-slate-900">Note:</strong> Review student
                details, subject choices, and payment summary carefully before
                signing the final form.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-slate-900">
              Step 2: Upload Signed PDF
            </CardTitle>
            <CardDescription className="text-slate-500">
              Upload the signed summary form and payment proof for verification
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {documentsSubmitted ? (
              <div className="space-y-4 rounded-2xl border border-green-200 bg-green-50 p-5">
                <div className="flex items-start gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-green-100 text-green-700">
                    <CheckCircle className="h-6 w-6" />
                  </div>
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold text-green-900">
                        {currentStatusMessage.title}
                      </p>
                      <Badge
                        variant={
                          user?.status === "active"
                            ? "success"
                            : user?.status === "verified"
                              ? "info"
                              : "payment"
                        }
                      >
                        {currentStatusMessage.badge}
                      </Badge>
                    </div>
                    <p className="text-sm leading-6 text-slate-500">
                      {currentStatusMessage.description}
                    </p>
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
                  <div className="flex items-center gap-2 text-slate-900">
                    <MailCheck className="h-4 w-4 text-orange-400" />
                    Confirmation email workflow simulated
                  </div>
                  <p className="mt-2 text-slate-500">
                    Email notices have been simulated for both the school and
                    the WAKISSHA admin team.
                  </p>
                </div>
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  <Label htmlFor="pdf-upload">Select Signed PDF</Label>
                  <div className="rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 p-8 text-center transition-colors hover:border-red-500/30">
                    <input
                      id="pdf-upload"
                      type="file"
                      accept=".pdf"
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                    <label
                      htmlFor="pdf-upload"
                      className="flex cursor-pointer flex-col items-center space-y-3"
                    >
                      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-600/12 text-orange-400">
                        <Upload className="h-7 w-7" />
                      </div>
                      <div>
                        <p className="font-semibold text-slate-900">
                          {selectedFile
                            ? selectedFile.name
                            : "Click to upload your signed PDF"}
                        </p>
                        <p className="mt-1 text-sm text-slate-500">
                          PDF only, max 5MB
                        </p>
                      </div>
                    </label>
                  </div>
                </div>

                {selectedFile && !isUploading && (
                  <div className="flex flex-col gap-4 rounded-2xl border border-orange-200 bg-orange-50 p-4 lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex items-center gap-3">
                      <FileText className="h-5 w-5 text-orange-400" />
                      <div>
                        <p className="font-semibold text-slate-900">
                          {selectedFile.name}
                        </p>
                        <p className="text-xs text-slate-500">
                          {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                    </div>
                    <Button onClick={handleUpload}>
                      <Upload className="h-4 w-4" />
                      Upload Signed PDF
                    </Button>
                  </div>
                )}

                {isUploading && (
                  <div className="space-y-2 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">Uploading documents...</span>
                      <span className="font-semibold text-slate-900">
                        {uploadProgress}%
                      </span>
                    </div>
                    <Progress value={uploadProgress} className="h-2.5" />
                  </div>
                )}

                <div className="rounded-2xl border border-amber-500/25 bg-amber-500/10 p-4">
                  <p className="text-sm text-slate-500">
                    <strong className="text-slate-900">Important:</strong> Ensure the
                    upload is clear and legible. Blurry or incomplete documents
                    may be returned for correction.
                  </p>
                </div>

                <div className="flex justify-end">
                  <Button
                    className="w-full lg:w-auto"
                    onClick={handleUpload}
                    disabled={!selectedFile || isUploading}
                  >
                    <Upload className="h-4 w-4" />
                    {isUploading ? "Uploading..." : "Upload Signed PDF"}
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="border-b border-slate-200">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
            <CardTitle className="text-slate-900">Upload History</CardTitle>
              <CardDescription>
                Previously submitted files and current verification status
              </CardDescription>
            </div>
            <Button
              variant="outline"
              onClick={() => onPageChange("payment-status")}
            >
              Back to Payment Status
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          {uploadedFiles.length > 0 ? (
            <div className="space-y-3">
              {uploadedFiles.map((file, index) => (
                <div
                  key={`${file.name}-${index}`}
                  className="bg-white shadow-sm border border-slate-200 rounded-2xl flex flex-col gap-4 p-4 lg:flex-row lg:items-center lg:justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/15 text-blue-400">
                      <FileText className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900">{file.name}</p>
                      <p className="text-xs text-slate-500">
                        Uploaded on {new Date(file.date).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  {file.status === "verified" ? (
                    <Badge variant="success">
                      <CheckCircle className="h-3 w-3" />
                      Verified
                    </Badge>
                  ) : (
                    <Badge variant="payment">
                      <AlertCircle className="h-3 w-3" />
                      Awaiting Verification
                    </Badge>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="py-10 text-center text-slate-500">
              <FileText className="mx-auto mb-3 h-12 w-12 opacity-50" />
              <p>No files uploaded yet</p>
            </div>
          )}
        </CardContent>
      </Card>

      {documentsSubmitted && (
        <Alert variant={user?.status === "active" ? "success" : "info"}>
          <CheckCircle className="h-4 w-4" />
          <AlertTitle>{currentStatusMessage.title}</AlertTitle>
          <AlertDescription>{currentStatusMessage.description}</AlertDescription>
        </Alert>
      )}
    </div>
  );
}




