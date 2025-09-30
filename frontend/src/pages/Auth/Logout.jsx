import React, { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import axiosInstance from '../../utils/axiosInstance';
import { API_PATHS } from '../../utils/apiPaths';

const Logout = () => {
   const navigate = useNavigate();
   useEffect(() => {
      const logoutUser = async () => {
         try {
            await axiosInstance.post(API_PATHS.AUTH.LOGOUT);
         } catch (error) {
            console.error("Error logging out:", error);
         } finally {
            localStorage.removeItem("token");
            navigate("/login")
         }
      }
      logoutUser();
   }, [navigate])

   return (
      <div>Logging out</div>
   )
}

export default Logout