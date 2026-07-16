const Razorpay = require('razorpay');

// Helper to get Razorpay instance
const getRazorpayInstance = () => {
  if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
    throw new Error('Razorpay API keys are missing in environment variables.');
  }
  return new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
  });
};

exports.createOrder = async (req, res) => {
  try {
    const { plan } = req.body;
    
    // Calculate price based on plan
    let amount = 199; // Default Gold
    if (plan === 'Normal') {
      amount = 99;
    } else if (plan === 'Premium') {
      amount = 299;
    }

    const rzp = getRazorpayInstance();
    const options = {
      amount: amount * 100, // Amount in paise (subunits of currency)
      currency: 'INR',
      receipt: `receipt_plan_${plan.toLowerCase()}_${Date.now()}`
    };

    const order = await rzp.orders.create(options);
    
    res.status(200).json({
      success: true,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      key: process.env.RAZORPAY_KEY_ID
    });
  } catch (error) {
    console.error('Create Razorpay Order Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create payment order.',
      error: error.message
    });
  }
};
