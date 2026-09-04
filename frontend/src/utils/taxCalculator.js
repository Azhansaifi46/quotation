/**
 * Computes line item calculations with support for discounts and manual overrides
 */
export function calculateLineItem(item, isInterState = false) {
  const rate = parseFloat(item.rate) || 0;
  const qty = parseFloat(item.quantity) || 0;
  const grossAmount = Math.round(rate * qty * 100) / 100;

  // Handle line item discount
  const discPercent = parseFloat(item.discountPercent) || 0;
  let discAmount = parseFloat(item.discountAmount) || 0;
  if (discPercent > 0 && (!item.discountAmount || item.discountAmount === '0')) {
    discAmount = Math.round(((grossAmount * discPercent) / 100) * 100) / 100;
  }

  const taxableAmount = Math.max(0, Math.round((grossAmount - discAmount) * 100) / 100);
  const taxRate = parseFloat(item.taxRate) || 0;

  let taxAmount = item.taxAmount;
  let amount = item.amount;

  // If not manually overridden or empty
  if (!item.isManualOverride || taxAmount === undefined || taxAmount === null || taxAmount === '') {
    taxAmount = Math.round(((taxableAmount * taxRate) / 100) * 100) / 100;
  } else {
    taxAmount = parseFloat(taxAmount) || 0;
  }

  if (!item.isManualOverride || amount === undefined || amount === null || amount === '') {
    amount = Math.round((taxableAmount + taxAmount) * 100) / 100;
  } else {
    amount = parseFloat(amount) || 0;
  }

  return {
    ...item,
    grossAmount,
    discountAmount: discAmount,
    taxableAmount,
    taxAmount,
    amount,
  };
}

/**
 * Computes single tax row amount from taxable amount & rate
 */
export function calculateTaxRowAmount(taxableAmount, rate) {
  const taxable = parseFloat(taxableAmount) || 0;
  const r = parseFloat(rate) || 0;
  return Math.round(((taxable * r) / 100) * 100) / 100;
}

/**
 * Auto Split GST helper: e.g. 18% -> CGST 9% + SGST 9% (intra) or IGST 18% (inter)
 */
export function autoSplitGST(totalRate, isInterState = false) {
  const r = parseFloat(totalRate) || 0;
  if (isInterState) {
    return [
      {
        id: `tax_${Date.now()}_igst`,
        type: 'IGST',
        rate: r,
        description: `Integrated GST @ ${r}%`,
      },
    ];
  } else {
    const half = r / 2;
    return [
      {
        id: `tax_${Date.now()}_cgst`,
        type: 'CGST',
        rate: half,
        description: `Central GST @ ${half}%`,
      },
      {
        id: `tax_${Date.now()}_sgst`,
        type: 'SGST',
        rate: half,
        description: `State GST @ ${half}%`,
      },
    ];
  }
}

/**
 * Builds default tax rows from items based on GST rates and inter/intra state
 */
export function generateDefaultTaxRows(items = [], isInterState = false) {
  const rateGroups = {};
  items.forEach((item) => {
    const rate = parseFloat(item.rate) || 0;
    const qty = parseFloat(item.quantity) || 0;
    const discAmount = parseFloat(item.discountAmount) || 0;
    const gross = rate * qty;
    const taxableVal = Math.max(0, gross - discAmount);
    const taxRate = parseFloat(item.taxRate) || 0;

    if (!rateGroups[taxRate]) {
      rateGroups[taxRate] = 0;
    }
    rateGroups[taxRate] += taxableVal;
  });

  const rows = [];
  let rowIdCounter = 1;

  Object.entries(rateGroups).forEach(([taxRateStr, taxableVal]) => {
    const taxRate = parseFloat(taxRateStr) || 0;
    const taxable = Math.round(taxableVal * 100) / 100;

    if (isInterState) {
      const taxAmt = calculateTaxRowAmount(taxable, taxRate);
      rows.push({
        id: `tax_${rowIdCounter++}`,
        type: 'IGST',
        rate: taxRate,
        taxableAmount: taxable,
        taxAmount: taxAmt,
        description: `Integrated Tax @ ${taxRate}%`,
      });
    } else {
      const halfRate = taxRate / 2;
      const cgstAmt = calculateTaxRowAmount(taxable, halfRate);
      const sgstAmt = Math.round((calculateTaxRowAmount(taxable, taxRate) - cgstAmt) * 100) / 100;

      rows.push({
        id: `tax_${rowIdCounter++}`,
        type: 'CGST',
        rate: halfRate,
        taxableAmount: taxable,
        taxAmount: cgstAmt,
        description: `Central Tax @ ${halfRate}%`,
      });
      rows.push({
        id: `tax_${rowIdCounter++}`,
        type: 'SGST',
        rate: halfRate,
        taxableAmount: taxable,
        taxAmount: sgstAmt,
        description: `State Tax @ ${halfRate}%`,
      });
    }
  });

  return rows;
}

/**
 * Calculates complete quotation / document totals supporting dynamic multiple tax rows and discounts
 */
