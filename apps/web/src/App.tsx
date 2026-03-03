import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Header } from "./components/Header";
import { Footer } from "./components/Footer";
import { CookieConsent } from "./components/CookieConsent";
import { Home } from "./routes/Home";
import { Browse } from "./routes/Browse";
import { Detail } from "./routes/Detail";
import { Privacy } from "./routes/Privacy";
import { Impressum } from "./routes/Impressum";

const isEmbed = new URLSearchParams(window.location.search).has("embed");

export function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen flex flex-col">
        {!isEmbed && <Header />}
        <main className="flex-grow">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/impressum" element={<Impressum />} />
            <Route path="/:type" element={<Browse />} />
            <Route path="/:type/:slug" element={<Detail />} />
          </Routes>
        </main>
        {!isEmbed && <Footer />}
        {!isEmbed && <CookieConsent />}
      </div>
    </BrowserRouter>
  );
}
