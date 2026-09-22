import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGame } from '../../contexts/GameContext';
import { LeaderboardEntry } from '../../types';
import { Button } from '../../components/ui/button';
import { Trophy, Home, Play } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../../components/ui/tabs';

export default function Leaderboard() {
  const { clinic, setScore, setSelectedDoctor } = useGame();
  const navigate = useNavigate();
  const [scores, setScores] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (clinic) {
      fetch(`/api/clinics/${clinic.id}/leaderboard`)
        .then(res => res.json())
        .then(data => {
          setScores(data);
          setLoading(false);
        });
    }
  }, [clinic]);

  const resetAndPlay = () => {
    setScore(0);
    setSelectedDoctor(null);
    navigate('..');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center py-8 px-4">
      <div className="w-full max-w-md">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Trophy className="text-yellow-500" /> Leaderboard
          </h1>
          <Button variant="ghost" size="icon" onClick={() => navigate('..')}>
            <Home className="text-slate-500" />
          </Button>
        </div>

        <Tabs defaultValue="all-time" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6 bg-slate-200">
            <TabsTrigger value="today">Today</TabsTrigger>
            <TabsTrigger value="week">Week</TabsTrigger>
            <TabsTrigger value="all-time">All Time</TabsTrigger>
          </TabsList>

          <TabsContent value="all-time" className="space-y-3">
            {loading ? (
              <div className="text-center py-8 text-slate-500">Loading scores...</div>
            ) : scores.length === 0 ? (
              <div className="text-center py-8 text-slate-500">No scores yet. Be the first!</div>
            ) : (
              scores.map((entry, index) => (
                <div key={entry.id} className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 flex items-center gap-4">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                    index === 0 ? 'bg-yellow-100 text-yellow-600' : 
                    index === 1 ? 'bg-slate-100 text-slate-600' :
                    index === 2 ? 'bg-orange-100 text-orange-600' : 'bg-transparent text-slate-400'
                  }`}>
                    #{index + 1}
                  </div>
                  
                  <div className="w-12 h-12 rounded-full overflow-hidden bg-slate-100 shrink-0">
                    {entry.selfieUrl ? (
                      <img src={entry.selfieUrl} alt={entry.playerName} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-400 bg-blue-50 text-xl font-bold">
                        {entry.playerName.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-slate-800 truncate">{entry.playerName}</h3>
                    {/* {entry.doctor && <p className="text-xs text-slate-500 truncate">Played as {entry.doctor.name}</p>} */}
                  </div>
                  
                  <div className="text-right">
                    <div className="font-black text-xl text-blue-500">{entry.score}</div>
                    <div className="text-[10px] text-slate-400 uppercase tracking-wider">pts</div>
                  </div>
                </div>
              ))
            )}
          </TabsContent>
          <TabsContent value="today"><div className="text-center py-8 text-slate-500">Filter applied... (Not implemented in demo)</div></TabsContent>
          <TabsContent value="week"><div className="text-center py-8 text-slate-500">Filter applied... (Not implemented in demo)</div></TabsContent>
        </Tabs>

        <div className="mt-8">
          <Button className="w-full rounded-xl h-14 text-lg font-bold flex items-center justify-center gap-2" onClick={resetAndPlay}>
            <Play fill="currentColor" size={20} /> Play Again
          </Button>
        </div>
      </div>
    </div>
  );
}
