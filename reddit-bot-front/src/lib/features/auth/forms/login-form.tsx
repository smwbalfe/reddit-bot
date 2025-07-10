import { Button } from "@/src/lib/components/ui/button"
import { Input } from "@/src/lib/components/ui/input"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/src/lib/components/ui/form"
import useLoginForm from "../hooks/use-login-form"
import { AuthAlert, FormDivider, SocialAuthButton } from "../components"

type LoginFormProps = {
    onSwitchMode: (mode: "login" | "reset" | "signup") => void
}

export function LoginForm({ onSwitchMode }: LoginFormProps) {
    const { form, loading, serverError, handleEmailLogin, handleGoogleLogin } = useLoginForm()

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(handleEmailLogin)} className="space-y-4">
                <AuthAlert message={serverError} type="error" />
                <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Email</FormLabel>
                            <FormControl>
                                <Input
                                    placeholder="Enter your email"
                                    type="email"
                                    {...field}
                                    disabled={loading}
                                />
                            </FormControl>
                            <FormMessage className="text-red-500" />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Password</FormLabel>
                            <FormControl>
                                <Input
                                    placeholder="Enter your password"
                                    type="password"
                                    {...field}
                                    disabled={loading}
                                />
                            </FormControl>
                            <FormMessage className="text-red-500" />
                        </FormItem>
                    )}
                />
                <div className="flex justify-center">
                    <button
                        type="button"
                        onClick={() => onSwitchMode("reset")}
                        className="text-sm text-primary hover:underline"
                    >
                        Forgot password?
                    </button>
                </div>
                <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white" disabled={loading}>
                    {loading ? "Loading..." : "Log in"}
                </Button>
                <FormDivider />
                <SocialAuthButton
                    provider="google"
                    text={"Log in with Google"}
                    onClick={handleGoogleLogin}
                    loading={loading}
                />
            </form>
        </Form>
    )
}