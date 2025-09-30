import React from 'react';

function AuthLayout({ children }) {
   return (
      <div className="w-screen h-screen bg-[url('/bg-img.jpg')] bg-cover bg-center flex items-center justify-center" >
         <div className="bg-white/80 px-12 pt-8 pb-12 rounded-lg shadow-md">
            <h2 className="text-lg font-medium text-black mb-6">Task Manager</h2>
            {children}
         </div>
      </div>
   );
}

export default AuthLayout;
