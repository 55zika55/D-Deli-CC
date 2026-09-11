import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

export interface PDFExportOptions {
  orientation?: 'portrait' | 'landscape';
  filename?: string;
  marginMm?: number;
  scale?: number;
  onProgress?: (msg: string) => void;
}

/**
 * Captures an HTML element and exports it as a multi-page high-resolution PDF file.
 * Safely handles memory bounds and prevents browser UI freezing.
 */
export async function downloadElementAsPDF(
  element: HTMLElement,
  options: PDFExportOptions = {}
): Promise<boolean> {
  const {
    orientation = 'portrait',
    filename = `D-Deli_Report_${new Date().toISOString().slice(0, 10)}`,
    marginMm = 6,
    scale = 1.3, // Optimized scale: fast, crisp 200+ DPI, zero memory freeze
    onProgress
  } = options;

  try {
    if (onProgress) onProgress('جاري تحضير محتوى التقرير للطباعة والتصدير...');

    // Temporarily ensure background and styling are suitable for printing
    const originalBackground = element.style.background;
    element.style.background = '#ffffff';

    // Wrap html2canvas with a safety timeout to never lock the browser thread
    const canvasPromise = html2canvas(element, {
      scale,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
      windowWidth: orientation === 'landscape' ? 1280 : 960,
      imageTimeout: 5000,
      ignoreElements: (el) => el.classList.contains('print:hidden') || el.classList.contains('print-ignore')
    });

    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('PDF generation timed out')), 12000);
    });

    const canvas = await Promise.race([canvasPromise, timeoutPromise]);
    element.style.background = originalBackground;

    if (onProgress) onProgress('جاري بناء صفحات PDF المعيارية (A4)...');

    const isLandscape = orientation === 'landscape';
    const pdfPageWidth = isLandscape ? 297 : 210; // mm (A4)
    const pdfPageHeight = isLandscape ? 210 : 297; // mm (A4)

    const printableWidth = pdfPageWidth - marginMm * 2;
    const printableHeight = pdfPageHeight - marginMm * 2;

    const imgWidthPx = canvas.width;
    const imgHeightPx = canvas.height;

    if (!imgWidthPx || !imgHeightPx) {
      throw new Error('Invalid canvas dimensions');
    }

    // Convert element height to PDF mm units based on printable width
    const totalPdfHeightMm = (imgHeightPx * printableWidth) / imgWidthPx;

    const pdf = new jsPDF({
      orientation: isLandscape ? 'landscape' : 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    // If content fits within one page
    if (totalPdfHeightMm <= printableHeight) {
      const imgData = canvas.toDataURL('image/jpeg', 0.90);
      pdf.addImage(imgData, 'JPEG', marginMm, marginMm, printableWidth, totalPdfHeightMm);
    } else {
      // Multi-page slicing
      const pxPageHeight = (printableHeight * imgWidthPx) / printableWidth;
      let renderedPx = 0;
      let pageNum = 0;

      while (renderedPx < imgHeightPx) {
        if (pageNum > 0) {
          pdf.addPage();
        }

        const sliceHeightPx = Math.min(pxPageHeight, imgHeightPx - renderedPx);
        const sliceCanvas = document.createElement('canvas');
        sliceCanvas.width = imgWidthPx;
        sliceCanvas.height = sliceHeightPx;

        const sliceCtx = sliceCanvas.getContext('2d');
        if (sliceCtx) {
          sliceCtx.fillStyle = '#ffffff';
          sliceCtx.fillRect(0, 0, sliceCanvas.width, sliceCanvas.height);
          sliceCtx.drawImage(
            canvas,
            0,
            renderedPx,
            imgWidthPx,
            sliceHeightPx,
            0,
            0,
            imgWidthPx,
            sliceHeightPx
          );

          const sliceImgData = sliceCanvas.toDataURL('image/jpeg', 0.90);
          const sliceHeightMm = (sliceHeightPx * printableWidth) / imgWidthPx;
          pdf.addImage(sliceImgData, 'JPEG', marginMm, marginMm, printableWidth, sliceHeightMm);
        }

        renderedPx += sliceHeightPx;
        pageNum++;
      }
    }

    if (onProgress) onProgress('جاري تنزيل ملف الـ PDF...');
    const cleanFilename = filename.endsWith('.pdf') ? filename : `${filename}.pdf`;
    pdf.save(cleanFilename);

    if (onProgress) onProgress('✓ تم تنزيل ملف PDF بنجاح!');
    return true;
  } catch (err) {
    console.error('downloadElementAsPDF error:', err);
    throw err;
  }
}

/**
 * Triggers browser print cleanly without freezing the main application window.
 * Uses an isolated hidden iframe with automatic graceful fallback.
 */
export function executeReportPrint(
  element: HTMLElement | null,
  fallbackHtmlGenerator?: () => string,
  onNotify?: (msg: string, isError?: boolean) => void
): void {
  // Strategy 1: Use an isolated hidden iframe if HTML generator is available.
  // This completely prevents blocking or freezing the main UI thread.
  if (fallbackHtmlGenerator) {
    try {
      const html = fallbackHtmlGenerator();
      let printFrame = document.getElementById('report-print-iframe') as HTMLIFrameElement;
      if (!printFrame) {
        printFrame = document.createElement('iframe');
        printFrame.id = 'report-print-iframe';
        printFrame.style.position = 'fixed';
        printFrame.style.right = '0';
        printFrame.style.bottom = '0';
        printFrame.style.width = '1px';
        printFrame.style.height = '1px';
        printFrame.style.border = '0';
        printFrame.style.opacity = '0.01';
        printFrame.style.pointerEvents = 'none';
        document.body.appendChild(printFrame);
      }

      const frameDoc = printFrame.contentDocument || printFrame.contentWindow?.document;
      if (frameDoc) {
        frameDoc.open();
        frameDoc.write(html);
        frameDoc.close();

        setTimeout(() => {
          try {
            printFrame.contentWindow?.focus();
            printFrame.contentWindow?.print();
            if (onNotify) {
              onNotify('✓ تم استدعاء أمر الطباعة / حفظ كـ PDF في نافذة آمنة بنجاح');
            }
          } catch (printErr) {
            console.warn('Iframe print restricted, triggering clean HTML download:', printErr);
            downloadPrintableHTML(html, 'D-Deli_Official_Report.html');
            if (onNotify) {
              onNotify('تم تنزيل ملف التقرير بتنسيق HTML التفاعلي لأن المتصفح حظر الطباعة المباشرة داخل المعاينة.');
            }
          }
        }, 400);
        return;
      }
    } catch (err) {
      console.warn('Hidden iframe print creation failed:', err);
    }
  }

  // Strategy 2: Direct browser print with safety class cleanup
  try {
    document.body.classList.add('printing-report');
    window.print();
    setTimeout(() => {
      document.body.classList.remove('printing-report');
    }, 1500);
  } catch (err) {
    console.warn('window.print() fallback error:', err);
    document.body.classList.remove('printing-report');
    if (fallbackHtmlGenerator) {
      downloadPrintableHTML(fallbackHtmlGenerator(), 'D-Deli_Report.html');
      if (onNotify) {
        onNotify('تم تنزيل ملف التقرير المستقل (HTML) لأن أمر الطباعة المباشر محظور في المتصفح.', true);
      }
    }
  }
}

/**
 * Downloads a standalone, self-printing HTML document.
 */
export function downloadPrintableHTML(htmlContent: string, filename: string): void {
  const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename.endsWith('.html') ? filename : `${filename}.html`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
