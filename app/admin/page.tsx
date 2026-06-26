"use client";

import { useCallback, useEffect, useState } from "react";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface Person {
  id: string;
  code: string;
  editToken: string;
  englishName: string | null;
  chineseName: string | null;
  grade: string | null;
  hidden: boolean;
  published: boolean;
  images: ImageData[];
}

interface ImageData {
  id: string;
  url: string;
  hidden: boolean;
  sort: number;
}

interface CreatedPerson {
  chineseName: string;
  code: string;
  username: string;
  password: string;
}

interface ExportRow {
  chineseName: string;
  englishName: string;
  username: string;
  homepage: string;
  location: string;
}

type TabId = "import" | "location" | "takedown" | "export" | "qr" | "settings" | "reset";

const TABS: { id: TabId; label: string }[] = [
  { id: "import", label: "导入名单" },
  { id: "location", label: "位置编辑" },
  { id: "takedown", label: "下架控制" },
  { id: "export", label: "导出" },
  { id: "qr", label: "QR 码" },
  { id: "settings", label: "系统设置" },
  { id: "reset", label: "重置密码" },
];

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function parseCsv(text: string) {
  return text
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .map((line) => {
      const sep = line.includes("\t") ? "\t" : ",";
      const parts = line.split(sep).map((s) => s.trim());
      const looksEnglish = /^[a-zA-Z]/.test(parts[0] ?? "");
      if (looksEnglish) {
        return { englishName: parts[0] ?? "", chineseName: parts[1] ?? "", grade: parts[2] ?? "" };
      }
      return { englishName: parts[1] ?? "", chineseName: parts[0] ?? "", grade: parts[2] ?? "" };
    });
}

function parseExportCsv(text: string) {
  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
  return lines.slice(1).map((line) => {
    const parts = line.split(",");
    return {
      chineseName: parts[0] ?? "",
      englishName: parts[1] ?? "",
      username: parts[2] ?? "",
      homepage: parts[3] ?? "",
      location: parts[4] ?? "",
    };
  });
}

/* ------------------------------------------------------------------ */
/*  Copy Button                                                        */
/* ------------------------------------------------------------------ */

function OpenLink({ href }: { href: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center rounded bg-zinc-100 px-1.5 py-1 text-zinc-600 transition-colors hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700"
      title="打开"
    >
      <span className="sr-only">打开链接</span>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="13"
        height="13"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <title>打开链接</title>
        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
        <polyline points="15 3 21 3 21 9" />
        <line x1="10" y1="14" x2="21" y2="3" />
      </svg>
    </a>
  );
}

function CopyButton({ value, label }: { value: string; label: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = value;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }
  }, [value]);

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="rounded bg-zinc-100 px-2 py-1 text-xs font-medium text-zinc-600 transition-colors hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700"
    >
      {copied ? "已复制" : label}
    </button>
  );
}

/* ------------------------------------------------------------------ */
/*  Login Screen                                                       */
/* ------------------------------------------------------------------ */

