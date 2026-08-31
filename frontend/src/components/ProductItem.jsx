import React, { useContext } from 'react'
import { ShopContext } from '../context/ShopContext'
import { Link } from 'react-router-dom'
const ProductItem = ({id, image, name, price}) => {

    const { currency } = useContext(ShopContext);
 
    // Handle both array and object formats for images
    let imageUrl = image;
    if (typeof image === 'string') {
      try {
        imageUrl = JSON.parse(image);
      } catch (e) {
        imageUrl = [image];
      }
    }
    if (image && typeof image === 'object' && !Array.isArray(image)) {
      imageUrl = Object.values(image);
    }
    
    const displayImage = Array.isArray(imageUrl) ? imageUrl[0] : imageUrl;
 
    return (
    <Link className='text-gray-700 cursor-pointer'  to={`/product/${id}`} >
    <div className='overflow-hidden' >
      <img className='hover:scale-110 transition ease-in-out'  src={displayImage} alt="" />
    </div>
    <p className='pt-3 pb-1 text-sm'>{name}</p>
    <p className='text-sm font-medium'>{currency}{price}</p> 
    </Link>
  )
}

export default ProductItem
