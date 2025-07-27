import { supabaseBrowserClient } from "@/src/lib/supabase/client"
import { zodResolver } from "@hookform/resolvers/zod"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { useForm } from "react-hook-form"
import { loginSchema } from "../forms/schema"
import env from "@/src/lib/env"

const useLoginForm = () => {
    const [loading, setLoading] = useState(false)
    const [serverError, setServerError] = useState("")
    const router = useRouter()

    const form = useForm<any>({
        resolver: zodResolver(loginSchema),
        defaultValues: {
            email: "",
            password: "",
            remember: false,
        },
    })

    const handleEmailLogin = async (values: any) => {
        setLoading(true)
        setServerError("")
        try {
            const { error } = await supabaseBrowserClient.auth.signInWithPassword({
                email: values.email,
                password: values.password,
            })
            if (error) throw error
            router.push('/')
        } catch (error: any) {
            setServerError(error.message || "Failed to sign in. Please try again.")
            console.log(error)
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
                    redirectTo: `${env.NEXT_PUBLIC_APP_URL}/api/auth/callback`
                }
            })
            if (error) throw error
        } catch (error: any) {
            setServerError(error.message || "Failed to sign in with Google. Please try again.")
            console.log(error)
            setLoading(false)
        }
    }

    return {
        form,
        loading,
        serverError,
        handleEmailLogin,
        handleGoogleLogin
    }
}

export default useLoginForm