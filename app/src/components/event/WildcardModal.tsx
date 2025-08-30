// src/components/event/WildcardModal.tsx
import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { getWildcardIntensityInfo } from "@/utils/wildcardUtils";

interface WildcardModalProps {
  isOpen: boolean;
  roundNum: number;
  intensity: 'mild' | 'medium' | 'mayhem';
  courtChanges: Array<{
    courtNum: number;
    from: string[];
    to: string[];
  }>;
  onComplete: () => void;
}

export default function WildcardModal({
  isOpen,
  roundNum,
  intensity,
  courtChanges,
  onComplete
}: WildcardModalProps) {
  const [stage, setStage] = useState<'announcement' | 'shuffling' | 'reveal'>('announcement');
  const [visibleChanges, setVisibleChanges] = useState(0);
  
  const intensityInfo = getWildcardIntensityInfo(intensity);

  useEffect(() => {
    if (!isOpen) {
      setStage('announcement');
      setVisibleChanges(0);
      return;
    }

    const timer1 = setTimeout(() => setStage('shuffling'), 2000);
    const timer2 = setTimeout(() => setStage('reveal'), 4000);
    const timer3 = setTimeout(() => {
      // Reveal changes one by one
      const revealChanges = (index: number) => {
        if (index < courtChanges.length) {
          setVisibleChanges(index + 1);
          setTimeout(() => revealChanges(index + 1), 300);
        } else {
          // Complete after all changes are shown
          setTimeout(onComplete, 2000);
        }
      };
      revealChanges(0);
    }, 5000);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  }, [isOpen, courtChanges.length, onComplete]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
      <Card className="w-full max-w-2xl mx-4 p-8 text-center relative overflow-hidden">
        {/* Background Animation */}
        <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 via-pink-500/10 to-yellow-500/10 animate-pulse"></div>
        
        {/* Content */}
        <div className="relative z-10">
          {stage === 'announcement' && (
            <div className="space-y-6 animate-bounce-in">
              <div className="text-8xl animate-spin-slow">🎲</div>
              <div className="space-y-3">
                <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 via-pink-600 to-yellow-600 bg-clip-text text-transparent">
                  WILDCARD ROUND!
                </h1>
                <p className="text-xl text-gray-600">
                  Round {roundNum} is about to get chaotic!
                </p>
                <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full ${intensityInfo.bgColor} ${intensityInfo.borderColor} border-2`}>
                  <span className="text-2xl">{intensityInfo.emoji}</span>
                  <span className={`font-semibold ${intensityInfo.color}`}>
                    {intensityInfo.name}
                  </span>
                </div>
              </div>
            </div>
          )}

          {stage === 'shuffling' && (
            <div className="space-y-6 animate-scale-in">
              <div className="relative">
                <div className="text-6xl animate-spin">{intensityInfo.emoji}</div>
                <div className="absolute inset-0 text-6xl animate-ping opacity-20">🌟</div>
              </div>
              <div className="space-y-3">
                <h2 className="text-3xl font-bold text-purple-600 animate-pulse">
                  SHUFFLING COURTS...
                </h2>
                <p className="text-lg text-gray-600">
                  {intensityInfo.description}
                </p>
                {/* Loading bars */}
                <div className="space-y-2 mt-6">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full animate-slide-right"
                        style={{ animationDelay: `${i * 0.3}s` }}
                      ></div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {stage === 'reveal' && (
            <div className="space-y-6 animate-slide-in-bottom">
              <div className="text-5xl">🎊</div>
              <h2 className="text-2xl font-bold text-green-600">
                New Court Assignments!
              </h2>
              
              <div className="max-h-60 overflow-y-auto space-y-3">
                {courtChanges.slice(0, visibleChanges).map((change, index) => (
                  <div 
                    key={change.courtNum}
                    className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-4 animate-slide-in-left"
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    <h4 className="font-semibold text-blue-700 mb-2">
                      Court {change.courtNum}
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                      <div>
                        <p className="text-gray-500 mb-1">Previous:</p>
                        <div className="text-gray-700">
                          {change.from.join(' & ')}
                        </div>
                      </div>
                      <div>
                        <p className="text-purple-600 mb-1 font-medium">New:</p>
                        <div className="text-purple-700 font-medium">
                          {change.to.join(' & ')}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {visibleChanges === courtChanges.length && (
                <div className="mt-6 animate-bounce-in">
                  <p className="text-lg font-semibold text-green-600">
                    Get ready for chaos! Good luck! 🍀
                  </p>
                  <div className="mt-4 text-sm text-gray-500">
                    Closing automatically...
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Floating particles */}
        <div className="absolute inset-0 pointer-events-none">
          {[...Array(12)].map((_, i) => (
            <div
              key={i}
              className="absolute w-2 h-2 bg-yellow-400 rounded-full animate-float"
              style={{
                left: `${10 + (i * 7)}%`,
                top: `${20 + (i % 3) * 30}%`,
                animationDelay: `${i * 0.5}s`,
                animationDuration: `${3 + (i % 3)}s`
              }}
            />
          ))}
        </div>
      </Card>
    </div>
  );
}

// Additional CSS animations to add to your global styles
const additionalAnimations = `
@keyframes spin-slow {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
  animation-duration: 3s;
}

@keyframes bounce-in {
  0% { transform: scale(0.3) translateY(-100px); opacity: 0; }
  50% { transform: scale(1.05) translateY(0); }
  70% { transform: scale(0.9); }
  100% { transform: scale(1); opacity: 1; }
}

@keyframes scale-in {
  from { transform: scale(0); opacity: 0; }
  to { transform: scale(1); opacity: 1; }
}

@keyframes slide-right {
  from { transform: translateX(-100%); }
  to { transform: translateX(0); }
}

@keyframes slide-in-bottom {
  from { transform: translateY(100px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}

@keyframes slide-in-left {
  from { transform: translateX(-50px); opacity: 0; }
  to { transform: translateX(0); opacity: 1; }
}

@keyframes float {
  0%, 100% { transform: translateY(0px) rotate(0deg); }
  50% { transform: translateY(-20px) rotate(180deg); }
}

@keyframes fade-in {
  from { opacity: 0; }
  to { opacity: 1; }
}
`;

export { additionalAnimations };
