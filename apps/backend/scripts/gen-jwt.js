const crypto = require('crypto');

function base64UrlEscape(str) {
  return str.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

function base64UrlEncode(str) {
  return base64UrlEscape(Buffer.from(str).toString('base64'));
}

const header = base64UrlEncode(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
const payload = base64UrlEncode(JSON.stringify({
  sub: '41a4be2b-1928-42e7-b8b0-f2b0ef68c06b',
  email: 'testekyc@uritech.com',
  role: 'user',
  vendorSubtype: null,
  kycTier: 'unverified',
  type: 'access',
  jti: 'manual-test-token',
  iat: Math.floor(Date.now() / 1000),
  exp: Math.floor(Date.now() / 1000) + 31536000
}));

const secret = 'uritech-secret-key';
const signature = base64UrlEscape(
  crypto.createHmac('sha256', secret).update(header + '.' + payload).digest('base64')
);

console.log(header + '.' + payload + '.' + signature);
