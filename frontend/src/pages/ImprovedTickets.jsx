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
                    GODINA ARSI LIIXA
                </div>
                <div>Nagahee Gibira Gabaa Beeyladaa</div>
                <div style={{ fontSize: 10, marginTop: 4 }}>{new Date().toLocaleString()}</div>
            </div>
            <div className="receipt-row"><span>Lakk. Nagahee:</span><span>{ticket.reference}</span></div>
            <div className="receipt-row"><span>Gosa:</span><span>{ticket.animalType?.name}</span></div>
            <div className="receipt-row"><span>Baay'ina:</span><span>{ticket.quantity} Ol</span></div>
            <div className="receipt-row"><span>Gatii Tokkoo:</span><span>{fmt(ticket.animalType?.taxAmount)} ETB</span></div>
            {ticket.customerName && <div className="receipt-row"><span>Maqaa Maamilaa:</span><span>{ticket.customerName}</span></div>}
            <div className="receipt-row"><span>Sassaabaa:</span><span>{ticket.taxTaker?.name}</span></div>
            <div className="receipt-total">
                <div className="receipt-row"><span>GIBIRA WALIIGALAA</span><span>{fmt(ticket.taxAmount)} ETB</span></div>
            </div>
            <div style={{ textAlign: 'center', fontSize: 10, marginTop: 8 }}>Galatoomaa · Horaa Bulaa</div>
        </div>
    )
}

