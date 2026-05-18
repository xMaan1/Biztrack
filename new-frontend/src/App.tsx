import { BrowserRouter } from 'react-router-dom'
import { ConfigProvider } from 'antd'
import { AppRoutes } from './routes/AppRoutes'
import { AuthProvider } from './features/auth/AuthContext'
import { antdTheme } from './theme'

export default function App() {
  return (
    <BrowserRouter>
      <ConfigProvider theme={antdTheme}>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </ConfigProvider>
    </BrowserRouter>
  )
}
