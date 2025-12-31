import { BrowserRouter , Routes , Route , Navigate } from 'react-router-dom'
import Landing_page from './LandingPage.jsx'
import Create_Party from './Create_Party.jsx'
import Invoice from './Invoice.jsx'
import Preview from './Preview.jsx'
import Ledger from './Ledger.jsx'
import Outstanding from './Outstanding.jsx'
function App() {
  return (
    <div>
      <BrowserRouter>
        <Routes>
          <Route path='/' element={<Invoice/>}/>
          <Route path='/Create_Party' element={<Create_Party/>}/>
          <Route path='/Invoice' element={<Invoice/>}/>
          <Route path='/Preview' element={<Preview/>}/>
          <Route path='/Ledger' element={<Ledger/>}/>
          <Route path='/Outstanding' element={<Outstanding/>}/>
        </Routes>      
      </BrowserRouter>
    </div>
  )
}

export default App