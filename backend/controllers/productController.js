import { v2 as cloudinary } from 'cloudinary';
import productModel from '../models/productModel.js'

const chatbotHandler = async (req, res) => {
  try {
    const { message } = req.body || {};

    if (!message || !message.trim()) {
      return res.json({ success: false, message: 'Please enter a message' });
    }

    const products = await productModel.find({}).lean();
    const productCatalog = products.map((product) => ({
      _id: product._id,
      name: product.name,
      category: product.category,
      subcategory: product.subcategory,
      price: product.price,
      description: product.description,
      bestseller: product.bestseller,
    }));

    const prompt = `
      You are a helpful e-commerce clothing store assistant.
      Use the catalog below to answer the customer question.
      If the user asks for products, recommend up to 5 relevant products.
      Return JSON only in this format:
      {
        "answer": "short helpful response",
        "products": [{ "_id": "id", "name": "product name", "price": 0, "category": "category" }]
      }
      Customer question: ${message}
      Catalog: ${JSON.stringify(productCatalog)}
    `;

    const response = await fetch(`${process.env.LLM_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.LLM_API_KEY}`,
      },
      body: JSON.stringify({
        model: process.env.LLM_MODEL,
        messages: [
          { role: 'system', content: 'You are a helpful clothing store assistant.' },
          { role: 'user', content: prompt },
        ],
        temperature: 0.4,
      }),
    });

    const data = await response.json();
    let content = data.choices?.[0]?.message?.content || '{"answer":"I can help with that.","products":[]}';

    content = content.replace(/```json|```/gi, '').trim();
    const jsonStart = content.indexOf('{');
    const jsonEnd = content.lastIndexOf('}');
    if (jsonStart !== -1 && jsonEnd > jsonStart) {
      content = content.slice(jsonStart, jsonEnd + 1);
    }

    const parsed = JSON.parse(content);

    return res.json({
      success: true,
      answer: parsed.answer || 'I can help with that.',
      products: parsed.products || [],
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// function for add product
const addProduct = async (req, res) => {
    try {        
      const { name, description, category, price, subcategory, bestseller, sizes } = req.body

      const image1 = req.files.image1 &&  req.files.image1[0]
      const image2 = req.files.image2 &&  req.files.image2[0]
      const image3 = req.files.image3 &&  req.files.image3[0]
      const image4 = req.files.image4 &&  req.files.image4[0]

      const  images = [image1, image2, image3, image4].filter((item) => item !== undefined )

      const imagesUrl = await Promise.all(
        images.map(async (item) => {
          let result = await cloudinary.uploader.upload(item.path, {resource_type: 'image'});
          return result.secure_url
        })
      );
     

      const productData = {
        name,
        description,
        category,
        price: Number(price),
        subcategory,
        bestseller: bestseller === "true" ? true : false,
        sizes: JSON.parse(sizes),
        image: imagesUrl,
        date: Date.now()
      }

      console.log(productData);

      const product = new productModel(productData);
      await product.save()

      res.json({ success: true, message: 'Product Added successfully' });
      
    } catch (error) {
      console.log(error);
      res.json({success:false, message: error.message})
    }
 
}


// function for List product
const listProducts = async (req, res) => {
  try {
    const products = await productModel.find({});
    
    // Normalize image data for all products
    const normalizedProducts = products.map(product => {
      const productObj = product.toObject ? product.toObject() : product;
      
      // Handle both array and object formats for images
      let imageArray = productObj.image;
      if (typeof imageArray === 'string') {
        try {
          imageArray = JSON.parse(imageArray);
        } catch (e) {
          imageArray = [imageArray];
        }
      }
      if (imageArray && typeof imageArray === 'object' && !Array.isArray(imageArray)) {
        imageArray = Object.values(imageArray);
      }
      
      return {
        ...productObj,
        image: Array.isArray(imageArray) ? imageArray : [imageArray]
      };
    });
    
    res.json({ success: true, products: normalizedProducts });
  } catch (error) {
    console.log(error);
    res.json({success:false, message: error.message})
  }
}



// function for removing product
const removeProduct = async (req,res) => {
   try {
    await productModel.findByIdAndDelete(req.body.id)
    res.json({ success: true, message: 'Product removed successfully' });
   } catch (error) {
    console.log(error);
    res.json({success:false, message: error.message})
  }
}




// function for single product info
const singleProduct = async (req,res) => {
  try {  
    const {productId} = req.body
    const product = await productModel.findById(productId)
    const productObj = product.toObject ? product.toObject() : product;
    
    // Normalize image data
    let imageArray = productObj.image;
    if (typeof imageArray === 'string') {
      try {
        imageArray = JSON.parse(imageArray);
      } catch (e) {
        imageArray = [imageArray];
      }
    }
    if (imageArray && typeof imageArray === 'object' && !Array.isArray(imageArray)) {
      imageArray = Object.values(imageArray);
    }
    
    const normalizedProduct = {
      ...productObj,
      image: Array.isArray(imageArray) ? imageArray : [imageArray]
    };
    
    res.json({ success: true, product: normalizedProduct });
  } catch (error) {
    console.log(error);
    res.json({success:false, message: error.message})
  }
}


export {listProducts, addProduct, removeProduct, singleProduct, chatbotHandler}