import { useState } from 'react'
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import { AuthProvider } from './AuthContext'
import Navbar from './components/Navbar'
import ProtectedRoute from './components/ProtectedRoute'
import Footer from './components/Footer'
import Home from './pages/Home'
import Rooms from './pages/Rooms'
import Login from './pages/Login'
import Register from './pages/Register'

function Bookings() {
  return <div className="p-6 text-white">Your bookings (protected)</div>
}

function AppContent() {
    const location = useLocation()
    const hideFooter = ["/login", "/register"].includes(location.pathname)

    return (
        <div className="min-h-screen bg-slate-900 flex flex-col">
            <Navbar/>
            <div className="flex-1">
                <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />
                    <Route path="/rooms" element={<Rooms/>} />
                    <Route path="/bookings" element={<ProtectedRoute><Bookings/></ProtectedRoute>} />
                </Routes>
            </div>
            {!hideFooter && <Footer/>}
        </div>
    )
}

export default function App() {
    return (
        <BrowserRouter>
            <AuthProvider>
                <AppContent/>
            </AuthProvider>
        </BrowserRouter>
    )
}