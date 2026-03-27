import React from 'react';
import { useCampaign } from './useCampaign';
import { Shield, Sword, Heart, Scroll, Tv, UserCheck } from 'lucide-react';

function DMControl() {
  const { campaignData, gameState, updateGameState, rollDice } = useCampaign();

  const handleHpChange = (charId, delta) => {
    const newHp = { ...gameState.characterHp, [charId]: (gameState.characterHp[charId] || 0) + delta };
    updateGameState({ characterHp: newHp });
  };

  const activeScene = campaignData.scenes.find(s => s.id === gameState.currentSceneId);

  return (
    <div className="flex h-screen bg-dnd-dark overflow-auto">
      {/* Sidebar - Scenes */}
      <div className="w-64 bg-black p-4 border-r border-dnd-gold">
        <h2 className="text-dnd-gold font-bold flex items-center gap-2 mb-4">
          <Scroll size={20} /> Scenes
        </h2>
        {campaignData.scenes.map(scene => (
          <button
            key={scene.id}
            onClick={() => updateGameState({ currentSceneId: scene.id })}
            className={`w-full text-left p-2 rounded mb-2 transition-colors ${
              gameState.currentSceneId === scene.id ? 'bg-dnd-red text-white' : 'hover:bg-gray-800'
            }`}
          >
            {scene.title}
          </button>
        ))}
        
        <div className="mt-8">
          <button 
            onClick={() => window.open('/?mode=player', '_blank')}
            className="w-full dnd-button flex items-center justify-center gap-2"
          >
            <Tv size={20} /> Open TV View
          </button>
        </div>
      </div>

      {/* Main Panel */}
      <div className="flex-1 p-8">
        <header className="mb-8 flex justify-between items-center">
          <h1 className="text-4xl font-serif text-dnd-gold italic">{campaignData.campaignName}</h1>
          <div className="bg-gray-800 px-4 py-2 rounded-full flex items-center gap-2">
             <UserCheck size={18} className="text-green-500" /> DM Dashboard
          </div>
        </header>

        {/* Characters Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {campaignData.characters.map(char => (
            <div key={char.id} className="dnd-card">
              <div className="flex items-center gap-4 mb-4">
                <img src={char.image} alt={char.name} className="w-16 h-16 rounded-full border-2 border-dnd-gold" />
                <div>
                  <h3 className="font-bold text-xl text-dnd-gold">{char.name}</h3>
                  <p className="text-sm text-gray-400 italic">{char.class}</p>
                </div>
              </div>
              
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-2">
                  <Heart className="text-red-500" size={18} />
                  <span className="font-bold text-2xl">{gameState.characterHp[char.id]}</span>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => handleHpChange(char.id, -1)} className="w-8 h-8 rounded-full bg-red-900 border border-red-500 flex items-center justify-center">-</button>
                  <button onClick={() => handleHpChange(char.id, 1)} className="w-8 h-8 rounded-full bg-green-900 border border-green-500 flex items-center justify-center">+</button>
                </div>
              </div>

              <div className="space-y-2">
                {char.actions.map(action => (
                  <button
                    key={action.name}
                    onClick={() => rollDice(action.bonus, `${char.name}: ${action.name}`)}
                    className="w-full text-left p-2 bg-gray-800 hover:bg-gray-700 rounded text-sm border border-transparent hover:border-dnd-gold transition-all"
                  >
                    <Sword size={14} className="inline mr-2" /> {action.name} (+{action.bonus})
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Current Scene Context */}
        <div className="parchment p-6 rounded-lg shadow-xl mb-8">
          <h2 className="text-2xl font-serif font-bold mb-2 border-b border-gray-300 pb-2">{activeScene?.title}</h2>
          <p className="text-lg leading-relaxed">{activeScene?.description}</p>
        </div>
      </div>
    </div>
  );
}

function PlayerView() {
  const { campaignData, gameState } = useCampaign();
  const activeScene = campaignData.scenes.find(s => s.id === gameState.currentSceneId);
  const [showRoll, setShowRoll] = React.useState(false);

  React.useEffect(() => {
    if (gameState.lastRoll) {
      setShowRoll(true);
      const timer = setTimeout(() => setShowRoll(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [gameState.lastRoll]);

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-black">
      {/* Background Image with Transition */}
      <div 
        key={activeScene?.id}
        className="absolute inset-0 bg-cover bg-center transition-opacity duration-1000"
        style={{ backgroundImage: `url(${activeScene?.image})` }}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black opacity-60" />

      {/* Narrative Toast */}
      <div className="absolute top-12 left-0 right-0 flex justify-center px-12">
        <div className="bg-black/80 border-2 border-dnd-gold p-6 rounded-lg shadow-2xl max-w-2xl text-center">
          <h2 className="text-4xl font-serif text-dnd-gold mb-2">{activeScene?.title}</h2>
        </div>
      </div>

      {/* Dice Roll Overlay */}
      {showRoll && gameState.lastRoll && (
        <div className="absolute inset-0 flex items-center justify-center z-50 pointer-events-none animate-in fade-in zoom-in duration-300">
          <div className="bg-black/90 border-4 border-dnd-gold p-12 rounded-3xl text-center shadow-[0_0_50px_rgba(212,175,55,0.5)]">
            <p className="text-2xl text-gray-400 mb-2 uppercase tracking-widest">{gameState.lastRoll.label}</p>
            <div className="text-9xl font-bold text-white mb-4 animate-bounce">
              {gameState.lastRoll.total}
            </div>
            <div className="text-3xl text-dnd-gold">
              d20({gameState.lastRoll.d20}) + {gameState.lastRoll.bonus}
            </div>
            {gameState.lastRoll.d20 === 20 && (
              <div className="mt-4 text-4xl font-bold text-yellow-400 animate-pulse uppercase">Critical Hit!</div>
            )}
            {gameState.lastRoll.d20 === 1 && (
              <div className="mt-4 text-4xl font-bold text-red-500 animate-pulse uppercase">Critical Failure!</div>
            )}
          </div>
        </div>
      )}

      {/* Hero Bar */}
      <div className="absolute bottom-0 left-0 right-0 p-8 flex justify-center gap-12 bg-gradient-to-t from-black to-transparent">
        {campaignData.characters.map(char => (
          <div key={char.id} className="text-center">
            <div className={`relative mb-2 transition-transform ${gameState.characterHp[char.id] <= 0 ? 'grayscale scale-90' : 'scale-110'}`}>
              <img src={char.image} alt={char.name} className="w-24 h-24 rounded-full border-4 border-dnd-gold shadow-2xl" />
              {gameState.characterHp[char.id] <= 0 && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-full">
                  <span className="text-white font-bold text-xs uppercase tracking-tighter">BONKED</span>
                </div>
              )}
            </div>
            <p className="text-white font-bold text-lg">{char.name}</p>
            <div className="w-24 h-3 bg-gray-800 rounded-full border border-gray-600 overflow-hidden mx-auto">
              <div 
                className={`h-full transition-all duration-500 ${
                  (gameState.characterHp[char.id] / char.maxHp) < 0.3 ? 'bg-red-500' : 'bg-green-500'
                }`}
                style={{ width: `${Math.max(0, (gameState.characterHp[char.id] / char.maxHp) * 100)}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function App() {
  const urlParams = new URLSearchParams(window.location.search);
  const mode = urlParams.get('mode');

  return (
    <div className="App">
      {mode === 'player' ? <PlayerView /> : <DMControl />}
    </div>
  );
}

export default App;
