import { useAuth } from '../context/auth-context'

export const useUser = () => {
    return useAuth()
}