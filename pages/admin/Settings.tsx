import React from 'react';
import { CreditCard, Save } from 'lucide-react';

const Settings = () => {
  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-slate-900 mb-6">Agency Settings</h1>
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm mb-6">
        <div className="flex items-center gap-4 mb-4">
          <div className="bg-indigo-50 p-3 rounded-full text-indigo-600"><CreditCard /></div>
          <div><h2 className="text-lg font-bold">Payout Settings</h2><p className="text-sm text-slate-500">Connect Stripe to receive payouts.</p></div>
        </div>
        <button onClick={() => alert("Requires Production Key")} className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-bold">Connect with Stripe</button>
      </div>
    </div>
  );
};
export default Settings;