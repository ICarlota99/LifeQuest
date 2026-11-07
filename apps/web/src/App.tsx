import { Navigate, Route, Routes } from "react-router-dom";
import { AppShell } from "./components/AppShell";
import { authClient } from "./lib/auth-client";
import { AchievementsPage } from "./pages/AchievementsPage";
import { CampaignDetailPage } from "./pages/CampaignDetailPage";
import { CampaignsPage } from "./pages/CampaignsPage";
import { CharacterPage } from "./pages/CharacterPage";
import { CreateCharacterPage } from "./pages/CreateCharacterPage";
import { DashboardPage } from "./pages/DashboardPage";
import { InventoryPage } from "./pages/InventoryPage";
import { JournalPage } from "./pages/JournalPage";
import { LandingPage } from "./pages/LandingPage";
import { LoginPage } from "./pages/LoginPage";
import { RegisterPage } from "./pages/RegisterPage";
import { SettingsPage } from "./pages/SettingsPage";
import { StatsPage } from "./pages/StatsPage";

function Protected({ children }: { children: React.ReactNode }) {
  const { data: session, isPending } = authClient.useSession();
  if (isPending) {
    return (
      <div className="grid min-h-screen place-items-center font-display text-xl text-forest">
        Opening the guild hall…
      </div>
    );
  }
  if (!session) return <Navigate to="/login" replace />;
  return children;
}

export function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route
        path="/app"
        element={
          <Protected>
            <AppShell />
          </Protected>
        }
      >
        <Route index element={<DashboardPage />} />
        <Route path="character" element={<CharacterPage />} />
        <Route path="character/new" element={<CreateCharacterPage />} />
        <Route path="campaigns" element={<CampaignsPage />} />
        <Route path="campaigns/:id" element={<CampaignDetailPage />} />
        <Route path="inventory" element={<InventoryPage />} />
        <Route path="journal" element={<JournalPage />} />
        <Route path="achievements" element={<AchievementsPage />} />
        <Route path="stats" element={<StatsPage />} />
        <Route path="settings" element={<SettingsPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
