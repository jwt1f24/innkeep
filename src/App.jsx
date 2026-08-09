import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, useLocation, useNavigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './AuthContext'
import ScrollToTop from './components/ScrollToTop'
import MobileBlock from './components/MobileBlock'
import Navbar from './components/Navbar'
import AdminRoute from './components/AdminRoute'
import ProtectedRoute from './components/ProtectedRoute'
import Footer from './components/Footer'
import Home from './pages/Home'
import Login from './pages/Login'
import Register from './pages/Register'
import Rooms from './pages/Rooms'
import Amenities from './pages/Amenities'
import Events from './pages/Events'
import BookRoom from './pages/BookRoom'
import Payment from './pages/Payment'
import Bookings from './pages/Bookings'
import AdminDashboard from './pages/AdminDashboard'

function AppContent() {
    const location = useLocation()
    const navigate = useNavigate()
    const { user, isLoggedIn } = useAuth()

    useEffect(() => {
        if (user?.role === "admin" && location.pathname !== "/admin-dashboard") {
            navigate("/admin-dashboard", { replace: true })
            return
        }

        if (isLoggedIn && ["/login", "/register"].includes(location.pathname)) {
            navigate("/", { replace: true })
        }
    }, [location.pathname, user, isLoggedIn])

    // set page background color
    useEffect(() => {
        const amberPages = ["/rooms", "/amenities", "/events", "/bookings", "/book-room"]
        const cyanPages = ["/confirm-booking", "/login", "/register"]

        if (amberPages.includes(location.pathname)) {
            document.body.style.backgroundColor = "#e6d6aa"
        } else if (cyanPages.includes(location.pathname)) {
            document.body.style.backgroundColor = "#164e63"
        } else {
            document.body.style.backgroundColor = "#ffffff"
        }
    }, [location.pathname])

    // hide components according to page type or user role
    const hideNavbar = ["/admin-dashboard"].includes(location.pathname)
    const hideFooter = ["/login", "/register", "/confirm-booking", "/admin-dashboard"].includes(location.pathname)

    return (
        <div className="min-h-screen flex flex-col">
            <ScrollToTop/>
            {!hideNavbar && <Navbar/>}
            <div className="flex-1">
                <Routes>
                    {/* public pages */}
                    <Route path="/" element={<Home/>}/>
                    <Route path="/login" element={<Login/>}/>
                    <Route path="/register" element={<Register/>}/>
                    <Route path="/rooms" element={<Rooms/>}/>
                    <Route path="/amenities" element={<Amenities/>}/>
                    <Route path="/events" element={<Events/>}/>
                    <Route path="/book-room" element={<BookRoom/>}/>

                    {/* guest login protected */}
                    <Route path="/confirm-booking" element={<ProtectedRoute><Payment/></ProtectedRoute>}/>
                    <Route path="/bookings" element={<ProtectedRoute><Bookings/></ProtectedRoute>}/>
                    
                    {/* admin page */}
                    <Route path="/admin-dashboard" element={<AdminRoute><AdminDashboard/></AdminRoute>} />
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
                <MobileBlock/>
                <AppContent/>
            </AuthProvider>
        </BrowserRouter>
    )
}