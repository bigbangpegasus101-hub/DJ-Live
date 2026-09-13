import { useState } from "react";
import "./App.css";

function App() {
  const [screen, setScreen] = useState("welcome");

  if (screen === "venueHome") {
    return (
      <main className="app">
        <section className="phone-shell venue-home-shell">
          <div className="glow glow-one"></div>
          <div className="glow glow-two"></div>

          <div className="venue-home-content">
            <div className="top-bar">
              <button
                className="back-button"
                onClick={() => setScreen("venues")}
              >
                ←
              </button>

              <div className="mini-brand">
                DJ LIVE <span>♕</span>
              </div>

              <button className="more-button">•••</button>
            </div>

            <div className="venue-live-header">
              <div>
                <p className="eyebrow">LIVE VENUE</p>
                <h2>Tipsys</h2>
                <p className="venue-subtext">
                  Good music. Better people.
                </p>
              </div>

              <span className="large-live-pill">LIVE</span>
            </div>

            <section className="now-playing-card">
              <div className="album-art">
                <div className="album-glow"></div>
                <span>♫</span>
              </div>

              <div className="now-playing-label">
                NOW PLAYING
              </div>

              <h3>Yeah!</h3>
              <p>Usher · Lil Jon · Ludacris</p>

              <div className="song-progress">
                <div className="song-progress-fill"></div>
              </div>

              <div className="song-time">
                <span>1:42</span>
                <span>4:10</span>
              </div>
            </section>

            <section className="crowd-section">
              <div className="section-heading-row">
                <div>
                  <p className="eyebrow">CROWD REACTION</p>
                  <h3>How's the track?</h3>
                </div>

                <div className="crowd-score">
                  92%
                </div>
              </div>

              <div className="reaction-grid">
                <button className="reaction-button">
                  <span>🔥</span>
                  <small>Fire</small>
                </button>

                <button className="reaction-button">
                  <span>👍</span>
                  <small>Good</small>
                </button>

                <button className="reaction-button">
                  <span>😐</span>
                  <small>Meh</small>
                </button>

                <button className="reaction-button">
                  <span>⏭</span>
                  <small>Skip</small>
                </button>
              </div>
            </section>

            <button
              className="request-song-button"
              onClick={() =>
                alert("Request Song screen coming next!")
              }
            >
              <div>
                <span className="request-icon">＋</span>
              </div>

              <div className="request-button-text">
                <strong>Request a Song</strong>
                <small>
                  Search music and send it to the DJ
                </small>
              </div>

              <span className="request-arrow">›</span>
            </button>

            <section className="quick-actions-section">
              <div className="section-heading-row">
                <h3>Tonight at Tipsys</h3>
                <button className="text-button">
                  View All
                </button>
              </div>

              <div className="quick-action-grid">
                <button className="quick-action-card">
                  <span>🏆</span>
                  <strong>Most Requested</strong>
                  <small>See what's hot tonight</small>
                </button>

                <button className="quick-action-card">
                  <span>💬</span>
                  <strong>Shoutout</strong>
                  <small>Send a message</small>
                </button>
              </div>
            </section>

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
              <p className="eyebrow">
                SCAN. REQUEST. VIBE.
              </p>
              <h2>Find Your Venue</h2>
              <p>
                Choose where you're partying tonight.
              </p>
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
              <span className="live-label">
                LIVE
              </span>
            </div>

            <div className="venue-list">
              <button
                className="venue-card active-venue"
                onClick={() =>
                  setScreen("venueHome")
                }
              >
                <div className="venue-image tipsys-image">
                  T
                </div>

                <div className="venue-info">
                  <div className="venue-name-row">
                    <h3>Tipsys</h3>
                    <span className="live-pill">
                      LIVE
                    </span>
                  </div>

                  <p>0.3 mi · Live Now</p>

                  <span className="venue-type">
                    Bar · Nightlife
                  </span>
                </div>

                <span className="venue-arrow">
                  ›
                </span>
              </button>

              <button className="venue-card">
                <div className="venue-image">
                  H
                </div>

                <div className="venue-info">
                  <h3>The Hideout</h3>
                  <p>1.4 mi</p>
                  <span className="venue-type">
                    Bar · Nightlife
                  </span>
                </div>

                <span className="venue-arrow">
                  ›
                </span>
              </button>

              <button className="venue-card">
                <div className="venue-image">
                  B
                </div>

                <div className="venue-info">
                  <h3>Bar 101</h3>
                  <p>2.1 mi</p>
                  <span className="venue-type">
                    Bar · Music
                  </span>
                </div>

                <span className="venue-arrow">
                  ›
                </span>
              </button>

              <button className="venue-card">
                <div className="venue-image">
                  R
                </div>

                <div className="venue-info">
                  <h3>Riverside Pub</h3>
                  <p>3.5 mi</p>
                  <span className="venue-type">
                    Pub · Nightlife
                  </span>
                </div>

                <span className="venue-arrow">
                  ›
                </span>
              </button>
            </div>

            <div className="venue-footer">
              <span className="footer-active">
                ⌂
              </span>
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
            <div className="dj-mark">
              DJ
            </div>
          </div>

          <div className="actions">
            <button
              className="primary-button"
              onClick={() =>
                setScreen("venues")
              }
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