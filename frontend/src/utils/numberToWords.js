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

  let num = parseInt(rupeesPart, 10);
  if (num === 0 && parseInt(paisePart, 10) === 0) {
    return 'INR Zero Rupees Only';
  }

  const crores = Math.floor(num / 10000000);
  num %= 10000000;

  const lakhs = Math.floor(num / 100000);
  num %= 100000;

  const thousands = Math.floor(num / 1000);
  num %= 1000;

  const hundreds = num;

  let words = '';

  if (crores > 0) {
    words += convertLessThanThousand(crores) + ' Crore, ';
  }
  if (lakhs > 0) {
    words += convertLessThanThousand(lakhs) + ' Lakh, ';
  }
  if (thousands > 0) {
    words += convertLessThanThousand(thousands) + ' Thousand, ';
  }
  if (hundreds > 0) {
    words += convertLessThanThousand(hundreds) + ' ';
  }

  words = words.trim();
  if (words.endsWith(',')) {
    words = words.slice(0, -1).trim();
  }

  let result = 'INR ' + (words ? words + ' Rupees' : 'Zero Rupees');

  const paise = parseInt(paisePart, 10);
  if (paise > 0) {
    result += ' and ' + convertLessThanThousand(paise) + ' Paise';
  }

  return result + ' Only';
}

export function formatINR(val) {
  if (val === null || val === undefined || isNaN(val)) return '₹0.00';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
  }).format(val);
}

export function formatNumberOnly(val) {
  if (val === null || val === undefined || isNaN(val)) return '0.00';
  return new Intl.NumberFormat('en-IN', {
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
  }).format(val);
}
