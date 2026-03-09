import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useReactToPrint } from 'react-to-print'
import { toast } from 'react-hot-toast'
import api from '../api.js'
import OdaaIcon from '../components/OdaaIcon.jsx'

const fmtNum = n => Number(n || 0).toLocaleString('en', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

function Receipt({ ticket }) {
    return (
        <div className="receipt" style={{ 
            width: '300px', 
            margin: '0 auto', 
            padding: '20px', 
            background: 'white',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
        }}>
            <div className="receipt-header" style={{ textAlign: 'center', marginBottom: '16px' }}>
                <div style={{ fontWeight: 700, fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                    <OdaaIcon style={{ width: '16px', height: '16px' }} />
                    GODINA ARSI LIIXA
                </div>
                <div style={{ fontSize: 12, color: '#6b7280' }}>Nagahee Gibira Gabaa Beeyladaa</div>
                <div style={{ fontSize: 10, color: '#9ca3af', marginTop: 4 }}>{new Date().toLocaleString()}</div>
            </div>
            <div style={{ fontSize: 12, lineHeight: '1.4' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span>Lakk. Nagahee:</span>
                    <span style={{ fontWeight: 600 }}>{ticket.reference}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span>Gosa:</span>
                    <span>{ticket.animalType?.name}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span>Baay'ina:</span>
                    <span>{ticket.quantity} Ol</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span>Gatii Tokkoo:</span>
                    <span>{fmtNum(ticket.animalType?.taxAmount)} ETB</span>
                </div>
                {ticket.customerName && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                        <span>Maqaa Maamilaa:</span>
                        <span>{ticket.customerName}</span>
                    </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span>Sassaabaa:</span>
                    <span>{ticket.taxTaker?.name}</span>
                </div>
                <div style={{ borderTop: '1px dashed #d1d5db', paddingTop: '8px', marginTop: '8px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: 14 }}>
                        <span>GIBIRA WALIIGALAA</span>
                        <span style={{ color: '#dc2626' }}>{fmtNum(ticket.taxAmount)} ETB</span>
                    </div>
                </div>
                <div style={{ textAlign: 'center', fontSize: 10, color: '#9ca3af', marginTop: 12 }}>
                    Galatoomaa · Horaa Bulaa
                </div>
            </div>
        </div>
    )
}

export default function ImprovedSimpleNewTicket() {
    const navigate = useNavigate()
    const [animalTypes, setAnimalTypes] = useState([])
    const [form, setForm] = useState({ animalTypeId: '', quantity: 1, customerName: '' })
    const [preview, setPreview] = useState(null)
    const [loading, setLoading] = useState(false)
    const [createdTicket, setCreatedTicket] = useState(null)
    const [showReceipt, setShowReceipt] = useState(false)
    const printRef = useRef()

    const handlePrint = useReactToPrint({
        content: () => printRef.current,
        onAfterPrint: () => {
            // Don't navigate away, just reset for next ticket
            setCreatedTicket(null)
            setShowReceipt(false)
            setForm({ animalTypeId: '', quantity: 1, customerName: '' })
            setPreview(null)
        }
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
        setLoading(true)
        
        try {
            // Step 1: Create ticket
            const ticketRes = await api.post('/tickets', form)
            const ticket = ticketRes.data
            
            // Step 2: Confirm ticket immediately
            await api.patch(`/tickets/${ticket.id}/confirm`)
            
            // Step 3: Show ticket on same page
            setCreatedTicket(ticket)
            setShowReceipt(true)
            
            toast.success('Nagaheen qophaa\'e, mirkanaa\'e!')
            
        } catch (err) {
            console.error('Error:', err)
            toast.error(err.response?.data?.error || 'Nagaheen qophaamuu hin dandaamne')
        } finally {
            setLoading(false)
        }
    }

    const handlePrintAndSave = () => {
        handlePrint()
    }

    const handleNewTicket = () => {
        setCreatedTicket(null)
        setShowReceipt(false)
        setForm({ animalTypeId: '', quantity: 1, customerName: '' })
        setPreview(null)
    }

    const fmt = n => Number(n || 0).toLocaleString('en', { minimumFractionDigits: 2 })

    if (showReceipt && createdTicket) {
        return (
            <div style={{ maxWidth: 600, margin: '0 auto', padding: '20px' }}>
                <div style={{ textAlign: 'center', marginBottom: 24 }}>
                    <div style={{ fontSize: 48, marginBottom: 16 }}>✅</div>
                    <h2 style={{ fontSize: 24, fontWeight: 800, marginBottom: 8, color: '#16a34a' }}>
                        Nagaheen Mirkaneera!
                    </h2>
                    <p style={{ color: '#6b7280', fontSize: 14 }}>
                        Nagahee: {createdTicket.reference} • Gibira: {fmt(createdTicket.taxAmount)} ETB
                    </p>
                </div>

                {/* Receipt Display */}
                <div style={{ marginBottom: 24 }}>
                    <div ref={printRef}>
                        <Receipt ticket={createdTicket} />
                    </div>
                </div>

                <div style={{ marginTop: 24, textAlign: 'center' }}>
                    <p style={{ fontSize: 12, color: '#9ca3af' }}>
                        Nagaheen mirkaneera • Maxxansiuf danda'a
                    </p>
                </div>
            </div>
        )
    }

    return (
        <div style={{ maxWidth: 600, margin: '0 auto', padding: '20px' }}>
            <div style={{ marginBottom: 20 }}>
                <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 4 }}>🎫 Nagahee Haaraa</h2>
                <p style={{ color: '#6b7280', fontSize: 13 }}>Gibira gabaa beeyladaatiif nagahee haaraa qopheessi</p>
            </div>

            <div className="card" style={{ border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
                <div className="card-body" style={{ padding: '24px 20px' }}>
                    <form onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label className="form-label">Gosa Beeyladaa *</label>
                            <select
                                className="form-select"
                                style={{ height: 48, fontSize: 16 }}
                                value={form.animalTypeId}
                                onChange={e => setForm({ ...form, animalTypeId: e.target.value })}
                                required
                            >
                                <option value="">Gosa beeyladaa filadhu...</option>
                                {animalTypes.map(t => (
                                    <option key={t.id} value={t.id}>{t.name} — {fmt(t.taxAmount)} ETB/ol</option>
                                ))}
                            </select>
                        </div>

                        <div className="form-group">
                            <label className="form-label">Baay'ina (Ol) *</label>
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
                            <label className="form-label">Maqaa Maamilaa (Waliif-malaa)</label>
                            <input
                                type="text"
                                className="form-control"
                                style={{ height: 48, fontSize: 16 }}
                                placeholder="Maqaa maamilaa galchi..."
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
                                <div style={{ fontSize: 11, fontWeight: 700, color: '#f87171', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12 }}>Dura-bu'aa Herrega Gibiraa</div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 14 }}>
                                    <span>Gosa:</span><strong>{preview.type.name}</strong>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 14 }}>
                                    <span>Baay'ina:</span><strong>{form.quantity} Ol</strong>
                                </div>
                                <div style={{
                                    borderTop: '1px dashed #fca5a5',
                                    marginTop: 12, paddingTop: 12,
                                    display: 'flex', justifyContent: 'space-between',
                                    fontSize: 24, fontWeight: 900, color: '#dc2626'
                                }}>
                                    <span>WALIIGALA:</span>
                                    <span>{fmt(preview.total)} ETB</span>
                                </div>
                            </div>
                        )}

                        {/* Improved Buttons - Smaller Size */}
                        <div style={{ display: 'flex', gap: 12 }}>
                            <button 
                                type="submit" 
                                className="btn btn-primary"
                                style={{
                                    flex: 1,
                                    padding: '10px 16px',
                                    fontSize: 14,
                                    fontWeight: 600,
                                    borderRadius: 6,
                                    border: 'none',
                                    background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
                                    color: 'white',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: 6,
                                    transition: 'all 0.2s ease'
                                }}
                                disabled={loading}
                                onMouseOver={(e) => {
                                    e.target.style.background = 'linear-gradient(135deg, #2563eb, #1d4ed8)'
                                    e.target.style.transform = 'translateY(-1px)'
                                }}
                                onMouseOut={(e) => {
                                    e.target.style.background = 'linear-gradient(135deg, #3b82f6, #2563eb)'
                                    e.target.style.transform = 'translateY(0)'
                                }}
                            >
                                {loading ? '⏳ Qophaa\'aa jira...' : '🖨️ Nagahe Qopheessi'}
                            </button>
                            
                            <button 
                                type="button" 
                                className="btn btn-outline"
                                onClick={() => navigate('/tickets')}
                                style={{
                                    padding: '10px 20px',
                                    fontSize: 14,
                                    fontWeight: 600,
                                    borderRadius: 6,
                                    border: '2px solid #6b7280',
                                    background: 'white',
                                    color: '#6b7280',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: 6,
                                    transition: 'all 0.2s ease'
                                }}
                                onMouseOver={(e) => {
                                    e.target.style.background = '#f9fafb'
                                    e.target.style.borderColor = '#4b5563'
                                    e.target.style.transform = 'translateY(-1px)'
                                }}
                                onMouseOut={(e) => {
                                    e.target.style.background = 'white'
                                    e.target.style.borderColor = '#6b7280'
                                    e.target.style.transform = 'translateY(0)'
                                }}
                            >
                                🚪 Dhiisi
                            </button>
                        </div>

                        <div style={{ marginTop: 16, padding: '12px', background: '#f0f9ff', borderRadius: 8, border: '1px solid #bfdbfe' }}>
                            <p style={{ margin: 0, fontSize: 12, color: '#1e40af', textAlign: 'center' }}>
                                📌 <strong>Yaada:</strong> "Nagahe Qopheessi" tuqaa, nagahee qophaachu, mirkaneessuu, fi maxxansuudhaan haasofama.
                            </p>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    )
}
