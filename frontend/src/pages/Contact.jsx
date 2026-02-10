import React from 'react'
import Title from '../components/Title'
import { assets } from '../assets/assets'
import NewsLetterBox from '../components/NewsLetterBox'

const Contact = () => {
  return (
    <div>

      <div className='text-center text-2xl  pt-10 border-t'>
        <Title text1={'CONTACT'} text2={'US'} />
      </div>

      <div className='my-10 flex flex-col justify-center md:flex-row gap-10 mb-28' >
        <img className='w-full md:max-w-[480px]' src={assets.contact_img} alt="" />
        <div className='flex flex-col justify-center items-start gap-6'>
          <p className='font-semibold text-xl text-gray-600 ' >Our Store</p>
          <p className='text-gray-500' >54709 Willms Station <br /> Suite 350, Karcahi, Pakistan</p>
          <p className='text-gray-500' >Tel: +92 3432705821 <br /> Email: marqum987@gmail.com</p>
          <p className='font-semibold text-xl text-gray-600'>Customer Support</p>
          <p className='text-gray-500'>
            We're here to help! Reach out to us for any queries,<br/> 
            order tracking, returns, or product information.
          </p>
          <p className='text-gray-500'>
            <b>Working Hours:</b> Mon - Sat, 9:00 AM - 9:00 PM
          </p>
        </div>
      </div>
      
       <NewsLetterBox />

    </div>
  )
}

export default Contact
