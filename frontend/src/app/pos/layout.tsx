import { PosPlanGuard } from '@/src/components/pos/PosPlanGuard';

export default function PosLayout({ children }: { children: React.ReactNode }) {
  return <PosPlanGuard>{children}</PosPlanGuard>;
}
