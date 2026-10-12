import './globals.css'
import DemoBoot from './DemoBoot'

export const metadata = {
  title: 'Portfolio Platform',
  description: 'Personal Portfolio Management System',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="bg-gray-50 text-gray-900 min-h-screen">
        <DemoBoot />
        {children}
      </body>
    </html>
  )
}