export default function ImprovedTickets() {
    const { user } = useAuth()
    const [tickets, setTickets] = useState([])
    const [total, setTotal] = useState(0)
    const [loading, setLoading] = useState(true)
    const [printing, setPrinting] = useState(null)
    const [viewMode, setViewMode] = useState('summary') // 'summary' or 'detailed'
    const [filters, setFilters] = useState({ limit: 50, offset: 0, state: '', from: '', to: '' })
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

    // Group tickets by date for summary view
    const getTicketsByDate = () => {
        const grouped = {}
        tickets.forEach(ticket => {
            const date = new Date(ticket.date).toLocaleDateString()
            if (!grouped[date]) {
                grouped[date] = {
                    date,
                    tickets: [],
                    totalCount: 0,
                    totalTax: 0,
                    confirmedCount: 0
                }
            }
            grouped[date].tickets.push(ticket)
            grouped[date].totalCount += 1
            grouped[date].totalTax += ticket.taxAmount || 0
            if (ticket.state === 'printed') {
                grouped[date].confirmedCount += 1
            }
        })
        return Object.values(grouped).sort((a, b) => new Date(b.date) - new Date(a.date))
    }

    const ticketsByDate = getTicketsByDate()

    // Get summary stats
    const getSummaryStats = () => {
        const stats = {
            totalTickets: tickets.length,
            confirmedTickets: tickets.filter(t => t.state === 'printed').length,
            totalTax: tickets.reduce((sum, t) => sum + (t.taxAmount || 0), 0),
            todayTickets: tickets.filter(t => {
                const today = new Date().toLocaleDateString()
                const ticketDate = new Date(t.date).toLocaleDateString()
                return today === ticketDate
            }).length
        }
        return stats
    }

    const stats = getSummaryStats()

    return (
        <div>
            {/* Hidden print area */}
            {printing && <div style={{ display: 'none' }}><div ref={printRef}><Receipt ticket={printing} /></div></div>}

            <div style={{ marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2 style={{ fontSize: 24, fontWeight: 800 }}>Tikkeetii / Nagahee</h2>
                <a href="/tickets/new" className="btn btn-primary">➕ Nagahee Haaraa</a>
            </div>

            {/* Summary Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 24 }}>
                <div className="card">
                    <div className="card-body" style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: 24, fontWeight: 700, color: '#3b82f6' }}>{stats.totalTickets}</div>
                        <div style={{ fontSize: 14, color: '#6b7280' }}>Nagaawwan Guutuu</div>
                    </div>
                </div>
                <div className="card">
                    <div className="card-body" style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: 24, fontWeight: 700, color: '#16a34a' }}>{stats.confirmedTickets}</div>
                        <div style={{ fontSize: 14, color: '#6b7280' }}>Mirkanaa'e</div>
                    </div>
                </div>
                <div className="card">
                    <div className="card-body" style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: 24, fontWeight: 700, color: '#dc2626' }}>{fmt(stats.totalTax)} ETB</div>
                        <div style={{ fontSize: 14, color: '#6b7280' }}>Gibira Waliigalaa</div>
                    </div>
                </div>
                <div className="card">
                    <div className="card-body" style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: 24, fontWeight: 700, color: '#f59e0b' }}>{stats.todayTickets}</div>
                        <div style={{ fontSize: 14, color: '#6b7280' }}>Har'a</div>
                    </div>
                </div>
            </div>

            {/* View Toggle and Filters */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <div style={{ display: 'flex', gap: 8 }}>
                    <button 
                        className={`btn ${viewMode === 'summary' ? 'btn-primary' : 'btn-outline'}`}
                        onClick={() => setViewMode('summary')}
                        style={{ padding: '8px 16px', fontSize: 14 }}
                    >
                        📊 Walxaxaa
                    </button>
                    <button 
                        className={`btn ${viewMode === 'detailed' ? 'btn-primary' : 'btn-outline'}`}
                        onClick={() => setViewMode('detailed')}
                        style={{ padding: '8px 16px', fontSize: 14 }}
                    >
                        📋 Bu'ura
                    </button>
                </div>

                <div className="filter-actions">
                    <button className="btn btn-outline btn-sm" onClick={() => { const f = { limit: 50, offset: 0, state: '', from: '', to: '' }; setFilters(f); load(f) }}>↺ Haaromsi</button>
                </div>
            </div>

            {/* Filter */}
            <div className="filter-bar">
                <div className="form-group">
                    <label className="form-label">Haala Nagahee</label>
                    <select className="form-select" value={filters.state} onChange={e => setFilters({ ...filters, state: e.target.value })}>
                        <option value="">Hundumaa</option>
                        <option value="draft">Draft</option>
                        <option value="printed">Mirkanaa'e</option>
                    </select>
                </div>
                <div className="form-group">
                    <label className="form-label">Guyyaa irraa</label>
                    <input type="date" className="form-control" value={filters.from} onChange={e => setFilters({ ...filters, from: e.target.value })} />
                </div>
                <div className="form-group">
                    <label className="form-label">Guyyaa hamma</label>
                    <input type="date" className="form-control" value={filters.to} onChange={e => setFilters({ ...filters, to: e.target.value })} />
                </div>
                <div className="filter-actions">
                    <button className="btn btn-primary" onClick={() => { const f = { ...filters, offset: 0 }; setFilters(f); load(f) }}>🔍 Barbaadi</button>
                </div>
            </div>

            {loading ? (
                <div className="loading-wrap"><div className="spinner" /><p>Nagahee buusaara jira...</p></div>
            ) : (
                <>
                    {/* Summary View - Less Bulky */}
                    {viewMode === 'summary' && (
                        <div className="card">
                            <div className="card-header">
                                <span className="card-title">Nagaawwan Guyyaa irratti <span className="badge badge-gray">{ticketsByDate.length}</span></span>
                                <div style={{ display: 'flex', gap: 8 }}>
                                    <button className="btn btn-outline btn-sm" onClick={() => onPage(-1)} disabled={filters.offset === 0}>← Dura</button>
                                    <span style={{ alignSelf: 'center', fontSize: 13, color: '#6b7280' }}>{filters.offset + 1}–{Math.min(filters.offset + filters.limit, total)}</span>
                                    <button className="btn btn-outline btn-sm" onClick={() => onPage(1)} disabled={total <= filters.offset + filters.limit}>Eegaree →</button>
                                </div>
                            </div>
                            <div style={{ padding: '16px' }}>
                                {ticketsByDate.length === 0 ? (
                                    <div style={{ textAlign: 'center', padding: '40px', color: '#9ca3af' }}>
                                        <div className="empty-icon">🎫</div>
                                        <p>Nagaheen hin argamne</p>
                                    </div>
                                ) : (
                                    <div style={{ display: 'grid', gap: 12 }}>
                                        {ticketsByDate.map((day, index) => (
                                            <div key={index} style={{ 
                                                border: '1px solid #e5e7eb', 
                                                borderRadius: 8, 
                                                padding: '16px',
                                                background: '#fafafa'
                                            }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                                                    <div>
                                                        <div style={{ fontSize: 16, fontWeight: 700, color: '#374151' }}>{day.date}</div>
                                                        <div style={{ fontSize: 12, color: '#6b7280' }}>
                                                            {day.confirmedCount}/{day.totalCount} mirkanaa'e • {fmt(day.totalTax)} ETB
                                                        </div>
                                                    </div>
                                                    <button 
                                                        className="btn btn-sm btn-outline"
                                                        onClick={() => {
                                                            // Show tickets for this day (could expand to show details)
                                                            setViewMode('detailed')
                                                        }}
                                                    >
                                                        📋 Leenjii ({day.totalCount})
                                                    </button>
                                                </div>
                                                
                                                {/* Show first few tickets as preview */}
                                                <div style={{ display: 'grid', gap: 4 }}>
                                                    {day.tickets.slice(0, 3).map((ticket, idx) => (
                                                        <div key={idx} style={{ 
                                                            display: 'flex', 
                                                            justifyContent: 'space-between', 
                                                            alignItems: 'center',
                                                            padding: '8px 12px',
                                                            background: 'white',
                                                            borderRadius: 4,
                                                            fontSize: 13
                                                        }}>
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                                <span style={{ fontWeight: 600 }}>{ticket.reference}</span>
                                                                <span className="badge badge-sm" style={{ background: '#fef3c7', color: '#92400e' }}>
                                                                    {ticket.animalType?.name}
                                                                </span>
                                                                <span style={{ color: '#6b7280' }}>{ticket.quantity} Ol</span>
                                                            </div>
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                                <span style={{ fontWeight: 700, color: '#dc2626' }}>{fmt(ticket.taxAmount)} ETB</span>
                                                                {ticket.state === 'draft' && (
                                                                    <button 
                                                                        className="btn btn-sm btn-success" 
                                                                        onClick={() => handleConfirm(ticket.id)}
                                                                        style={{ padding: '4px 8px', fontSize: 11 }}
                                                                    >
                                                                        ✓
                                                                    </button>
                                                                )}
                                                                <button
                                                                    className="btn btn-sm btn-outline"
                                                                    onClick={() => startPrint(ticket)}
                                                                    disabled={ticket.state === 'printed'}
                                                                    style={{ padding: '4px 8px', fontSize: 11 }}
                                                                >
                                                                    🖨️
                                                                </button>
                                                            </div>
                                                        </div>
                                                    ))}
                                                    {day.tickets.length > 3 && (
                                                        <div style={{ textAlign: 'center', padding: '8px', color: '#6b7280', fontSize: 12 }}>
                                                            ... +{day.tickets.length - 3} nagahee ol
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Detailed View - Original Table */}
                    {viewMode === 'detailed' && (
                        <div className="card">
                            <div className="card-header">
                                <span className="card-title">Nagahee Bu'ura <span className="badge badge-gray">{total}</span></span>
                                <div style={{ display: 'flex', gap: 8 }}>
                                    <button className="btn btn-outline btn-sm" onClick={() => onPage(-1)} disabled={filters.offset === 0}>← Dura</button>
                                    <span style={{ alignSelf: 'center', fontSize: 13, color: '#6b7280' }}>{filters.offset + 1}–{Math.min(filters.offset + filters.limit, total)}</span>
                                    <button className="btn btn-outline btn-sm" onClick={() => onPage(1)} disabled={total <= filters.offset + filters.limit}>Eegaree →</button>
                                </div>
                            </div>
                            <div className="table-wrap">
                                <table>
                                    <thead>
                                        <tr>
                                            <th>Lakk. Nagahee</th>
                                            <th>Guyyaa</th>
                                            <th>Gosa Beeyladaa</th>
                                            <th style={{ textAlign: 'center' }}>Baay'ina</th>
                                            <th style={{ textAlign: 'right' }}>Gibira (ETB)</th>
                                            <th>Sassaabaa</th>
                                            <th>Haala Nagahee</th>
                                            <th>Gocha</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {tickets.length === 0 ? (
                                            <tr><td colSpan={8} style={{ textAlign: 'center', padding: '40px', color: '#9ca3af' }}>
                                                <div className="empty-state"><div className="empty-icon">🎫</div><p>Nagaheen hin argamne</p></div>
                                            </td></tr>
                                        ) : tickets.map(t => (
                                            <tr key={t.id}>
                                                <td style={{ fontWeight: 700 }}>{t.reference}</td>
                                                <td style={{ fontSize: 13, color: '#6b7280' }}>{new Date(t.date).toLocaleDateString()}</td>
                                                <td><span className="badge badge-red">{t.animalType?.name}</span></td>
                                                <td style={{ textAlign: 'center' }}>{t.quantity}</td>
                                                <td style={{ textAlign: 'right', fontWeight: 700, color: '#dc2626' }}>{fmt(t.taxAmount)}</td>
                                                <td>{t.taxTaker?.name}</td>
                                                <td><span className={`badge ${t.state === 'printed' ? 'badge-green' : 'badge-gray'}`}>{t.state === 'printed' ? 'Mirkanaa\'e' : 'Draft'}</span></td>
                                                <td>
                                                    <div style={{ display: 'flex', gap: 6 }}>
                                                        {t.state === 'draft' && (
                                                            <button className="btn btn-success btn-sm" onClick={() => handleConfirm(t.id)}>✓ Mirkaneessi</button>
                                                        )}
                                                        <button
                                                            className="btn btn-outline btn-sm"
                                                            onClick={() => startPrint(t)}
                                                            disabled={t.state === 'printed'}
                                                            title={t.state === 'printed' ? 'Print Godhameera' : 'Nagahee Maxxansi'}
                                                        >
                                                            {t.state === 'printed' ? '✅ Maxxanfameera' : '🖨️ Maxxansi'}
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
                </>
            )}
        </div>
    )
}
