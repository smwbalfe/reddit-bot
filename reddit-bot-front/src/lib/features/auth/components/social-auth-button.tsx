import { FcGoogle } from "react-icons/fc"
import { Button } from "@/src/lib/components/ui/button"

type SocialAuthButtonProps = {
    provider: "google" 
    text: string
    onClick: () => void
    loading?: boolean
}

export function SocialAuthButton({ 
    provider, 
    text, 
    onClick, 
    loading = false 
}: SocialAuthButtonProps) {
    return (
        <Button
            type="button"
            variant="outline"
            className="w-full hover:bg-gray-100"
            onClick={onClick}
            disabled={loading}
        >
            {provider === "google" && <FcGoogle className="mr-2 size-5" />}
            {text}
        </Button>
    )
} 