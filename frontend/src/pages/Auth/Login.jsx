import React, { useContext, useState } from 'react'
import AuthLayout from '../../components/layouts/AuthLayout'
import { Link, useNavigate } from 'react-router-dom'
import Input from '../../components/inputs/Input';
import { validateEmail } from '../../utils/helper';
import axiosInstance from '../../utils/axiosInstance';
import { API_PATHS } from '../../utils/apiPaths';
import { UserContext } from '../../context/userContext';

const Login = () => {
   const [email, setEmail] = useState("");
   const [password, setPassword] = useState("");
   const [error, setError] = useState(null);
   const navigate = useNavigate();
   const { updateUser } = useContext(UserContext);

   const handleLogin = async (e) => {
      e.preventDefault();
      if (!validateEmail(email)) {
         setError("Please enter a valid email address.");
         return;
      }
      if (!password) {
         setError("Please enter the password");
         return;
      }
      setError("");

      try {
         const response = await axiosInstance.post(API_PATHS.AUTH.LOGIN, {
            email, password
         });

         const { token, role } = response.data;

         if (token) {
            localStorage.setItem("token", token);
            updateUser(response.data);
            if (role === 'admin') {
               navigate("/admin/dashboard");
            } else {
               navigate("/user/dashboard")
            }
         }
      }
      catch (error) {
         if (error.response && error.response.data.message) {
            setError(error.response.data.message);
         } else {
            setError("An unexpected error occurred. Please try again later.")
         }
      }
   }

   return (
      <AuthLayout>
         <div className='lg:w-[70%] h-3/4 md:h-full flex flex-col justify-center'>
            <h3 className='text-xl font-semibold text-black'>Welcome Back! Ready to Get Things Done?</h3>
            <p className='text-xs text-slate-700 mt-[5px] mb-6'>Fill in your credentials to continue.</p>

            <form
               onSubmit={handleLogin}
               className="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4 w-full max-w-sm mx-auto">
               <Input
                  value={email}
                  onChange={({ target }) => setEmail(target.value)}
                  label="Email"
                  type="email"
               />

               <Input
                  value={password}
                  onChange={({ target }) => setPassword(target.value)}
                  label="Password"
                  type="password"
               />

               {error && <p className='text-red-500 text-xs pb-2.5'>{error}</p>}

               <button type='submit' className='btn-primary'>
                  LOGIN
               </button>

               <p className='text-[13px] text-slate-800 mt-3'>
                  Don't have an account?{" "}
                  <Link className='font-medium text-primary underline' to="/signup">
                     SignUp
                  </Link>
               </p>

               {/* <div className="mb-6">
                  <label class="block text-gray-700 text-sm font-bold mb-2" for="password">
                     Password
                  </label>
                  <input
                     className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 mb-3 leading-tight focus:outline-none focus:shadow-outline"
                     id="password"
                     type="password"
                     placeholder="********"
                     required
                  />
               </div>

               <div className="flex items-center justify-between">
                  <button
                     className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                     type="submit"
                  >
                     Sign In
                  </button>
                  <a className="inline-block align-baseline font-bold text-sm text-blue-500 hover:text-blue-800" href="#">
                     Forgot Password?
                  </a>
               </div> */}
            </form>

         </div>
      </AuthLayout>
   )
}

export default Login