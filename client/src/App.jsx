import React, { useEffect } from 'react'
import { Route, Routes } from 'react-router-dom'
import Home from './pages/Home'
import Layout from './pages/Layout'
import Dashboard from './pages/Dashboard'
import ResumeBuilder from './pages/ResumeBuilder'
import Preview from './pages/Preview'
import Login from './pages/Login'
import { useDispatch } from 'react-redux'
import api from './configs/api'
import { login, setLoading } from './app/features/authSlice'
import { Toaster } from 'react-hot-toast'

function App() {



  const dispatch = useDispatch();

  const getUserData = async () => {
    const token = localStorage.getItem("token");

    try {
      if (token) {
        const { data } = await api.get(
          '/api/users/data',
          {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        )

        if (data.user) {
          dispatch(login({ token, user: data.user }))
        }
      }

      dispatch(setLoading(false))
    } catch (error) {
      dispatch(setLoading(false))
      console.error(error)
    }
  };

  useEffect(() => {
    getUserData();
  }, []);

  return (
    <div>
      <Toaster />
      <Routes>
        <Route path='/' element={<Home />} />

        <Route path='view/:resumeId' element={<Preview />} />

        {/* FIX: parent route now has path + element */}
        <Route path='app' element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path='builder/:resumeId' element={<ResumeBuilder />} />
        </Route>
      </Routes>
    </div>
  )
}

export default App
