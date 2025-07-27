import { Dashboard } from '@/src/lib/features/dashboard'
import DashboardLayout from '@/src/lib/components/dashboard-layout'

export default function HomePage() {
  return (
    <DashboardLayout>
      <Dashboard />
    </DashboardLayout>
  )
}
