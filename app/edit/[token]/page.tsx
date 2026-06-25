"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
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
  const [allowPublishControl, setAllowPublishControl] = useState(false);
  const [hidePublishToggle, setHidePublishToggle] = useState(false);
  const [hasBeenEdited, setHasBeenEdited] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [collectionCount, setCollectionCount] = useState(0);
  const [personCode, setPersonCode] = useState("");

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
          setPersonCode(p.code ?? "");
        }
        const profileIsBlank = !(
          p?.chineseName ||
          p?.englishName ||
          p?.grade ||
          p?.bio ||
          p?.avatarUrl ||
          (data.images && data.images.length > 0)
        );
        setHasBeenEdited(!profileIsBlank);
        setIsEditing(profileIsBlank);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, [token]);

  // ── Fetch system settings ──

  useEffect(() => {
    Promise.all([
      fetch("/api/settings?key=allowStudentPublishControl").then(r => r.json()),
      fetch("/api/settings?key=hideStudentPublishToggle").then(r => r.json()),
    ])
      .then(([pubData, hideData]) => {
        if (pubData.value === "true") setAllowPublishControl(true);
        if (hideData.value === "true") setHidePublishToggle(true);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("owk_collection");
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) setCollectionCount(parsed.length);
      }
    } catch {}
  }, []);

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
      setHasBeenEdited(true);
      setIsEditing(false);
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
        <div className="mb-8 flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-stone-900">
              {isEditing ? "Edit Profile" : "My Profile"}
            </h1>
            <p className="mt-1.5 text-sm text-stone-500">
              {isEditing
                ? "Set up your OWeek personal homepage"
                : "Your OWeek showcase"}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {personCode && (
              <Link
                href={`/loc/${personCode}`}
                className="flex h-10 w-10 items-center justify-center rounded-xl bg-stone-100 text-stone-500 transition-colors hover:bg-amber-50 hover:text-amber-600"
                aria-label="View position"
                title="查看展位"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                  <title>View position</title>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
                </svg>
              </Link>
            )}
            <Link
              href="/me/collection"
              className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-stone-100 text-stone-500 transition-colors hover:bg-rose-50 hover:text-rose-600"
              aria-label="My collection"
              title="我的收藏"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                <title>My collection</title>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" />
              </svg>
              {collectionCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] rounded-full bg-rose-400 text-white text-[10px] font-bold flex items-center justify-center px-1 shadow-sm">
                  {collectionCount}
                </span>
              )}
            </Link>
            {hasBeenEdited && (
              <button
                type="button"
                onClick={() => setIsEditing((v) => !v)}
                className="flex h-10 w-10 items-center justify-center rounded-xl bg-stone-100 text-stone-500 transition-colors hover:bg-stone-200 hover:text-stone-700"
                aria-label={isEditing ? "Lock editing" : "Edit profile"}
              >
                {isEditing ? (
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                    <title>Lock</title>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
                  </svg>
                ) : (
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                    <title>Edit</title>
                    <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
                  </svg>
                )}
              </button>
            )}
          </div>
        </div>

        <div className="mb-6 rounded-2xl bg-white p-4 shadow-sm">
          <AvatarUploader
            token={token}
            currentUrl={form.avatarUrl}
            onAvatarChange={(url) => updateField("avatarUrl", url)}
            disabled={!isEditing}
          />
        </div>

        <Link
            href="/me/collection"
            className="mb-6 flex items-center gap-2 rounded-2xl bg-white p-4 shadow-sm text-sm font-medium text-stone-700 transition-colors hover:bg-rose-50 hover:text-rose-600"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
              <title>My collection</title>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" />
            </svg>
            我的收藏{collectionCount > 0 ? ` (${collectionCount})` : ''}
            <svg className="ml-auto h-4 w-4 text-stone-300" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
              <title>Go</title>
              <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
            </svg>
          </Link>

        <div className="space-y-5 rounded-2xl bg-white p-6 shadow-sm">
          {isEditing ? (
            <>
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
                disabled={false}
              />

              {allowPublishControl && !hidePublishToggle && (
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
              )}
            </>
          ) : (
            <>
              {(form.chineseName || form.englishName) && (
                <div>
                  <p className="mb-1 text-xs font-medium uppercase tracking-wider text-stone-400">Name</p>
                  <p className="text-sm text-stone-900">
                    {[form.englishName, form.chineseName].filter(Boolean).join(" / ")}
                  </p>
                </div>
              )}
              {form.grade && (
                <div>
                  <p className="mb-1 text-xs font-medium uppercase tracking-wider text-stone-400">Grade</p>
                  <p className="text-sm text-stone-900">{form.grade}</p>
                </div>
              )}
              {form.bio && (
                <div>
                  <p className="mb-1 text-xs font-medium uppercase tracking-wider text-stone-400">Bio</p>
                  <p className="text-sm leading-relaxed text-stone-700 whitespace-pre-wrap">{form.bio}</p>
                </div>
              )}
              <ImageGrid
                token={token}
                images={images}
                onImagesChange={setImages}
                disabled={true}
              />
              {!hidePublishToggle && (
                <div className="flex items-center justify-between rounded-xl bg-stone-50 p-4">
                  <p className="text-sm font-medium text-stone-900">Published</p>
                  <span
                    className={`inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full border-2 border-transparent ${
                      form.published ? "bg-teal-600" : "bg-stone-300"
                    }`}
                  >
                    <span
                      className={`inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition ${
                        form.published ? "translate-x-5" : "translate-x-0"
                      }`}
                    />
                  </span>
                </div>
              )}
            </>
          )}
        </div>

        {isEditing && (
          <>
            <button
              type="button"
              onClick={handleSave}
              disabled={saveDisabled}
              className="mt-6 w-full rounded-xl bg-teal-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:bg-teal-700 active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-teal-500/20 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? "Saving…" : "Save"}
            </button>

            {hasBeenEdited && (
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="mt-2 w-full rounded-xl bg-stone-100 px-6 py-3 text-sm font-medium text-stone-600 transition-colors hover:bg-stone-200"
              >
                Cancel
              </button>
            )}
          </>
        )}

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

        {!dirty && !saveMessage && isEditing && (
          <p className="mt-6 text-center text-xs text-stone-400">
            Changes are auto-saved when you press Save
          </p>
        )}
      </div>
    </div>
  );
}