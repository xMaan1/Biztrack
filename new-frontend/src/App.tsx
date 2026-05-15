import { BrowserRouter } from 'react-router-dom'
import { ConfigProvider } from 'antd'
import { AppRoutes } from './routes/AppRoutes'
import { antdTheme } from './theme'

export default function App() {
  return (
    <BrowserRouter>
      <ConfigProvider theme={antdTheme}>
        <AppRoutes />
      </ConfigProvider>
    </BrowserRouter>
  )
}
