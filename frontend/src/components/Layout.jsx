import { useState } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import OdaaIcon from './OdaaIcon.jsx'

const navItems = [
    { to: '/', icon: '📊', label: 'Dashboard', exact: true, roles: [] },
    { to: '/tickets', icon: '🎫', label: 'Tickets', roles: [] },
    { to: '/tickets/new', icon: '➕', label: 'New Ticket', roles: ['ticketer', 'woreda', 'admin'] },
    { to: '/collections', icon: '💰', label: 'Collections', roles: ['woreda', 'zone', 'admin'] },
    { to: '/admin', icon: '⚙️', label: 'Administration', roles: ['zone', 'admin'] },
]

export default function Layout() {
    const { user, logout } = useAuth()
    const [sidebarOpen, setSidebarOpen] = useState(false)
    const location = useLocation()

    const roleLabel = { ticketer: 'Ticketer', woreda: 'Woreda Admin', zone: 'Zone Admin', admin: 'System Admin' }

    return (
        <div className="app-layout">
            {/* Overlay for mobile */}
            <div
                className={`overlay ${sidebarOpen ? 'visible' : ''}`}
                onClick={() => setSidebarOpen(false)}
            />

            {/* Sidebar */}
            <nav className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
                <div className="sidebar-brand">
                    <div className="sidebar-logo">
                        <div className="sidebar-logo-icon">
                            <OdaaIcon style={{ width: 24, height: 24 }} />
                        </div>
                        <div className="sidebar-logo-text">
                            <div className="title">Livestock Tax</div>
                            <div className="subtitle">Arsi Liixa Zone</div>
                        </div>
                    </div>
                </div>

                <div className="sidebar-nav">
                    <div className="nav-section-label">Main</div>
                    {navItems.filter(item =>
                        item.roles.length === 0 || item.roles.includes(user?.role)
                    ).map(item => (
                        <NavLink
                            key={item.to}
                            to={item.to}
                            end={item.exact}
                            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                            onClick={() => setSidebarOpen(false)}
                        >
                            <span className="icon">{item.icon}</span>
                            {item.label}
                        </NavLink>
                    ))}
                </div>

                <div className="sidebar-footer">
                    <div className="user-card">
                        <div className="user-avatar">
                            {user?.name?.charAt(0).toUpperCase()}
                        </div>
                        <div className="user-info">
                            <div className="name">{user?.name}</div>
                            <div className="role">{roleLabel[user?.role] || user?.role}</div>
                        </div>
                        <button className="btn-logout" onClick={logout} title="Logout">⇥</button>
                    </div>
                </div>
            </nav>

            {/* Main */}
            <div className="main-content">
                <header className="topbar">
                    <button className="hamburger" onClick={() => setSidebarOpen(!sidebarOpen)}>
                        <span /><span /><span />
                    </button>
                    <div className="topbar-title">
                        {navItems.find(n => location.pathname === n.to || (n.to !== '/' && location.pathname.startsWith(n.to)))?.label || 'Dashboard'}
                    </div>
                    <div className="topbar-right">
                        <span className="badge badge-gray">{roleLabel[user?.role]}</span>
                    </div>
                </header>

                <div className="page-body">
                    <Outlet />
                </div>
            </div>
        </div>
    )
}
