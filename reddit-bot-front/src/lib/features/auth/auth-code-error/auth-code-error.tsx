import { useRouter } from "next/navigation"

export const AuthCodeError = () => {
  const router = useRouter()

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="w-[400px] rounded-lg border p-6 shadow-lg">
        <div className="mb-4">
          <h2 className="text-2xl font-bold">Authentication Error</h2>
          <p className="text-gray-600">
            There was a problem authenticating your account. Please try again.
          </p>
        </div>
        <button 
          className="w-full rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
          onClick={() => router.push("/auth")}
        >
          Return to Sign In
        </button>
      </div>
    </div>
  )
}
