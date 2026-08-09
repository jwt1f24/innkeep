import { useAuth } from '../AuthContext'
import Button from './Button'

const tabs = [
    { id: "dashboard", label: "Home" },
    { id: "room-types", label: "Room Types" },
    { id: "room-images", label: "Room Images" },
    { id: "rooms", label: "Rooms" },
    { id: "pricing", label: "Pricing Rules" },
    { id: "bookings", label: "Bookings" },
    { id: "users", label: "Users" }
]

export default function AdminNavbar({ activeTab, setActiveTab }) {
    const { logout } = useAuth()

    return (
        <header className="sticky top-0 z-50 bg-white border-b border-neutral-200">
            <div className="container mx-auto flex items-center justify-between px-6 py-3">
                <nav className="flex gap-2">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`px-4 py-2 rounded text-lg font-medium cursor-pointer transition-colors ${
                                activeTab === tab.id
                                    ? "bg-amber-600 text-white"
                                    : "text-black hover:text-neutral-700"
                            }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </nav>

                <Button variant="danger" onClick={logout} className="px-6 py-2 rounded">
                    Logout
                </Button>
            </div>
        </header>
    )
}