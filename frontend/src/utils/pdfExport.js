import html2pdf from 'html2pdf.js';

/**
 * High-Precision Professional A4 PDF Exporter for Quotations and Invoices
 * Guarantees standard A4 dimensions, perfect margins, crisp typography, and strict break protection.
 */
export async function exportQuotationToPDF(elementId, quotationNumber = 'Quotation') {
  const sourceElement = document.getElementById(elementId);
  if (!sourceElement) {
    console.error('Element to export not found:', elementId);
    return false;
  }

  // Create an isolated, fixed-dimension A4 print staging container
  const printWrapper = document.createElement('div');
  printWrapper.style.position = 'fixed';
  printWrapper.style.left = '-9999px';
  printWrapper.style.top = '0';
  printWrapper.style.width = '794px'; // Standard A4 pixel width at 96 DPI
  printWrapper.style.backgroundColor = '#ffffff';
  printWrapper.style.color = '#0f172a';
  printWrapper.style.zIndex = '-9999';
  printWrapper.style.boxSizing = 'border-box';
  printWrapper.style.fontFamily = 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';

  // Clone source DOM
  const clone = sourceElement.cloneNode(true);
  clone.id = 'pdf-export-staging-clone';
  clone.style.width = '794px';
  clone.style.maxWidth = '794px';
  clone.style.minHeight = 'auto';
  clone.style.margin = '0 auto';
  clone.style.boxShadow = 'none';
  clone.style.border = 'none';
  clone.style.borderRadius = '0';
  clone.style.backgroundColor = '#ffffff';

  // Inject print CSS rules into clone
  const styleTag = document.createElement('style');
  styleTag.innerHTML = `
    * {
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
      box-sizing: border-box !important;
    }
    table {
      width: 100% !important;
      border-collapse: collapse !important;
      page-break-inside: auto !important;
    }
    tr {
      page-break-inside: avoid !important;
      break-inside: avoid !important;
    }
    thead {
      display: table-header-group !important;
    }
    tbody {
      display: table-row-group !important;
    }
    .no-break, [style*="pageBreakInside: 'avoid'"], [style*="page-break-inside: avoid"] {
      page-break-inside: avoid !important;
      break-inside: avoid !important;
    }
    .grid {
      display: grid !important;
    }
    .grid-cols-2 {
      grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
    }
    .grid-cols-12 {
      grid-template-columns: repeat(12, minmax(0, 1fr)) !important;
    }
    .col-span-7 {
      grid-column: span 7 / span 7 !important;
    }
    .col-span-5 {
      grid-column: span 5 / span 5 !important;
    }
    .col-span-8 {
      grid-column: span 8 / span 8 !important;
    }
    .col-span-4 {
      grid-column: span 4 / span 4 !important;
    }
    .flex {
      display: flex !important;
    }
    .flex-row {
      flex-direction: row !important;
    }
  `;
  printWrapper.appendChild(styleTag);
  printWrapper.appendChild(clone);
  document.body.appendChild(printWrapper);

  // Ensure all cloned images are ready
  const images = Array.from(clone.getElementsByTagName('img'));
  await Promise.all(
    images.map((img) => {
      if (img.complete) return Promise.resolve();
      return new Promise((resolve) => {
        img.onload = resolve;
        img.onerror = resolve;
      });
    })
  );

  // Clean filename
  const safeFilename = `${(quotationNumber || 'Document').toString().replace(/[^a-zA-Z0-9-_]/g, '_')}.pdf`;

  const opt = {
    margin: [8, 8, 8, 8], // mm [top, right, bottom, left]
    filename: safeFilename,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: {
      scale: 2.2, // High resolution for crisp text
      useCORS: true,
      letterRendering: true,
      scrollY: 0,
      scrollX: 0,
      windowWidth: 794,
      logging: false,
    },
    jsPDF: {
      unit: 'mm',
      format: 'a4',
      orientation: 'portrait',
      compress: true,
    },
    pagebreak: {
      mode: ['css', 'legacy'],
      avoid: ['tr', '.no-break', '[style*="page-break-inside: avoid"]'],
    },
  };

  try {
    await html2pdf().set(opt).from(clone).save();
    return true;
  } catch (err) {
    console.error('Error generating PDF with html2pdf:', err);
    // Fallback: browser print
    window.print();
    return false;
  } finally {
    // Clean up temporary DOM element
    if (document.body.contains(printWrapper)) {
      document.body.removeChild(printWrapper);
    }
  }
}

