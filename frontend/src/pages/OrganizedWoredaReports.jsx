import { useEffect, useState } from 'react'
import jsPDF from 'jspdf'
import { toast } from 'react-hot-toast'
import api from '../api.js'
import { useAuth } from '../context/AuthContext.jsx'

const fmt = n => Number(n || 0).toLocaleString('en', { minimumFractionDigits: 2 })

export default function OrganizedWoredaReports() {
  const { user } = useAuth()

  const [collections, setCollections] = useState([])
  const [ticketers, setTicketers] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedTicketer, setSelectedTicketer] = useState(null)

  const loadData = async () => {
    setLoading(true)
    try {
      const [collRes, usersRes] = await Promise.all([
        api.get('/collections'),
        api.get('/master/users')
      ])

      setCollections(collRes.data.collections || [])

      // Get ticketers in this woreda
      const woredaTicketers = usersRes.data.filter(u => 
        u.role === 'ticketer' && u.woredaId === user.woredaId
      )
      setTicketers(woredaTicketers)

    } catch (err) {
      console.error('Error loading data:', err)
      toast.error('Deetaa galmeessuun hin danda\'amne')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadData() }, [])

  /*
  CALCULATE TOTALS PER TICKETER - FIXED LOGIC
  */
  const getTicketerTotals = () => {
    const totals = {}
    
    collections.forEach(coll => {
      if (!totals[coll.ticketer?.id]) {
        totals[coll.ticketer?.id] = {
          ticketer: coll.ticketer,
          totalCollected: 0,    // Money collected from locals (positive amounts)
          totalPaid: 0,         // Money paid to admin (negative amounts converted to positive)
          balance: 0,           // Remaining balance
          collectionCount: 0,   // Number of collections from locals
          paymentCount: 0,      // Number of payments to admin
          collections: [],      // All transactions
          lastDate: null
        }
      }
      
      const amount = coll.amount || 0
      if (amount > 0) {
        // Collection from locals
        totals[coll.ticketer?.id].totalCollected += amount
        totals[coll.ticketer?.id].collectionCount += 1
      } else {
        // Payment to admin (negative amount)
        totals[coll.ticketer?.id].totalPaid += Math.abs(amount)
        totals[coll.ticketer?.id].paymentCount += 1
      }
      
      totals[coll.ticketer?.id].collections.push(coll)
      
      // Track last date
      const collDate = new Date(coll.date)
      if (!totals[coll.ticketer?.id].lastDate || collDate > totals[coll.ticketer?.id].lastDate) {
        totals[coll.ticketer?.id].lastDate = collDate
      }
    })

    // Calculate balance (total collected - total paid)
    Object.keys(totals).forEach(key => {
      totals[key].balance = totals[key].totalCollected - totals[key].totalPaid
    })

    return Object.values(totals).sort((a, b) => b.balance - a.balance) // Sort by balance due
  }

  const ticketerTotals = getTicketerTotals()

  /*
  GET ORGANIZED PAYMENT HISTORY
  */
  const getOrganizedHistory = () => {
    if (!selectedTicketer) return []
    
    const ticketer = ticketerTotals.find(t => t.ticketer.id === selectedTicketer)
    if (!ticketer) return []
    
    // Sort collections by date
    return ticketer.collections.sort((a, b) => new Date(b.date) - new Date(a.date))
  }

  const organizedHistory = getOrganizedHistory()

  /*
  GENERATE PDF REPORT
  */
  const generatePDF = () => {
    const doc = new jsPDF()
    doc.setFontSize(18)
    doc.text('Gabaasa Aanaa - Taxi Collectors Report', 14, 22)
    doc.setFontSize(11)
    doc.text(`Date: ${new Date().toLocaleDateString()}`, 14, 32)

    let y = 50
    doc.setFontSize(12)
    doc.text('Summary by Taxi Collector:', 14, y)
    y += 10

    ticketerTotals.forEach(t => {
      doc.setFontSize(10)
      doc.text(`${t.ticketer?.name}: Collected ${fmt(t.totalCollected)} ETB, Paid ${fmt(t.totalPaid)} ETB, Balance ${fmt(t.balance)} ETB`, 14, y)
      y += 8
    })

    doc.save('woreda_tax_collectors_report.pdf')
  }

  if (loading) {
    return (
      <div className="loading-wrap">
        <div className="spinner" />
      </div>
    )
  }

  return (
    <div style={{ marginBottom: 24 }}>
      <h2 style={{ fontSize: 24, fontWeight: 800, marginBottom: 4 }}>
        Gabaasa Aanaa
      </h2>

      <p style={{ color: "#6b7280", fontSize: 14 }}>
        Organized taxi collector information with clear totals and payment history.
      </p>

      {/* PDF Button */}
      <button
        className="btn btn-primary"
        onClick={generatePDF}
        style={{ marginBottom: 16 }}
      >
        📄 Generate PDF Report
      </button>

      {/* SUMMARY CARDS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 24 }}>
        <div className="card">
          <div className="card-body" style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 24, fontWeight: 700, color: '#16a34a' }}>
              {ticketerTotals.length}
            </div>
            <div style={{ fontSize: 14, color: '#6b7280' }}>Active Taxi Collectors</div>
          </div>
        </div>
        <div className="card">
          <div className="card-body" style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 24, fontWeight: 700, color: '#16a34a' }}>
              {fmt(ticketerTotals.reduce((sum, t) => sum + t.totalCollected, 0))} ETB
            </div>
            <div style={{ fontSize: 14, color: '#6b7280' }}>Total Collected Today</div>
          </div>
        </div>
        <div className="card">
          <div className="card-body" style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 24, fontWeight: 700, color: '#dc2626' }}>
              {fmt(ticketerTotals.reduce((sum, t) => sum + t.totalPaid, 0))} ETB
            </div>
            <div style={{ fontSize: 14, color: '#6b7280' }}>Paid to Admin</div>
          </div>
        </div>
        <div className="card">
          <div className="card-body" style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 24, fontWeight: 700, color: '#f59e0b' }}>
              {fmt(ticketerTotals.reduce((sum, t) => sum + t.balance, 0))} ETB
            </div>
            <div style={{ fontSize: 14, color: '#6b7280' }}>Balance Due</div>
          </div>
        </div>
      </div>

      {/* TAX COLLECTORS TABLE - ORGANIZED */}
      <div className="card">
        <div className="card-header">
          <span className="card-title">
            Taxi Collectors Summary
            <span className="badge badge-gray">{ticketerTotals.length}</span>
          </span>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Taxi Collector</th>
                <th style={{ textAlign: 'right' }}>Total Collected</th>
                <th style={{ textAlign: 'right' }}>Paid to Admin</th>
                <th style={{ textAlign: 'right' }}>Balance Due</th>
                <th style={{ textAlign: 'right' }}>Last Activity</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {ticketerTotals.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '40px', color: '#9ca3af' }}>
                    No taxi collectors found
                  </td>
                </tr>
              ) : (
                ticketerTotals.map((total, index) => (
                  <tr key={index}>
                    <td style={{ fontWeight: 700 }}>{total.ticketer?.name}</td>
                    <td style={{ textAlign: 'right', fontWeight: 700, color: '#16a34a' }}>
                      {fmt(total.totalCollected)} ETB
                    </td>
                    <td style={{ textAlign: 'right', color: '#dc2626' }}>
                      {fmt(total.totalPaid)} ETB
                    </td>
                    <td style={{ textAlign: 'right', fontWeight: 700, color: total.balance > 0 ? '#f59e0b' : '#16a34a' }}>
                      {fmt(total.balance)} ETB
                    </td>
                    <td style={{ textAlign: 'right', fontSize: 12, color: '#6b7280' }}>
                      {total.lastDate ? total.lastDate.toLocaleDateString() : 'N/A'}
                    </td>
                    <td>
                      {total.balance > 0 ? (
                        <span className="badge badge-yellow">Balance Due</span>
                      ) : (
                        <span className="badge badge-green">Paid in Full</span>
                      )}
                    </td>
                    <td>
                      <button
                        className="btn btn-sm btn-outline"
                        onClick={() => setSelectedTicketer(total.ticketer.id)}
                      >
                        View History
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            {ticketerTotals.length > 0 && (
              <tfoot>
                <tr style={{ borderTop: '2px solid #e5e7eb', fontWeight: 700 }}>
                  <td>Total</td>
                  <td style={{ textAlign: 'right', color: '#16a34a' }}>
                    {fmt(ticketerTotals.reduce((sum, t) => sum + t.totalCollected, 0))} ETB
                  </td>
                  <td style={{ textAlign: 'right', color: '#dc2626' }}>
                    {fmt(ticketerTotals.reduce((sum, t) => sum + t.totalPaid, 0))} ETB
                  </td>
                  <td style={{ textAlign: 'right', color: '#f59e0b' }}>
                    {fmt(ticketerTotals.reduce((sum, t) => sum + t.balance, 0))} ETB
                  </td>
                  <td colSpan={3}></td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      {/* ORGANIZED PAYMENT & COLLECTION HISTORY */}
      {selectedTicketer && (
        <div className="card" style={{ marginTop: 16 }}>
          <div className="card-header">
            <span className="card-title">
              Payment & Collection History
              <span className="badge badge-gray">
                {ticketerTotals.find(t => t.ticketer.id === selectedTicketer)?.ticketer?.name}
              </span>
            </span>
            <button
              className="btn btn-sm btn-outline"
              onClick={() => setSelectedTicketer(null)}
            >
              ✕ Close
            </button>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Reference</th>
                  <th>Type</th>
                  <th style={{ textAlign: 'right' }}>Amount (ETB)</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {organizedHistory.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ textAlign: 'center', padding: '40px', color: '#9ca3af' }}>
                      No transactions found
                    </td>
                  </tr>
                ) : (
                  organizedHistory.map((coll) => (
                    <tr key={coll.id}>
                      <td style={{ fontSize: 13, color: '#6b7280' }}>
                        {new Date(coll.date).toLocaleDateString()}
                      </td>
                      <td style={{ fontWeight: 700 }}>{coll.reference}</td>
                      <td>
                        {coll.amount > 0 ? (
                          <span className="badge badge-blue">Collection</span>
                        ) : (
                          <span className="badge badge-green">Payment</span>
                        )}
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: 700, color: coll.amount > 0 ? '#16a34a' : '#dc2626' }}>
                        {coll.amount > 0 ? '+' : ''}{fmt(Math.abs(coll.amount))} ETB
                      </td>
                      <td>
                        {coll.status === 'confirmed' ? (
                          <span className="badge badge-green">Confirmed</span>
                        ) : (
                          <span className="badge badge-yellow">Pending</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
