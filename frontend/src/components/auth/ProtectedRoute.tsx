import { useAuthStore } from '@/stores/useAuthStore'
import React, { useEffect, useState } from 'react'
import { Navigate, Outlet } from 'react-router';

const ProtectedRoute = () => {
    const {accessToken, user, loading, refresh, fetchMe} = useAuthStore();
    const[starting, setStarting] = useState(true);
    const init = async () => {

        //can occur when user refresh the page
        if(!accessToken){
            await refresh();
        }
        if(accessToken && !user){
            await fetchMe();
        }
        setStarting(false);
    }

    useEffect(() => {
        init();
    }, []);
    if(starting || loading){
        return <div className="flex h-screen items-center justify-center">Loading...</div>
    }

    if(!accessToken){
        return <Navigate to="/signin" replace/>
    }
  return (
    <Outlet></Outlet>
  )
}

export default ProtectedRoute