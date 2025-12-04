import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import Stripe from 'stripe'; // We can import this now!

// Initialize Firebase
admin.initializeApp();
const db = admin.firestore();

// Initialize Stripe (Test Key)
const stripe = new Stripe(functions.config().stripe?.secret || 'sk_test_PLACEHOLDER', { 
  apiVersion: '2024-11-20.acacia' 
});

// --- 1. AI Generation (Stub) ---
export const generateScenario = functions.https.onCall(async (data, context) => {
  // We will fill this in Prompt 6
  return { success: true, url: "https://source.unsplash.com/random/800x600/?scifi" };
});

// --- 2. Create Stripe Checkout Session ---
export const createStripeCheckout = functions.https.onCall(async (data, context) => {
  if (!context.auth) throw new functions.https.HttpsError('unauthenticated', 'Must be logged in');
  
  const { cartItems, agencyId, returnUrl } = data;
  
  const lineItems = cartItems.map((item: any) => ({
    price_data: {
      currency: 'usd',
      product_data: {
        name: item.label,
        images: [item.thumbnailUrl],
      },
      unit_amount: Math.round(item.price * 100), // Cents
    },
    quantity: 1,
  }));

  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment',
      success_url: `${returnUrl}/#/checkout/success`, // Note the /#/ for HashRouter
      cancel_url: `${returnUrl}/#/`,
      metadata: {
        agencyId,
        customerEmail: context.auth.token.email || 'guest',
        cartItems: JSON.stringify(cartItems)
      }
    });

    return { url: session.url };
  } catch (error: any) {
    console.error("Stripe Error:", error);
    throw new functions.https.HttpsError('internal', error.message);
  }
});

// --- 3. Stripe Webhook (Fulfillment) ---
export const fulfillOrder = functions.https.onRequest(async (req, res) => {
  const event = req.body;

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const { customerEmail, cartItems } = session.metadata;
    const albumId = admin.firestore().collection('purchased_albums').doc().id;
    
    await db.collection('purchased_albums').doc(albumId).set({
      email: customerEmail,
      items: JSON.parse(cartItems),
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      status: 'paid'
    });
  }
  res.json({received: true});
});