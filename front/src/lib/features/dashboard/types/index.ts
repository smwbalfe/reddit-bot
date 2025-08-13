

export interface DashboardMetrics {
  totalLeads: number
  avgLeadQuality: number
  todayLeads: number
  weekLeads: number
  leadDistribution: {
    neverLeads: number
    minimalLeads: number
    moderateLeads: number
    genuineLeads: number
    strongLeads: number
    readyLeads: number
  }
}

export interface DashboardLayoutProps {
  children: React.ReactNode
}