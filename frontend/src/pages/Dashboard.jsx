import {
    ArcElement,
    BarElement,
    CategoryScale,
    Chart as ChartJS,
    Filler,
    Legend,
    LinearScale,
    LineElement, PointElement,
    Tooltip
} from 'chart.js'
import { useCallback, useEffect, useState } from 'react'
import { Bar, Line, Pie } from 'react-chartjs-2'
import api from '../api.js'
import OdaaIcon from '../components/OdaaIcon.jsx'

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, ArcElement, Tooltip, Legend, Filler)

const fmt = n => Number(n || 0).toLocaleString('en', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

export default function Dashboard() {
    const [stats, setStats] = useState(null)
    const [loading, setLoading] = useState(true)
    const [filters, setFilters] = useState({ date_from: '', date_to: '', user_id: '', animal_type_id: '', limit: 10, offset: 0 })
    const [masterData, setMasterData] = useState({ users: [], animalTypes: [] })

    const loadMasterData = useCallback(async () => {
        try {
            const [users, types] = await Promise.all([
                api.get('/master/users'),
                api.get('/master/animal-types')
            ])
            setMasterData({ users: users.data, animalTypes: types.data })
        } catch { }
    }, [])

    const loadStats = useCallback(async (f = filters) => {
        setLoading(true)
        try {
            const params = { ...f }
            const res = await api.get('/dashboard/stats', { params })
            setStats(res.data)
        } catch (err) {
            console.error(err)
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        loadMasterData()
        loadStats()
    }, [])

    const applyFilters = () => {
        const f = { ...filters, offset: 0 }
        setFilters(f)
        loadStats(f)
    }

    const resetFilters = () => {
        const f = { date_from: '', date_to: '', user_id: '', animal_type_id: '', limit: 10, offset: 0 }
        setFilters(f)
        loadStats(f)
    }

    const onPage = (dir) => {
        const newOffset = Math.max(0, (filters.offset + dir * filters.limit))
        const f = { ...filters, offset: newOffset }
        setFilters(f)
        loadStats(f)
    }

    const [isMobile, setIsMobile] = useState(window.innerWidth < 768)
    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 768)
        window.addEventListener('resize', handleResize)
        return () => window.removeEventListener('resize', handleResize)
    }, [])

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
            x: { grid: { display: false }, ticks: { font: { size: 10 } } },
            y: { ticks: { font: { size: 10 } } }
        }
    }
    const pieOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { position: isMobile ? 'bottom' : 'right', labels: { boxWidth: 12, font: { size: 11 } } } }
    }

    return (
        <div className="dashboard-container" style={{ padding: isMobile ? '0' : 'inherit' }}>
            {/* Header */}
            <div className="dash-header" style={{ marginBottom: 20, padding: isMobile ? '20px' : '32px' }}>
                <div className="dash-header-text">
                    <h1 style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: isMobile ? '18px' : '24px' }}>
                        <OdaaIcon style={{ width: isMobile ? '24px' : '32px', height: isMobile ? '24px' : '32px', color: 'var(--forest-light)' }} />
                        Livestock TAX Dashboard
                    </h1>
                    <p style={{ fontSize: isMobile ? '12px' : '14px' }}>Official Real-time Monitoring · Arsi Liixa</p>
                </div>
                <button className="btn btn-outline" style={{ display: isMobile ? 'none' : 'flex', color: 'white', borderColor: 'rgba(255,255,255,0.3)', background: 'rgba(255,255,255,0.1)' }} onClick={() => loadStats()}>
                    🔄 Refresh
                </button>
            </div>

            {/* Filters */}
            <div className="filter-bar">
                <div className="form-group">
                    <label className="form-label">Date From</label>
                    <input type="date" className="form-control" value={filters.date_from} onChange={e => setFilters({ ...filters, date_from: e.target.value })} />
                </div>
                <div className="form-group">
                    <label className="form-label">Date To</label>
                    <input type="date" className="form-control" value={filters.date_to} onChange={e => setFilters({ ...filters, date_to: e.target.value })} />
                </div>
                <div className="form-group">
                    <label className="form-label">Tax Collector</label>
                    <select className="form-select" value={filters.user_id} onChange={e => setFilters({ ...filters, user_id: e.target.value })}>
                        <option value="">All Collectors</option>
                        {masterData.users.filter(u => u.role === 'ticketer').map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                    </select>
                </div>
                <div className="form-group">
                    <label className="form-label">Animal Type</label>
                    <select className="form-select" value={filters.animal_type_id} onChange={e => setFilters({ ...filters, animal_type_id: e.target.value })}>
                        <option value="">All Types</option>
                        {masterData.animalTypes.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                    </select>
                </div>
                <div className="filter-actions">
                    <button className="btn btn-primary" onClick={applyFilters}>🔍 Apply</button>
                    <button className="btn btn-outline" onClick={resetFilters}>↺ Reset</button>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="summary-grid" style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                gap: '12px'
            }}>
                <div className="summary-card red" style={{ padding: '12px' }}>
                    <div className="summary-icon red" style={{ width: 40, height: 40, fontSize: 18 }}>🐄</div>
                    <div>
                        <div className="summary-label" style={{ fontSize: 11 }}>Cattle Today</div>
                        <div className="summary-value" style={{ fontSize: 20 }}>{(stats?.summary?.cattle || 0).toLocaleString()}</div>
                    </div>
                </div>
                <div className="summary-card green" style={{ padding: '12px' }}>
                    <div className="summary-icon green" style={{ width: 40, height: 40, fontSize: 18 }}>💵</div>
                    <div>
                        <div className="summary-label" style={{ fontSize: 11 }}>Tax Today</div>
                        <div className="summary-value" style={{ fontSize: 20 }}>{fmt(stats?.summary?.tax)} <span className="unit">ETB</span></div>
                    </div>
                </div>
                <div className="summary-card dark" style={{ padding: '12px' }}>
                    <div className="summary-icon dark" style={{ width: 40, height: 40, fontSize: 18 }}>🎫</div>
                    <div>
                        <div className="summary-label" style={{ fontSize: 11 }}>Transactions</div>
                        <div className="summary-value" style={{ fontSize: 20 }}>{stats?.summary?.tx || 0}</div>
                    </div>
                </div>
                <div className="summary-card orange" style={{ padding: '12px' }}>
                    <div className="summary-icon orange" style={{ width: 40, height: 40, fontSize: 18 }}>👥</div>
                    <div>
                        <div className="summary-label" style={{ fontSize: 11 }}>Active Staff</div>
                        <div className="summary-value" style={{ fontSize: 20 }}>{stats?.summary?.collectors || 0}</div>
                    </div>
                </div>
            </div>

            {/* Charts Row 1 */}
            {stats && (
                <>
                    <div className="charts-grid">
                        <div className="chart-card">
                            <div className="chart-header">
                                <div className="chart-icon" style={{ background: 'rgba(220,38,38,0.1)', color: '#dc2626' }}>📊</div>
                                <span className="card-title">Tax by Animal Type</span>
                            </div>
                            <div className="chart-canvas-wrap">
                                {stats?.charts?.bar?.labels?.length > 0 ? (
                                    <Bar data={stats.charts.bar} options={chartOptions} />
                                ) : <div className="empty-state"><div className="empty-icon">📊</div><p>No data</p></div>}
                            </div>
                        </div>
                        <div className="chart-card">
                            <div className="chart-header">
                                <div className="chart-icon" style={{ background: 'rgba(22,163,74,0.1)', color: '#16a34a' }}>📈</div>
                                <span className="card-title">Revenue Trend</span>
                            </div>
                            <div className="chart-canvas-wrap">
                                {stats?.charts?.line?.labels?.length > 0 ? (
                                    <Line data={stats.charts.line} options={{ ...chartOptions, plugins: { ...chartOptions.plugins }, scales: { y: { beginAtZero: true } } }} />
                                ) : <div className="empty-state"><div className="empty-icon">📈</div><p>No data</p></div>}
                            </div>
                        </div>
                    </div>

                    {/* Charts Row 2 */}
                    <div className="charts-grid">
                        <div className="chart-card">
                            <div className="chart-header">
                                <div className="chart-icon" style={{ background: 'rgba(22,163,74,0.1)', color: '#16a34a' }}>🗺️</div>
                                <span className="card-title">Woreda Performance</span>
                            </div>
                            <div className="chart-canvas-wrap">
                                {stats?.charts?.woreda_bar?.labels?.length > 0 ? (
                                    <Bar data={stats.charts.woreda_bar} options={{ ...chartOptions, indexAxis: 'y' }} />
                                ) : <div className="empty-state"><div className="empty-icon">🗺️</div><p>No data</p></div>}
                            </div>
                        </div>
                        <div className="chart-card">
                            <div className="chart-header">
                                <div className="chart-icon" style={{ background: 'rgba(31,41,55,0.08)', color: '#374151' }}>🥧</div>
                                <span className="card-title">Market Share %</span>
                            </div>
                            <div className="chart-canvas-wrap">
                                {stats?.charts?.pie?.labels?.length > 0 ? (
                                    <Pie data={stats.charts.pie} options={pieOptions} />
                                ) : <div className="empty-state"><div className="empty-icon">🥧</div><p>No data</p></div>}
                            </div>
                        </div>
                    </div>

                    {/* Rankings */}
                    <div className="card" style={{ marginBottom: 24 }}>
                        <div className="card-header">
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                <div className="chart-icon" style={{ background: 'rgba(220,38,38,0.1)', color: '#dc2626' }}>🏆</div>
                                <span className="card-title">Collector Rankings</span>
                            </div>
                            <span className="badge badge-red">Live Performance</span>
                        </div>
                        <div className="table-wrap">
                            <table>
                                <thead>
                                    <tr>
                                        <th>#</th>
                                        <th>Collector</th>
                                        <th style={{ textAlign: 'center' }}>Tickets</th>
                                        <th style={{ textAlign: 'center' }}>Cattle</th>
                                        <th style={{ textAlign: 'right' }}>Total Tax (ETB)</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {!stats?.rankings || stats.rankings.length === 0 ? (
                                        <tr><td colSpan={5} style={{ textAlign: 'center', padding: '40px', color: '#9ca3af' }}>No data</td></tr>
                                    ) : stats.rankings.map((r, i) => (
                                        <tr key={r.name || i}>
                                            <td>
                                                <span className={`rank-badge rank-${i < 3 ? i + 1 : 'n'}`}>{i + 1}</span>
                                            </td>
                                            <td style={{ fontWeight: 600 }}>{r.name}</td>
                                            <td style={{ textAlign: 'center' }}>{r.tx}</td>
                                            <td style={{ textAlign: 'center' }}>
                                                <span className="badge badge-green">{r.cattle} Head</span>
                                            </td>
                                            <td style={{ textAlign: 'right', fontWeight: 700, color: '#dc2626' }}>{fmt(r.tax)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Recent Transactions */}
                    <div className="card">
                        <div className="card-header">
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                <div className="chart-icon" style={{ background: 'rgba(22,163,74,0.1)', color: '#16a34a' }}>⚡</div>
                                <span className="card-title">Live Transaction Stream</span>
                                <span className="badge badge-green">{stats.total_count} Total</span>
                            </div>
                            <div style={{ display: 'flex', gap: 8 }}>
                                <button className="btn btn-outline btn-sm" onClick={() => onPage(-1)} disabled={filters.offset === 0}>← Prev</button>
                                <span style={{ alignSelf: 'center', fontSize: 13, color: '#6b7280' }}>
                                    {filters.offset + 1}–{Math.min(filters.offset + filters.limit, stats.total_count)}
                                </span>
                                <button className="btn btn-outline btn-sm" onClick={() => onPage(1)} disabled={stats.total_count <= filters.offset + filters.limit}>Next →</button>
                            </div>
                        </div>
                        <div className="table-wrap">
                            <table>
                                <thead>
                                    <tr>
                                        <th>Ref</th>
                                        <th>Date</th>
                                        <th>Type</th>
                                        <th style={{ textAlign: 'center' }}>Qty</th>
                                        <th style={{ textAlign: 'right' }}>Unit</th>
                                        <th style={{ textAlign: 'right' }}>Total</th>
                                        <th>Collector</th>
                                        <th>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {!stats?.recent || stats.recent.length === 0 ? (
                                        <tr><td colSpan={8} style={{ textAlign: 'center', padding: '40px', color: '#9ca3af' }}>No transactions</td></tr>
                                    ) : stats.recent.map((t, idx) => (
                                        <tr key={t.ref || idx}>
                                            <td style={{ fontWeight: 600 }}>{t.ref}</td>
                                            <td style={{ color: '#6b7280', fontSize: 13 }}>{t.date}</td>
                                            <td><span className="badge badge-red">{t.type}</span></td>
                                            <td style={{ textAlign: 'center', fontWeight: 600 }}>{t.qty}</td>
                                            <td style={{ textAlign: 'right', color: '#6b7280' }}>{fmt(t.price)}</td>
                                            <td style={{ textAlign: 'right', fontWeight: 700 }}>{fmt(t.total)} <span style={{ fontSize: 11, color: '#9ca3af' }}>ETB</span></td>
                                            <td>{t.collector}</td>
                                            <td><span className={`badge ${t.state === 'printed' ? 'badge-green' : 'badge-gray'}`}>{t.state}</span></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </>
            )}

            {loading && (
                <div className="loading-wrap"><div className="spinner" /><p>Loading dashboard...</p></div>
            )}
        </div>
    )
}
