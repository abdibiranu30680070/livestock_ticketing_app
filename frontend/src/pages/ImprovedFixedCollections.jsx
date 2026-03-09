import { useEffect, useState } from 'react'
import { toast } from 'react-hot-toast'
import api from '../api.js'
import { useAuth } from '../context/AuthContext.jsx'

const fmt = n => Number(n || 0).toLocaleString('en', { minimumFractionDigits: 2 })

export default function ImprovedFixedCollections() {
  const { user } = useAuth()

  const [collections, setCollections] = useState([])
  const [ticketers, setTicketers] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedTicketer, setSelectedTicketer] = useState(null)

  const [paymentForm, setPaymentForm] = useState({
    ticketerId: '',
    amount: '',
    notes: ''
  })
  const [formLoading, setFormLoading] = useState(false)

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
  CALCULATE TICKETER TOTALS - FIXED LOGIC
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
          lastCollectionDate: null,
          collections: []       // All transactions for this ticketer
        }
      }
      
      const amount = coll.amount || 0
      if (amount > 0) {
        // Collection from locals
        totals[coll.ticketer?.id].totalCollected += amount
        totals[coll.ticketer?.id].collectionCount += 1
        
        // Track last collection date
        const collDate = new Date(coll.date)
        if (!totals[coll.ticketer?.id].lastCollectionDate || collDate > totals[coll.ticketer?.id].lastCollectionDate) {
          totals[coll.ticketer?.id].lastCollectionDate = collDate
        }
      } else {
        // Payment to admin (negative amount)
        totals[coll.ticketer?.id].totalPaid += Math.abs(amount)
        totals[coll.ticketer?.id].paymentCount += 1
      }
      
      totals[coll.ticketer?.id].collections.push(coll)
    })

    // Calculate balance (total collected - total paid)
    Object.keys(totals).forEach(key => {
      totals[key].balance = totals[key].totalCollected - totals[key].totalPaid
    })

    return Object.values(totals).sort((a, b) => b.balance - a.balance) // Sort by balance due
  }

  const ticketerTotals = getTicketerTotals()

  /*
  PROCESS PAYMENT FROM TAXI COLLECTOR - FIXED
  */
  const processPayment = async (e) => {
    e.preventDefault()
    setFormLoading(true)
    
    try {
      // Record the payment as a positive amount but mark it as payment type
      const paymentData = {
        ticketerId: paymentForm.ticketerId,
        amount: parseFloat(paymentForm.amount), // Positive amount
        notes: `Payment from taxi collector: ${paymentForm.notes}`,
        isPayment: true // Flag to indicate this is a payment TO admin
      }

      await api.post('/collections', paymentData)
      
      setPaymentForm({ ticketerId: '', amount: '', notes: '' })
      toast.success('Payment from taxi collector confirmed successfully!')
      loadData()
      
    } catch (err) {
      console.error('Payment error:', err)
      toast.error(err.response?.data?.error || 'Payment processing failed')
    } finally {
      setFormLoading(false)
    }
  }

  /*
  PAY FULL BALANCE - FIXED
  */
  const payFullBalance = (ticketerId, balance, ticketerName) => {
    setPaymentForm({ 
      ticketerId: ticketerId, 
      amount: Math.abs(balance).toString(), // Ensure positive amount
      notes: `Full balance payment from ${ticketerName}`
    })
    
    // Scroll to form
    document.getElementById('payment-form')?.scrollIntoView({ behavior: 'smooth' })
  }

  /*
  GET ORGANIZED HISTORY FOR SELECTED TICKETER
  */
  const getOrganizedHistory = () => {
    if (!selectedTicketer) return []
    
    const ticketer = ticketerTotals.find(t => t.ticketer.id === selectedTicketer)
    if (!ticketer) return []
    
    // Sort collections by date (newest first)
    return ticketer.collections.sort((a, b) => new Date(b.date) - new Date(a.date))
  }

  const organizedHistory = getOrganizedHistory()

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
        Sassaabbii Gibiraa
      </h2>

      <p style={{ color: "#6b7280", fontSize: 14 }}>
        Select taxi collector name and confirm payment when they pay money to admin.
      </p>

      {/* PAYMENT CONFIRMATION FORM */}
      <div id="payment-form" className="card" style={{ marginBottom: 24, maxWidth: 600 }}>
        <div className="card-header">
          <span className="card-title">💰 Confirm Payment from Taxi Collector</span>
        </div>
        <div className="card-body">
          <form onSubmit={processPayment}>
            <div className="form-group">
              <label className="form-label">Select Taxi Collector *</label>
              <select
                className="form-select"
                value={paymentForm.ticketerId}
                onChange={(e) => setPaymentForm({ ...paymentForm, ticketerId: e.target.value })}
                required
              >
                <option value="">Choose taxi collector...</option>
                {ticketers.map(t => {
                  const total = ticketerTotals.find(tt => tt.ticketer.id === t.id)
                  return (
                    <option key={t.id} value={t.id}>
                      {t.name} - Balance: {total ? fmt(total.balance) : '0'} ETB
                    </option>
                  )
                })}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Amount Paid (ETB) *</label>
              <input
                type="number"
                className="form-control"
                placeholder="Enter amount paid by taxi collector"
                value={paymentForm.amount}
                onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                min="0.01"
                step="0.01"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Notes</label>
              <textarea
                className="form-control"
                placeholder="Payment details or notes..."
                value={paymentForm.notes}
                onChange={(e) => setPaymentForm({ ...paymentForm, notes: e.target.value })}
                rows={3}
              />
            </div>

            <button 
              type="submit" 
              className="btn btn-primary" 
              disabled={formLoading}
              style={{ width: '100%' }}
            >
              {formLoading ? '⏳ Processing...' : '✓ Confirm Payment from Taxi Collector'}
            </button>
          </form>
        </div>
      </div>

      {/* TAX COLLECTORS BALANCE SUMMARY - WITH COLLECTION DATE */}
      <div className="card" style={{ marginBottom: 24 }}>
        <div className="card-header">
          <span className="card-title">
            Taxi Collectors - Balance Overview
            <span className="badge badge-gray">{ticketerTotals.length}</span>
          </span>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Taxi Collector</th>
                <th style={{ textAlign: 'right' }}>Total Collected</th>
                <th style={{ textAlign: 'right' }}>Total Paid to Admin</th>
                <th style={{ textAlign: 'right' }}>Balance Due</th>
                <th>Collections</th>
                <th>Last Collection Date</th>
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
                    <td style={{ textAlign: 'right', color: '#16a34a', fontWeight: 700 }}>
                      {fmt(total.totalCollected)} ETB
                    </td>
                    <td style={{ textAlign: 'right', color: '#dc2626' }}>
                      {fmt(total.totalPaid)} ETB
                    </td>
                    <td style={{ textAlign: 'right', fontWeight: 700, color: total.balance > 0 ? '#f59e0b' : '#16a34a' }}>
                      {fmt(total.balance)} ETB
                    </td>
                    <td style={{ textAlign: 'right' }}>{total.collectionCount}</td>
                    <td style={{ textAlign: 'center', fontSize: 13, color: '#6b7280' }}>
                      {total.lastCollectionDate ? total.lastCollectionDate.toLocaleDateString() : 'N/A'}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                        {total.balance > 0 && (
                          <button
                            className="btn btn-sm btn-success"
                            onClick={() => payFullBalance(total.ticketer.id, total.balance, total.ticketer.name)}
                          >
                            Pay Full Balance
                          </button>
                        )}
                        <button
                          className="btn btn-sm btn-outline"
                          onClick={() => setSelectedTicketer(total.ticketer.id)}
                        >
                          View History
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ORGANIZED COLLECTION & PAYMENT HISTORY - NOT BULKY */}
      {selectedTicketer && (
        <div className="card">
          <div className="card-header">
            <span className="card-title">
              Collection & Payment History
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
                          <span className="badge badge-blue">Collection FROM Locals</span>
                        ) : (
                          <span className="badge badge-green">Payment TO Admin</span>
                        )}
                      </td>
                      <td style={{ 
                        textAlign: 'right', 
                        fontWeight: 700, 
                        color: coll.amount > 0 ? '#dc2626' : '#16a34a' 
                      }}>
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
