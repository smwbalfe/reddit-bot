export type SocialAuthButtonProps = {
  provider: "google" 
  text: string
  onClick: () => void
  loading?: boolean
}

export type AuthAlertProps = {
  type: 'error' | 'success'
  message: string
}

export type LoginFormProps = {
  onSwitchMode: (mode: "login" | "reset" | "signup") => void
}

export type ResetFormProps = {
  onSwitchMode: (mode: "login" | "reset" | "signup") => void
}