import { useEffect, useState } from 'react';
import { Routes, Route, useParams, useNavigate } from 'react-router-dom';
import { GameProvider, useGame } from '../contexts/GameContext';
import Landing from '../pages/play/Landing';
import Game from '../pages/play/Game';
import ScoreSubmit from '../pages/play/ScoreSubmit';
import Leaderboard from '../pages/play/Leaderboard';

function PlayFlow() {
  const { slug } = useParams();
  const { setClinic } = useGame();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/clinics/slug/${slug}`)
      .then((res) => {
        if (!res.ok) throw new Error('Clinic not found');
        return res.json();
      })
      .then((data) => {
        setClinic(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, [slug, setClinic]);

  if (loading) return <div className="h-screen flex items-center justify-center">Loading...</div>;
  if (error) return <div className="h-screen flex items-center justify-center text-red-500">{error}</div>;

  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/game" element={<Game />} />
      <Route path="/submit" element={<ScoreSubmit />} />
      <Route path="/leaderboard" element={<Leaderboard />} />
    </Routes>
  );
}

export default function PlayRoute() {
  return (
    <GameProvider>
      <PlayFlow />
    </GameProvider>
  );
}
