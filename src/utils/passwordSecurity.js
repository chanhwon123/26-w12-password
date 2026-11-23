export async function sha1HexUpper(plainText) {
  const encoder = new TextEncoder();
  const data = encoder.encode(plainText);
  const hashBuffer = await crypto.subtle.digest('SHA-1', data);
  return Array.from(new Uint8Array(hashBuffer))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('')
    .toUpperCase();
}

export async function checkPwnedPassword(plainText) {
  if (!plainText) {
    return { pwned: false, count: 0, prefix: '', endpoint: '' };
  }

  const fullHash = await sha1HexUpper(plainText);
  const prefix = fullHash.slice(0, 5);
  const suffix = fullHash.slice(5);
  const endpoint = `https://api.pwnedpasswords.com/range/${prefix}`;

  const response = await fetch(endpoint);
  if (!response.ok) {
    throw new Error(`유출 조회 실패 (HTTP ${response.status})`);
  }

  const bodyText = await response.text();
  for (const line of bodyText.split('\n')) {
    const [hashSuffix, countText] = line.trim().split(':');
    if (hashSuffix === suffix) {
      const count = Number(countText);
      return { pwned: count > 0, count, prefix, endpoint };
    }
  }

  return { pwned: false, count: 0, prefix, endpoint };
}

export function evaluatePasswordStrength(password) {
  if (!password) {
    return { score: 0, label: '입력 대기', reasons: [] };
  }

  let score = 0;
  const reasons = [];

  if (password.length >= 8) score += 1;
  else reasons.push('8자 이상 권장');

  if (password.length >= 12) score += 1;
  if (password.length >= 16) score += 1;

  const hasLower = /[a-z]/.test(password);
  const hasUpper = /[A-Z]/.test(password);
  const hasDigit = /\d/.test(password);
  const hasSymbol = /[^A-Za-z0-9]/.test(password);

  const varietyCount = [hasLower, hasUpper, hasDigit, hasSymbol].filter(Boolean).length;
  score += varietyCount;

  if (varietyCount < 3) {
    reasons.push('대·소문자, 숫자, 특수문자를 3가지 이상 조합해 보세요');
  }

  const weakPatterns = /(1234|abcd|qwerty|password|admin|letmein)/i;
  const repeatedChars = /(.)\1{2,}/;

  if (weakPatterns.test(password)) {
    score -= 2;
    reasons.push('흔한 문자열 패턴이 포함되어 있습니다');
  }
  if (repeatedChars.test(password)) {
    score -= 1;
    reasons.push('같은 문자가 3번 이상 연속됩니다');
  }

  const normalized = Math.max(0, Math.min(5, score));
  let label = '매우 약함';
  if (normalized >= 5) label = '매우 강함';
  else if (normalized === 4) label = '강함';
  else if (normalized === 3) label = '보통';
  else if (normalized === 2) label = '약함';

  return { score: normalized, label, reasons };
}

function randomInt(maxExclusive) {
  const maxUint32 = 0xffffffff;
  const limit = maxUint32 - (maxUint32 % maxExclusive);
  const buf = new Uint32Array(1);

  while (true) {
    crypto.getRandomValues(buf);
    if (buf[0] < limit) {
      return buf[0] % maxExclusive;
    }
  }
}

export function generatePassword({ length = 16, upper = true, lower = true, digits = true, symbols = true }) {
  const pools = [];
  if (upper) pools.push('ABCDEFGHIJKLMNOPQRSTUVWXYZ');
  if (lower) pools.push('abcdefghijklmnopqrstuvwxyz');
  if (digits) pools.push('0123456789');
  if (symbols) pools.push('!@#$%^&*()-_=+[]{}');

  if (pools.length === 0 || length < pools.length) {
    return '';
  }

  const result = [];
  for (const pool of pools) {
    result.push(pool[randomInt(pool.length)]);
  }

  const allChars = pools.join('');
  while (result.length < length) {
    result.push(allChars[randomInt(allChars.length)]);
  }

  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = randomInt(i + 1);
    [result[i], result[j]] = [result[j], result[i]];
  }

  return result.join('');
}