export type SidebarContextProps = {
  state: 'expanded' | 'collapsed'
  open: boolean
  setOpen: (open: boolean) => void
  openMobile: boolean
  setOpenMobile: (open: boolean) => void
  isMobile: boolean
  toggleSidebar: () => void
}

export interface SidebarProps {
  children?: React.ReactNode
  className?: string
}

export type FormFieldContextValue<
  TFieldValues extends import('react-hook-form').FieldValues = import('react-hook-form').FieldValues,
  TName extends import('react-hook-form').FieldPath<TFieldValues> = import('react-hook-form').FieldPath<TFieldValues>
> = {
  name: TName
}

export type FormItemContextValue = {
  id: string
}

export type WelcomeEmailProps = {
  name?: string
}