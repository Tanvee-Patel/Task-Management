import { useContext, useState } from 'react'

import './App.css'
import { BrowserRouter, Routes, Route, Outlet, Navigate } from 'react-router-dom'
import Login from './pages/Auth/Login'
import SignUp from './pages/Auth/SignUp'

import PrivateRoute from './routes/PrivateRoute'
import Dashboard from './pages/Admin/Dashboard'
import ManageTaks from './pages/Admin/ManageTasks'
import ManageUsers from './pages/Admin/ManageUsers'
import CreateTask from './pages/Admin/CreateTask'

import UDashboard from './pages/User/UDashboard'
import MyTasks from './pages/User/MyTasks'
import ViewTaskDetails from './pages/User/ViewTaskDetails'
import UserProvider, { UserContext } from './context/userContext'
import { Toaster } from 'react-hot-toast'
import Logout from './pages/Auth/Logout'

function App() {
  const [count, setCount] = useState(0)

  return (
    <UserProvider>
      <div>
        <BrowserRouter>
          <Routes>
            <Route path='/login' element={<Login />} />
            <Route path='/signup' element={<SignUp />} />
            <Route path='/logout' element={<Logout />} />

            {/* Admin Routes */}
            <Route element={<PrivateRoute allowedRoles={["admin"]} />}>
              <Route path='/admin/dashboard' element={<Dashboard />} />
              <Route path='/admin/tasks' element={<ManageTaks />} />
              <Route path='/admin/users' element={<ManageUsers />} />
              <Route path='/admin/create-task' element={<CreateTask />} />
            </Route>

            {/* User Routes */}
            <Route element={<PrivateRoute allowedRoles={["user"]} />}>
              <Route path='/user/dashboard' element={<UDashboard />} />
              <Route path='/user/my-tasks' element={<MyTasks />} />
              <Route path='/user/task-details/:id' element={<ViewTaskDetails />} />
            </Route>

            <Route path='/' element={<Root />} />

          </Routes>
        </BrowserRouter>
      </div>

      <Toaster
        toastOptions={{
          className: '',
          style: {
            fontSize: "13px"
          },
        }}
      />

    </UserProvider>
  )
}

export default App

const Root = () => {
  const { user, loading } = useContext(UserContext);
  if (loading) return <Outlet />

  if (!user) {
    return <Navigate to="/login" />;
  }

  return user.role === 'admin' ? <Navigate to="/admin/dashboard" /> : <Navigate to="/user/dashboard" />
}