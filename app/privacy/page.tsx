import Link from "next/link";

export default function PrivacyPage() {
  return (
    <main className="mx-auto max-w-3xl space-y-6 px-4 py-10">
      <Link href="/login" className="text-sm text-gray-500 hover:text-gray-900">
        ← 로그인
      </Link>

      <div className="rounded-md border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
        <strong>이 문서는 초안입니다.</strong> 실제 운영 전에 반드시 법무 검토를
        받으세요. 의뢰인 정보(이름·사건정보)를 다루는 SaaS 는 개인정보보호법상
        엄격한 처리 의무가 발생합니다.
      </div>

      <article className="prose prose-sm max-w-none rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h1 className="!mb-2 text-xl font-semibold">개인정보처리방침</h1>
        <p className="text-xs text-gray-500">최종 갱신일: 작성 필요</p>

        <h2 className="mt-6 text-base font-semibold">1. 처리하는 개인정보 항목</h2>
        <ul className="list-disc pl-5 text-sm text-gray-700">
          <li>회원 가입: 이메일, 비밀번호(해시), 이름, 소속 사무실 정보</li>
          <li>서비스 이용: 사건명, 의뢰인 이름, 사건 메모, 마감일, 처리 상태</li>
          <li>자동 수집: 접속 IP, 접속 기록 (Supabase Auth 기본 로그)</li>
        </ul>

        <h2 className="mt-6 text-base font-semibold">2. 수집·이용 목적</h2>
        <p className="text-sm text-gray-700">
          본 서비스(CaseBoard)는 변호사 사무실의 사건 관리 업무를 위해 위 정보를
          수집·이용합니다. 그 외 목적으로는 사용하지 않습니다.
        </p>

        <h2 className="mt-6 text-base font-semibold">3. 보유 기간</h2>
        <p className="text-sm text-gray-700">
          회원 탈퇴 시 즉시 삭제하는 것을 원칙으로 합니다. 단, 관련 법령에 따른
          보관 의무가 있는 경우 해당 기간만큼 보관합니다.
        </p>

        <h2 className="mt-6 text-base font-semibold">4. 처리위탁</h2>
        <ul className="list-disc pl-5 text-sm text-gray-700">
          <li>Supabase Inc. (데이터베이스/인증) — 미국</li>
          <li>Vercel Inc. (서비스 호스팅) — 미국</li>
        </ul>
        <p className="text-sm text-gray-700">
          국외이전 동의 절차가 필요할 수 있습니다 (법무 검토 필요).
        </p>

        <h2 className="mt-6 text-base font-semibold">5. 이용자의 권리</h2>
        <p className="text-sm text-gray-700">
          개인정보 열람·정정·삭제·처리정지 요구가 가능합니다. 문의처: 작성 필요.
        </p>

        <h2 className="mt-6 text-base font-semibold">6. 안전성 확보 조치</h2>
        <p className="text-sm text-gray-700">
          비밀번호는 단방향 해시로만 저장하며, 데이터베이스 접근은 Row Level
          Security 정책으로 사무실 단위 격리됩니다.
        </p>

        <h2 className="mt-6 text-base font-semibold">7. 개인정보 보호책임자</h2>
        <p className="text-sm text-gray-700">작성 필요 (성명, 직책, 연락처)</p>
      </article>
    </main>
  );
}
