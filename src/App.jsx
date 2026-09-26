import { useState } from "react";
import "./App.css";

const demoSongs = [
  {
    id: 1,
    title: "Yeah!",
    artist: "Usher ft. Lil Jon & Ludacris",
    album: "Confessions",
    color: "pink",
  },
  {
    id: 2,
    title: "Low",
    artist: "Flo Rida ft. T-Pain",
    album: "Mail on Sunday",
    color: "purple",
  },
  {
    id: 3,
    title: "Temperature",
    artist: "Sean Paul",
    album: "The Trinity",
    color: "blue",
  },
  {
    id: 4,
    title: "Party In The U.S.A.",
    artist: "Miley Cyrus",
    album: "The Time of Our Lives",
    color: "cyan",
  },
  {
    id: 5,
    title: "Timber",
    artist: "Pitbull ft. Kesha",
    album: "Global Warming",
    color: "orange",
  },
  {
    id: 6,
    title: "Just Dance",
    artist: "Lady Gaga ft. Colby O'Donis",
    album: "The Fame",
    color: "green",
  },
];

function App() {
  const [screen, setScreen] = useState("welcome");

  const [search, setSearch] = useState("");

  const [selectedSong, setSelectedSong] =
    useState(null);

  const [requestName, setRequestName] =
    useState("");

  const [requestMessage, setRequestMessage] =
    useState("");

  const [selectedReaction, setSelectedReaction] =
    useState(null);

  const [crowdVotes, setCrowdVotes] = useState({
    fire: 38,
    good: 17,
    meh: 3,
    skip: 1,
  });

  const filteredSongs = demoSongs.filter(
    (song) => {
      const query = search.toLowerCase();

      return (
        song.title.toLowerCase().includes(query) ||
        song.artist.toLowerCase().includes(query)
      );
    }
  );

  const totalVotes =
    crowdVotes.fire +
    crowdVotes.good +
    crowdVotes.meh +
    crowdVotes.skip;

  const crowdScore =
    totalVotes === 0
      ? 0
      : Math.round(
          ((crowdVotes.fire +
            crowdVotes.good) /
            totalVotes) *
            100
        );

  function selectSong(song) {
    setSelectedSong(song);
    setScreen("requestForm");
  }

  function submitRequest() {
    setScreen("requestSuccess");
  }

  function resetRequest() {
    setSelectedSong(null);
    setSearch("");
    setRequestName("");
    setRequestMessage("");
    setScreen("requestMusic");
  }

  function handleReaction(reaction) {
    if (selectedReaction === reaction) {
      return;
    }

    setCrowdVotes((currentVotes) => {
      const updatedVotes = {
        ...currentVotes,
      };

      if (selectedReaction) {
        updatedVotes[selectedReaction] = Math.max(
          0,
          updatedVotes[selectedReaction] - 1
        );
      }

      updatedVotes[reaction] =
        updatedVotes[reaction] + 1;

      return updatedVotes;
    });

    setSelectedReaction(reaction);
  }

  function reactionStyle(reaction) {
    if (selectedReaction !== reaction) {
      return {};
    }

    return {
      borderColor: "rgba(255, 49, 181, 0.9)",
      background:
        "linear-gradient(145deg, rgba(255, 28, 172, 0.20), rgba(80, 34, 180, 0.18))",
      boxShadow:
        "0 0 18px rgba(255, 49, 181, 0.20)",
      transform: "translateY(-2px)",
    };
  }

  if (screen === "requestSuccess") {
    return (
      <main className="app">
        <section className="phone-shell request-shell">
          <div className="glow glow-one"></div>
          <div className="glow glow-two"></div>

          <div className="success-content">
            <div className="mini-brand">
              DJ LIVE <span>♕</span>
            </div>

            <div className="success-icon">
              ✓
            </div>

            <p className="eyebrow">
              REQUEST SENT
            </p>

            <h2>You're in the queue.</h2>

            <p className="success-copy">
              Your request was sent to the DJ
              at Tipsys.
            </p>

            {selectedSong && (
              <div className="submitted-song">
                <div
                  className={`song-art ${selectedSong.color}`}
                >
                  ♫
                </div>

                <div>
                  <strong>
                    {selectedSong.title}
                  </strong>

                  <span>
                    {selectedSong.artist}
                  </span>
                </div>
              </div>
            )}

            <div className="success-note">
              <span>⚡</span>

              <p>
                Requests aren't guaranteed to
                play. The DJ controls the final
                queue.
              </p>
            </div>

            <button
              className="primary-button"
              onClick={resetRequest}
            >
              ＋ Request Another Song
            </button>

            <button
              className="secondary-button"
              onClick={() =>
                setScreen("venueHome")
              }
            >
              Back to Tipsys
            </button>
          </div>
        </section>
      </main>
    );
  }

  if (screen === "requestForm") {
    return (
      <main className="app">
        <section className="phone-shell request-shell">
          <div className="glow glow-one"></div>
          <div className="glow glow-two"></div>

          <div className="request-page-content">
            <div className="top-bar">
              <button
                className="back-button"
                onClick={() =>
                  setScreen("requestMusic")
                }
              >
                ←
              </button>

              <div className="mini-brand">
                DJ LIVE <span>♕</span>
              </div>

              <div className="top-spacer"></div>
            </div>

            <div className="request-page-heading">
              <p className="eyebrow">
                SONG REQUEST
              </p>

              <h2>Send It</h2>

              <p>
                This request will be sent to the
                DJ at Tipsys.
              </p>
            </div>

            {selectedSong && (
              <div className="selected-song-card">
                <div
                  className={`song-art large-song-art ${selectedSong.color}`}
                >
                  ♫
                </div>

                <div className="selected-song-info">
                  <span>
                    YOUR REQUEST
                  </span>

                  <h3>
                    {selectedSong.title}
                  </h3>

                  <p>
                    {selectedSong.artist}
                  </p>
                </div>
              </div>
            )}

            <div className="request-form">
              <label>
                Your Name
                <span>OPTIONAL</span>
              </label>

              <input
                type="text"
                placeholder="Who's requesting?"
                value={requestName}
                onChange={(event) =>
                  setRequestName(
                    event.target.value
                  )
                }
              />

              <label>
                Message to DJ
                <span>OPTIONAL</span>
              </label>

              <textarea
                placeholder="Birthday, shoutout, please play this next..."
                maxLength="120"
                value={requestMessage}
                onChange={(event) =>
                  setRequestMessage(
                    event.target.value
                  )
                }
              />

              <div className="character-count">
                {requestMessage.length}/120
              </div>

              <label className="save-song-row">
                <input type="checkbox" />

                <div>
                  <strong>
                    Save this song
                  </strong>

                  <small>
                    Add it to your favorites
                    when signed in.
                  </small>
                </div>
              </label>
            </div>

            <div className="request-warning">
              <span>♫</span>

              <p>
                Sending a request doesn't
                guarantee it will be played.
                Your DJ controls the vibe.
              </p>
            </div>

            <button
              className="send-request-button"
              onClick={submitRequest}
            >
              ⚡ Send Request
            </button>
          </div>
        </section>
      </main>
    );
  }

  if (screen === "requestMusic") {
    return (
      <main className="app">
        <section className="phone-shell request-shell">
          <div className="glow glow-one"></div>
          <div className="glow glow-two"></div>

          <div className="request-page-content">
            <div className="top-bar">
              <button
                className="back-button"
                onClick={() =>
                  setScreen("venueHome")
                }
              >
                ←
              </button>

              <div className="mini-brand">
                DJ LIVE <span>♕</span>
              </div>

              <div className="top-spacer"></div>
            </div>

            <div className="request-page-heading">
              <p className="eyebrow">
                TIPSYS · LIVE
              </p>

              <h2>Request Music</h2>

              <p>
                Search for the song you want
                to hear tonight.
              </p>
            </div>

            <div className="music-search">
              <span>⌕</span>

              <input
                type="text"
                placeholder="Song or artist..."
                value={search}
                onChange={(event) =>
                  setSearch(
                    event.target.value
                  )
                }
                autoFocus
              />

              {search && (
                <button
                  onClick={() =>
                    setSearch("")
                  }
                >
                  ×
                </button>
              )}
            </div>

            <div className="music-source-tabs">
              <button className="source-active">
                All
              </button>

              <button>
                Popular
              </button>

              <button>
                Tonight
              </button>
            </div>

            <div className="song-results-header">
              <span>
                {search
                  ? "SEARCH RESULTS"
                  : "POPULAR TONIGHT"}
              </span>

              <span>
                {filteredSongs.length} SONGS
              </span>
            </div>

            <div className="song-results">
              {filteredSongs.length > 0 ? (
                filteredSongs.map(
                  (song) => (
                    <button
                      className="song-result"
                      key={song.id}
                      onClick={() =>
                        selectSong(song)
                      }
                    >
                      <div
                        className={`song-art ${song.color}`}
                      >
                        ♫
                      </div>

                      <div className="song-result-info">
                        <strong>
                          {song.title}
                        </strong>

                        <span>
                          {song.artist}
                        </span>

                        <small>
                          {song.album}
                        </small>
                      </div>

                      <div className="add-song-button">
                        ＋
                      </div>
                    </button>
                  )
                )
              ) : (
                <div className="no-results">
                  <span>⌕</span>

                  <h3>
                    No songs found
                  </h3>

                  <p>
                    Try another song title
                    or artist.
                  </p>
                </div>
              )}
            </div>

            <div className="venue-footer">
              <button
                onClick={() =>
                  setScreen("venueHome")
                }
              >
                ⌂
              </button>

              <button className="footer-active">
                ⌕
              </button>

              <button>♫</button>
              <button>☰</button>
            </div>
          </div>
        </section>
      </main>
    );
  }

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
                onClick={() =>
                  setScreen("venues")
                }
              >
                ←
              </button>

              <div className="mini-brand">
                DJ LIVE <span>♕</span>
              </div>

              <button className="more-button">
                •••
              </button>
            </div>

            <div className="venue-live-header">
              <div>
                <p className="eyebrow">
                  LIVE VENUE
                </p>

                <h2>Tipsys</h2>

                <p className="venue-subtext">
                  Good music. Better people.
                </p>
              </div>

              <span className="large-live-pill">
                LIVE
              </span>
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

              <p>
                Usher · Lil Jon · Ludacris
              </p>

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
                  <p className="eyebrow">
                    CROWD REACTION
                  </p>

                  <h3>
                    How's the track?
                  </h3>
                </div>

                <div className="crowd-score">
                  {crowdScore}%
                </div>
              </div>

              <div className="reaction-grid">
                <button
                  className="reaction-button"
                  style={reactionStyle("fire")}
                  onClick={() =>
                    handleReaction("fire")
                  }
                >
                  <span>🔥</span>

                  <small>
                    Fire · {crowdVotes.fire}
                  </small>
                </button>

                <button
                  className="reaction-button"
                  style={reactionStyle("good")}
                  onClick={() =>
                    handleReaction("good")
                  }
                >
                  <span>👍</span>

                  <small>
                    Good · {crowdVotes.good}
                  </small>
                </button>

                <button
                  className="reaction-button"
                  style={reactionStyle("meh")}
                  onClick={() =>
                    handleReaction("meh")
                  }
                >
                  <span>😐</span>

                  <small>
                    Meh · {crowdVotes.meh}
                  </small>
                </button>

                <button
                  className="reaction-button"
                  style={reactionStyle("skip")}
                  onClick={() =>
                    handleReaction("skip")
                  }
                >
                  <span>⏭</span>

                  <small>
                    Skip · {crowdVotes.skip}
                  </small>
                </button>
              </div>
            </section>

            <button
              className="request-song-button"
              onClick={() =>
                setScreen("requestMusic")
              }
            >
              <div>
                <span className="request-icon">
                  ＋
                </span>
              </div>

              <div className="request-button-text">
                <strong>
                  Request a Song
                </strong>

                <small>
                  Search music and send it
                  to the DJ
                </small>
              </div>

              <span className="request-arrow">
                ›
              </span>
            </button>

            <section className="quick-actions-section">
              <div className="section-heading-row">
                <h3>
                  Tonight at Tipsys
                </h3>

                <button className="text-button">
                  View All
                </button>
              </div>

              <div className="quick-action-grid">
                <button className="quick-action-card">
                  <span>🏆</span>

                  <strong>
                    Most Requested
                  </strong>

                  <small>
                    See what's hot tonight
                  </small>
                </button>

                <button className="quick-action-card">
                  <span>💬</span>

                  <strong>
                    Shoutout
                  </strong>

                  <small>
                    Send a message
                  </small>
                </button>
              </div>
            </section>

            <div className="venue-footer">
              <button className="footer-active">
                ⌂
              </button>

              <button
                onClick={() =>
                  setScreen("requestMusic")
                }
              >
                ⌕
              </button>

              <button>♫</button>
              <button>☰</button>
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
                onClick={() =>
                  setScreen("welcome")
                }
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

              <h2>
                Find Your Venue
              </h2>

              <p>
                Choose where you're partying
                tonight.
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
              <span>
                Nearby Venues
              </span>

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
                    <h3>
                      Tipsys
                    </h3>

                    <span className="live-pill">
                      LIVE
                    </span>
                  </div>

                  <p>
                    0.3 mi · Live Now
                  </p>

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
                  <h3>
                    The Hideout
                  </h3>

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
                  <h3>
                    Bar 101
                  </h3>

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
                  <h3>
                    Riverside Pub
                  </h3>

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
              <button className="footer-active">
                ⌂
              </button>

              <button>⌕</button>
              <button>♫</button>
              <button>☰</button>
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
            <h1>
              DJ LIVE
            </h1>

            <span className="crown">
              ♕
            </span>
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
            No account required. Just good
            music.
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