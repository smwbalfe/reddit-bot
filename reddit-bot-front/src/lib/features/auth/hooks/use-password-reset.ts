import { useState } from "react"
import { supabaseBrowserClient } from "@/src/lib/supabase/client"
import * as z from "zod"
import { resetSchema } from "../forms/schema"

export function usePasswordReset() {
  const [loading, setLoading] = useState(false)
  const [serverError, setServerError] = useState("")
  const [successMessage, setSuccessMessage] = useState("")

  const handlePasswordReset = async (values: z.infer<typeof resetSchema>) => {
    setLoading(true)
    setServerError("")
    try {
      const { error } = await supabaseBrowserClient.auth.resetPasswordForEmail(values.email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      })
      if (error) throw error 
      setSuccessMessage("Reset link sent to email")
      return { success: true }
    } catch (error: any) {
      setServerError(error.message || "Failed to send reset link. Please try again.")
      console.log(error)
      return { success: false, error }
    } finally {
      setLoading(false)
    }
  }

  return {
    loading,
    serverError,
    successMessage,
    handlePasswordReset
  }
} 