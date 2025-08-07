import { z } from "zod"
import { loginSchema, signupSchema, resetSchema } from "../forms/schema"

export type LoginFormValues = z.infer<typeof loginSchema>
export type SignupFormValues = z.infer<typeof signupSchema>
export type ResetFormValues = z.infer<typeof resetSchema>

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