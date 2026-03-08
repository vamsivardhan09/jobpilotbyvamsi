import html2pdf from "html2pdf.js";

export const generateResumePDF = async (
  element: HTMLElement,
  fileName: string
): Promise<void> => {
  const opt = {
    margin: 0,
    filename: fileName,
    image: { type: "jpeg", quality: 0.98 },
    html2canvas: { scale: 2, useCORS: true, logging: false },
    jsPDF: { unit: "mm", format: "a4", orientation: "portrait" as const },
  };

  await html2pdf().set(opt).from(element).save();
};

export const buildPDFFileName = (fullName: string, jobTitle: string): string => {
  const sanitize = (s: string) =>
    s.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");
  const name = sanitize(fullName || "resume");
  const role = sanitize(jobTitle || "optimized");
  return `${name}_${role}_resume.pdf`;
};
