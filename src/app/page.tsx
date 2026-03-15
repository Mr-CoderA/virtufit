import { getSession } from '@/lib/auth';
import { HomeHero } from './HomeHero';

export default async function HomePage() {
  const session = await getSession();

  return (
    <div className="relative min-h-[calc(100vh-80px)] flex flex-col items-center justify-center bg-[#1A1915] px-4 pt-20 pb-16 md:pt-[80px] md:pb-[64px]">
      <HomeHero isLoggedIn={!!session} />
    </div>
  );
}
