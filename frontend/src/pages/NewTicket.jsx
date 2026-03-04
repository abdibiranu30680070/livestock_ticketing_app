import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api.js'

export default function NewTicket() {
    const navigate = useNavigate()
    const [animalTypes, setAnimalTypes] = useState([])
    const [form, setForm] = useState({ animalTypeId: '', quantity: 1, customerName: '' })
    const [preview, setPreview] = useState(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    useEffect(() => {
        api.get('/master/animal-types').then(r => setAnimalTypes(r.data))
    }, [])

    useEffect(() => {
        const type = animalTypes.find(t => t.id === parseInt(form.animalTypeId))
        if (type) {
            setPreview({ type, total: type.taxAmount * parseFloat(form.quantity || 1) })
        } else {
            setPreview(null)
        }
    }, [form.animalTypeId, form.quantity, animalTypes])

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError('')
        setLoading(true)
        try {
            await api.post('/tickets', form)
            navigate('/tickets')
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to create ticket')
        } finally {
            setLoading(false)
        }
    }

    const fmt = n => Number(n || 0).toLocaleString('en', { minimumFractionDigits: 2 })

    return (
        <div style={{ maxWidth: 600 }}>
            <div style={{ marginBottom: 24 }}>
                <h2 style={{ fontSize: 24, fontWeight: 800, marginBottom: 4 }}>New Ticket</h2>
                <p style={{ color: '#6b7280', fontSize: 14 }}>Issue a new livestock sale tax ticket</p>
            </div>

            <div className="card">
                <div className="card-body">
                    {error && <div style={{ background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', borderRadius: 8, padding: '12px 16px', marginBottom: 20, fontSize: 14 }}>⚠️ {error}</div>}

                    <form onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label className="form-label">Animal Type *</label>
                            <select
                                className="form-select"
                                value={form.animalTypeId}
                                onChange={e => setForm({ ...form, animalTypeId: e.target.value })}
                                required
                            >
                                <option value="">Select animal type...</option>
                                {animalTypes.map(t => (
                                    <option key={t.id} value={t.id}>{t.name} — {fmt(t.taxAmount)} ETB/head</option>
                                ))}
                            </select>
                        </div>

                        <div className="form-group">
                            <label className="form-label">Quantity (Head) *</label>
                            <input
                                type="number"
                                className="form-control"
                                value={form.quantity}
                                onChange={e => setForm({ ...form, quantity: e.target.value })}
                                min="0.5"
                                step="0.5"
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label">Customer Name (Optional)</label>
                            <input
                                type="text"
                                className="form-control"
                                placeholder="Enter customer name..."
                                value={form.customerName}
                                onChange={e => setForm({ ...form, customerName: e.target.value })}
                            />
                        </div>

                        {/* Tax Preview */}
                        {preview && (
                            <div style={{
                                background: 'linear-gradient(135deg, #fef2f2, #fff5f5)',
                                border: '2px solid #fca5a5',
                                borderRadius: 12,
                                padding: '20px 24px',
                                marginBottom: 24,
                            }}>
                                <div style={{ fontSize: 12, fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12 }}>Tax Calculation Preview</div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 14 }}>
                                    <span>Animal Type:</span><strong>{preview.type.name}</strong>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 14 }}>
                                    <span>Rate:</span><strong>{fmt(preview.type.taxAmount)} ETB/head</strong>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 14 }}>
                                    <span>Quantity:</span><strong>{form.quantity} Head</strong>
                                </div>
                                <div style={{
                                    borderTop: '1px dashed #fca5a5',
                                    marginTop: 12, paddingTop: 12,
                                    display: 'flex', justifyContent: 'space-between',
                                    fontSize: 22, fontWeight: 800, color: '#dc2626'
                                }}>
                                    <span>TOTAL TAX:</span>
                                    <span>{fmt(preview.total)} ETB</span>
                                </div>
                            </div>
                        )}

                        <div style={{ display: 'flex', gap: 12 }}>
                            <button type="submit" className="btn btn-primary btn-lg" style={{ flex: 1 }} disabled={loading}>
                                {loading ? '⏳ Creating...' : '🎫 Issue Ticket'}
                            </button>
                            <button type="button" className="btn btn-outline btn-lg" onClick={() => navigate('/tickets')}>
                                Cancel
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    )
}
