import { useState } from 'react'
import AdminNavbar from '../components/AdminNavbar'
import AdminHome from './AdminHome'
import AdminRoomTypes from './AdminRoomTypes'
import AdminRoomImages from './AdminRoomImages'
import AdminRooms from './AdminRooms'
import AdminPricing from './AdminPricing'
import AdminBookings from './AdminBookings'
import AdminUsers from './AdminUsers'

const tabComponents = {
    "dashboard": AdminHome,
    "room-types": AdminRoomTypes,
    "room-images": AdminRoomImages,
    "rooms": AdminRooms,
    "pricing": AdminPricing,
    "bookings": AdminBookings,
    "users": AdminUsers
}

export default function AdminDashboard() {
    const [activeTab, setActiveTab] = useState("dashboard")
    const ActiveComponent = tabComponents[activeTab]

    return (
        <div className="min-h-screen bg-neutral-50">
            <AdminNavbar activeTab={activeTab} setActiveTab={setActiveTab} />
            <div className="px-6 py-6">
                <ActiveComponent />
            </div>
        </div>
    )
}