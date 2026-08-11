import { BASE_URL } from '../api/client'
import { useState, useEffect } from 'react'
import { useAuth } from '../AuthContext'
import AdminModal from '../components/AdminModal'
import ConfirmModal from '../components/ConfirmModal'
import Button from '../components/Button'
import Input from '../components/Input'

export default function AdminRooms() {
    const [rooms, setRooms] = useState([])
    const [roomTypes, setRoomTypes] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState("")
    const { token } = useAuth()
    const [formOpen, setFormOpen] = useState(false)
    const [editingId, setEditingId] = useState(null)
    const [deleteTarget, setDeleteTarget] = useState(null)
    const [deleting, setDeleting] = useState(false)
    const emptyForm = { room_type_id: "", room_number: "" }
    const [form, setForm] = useState(emptyForm)
    const [formError, setFormError] = useState("")
    const [submitting, setSubmitting] = useState(false)
    const [filterTypeId, setFilterTypeId] = useState("")

    const filteredRooms = filterTypeId
        ? rooms.filter((r) => r.room_type_id === Number(filterTypeId))
        : rooms

    useEffect(() => {
        loadData()
    }, [])

    async function loadData() {
        setLoading(true)
        try {
            const [roomsRes, typesRes] = await Promise.all([
                fetch(`${BASE_URL}/rooms/`),
                fetch(`${BASE_URL}/room-types/`),
            ])
            if (!roomsRes.ok || !typesRes.ok) throw new Error("Failed to load data")
            setRooms(await roomsRes.json())
            setRoomTypes(await typesRes.json())
        } catch (err) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    function roomTypeName(id) {
        return roomTypes.find((rt) => rt.id === id)?.name || "Unknown"
    }

    function openCreate() {
        setForm(emptyForm)
        setEditingId(null)
        setFormError("")
        setFormOpen(true)
    }

    function openEdit(room) {
        setForm({ room_type_id: room.room_type_id, room_number: room.room_number })
        setEditingId(room.id)
        setFormError("")
        setFormOpen(true)
    }

    async function handleSubmit(e) {
        e.preventDefault()
        setSubmitting(true)
        setFormError("")
        const url = editingId ? `${BASE_URL}/rooms/${editingId}` : `${BASE_URL}/rooms/`
        const method = editingId ? "PUT" : "POST"
        const body = editingId
            ? { room_number: Number(form.room_number) }
            : { room_type_id: Number(form.room_type_id), room_number: Number(form.room_number) }
        try {
            const res = await fetch(url, {
                method,
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(body),
            })
            if (!res.ok) {
                const err = await res.json().catch(() => ({}))
                throw new Error(err.detail || "Save failed")
            }
            setFormOpen(false)
            await loadData()
        } catch (err) {
            setFormError(err.message)
        } finally {
            setSubmitting(false)
        }
    }

    async function confirmDelete() {
        setDeleting(true)
        try {
            const res = await fetch(`${BASE_URL}/rooms/${deleteTarget}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${token}` },
            })
            if (!res.ok) {
                const err = await res.json().catch(() => ({}))
                throw new Error(err.detail || "Delete failed")
            }
            setDeleteTarget(null)
            await loadData()
        } catch (err) {
            setError(err.message)
        } finally {
            setDeleting(false)
        }
    }

    if (loading) return <p className="text-neutral-600">Loading...</p>

    return (
        <div>
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-6">
                    <h2 className="text-black text-4xl font-semibold">Rooms</h2>
                    <select
                        value={filterTypeId}
                        onChange={(e) => setFilterTypeId(e.target.value)}
                        className="p-2 rounded bg-white border border-neutral-300 text-black text-base"
                    >
                        <option value="">All</option>
                        {roomTypes.map((rt) => (
                            <option key={rt.id} value={rt.id}>{rt.name}</option>
                        ))}
                    </select>
                </div>
                <Button onClick={openCreate} className="px-4 py-2 rounded">
                    + Create New Room
                </Button>
            </div>

            <p className="text-red-500 text-base min-h-[20px]">{error}</p>

            <div className="bg-white border border-neutral-300 rounded-xl overflow-hidden">
                <table className="w-full text-left text-sm">
                    <thead>
                        <tr className="text-black border-b border-neutral-300 bg-neutral-50">
                            <th className="py-3 px-4">Room Number</th>
                            <th className="py-3 px-4">Room Type</th>
                            <th className="py-3 px-4">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredRooms.map((room) => (
                            <tr key={room.id} className="border-b border-neutral-100 text-black last:border-0">
                                <td className="py-3 px-4">{room.room_number}</td>
                                <td className="py-3 px-4">{roomTypeName(room.room_type_id)}</td>
                                <td className="py-3 px-4">
                                    <div className="flex gap-2">
                                        <Button
                                            onClick={() => openEdit(room)}
                                            className="px-6 py-1 rounded text-sm"
                                        >
                                            Edit
                                        </Button>
                                        <Button
                                            variant="danger"
                                            onClick={() => setDeleteTarget(room.id)}
                                            className="px-4 py-1 rounded text-sm"
                                        >
                                            Delete
                                        </Button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <AdminModal open={formOpen} title={editingId ? "Edit Room" : "Create New Room"} onClose={() => setFormOpen(false)}>
                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                    {!editingId && (
                        <div>
                            <label className="block text-black text-base mb-1">Room Type</label>
                            <select
                                value={form.room_type_id}
                                onChange={(e) => setForm({ ...form, room_type_id: e.target.value })}
                                className="w-full p-2 bg-neutral-100 border border-neutral-300 text-neutral-900"
                                required
                            >
                                <option value="" disabled>Select room type</option>
                                {roomTypes.map((rt) => (
                                    <option key={rt.id} value={rt.id}>{rt.name}</option>
                                ))}
                            </select>
                        </div>
                    )}
                    <Input
                        label="Room Number"
                        type="number" min="1" max="100" value={form.room_number}
                        onChange={(e) => setForm({ ...form, room_number: e.target.value })}
                        required
                    />

                    <p className="text-red-500 text-base min-h-[20px]">{formError}</p>

                    <div className="flex gap-3">
                        <Button variant="neutral" type="button" onClick={() => setFormOpen(false)} className="flex-1 py-2 rounded">
                            Cancel
                        </Button>
                        <Button type="submit" disabled={submitting} className="flex-1 py-2 rounded">
                            {submitting ? "Saving..." : "Save"}
                        </Button>
                    </div>
                </form>
            </AdminModal>

            <ConfirmModal
                open={deleteTarget !== null}
                title="Delete this room?"
                message="This cannot be undone. Rooms with existing bookings cannot be deleted."
                onConfirm={confirmDelete}
                onCancel={() => setDeleteTarget(null)}
                loading={deleting}
            />
        </div>
    )
}