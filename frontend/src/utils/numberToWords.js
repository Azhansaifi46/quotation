const singleDigits = [
  '',
  'One',
  'Two',
  'Three',
  'Four',
  'Five',
  'Six',
  'Seven',
  'Eight',
  'Nine',
];

const twoDigits = [
  'Ten',
  'Eleven',
  'Twelve',
  'Thirteen',
  'Fourteen',
  'Fifteen',
  'Sixteen',
  'Seventeen',
  'Eighteen',
  'Nineteen',
];

const tensDigits = [
  '',
  '',
  'Twenty',
  'Thirty',
  'Forty',
  'Fifty',
  'Sixty',
  'Seventy',
  'Eighty',
  'Ninety',
];

function convertLessThanThousand(num) {
  let str = '';
  if (num >= 100) {
    str += singleDigits[Math.floor(num / 100)] + ' Hundred ';
    num %= 100;
  }
  if (num >= 10 && num <= 19) {
    str += twoDigits[num - 10] + ' ';
  } else if (num >= 20 || num === 0) {
    str += tensDigits[Math.floor(num / 10)] + ' ';
    if (num % 10 > 0) {
      str += singleDigits[num % 10] + ' ';
    }
  } else if (num > 0 && num < 10) {
    str += singleDigits[num] + ' ';
  }
  return str.trim();
}

export function numberToWordsIndian(amount) {
  if (isNaN(amount) || amount === null || amount === undefined || amount === 0) {
    return 'INR Zero Rupees Only';
  }

  const roundedAmount = Math.round(Number(amount) * 100) / 100;
  const numStr = roundedAmount.toFixed(2);
  const [rupeesPart, paisePart] = numStr.split('.');

  if (BigInt(rupeesPart) === 0n && parseInt(paisePart, 10) === 0) {
    return 'INR Zero Rupees Only';
  }

  const units = ['', 'Thousand', 'Lakh', 'Crore', 'Arab', 'Kharab', 'Neel', 'Padma', 'Shankh'];
  const groups = [];
  let remaining = rupeesPart;
  groups.unshift(Number(remaining.slice(-3)));
  remaining = remaining.slice(0, -3);
  while (remaining.length > 0) {
    groups.unshift(Number(remaining.slice(-2)));
    remaining = remaining.slice(0, -2);
  }

  const words = groups
    .map((group, index) => (group > 0 ? `${convertLessThanThousand(group)} ${units[groups.length - index - 1]}` : ''))
    .filter(Boolean)
    .join(', ');

  let result = 'INR ' + (words ? words + ' Rupees' : 'Zero Rupees');

  const paise = parseInt(paisePart, 10);
  if (paise > 0) {
    result += ' and ' + convertLessThanThousand(paise) + ' Paise';
  }

  return result + ' Only';
}

export function formatMoney(val, includeCurrency = false) {
  const numericValue = typeof val === 'string' ? Number(val.replace(/,/g, '').replace(/^₹\s*/, '')) : Number(val);
  if (!Number.isFinite(numericValue)) return includeCurrency ? '₹0.00' : '0.00';

  return new Intl.NumberFormat('en-IN', {
    ...(includeCurrency ? { style: 'currency', currency: 'INR' } : {}),
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
    useGrouping: true,
  }).format(numericValue);
}

export const formatINR = (val) => formatMoney(val, true);
export const formatNumberOnly = (val) => formatMoney(val, false);
