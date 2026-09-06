import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';
import TemplateNavy from './templates/TemplateNavy';
import TemplateCorporate from './templates/TemplateCorporate';
import TemplateMinimal from './templates/TemplateMinimal';
import TemplateEmerald from './templates/TemplateEmerald';

export default function QuotationPreview({
  quotationData = {},
  companyData = null,
  isInterState = false,
  previewId = 'quotation-preview-a4',
  selectedTemplate = null,
}) {
  const [qrSrc, setQrSrc] = useState('');
  const previewViewportRef = useRef(null);
  const previewDocumentRef = useRef(null);
  const [mobileFit, setMobileFit] = useState(null);

  const templateId =
    selectedTemplate ||
    quotationData.templateId ||
    companyData?.defaultTemplate ||
    'navy';

  const company = companyData || {
    name: 'My Business Enterprise',
    tagline: 'Quotation, Invoicing & Billing Solutions',
    address: 'Plot No. 42, Industrial Area, Phase-II, Pune, Maharashtra - 411028',
    mobile: '+91 98765 43210',
    email: 'contact@mybusiness.com',
    website: 'www.mybusiness.com',
    gstin: '27AABCS1429B1Z8',
    pan: 'AABCS1429B',
    bankName: 'State Bank of India',
    accountNumber: '4098765432198',
    ifscCode: 'SBIN0001429',
    branch: 'Industrial Park Branch, Pune',
    upiId: 'enterprise@sbi',
    authorizedSignatory: 'Authorized Signatory',
  };

  const paymentInfo = quotationData.paymentInfo || {};
  const grandTotal = quotationData.summary?.grandTotal || 0;
  const upiId = paymentInfo.upiId || company?.upiId || '';

  // Generate UPI QR Code
  useEffect(() => {
    if (paymentInfo?.upiQrCode) {
      setQrSrc(paymentInfo.upiQrCode);
    } else if (upiId) {
      const upiUrl = `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(
        company?.name || 'Business'
      )}&cu=INR${grandTotal > 0 ? `&am=${grandTotal}` : ''}`;

      QRCode.toDataURL(upiUrl, { width: 120, margin: 1 })
        .then((url) => setQrSrc(url))
        .catch(() => setQrSrc(''));
    } else {
      setQrSrc('');
    }
  }, [paymentInfo, company.name, company.upiId, grandTotal, upiId]);

  useLayoutEffect(() => {
    const viewport = previewViewportRef.current;
    const documentElement = previewDocumentRef.current;
    if (!viewport || !documentElement) return undefined;

    const updateMobileFit = () => {
      const isMobile = window.innerWidth < 768;
      if (!isMobile) {
        documentElement.style.removeProperty('width');
        documentElement.style.removeProperty('max-width');
        setMobileFit(null);
        return;
      }

      documentElement.style.setProperty('width', '800px', 'important');
      documentElement.style.setProperty('max-width', 'none', 'important');
      const scale = Math.min(1, viewport.clientWidth / 800);
      setMobileFit({
        scale,
        height: documentElement.scrollHeight * scale,
      });
    };

    const observer = new ResizeObserver(updateMobileFit);
    observer.observe(viewport);
    observer.observe(documentElement);
    updateMobileFit();

    return () => observer.disconnect();
  }, []);

  const renderTemplate = () => {
    switch (templateId) {
      case 'corporate':
        return (
          <TemplateCorporate
            quotationData={quotationData}
            company={company}
            qrSrc={qrSrc}
            isInterState={isInterState}
          />
        );
      case 'minimal':
        return (
          <TemplateMinimal
            quotationData={quotationData}
            company={company}
            qrSrc={qrSrc}
            isInterState={isInterState}
          />
        );
      case 'emerald':
        return (
          <TemplateEmerald
            quotationData={quotationData}
            company={company}
            qrSrc={qrSrc}
            isInterState={isInterState}
          />
        );
      case 'navy':
      default:
        return (
          <TemplateNavy
            quotationData={quotationData}
            company={company}
            qrSrc={qrSrc}
            isInterState={isInterState}
          />
        );
    }
  };

  return (
    <div
      ref={previewViewportRef}
      className="quotation-preview-viewport w-full flex justify-center py-2 px-1 print:p-0"
      style={mobileFit ? { height: `${mobileFit.height}px` } : undefined}
    >
      <div
        ref={previewDocumentRef}
        id={previewId}
        className="quotation-preview-document w-full max-w-[800px] min-h-[1130px] bg-white rounded-2xl shadow-xl border border-slate-200/80 overflow-visible font-sans print:shadow-none print:border-none print:rounded-none transition-all duration-300"
        style={{
          boxSizing: 'border-box',
          ...(mobileFit
            ? {
                width: '800px',
                maxWidth: 'none',
                flexShrink: 0,
                minHeight: 0,
                transform: `scale(${mobileFit.scale})`,
                transformOrigin: 'top center',
                transition: 'none',
              }
            : {}),
        }}
      >
        {renderTemplate()}
      </div>
    </div>
  );
}
