import { useState } from 'react'
import { Dashboard } from './components/Dashboard'
import { Layout } from './components/Layout'
import { RecipientsList } from './components/RecipientsList'
import { RulesList } from './components/RulesList'
import { SendsList } from './components/SendsList'
import { TemplatesList } from './components/TemplatesList'

type Page = 'dashboard' | 'recipients' | 'templates' | 'rules' | 'sends'

function App() {
  const [page, setPage] = useState<Page>('dashboard')

  const renderPage = () => {
    switch (page) {
      case 'dashboard':
        return <Dashboard onNavigate={setPage} />
      case 'recipients':
        return <RecipientsList />
      case 'templates':
        return <TemplatesList />
      case 'rules':
        return <RulesList />
      case 'sends':
        return <SendsList />
      default:
        return <Dashboard onNavigate={setPage} />
    }
  }

  return (
    <Layout page={page} onNavigate={setPage}>
      {renderPage()}
    </Layout>
  )
}

export default App
