import "./App.css";

function App() {
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

          <p className="tagline">GOOD MUSIC. BETTER PEOPLE.</p>

          <div className="hero">
            <div className="dj-mark">DJ</div>
          </div>

          <div className="actions">
            <button className="primary-button">
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