function LoginScreen({
  password,
  setPassword,
  onSubmit,
  error,
  loading,
}: {
  password: string;
  setPassword: (v: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  error: string;
  loading: boolean;
}) {
  return (
    <div className="flex min-h-svh items-center justify-center bg-zinc-50 px-4 dark:bg-zinc-950">
      <form
        onSubmit={onSubmit}
        className="w-full max-w-sm rounded-xl border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
      >
        <h1 className="mb-1 text-xl font-semibold text-zinc-900 dark:text-zinc-100">运营后台</h1>
        <p className="mb-6 text-sm text-zinc-500 dark:text-zinc-400">OWeek 个人主页系统</p>

        <label htmlFor="admin-password" className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
          管理口令
        </label>
        <input
          id="admin-password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="输入口令"
          className="mb-4 block w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none transition-colors focus:border-zinc-500 focus:ring-1 focus:ring-zinc-400 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100 dark:focus:border-zinc-400"
        />

        {error && (
          <p className="mb-4 text-sm text-red-600 dark:text-red-400">{error}</p>
        )}

        <button
          type="submit"
          disabled={loading || !password}
          className="w-full rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-700 disabled:opacity-40 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
        >
          {loading ? "验证中\u2026" : "登录"}
        </button>
      </form>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Dashboard                                                          */
/* ------------------------------------------------------------------ */

function Dashboard({ tab, onTabChange }: { tab: TabId; onTabChange: (t: TabId) => void }) {
  return (
    <div className="mx-auto min-h-svh max-w-5xl bg-zinc-50 dark:bg-zinc-950">
      <header className="sticky top-0 z-10 border-b border-zinc-200 bg-white/80 backdrop-blur dark:border-zinc-800 dark:bg-zinc-900/80">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <h1 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">运营后台</h1>
        </div>
        <nav
          className="mx-auto flex max-w-5xl gap-0 overflow-x-auto px-4
            [scrollbar-width:none] [&::-webkit-scrollbar]:hidden
            after:pointer-events-none after:absolute after:right-0 after:top-0 after:z-10 after:h-full after:w-8 after:bg-gradient-to-l after:from-white after:to-transparent
            dark:after:from-zinc-900/80 relative"
        >
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => onTabChange(t.id)}
              className={
                "shrink-0 border-b-2 px-4 py-2 text-sm font-medium transition-colors " +
                (tab === t.id
                  ? "border-zinc-900 text-zinc-900 dark:border-zinc-100 dark:text-zinc-100"
                  : "border-transparent text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-300")
              }
            >
              {t.label}
            </button>
          ))}
        </nav>
      </header>
      <main className="p-4">
        {tab === "import" && <ImportSection />}
        {tab === "location" && <LocationSection />}
        {tab === "takedown" && <TakedownSection />}
        {tab === "export" && <ExportSection />}
        {tab === "qr" && <QRSection />}
        {tab === "settings" && <SettingsSection />}
        {tab === "reset" && <ResetPasswordSection />}
      </main>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Import Students                                                    */
/* ------------------------------------------------------------------ */

function ImportSection() {
  const [text, setText] = useState("");
  const [rows, setRows] = useState<{ englishName: string; chineseName: string; grade: string }[]>([]);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<CreatedPerson[] | null>(null);
  const [error, setError] = useState("");

  function handleParse() {
    setError("");
    setResult(null);
    const parsed = parseCsv(text);
    if (parsed.length === 0) {
      setError("没有解析到有效数据，每行格式：englishName,chineseName,grade");
      setRows([]);
      return;
    }
    setRows(parsed);
  }

  async function handleImport() {
    if (rows.length === 0) return;
    setImporting(true);
    setError("");
    try {
      const res = await fetch("/api/admin/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rows }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "导入失败");
      } else {
        setResult(data.created);
        setText("");
        setRows([]);
      }
    } catch {
      setError("网络错误");
    } finally {
      setImporting(false);
    }
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-medium text-zinc-900 dark:text-zinc-100">批量导入学生</h2>
      <p className="text-sm text-zinc-500 dark:text-zinc-400">
        粘贴 CSV/TSV 数据，每行格式：<code className="rounded bg-zinc-200 px-1 py-0.5 text-xs dark:bg-zinc-800">englishName,chineseName,grade</code>
      </p>

      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={"John,张三,9\nAlice,李四,10"}
        rows={8}
        className="block w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none transition-colors focus:border-zinc-500 focus:ring-1 focus:ring-zinc-400 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100 dark:focus:border-zinc-400"
      />

       <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={handleParse}
          disabled={!text.trim()}
          className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-100 disabled:opacity-40 dark:border-zinc-600 dark:text-zinc-300 dark:hover:bg-zinc-800"
        >
          解析
        </button>
        <button
          type="button"
          onClick={handleImport}
          disabled={rows.length === 0 || importing}
          className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-700 disabled:opacity-40 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
        >
          {importing ? "导入中\u2026" : "导入 " + rows.length + " 条"}
        </button>
      </div>

      {error && (
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      )}

      {rows.length > 0 && !result && (
        <div className="overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-800">
          <table className="min-w-[480px] w-full text-left text-sm">
            <thead className="bg-zinc-100 dark:bg-zinc-800">
              <tr>
                <th className="px-2 py-2 font-medium text-zinc-600 sm:px-3 dark:text-zinc-400">英文名</th>
                <th className="px-2 py-2 font-medium text-zinc-600 sm:px-3 dark:text-zinc-400">中文名</th>
                <th className="px-2 py-2 font-medium text-zinc-600 sm:px-3 dark:text-zinc-400">年级</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {rows.map((r, i) => (
                // biome-ignore lint/suspicious/noArrayIndexKey: parsed CSV rows have no stable id
                <tr key={"row-" + i} className="bg-white dark:bg-zinc-900">
                  <td className="px-2 py-2 text-zinc-900 sm:px-3 dark:text-zinc-100">{r.englishName}</td>
                  <td className="px-2 py-2 text-zinc-900 sm:px-3 dark:text-zinc-100">{r.chineseName}</td>
                  <td className="px-2 py-2 text-zinc-500 sm:px-3 dark:text-zinc-400">{r.grade}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {result && result.length > 0 && (
        <div>
          <p className="mb-2 text-sm font-medium text-emerald-600 dark:text-emerald-400">
            成功导入 {result.length} 人
          </p>
          <div className="overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-800">
            <table className="min-w-[640px] w-full text-left text-sm">
              <thead className="bg-zinc-100 dark:bg-zinc-800">
                <tr>
                  <th className="px-2 py-2 font-medium text-zinc-600 sm:px-3 dark:text-zinc-400">姓名</th>
                  <th className="px-2 py-2 font-medium text-zinc-600 sm:px-3 dark:text-zinc-400">短码</th>
                  <th className="px-2 py-2 font-medium text-zinc-600 sm:px-3 dark:text-zinc-400">用户名</th>
                  <th className="px-2 py-2 font-medium text-zinc-600 sm:px-3 dark:text-zinc-400">密码</th>
                  <th className="px-2 py-2 sm:px-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                {result.map((p) => (
                  <tr key={p.code} className="bg-white dark:bg-zinc-900">
                    <td className="px-2 py-2 text-zinc-900 sm:px-3 dark:text-zinc-100">{p.chineseName}</td>
                    <td className="px-2 py-2 font-mono text-xs text-zinc-500 sm:px-3 dark:text-zinc-400">{p.code}</td>
                    <td className="px-2 py-2 font-mono text-xs text-zinc-500 sm:px-3 dark:text-zinc-400">{p.username}</td>
                    <td className="px-2 py-2 font-mono text-xs text-zinc-500 sm:px-3 dark:text-zinc-400">{p.password}</td>
                    <td className="px-2 py-2 sm:px-3">
                      <CopyButton value={p.password} label="复制密码" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-3">
            <button
              type="button"
              onClick={() => {
                const header = "name,code,username,password";
                const rows = result.map((p) => `${p.chineseName},${p.code},${p.username},${p.password}`);
                const csv = [header, ...rows].join("\n");
                const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = "accounts.csv";
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
              }}
              className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-100 dark:border-zinc-600 dark:text-zinc-300 dark:hover:bg-zinc-800"
            >
              下载帐密 CSV
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Location Editor                                                    */
/* ------------------------------------------------------------------ */

function LocationSection() {
  const [form, setForm] = useState({ code: "", name: "", grade: "", room: "", seat: "" });
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ ok: boolean; msg: string } | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.code || !form.name) return;
    setSaving(true);
    setFeedback(null);
    try {
      const res = await fetch("/api/admin/location", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        setFeedback({ ok: false, msg: data.error ?? "保存失败" });
      } else {
        setFeedback({ ok: true, msg: "位置页已保存" });
        setForm({ code: "", name: "", grade: "", room: "", seat: "" });
      }
    } catch {
      setFeedback({ ok: false, msg: "网络错误" });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-medium text-zinc-900 dark:text-zinc-100">编辑位置页</h2>
      <p className="text-sm text-zinc-500 dark:text-zinc-400">
        使用学生短码编辑其位置信息（展位房间和座位号）。
      </p>

      <form onSubmit={handleSubmit} className="space-y-3 w-full max-w-md">
        <div>
          <label htmlFor="loc-code" className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">学生短码 *</label>
          <input
            id="loc-code"
            value={form.code}
            onChange={(e) => setForm({ ...form, code: e.target.value })}
            placeholder="例如 abc123"
            className="block w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none focus:border-zinc-500 focus:ring-1 focus:ring-zinc-400 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
          />
        </div>
        <div>
          <label htmlFor="loc-name" className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">姓名 *</label>
          <input
            id="loc-name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="张三"
            className="block w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none focus:border-zinc-500 focus:ring-1 focus:ring-zinc-400 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
          />
        </div>
        <div>
          <label htmlFor="loc-grade" className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">年级</label>
          <input
            id="loc-grade"
            value={form.grade}
            onChange={(e) => setForm({ ...form, grade: e.target.value })}
            placeholder="例如 9"
            className="block w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none focus:border-zinc-500 focus:ring-1 focus:ring-zinc-400 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
          />
        </div>
        <div>
          <label htmlFor="loc-room" className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">房间 *</label>
          <input
            id="loc-room"
            value={form.room}
            onChange={(e) => setForm({ ...form, room: e.target.value })}
            placeholder="例如 A101"
            className="block w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none focus:border-zinc-500 focus:ring-1 focus:ring-zinc-400 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
          />
        </div>
        <div>
          <label htmlFor="loc-seat" className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">座位 *</label>
          <input
            id="loc-seat"
            value={form.seat}
            onChange={(e) => setForm({ ...form, seat: e.target.value })}
            placeholder="例如 12"
            className="block w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none focus:border-zinc-500 focus:ring-1 focus:ring-zinc-400 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
          />
        </div>

        {feedback && (
          <p className={"text-sm " + (feedback.ok ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400")}>
            {feedback.msg}
          </p>
        )}

        <button
          type="submit"
          disabled={saving || !form.code || !form.name}
          className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-700 disabled:opacity-40 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
        >
          {saving ? "保存中\u2026" : "保存位置页"}
        </button>
      </form>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Takedown Controls                                                  */
/* ------------------------------------------------------------------ */

function TakedownSection() {
  const [persons, setPersons] = useState<Person[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");

  useEffect(() => {
    fetch("/api/admin/persons")
      .then((r) => r.json())
      .then((data) => setPersons(data.persons ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = persons.filter((p) => {
    if (!query.trim()) return true;
    const q = query.toLowerCase();
    return (
      (p.chineseName ?? "").toLowerCase().includes(q) ||
      (p.englishName ?? "").toLowerCase().includes(q) ||
      p.code.toLowerCase().includes(q)
    );
  });

  async function togglePerson(person: Person) {
    try {
      await fetch("/api/admin/takedown", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "person", id: person.id, hidden: !person.hidden }),
      });
      setPersons((prev) =>
        prev.map((p) => (p.id === person.id ? { ...p, hidden: !p.hidden } : p))
      );
    } catch {
      /* empty */
    }
  }

  async function toggleImage(imageId: string, personId: string, currentHidden: boolean) {
    try {
      await fetch("/api/admin/takedown", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "image", id: imageId, hidden: !currentHidden }),
      });
      setPersons((prev) =>
        prev.map((p) =>
          p.id === personId
            ? {
                ...p,
                images: p.images.map((img) =>
                  img.id === imageId ? { ...img, hidden: !img.hidden } : img
                ),
              }
            : p
        )
      );
    } catch {
      /* empty */
    }
  }

  if (loading) {
    return <p className="text-sm text-zinc-500">加载中\u2026</p>;
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-medium text-zinc-900 dark:text-zinc-100">下架控制</h2>

      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="搜索姓名、英文名或短码\u2026"
        className="block w-full max-w-md rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none focus:border-zinc-500 focus:ring-1 focus:ring-zinc-400 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
      />

      {filtered.length === 0 && (
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          {persons.length === 0 ? "暂无数据" : "未找到匹配的学生"}
        </p>
      )}

      <div className="space-y-3">
        {filtered.map((person) => (
          <div
            key={person.id}
            className="rounded-lg border border-zinc-200 bg-white p-3 sm:p-4 dark:border-zinc-800 dark:bg-zinc-900"
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-baseline gap-2">
                  <span className="font-medium text-zinc-900 dark:text-zinc-100">
                    {person.chineseName ?? "\u2014"}
                  </span>
                  <span className="text-sm text-zinc-500 dark:text-zinc-400">
                    {person.englishName ?? ""}
                  </span>
                  <code className="rounded bg-zinc-100 px-1 py-0.5 font-mono text-xs text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
                    {person.code}
                  </code>
                </div>
                <p className="mt-1 text-xs text-zinc-400 dark:text-zinc-500">
                  {"已发布：" + (person.published ? "是" : "否") + " ｜ 图片：" + person.images.length}
                </p>
              </div>
              <div className="shrink-0">
                <button
                  type="button"
                  onClick={() => togglePerson(person)}
                  className={
                    "rounded-lg px-3 py-1.5 text-xs font-medium transition-colors disabled:opacity-40 " +
                    (person.hidden
                      ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200 dark:bg-emerald-900/40 dark:text-emerald-400"
                      : "bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900/40 dark:text-red-400")
                  }
                >
                  {person.hidden ? "已隐藏 \u00B7 显示" : "显示中 \u00B7 隐藏"}
                </button>
              </div>
            </div>

            {person.images.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {person.images.map((img) => (
                  <button
                    type="button"
                    key={img.id}
                    onClick={() => toggleImage(img.id, person.id, img.hidden)}
                    className={
                      "group relative h-16 w-16 overflow-hidden rounded-lg border transition-opacity " +
                      (img.hidden
                        ? "border-red-300 opacity-50 dark:border-red-800"
                        : "border-zinc-200 dark:border-zinc-700")
                    }
                    title={img.hidden ? "点击显示" : "点击隐藏"}
                  >
                    <img
                      src={img.url}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                    {img.hidden && (
                      <div className="absolute inset-0 flex items-center justify-center bg-zinc-900/50 text-[10px] font-medium text-white">
                        隐藏
                      </div>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Export                                                             */
/* ------------------------------------------------------------------ */

function ExportSection() {
  const [rows, setRows] = useState<ExportRow[] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/export")
      .then((r) => r.text())
      .then((csv) => setRows(parseExportCsv(csv)))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  function handleDownload() {
    window.open("/api/admin/export", "_blank");
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-lg font-medium text-zinc-900 dark:text-zinc-100">导出数据</h2>
        <button
          type="button"
          onClick={handleDownload}
          className="w-full rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-700 sm:w-auto dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
        >
          下载 CSV
        </button>
      </div>

      {loading && <p className="text-sm text-zinc-500">加载中\u2026</p>}

      {rows && rows.length === 0 && (
        <p className="text-sm text-zinc-500 dark:text-zinc-400">暂无数据</p>
      )}

      {rows && rows.length > 0 && (
        <div className="overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-800">
          <table className="min-w-[700px] w-full text-left text-sm">
            <thead className="bg-zinc-100 dark:bg-zinc-800">
              <tr>
                <th className="px-2 py-2 font-medium text-zinc-600 sm:px-3 dark:text-zinc-400">中文名</th>
                <th className="px-2 py-2 font-medium text-zinc-600 sm:px-3 dark:text-zinc-400">英文名</th>
                <th className="px-2 py-2 font-medium text-zinc-600 sm:px-3 dark:text-zinc-400">用户名</th>
                <th className="px-2 py-2 font-medium text-zinc-600 sm:px-3 dark:text-zinc-400">主页</th>
                <th className="px-2 py-2 font-medium text-zinc-600 sm:px-3 dark:text-zinc-400">位置页</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {rows.map((r, i) => (
                // biome-ignore lint/suspicious/noArrayIndexKey: export CSV rows have no stable id
                <tr key={"exp-" + i} className="bg-white dark:bg-zinc-900">
                  <td className="px-2 py-2 text-zinc-900 sm:px-3 dark:text-zinc-100">{r.chineseName}</td>
                  <td className="px-2 py-2 text-zinc-500 sm:px-3 dark:text-zinc-400">{r.englishName}</td>
                  <td className="px-2 py-2 font-mono text-xs text-zinc-500 sm:px-3 dark:text-zinc-400">{r.username}</td>
                  <td className="px-2 py-2 sm:px-3">
                    <span className="inline-flex items-center gap-1">
                      <CopyButton value={r.homepage} label="复制" />
                      <OpenLink href={r.homepage} />
                    </span>
                  </td>
                  <td className="px-2 py-2 sm:px-3">
                    <span className="inline-flex items-center gap-1">
                      <CopyButton value={r.location} label="复制" />
                      <OpenLink href={r.location} />
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  QR Codes                                                           */
/* ------------------------------------------------------------------ */

function QRSection() {
  const [persons, setPersons] = useState<Person[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState("");

  useEffect(() => {
    fetch("/api/admin/persons")
      .then((r) => {
        if (!r.ok) throw new Error("会话过期，请刷新页面重新登录");
        return r.json();
      })
      .then((data) => setPersons(data.persons ?? []))
      .catch((err) =>
        setFetchError(err instanceof Error ? err.message : "加载人员数据失败"),
      )
      .finally(() => setLoading(false));
  }, []);

  const total = persons.length * 2;
  const printUrl = "/api/admin/qr/print";

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-lg font-medium text-zinc-900 dark:text-zinc-100">QR 码生成</h2>
        <a
          href={persons.length > 0 ? printUrl : undefined}
          target="_blank"
          rel="noopener noreferrer"
          aria-disabled={persons.length === 0}
          onClick={(e) => {
            if (persons.length === 0) {
              e.preventDefault();
            }
          }}
          className={
            "inline-flex justify-center rounded-lg px-4 py-2 text-sm font-medium text-white transition-colors sm:w-auto " +
            "bg-zinc-900 hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300 " +
            (persons.length === 0
              ? "pointer-events-none opacity-40"
              : "")
          }
        >
          打开打印页 ({total} 张)
        </a>
      </div>

      <p className="text-sm text-zinc-500 dark:text-zinc-400">
        每人生成 2 张 QR 码：主页 QR（/u/码）和位置页 QR（/loc/码）。点击按钮在新窗口打开打印页，自动弹出打印对话框。建议用 A4 纸打印后裁剪。
      </p>

      {loading && <p className="text-sm text-zinc-500">加载中…</p>}

      {fetchError && (
        <p className="text-sm text-red-600 dark:text-red-400">{fetchError}</p>
      )}

      {!loading && !fetchError && persons.length === 0 && (
        <p className="text-sm text-zinc-500 dark:text-zinc-400">暂无人员数据，请先在「导入名单」中导入。</p>
      )}

      {persons.length > 0 && (
        <div className="overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-800">
          <table className="min-w-[480px] w-full text-left text-sm">
            <thead className="bg-zinc-100 dark:bg-zinc-800">
              <tr>
                <th className="px-2 py-2 font-medium text-zinc-600 sm:px-3 dark:text-zinc-400">#</th>
                <th className="px-2 py-2 font-medium text-zinc-600 sm:px-3 dark:text-zinc-400">姓名</th>
                <th className="px-2 py-2 font-medium text-zinc-600 sm:px-3 dark:text-zinc-400">短码</th>
                <th className="px-2 py-2 font-medium text-zinc-600 sm:px-3 dark:text-zinc-400">已发布</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {persons.map((p, i) => (
                <tr key={p.id} className="bg-white dark:bg-zinc-900">
                  <td className="px-2 py-2 text-zinc-400 sm:px-3">{i + 1}</td>
                  <td className="px-2 py-2 text-zinc-900 sm:px-3 dark:text-zinc-100">
                    {p.chineseName ?? "\u2014"}
                  </td>
                  <td className="px-2 py-2 font-mono text-xs text-zinc-500 sm:px-3 dark:text-zinc-400">
                    {p.code}
                  </td>
                  <td className="px-2 py-2 sm:px-3">
                    {p.published ? (
                      <span className="text-emerald-600 dark:text-emerald-400 text-xs">是</span>
                    ) : (
                      <span className="text-zinc-400 text-xs">否</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  System Settings                                                    */
/* ------------------------------------------------------------------ */

function SettingsSection() {
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ ok: boolean; msg: string } | null>(null);

  useEffect(() => {
    fetch("/api/admin/settings")
      .then((r) => r.json())
      .then((data) => setSettings(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const allowPublish = settings["allowStudentPublishControl"] === "true";
  const hidePublishToggle = settings["hideStudentPublishToggle"] === "true";

  async function toggleSetting(key: string, value: string) {
    setSaving(key);
    setFeedback(null);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key, value }),
      });
      const data = await res.json();
      if (!res.ok) {
        setFeedback({ ok: false, msg: data.error ?? "保存失败" });
      } else {
        setSettings((prev) => ({ ...prev, [key]: value }));
        setFeedback({ ok: true, msg: "设置已保存" });
        setTimeout(() => setFeedback(null), 2000);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "网络错误";
      setFeedback({ ok: false, msg: message });
    } finally {
      setSaving(null);
    }
  }

  if (loading) {
    return <p className="text-sm text-zinc-500">加载中…</p>;
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-medium text-zinc-900 dark:text-zinc-100">系统设置</h2>

      <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex items-center justify-between gap-4">
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
              允许学生自主发布
            </p>
            <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
              开启后，学生在编辑页面会看到发布开关，可以自行控制主页是否公开。关闭后只有管理员可以发布主页。
            </p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={allowPublish}
            disabled={saving === "allowStudentPublishControl"}
            onClick={() =>
              toggleSetting(
                "allowStudentPublishControl",
                allowPublish ? "false" : "true"
              )
            }
            className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-zinc-500/20 focus:ring-offset-2 ${
              allowPublish ? "bg-zinc-900 dark:bg-zinc-100" : "bg-zinc-300 dark:bg-zinc-600"
            } ${saving === "allowStudentPublishControl" ? "cursor-not-allowed opacity-50" : ""}`}
          >
            <span
              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                allowPublish ? "translate-x-5" : "translate-x-0"
              } ${allowPublish ? "" : "dark:bg-zinc-400"}`}
            />
          </button>
        </div>
      </div>

      <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex items-center justify-between gap-4">
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
              隐藏学生端发布开关
            </p>
            <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
              开启后，学生编辑页面不再显示 Published 开关。适用于在活动开始前隐藏发布功能，但仍允许学生编辑个人资料。
            </p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={hidePublishToggle}
            disabled={saving === "hideStudentPublishToggle"}
            onClick={() =>
              toggleSetting(
                "hideStudentPublishToggle",
                hidePublishToggle ? "false" : "true"
              )
            }
            className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-zinc-500/20 focus:ring-offset-2 ${
              hidePublishToggle ? "bg-zinc-900 dark:bg-zinc-100" : "bg-zinc-300 dark:bg-zinc-600"
            } ${saving === "hideStudentPublishToggle" ? "cursor-not-allowed opacity-50" : ""}`}
          >
            <span
              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                hidePublishToggle ? "translate-x-5" : "translate-x-0"
              } ${hidePublishToggle ? "" : "dark:bg-zinc-400"}`}
            />
          </button>
        </div>
      </div>

      {feedback && (
        <p className={`text-sm ${feedback.ok ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}`}>
          {feedback.msg}
        </p>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Reset Password                                                     */
/* ------------------------------------------------------------------ */

function ResetPasswordSection() {
  const [code, setCode] = useState("");
  const [resetting, setResetting] = useState(false);
  const [newPassword, setNewPassword] = useState<string | null>(null);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!code.trim()) return;
    setResetting(true);
    setError("");
    setNewPassword(null);
    try {
      const res = await fetch("/api/admin/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: code.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "重置失败");
      } else {
        setNewPassword(data.password);
        setCode("");
      }
    } catch {
      setError("网络错误");
    } finally {
      setResetting(false);
    }
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-medium text-zinc-900 dark:text-zinc-100">重置密码</h2>
      <p className="text-sm text-zinc-500 dark:text-zinc-400">
        输入学生短码，为其重置登录密码。重置后新密码将在此显示一次，请及时保存。
      </p>

      <form onSubmit={handleSubmit} className="space-y-3 w-full max-w-md">
        <div>
          <label htmlFor="reset-code" className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">学生短码</label>
          <input
            id="reset-code"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="例如 abc123"
            className="block w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none transition-colors focus:border-zinc-500 focus:ring-1 focus:ring-zinc-400 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100 dark:focus:border-zinc-400"
          />
        </div>

        {error && (
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        )}

        {newPassword && (
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-900/50 dark:bg-emerald-950/50">
            <p className="mb-2 text-sm font-medium text-emerald-700 dark:text-emerald-300">新密码</p>
            <p className="mb-3 font-mono text-base text-emerald-800 dark:text-emerald-200">{newPassword}</p>
            <div className="flex items-center gap-2">
              <CopyButton value={newPassword} label="复制密码" />
            </div>
            <p className="mt-3 text-xs text-amber-600 dark:text-amber-400">⚠ 此密码只显示一次，关闭后无法再次查看。</p>
          </div>
        )}

        <button
          type="submit"
          disabled={resetting || !code.trim()}
          className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-700 disabled:opacity-40 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
        >
          {resetting ? "重置中\u2026" : "重置密码"}
        </button>
      </form>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Page Root                                                          */
/* ------------------------------------------------------------------ */

export default function AdminPage() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [loggingIn, setLoggingIn] = useState(false);
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [tab, setTab] = useState<TabId>("import");

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoginError("");
    setLoggingIn(true);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (!res.ok) {
        const data = await res.json();
        setLoginError(data.error ?? "登录失败");
      } else {
        setLoggedIn(true);
      }
    } catch {
      setLoginError("网络错误");
    } finally {
      setLoggingIn(false);
    }
  }

  if (!loggedIn) {
    return (
      <LoginScreen
        password={password}
        setPassword={setPassword}
        onSubmit={handleLogin}
        error={loginError}
        loading={loggingIn}
      />
    );
  }

  return <Dashboard tab={tab} onTabChange={setTab} />;
}