import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Layout } from './components/ui/Layout';
import { Home } from './pages/Home';
import { CharacterCreate } from './pages/CharacterCreate';
import { CharacterSheet } from './pages/CharacterSheet';
import { SoloPlay } from './pages/SoloPlay';
import { Lobby } from './pages/Lobby';
import { GameSession } from './pages/GameSession';
import { Auth } from './pages/Auth';
import { Campaigns } from './pages/Campaigns';
import { CampaignDetail } from './pages/CampaignDetail';
import { useAuthInit } from './hooks/useAuth';

export function App() {
  // Hydrate auth state from localStorage on startup
  useAuthInit();

  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/create" element={<CharacterCreate />} />
          <Route path="/characters/:id" element={<CharacterSheetRoute />} />
          <Route path="/characters" element={<CharacterSheet />} />
          <Route path="/solo" element={<SoloPlay />} />
          <Route path="/lobby" element={<Lobby />} />
          <Route path="/session/:id" element={<GameSessionRoute />} />
          <Route path="/campaigns" element={<Campaigns />} />
          <Route path="/campaigns/:id" element={<CampaignDetailRoute />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}

function CharacterSheetRoute() {
  const path = window.location.pathname;
  const id = path.split('/characters/')[1];
  return <CharacterSheet characterId={id} />;
}

function GameSessionRoute() {
  const path = window.location.pathname;
  const id = path.split('/session/')[1];
  return <GameSession sessionId={id} />;
}

function CampaignDetailRoute() {
  const path = window.location.pathname;
  const id = path.split('/campaigns/')[1];
  return <CampaignDetail campaignId={id} />;
}
