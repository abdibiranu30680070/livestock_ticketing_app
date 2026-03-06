import { useEffect, useState } from 'react'
import { toast } from 'react-hot-toast'
import api from '../api.js'

const fmt = n => Number(n || 0).toLocaleString('en', { minimumFractionDigits: 2 })

export default function Collections() {
    const [collections, setCollections] = useState([])
    const [total, setTotal] = useState(0)
    const [ticketers, setTicketers] = useState([])
    const [loading, setLoading] = useState(true)
    const [form, setForm] = useState({ ticketerId: '', amount: '' })
    const [formLoading, setFormLoading] = useState(false)

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
        setFormLoading(true)
        try {
            await api.post('/collections', form)
            setForm({ ticketerId: '', amount: '' })
            toast.success('Sassaabbii gibiraa sirriitti galmaa\'eera!')
            loadData()
        } catch (err) {
            toast.error(err.response?.data?.error || 'Sassaabbii galmeessuun hin danda\'amne')
        } finally { setFormLoading(false) }
    }

    return (
        <div>
            <div style={{ marginBottom: 24 }}>
                <h2 style={{ fontSize: 24, fontWeight: 800, marginBottom: 4 }}>Sassaabbii Gibiraa (Maallaqa)</h2>
                <p style={{ color: '#6b7280', fontSize: 14 }}>Maallaqa sassaabaa gibiraa irraa qabame galmeessi</p>
            </div>

            {/* Record new collection */}
            <div className="card" style={{ marginBottom: 24, maxWidth: 520 }}>
                <div className="card-header"><span className="card-title">💰 Sassaabbii Galmeessi</span></div>
                <div className="card-body">
                    <form onSubmit={handleRecord}>
                        <div className="form-group">
                            <label className="form-label">Sassaabaa Gibiraa *</label>
                            <select className="form-select" value={form.ticketerId} onChange={e => setForm({ ...form, ticketerId: e.target.value })} required>
                                <option value="">Sassaabaa filadhu...</option>
                                {ticketers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                            </select>
                        </div>
                        <div className="form-group">
                            <label className="form-label">Maallaqa Sassaabame (ETB) *</label>
                            <input type="number" className="form-control" placeholder="0.00" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} min="0.01" step="0.01" required />
                        </div>
                        <button type="submit" className="btn btn-primary" disabled={formLoading}>
                            {formLoading ? '⏳ Galmeessaa jira...' : '✓ Sassaabbii Galmeessi'}
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
                        <span className="card-title">Seenaa Sassaabbii <span className="badge badge-gray">{total}</span></span>
                    </div>
                    <div className="table-wrap">
                        <table>
                            <thead>
                                <tr>
                                    <th>Lakk. Nagahee</th>
                                    <th>Guyyaa</th>
                                    <th>Sassaabaa</th>
                                    <th>Aanaa</th>
                                    <th style={{ textAlign: 'right' }}>Maallaqa (ETB)</th>
                                </tr>
                            </thead>
                            <tbody>
                                {collections.length === 0 ? (
                                    <tr><td colSpan={5} style={{ textAlign: 'center', padding: '40px', color: '#9ca3af' }}>Sassaabbii gibiraa hin argamne</td></tr>
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
