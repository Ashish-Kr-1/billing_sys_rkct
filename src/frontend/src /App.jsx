import React from 'react'
import { BrowserRouter , Routes , Route , Navigate } from 'react-router-dom'
import Landing_page from './LandingPage.jsx'
import Create_Party from './Create_Party.jsx'
import Invoice from './Invoice.jsx'
import Preview from './components/Preview.jsx'
function App() {
  return (
    <div>
      <BrowserRouter>
        <Routes>
          <Route path='/Home' element={<Landing_page/>}/>
          <Route path='/Create_Party' element={<Create_Party/>}/>
          <Route path='/Invoice' element={<Invoice/>}/>
          <Route path='/Preview' element={<Preview/>}/>
        </Routes>      
      </BrowserRouter>
    </div>
  )
}

export default App