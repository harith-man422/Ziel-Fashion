import express from 'express'
import {placeOrder, allOrders, userOrders, updateStatus, stripePaymentIntent, verifyStripePayment, verifyStripeSession, createStripeSession} from '../controllers/orderController.js'
import adminAuth from '../middleware/adminAuth.js'
import authUser from '../middleware/auth.js'


const orderRouter = express.Router()

//Admin features
orderRouter.post('/list',adminAuth, allOrders)
orderRouter.post('/status',adminAuth, updateStatus)


// Payment features
orderRouter.post('/place',authUser, placeOrder)
orderRouter.post('/stripe-intent', authUser, stripePaymentIntent)
orderRouter.post('/verify-stripe', authUser, verifyStripePayment)
orderRouter.post('/verify-stripe-session', authUser, verifyStripeSession)
orderRouter.post('/create-stripe-session', authUser, createStripeSession)


// User Features
orderRouter.post('/userorders', authUser, userOrders)


export default orderRouter