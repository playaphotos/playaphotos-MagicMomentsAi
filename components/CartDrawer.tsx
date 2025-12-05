import React, { useState } from 'react';
import { X, Trash2, ShoppingBag, Lock, Loader2 } from 'lucide-react';
import { useCart } from '../contexts/CartContext';
import { getFunctions, httpsCallable } from 'firebase/functions';

export const CartDrawer: React.FC = () => {
  const { items, isOpen, toggleCart, removeFromCart, cartTotal } = useCart();
  const [isCheckingOut, setIsCheckingOut] = useState(false);

  if (!isOpen) return null;

  const handleCheckout = async () => {
    setIsCheckingOut(true);
    const functions = getFunctions();
    const createStripeCheckout = httpsCallable(functions, 'createStripeCheckout');

    try {
      const result: any = await createStripeCheckout({
        cartItems: items,
        agencyId: 'Global_Agency', 
        returnUrl: window.location.origin
      });

      if (result.data.url) {
        window.location.href = result.data.url;
      }
    } catch (error) {
      console.error("Checkout Failed", error);
      alert("Checkout failed (Backend may not be deployed yet).");
      setIsCheckingOut(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex justify-end">
      <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={toggleCart} />
      <div className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right">
        <div className="p-5 border-b border-slate-100 flex justify-between bg-slate-50">
          <div className="flex items-center gap-2"><ShoppingBag className="text-brand-600"/> <b>Your Cart ({items.length})</b></div>
          <button onClick={toggleCart}><X className="w-6 h-6 text-slate-400"/></button>
        </div>
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {items.length === 0 && <p className="text-center text-slate-400 mt-10">Your cart is empty.</p>}
          {items.map(item => (
            <div key={item.id} className="flex gap-4 p-3 border rounded-xl bg-slate-50">
              <img src={item.thumbnailUrl} className="w-20 h-20 object-cover rounded-lg" />
              <div className="flex-1">
                <p className="font-bold">{item.label}</p>
                <div className="flex justify-between mt-2">
                  <span>${item.price.toFixed(2)}</span>
                  <button onClick={() => removeFromCart(item.id)}><Trash2 className="w-4 h-4 text-red-400"/></button>
                </div>
              </div>
            </div>
          ))}
        </div>
        {items.length > 0 && (
          <div className="p-6 border-t bg-slate-50">
            <div className="flex justify-between mb-4 text-xl font-bold"><span>Total</span><span>${cartTotal.toFixed(2)}</span></div>
            <button onClick={handleCheckout} disabled={isCheckingOut} className="w-full py-4 bg-slate-900 text-white rounded-xl font-bold flex justify-center gap-2">
              {isCheckingOut ? <Loader2 className="animate-spin"/> : <Lock className="w-4 h-4"/>} Secure Checkout
            </button>
          </div>
        )}
      </div>
    </div>
  );
};