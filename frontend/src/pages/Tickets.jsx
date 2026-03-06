import { useEffect, useRef, useState } from 'react'
import { useReactToPrint } from 'react-to-print'
import api from '../api.js'
import { useAuth } from '../context/AuthContext.jsx'
import OdaaIcon from '../components/OdaaIcon.jsx'

const fmt = n => Number(n || 0).toLocaleString('en', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

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
            <div className="receipt-row"><span>Unit Rate:</span><span>{fmt(ticket.animalType?.taxAmount)} ETB</span></div>
            {ticket.customerName && <div className="receipt-row"><span>Customer:</span><span>{ticket.customerName}</span></div>}
            <div className="receipt-row"><span>Collector:</span><span>{ticket.taxTaker?.name}</span></div>
            <div className="receipt-total">
                <div className="receipt-row"><span>TOTAL TAX</span><span>{fmt(ticket.taxAmount)} ETB</span></div>
            </div>
            <div style={{ textAlign: 'center', fontSize: 10, marginTop: 8 }}>Thank you · Ameseginalehu</div>
        </div>
    )
}

export default function Tickets() {
    const { user } = useAuth()
    const [tickets, setTickets] = useState([])
    const [total, setTotal] = useState(0)
    const [loading, setLoading] = useState(true)
    const [printing, setPrinting] = useState(null)
    const [filters, setFilters] = useState({ limit: 15, offset: 0, state: '', from: '', to: '' })
    const printRef = useRef()

    const load = async (f = filters) => {
        setLoading(true)
        try {
            const res = await api.get('/tickets', { params: f })
            setTickets(res.data.tickets)
            setTotal(res.data.total)
        } catch { }
        finally { setLoading(false) }
    }

    useEffect(() => { load() }, [])

    const handleConfirm = async (id) => {
        await api.patch(`/tickets/${id}/confirm`)
        load()
    }

    const handlePrint = useReactToPrint({ content: () => printRef.current, onAfterPrint: () => setPrinting(null) })

    const startPrint = (ticket) => { setPrinting(ticket); setTimeout(handlePrint, 100) }

    const onPage = (dir) => {
        const f = { ...filters, offset: Math.max(0, filters.offset + dir * filters.limit) }
        setFilters(f); load(f)
    }

    return (
        <div>
            {/* Hidden print area */}
            {printing && <div style={{ display: 'none' }}><div ref={printRef}><Receipt ticket={printing} /></div></div>}

            <div style={{ marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2 style={{ fontSize: 24, fontWeight: 800 }}>Tickets</h2>
                <a href="/tickets/new" className="btn btn-primary">➕ New Ticket</a>
            </div>

            {/* Filter */}
            <div className="filter-bar">
                <div className="form-group">
                    <label className="form-label">Status</label>
                    <select className="form-select" value={filters.state} onChange={e => setFilters({ ...filters, state: e.target.value })}>
                        <option value="">All</option>
                        <option value="draft">Draft</option>
                        <option value="printed">Confirmed</option>
                    </select>
                </div>
                <div className="form-group">
                    <label className="form-label">From</label>
                    <input type="date" className="form-control" value={filters.from} onChange={e => setFilters({ ...filters, from: e.target.value })} />
                </div>
                <div className="form-group">
                    <label className="form-label">To</label>
                    <input type="date" className="form-control" value={filters.to} onChange={e => setFilters({ ...filters, to: e.target.value })} />
                </div>
                <div className="filter-actions">
                    <button className="btn btn-primary" onClick={() => { const f = { ...filters, offset: 0 }; setFilters(f); load(f) }}>🔍 Filter</button>
                    <button className="btn btn-outline" onClick={() => { const f = { limit: 15, offset: 0, state: '', from: '', to: '' }; setFilters(f); load(f) }}>↺ Reset</button>
                </div>
            </div>

            {loading ? (
                <div className="loading-wrap"><div className="spinner" /><p>Loading tickets...</p></div>
            ) : (
                <div className="card">
                    <div className="card-header">
                        <span className="card-title">All Tickets <span className="badge badge-gray">{total}</span></span>
                        <div style={{ display: 'flex', gap: 8 }}>
                            <button className="btn btn-outline btn-sm" onClick={() => onPage(-1)} disabled={filters.offset === 0}>← Prev</button>
                            <span style={{ alignSelf: 'center', fontSize: 13, color: '#6b7280' }}>{filters.offset + 1}–{Math.min(filters.offset + filters.limit, total)}</span>
                            <button className="btn btn-outline btn-sm" onClick={() => onPage(1)} disabled={total <= filters.offset + filters.limit}>Next →</button>
                        </div>
                    </div>
                    <div className="table-wrap">
                        <table>
                            <thead>
                                <tr>
                                    <th>Reference</th>
                                    <th>Date</th>
                                    <th>Animal Type</th>
                                    <th style={{ textAlign: 'center' }}>Qty</th>
                                    <th style={{ textAlign: 'right' }}>Tax (ETB)</th>
                                    <th>Collector</th>
                                    <th>Woreda</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {tickets.length === 0 ? (
                                    <tr><td colSpan={9} style={{ textAlign: 'center', padding: '40px', color: '#9ca3af' }}>
                                        <div className="empty-state"><div className="empty-icon">🎫</div><p>No tickets found</p></div>
                                    </td></tr>
                                ) : tickets.map(t => (
                                    <tr key={t.id}>
                                        <td style={{ fontWeight: 700 }}>{t.reference}</td>
                                        <td style={{ fontSize: 13, color: '#6b7280' }}>{new Date(t.date).toLocaleDateString()}</td>
                                        <td><span className="badge badge-red">{t.animalType?.name}</span></td>
                                        <td style={{ textAlign: 'center' }}>{t.quantity}</td>
                                        <td style={{ textAlign: 'right', fontWeight: 700, color: '#dc2626' }}>{fmt(t.taxAmount)}</td>
                                        <td>{t.taxTaker?.name}</td>
                                        <td>{t.woreda?.name || '—'}</td>
                                        <td><span className={`badge ${t.state === 'printed' ? 'badge-green' : 'badge-gray'}`}>{t.state}</span></td>
                                        <td>
                                            <div style={{ display: 'flex', gap: 6 }}>
                                                {t.state === 'draft' && (
                                                    <button className="btn btn-success btn-sm" onClick={() => handleConfirm(t.id)}>✓ Confirm</button>
                                                )}
                                                <button
                                                    className="btn btn-outline btn-sm"
                                                    onClick={() => startPrint(t)}
                                                    disabled={t.state === 'printed'}
                                                    title={t.state === 'printed' ? 'Already Printed' : 'Print Receipt'}
                                                >
                                                    {t.state === 'printed' ? '✅ Printed' : '🖨️ Print'}
                                                </button>
                                            </div>
                                        </td>
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
