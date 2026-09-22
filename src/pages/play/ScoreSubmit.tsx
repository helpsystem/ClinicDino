import React, { useRef, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGame } from '../../contexts/GameContext';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Card } from '../../components/ui/card';
import { Camera, X } from 'lucide-react';

export default function ScoreSubmit() {
  const { clinic, selectedDoctor, score } = useGame();
  const navigate = useNavigate();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [playerName, setPlayerName] = useState('');
  const [selfieDataUrl, setSelfieDataUrl] = useState<string | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setCameraActive(true);
      }
    } catch (err) {
      console.error("Camera error:", err);
      alert("Unable to access camera. You can still submit your score without a selfie!");
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
      tracks.forEach(t => t.stop());
      setCameraActive(false);
    }
  };

  useEffect(() => {
    return () => stopCamera();
  }, []);

  const takeSelfie = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        // Draw image cropped to square
        const size = Math.min(video.videoWidth, video.videoHeight);
        const x = (video.videoWidth - size) / 2;
        const y = (video.videoHeight - size) / 2;
        ctx.drawImage(video, x, y, size, size, 0, 0, 400, 400);
        
        // Compress to WebP
        const dataUrl = canvas.toDataURL('image/webp', 0.8);
        setSelfieDataUrl(dataUrl);
        stopCamera();
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!playerName.trim()) return;
    
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/leaderboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clinicId: clinic?.id,
          doctorId: selectedDoctor?.id,
          playerName: playerName.trim().substring(0, 15),
          score: Math.floor(score / 10),
          selfieUrl: selfieDataUrl // In a real app, upload to R2/Storage first, then send URL
        })
      });
      if (res.ok) {
        navigate('../leaderboard');
      } else {
        alert("Failed to submit score");
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center py-12 px-4">
      <Card className="w-full max-w-md p-6 rounded-3xl shadow-xl border-slate-100">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-slate-800">New High Score!</h2>
          <p className="text-5xl font-black text-blue-500 mt-2">{Math.floor(score / 10)}</p>
        </div>

        <div className="mb-6 flex flex-col items-center">
          <p className="text-sm text-slate-500 mb-3 text-center">Take a waiting room selfie! (Optional)</p>
          
          <div className="relative w-40 h-40 rounded-full overflow-hidden bg-slate-100 border-4 border-white shadow-md flex items-center justify-center">
            {selfieDataUrl ? (
              <>
                <img src={selfieDataUrl} alt="Selfie" className="w-full h-full object-cover" />
                <button 
                  onClick={() => { setSelfieDataUrl(null); startCamera(); }}
                  className="absolute top-2 right-2 bg-slate-900/50 text-white p-1 rounded-full"
                >
                  <X size={16} />
                </button>
              </>
            ) : cameraActive ? (
              <>
                <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
                <div className="absolute inset-x-0 bottom-2 flex justify-center">
                  <button onClick={takeSelfie} className="w-10 h-10 bg-white rounded-full shadow-lg border-2 border-slate-200" />
                </div>
              </>
            ) : (
              <button onClick={startCamera} className="text-slate-400 hover:text-blue-500 transition-colors flex flex-col items-center">
                <Camera size={32} />
                <span className="text-xs font-medium mt-1">Open Camera</span>
              </button>
            )}
            <canvas ref={canvasRef} width={400} height={400} className="hidden" />
          </div>
          <p className="text-[10px] text-slate-400 mt-2 text-center max-w-xs">By enabling the camera, you consent to sharing your image on the waiting room leaderboard.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Input 
              placeholder="Your Nickname (Max 15 chars)" 
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              maxLength={15}
              required
              className="text-center text-lg h-12 rounded-xl"
            />
          </div>
          <Button type="submit" disabled={isSubmitting || !playerName.trim()} className="w-full h-14 rounded-xl text-lg font-bold">
            {isSubmitting ? 'Submitting...' : 'Submit to Leaderboard'}
          </Button>
          <Button type="button" variant="ghost" className="w-full" onClick={() => navigate('../leaderboard')}>
            Skip & View Board
          </Button>
        </form>
      </Card>
    </div>
  );
}
