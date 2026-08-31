import orderModel from "../models/orderModel.js";
import userModel from "../models/userModel.js";
import { stripe } from "../server.js";

// Placing orders using COD Method

const placeOrder = async (req,res) => {
  try {
   const{ userId, items, amount, address} = req.body;

   const orderData = {
    userId,
    items,
    address,
    amount,
    paymentMethod: 'Cash On Delivery',
    payment: 'false',
    date: Date.now()
   }
    const newOrder = new orderModel(orderData)
    await newOrder.save()

    await userModel.findByIdAndUpdate(userId, {cartData:{}})
    res.json({success: true, message: 'Order Placed'})

  } catch (error) {
    console.log(error)
    res.json({success:false, message:error.message})
  }

}


// All Orders data for Admin panel

const allOrders = async (req,res) => {
  try {     
    const orders = await orderModel.find({})
    res.json({success: true, orders})

  } catch (error) {
      console.log(error)
      res.json({success:false, message:error.message})
  }
}



// User Order Data for Frontend
const userOrders = async (req,res) => {
  try {
    const { userId } = req.body
    const orders = await orderModel.find({ userId })
    res.json({success: true, orders})
  } catch (error) {
      console.log(error)
      res.json({success:false, message:error.message})
  }
}



// update order status from Admin Panel
const updateStatus = async (req, res) => {
  try{
    const {orderId, status} = req.body
    await orderModel.findByIdAndUpdate(orderId, {status})
    res.json({success: true, message: "Order Status Updated"})
  } catch (error){
    console.log(error)
    res.json({success:false, message:error.message})
  }
}


// Stripe Payment Intent
const stripePaymentIntent = async (req, res) => {
  try {
    const { userId, items, amount, address } = req.body;

    // Create payment intent with Stripe
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Amount in cents
      currency: 'usd',
      metadata: {
        userId,
        items: JSON.stringify(items),
        address: JSON.stringify(address),
      },
    });

    res.json({
      success: true,
      clientSecret: paymentIntent.client_secret,
    });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};


// Create Stripe Checkout Session
const createStripeSession = async (req, res) => {
  try {
    const { items, amount, address } = req.body;
    const { userId } = req;

    // Format line items for Stripe
    const lineItems = items.map(item => ({
      price_data: {
        currency: 'usd',
        product_data: {
          name: item.name,
          images: [item.image],
        },
        unit_amount: Math.round(item.price * 100), // Price in cents
      },
      quantity: item.quantity,
    }));

    // Add shipping fee
    lineItems.push({
      price_data: {
        currency: 'usd',
        product_data: {
          name: 'Shipping Fee',
        },
        unit_amount: 1000, // $10 in cents
      },
      quantity: 1,
    });

    // Create Stripe session
    const session = await stripe.checkout.sessions.create({
      line_items: lineItems,
      mode: 'payment',
      success_url: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/orders?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/order`,
      metadata: {
        userId,
        items: JSON.stringify(items),
        address: JSON.stringify(address),
        amount,
      },
    });

    res.json({
      success: true,
      sessionUrl: session.url,
    });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};


// Verify Stripe Payment and Create Order
const verifyStripePayment = async (req, res) => {
  try {
    const { paymentIntentId, userId, items, amount, address } = req.body;

    // Retrieve payment intent from Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (paymentIntent.status === 'succeeded') {
      // Create order in database
      const orderData = {
        userId,
        items,
        address,
        amount,
        paymentMethod: 'Stripe',
        payment: 'true',
        date: Date.now(),
      };

      const newOrder = new orderModel(orderData);
      await newOrder.save();

      // Clear user's cart
      await userModel.findByIdAndUpdate(userId, { cartData: {} });

      res.json({ success: true, message: 'Payment successful and order placed' });
    } else {
      res.json({ success: false, message: 'Payment not completed' });
    }
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};


export {placeOrder, allOrders, userOrders, updateStatus, stripePaymentIntent, verifyStripePayment, createStripeSession}