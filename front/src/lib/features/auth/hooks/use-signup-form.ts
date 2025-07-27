import { supabaseBrowserClient } from "@/src/lib/supabase/client"
import { zodResolver } from "@hookform/resolvers/zod"
import { useState } from "react"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { signupSchema } from "../forms/schema"
import env from "@/src/lib/env"

export function useSignupForm() {
    const [loading, setLoading] = useState(false)
    const [serverError, setServerError] = useState("")
    const [successMessage, setSuccessMessage] = useState("")

    const googleRedirectTo = `${env.NEXT_PUBLIC_APP_URL}/api/auth/callback`
    const emailRedirectTo = `${env.NEXT_PUBLIC_APP_URL}/`

    const form = useForm<z.infer<typeof signupSchema>>({
        resolver: zodResolver(signupSchema),
        defaultValues: {
            email: "",
            password: "",
            confirmPassword: "",
        },
    })

    const handleSignUp = async (values: z.infer<typeof signupSchema>) => {
        setLoading(true)
        setServerError("")
        try {
            const { error } = await supabaseBrowserClient.auth.signUp({
                email: values.email,
                password: values.password,
                options: {
                    emailRedirectTo: emailRedirectTo
                }
            })
            if (error) throw error
            form.reset()
            setSuccessMessage("Sign up successful. Please check your email for verification.")
           
        } catch (error: any) {
            setServerError(error.message || "Failed to sign up. Please try again.")
        } finally {
            setLoading(false)
        }
    }

    const handleGoogleLogin = async () => {
        setLoading(true)
        setServerError("")
        try {
            const { error } = await supabaseBrowserClient.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: googleRedirectTo
                }
            })
            if (error) throw error
        } catch (error: any) {
            setServerError(error.message || "Failed to sign up with Google. Please try again.")
            setLoading(false)
        }
    }

    return {
        form,
        loading,
        serverError,
        handleSignUp,
        handleGoogleLogin,
        successMessage
    }
}