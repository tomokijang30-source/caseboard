// 결제 안내에 사용되는 정보. .env.local / Vercel env 에서 채움.
export const BILLING = {
  bankName:      process.env.BILLING_BANK_NAME      ?? "(은행 미설정)",
  accountNumber: process.env.BILLING_ACCOUNT_NUMBER ?? "(계좌번호 미설정)",
  accountHolder: process.env.BILLING_ACCOUNT_HOLDER ?? "(예금주 미설정)",
  contactEmail:  process.env.BILLING_CONTACT_EMAIL  ?? "sales@caseboard.kr",
};

export function formatKRW(amount: number) {
  return "₩" + amount.toLocaleString("ko-KR");
}

export function withVat(amountExcl: number) {
  return Math.round(amountExcl * 1.1);
}
