import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGame } from '../../contexts/GameContext';
import { Doctor } from '../../types';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Stethoscope } from 'lucide-react';

export default function Landing() {
  const { clinic, setSelectedDoctor } = useGame();
  const navigate = useNavigate();
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (clinic) {
      fetch(`/api/clinics/${clinic.id}/doctors`)
        .then((res) => res.json())
        .then((data) => {
          setDoctors(data.filter((d: Doctor) => d.isActive));
          setLoading(false);
        });
    }
  }, [clinic]);

  const handleSelectDoctor = (doc: Doctor) => {
    setSelectedDoctor(doc);
    navigate('game');
  };

  if (loading) return <div className="p-8 text-center">Loading doctors...</div>;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center py-12 px-4 font-sans">
      <div className="w-full max-w-md text-center mb-8">
        {clinic?.logoUrl ? (
          <img src={clinic.logoUrl} alt={clinic.name} className="h-16 mx-auto mb-4 rounded shadow-sm" />
        ) : (
          <div className="h-16 w-16 bg-blue-100 text-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Stethoscope size={32} />
          </div>
        )}
        <h1 className="text-3xl font-bold text-slate-900">{clinic?.name}</h1>
        <p className="text-slate-500 mt-2">Welcome to the waiting room runner!</p>
      </div>

      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl overflow-hidden border border-slate-100 p-6">
        <h2 className="text-xl font-bold text-slate-800 mb-6 text-center">Select Your Character</h2>
        
        {doctors.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-slate-500 mb-4">No characters available.</p>
            <Button onClick={() => navigate('game')} className="w-full rounded-full h-14 text-lg">
              Play Default
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            {doctors.map((doc) => (
              <Card 
                key={doc.id} 
                className="cursor-pointer hover:border-blue-500 hover:shadow-md transition-all flex flex-col items-center p-4 text-center group"
                onClick={() => handleSelectDoctor(doc)}
              >
                <div className="w-20 h-20 bg-slate-100 rounded-full mb-3 overflow-hidden group-hover:scale-105 transition-transform">
                  {doc.avatarUrl ? (
                    <img src={doc.avatarUrl} alt={doc.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-400">
                      <Stethoscope size={32} />
                    </div>
                  )}
                </div>
                <h3 className="font-bold text-slate-800 leading-tight mb-1">{doc.name}</h3>
                {doc.title && <p className="text-xs text-slate-500">{doc.title}</p>}
              </Card>
            ))}
          </div>
        )}
        
        <div className="mt-8 text-center">
          <Button variant="ghost" onClick={() => navigate('leaderboard')} className="text-slate-500">
            View Leaderboard
          </Button>
        </div>
      </div>
    </div>
  );
}
