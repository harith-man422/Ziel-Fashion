import React, { useState } from 'react';
import axios from 'axios';
import { useContext } from 'react';
import { ShopContext } from '../context/ShopContext';
import { toast } from 'react-toastify';

const ForgotPassword = () => {
  const { backendUrl, navigate } = useContext(ShopContext);
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const onSubmitHandler = async (event) => {
    event.preventDefault();
    setLoading(true);

    try {
      const response = await axios.post(`${backendUrl}/api/user/forgot-password`, { email });

      if (response.data.success) {
        toast.success(response.data.message);
        setEmail('');
        setTimeout(() => navigate('/login'), 1200);
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={onSubmitHandler} className='flex flex-col items-center w-[90%] sm:max-w-96 m-auto mt-14 gap-4 text-gray-800'>
      <div className='inline-flex items-center gap-2 mb-2 mt-10'>
        <p className='prata-regular text-3xl'>Forgot Password</p>
        <hr className='border-none h-[1.5px] w-8 bg-gray-800' />
      </div>

      <input
        onChange={(e) => setEmail(e.target.value)}
        value={email}
        type='email'
        className='w-full px-3 py-2 border border-gray-800'
        placeholder='Enter your email'
        required
      />

      <p className='w-full text-sm text-gray-600'>We will send your saved password to this email if your account exists.</p>

      <button type='submit' disabled={loading} className='bg-black text-white font-light px-8 py-2 mt-4 disabled:opacity-60'>
        {loading ? 'Sending...' : 'Send Password'}
      </button>

      <button type='button' onClick={() => navigate('/login')} className='cursor-pointer hover:underline text-sm'>
        Back to Login
      </button>
    </form>
  );
};

export default ForgotPassword;
