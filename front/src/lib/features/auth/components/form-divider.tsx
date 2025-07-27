export function FormDivider({ text = "Or continue with" }: { text?: string }) {
    return (
        <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border"></span>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white dark:bg-gray-950 px-4 text-muted-foreground">{text}</span>
            </div>
        </div>
    )
} 