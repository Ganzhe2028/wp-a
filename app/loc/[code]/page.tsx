import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { prisma } from "@/lib/prisma";
import { verifyStudentSession } from "@/lib/auth";
import FavoriteButton from "./FavoriteButton";

interface Props {
  params: Promise<{ code: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { code } = await params
  const location = await prisma.locationCard.findUnique({
    where: { code },
    select: { name: true },
  })
  if (!location) return { title: '位置不存在' }
  return { title: `${location.name}的位置` }
}

export default async function LocationCardPage({ params }: Props) {
  const { code } = await params;

  const session = await verifyStudentSession();
  if (!session) {
    redirect('/?next=' + encodeURIComponent('/loc/' + code));
  }

  const location = await prisma.locationCard.findUnique({
    where: { code },
    include: { person: { select: { id: true, chineseName: true, grade: true } } },
  });

  if (!location) {
    return <PlaceholderPage />;
  }

  let initialFavorited = false;
  if (session && location.person) {
    const existing = await prisma.favorite.findUnique({
      where: {
        favoriterId_favoriteeId: {
          favoriterId: session.personId,
          favoriteeId: location.person.id,
        },
      },
    });
    initialFavorited = !!existing;
  }

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center bg-gradient-to-b from-amber-50 to-white px-4">
      <div className="w-full max-w-md">
        {/* Card */}
        <div className="rounded-3xl bg-white px-8 py-12 shadow-lg shadow-amber-100/50 ring-1 ring-amber-100">
          {/* Name & Grade */}
          <div className="mb-8 text-center">
            <h1 className="text-2xl font-bold tracking-tight text-zinc-900">
              {location.name}
            </h1>
            {(location.grade ?? location.person.grade) && (
              <p className="mt-1 text-sm text-zinc-500">
                {location.grade ?? location.person.grade}
              </p>
            )}
          </div>

          {/* Room & Seat — THE MAIN JOB */}
          <div className="mb-8 grid grid-cols-2 gap-4">
            <div className="rounded-2xl bg-amber-50 p-4 text-center ring-1 ring-amber-200">
              <p className="mb-1 text-xs font-medium uppercase tracking-widest text-amber-500">
                房间
              </p>
              <p className="text-4xl font-black leading-none tracking-tight text-amber-700 sm:text-5xl">
                {location.room}
              </p>
            </div>
            <div className="rounded-2xl bg-amber-50 p-4 text-center ring-1 ring-amber-200">
              <p className="mb-1 text-xs font-medium uppercase tracking-widest text-amber-500">
                座位
              </p>
              <p className="text-4xl font-black leading-none tracking-tight text-amber-700 sm:text-5xl">
                {location.seat}
              </p>
            </div>
          </div>

          {/* Guidance */}
          <div className="mb-8 rounded-xl bg-zinc-50 px-5 py-4 text-center text-sm leading-relaxed text-zinc-600 ring-1 ring-zinc-100">
            走到{" "}
            <span className="font-semibold text-zinc-800">
              {location.room}
            </span>{" "}
            房间
            <span className="font-semibold text-zinc-800">
              {" "}
              {location.seat}
            </span>
            号位找到 TA，到展位碰展板看主页
            <span className="block mt-1 text-xs text-zinc-400">
              📍 位置由 TA 设置 · 到展位可扫码或碰 NFC
            </span>
          </div>

          {session.personId !== location.person?.id && (
            <div className="flex justify-center">
              <FavoriteButton
                code={location.code}
                name={location.name}
                initialFavorited={initialFavorited}
              />
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

function PlaceholderPage() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center bg-gradient-to-b from-amber-50 to-white px-4">
      <div className="w-full max-w-md text-center">
        <div className="rounded-3xl bg-white px-8 py-16 shadow-lg shadow-amber-100/50 ring-1 ring-amber-100">
          {/* Ghost icon */}
          <div className="mb-6 flex justify-center">
            <svg
              viewBox="0 0 24 24"
              className="h-16 w-16 text-amber-300"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.5}
              aria-hidden="true"
            >
              <title>未设置</title>
              <circle cx="12" cy="12" r="10" />
              <path
                strokeLinecap="round"
                d="M8 10h.01M16 10h.01M9 16c0 0 1.5 1.5 3 1.5s3-1.5 3-1.5"
              />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-zinc-800">
            位置信息未设置
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-zinc-500">
            这位同学还没有设置展位位置，等 TA 布置好了再来看看吧
          </p>
        </div>
      </div>
    </main>
  );
}