'use client';

import { useRouter } from 'next/navigation';

export function useNavigate() {
  const router = useRouter();
  return (destination: string) => router.push(destination);
}
