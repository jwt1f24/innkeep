import { BASE_URL } from '../api/client'
import { useState, useEffect } from 'react'
import { useAuth } from '../AuthContext'
import ConfirmModal from '../components/ConfirmModal'
import Button from '../components/Button'

export default function AdminUsers() {
    const [users, setUsers] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState("")
    const { token, user: currentUser } = useAuth()
    const [roleTarget, setRoleTarget] = useState(null)
    const [updating, setUpdating] = useState(false)
    const [filterRole, setFilterRole] = useState("")

    const filteredUsers = filterRole
        ? users.filter((u) => u.role === filterRole)
        : users

    useEffect(() => {
        loadUsers()
    }, [token])

    async function loadUsers() {
        setLoading(true)
        try {
            const res = await fetch(`${BASE_URL}/users/`, {
                headers: { Authorization: `Bearer ${token}` },
            })
            if (!res.ok) throw new Error("Failed to load users")
            setUsers(await res.json())
        } catch (err) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    function requestRoleChange(user) {
        const newRole = user.role === "admin" ? "guest" : "admin"
        setRoleTarget({ user, newRole })
    }

    async function confirmRoleChange() {
        if (!roleTarget) return
        setUpdating(true)
        try {
            const res = await fetch(`${BASE_URL}/users/${roleTarget.user.id}/role?role=${roleTarget.newRole}`, {
                method: "PATCH",
                headers: { Authorization: `Bearer ${token}` },
            })
            if (!res.ok) {
                const err = await res.json().catch(() => ({}))
                throw new Error(err.detail || "Failed to update role")
            }
            setRoleTarget(null)
            await loadUsers()
        } catch (err) {
            setError(err.message)
        } finally {
            setUpdating(false)
        }
    }

    if (loading) return <p className="text-neutral-600">Loading...</p>

    return (
        <div>
            <div className="flex items-center gap-6 mb-4">
                <h2 className="text-black text-4xl font-semibold">Users</h2>
                <select
                    value={filterRole}
                    onChange={(e) => setFilterRole(e.target.value)}
                    className="p-2 rounded bg-white border border-neutral-300 text-black text-base"
                >
                    <option value="">All</option>
                    <option value="guest">Guest</option>
                    <option value="admin">Admin</option>
                </select>
            </div>

            <p className="text-red-500 text-base min-h-[20px]">{error}</p>

            <div className="bg-white border border-neutral-300 rounded-xl overflow-hidden">
                <table className="w-full text-left text-sm">
                    <thead>
                        <tr className="text-black border-b border-neutral-300 bg-neutral-50">
                            <th className="py-3 px-4">Name</th>
                            <th className="py-3 px-4">Email</th>
                            <th className="py-3 px-4">Role</th>
                            <th className="py-3 px-4">Joined</th>
                            <th className="py-3 px-4">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredUsers.map((u) => (
                            <tr key={u.id} className="border-b border-neutral-100 text-black last:border-0">
                                <td className="py-3 px-4">{u.name}</td>
                                <td className="py-3 px-4">{u.email}</td>
                                <td className={`py-3 px-4 capitalize font-medium ${u.role === "admin" ? "text-green-700" : "text-black"}`}>
                                    {u.role}
                                </td>
                                <td className="py-3 px-4 text-black">{new Date(u.date_created).toLocaleDateString()}</td>
                                <td className="py-3 px-4">
                                    {u.id !== currentUser?.id && (
                                        <Button
                                            onClick={() => requestRoleChange(u)}
                                            className="px-4 py-1 rounded text-sm"
                                        >
                                            {u.role === "admin" ? "Demote to Guest" : "Promote to Admin"}
                                        </Button>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <ConfirmModal
                open={roleTarget !== null}
                title={roleTarget?.newRole === "admin" ? "Promote to Admin?" : "Demote to Guest?"}
                message={`This will change ${roleTarget?.user.name}'s role to ${roleTarget?.newRole}.`}
                onConfirm={confirmRoleChange}
                onCancel={() => setRoleTarget(null)}
                loading={updating}
            />
        </div>
    )
}