import { Dashboard } from '@/src/lib/features/dashboard'
import DashboardLayout from '@/src/lib/features/global/dashboard-layout'

export default function HomePage() {
  return (
    <DashboardLayout>
      <Dashboard />
    </DashboardLayout>
  )
}
