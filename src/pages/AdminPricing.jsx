import { useState, useEffect } from 'react'
import { useAuth } from '../AuthContext'
import AdminModal from '../components/AdminModal'
import ConfirmModal from '../components/ConfirmModal'
import Button from '../components/Button'
import Input from '../components/Input'

export default function AdminPricing() {
    const [rules, setRules] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState("")
    const { token } = useAuth()
    const [formOpen, setFormOpen] = useState(false)
    const [editingId, setEditingId] = useState(null)
    const [deleteTarget, setDeleteTarget] = useState(null)
    const [deleting, setDeleting] = useState(false)
    const emptyForm = { label: "", start_date: "", end_date: "" }
    const [form, setForm] = useState(emptyForm)
    const [formError, setFormError] = useState("")
    const [submitting, setSubmitting] = useState(false)

    useEffect(() => {
        loadRules()
    }, [])

    async function loadRules() {
        setLoading(true)
        try {
            const res = await fetch("http://localhost:8000/pricing/")
            if (!res.ok) throw new Error("Failed to load pricing rules")
            setRules(await res.json())
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

    function openEdit(rule) {
        setForm({ label: rule.label, start_date: rule.start_date, end_date: rule.end_date })
        setEditingId(rule.id)
        setFormError("")
        setFormOpen(true)
    }

    async function handleSubmit(e) {
        e.preventDefault()
        setSubmitting(true)
        setFormError("")
        const url = editingId ? `http://localhost:8000/pricing/${editingId}` : "http://localhost:8000/pricing/"
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
            await loadRules()
        } catch (err) {
            setFormError(err.message)
        } finally {
            setSubmitting(false)
        }
    }

    async function confirmDelete() {
        setDeleting(true)
        try {
            const res = await fetch(`http://localhost:8000/pricing/${deleteTarget}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${token}` },
            })
            if (!res.ok) {
                const err = await res.json().catch(() => ({}))
                throw new Error(err.detail || "Delete failed")
            }
            setDeleteTarget(null)
            await loadRules()
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
                <h2 className="text-black text-4xl font-semibold">Pricing Rules</h2>
                <Button onClick={openCreate} className="px-4 py-2 rounded">
                    + Create New Pricing Rule
                </Button>
            </div>

            <p className="text-red-500 text-base min-h-[20px]">{error}</p>

            <div className="bg-white border border-neutral-300 rounded-xl overflow-hidden">
                <table className="w-full text-left text-sm">
                    <thead>
                        <tr className="text-black border-b border-neutral-300 bg-neutral-50">
                            <th className="py-3 px-4">Label</th>
                            <th className="py-3 px-4">Start Date</th>
                            <th className="py-3 px-4">End Date</th>
                            <th className="py-3 px-4">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {rules.map((rule) => (
                            <tr key={rule.id} className="border-b border-neutral-100 text-black last:border-0">
                                <td className="py-3 px-4">{rule.label}</td>
                                <td className="py-3 px-4">{rule.start_date}</td>
                                <td className="py-3 px-4">{rule.end_date}</td>
                                <td className="py-3 px-4">
                                    <div className="flex gap-2">
                                        <Button
                                            onClick={() => openEdit(rule)}
                                            className="px-6 py-1 rounded text-sm"
                                        >
                                            Edit
                                        </Button>
                                        <Button
                                            variant="danger"
                                            onClick={() => setDeleteTarget(rule.id)}
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

            <AdminModal open={formOpen} title={editingId ? "Edit Pricing Rule" : "Create New Pricing Rule"} onClose={() => setFormOpen(false)}>
                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                    <Input
                        label="Label"
                        type="text"
                        value={form.label}
                        onChange={(e) => setForm({ ...form, label: e.target.value })}
                        required
                    />
                    <div className="flex gap-3">
                        <div className="flex-1">
                            <Input
                                label="Start Date"
                                type="date"
                                value={form.start_date}
                                onChange={(e) => setForm({ ...form, start_date: e.target.value })}
                                required
                            />
                        </div>
                        <div className="flex-1">
                            <Input
                                label="End Date"
                                type="date"
                                value={form.end_date}
                                onChange={(e) => setForm({ ...form, end_date: e.target.value })}
                                required
                            />
                        </div>
                    </div>

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
                title="Delete this pricing rule?"
                message="This cannot be undone."
                onConfirm={confirmDelete}
                onCancel={() => setDeleteTarget(null)}
                loading={deleting}
            />
        </div>
    )
}