import { useEffect, useState } from 'react'
import api from '../api.js'

const fmt = n => Number(n || 0).toLocaleString('en', { minimumFractionDigits: 2 })

export default function Collections() {
    const [collections, setCollections] = useState([])
    const [total, setTotal] = useState(0)
    const [ticketers, setTicketers] = useState([])
    const [loading, setLoading] = useState(true)
    const [form, setForm] = useState({ ticketerId: '', amount: '' })
    const [formLoading, setFormLoading] = useState(false)
    const [error, setError] = useState('')
    const [success, setSuccess] = useState('')

    const loadData = async () => {
        setLoading(true)
        try {
            const [coll, users] = await Promise.all([
                api.get('/collections'),
                api.get('/master/users')
            ])
            setCollections(coll.data.collections)
            setTotal(coll.data.total)
            setTicketers(users.data.filter(u => u.role === 'ticketer'))
        } catch { } finally { setLoading(false) }
    }

    useEffect(() => { loadData() }, [])

    const handleRecord = async (e) => {
        e.preventDefault()
        setError('')
        setSuccess('')
        setFormLoading(true)
        try {
            await api.post('/collections', form)
            setForm({ ticketerId: '', amount: '' })
            setSuccess('Collection recorded successfully!')
            loadData()
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to record collection')
        } finally { setFormLoading(false) }
    }

    return (
        <div>
            <div style={{ marginBottom: 24 }}>
                <h2 style={{ fontSize: 24, fontWeight: 800, marginBottom: 4 }}>Cash Collections</h2>
                <p style={{ color: '#6b7280', fontSize: 14 }}>Record tax cash handovers from ticketers</p>
            </div>

            {/* Record new collection */}
            <div className="card" style={{ marginBottom: 24, maxWidth: 520 }}>
                <div className="card-header"><span className="card-title">💰 Record Collection</span></div>
                <div className="card-body">
                    {error && <div style={{ background: '#fef2f2', color: '#dc2626', borderRadius: 8, padding: '10px 14px', marginBottom: 16, fontSize: 14 }}>⚠️ {error}</div>}
                    {success && <div style={{ background: '#f0fdf4', color: '#16a34a', borderRadius: 8, padding: '10px 14px', marginBottom: 16, fontSize: 14 }}>✅ {success}</div>}
                    <form onSubmit={handleRecord}>
                        <div className="form-group">
                            <label className="form-label">Ticketer *</label>
                            <select className="form-select" value={form.ticketerId} onChange={e => setForm({ ...form, ticketerId: e.target.value })} required>
                                <option value="">Select ticketer...</option>
                                {ticketers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                            </select>
                        </div>
                        <div className="form-group">
                            <label className="form-label">Amount Collected (ETB) *</label>
                            <input type="number" className="form-control" placeholder="0.00" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} min="0.01" step="0.01" required />
                        </div>
                        <button type="submit" className="btn btn-primary" disabled={formLoading}>
                            {formLoading ? '⏳ Recording...' : '✓ Record Collection'}
                        </button>
                    </form>
                </div>
            </div>

            {/* Collections table */}
            {loading ? (
                <div className="loading-wrap"><div className="spinner" /></div>
            ) : (
                <div className="card">
                    <div className="card-header">
                        <span className="card-title">Collection History <span className="badge badge-gray">{total}</span></span>
                    </div>
                    <div className="table-wrap">
                        <table>
                            <thead>
                                <tr>
                                    <th>Reference</th>
                                    <th>Date</th>
                                    <th>Ticketer</th>
                                    <th>Woreda</th>
                                    <th style={{ textAlign: 'right' }}>Amount (ETB)</th>
                                </tr>
                            </thead>
                            <tbody>
                                {collections.length === 0 ? (
                                    <tr><td colSpan={5} style={{ textAlign: 'center', padding: '40px', color: '#9ca3af' }}>No collections yet</td></tr>
                                ) : collections.map(c => (
                                    <tr key={c.id}>
                                        <td style={{ fontWeight: 700 }}>{c.reference}</td>
                                        <td style={{ fontSize: 13, color: '#6b7280' }}>{new Date(c.date).toLocaleDateString()}</td>
                                        <td>{c.ticketer?.name}</td>
                                        <td>{c.woreda?.name || '—'}</td>
                                        <td style={{ textAlign: 'right', fontWeight: 700, color: '#16a34a' }}>{fmt(c.amount)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    )
}
