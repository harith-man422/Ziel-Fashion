import orderModel from "../models/orderModel.js";
import userModel from "../models/userModel.js";
import productModel from "../models/productModel.js";
import { stripe } from "../server.js";

// Placing orders using COD Method

const placeOrder = async (req,res) => {
  try {
   const{ userId, items, amount, address} = req.body;
  if (!Array.isArray(items) || items.length === 0) {
   return res.json({ success: false, message: 'Your cart is empty' });
  }

   const orderData = {
    userId,
    items,
    address,
    amount,
    paymentMethod: 'Cash On Delivery',
    payment: false,
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
        amount: String(amount),
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
    if (!Array.isArray(items) || items.length === 0) {
      return res.json({ success: false, message: 'Your cart is empty' });
    }
    const frontendUrl = process.env.FRONTEND_URL || req.headers.origin || 'http://localhost:5173';
    const compactItems = items.map(({ _id, size, quantity }) => ({
      productId: _id,
      size,
      quantity,
    }));

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
      success_url: `${frontendUrl}/orders?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${frontendUrl}/cart`,
      metadata: {
        userId,
        items: JSON.stringify(compactItems),
        address: JSON.stringify(address),
        amount: String(amount),
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

// Verify a hosted Stripe Checkout session and create its order once.
const verifyStripeSession = async (req, res) => {
  try {
    const { sessionId } = req.body;
    const { userId } = req;
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.payment_status !== 'paid' || session.metadata.userId !== userId) {
      return res.json({ success: false, message: 'Payment has not been completed' });
    }

    const paymentId = String(session.payment_intent);
    const existingOrder = await orderModel.findOne({ paymentId });
    if (!existingOrder) {
      const storedItems = JSON.parse(session.metadata.items);
      const compactItems = storedItems.map((item) => ({
        productId: item.productId || item._id,
        size: item.size,
        quantity: item.quantity,
        product: item.productId || item._id ? null : item,
      }));
      const products = await productModel.find({
        _id: { $in: compactItems.filter((item) => item.productId).map((item) => item.productId) },
      });
      const items = compactItems.map((item) => {
        const product = item.product || products.find((entry) => String(entry._id) === item.productId);
        return {
          ...(product.toObject ? product.toObject() : product),
          size: item.size,
          quantity: item.quantity,
        };
      });

      await orderModel.create({
        userId,
        items,
        address: JSON.parse(session.metadata.address),
        amount: Number(session.metadata.amount),
        paymentMethod: 'Stripe',
        payment: true,
        paymentId,
        date: Date.now(),
      });
      await userModel.findByIdAndUpdate(userId, { cartData: {} });
    }

    res.json({ success: true, message: 'Payment verified and order placed' });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};


export {placeOrder, allOrders, userOrders, updateStatus, stripePaymentIntent, verifyStripePayment, verifyStripeSession, createStripeSession}