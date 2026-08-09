import { useState, useEffect } from 'react'
import { useAuth } from '../AuthContext'
import AdminModal from '../components/AdminModal'
import ConfirmModal from '../components/ConfirmModal'
import Button from '../components/Button'
import Input from '../components/Input'

export default function AdminRoomTypes() {
    const [roomTypes, setRoomTypes] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState("")
    const { token } = useAuth()
    const [formOpen, setFormOpen] = useState(false)
    const [editingId, setEditingId] = useState(null)
    const [deleteTarget, setDeleteTarget] = useState(null)
    const [deleting, setDeleting] = useState(false)
    const emptyForm = {
        name: "", description: "", single_beds: 0, king_beds: 0, queen_beds: 0,
        weekday_price: "", weekend_price: "", holiday_price: "", accommodates: 1,
    }
    const [form, setForm] = useState(emptyForm)
    const [formError, setFormError] = useState("")
    const [submitting, setSubmitting] = useState(false)

    useEffect(() => {
        loadRoomTypes()
    }, [])

    async function loadRoomTypes() {
        setLoading(true)
        try {
            const res = await fetch("http://localhost:8000/room-types/")
            if (!res.ok) throw new Error("Failed to load room types")
            setRoomTypes(await res.json())
        } catch (err) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    function openCreate() {
        setForm(emptyForm)
        setEditingId(null)
        setFormError("")
        setFormOpen(true)
    }

    function openEdit(rt) {
        setForm({
            name: rt.name, description: rt.description,
            single_beds: rt.single_beds, king_beds: rt.king_beds, queen_beds: rt.queen_beds,
            weekday_price: rt.weekday_price, weekend_price: rt.weekend_price, holiday_price: rt.holiday_price,
            accommodates: rt.accommodates,
        })
        setEditingId(rt.id)
        setFormError("")
        setFormOpen(true)
    }

    async function handleSubmit(e) {
        e.preventDefault()
        setSubmitting(true)
        setFormError("")
        const url = editingId
            ? `http://localhost:8000/room-types/${editingId}`
            : "http://localhost:8000/room-types/"
        const method = editingId ? "PUT" : "POST"
        try {
            const res = await fetch(url, {
                method,
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(form),
            })
            if (!res.ok) {
                const err = await res.json().catch(() => ({}))
                throw new Error(err.detail || "Save failed")
            }
            setFormOpen(false)
            await loadRoomTypes()
        } catch (err) {
            setFormError(err.message)
        } finally {
            setSubmitting(false)
        }
    }

    async function confirmDelete() {
        setDeleting(true)
        try {
            const res = await fetch(`http://localhost:8000/room-types/${deleteTarget}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${token}` },
            })
            if (!res.ok) {
                const err = await res.json().catch(() => ({}))
                throw new Error(err.detail || "Delete failed")
            }
            setDeleteTarget(null)
            await loadRoomTypes()
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
                <h2 className="text-black text-4xl font-semibold">Room Types</h2>
                <Button 
                    onClick={openCreate} 
                    disabled={roomTypes.length >= 10}
                    className="px-4 py-2 rounded disabled:opacity-50 disabled:cursor-not-allowed">
                    + Create New Room Type
                </Button>
            </div>

            <p className="text-red-500 text-base min-h-[20px]">{error}</p>

            <div className="bg-white border border-neutral-300 rounded-xl overflow-hidden">
                <table className="w-full text-left text-sm">
                    <thead>
                        <tr className="text-black border-b border-neutral-200 bg-neutral-50">
                            <th className="py-3 px-4">Name</th>
                            <th className="py-3 px-4">Description</th>
                            <th className="py-3 px-4">Single</th>
                            <th className="py-3 px-4">King</th>
                            <th className="py-3 px-4">Queen</th>
                            <th className="py-3 px-4">Weekday</th>
                            <th className="py-3 px-4">Weekend</th>
                            <th className="py-3 px-4">Holiday</th>
                            <th className="py-3 px-4">Accommodates</th>
                            <th className="py-3 px-4">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {roomTypes.map((rt) => (
                            <tr key={rt.id} className="border-b border-neutral-100 text-black last:border-0">
                                <td className="py-3 px-4">{rt.name}</td>
                                <td className="py-3 px-4 truncate max-w-xs">{rt.description}</td>
                                <td className="py-3 px-4">{rt.single_beds}</td>
                                <td className="py-3 px-4">{rt.king_beds}</td>
                                <td className="py-3 px-4">{rt.queen_beds}</td>
                                <td className="py-3 px-4">RM{Number(rt.weekday_price).toFixed(2)}</td>
                                <td className="py-3 px-4">RM{Number(rt.weekend_price).toFixed(2)}</td>
                                <td className="py-3 px-4">RM{Number(rt.holiday_price).toFixed(2)}</td>
                                <td className="py-3 px-4">{rt.accommodates}</td>
                                <td className="py-3 px-4">
                                    <div className="flex gap-2">
                                        <Button
                                            onClick={() => openEdit(rt)}
                                            className="px-6 py-1 rounded text-sm"
                                        >
                                            Edit
                                        </Button>
                                        <Button
                                            variant="danger"
                                            onClick={() => setDeleteTarget(rt.id)}
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

            <AdminModal open={formOpen} title={editingId ? "Edit Room Type" : "Create New Room Type"} onClose={() => setFormOpen(false)}>
                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                    <Input
                        label="Name"
                        type="text" value={form.name}
                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                        required
                    />
                    <div>
                        <label className="block text-black text-base mb-1">Description</label>
                        <textarea
                            value={form.description}
                            onChange={(e) => setForm({ ...form, description: e.target.value })}
                            className="w-full p-2 bg-neutral-100 border border-neutral-300 text-neutral-900" required
                        />
                    </div>
                    <div>
                        <label className="block text-black text-sm mb-1">Bed Counts</label>
                        <div className="grid grid-cols-3 gap-3">
                            <Input label="Single" type="number" min="0" max="3" value={form.single_beds}
                                onChange={(e) => setForm({ ...form, single_beds: Number(e.target.value) })} />
                            <Input label="King" type="number" min="0" max="3" value={form.king_beds}
                                onChange={(e) => setForm({ ...form, king_beds: Number(e.target.value) })} />
                            <Input label="Queen" type="number" min="0" max="3" value={form.queen_beds}
                                onChange={(e) => setForm({ ...form, queen_beds: Number(e.target.value) })} />
                        </div>
                    </div>
                    <div>
                        <label className="block text-black text-sm mb-2">Pricing (RM)</label>
                        <div className="grid grid-cols-3 gap-3">
                            <Input label="Weekday" type="number" min="0.01" max="999.99" step="0.01" value={form.weekday_price}
                                onChange={(e) => setForm({ ...form, weekday_price: e.target.value })} required />
                            <Input label="Weekend" type="number" min="0.01" max="999.99" step="0.01" value={form.weekend_price}
                                onChange={(e) => setForm({ ...form, weekend_price: e.target.value })} required />
                            <Input label="Holiday" type="number" min="0.01" max="999.99" step="0.01" value={form.holiday_price}
                                onChange={(e) => setForm({ ...form, holiday_price: e.target.value })} required />
                        </div>
                    </div>
                    <Input
                        label="Accommodates"
                        type="number" min="1" max="10" value={form.accommodates}
                        onChange={(e) => setForm({ ...form, accommodates: Number(e.target.value) })}
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
                title="Delete this room type?"
                message="This cannot be undone. Room types with existing rooms cannot be deleted."
                onConfirm={confirmDelete}
                onCancel={() => setDeleteTarget(null)}
                loading={deleting}
            />
        </div>
    )
}