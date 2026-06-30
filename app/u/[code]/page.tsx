import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { verifyStudentSession } from '@/lib/auth'
import ImageGallery from './ImageGallery'
import FavoriteButton from '@/app/loc/[code]/FavoriteButton'

interface PageProps {
  params: Promise<{ code: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { code } = await params
  const person = await prisma.person.findUnique({
    where: { code },
    select: { chineseName: true, hidden: true },
  })
  if (!person || person.hidden) return { title: '页面不存在' }
  return { title: `${person.chineseName || code}的主页` }
}

export default async function ProfilePage({ params }: PageProps) {
  const { code } = await params

  const session = await verifyStudentSession();
  if (!session) {
    redirect('/?next=' + encodeURIComponent('/u/' + code));
  }

  const person = await prisma.person.findUnique({
    where: { code },
    include: {
      images: {
        where: { hidden: false },
        orderBy: { sort: 'asc' },
      },
      location: true,
    },
  })

  if (!person || person.hidden) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50 px-6">
        <div className="text-center max-w-xs">
          <div className="text-5xl mb-5">🙈</div>
          <h1 className="text-lg font-semibold text-zinc-900 mb-1.5">
            该页面已隐藏
          </h1>
          <p className="text-sm text-zinc-500 leading-relaxed">
            这位同学暂时关闭了个人主页
          </p>
        </div>
      </div>
    )
  }

  const profileIsReady = Boolean(
    person.avatarUrl && (person.englishName || person.chineseName),
  );

  if (!profileIsReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50 px-6">
        <div className="text-center max-w-xs">
          <div className="text-5xl mb-5">📝</div>
          <h1 className="text-lg font-semibold text-zinc-900 mb-1.5">
            这位同学还没布置主页
          </h1>
          <p className="text-sm text-zinc-500 leading-relaxed">
            等他准备好了再来看看吧
          </p>
        </div>
      </div>
    )
  }

  const displayImages = person.images.filter((img) => !img.hidden);

  let initialFavorited = false;
  if (session) {
    const existing = await prisma.favorite.findUnique({
      where: {
        favoriterId_favoriteeId: {
          favoriterId: session.personId,
          favoriteeId: person.id,
        },
      },
    });
    initialFavorited = !!existing;
  }

  const showFavoriteButton =
    session && person && !person.hidden && profileIsReady &&
    session.personId !== person.id;

  return (
    <div className="min-h-screen bg-zinc-50">
      <div className="max-w-md mx-auto px-5 py-12">
        <div className="flex justify-end mb-2">
          <Link
            href={`/loc/${code}`}
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-white shadow-sm text-zinc-400 transition-colors hover:bg-amber-50 hover:text-amber-600"
            aria-label="View position"
            title="查看展位"
          >
            <svg className="h-[18px] w-[18px]" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
              <title>View position</title>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
            </svg>
          </Link>
        </div>
        <div className="flex justify-center mb-5">
          {person.avatarUrl ? (
            <div className="relative w-24 h-24 rounded-full overflow-hidden ring-2 ring-white shadow-md">
              <Image
                src={person.avatarUrl}
                alt=""
                fill
                unoptimized
                className="object-cover"
              />
            </div>
          ) : (
            <div className="w-24 h-24 rounded-full bg-zinc-200 flex items-center justify-center ring-2 ring-white shadow-md">
              <span className="text-2xl text-zinc-400 font-medium">?</span>
            </div>
          )}
        </div>

        <h1 className="text-center text-xl font-semibold text-zinc-900 mb-1">
          {person.englishName && <span>{person.englishName}</span>}
          {person.englishName && person.chineseName && (
            <span> · </span>
          )}
          {person.chineseName && <span>{person.chineseName}</span>}
        </h1>

        {person.grade && (
          <p className="text-center text-sm text-zinc-500 mb-4">
            {person.grade}
          </p>
        )}

        {person.bio && (
          <p className="text-center text-sm text-zinc-700 leading-relaxed mb-8 whitespace-pre-line">
            {person.bio}
          </p>
        )}

        {showFavoriteButton && (
          <div className="flex justify-center mb-8">
            <FavoriteButton
              code={person.code}
              initialFavorited={initialFavorited}
            />
          </div>
        )}

        {displayImages.length > 0 && (
          <ImageGallery images={displayImages.map((img) => ({ id: img.id, url: img.url }))} />
        )}
      </div>
    </div>
  )
}
