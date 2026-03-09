import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import Layout from './components/Layout.jsx'
import { AuthProvider, useAuth } from './context/AuthContext.jsx'
import Admin from './pages/Admin.jsx'
import OrganizedWoredaReports from './pages/OrganizedWoredaReports.jsx'
import ImprovedFixedCollections from './pages/ImprovedFixedCollections.jsx'
import Dashboard from './pages/Dashboard.jsx'
import Login from './pages/Login.jsx'
import ImprovedSimpleNewTicket from './pages/ImprovedSimpleNewTicket.jsx'
import ImprovedTickets from './pages/ImprovedTickets.jsx'
import ProfessionalWoredaReports from './pages/ProfessionalWoredaReports.jsx'

function ProtectedRoute({ children, roles }) {
    const { user } = useAuth()
    if (!user) return <Navigate to="/login" replace />
    if (roles && !roles.includes(user.role)) return <Navigate to="/" replace />
    return children
}

export default function App() {
    return (
        <AuthProvider>
            <Toaster position="top-right" />
            <BrowserRouter>
                <Routes>
                    <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
                    <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
                        <Route index element={<Dashboard />} />
                        <Route path="tickets" element={<ImprovedTickets />} />
                        <Route path="tickets/new" element={
                            <ProtectedRoute roles={["ticketer"]}>
                                <ImprovedSimpleNewTicket />
                            </ProtectedRoute>
                        } />
                        <Route path="collections" element={
                            <ProtectedRoute roles={['admin', 'zone', 'woreda']}>
                                <ImprovedFixedCollections />
                            </ProtectedRoute>
                        } />
                        <Route path="reports" element={
                            <ProtectedRoute roles={['woreda']}>
                                <OrganizedWoredaReports />
                            </ProtectedRoute>
                        } />
                        <Route path="admin" element={
                            <ProtectedRoute roles={['admin', 'zone']}>
                                <Admin />
                            </ProtectedRoute>
                        } />
                    </Route>
                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
            </BrowserRouter>
        </AuthProvider>
    )
}

function PublicRoute({ children }) {
    const { user } = useAuth()
    if (user) return <Navigate to="/" replace />
    return children
}
