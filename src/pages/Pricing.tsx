import React from 'react';
import { Check } from 'lucide-react';

const tiers = [
  { name: 'Social', price: '$4.99', features: ['Web Resolution', 'Personal License', 'Instant Download'] },
  { name: 'Print', price: '$14.99', features: ['Full Resolution', 'Print License', 'No Watermark', 'Priority Support'] },
];

const Pricing = () => (
  <div className="bg-white py-24">
    <div className="mx-auto max-w-7xl px-6 lg:px-8">
      <div className="mx-auto max-w-2xl sm:text-center">
        <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">Simple Pricing</h2>
      </div>
      <div className="mx-auto mt-16 grid max-w-lg grid-cols-1 gap-y-6 sm:mt-20 lg:max-w-4xl lg:grid-cols-2 lg:gap-x-8">
        {tiers.map((tier) => (
          <div key={tier.name} className="rounded-3xl p-8 ring-1 ring-gray-200 bg-gray-50">
            <h3 className="text-base font-semibold leading-7 text-indigo-600">{tier.name}</h3>
            <p className="mt-4 flex items-baseline gap-x-2">
              <span className="text-5xl font-bold tracking-tight text-gray-900">{tier.price}</span>
              <span className="text-base text-gray-500">/photo</span>
            </p>
            <ul className="mt-8 space-y-3 text-sm leading-6 text-gray-600">
              {tier.features.map((feature) => (
                <li key={feature} className="flex gap-x-3"><Check className="h-6 w-5 flex-none text-indigo-600" />{feature}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  </div>
);
export default Pricing;