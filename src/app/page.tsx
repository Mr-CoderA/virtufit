import FittingRoom from '@/components/fitting-room/FittingRoom';
export default async function HomePage({ searchParams }: { searchParams: Promise<{ mode?: string | string[] }> }) {
 const query = await searchParams; const mode = query.mode === 'photo' ? 'photo' : 'live';
 return <FittingRoom initialMode={mode} key={mode}/>;
}
