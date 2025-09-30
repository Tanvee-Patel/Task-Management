import React, { useContext, useState } from 'react'
import AuthLayout from '../../components/layouts/AuthLayout'
import { validateEmail } from '../../utils/helper';
import ProfilePhotoSelector from '../../components/inputs/ProfilePhotoSelector';
import Input from '../../components/inputs/Input';
import { Link, useNavigate } from 'react-router-dom';
import { API_PATHS } from '../../utils/apiPaths';
import axiosInstance from '../../utils/axiosInstance';
import { UserContext } from '../../context/userContext';
import uploadImage from '../../utils/uploadImage';

const SignUp = () => {
   const [profilePic, setProfilePic] = useState(null);
   const [fullName, setfullName] = useState("");
   const [email, setEmail] = useState("");
   const [password, setPassword] = useState("");
   const [adminInviteToken, setAdminInviteToken] = useState('');
   const [error, setError] = useState(null);
   const { updateUser } = useContext(UserContext);
   const navigate = useNavigate();

   const handleSignUp = async (e) => {
      e.preventDefault();

      let profileImageUrl = "";

      if (!fullName) {
         setError("Please enter your full name!");
         return;
      }

      if (!validateEmail(email)) {
         setError("Please enter a valid email address!");
         return;
      }

      if (!password) {
         setError("Please enter a password!");
         return;
      }

      setError("");
      try {
         if (profilePic) {
            const imgUploadRes = await uploadImage(profilePic);
            profileImageUrl = imgUploadRes.imageUrl || "";
         }
         const response = await axiosInstance.post(API_PATHS.AUTH.REGISTER, {
            name: fullName, email, password, profileImageUrl, adminInviteToken: adminInviteToken
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
         <div className='lg:w-[100%] h-auto md:h-full mt-10 md:mt-0 flex flex-col justify-center'>
            <h3 className='text-xl font-semibold text-black'>Create an Account</h3>
            <p className='text-xs text-slate-700 mt-[5px] mb-6'>
               Join us today by entering your details below.
            </p>
            <form onSubmit={handleSignUp}>
               <ProfilePhotoSelector image={profilePic} setImage={setProfilePic} />

               <div className=' grid grid-cols-1 md:grid-cols-2 gap-4'>
                  <Input
                     value={fullName}
                     onChange={({ target }) => setfullName(target.value)}
                     label="Full Name"
                     type="text" />

                  <Input
                     value={email}
                     onChange={({ target }) => setEmail(target.value)}
                     label="Email"
                     type="email" />

                  <Input
                     value={password}
                     onChange={({ target }) => setPassword(target.value)}
                     label="Password"
                     type="password" />

                  <Input
                     value={adminInviteToken}
                     onChange={({ target }) => setAdminInviteToken(target.value)}
                     label="Admin Invite Token"
                     type="text" />
               </div>

               {error && <p className='text-red-500 text-xs pb-2.5'>{error}</p>}

               <button type='submit' className='btn-primary'>
                  SIGN UP
               </button>

               <p className='text-[13px] text-slate-800 mt-3'>
                  Already have an account?{" "}
                  <Link className='font-medium text-primary underline' to="/login">
                     Login
                  </Link>
               </p>
            </form>
         </div>
      </AuthLayout>
   )
}

export default SignUp