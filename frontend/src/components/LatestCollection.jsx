import React, { useEffect, useState } from 'react'
import { useContext } from 'react'
import { ShopContext } from '../context/ShopContext'
import Title from './Title';
import ProductItem from './ProductItem';

const LatestCollection = () => {
  
  const { products} = useContext(ShopContext);

  const [latestProducts, setLatestProducts ] = useState([]);

  useEffect(() => {
     setLatestProducts(products.slice(0,10));
  },[products])
  
    return (
    <div className='my-10'>
      <div className='text-center py-8 text-3xl'>
        <Title  text1={'LATEST'} text2={'COLLECTION'} />
        <p className='w-3/4 m-auto text-xs sm:text-sm md:text-base  text-gray-600'>Discover the latest collection from Ziel, where modern style meets effortless comfort. Carefully designed with contemporary trends, quality fabrics, and versatile details, our newest pieces are made to elevate your everyday wardrobe. From timeless essentials to standout styles, explore fresh looks that reflect your individuality and keep you confidently ahead of the season.</p>     
      </div>
      
      {/* Rendering products */}
      
      <div className='grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 gap-4 gap-y-6'>
        {latestProducts.map((item,index) => (
          <ProductItem key={index} id={item._id} image={item.image} name={item.name} price={item.price}/>
        ))}
      </div>

    </div>
  )
}

export default LatestCollection
