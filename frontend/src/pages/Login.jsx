import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'

import OdaaIcon from '../components/OdaaIcon.jsx'

export default function Login() {
    const { login } = useAuth()
    const navigate = useNavigate()
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError('')
        setLoading(true)
        try {
            await login(email, password)
            navigate('/')
        } catch (err) {
            setError(err.response?.data?.error || 'Login failed. Please try again.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="auth-page">
            <div className="auth-card">
                <div className="auth-header">
                    <div style={{
                        fontSize: 64,
                        marginBottom: 16,
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: 90,
                        height: 90,
                        background: 'var(--snow)',
                        borderRadius: '50%',
                        color: 'var(--forest)'
                    }}>
                        <OdaaIcon />
                    </div>
                    <h1>Livestock Ticketing</h1>
                    <p>Arsi Liixa Zone – Official Tax Collection System</p>
                </div>
                <div className="auth-body">
                    {error && <div className="error-msg">⚠️ {error}</div>}

                    <form onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label className="form-label">Email Address</label>
                            <input
                                type="email"
                                className="form-control"
                                placeholder="your@email.com"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                required
                                autoFocus
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Password</label>
                            <input
                                type="password"
                                className="form-control"
                                placeholder="Enter your password"
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                required
                            />
                        </div>
                        <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
                            {loading ? '⏳ Signing in...' : '🔐 Sign In'}
                        </button>
                    </form>

                    <div style={{ marginTop: 24, padding: '16px', background: '#f8fafc', borderRadius: 8, fontSize: 12, color: '#6b7280' }}>
                        <div style={{ fontWeight: 600, marginBottom: 6 }}>Demo Credentials:</div>
                        <div>Admin: admin@livestock.et / admin123</div>
                        <div>Zone: zone@livestock.et / zone123</div>
                        <div>Woreda: woreda@livestock.et / woreda123</div>
                        <div>Ticketer: tick1@livestock.et / tick123</div>
                    </div>
                </div>
            </div>
        </div>
    )
}
