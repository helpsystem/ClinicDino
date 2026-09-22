import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGame } from '../../contexts/GameContext';
import { Button } from '../../components/ui/button';
import GameEngine from '../../components/GameEngine';

export default function Game() {
  const { setScore, selectedDoctor, clinic } = useGame();
  const navigate = useNavigate();
  const [gameOver, setGameOver] = useState(false);
  const [currentScore, setCurrentScore] = useState(0);
  const [currentLevel, setCurrentLevel] = useState(1);
  const [showGuide, setShowGuide] = useState(false);

  const handleScoreUpdate = useCallback((score: number) => {
    setCurrentScore(score);
  }, []);

  const handleLevelUpdate = useCallback((level: number) => {
    setCurrentLevel(level);
  }, []);

  const handleGameOver = useCallback((finalScore: number) => {
    setScore(finalScore);
    setGameOver(true);
  }, [setScore]);

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-[480px]">
        <div className="relative">
          {/* HUD Overlay */}
          <div className="absolute top-4 left-4 right-4 flex justify-between items-center z-10 font-bold text-slate-800 pointer-events-none">
            <span className="bg-white/80 px-3 py-1.5 rounded-lg text-sm shadow-sm backdrop-blur-sm">امتیاز: {currentScore}</span>
            <span className="bg-white/80 px-3 py-1.5 rounded-lg text-sm shadow-sm backdrop-blur-sm">سطح: {currentLevel}</span>
            <button 
              onClick={() => setShowGuide(true)} 
              title="راهنمای بازی"
              className="pointer-events-auto w-8 h-8 bg-white/80 rounded-full flex items-center justify-center hover:bg-white transition-colors text-slate-800 shadow-sm backdrop-blur-sm active:scale-95"
            >
              ؟
            </button>
          </div>

          <GameEngine 
            onScoreUpdate={handleScoreUpdate}
            onGameOver={handleGameOver}
            onLevelUpdate={handleLevelUpdate}
            selectedDoctor={selectedDoctor}
            clinicAssets={clinic?.gameAssets}
            isPaused={showGuide}
          />
          
          {/* Game Over Modal */}
          {gameOver && (
            <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center p-6 text-center z-20 rounded-xl backdrop-blur-sm">
              <h2 className="text-3xl font-black text-white mb-2" dir="rtl">پایان بازی 🏁</h2>
              <p className="text-xl text-blue-300 font-bold mb-6" dir="rtl">امتیاز شما: {currentScore}</p>
              <Button size="lg" className="w-full rounded-full h-14 text-lg font-bold mb-3" onClick={() => navigate('../submit')}>
                ثبت رکورد
              </Button>
              <Button variant="outline" className="w-full rounded-full h-12 bg-white/10 text-white border-white/20 hover:bg-white/20 hover:text-white" onClick={() => window.location.reload()}>
                تلاش مجدد
              </Button>
            </div>
          )}

          {/* Guide Modal Overlay */}
          {showGuide && (
            <div className="absolute inset-0 z-30 bg-black/70 flex items-center justify-center p-4 backdrop-blur-sm rounded-xl">
              <div className="bg-[#FBF8F3] text-[#123B36] p-6 rounded-2xl w-full max-h-[85%] overflow-y-auto shadow-2xl relative" dir="rtl">
                <h2 className="text-xl font-black mb-4 text-center">راهنمای بازی 📋</h2>
                <div className="space-y-4 mb-6 text-sm font-medium">
                  <div className="flex gap-3 items-start">
                    <span className="text-xl w-6 text-center shrink-0">👆</span>
                    <p><strong>پرش:</strong> روی صفحه لمس کن تا از موانع زمینی بپری.</p>
                  </div>
                  <div className="flex gap-3 items-start">
                    <span className="text-xl w-6 text-center shrink-0">👇</span>
                    <p><strong>نشستن:</strong> انگشتت رو به پایین بکش تا از موانع هوایی رد بشی.</p>
                  </div>
                  <div className="flex gap-3 items-start">
                    <span className="text-xl w-6 text-center shrink-0">💉</span>
                    <p><strong>موانع زمینی:</strong> سرنگ، کپه قرص و شیشه دارو — برخورد مساوی باخت.</p>
                  </div>
                  <div className="flex gap-3 items-start">
                    <span className="text-xl w-6 text-center shrink-0">🦠</span>
                    <p><strong>مانع هوایی:</strong> ویروس — باید زیرش نشست.</p>
                  </div>
                  <div className="flex gap-3 items-start">
                    <span className="text-xl w-6 text-center shrink-0">🍎</span>
                    <p><strong>آیتم‌ها:</strong> سیب (+۵۰) و ویتامین C (+۱۰۰).</p>
                  </div>
                  <div className="flex gap-3 items-start">
                    <span className="text-xl w-6 text-center shrink-0">🛡️</span>
                    <p><strong>سپر قلب:</strong> یک برخورد رو بدون باخت دفع می‌کنی.</p>
                  </div>
                </div>
                <Button className="w-full h-12 text-lg font-bold bg-[#F0704A] hover:bg-[#d65f3a] text-white rounded-xl" onClick={() => setShowGuide(false)}>
                  متوجه شدم
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
