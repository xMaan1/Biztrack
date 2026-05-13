import { ConfigProvider } from 'antd'
import { HomePage } from './pages/HomePage'
import { antdTheme } from './theme'

export default function App() {
  return (
    <ConfigProvider theme={antdTheme}>
      <HomePage />
    </ConfigProvider>
  )
}