export function calculateQuotationTotals(
  items = [],
  companyStateCode = '27',
  placeOfSupplyCode = '27',
  customTaxRows = null,
  docDiscount = { type: 'percentage', rate: 0, amount: 0 }
) {
  const isInterState = companyStateCode !== placeOfSupplyCode;

  let subtotal = 0;
  let totalLineDiscounts = 0;

  items.forEach((item) => {
    const rate = parseFloat(item.rate) || 0;
    const qty = parseFloat(item.quantity) || 0;
    const lineGross = rate * qty;
    const lineDisc = parseFloat(item.discountAmount) || 0;

    subtotal += lineGross;
    totalLineDiscounts += lineDisc;
  });

  subtotal = Math.round(subtotal * 100) / 100;
  totalLineDiscounts = Math.round(totalLineDiscounts * 100) / 100;

  // Document level discount
  let docDiscountAmount = 0;
  if (docDiscount?.type === 'percentage') {
    const r = parseFloat(docDiscount.rate) || 0;
    docDiscountAmount = Math.round((((subtotal - totalLineDiscounts) * r) / 100) * 100) / 100;
  } else if (docDiscount?.type === 'fixed') {
    docDiscountAmount = parseFloat(docDiscount.amount) || 0;
  }

  const totalDiscount = Math.round((totalLineDiscounts + docDiscountAmount) * 100) / 100;
  const taxableAmount = Math.max(0, Math.round((subtotal - totalDiscount) * 100) / 100);

  // Use customTaxRows if provided, otherwise generate default tax rows
  let activeTaxRows = customTaxRows;
  if (!activeTaxRows || activeTaxRows.length === 0) {
    activeTaxRows = generateDefaultTaxRows(items, isInterState);
  }

  let totalTax = 0;
  let totalCGST = 0;
  let totalSGST = 0;
  let totalIGST = 0;

  const evaluatedTaxRows = activeTaxRows.map((row) => {
    const rRate = parseFloat(row.rate) || 0;
    const rTaxable =
      parseFloat(
        row.taxableAmount !== undefined && row.taxableAmount !== ''
          ? row.taxableAmount
          : taxableAmount
      ) || 0;

    let rAmount = row.taxAmount;
    if (
      rAmount === undefined ||
      rAmount === null ||
      rAmount === '' ||
      isNaN(parseFloat(rAmount))
    ) {
      rAmount = calculateTaxRowAmount(rTaxable, rRate);
    } else {
      rAmount = Math.round(parseFloat(rAmount) * 100) / 100;
    }

    totalTax += rAmount;
    if (row.type === 'CGST') totalCGST += rAmount;
    else if (row.type === 'SGST') totalSGST += rAmount;
    else if (row.type === 'IGST') totalIGST += rAmount;

    return {
      ...row,
      rate: rRate,
      taxableAmount: rTaxable,
      taxAmount: rAmount,
    };
  });

  totalTax = Math.round(totalTax * 100) / 100;
  totalCGST = Math.round(totalCGST * 100) / 100;
  totalSGST = Math.round(totalSGST * 100) / 100;
  totalIGST = Math.round(totalIGST * 100) / 100;

  const grandTotal = Math.round((taxableAmount + totalTax) * 100) / 100;

  // Group by HSN/SAC for GST Summary Table
  const hsnGroups = {};
  items.forEach((item) => {
    const rate = parseFloat(item.rate) || 0;
    const qty = parseFloat(item.quantity) || 0;
    const disc = parseFloat(item.discountAmount) || 0;
    const taxableVal = Math.max(0, rate * qty - disc);
    const taxRate = parseFloat(item.taxRate) || 0;
    const hsnKey = `${item.hsnSac || 'General'}_${taxRate}`;

    if (!hsnGroups[hsnKey]) {
      hsnGroups[hsnKey] = {
        hsnSac: item.hsnSac || 'General',
        taxRate: taxRate,
        taxableValue: 0,
        taxAmount: 0,
      };
    }
    hsnGroups[hsnKey].taxableValue += taxableVal;
  });

  const gstSummary = Object.values(hsnGroups).map((grp) => {
    const rowTaxable = Math.round(grp.taxableValue * 100) / 100;
    if (isInterState) {
      const igstAmount = calculateTaxRowAmount(rowTaxable, grp.taxRate);
      return {
        hsnSac: grp.hsnSac,
        taxableValue: rowTaxable,
        cgstRate: 0,
        cgstAmount: 0,
        sgstRate: 0,
        sgstAmount: 0,
        igstRate: grp.taxRate,
        igstAmount: igstAmount,
        totalTax: igstAmount,
      };
    } else {
      const halfRate = grp.taxRate / 2;
      const cgstAmount = calculateTaxRowAmount(rowTaxable, halfRate);
      const sgstAmount =
        Math.round((calculateTaxRowAmount(rowTaxable, grp.taxRate) - cgstAmount) * 100) / 100;
      return {
        hsnSac: grp.hsnSac,
        taxableValue: rowTaxable,
        cgstRate: halfRate,
        cgstAmount: cgstAmount,
        sgstRate: halfRate,
        sgstAmount: sgstAmount,
        igstRate: 0,
        igstAmount: 0,
        totalTax: Math.round((cgstAmount + sgstAmount) * 100) / 100,
      };
    }
  });

  return {
    isInterState,
    subtotal,
    totalDiscount,
    docDiscountAmount,
    taxableAmount,
    cgstAmount: totalCGST,
    sgstAmount: totalSGST,
    igstAmount: totalIGST,
    totalTax,
    grandTotal,
    taxRows: evaluatedTaxRows,
    gstSummary,
  };
}
