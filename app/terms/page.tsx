import Link from "next/link";

export default function TermsPage() {
  return (
    <main className="mx-auto max-w-3xl space-y-6 px-4 py-10">
      <Link href="/login" className="text-sm text-gray-500 hover:text-gray-900">
        ← 로그인
      </Link>

      <div className="rounded-md border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
        <strong>이 문서는 초안입니다.</strong> 실제 운영 전에 반드시 법무 검토를
        받으세요.
      </div>

      <article className="prose prose-sm max-w-none rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h1 className="!mb-2 text-xl font-semibold">이용약관</h1>
        <p className="text-xs text-gray-500">최종 갱신일: 작성 필요</p>

        <h2 className="mt-6 text-base font-semibold">제1조 (목적)</h2>
        <p className="text-sm text-gray-700">
          본 약관은 CaseBoard(이하 "서비스") 이용에 관한 회사와 회원의 권리·
          의무 및 책임사항을 규정합니다.
        </p>

        <h2 className="mt-6 text-base font-semibold">제2조 (서비스 정의)</h2>
        <p className="text-sm text-gray-700">
          서비스는 변호사 사무실의 사건 관리(등록·진행상태 추적·직원/대표 간
          가시성 제공)를 목적으로 하는 웹 기반 SaaS 입니다.
        </p>

        <h2 className="mt-6 text-base font-semibold">제3조 (회원의 의무)</h2>
        <ul className="list-disc pl-5 text-sm text-gray-700">
          <li>회원은 의뢰인 정보 입력 시 변호사법·개인정보보호법 등 관련 법령을 준수해야 합니다.</li>
          <li>비밀번호 및 초대 코드의 관리 책임은 회원에게 있습니다.</li>
          <li>서비스를 통한 의뢰인 정보 유출 사고에 대한 1차적 책임은 회원에게 있습니다.</li>
        </ul>

        <h2 className="mt-6 text-base font-semibold">제4조 (책임의 제한)</h2>
        <p className="text-sm text-gray-700">
          회사는 천재지변, 회원의 귀책사유, 또는 외부 클라우드 서비스 장애로
          인한 서비스 중단에 대해 별도의 약정이 없는 한 책임지지 않습니다.
        </p>

        <h2 className="mt-6 text-base font-semibold">제5조 (해지)</h2>
        <p className="text-sm text-gray-700">
          회원은 언제든지 회원 탈퇴를 요청할 수 있으며, 회사는 즉시 처리합니다.
        </p>

        <h2 className="mt-6 text-base font-semibold">제6조 (준거법 및 관할)</h2>
        <p className="text-sm text-gray-700">
          본 약관은 대한민국 법령에 따라 해석되며, 분쟁은 회사 본점 소재지를
          관할하는 법원을 1심 관할법원으로 합니다.
        </p>
      </article>
    </main>
  );
}
