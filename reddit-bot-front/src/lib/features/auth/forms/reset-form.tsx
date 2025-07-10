import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { Button } from "@/src/lib/components/ui/button"
import { Input } from "@/src/lib/components/ui/input"
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/src/lib/components/ui/form"
import { usePasswordReset } from "../hooks/use-password-reset"
import { resetSchema } from "./schema"
import { AuthAlert } from "../components"

type ResetFormProps = {
    onSwitchMode: (mode: "login" | "reset" | "signup") => void
}

export function ResetForm({ onSwitchMode }: ResetFormProps) {
    const { loading, serverError, successMessage, handlePasswordReset } = usePasswordReset()
    
    const form = useForm<z.infer<typeof resetSchema>>({
        resolver: zodResolver(resetSchema),
        defaultValues: {
            email: "",
        },
    })

    const onSubmit = async (values: z.infer<typeof resetSchema>) => {
        const result = await handlePasswordReset(values)
        if (result.success) {
            form.reset()
        }
    }
    
    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <AuthAlert message={serverError} type="error" />
                <AuthAlert message={successMessage} type="success" />
                <p className="text-sm text-muted-foreground">
                    Enter your email address below and we'll send you a link to reset your password.
                </p>
                <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                        <FormItem>
                            <FormControl>
                                <Input
                                    placeholder="Enter your email"
                                    {...field}
                                    disabled={loading}
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <Button type="submit" className="w-full text-white" disabled={loading}>
                    {loading ? "Sending..." : "Send Reset Link"}
                </Button>
                <Button
                    type="button"
                    variant="outline"
                    className="w-full hover:bg-gray-100 hover:text-foreground"
                    onClick={() => onSwitchMode("login")}
                    disabled={loading}
                >
                    Back to Login
                </Button>
            </form>
        </Form>
    )
} 