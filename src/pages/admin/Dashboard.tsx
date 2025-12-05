import React, { useEffect, useState } from 'react';
import { collection, query, where, getCountFromServer, getDocs } from 'firebase/firestore';
import { db, auth } from '../../lib/firebase';
import { DollarSign, Wand2, Image as ImageIcon } from 'lucide-react';

const Dashboard = () => {
  const [stats, setStats] = useState({ revenue: 0, aiCount: 0, eventCount: 0 });

  useEffect(() => {
    const fetchStats = async () => {
      if (!auth.currentUser) return;
      const agencyId = auth.currentUser.uid;

      try {
        // 1. Count Events
        const eventsQ = query(collection(db, 'events'), where('agencyId', '==', agencyId));
        const eventsSnap = await getCountFromServer(eventsQ);

        // 2. Get AI Usage (from agency doc)
        const agencyDoc = await getDocs(query(collection(db, 'agencies'), where('ownerUid', '==', agencyId)));
        const aiUsage = agencyDoc.empty ? 0 : agencyDoc.docs[0].data().usageCount || 0;

        // 3. Mock Revenue (Real revenue would come from a 'sales' collection)
        const revenue = 1250.00; 

        setStats({
          eventCount: eventsSnap.data().count,
          revenue: revenue,
          aiCount: aiUsage
        });
      } catch (err) {
        console.error("Stats error:", err);
      }
    };
    fetchStats();
  }, []);

  const StatCard = ({ title, value, icon: Icon, color }: any) => (
    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
      <div className={`p-4 rounded-full ${color} text-white`}>
        <Icon className="w-6 h-6" />
      </div>
      <div>
        <h3 className="font-semibold text-slate-500 text-sm uppercase tracking-wider">{title}</h3>
        <p className="text-3xl font-bold text-slate-900 mt-1">{value}</p>
      </div>
    </div>
  );

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold text-slate-800 mb-8">Agency Dashboard</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         <StatCard title="Total Revenue" value={`$${stats.revenue}`} icon={DollarSign} color="bg-green-500" />
         <StatCard title="AI Generations" value={stats.aiCount} icon={Wand2} color="bg-purple-500" />
         <StatCard title="Active Events" value={stats.eventCount} icon={ImageIcon} color="bg-indigo-500" />
      </div>
    </div>
  );
};
export default Dashboard;