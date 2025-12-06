import React from 'react'
import Navbar from './components/Navbarr.jsx';
import { useNavigate } from 'react-router-dom';
import Footer from './components/footer.jsx';
function LandingPage() {
  return (
    <>
    <Navbar/>
    <div className='w-full min-h-screen bg-amber-50 pt-3'>
        <div className='bg-[#004D43] rounded-b-xl mt-32 px-20'>
            {["R.K Casting & " ," Engineering Works"].map((item,index) => {
                return (
                    <h1 key={index} className={`textfont-[Rubik] text-white py-1 text-4xl md:text-6xl lg:text-8xl font-bold cursor-pointer ${index===0 ? 'text-left' : 'text-right'}`}>{item}</h1>
                );
            })}
        </div>
        <div className='w-auto  mt-12 md:mt-12 text-font-[Rubik] py-4 md:py-12 ml-4 px-2 md:px-28 lg:pe-40 mr-20 lg:mr-80  rounded-br-2xl shadow-2xl shadow-[#004d4341]'> Lorem ipsum dolor sit amet consectetur, adipisicing elit. Nesciunt, error unde deserunt atque quis quas ipsa officiis blanditiis, quasi iusto dicta corrupti itaque perspiciatis sunt, consectetur dolores magni illum recusandae libero commodi. Sapiente quas ad a. Commodi quisquam fugit sed, rem similique, quibusdam velit sint deserunt fugiat quo cupiditate dolorum tempore, debitis non asperiores inventore? Voluptas asperiores tenetur nemo harum explicabo unde ut nobis fugiat dignissimos esse voluptatum ex perspiciatis voluptate sint magnam quo rerum soluta, eaque quae! Et deleniti doloremque suscipit optio hic illo necessitatibus excepturi expedita voluptas quas quis soluta eum quod, officia ut, molestiae culpa quibusdam dolorum.
        </div>
         <Footer></Footer>
    </div>
     
    </>

    
  )
}

export default LandingPage