"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import AvatarUploader from "@/components/AvatarUploader";
import ImageGrid from "@/components/ImageGrid";

interface PersonData {
  englishName: string | null;
  chineseName: string | null;
  grade: string | null;
  bio: string | null;
  avatarUrl: string | null;
  published: boolean;
}

interface DisplayImage {
  id: string;
  url: string;
  sort: number;
}

export default function EditPage() {
  const { token } = useParams<{ token: string }>();

  const [form, setForm] = useState<PersonData>({
    englishName: "",
    chineseName: "",
    grade: "",
    bio: "",
    avatarUrl: "",
    published: false,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [images, setImages] = useState<DisplayImage[]>([]);
  const [saveMessage, setSaveMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [dirty, setDirty] = useState(false);

  const bioCodePoints = [...(form.bio || "")].length;
  const bioOverLimit = bioCodePoints > 80;
  const canPublish = !!form.avatarUrl;
  const saveDisabled = saving || bioOverLimit;

  // ── Fetch person data on mount ──

  useEffect(() => {
    if (!token) return;

    fetch(`/api/me?token=${token}`)
      .then(async (res) => {
        if (res.status === 403) throw new Error("Invalid or expired editing link");
        if (!res.ok) throw new Error("Failed to load profile");
        return res.json();
      })
      .then((data) => {
        const p = data.person;
        if (p) {
          setForm({
            englishName: p.englishName ?? "",
            chineseName: p.chineseName ?? "",
            grade: p.grade ?? "",
            bio: p.bio ?? "",
            avatarUrl: p.avatarUrl ?? "",
            published: p.published,
          });
          setImages(data.images ?? []);
        }
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, [token]);

  const updateField = useCallback(
    <K extends keyof PersonData>(field: K, value: PersonData[K]) => {
      setForm((prev) => ({ ...prev, [field]: value }));
      if (!dirty) setDirty(true);
    },
    [dirty],
  );

  // ── Save handler ──

  const handleSave = useCallback(async () => {
    if (bioOverLimit) {
      setSaveMessage({
        type: "error",
        text: `Bio exceeds 80 characters (${bioCodePoints}/80)`,
      });
      return;
    }
    if (form.published && !canPublish) {
      setSaveMessage({
        type: "error",
        text: "Upload an avatar before publishing",
      });
      return;
    }

    setSaving(true);
    setSaveMessage(null);

    try {
      const res = await fetch(`/api/me?token=${token}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          englishName: form.englishName || null,
          chineseName: form.chineseName || null,
          grade: form.grade || null,
          bio: form.bio || null,
          avatarUrl: form.avatarUrl || null,
          published: form.published,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Save failed (${res.status})`);
      }

      setSaveMessage({ type: "success", text: "Saved!" });
      setDirty(false);
      setTimeout(() => setSaveMessage(null), 3000);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "An unexpected error occurred";
      setSaveMessage({ type: "error", text: message });
    } finally {
      setSaving(false);
    }
  }, [form, token, bioOverLimit, canPublish, bioCodePoints]);

  // ── Loading state ──

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-stone-50">
        <div className="text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-stone-300 border-t-teal-600" />
          <p className="mt-4 text-sm text-stone-500">Loading your profile…</p>
        </div>
      </div>
    );
  }

  // ── Error / invalid-token state ──

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-stone-50 p-4">
        <div className="w-full max-w-sm rounded-2xl bg-white p-8 text-center shadow-sm">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-50">
            <svg
              className="h-6 w-6 text-red-500"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="1.5"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z"
              />
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-stone-900">
            Link Invalid
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-stone-500">
            {error}
          </p>
        </div>
      </div>
    );
  }

  // ── Form ──

  return (
    <div className="min-h-screen bg-gradient-to-b from-stone-50 to-stone-100 py-8 px-4">
      <div className="mx-auto max-w-md">
        <div className="mb-8">
          <h1 className="text-2xl font-bold tracking-tight text-stone-900">
            Edit Profile
          </h1>
          <p className="mt-1.5 text-sm text-stone-500">
            Set up your OWeek personal homepage
          </p>
        </div>

        <div className="mb-6 rounded-2xl bg-white p-4 shadow-sm">
          <AvatarUploader
            token={token}
            currentUrl={form.avatarUrl}
            onAvatarChange={(url) => updateField("avatarUrl", url)}
          />
        </div>

        <div className="space-y-5 rounded-2xl bg-white p-6 shadow-sm">

          {/* English Name */}
          <div>
            <label
              htmlFor="englishName"
              className="mb-1.5 block text-sm font-medium text-stone-700"
            >
              English Name
            </label>
            <input
              id="englishName"
              type="text"
              value={form.englishName ?? ""}
              onChange={(e) => updateField("englishName", e.target.value)}
              placeholder="e.g. Alex"
              className="w-full rounded-xl border border-stone-200 bg-white px-4 py-2.5 text-sm text-stone-900 placeholder-stone-400 transition-all focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
            />
          </div>

          {/* Chinese Name */}
          <div>
            <label
              htmlFor="chineseName"
              className="mb-1.5 block text-sm font-medium text-stone-700"
            >
              Chinese Name
            </label>
            <input
              id="chineseName"
              type="text"
              value={form.chineseName ?? ""}
              onChange={(e) => updateField("chineseName", e.target.value)}
              placeholder="e.g. 张三"
              className="w-full rounded-xl border border-stone-200 bg-white px-4 py-2.5 text-sm text-stone-900 placeholder-stone-400 transition-all focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
            />
          </div>

          {/* Grade */}
          <div>
            <label
              htmlFor="grade"
              className="mb-1.5 block text-sm font-medium text-stone-700"
            >
              Grade
            </label>
            <input
              id="grade"
              type="text"
              value={form.grade ?? ""}
              onChange={(e) => updateField("grade", e.target.value)}
              placeholder="e.g. 2026"
              className="w-full rounded-xl border border-stone-200 bg-white px-4 py-2.5 text-sm text-stone-900 placeholder-stone-400 transition-all focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
            />
          </div>

          {/* Bio */}
          <div>
            <label
              htmlFor="bio"
              className="mb-1.5 block text-sm font-medium text-stone-700"
            >
              Bio
            </label>
            <textarea
              id="bio"
              value={form.bio ?? ""}
              onChange={(e) => updateField("bio", e.target.value)}
              rows={3}
              placeholder="Tell us a bit about yourself…"
              className={`w-full rounded-xl border bg-white px-4 py-2.5 text-sm text-stone-900 placeholder-stone-400 transition-all focus:outline-none focus:ring-2 ${
                bioOverLimit
                  ? "border-red-300 focus:border-red-500 focus:ring-red-500/20"
                  : "border-stone-200 focus:border-teal-500 focus:ring-teal-500/20"
              }`}
            />
            <div className="mt-1.5 flex items-center justify-between">
              {bioOverLimit && (
                <p className="text-xs text-red-500">
                  {bioCodePoints - 80} character{bioCodePoints - 80 > 1 ? "s" : ""} over limit
                </p>
              )}
              <span
                className={`ml-auto text-xs ${
                  bioOverLimit
                    ? "font-semibold text-red-500"
                    : "text-stone-400"
                }`}
              >
                {bioCodePoints}/80
              </span>
            </div>
          </div>

          <ImageGrid
            token={token}
            images={images}
            onImagesChange={setImages}
          />

          <div className="flex items-center justify-between rounded-xl bg-stone-50 p-4">
            <div>
              <p className="text-sm font-medium text-stone-900">Published</p>
              <p className="mt-0.5 text-xs text-stone-500">
                {canPublish
                  ? "Make your profile visible to everyone"
                  : "Avatar required before publishing"}
              </p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={form.published}
              disabled={!canPublish}
              onClick={() => updateField("published", !form.published)}
              className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:ring-offset-2 ${
                form.published ? "bg-teal-600" : "bg-stone-300"
              } ${!canPublish ? "cursor-not-allowed opacity-50" : ""}`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  form.published ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </div>
        </div>

        {/* Save button */}
        <button
          type="button"
          onClick={handleSave}
          disabled={saveDisabled}
          className="mt-6 w-full rounded-xl bg-teal-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:bg-teal-700 active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-teal-500/20 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save"}
        </button>

        {/* Feedback */}
        {saveMessage && (
          <div className="mt-4 text-center">
            <p
              className={`text-sm ${
                saveMessage.type === "success"
                  ? "text-emerald-600"
                  : "text-red-500"
              }`}
            >
              {saveMessage.type === "success" ? "✓ " : "✕ "}
              {saveMessage.text}
            </p>
          </div>
        )}

        {/* Footer hint */}
        {!dirty && !saveMessage && (
          <p className="mt-6 text-center text-xs text-stone-400">
            Changes are auto-saved when you press Save
          </p>
        )}
      </div>
    </div>
  );
}