import { useState } from "react";
import "./App.css";

function App() {
  const [screen, setScreen] = useState("welcome");

  if (screen === "venues") {
    return (
      <main className="app">
        <section className="phone-shell venue-shell">
          <div className="glow glow-one"></div>
          <div className="glow glow-two"></div>

          <div className="venue-content">
            <div className="top-bar">
              <button
                className="back-button"
                onClick={() => setScreen("welcome")}
              >
                ←
              </button>

              <div className="mini-brand">
                DJ LIVE <span>♕</span>
              </div>

              <div className="top-spacer"></div>
            </div>

            <div className="venue-heading">
              <p className="eyebrow">SCAN. REQUEST. VIBE.</p>
              <h2>Find Your Venue</h2>
              <p>Choose where you're partying tonight.</p>
            </div>

            <div className="search-box">
              <span>⌕</span>
              <input
                type="text"
                placeholder="Search venue or city..."
              />
            </div>

            <div className="section-title">
              <span>Nearby Venues</span>
              <span className="live-label">LIVE</span>
            </div>

            <div className="venue-list">
              <button
                className="venue-card active-venue"
                onClick={() => alert("Tipsys selected!")}
              >
                <div className="venue-image tipsys-image">
                  T
                </div>

                <div className="venue-info">
                  <div className="venue-name-row">
                    <h3>Tipsys</h3>
                    <span className="live-pill">LIVE</span>
                  </div>

                  <p>0.3 mi · Live Now</p>
                  <span className="venue-type">
                    Bar · Nightlife
                  </span>
                </div>

                <span className="venue-arrow">›</span>
              </button>

              <button className="venue-card">
                <div className="venue-image">H</div>

                <div className="venue-info">
                  <h3>The Hideout</h3>
                  <p>1.4 mi</p>
                  <span className="venue-type">
                    Bar · Nightlife
                  </span>
                </div>

                <span className="venue-arrow">›</span>
              </button>

              <button className="venue-card">
                <div className="venue-image">B</div>

                <div className="venue-info">
                  <h3>Bar 101</h3>
                  <p>2.1 mi</p>
                  <span className="venue-type">
                    Bar · Music
                  </span>
                </div>

                <span className="venue-arrow">›</span>
              </button>

              <button className="venue-card">
                <div className="venue-image">R</div>

                <div className="venue-info">
                  <h3>Riverside Pub</h3>
                  <p>3.5 mi</p>
                  <span className="venue-type">
                    Pub · Nightlife
                  </span>
                </div>

                <span className="venue-arrow">›</span>
              </button>
            </div>

            <div className="venue-footer">
              <span className="footer-active">⌂</span>
              <span>⌕</span>
              <span>♫</span>
              <span>☰</span>
            </div>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="app">
      <section className="phone-shell">
        <div className="glow glow-one"></div>
        <div className="glow glow-two"></div>

        <div className="welcome-content">
          <div className="brand">
            <h1>DJ LIVE</h1>
            <span className="crown">♕</span>
          </div>

          <p className="tagline">
            GOOD MUSIC. BETTER PEOPLE.
          </p>

          <div className="hero">
            <div className="dj-mark">DJ</div>
          </div>

          <div className="actions">
            <button
              className="primary-button"
              onClick={() => setScreen("venues")}
            >
              ⚡ Continue as Guest
            </button>

            <button className="secondary-button">
              ♙ Sign In / Create Account
            </button>
          </div>

          <p className="no-account">
            No account required. Just good music.
          </p>

          <button className="install-button">
            ⇧ Add to Home Screen
          </button>
        </div>
      </section>
    </main>
  );
}

export default App;