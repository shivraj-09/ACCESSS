import BarrierDetails from './pages/BarrierDetails'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './lib/AuthContext'

import ProtectedRoute from './components/ProtectedRoute'
import AppLayout from './components/AppLayout'

import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Map from './pages/Map'
import Report from './pages/Report'
import Chat from './pages/Chat'

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Login />} />

          <Route element={<ProtectedRoute />}>
            <Route element={<AppLayout />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/map" element={<Map />} />
              <Route path="/report" element={<Report />} />
              <Route path="/chat" element={<Chat />} />
              <Route
                 path="/barrier/:id"
                element={<BarrierDetails />}
              />
            </Route>
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App