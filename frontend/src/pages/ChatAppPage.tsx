import { Logout } from '@/components/auth/Logout'
import React from 'react'
import { useAuthStore } from '@/stores/useAuthStore'
import { authService } from '@/services/authService'
import api from '@/lib/axios'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'

const ChatAppPage = () => { 
    const user = useAuthStore((state) => state.user);
    const handleOnClick = async () => {
        try{
        await api.get("/users/test", {withCredentials: true});
        toast.success("Test successful!");
    }
        catch(error){
            toast.error("Test failed!");
            console.error(error);
        }
    }
  return (
    <div>
        {user?.username}<Logout></Logout>
        <Button onClick={handleOnClick}>test</Button>
        </div>
  )
}

export default ChatAppPage