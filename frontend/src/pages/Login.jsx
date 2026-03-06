import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import OdaaIcon from '../components/OdaaIcon.jsx'

export default function Login() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)
    const { login } = useAuth()
    const navigate = useNavigate()

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError('')
        setLoading(true)
        try {
            await login(email, password)
            navigate('/')
        } catch (err) {
            setError(err.response?.data?.error || 'Invalid credentials')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="auth-page" style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#f3f4f6',
            padding: '20px'
        }}>
            <div className="auth-card" style={{
                background: 'white',
                padding: '40px 32px',
                borderRadius: '24px',
                boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
                width: '100%',
                maxWidth: '400px'
            }}>
                <div style={{ textAlign: 'center', marginBottom: 32 }}>
                    <div style={{
                        width: 72, height: 72,
                        background: 'linear-gradient(135deg, #16a34a, #15803d)',
                        borderRadius: 20, margin: '0 auto 16px',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        boxShadow: '0 8px 16px rgba(22,163,74,0.2)'
                    }}>
                        <OdaaIcon style={{ width: 40, height: 40, color: 'white' }} />
                    </div>
                    <h1 style={{ fontSize: 24, fontWeight: 900, color: '#1f2937', marginBottom: 4 }}>Godina Arsi Liixa</h1>
                    <p style={{ color: '#6b7280', fontSize: 14 }}>Sirna Sassaabbii Gibira Loonii</p>
                </div>

                {error && <div style={{ background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', borderRadius: 8, padding: '12px 16px', marginBottom: 24, fontSize: 13 }}>⚠️ {error}</div>}

                <form onSubmit={handleSubmit}>
                    <div className="form-group" style={{ marginBottom: 20 }}>
                        <label className="form-label" style={{ fontWeight: 700, fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#4b5563', marginBottom: 8, display: 'block' }}>Iimeeyilii</label>
                        <input
                            type="email"
                            className="form-control"
                            style={{ height: 52, borderRadius: 12, background: '#f9fafb', fontSize: 16 }}
                            placeholder="maqaa@fakkeenya.com"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            required
                        />
                    </div>
                    <div className="form-group" style={{ marginBottom: 32 }}>
                        <label className="form-label" style={{ fontWeight: 700, fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#4b5563', marginBottom: 8, display: 'block' }}>Jecha Iccitii</label>
                        <input
                            type="password"
                            className="form-control"
                            style={{ height: 52, borderRadius: 12, background: '#f9fafb', fontSize: 16 }}
                            placeholder="••••••••"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            required
                        />
                    </div>
                    <button type="submit" className="btn btn-primary btn-lg" style={{ width: '100%', borderRadius: 12, fontSize: 16, height: 52, background: '#16a34a', border: 'none', color: 'white', fontWeight: 700 }} disabled={loading}>
                        {loading ? '⏳ Mirkaneessaa jira...' : 'Gabaasatti Seeni'}
                    </button>
                </form>

                <p style={{ textAlign: 'center', marginTop: 32, fontSize: 11, color: '#9ca3af', lineHeight: 1.5 }}>
                    &copy; {new Date().getFullYear()} Bulchiinsa Godina Arsi Liixa<br />Karaa Gibiraa Amansiisaa
                </p>
            </div>
        </div>
    )
}
