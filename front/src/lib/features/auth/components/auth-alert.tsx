import { Alert, AlertDescription } from "@/src/lib/components/ui/alert"
import { AlertCircle, CheckCircle } from "lucide-react"
import { AuthAlertProps } from "@/src/lib/features/auth/types"

export function AuthAlert({ message, type }: AuthAlertProps) {
    if (!message) return null
    
    return (
        <Alert 
            variant={type === "error" ? "destructive" : "default"} 
            className={`mb-4 ${type === "error" ? "text-red-500" : "text-green-700"}`}
        >
            {type === "error" ? 
                <AlertCircle className="h-4 w-4" /> : 
                <CheckCircle className="h-4 w-4" />
            }
            <AlertDescription>{message}</AlertDescription>
        </Alert>
    )
} 