import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, ArrowRight, Camera } from 'lucide-react';
import { collection, query, where, getDocs, limit } from 'firebase/firestore'; 
import { db } from '../lib/firebase';

const Landing: React.FC = () => {
  const [recentEvents, setRecentEvents] = useState<any[]>([]);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const q = query(collection(db, 'events'), where('status', '==', 'active'), limit(6));
        const snapshot = await getDocs(q);
        setRecentEvents(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      } catch (err) { console.error(err); }
    };
    fetchEvents();
  }, []);

  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="relative bg-slate-900 py-32 text-center">
        <h1 className="text-4xl font-extrabold text-white mb-6">Your Memories. Instantly. v3</h1>
        <div className="max-w-md mx-auto relative">
          <input type="text" placeholder="Search event..." className="w-full rounded-full py-3 px-6" />
          <button className="absolute right-2 top-2 p-1 bg-indigo-600 rounded-full text-white"><Search size={20} /></button>
        </div>
      </section>

      {/* GALLERIES LIST - This is what was missing */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-2xl font-bold text-slate-900 mb-8">Active Galleries</h2>
          
          {recentEvents.length === 0 ? (
            <p className="text-center text-slate-500">No active public events found.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {recentEvents.map((event) => (
                <Link key={event.id} to={`/gallery/${event.id}`} className="group bg-white rounded-xl shadow border border-slate-100 overflow-hidden hover:shadow-md transition-all">
                  <div className="h-48 bg-slate-200 flex items-center justify-center text-slate-400">
                    <Camera size={40} />
                  </div>
                  <div className="p-5">
                    <h3 className="font-bold text-lg text-slate-900">{event.name}</h3>
                    <p className="text-sm text-slate-500">{event.date}</p>
                    <div className="mt-4 flex items-center text-indigo-600 text-sm font-bold">
                      View Photos <ArrowRight className="ml-1 w-4 h-4" />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
};
export default Landing;