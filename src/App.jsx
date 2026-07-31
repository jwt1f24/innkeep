import { useState } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './AuthContext'
import Navbar from './components/Navbar'
import ProtectedRoute from './components/ProtectedRoute'
import Home from './pages/Home'
import Rooms from './pages/Rooms'
import Login from './pages/Login'

function Bookings() {
  return <div className="p-6 text-white">Your bookings (protected)</div>
}

function Register() {
  return <div className="p-6 text-white">Register</div>
}

export default function App() {
    return (
        <BrowserRouter>
            <AuthProvider>
                <div className="min-h-screen bg-slate-900">
                <Navbar/>
                <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />
                    <Route path="/rooms" element={<Rooms/>} />
                    <Route path="/bookings" element={<ProtectedRoute><Bookings/></ProtectedRoute>} />
                </Routes>
                </div>
            </AuthProvider>
        </BrowserRouter>
    )
}