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

interface UploadPDFProps {
  onPageChange: (page: string) => void;
}

export function UploadPDF({ onPageChange }: UploadPDFProps) {
  const { user, submitSchoolDocuments } = useAuth();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
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

  const handleGeneratePDF = () => {
    toast.success("PDF Generated", {
      description: "Filled summary form is ready for printing and signing.",
    });
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
      <div className="space-y-2">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-red-400 dark:text-red-400">
          Signed Form Workflow
        </p>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Upload Signed PDF</h1>
        <p className="max-w-2xl text-slate-600 dark:text-slate-300">
          Download your filled summary form, complete the signing process, and
          submit it together with payment confirmation for final review.
        </p>
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
            <CardTitle className="text-slate-900 dark:text-white">
              Step 1: Generate Summary Form
            </CardTitle>
            <CardDescription className="text-slate-600 dark:text-slate-400">
              Download the filled PDF that summarizes your student entries
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 dark:border-[#1e1e2e] bg-white dark:bg-[#13131e] p-5 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-600/15 text-red-400">
                  <FileText className="h-6 w-6" />
                </div>
                <div>
                  <p className="font-semibold text-slate-900 dark:text-white">WAKISSHA Summary Form</p>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    School: {user?.name} ({user?.schoolCode})
                  </p>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    Download, sign, stamp, and upload for approval
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                onClick={handleGeneratePDF}
                className="w-full lg:w-auto"
              >
                <Download className="h-4 w-4" />
                Download PDF
              </Button>
            </div>

            <div className="rounded-2xl border border-amber-200 dark:border-amber-500/25 bg-amber-50 dark:bg-amber-500/10 p-4">
              <p className="text-sm text-slate-600 dark:text-slate-300">
                <strong className="text-slate-900 dark:text-white">Note:</strong> Review student
                details, subject choices, and payment summary carefully before
                signing the final form.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-slate-900 dark:text-white">
              Step 2: Submit Signed Documents
            </CardTitle>
            <CardDescription className="text-slate-600 dark:text-slate-400">
              Upload the signed summary form and payment proof for verification
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {documentsSubmitted ? (
              <div className="space-y-4 rounded-2xl border border-green-200 dark:border-green-500/20 bg-green-50 dark:bg-green-500/10 p-5">
                <div className="flex items-start gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-green-100 dark:bg-green-500/15 text-green-700 dark:text-green-300">
                    <CheckCircle className="h-6 w-6" />
                  </div>
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold text-green-900 dark:text-white">
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
                    <p className="text-sm leading-6 text-slate-600 dark:text-slate-300">
                      {currentStatusMessage.description}
                    </p>
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 dark:border-white/8 bg-slate-50 dark:bg-[#0f172a]/40 p-4 text-sm text-slate-600 dark:text-slate-300">
                  <div className="flex items-center gap-2 text-slate-900 dark:text-white">
                    <MailCheck className="h-4 w-4 text-red-400" />
                    Confirmation email workflow simulated
                  </div>
                  <p className="mt-2 text-slate-600 dark:text-slate-400">
                    Email notices have been simulated for both the school and
                    the WAKISSHA admin team.
                  </p>
                </div>
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  <Label htmlFor="pdf-upload">Select Signed PDF</Label>
                  <div className="rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-[#13131e] p-8 text-center transition-colors hover:border-red-500/30">
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
                      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-red-600/12 text-red-400">
                        <Upload className="h-7 w-7" />
                      </div>
                      <div>
                        <p className="font-semibold text-slate-900 dark:text-white">
                          {selectedFile
                            ? selectedFile.name
                            : "Click to upload your signed PDF"}
                        </p>
                        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                          PDF only, max 5MB
                        </p>
                      </div>
                    </label>
                  </div>
                </div>

                {selectedFile && !isUploading && (
                  <div className="flex flex-col gap-4 rounded-2xl border border-red-200 dark:border-red-600/25 bg-red-50 dark:bg-red-600/10 p-4 lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex items-center gap-3">
                      <FileText className="h-5 w-5 text-red-400" />
                      <div>
                        <p className="font-semibold text-slate-900 dark:text-white">
                          {selectedFile.name}
                        </p>
                        <p className="text-xs text-slate-600 dark:text-slate-400">
                          {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                    </div>
                    <Button onClick={handleUpload}>Upload Now</Button>
                  </div>
                )}

                {isUploading && (
                  <div className="space-y-2 rounded-2xl border border-slate-200 dark:border-white/6 bg-slate-50 dark:bg-[#13131e] p-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600 dark:text-slate-400">Uploading documents...</span>
                      <span className="font-semibold text-slate-900 dark:text-white">
                        {uploadProgress}%
                      </span>
                    </div>
                    <Progress value={uploadProgress} className="h-2.5" />
                  </div>
                )}

                <div className="rounded-2xl border border-amber-500/25 bg-amber-500/10 p-4">
                  <p className="text-sm text-slate-200">
                    <strong className="text-white">Important:</strong> Ensure the
                    upload is clear and legible. Blurry or incomplete documents
                    may be returned for correction.
                  </p>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="border-b border-border/70">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <CardTitle className="text-white">Upload History</CardTitle>
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
                  className="flex flex-col gap-4 rounded-2xl border border-white/6 bg-white/[0.02] p-4 lg:flex-row lg:items-center lg:justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/15 text-blue-400">
                      <FileText className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-semibold text-white">{file.name}</p>
                      <p className="text-xs text-slate-400">
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
            <div className="py-10 text-center text-slate-400">
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
