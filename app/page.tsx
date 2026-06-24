export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-stone-50 px-4">
      <h1 className="text-2xl font-bold tracking-tight text-stone-900">
        OWeek 个人主页
      </h1>
      <p className="mt-2 text-sm text-stone-500">
        新生主页系统 — 通过 NFC 或二维码访问 /u/&#123;code&#125; 和 /loc/&#123;code&#125;
      </p>
      <a
        href="/admin"
        className="mt-6 rounded-xl bg-stone-900 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-stone-700"
      >
        运营后台
      </a>
    </div>
  );
}
