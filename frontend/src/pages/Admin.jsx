import { useEffect, useState } from 'react'
import api from '../api.js'

const fmt = n => Number(n || 0).toLocaleString('en', { minimumFractionDigits: 2 })

function AnimalTypesTab() {
    const [types, setTypes] = useState([])
    const [form, setForm] = useState({ name: '', taxAmount: '' })
    const [editing, setEditing] = useState(null)
    const [loading, setLoading] = useState(true)
    const [submitting, setSubmitting] = useState(false)
    const [msg, setMsg] = useState({ type: '', text: '' })

    const load = async () => {
        setLoading(true)
        const r = await api.get('/master/animal-types')
        setTypes(r.data)
        setLoading(false)
    }

    useEffect(() => { load() }, [])

    const submit = async (e) => {
        e.preventDefault()
        setSubmitting(true)
        setMsg({ type: '', text: '' })
        try {
            if (editing) {
                await api.put(`/master/animal-types/${editing.id}`, form)
                setMsg({ type: 'success', text: 'Updated successfully!' })
            } else {
                await api.post('/master/animal-types', form)
                setMsg({ type: 'success', text: 'Animal type added!' })
            }
            setForm({ name: '', taxAmount: '' })
            setEditing(null)
            load()
        } catch (err) {
            setMsg({ type: 'error', text: err.response?.data?.error || 'Failed' })
        } finally { setSubmitting(false) }
    }

    const startEdit = (t) => { setEditing(t); setForm({ name: t.name, taxAmount: t.taxAmount }) }

    const del = async (id) => {
        if (!confirm('Delete this animal type?')) return
        await api.delete(`/master/animal-types/${id}`)
        load()
    }

    return (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 24, alignItems: 'start' }}>
            <div className="card">
                <div className="card-header"><span className="card-title">{editing ? '✏️ Edit' : '➕ Add'} Animal Type</span></div>
                <div className="card-body">
                    {msg.text && (
                        <div style={{ background: msg.type === 'success' ? '#f0fdf4' : '#fef2f2', color: msg.type === 'success' ? '#16a34a' : '#dc2626', borderRadius: 8, padding: '10px 14px', marginBottom: 16, fontSize: 14 }}>
                            {msg.type === 'success' ? '✅' : '⚠️'} {msg.text}
                        </div>
                    )}
                    <form onSubmit={submit}>
                        <div className="form-group">
                            <label className="form-label">Name *</label>
                            <input className="form-control" placeholder="e.g. Cattle" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Tax Amount (ETB) *</label>
                            <input type="number" className="form-control" placeholder="0.00" value={form.taxAmount} onChange={e => setForm({ ...form, taxAmount: e.target.value })} min="0" step="0.01" required />
                        </div>
                        <div style={{ display: 'flex', gap: 8 }}>
                            <button type="submit" className="btn btn-primary" disabled={submitting}>{submitting ? '⏳ Saving...' : (editing ? '✓ Update' : '➕ Add')}</button>
                            {editing && <button type="button" className="btn btn-outline" onClick={() => { setEditing(null); setForm({ name: '', taxAmount: '' }) }}>Cancel</button>}
                        </div>
                    </form>
                </div>
            </div>

            <div className="card">
                <div className="card-header"><span className="card-title">Animal Types</span></div>
                {loading ? <div style={{ padding: 40, textAlign: 'center' }}><div className="spinner" style={{ margin: '0 auto' }} /></div> : (
                    <div className="table-wrap">
                        <table>
                            <thead><tr><th>Name</th><th style={{ textAlign: 'right' }}>Tax/Head (ETB)</th><th>Actions</th></tr></thead>
                            <tbody>
                                {types.map(t => (
                                    <tr key={t.id}>
                                        <td style={{ fontWeight: 600 }}>{t.name}</td>
                                        <td style={{ textAlign: 'right', color: '#dc2626', fontWeight: 700 }}>{fmt(t.taxAmount)}</td>
                                        <td>
                                            <div style={{ display: 'flex', gap: 6 }}>
                                                <button className="btn btn-outline btn-sm" onClick={() => startEdit(t)}>✏️ Edit</button>
                                                <button className="btn btn-sm" style={{ background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca' }} onClick={() => del(t.id)}>🗑️</button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    )
}

function UsersTab() {
    const [users, setUsers] = useState([])
    const [loading, setLoading] = useState(true)
    const [form, setForm] = useState({ name: '', email: '', password: '', role: 'ticketer', woredaId: '' })
    const [woredas, setWoredas] = useState([])
    const [submitting, setSubmitting] = useState(false)
    const [msg, setMsg] = useState({ type: '', text: '' })

    const load = async () => {
        setLoading(true)
        const [u, w] = await Promise.all([api.get('/master/users'), api.get('/master/woredas')])
        setUsers(u.data)
        setWoredas(w.data)
        setLoading(false)
    }

    useEffect(() => { load() }, [])

    const submit = async (e) => {
        e.preventDefault()
        setSubmitting(true)
        setMsg({ type: '', text: '' })
        try {
            await api.post('/auth/register', form)
            setMsg({ type: 'success', text: 'User created!' })
            setForm({ name: '', email: '', password: '', role: 'ticketer', woredaId: '' })
            load()
        } catch (err) {
            setMsg({ type: 'error', text: err.response?.data?.error || 'Failed' })
        } finally { setSubmitting(false) }
    }

    const roleColors = { admin: 'badge-red', zone: 'badge-red', woreda: 'badge-green', ticketer: 'badge-gray' }

    return (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 24, alignItems: 'start' }}>
            <div className="card">
                <div className="card-header"><span className="card-title">➕ Add User</span></div>
                <div className="card-body">
                    {msg.text && (
                        <div style={{ background: msg.type === 'success' ? '#f0fdf4' : '#fef2f2', color: msg.type === 'success' ? '#16a34a' : '#dc2626', borderRadius: 8, padding: '10px 14px', marginBottom: 16, fontSize: 14 }}>
                            {msg.type === 'success' ? '✅' : '⚠️'} {msg.text}
                        </div>
                    )}
                    <form onSubmit={submit}>
                        <div className="form-group">
                            <label className="form-label">Full Name *</label>
                            <input className="form-control" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Email *</label>
                            <input type="email" className="form-control" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Password *</label>
                            <input type="password" className="form-control" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Role *</label>
                            <select className="form-select" value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}>
                                <option value="ticketer">Ticketer</option>
                                <option value="woreda">Woreda Admin</option>
                                <option value="zone">Zone Admin</option>
                                <option value="admin">System Admin</option>
                            </select>
                        </div>
                        <div className="form-group">
                            <label className="form-label">Primary Woreda</label>
                            <select className="form-select" value={form.woredaId} onChange={e => setForm({ ...form, woredaId: e.target.value })}>
                                <option value="">None</option>
                                {woredas.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                            </select>
                        </div>
                        <button type="submit" className="btn btn-primary" disabled={submitting}>{submitting ? '⏳ Creating...' : '➕ Create User'}</button>
                    </form>
                </div>
            </div>

            <div className="card">
                <div className="card-header"><span className="card-title">All Users</span></div>
                {loading ? <div style={{ padding: 40, textAlign: 'center' }}><div className="spinner" style={{ margin: '0 auto' }} /></div> : (
                    <div className="table-wrap">
                        <table>
                            <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Woreda</th></tr></thead>
                            <tbody>
                                {users.map(u => (
                                    <tr key={u.id}>
                                        <td style={{ fontWeight: 600 }}>{u.name}</td>
                                        <td style={{ fontSize: 13, color: '#6b7280' }}>{u.email || '—'}</td>
                                        <td><span className={`badge ${roleColors[u.role] || 'badge-gray'}`}>{u.role}</span></td>
                                        <td>{u.woredaId ? woredas.find(w => w.id === u.woredaId)?.name || '—' : '—'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    )
}

export default function Admin() {
    const [tab, setTab] = useState('animals')

    const tabBtnStyle = (t) => ({
        padding: '10px 20px',
        borderRadius: 8,
        border: 'none',
        cursor: 'pointer',
        fontWeight: 600,
        fontSize: 14,
        background: tab === t ? '#1f2937' : 'transparent',
        color: tab === t ? 'white' : '#6b7280',
        transition: 'all 0.2s',
    })

    return (
        <div>
            <div style={{ marginBottom: 24 }}>
                <h2 style={{ fontSize: 24, fontWeight: 800, marginBottom: 4 }}>Administration</h2>
                <p style={{ color: '#6b7280', fontSize: 14 }}>Manage animal types, users, and system configuration</p>
            </div>

            <div style={{ background: 'white', borderRadius: 10, padding: 6, display: 'inline-flex', gap: 4, boxShadow: '0 1px 4px rgba(0,0,0,0.08)', marginBottom: 24 }}>
                <button style={tabBtnStyle('animals')} onClick={() => setTab('animals')}>🐄 Animal Types</button>
                <button style={tabBtnStyle('users')} onClick={() => setTab('users')}>👥 Users</button>
            </div>

            {tab === 'animals' && <AnimalTypesTab />}
            {tab === 'users' && <UsersTab />}
        </div>
    )
}
