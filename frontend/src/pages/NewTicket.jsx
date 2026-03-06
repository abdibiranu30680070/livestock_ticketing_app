import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useReactToPrint } from 'react-to-print'
import api from '../api.js'
import OdaaIcon from '../components/OdaaIcon.jsx'

const fmtNum = n => Number(n || 0).toLocaleString('en', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

function Receipt({ ticket }) {
    return (
        <div className="receipt">
            <div className="receipt-header">
                <div style={{ fontWeight: 700, fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                    <OdaaIcon style={{ width: '16px', height: '16px' }} />
                    ARSI LIIXA ZONE
                </div>
                <div>Livestock Market Tax Receipt</div>
                <div style={{ fontSize: 10, marginTop: 4 }}>{new Date().toLocaleString()}</div>
            </div>
            <div className="receipt-row"><span>Ref #:</span><span>{ticket.reference}</span></div>
            <div className="receipt-row"><span>Type:</span><span>{ticket.animalType?.name}</span></div>
            <div className="receipt-row"><span>Quantity:</span><span>{ticket.quantity} Head</span></div>
            <div className="receipt-row"><span>Unit Rate:</span><span>{fmtNum(ticket.animalType?.taxAmount)} ETB</span></div>
            {ticket.customerName && <div className="receipt-row"><span>Customer:</span><span>{ticket.customerName}</span></div>}
            <div className="receipt-row"><span>Collector:</span><span>{ticket.taxTaker?.name}</span></div>
            <div className="receipt-total">
                <div className="receipt-row"><span>TOTAL TAX</span><span>{fmtNum(ticket.taxAmount)} ETB</span></div>
            </div>
            <div style={{ textAlign: 'center', fontSize: 10, marginTop: 8 }}>Thank you · Ameseginalehu</div>
        </div>
    )
}

export default function NewTicket() {
    const navigate = useNavigate()
    const [animalTypes, setAnimalTypes] = useState([])
    const [form, setForm] = useState({ animalTypeId: '', quantity: 1, customerName: '' })
    const [preview, setPreview] = useState(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [createdTicket, setCreatedTicket] = useState(null)
    const printRef = useRef()

    const handlePrint = useReactToPrint({
        content: () => printRef.current,
        onAfterPrint: () => navigate('/tickets')
    })

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
            const res = await api.post('/tickets', form)
            setCreatedTicket(res.data)
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to create ticket')
        } finally {
            setLoading(false)
        }
    }

    const confirmAndPrint = async () => {
        if (!createdTicket) return
        setLoading(true)
        try {
            await api.patch(`/tickets/${createdTicket.id}/confirm`)
            handlePrint()
        } catch (err) {
            setError('Failed to confirm ticket')
        } finally {
            setLoading(false)
        }
    }

    const fmt = n => Number(n || 0).toLocaleString('en', { minimumFractionDigits: 2 })

    return (
        <div style={{ maxWidth: 600, margin: '0 auto' }}>
            {createdTicket && (
                <div style={{ display: 'none' }}>
                    <div ref={printRef}>
                        <Receipt ticket={createdTicket} />
                    </div>
                </div>
            )}

            <div style={{ marginBottom: 20 }}>
                <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 4 }}>{createdTicket ? '✅ Ticket Issued!' : '🎫 New Ticket'}</h2>
                <p style={{ color: '#6b7280', fontSize: 13 }}>{createdTicket ? 'The ticket has been recorded successfully.' : 'Issue a new livestock sale tax ticket'}</p>
            </div>

            <div className="card" style={{ border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
                <div className="card-body" style={{ padding: '24px 20px' }}>
                    {error && <div style={{ background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', borderRadius: 8, padding: '12px 16px', marginBottom: 20, fontSize: 14 }}>⚠️ {error}</div>}

                    {!createdTicket ? (
                        <form onSubmit={handleSubmit}>
                            <div className="form-group">
                                <label className="form-label">Animal Type *</label>
                                <select
                                    className="form-select"
                                    style={{ height: 48, fontSize: 16 }}
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
                                    style={{ height: 48, fontSize: 16 }}
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
                                    style={{ height: 48, fontSize: 16 }}
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
                                    <div style={{ fontSize: 11, fontWeight: 700, color: '#f87171', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12 }}>Tax Calculation Preview</div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 14 }}>
                                        <span>Type:</span><strong>{preview.type.name}</strong>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 14 }}>
                                        <span>Quantity:</span><strong>{form.quantity} Head</strong>
                                    </div>
                                    <div style={{
                                        borderTop: '1px dashed #fca5a5',
                                        marginTop: 12, paddingTop: 12,
                                        display: 'flex', justifyContent: 'space-between',
                                        fontSize: 24, fontWeight: 900, color: '#dc2626'
                                    }}>
                                        <span>TOTAL:</span>
                                        <span>{fmt(preview.total)} ETB</span>
                                    </div>
                                </div>
                            )}

                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
                                <button type="submit" className="btn btn-primary btn-lg" style={{ flex: '1 1 200px' }} disabled={loading}>
                                    {loading ? '⏳ Creating...' : '🎫 Issue Ticket'}
                                </button>
                                <button type="button" className="btn btn-outline btn-lg" style={{ flex: '1 1 120px' }} onClick={() => navigate('/tickets')}>
                                    Cancel
                                </button>
                            </div>
                        </form>
                    ) : (
                        <div style={{ textAlign: 'center', padding: '10px 0' }}>
                            <div style={{ fontSize: 48, marginBottom: 12 }}>✅</div>
                            <h3 style={{ fontSize: 20, fontWeight: 800, marginBottom: 4 }}>{createdTicket.reference}</h3>
                            <p style={{ color: '#6b7280', marginBottom: 24 }}>Total Tax: <strong style={{ color: '#dc2626', fontSize: 22 }}>{fmt(createdTicket.taxAmount)} <span style={{ fontSize: 14 }}>ETB</span></strong></p>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                <button onClick={confirmAndPrint} className="btn btn-success btn-lg" style={{ width: '100%', fontSize: 18 }} disabled={loading}>
                                    {loading ? '⏳ Processing...' : '🖨️ Print & Confirm'}
                                </button>
                                <button onClick={() => navigate('/tickets')} className="btn btn-outline btn-lg" style={{ width: '100%' }}>
                                    Done
                                </button>
                            </div>

                            <p style={{ marginTop: 24, fontSize: 11, color: '#9ca3af' }}>
                                ⚠️ Ref #: {createdTicket.reference} · Confirmed prints are recorded.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>

    )
}
