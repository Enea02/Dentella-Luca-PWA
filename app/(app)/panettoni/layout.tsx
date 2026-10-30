import { PanettoniShell } from '@/components/panettoni/PanettoniShell'

export default function PanettoniLayout({ children }: { children: React.ReactNode }) {
  return <PanettoniShell>{children}</PanettoniShell>
}
