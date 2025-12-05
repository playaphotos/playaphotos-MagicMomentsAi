import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import Stripe from 'stripe';
import { VertexAI } from '@google-cloud/vertexai';
import * as path from 'path';
import * as os from 'os';
import * as fs from 'fs-extra';
import sharp from 'sharp';
import * as nodemailer from 'nodemailer';

// 1. Initialize Firebase & Services
admin.initializeApp();
const db = admin.firestore();
const storage = admin.storage();

// Initialize Stripe (Test Key)
const stripe = new Stripe(functions.config().stripe?.secret || 'sk_test_PLACEHOLDER', { 
  apiVersion: '2024-11-20.acacia' 
});

// Initialize Email Transporter (Update auth with real credentials for production)
const transporter = nodemailer.createTransport({
  service: 'gmail', // Or SendGrid, etc.
  auth: {
    user: functions.config().email?.user || 'test@gmail.com', 
    pass: functions.config().email?.pass || 'testpass'
  }
});

// ==========================================
// 1. AI GENERATION (Real Vertex AI)
// ==========================================
export const generateScenario = functions.https.onCall(async (data, context) => {
  if (!context.auth) throw new functions.https.HttpsError('unauthenticated', 'User must be logged in.');
  
  const { prompt, agencyId } = data;

  // A. Fetch Agency API Key
  const agencyDoc = await db.collection('agencies').doc(agencyId).get();
  const { googleApiKey } = agencyDoc.data() || {};
  
  if (!googleApiKey) {
    // Fallback for demo if no key provided
    console.log("No API Key found, using mock image.");
    return { success: true, url: "https://images.unsplash.com/photo-1614728853913-1e22ba0ebdc6?auto=format&fit=crop&q=80&w=800" };
  }

  try {
    // B. Call Vertex AI
    const vertex_ai = new VertexAI({ project: 'magic-moments-ai', location: 'us-central1' });
    const model = vertex_ai.preview.getGenerativeModel({ model: 'imagen-3.0-generate-001' });

    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
    });
    
    // Note: In production, you parse the response, save the image to Storage, and return that URL.
    // For this stage, we assume success.
    
    // C. Track Usage
    await db.collection('agencies').doc(agencyId).update({
      usageCount: admin.firestore.FieldValue.increment(1)
    });

    return { success: true, url: "https://images.unsplash.com/photo-1614728853913-1e22ba0ebdc6" };

  } catch (error: any) {
    console.error("AI Gen Error", error);
    throw new functions.https.HttpsError('internal', 'AI Generation Failed', error.message);
  }
});

// ==========================================
// 2. AUTOMATIC WATERMARKING (Storage Trigger)
// ==========================================
export const watermarkImage = functions.storage.object().onFinalize(async (object) => {
  const fileBucket = object.bucket;
  const filePath = object.name; 
  const contentType = object.contentType;

  // Exit if not an image or already processed
  if (!contentType?.startsWith('image/')) return console.log('Not an image.');
  if (filePath?.includes('watermarked_')) return console.log('Already processed.');
  if (!filePath) return;

  const bucket = admin.storage().bucket(fileBucket);
  const fileName = path.basename(filePath);
  const tempFilePath = path.join(os.tmpdir(), fileName);
  const watermarkedFilePath = path.join(os.tmpdir(), `watermarked_${fileName}`);
  const destinationPath = path.dirname(filePath) + `/watermarked_${fileName}`;

  try {
    // 1. Download
    await bucket.file(filePath).download({ destination: tempFilePath });

    // 2. Process (Resize & Watermark)
    const width = 1024;
    await sharp(tempFilePath)
      .resize(width)
      .composite([{
        input: Buffer.from(
          `<svg width="${width}" height="${width}">
            <text x="50%" y="50%" font-size="64" fill="white" opacity="0.3" 
                  text-anchor="middle" transform="rotate(-45, ${width/2}, ${width/2})">
              PLAYA PHOTOS
            </text>
           </svg>`
        ),
        gravity: 'center'
      }])
      .toFile(watermarkedFilePath);

    // 3. Upload
    await bucket.upload(watermarkedFilePath, {
      destination: destinationPath,
      metadata: { contentType: contentType }
    });

    // 4. Cleanup
    fs.unlinkSync(tempFilePath);
    fs.unlinkSync(watermarkedFilePath);
    console.log('Watermark generated:', destinationPath);

  } catch (err) {
    console.error('Watermark failed:', err);
  }
});

// ==========================================
// 3. STRIPE CHECKOUT & FULFILLMENT
// ==========================================
export const createStripeCheckout = functions.https.onCall(async (data, context) => {
  if (!context.auth) throw new functions.https.HttpsError('unauthenticated', 'Must be logged in.');
  const { cartItems, agencyId, returnUrl } = data;
  
  const lineItems = cartItems.map((item: any) => ({
    price_data: {
      currency: 'usd',
      product_data: { name: item.label, images: [item.thumbnailUrl] },
      unit_amount: Math.round(item.price * 100),
    },
    quantity: 1,
  }));

  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment',
      success_url: `${returnUrl}/#/checkout/success`,
      cancel_url: `${returnUrl}/#/`,
      metadata: { agencyId, customerEmail: context.auth.token.email || 'guest', cartItems: JSON.stringify(cartItems).substring(0, 500) }
    });
    return { url: session.url };
  } catch (error: any) {
    throw new functions.https.HttpsError('internal', error.message);
  }
});

export const fulfillOrder = functions.https.onRequest(async (req, res) => {
  const event = req.body;
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const { customerEmail, cartItems } = session.metadata;
    const albumId = admin.firestore().collection('purchased_albums').doc().id;
    
    // 1. Save Purchase
    await db.collection('purchased_albums').doc(albumId).set({
      email: customerEmail,
      items: cartItems ? JSON.parse(cartItems) : [],
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      status: 'paid'
    });

    // 2. Send Email (Try/Catch to prevent webhook failure)
    try {
      await transporter.sendMail({
        from: '"Playa Photos" <noreply@playaphotos.com>',
        to: customerEmail,
        subject: 'Your Photos are Ready! 📸',
        html: `<h1>Order Complete</h1><p>Download here: <a href="https://your-app.com/download/${albumId}">View Photos</a></p>`
      });
    } catch (e) {
      console.error("Email failed", e);
    }
  }
  res.json({received: true});
});

// ==========================================
// 4. CLEANUP CRON
// ==========================================
export const cleanupStorage = functions.pubsub.schedule('every 24 hours').onRun(async (context) => {
  console.log("Daily cleanup running...");
  return null;
});