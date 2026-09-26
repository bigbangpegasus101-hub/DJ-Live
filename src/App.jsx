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
  const [selectedSong, setSelectedSong] = useState(null);
  const [requestName, setRequestName] = useState("");
  const [requestMessage, setRequestMessage] = useState("");

  const [selectedReaction, setSelectedReaction] =
    useState(null);

  const [crowdVotes, setCrowdVotes] = useState({
    fire: 38,
    good: 17,
    meh: 3,
    skip: 1,
  });

  const [requests, setRequests] = useState([]);

  const filteredSongs = demoSongs.filter((song) => {
    const query = search.trim().toLowerCase();

    return (
      song.title.toLowerCase().includes(query) ||
      song.artist.toLowerCase().includes(query)
    );
  });

  const totalVotes =
    crowdVotes.fire +
    crowdVotes.good +
    crowdVotes.meh +
    crowdVotes.skip;

  const crowdScore =
    totalVotes === 0
      ? 0
      : Math.round(
          ((crowdVotes.fire + crowdVotes.good) /
            totalVotes) *
            100
        );

  const totalRequests = requests.length;

  const pendingRequests = requests.filter(
    (request) => request.status === "pending"
  );

  const approvedRequests = requests.filter(
    (request) => request.status === "approved"
  );

  const declinedRequests = requests.filter(
    (request) => request.status === "declined"
  );

  const requestRanking = demoSongs
    .map((song) => {
      const songRequests = requests.filter(
        (request) => request.song.id === song.id
      );

      return {
        song,
        count: songRequests.length,
      };
    })
    .sort((a, b) => {
      if (b.count !== a.count) {
        return b.count - a.count;
      }

      return a.song.title.localeCompare(b.song.title);
    });

  function selectSong(song) {
    setSelectedSong(song);
    setScreen("requestForm");
  }

  function submitRequest() {
    if (!selectedSong) {
      return;
    }

    const newRequest = {
      id: Date.now() + Math.random(),
      song: selectedSong,
      name: requestName.trim() || "Guest",
      message: requestMessage.trim(),
      submittedAt: new Date().toISOString(),
      status: "pending",
    };

    setRequests((currentRequests) => [
      ...currentRequests,
      newRequest,
    ]);

    setScreen("requestSuccess");
  }

  function resetRequest() {
    setSelectedSong(null);
    setSearch("");
    setRequestName("");
    setRequestMessage("");
    setScreen("requestMusic");
  }

  function returnHome() {
    setSelectedSong(null);
    setSearch("");
    setRequestName("");
    setRequestMessage("");
    setScreen("venueHome");
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

  function getRankIcon(index) {
    if (index === 0) return "🥇";
    if (index === 1) return "🥈";
    if (index === 2) return "🥉";

    return `#${index + 1}`;
  }

  function updateRequestStatus(requestId, newStatus) {
    setRequests((currentRequests) =>
      currentRequests.map((request) =>
        request.id === requestId
          ? {
              ...request,
              status: newStatus,
            }
          : request
      )
    );
  }

  function statusColor(status) {
    if (status === "approved") {
      return "#58e5bf";
    }

    if (status === "declined") {
      return "#ff657d";
    }

    return "#ff47bf";
  }

  function formatRequestTime(timestamp) {
    const date = new Date(timestamp);

    return date.toLocaleTimeString([], {
      hour: "numeric",
      minute: "2-digit",
    });
  }

  /*
    =========================
    DJ DASHBOARD
    =========================
  */

  if (screen === "djDashboard") {
    return (
      <main
        className="app"
        style={{
          alignItems: "flex-start",
        }}
      >
        <section
          style={{
            position: "relative",
            overflow: "hidden",
            width: "min(1100px, 100%)",
            minHeight: "760px",
            padding: "24px",
            border:
              "1px solid rgba(255, 42, 184, 0.40)",
            borderRadius: "24px",
            background:
              "linear-gradient(180deg, rgba(15,8,28,0.98), rgba(3,7,16,0.98))",
            boxShadow:
              "0 0 35px rgba(255,0,170,0.10)",
          }}
        >
          <div className="glow glow-one"></div>
          <div className="glow glow-two"></div>

          <div
            style={{
              position: "relative",
              zIndex: 2,
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "20px",
                flexWrap: "wrap",
                marginBottom: "26px",
              }}
            >
              <div>
                <div
                  className="mini-brand"
                  style={{
                    textAlign: "left",
                  }}
                >
                  DJ LIVE <span>♕</span>
                </div>

                <p
                  style={{
                    margin: "6px 0 0",
                    color: "#747d91",
                    fontSize: "11px",
                  }}
                >
                  DJ Dashboard · Tipsys
                </p>
              </div>

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                }}
              >
                <span className="large-live-pill">
                  LIVE
                </span>

                <button
                  className="secondary-button"
                  style={{
                    width: "auto",
                    padding: "10px 15px",
                  }}
                  onClick={() =>
                    setScreen("venueHome")
                  }
                >
                  Customer View
                </button>
              </div>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "repeat(auto-fit, minmax(150px, 1fr))",
                gap: "10px",
                marginBottom: "24px",
              }}
            >
              <div
                style={{
                  padding: "16px",
                  border:
                    "1px solid rgba(255,255,255,0.08)",
                  borderRadius: "14px",
                  background: "rgba(10,14,25,0.94)",
                }}
              >
                <div
                  style={{
                    color: "#ff47bf",
                    fontSize: "26px",
                    fontWeight: 900,
                  }}
                >
                  {pendingRequests.length}
                </div>

                <div
                  style={{
                    marginTop: "4px",
                    color: "#737c91",
                    fontSize: "9px",
                    fontWeight: 800,
                    letterSpacing: "1px",
                  }}
                >
                  PENDING
                </div>
              </div>

              <div
                style={{
                  padding: "16px",
                  border:
                    "1px solid rgba(255,255,255,0.08)",
                  borderRadius: "14px",
                  background: "rgba(10,14,25,0.94)",
                }}
              >
                <div
                  style={{
                    color: "#58e5bf",
                    fontSize: "26px",
                    fontWeight: 900,
                  }}
                >
                  {approvedRequests.length}
                </div>

                <div
                  style={{
                    marginTop: "4px",
                    color: "#737c91",
                    fontSize: "9px",
                    fontWeight: 800,
                    letterSpacing: "1px",
                  }}
                >
                  APPROVED
                </div>
              </div>

              <div
                style={{
                  padding: "16px",
                  border:
                    "1px solid rgba(255,255,255,0.08)",
                  borderRadius: "14px",
                  background: "rgba(10,14,25,0.94)",
                }}
              >
                <div
                  style={{
                    color: "#ff657d",
                    fontSize: "26px",
                    fontWeight: 900,
                  }}
                >
                  {declinedRequests.length}
                </div>

                <div
                  style={{
                    marginTop: "4px",
                    color: "#737c91",
                    fontSize: "9px",
                    fontWeight: 800,
                    letterSpacing: "1px",
                  }}
                >
                  DECLINED
                </div>
              </div>

              <div
                style={{
                  padding: "16px",
                  border:
                    "1px solid rgba(255,255,255,0.08)",
                  borderRadius: "14px",
                  background: "rgba(10,14,25,0.94)",
                }}
              >
                <div
                  style={{
                    color: "#dce0ea",
                    fontSize: "26px",
                    fontWeight: 900,
                  }}
                >
                  {totalRequests}
                </div>

                <div
                  style={{
                    marginTop: "4px",
                    color: "#737c91",
                    fontSize: "9px",
                    fontWeight: 800,
                    letterSpacing: "1px",
                  }}
                >
                  TOTAL TONIGHT
                </div>
              </div>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "minmax(0, 1.6fr) minmax(260px, 0.8fr)",
                gap: "18px",
              }}
            >
              <section
                style={{
                  minWidth: 0,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginBottom: "12px",
                  }}
                >
                  <div>
                    <p className="eyebrow">
                      LIVE REQUESTS
                    </p>

                    <h2
                      style={{
                        margin: 0,
                        fontSize: "22px",
                      }}
                    >
                      Incoming Requests
                    </h2>
                  </div>

                  <span
                    style={{
                      color: "#747d91",
                      fontSize: "9px",
                    }}
                  >
                    {pendingRequests.length} waiting
                  </span>
                </div>

                {pendingRequests.length === 0 ? (
                  <div
                    style={{
                      padding: "50px 20px",
                      border:
                        "1px solid rgba(255,255,255,0.07)",
                      borderRadius: "16px",
                      background:
                        "rgba(10,14,25,0.75)",
                      textAlign: "center",
                    }}
                  >
                    <div
                      style={{
                        fontSize: "34px",
                      }}
                    >
                      🎧
                    </div>

                    <h3
                      style={{
                        margin: "12px 0 5px",
                        fontSize: "15px",
                      }}
                    >
                      Queue is clear
                    </h3>

                    <p
                      style={{
                        margin: 0,
                        color: "#747d91",
                        fontSize: "10px",
                      }}
                    >
                      New customer requests will
                      appear here.
                    </p>
                  </div>
                ) : (
                  <div
                    style={{
                      display: "grid",
                      gap: "10px",
                    }}
                  >
                    {pendingRequests
                      .slice()
                      .reverse()
                      .map((request) => (
                        <div
                          key={request.id}
                          style={{
                            display: "grid",
                            gridTemplateColumns:
                              "58px minmax(0,1fr)",
                            gap: "12px",
                            padding: "13px",
                            border:
                              "1px solid rgba(255,47,183,0.20)",
                            borderRadius: "15px",
                            background:
                              "linear-gradient(90deg, rgba(255,24,172,0.06), rgba(10,14,25,0.96))",
                          }}
                        >
                          <div
                            className={`song-art ${request.song.color}`}
                            style={{
                              width: "58px",
                              height: "58px",
                            }}
                          >
                            ♫
                          </div>

                          <div
                            style={{
                              minWidth: 0,
                            }}
                          >
                            <div
                              style={{
                                display: "flex",
                                justifyContent:
                                  "space-between",
                                gap: "10px",
                              }}
                            >
                              <div
                                style={{
                                  minWidth: 0,
                                }}
                              >
                                <strong
                                  style={{
                                    display: "block",
                                    overflow: "hidden",
                                    textOverflow:
                                      "ellipsis",
                                    whiteSpace: "nowrap",
                                    fontSize: "13px",
                                  }}
                                >
                                  {request.song.title}
                                </strong>

                                <span
                                  style={{
                                    display: "block",
                                    overflow: "hidden",
                                    textOverflow:
                                      "ellipsis",
                                    whiteSpace: "nowrap",
                                    marginTop: "3px",
                                    color: "#8992a6",
                                    fontSize: "9px",
                                  }}
                                >
                                  {request.song.artist}
                                </span>
                              </div>

                              <span
                                style={{
                                  flexShrink: 0,
                                  color: "#626c80",
                                  fontSize: "8px",
                                }}
                              >
                                {formatRequestTime(
                                  request.submittedAt
                                )}
                              </span>
                            </div>

                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "7px",
                                marginTop: "9px",
                              }}
                            >
                              <span
                                style={{
                                  color: "#ff47bf",
                                  fontSize: "9px",
                                  fontWeight: 800,
                                }}
                              >
                                {request.name}
                              </span>

                              <span
                                style={{
                                  color: "#3d4557",
                                }}
                              >
                                •
                              </span>

                              <span
                                style={{
                                  color: "#6e778c",
                                  fontSize: "8px",
                                }}
                              >
                                Guest Request
                              </span>
                            </div>

                            {request.message && (
                              <div
                                style={{
                                  marginTop: "8px",
                                  padding: "8px 10px",
                                  borderRadius: "9px",
                                  color: "#aab1c1",
                                  background:
                                    "rgba(255,255,255,0.035)",
                                  fontSize: "9px",
                                  lineHeight: 1.5,
                                }}
                              >
                                “{request.message}”
                              </div>
                            )}

                            <div
                              style={{
                                display: "grid",
                                gridTemplateColumns:
                                  "1fr 1fr",
                                gap: "8px",
                                marginTop: "11px",
                              }}
                            >
                              <button
                                onClick={() =>
                                  updateRequestStatus(
                                    request.id,
                                    "approved"
                                  )
                                }
                                style={{
                                  padding: "9px",
                                  border:
                                    "1px solid rgba(88,229,191,0.35)",
                                  borderRadius: "9px",
                                  color: "#58e5bf",
                                  background:
                                    "rgba(88,229,191,0.08)",
                                  fontSize: "9px",
                                  fontWeight: 900,
                                }}
                              >
                                ✓ APPROVE
                              </button>

                              <button
                                onClick={() =>
                                  updateRequestStatus(
                                    request.id,
                                    "declined"
                                  )
                                }
                                style={{
                                  padding: "9px",
                                  border:
                                    "1px solid rgba(255,101,125,0.30)",
                                  borderRadius: "9px",
                                  color: "#ff657d",
                                  background:
                                    "rgba(255,101,125,0.07)",
                                  fontSize: "9px",
                                  fontWeight: 900,
                                }}
                              >
                                × DECLINE
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </section>

              <section>
                <p className="eyebrow">
                  ACTIVITY
                </p>

                <h2
                  style={{
                    margin: "0 0 12px",
                    fontSize: "22px",
                  }}
                >
                  Recent Decisions
                </h2>

                {requests.filter(
                  (request) =>
                    request.status !== "pending"
                ).length === 0 ? (
                  <div
                    style={{
                      padding: "25px 16px",
                      border:
                        "1px solid rgba(255,255,255,0.07)",
                      borderRadius: "14px",
                      color: "#747d91",
                      background:
                        "rgba(10,14,25,0.75)",
                      textAlign: "center",
                      fontSize: "9px",
                    }}
                  >
                    Approve or decline a request
                    and it will appear here.
                  </div>
                ) : (
                  <div
                    style={{
                      display: "grid",
                      gap: "8px",
                    }}
                  >
                    {requests
                      .filter(
                        (request) =>
                          request.status !==
                          "pending"
                      )
                      .slice()
                      .reverse()
                      .map((request) => (
                        <div
                          key={request.id}
                          style={{
                            padding: "11px",
                            border:
                              "1px solid rgba(255,255,255,0.07)",
                            borderRadius: "12px",
                            background:
                              "rgba(10,14,25,0.85)",
                          }}
                        >
                          <div
                            style={{
                              display: "flex",
                              justifyContent:
                                "space-between",
                              gap: "8px",
                            }}
                          >
                            <strong
                              style={{
                                overflow: "hidden",
                                textOverflow:
                                  "ellipsis",
                                whiteSpace: "nowrap",
                                fontSize: "10px",
                              }}
                            >
                              {request.song.title}
                            </strong>

                            <span
                              style={{
                                color: statusColor(
                                  request.status
                                ),
                                fontSize: "7px",
                                fontWeight: 900,
                                textTransform:
                                  "uppercase",
                              }}
                            >
                              {request.status}
                            </span>
                          </div>

                          <span
                            style={{
                              display: "block",
                              marginTop: "4px",
                              color: "#687185",
                              fontSize: "8px",
                            }}
                          >
                            Requested by{" "}
                            {request.name}
                          </span>
                        </div>
                      ))}
                  </div>
                )}
              </section>
            </div>
          </div>
        </section>
      </main>
    );
  }

  /*
    =========================
    MOST REQUESTED
    =========================
  */

  if (screen === "mostRequested") {
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

            <div
              style={{
                marginBottom: "22px",
              }}
            >
              <p className="eyebrow">
                TIPSYS · TONIGHT
              </p>

              <h2
                style={{
                  margin: 0,
                  fontSize: "30px",
                }}
              >
                Most Requested
              </h2>

              <p
                style={{
                  margin: "8px 0 0",
                  color: "#9199ad",
                  fontSize: "13px",
                }}
              >
                What the crowd wants to hear
                tonight.
              </p>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "10px",
                marginBottom: "22px",
              }}
            >
              <div
                style={{
                  padding: "14px",
                  border:
                    "1px solid rgba(255,255,255,0.08)",
                  borderRadius: "14px",
                  background: "rgba(10,14,25,0.94)",
                }}
              >
                <div
                  style={{
                    color: "#ff43bd",
                    fontSize: "23px",
                    fontWeight: 900,
                  }}
                >
                  {totalRequests}
                </div>

                <div
                  style={{
                    marginTop: "4px",
                    color: "#737c91",
                    fontSize: "8px",
                    fontWeight: 800,
                    letterSpacing: "1px",
                  }}
                >
                  TOTAL REQUESTS
                </div>
              </div>

              <div
                style={{
                  padding: "14px",
                  border:
                    "1px solid rgba(255,255,255,0.08)",
                  borderRadius: "14px",
                  background: "rgba(10,14,25,0.94)",
                }}
              >
                <div
                  style={{
                    color: "#58e5bf",
                    fontSize: "23px",
                    fontWeight: 900,
                  }}
                >
                  {
                    requestRanking.filter(
                      (item) => item.count > 0
                    ).length
                  }
                </div>

                <div
                  style={{
                    marginTop: "4px",
                    color: "#737c91",
                    fontSize: "8px",
                    fontWeight: 800,
                    letterSpacing: "1px",
                  }}
                >
                  SONGS REQUESTED
                </div>
              </div>
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: "10px",
              }}
            >
              <span
                style={{
                  color: "#dce0ea",
                  fontSize: "11px",
                  fontWeight: 800,
                }}
              >
                Tonight's Ranking
              </span>

              <span
                style={{
                  color: "#70798e",
                  fontSize: "8px",
                  fontWeight: 800,
                }}
              >
                LIVE
              </span>
            </div>

            <div
              style={{
                display: "grid",
                gap: "9px",
              }}
            >
              {requestRanking.map((item, index) => (
                <div
                  key={item.song.id}
                  style={{
                    display: "grid",
                    gridTemplateColumns:
                      "40px 52px 1fr 55px",
                    alignItems: "center",
                    gap: "10px",
                    padding: "10px",
                    border:
                      item.count > 0
                        ? "1px solid rgba(255,47,183,0.24)"
                        : "1px solid rgba(255,255,255,0.07)",
                    borderRadius: "13px",
                    background:
                      item.count > 0
                        ? "linear-gradient(90deg, rgba(255,24,172,0.06), rgba(10,14,25,0.96))"
                        : "rgba(10,14,25,0.90)",
                    opacity: item.count > 0 ? 1 : 0.55,
                  }}
                >
                  <div
                    style={{
                      textAlign: "center",
                      fontSize:
                        index < 3 ? "20px" : "10px",
                      color: "#747d91",
                      fontWeight: 900,
                    }}
                  >
                    {getRankIcon(index)}
                  </div>

                  <div
                    className={`song-art ${item.song.color}`}
                  >
                    ♫
                  </div>

                  <div
                    style={{
                      minWidth: 0,
                      display: "flex",
                      flexDirection: "column",
                      gap: "3px",
                    }}
                  >
                    <strong
                      style={{
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                        fontSize: "11px",
                      }}
                    >
                      {item.song.title}
                    </strong>

                    <span
                      style={{
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                        color: "#8992a6",
                        fontSize: "8px",
                      }}
                    >
                      {item.song.artist}
                    </span>
                  </div>

                  <div
                    style={{
                      textAlign: "right",
                    }}
                  >
                    <strong
                      style={{
                        display: "block",
                        color:
                          item.count > 0
                            ? "#ff47bf"
                            : "#646d81",
                        fontSize: "16px",
                      }}
                    >
                      {item.count}
                    </strong>

                    <span
                      style={{
                        color: "#687185",
                        fontSize: "7px",
                      }}
                    >
                      {item.count === 1
                        ? "REQUEST"
                        : "REQUESTS"}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {totalRequests === 0 && (
              <div
                style={{
                  marginTop: "18px",
                  padding: "14px",
                  borderRadius: "12px",
                  textAlign: "center",
                  background:
                    "rgba(255,255,255,0.03)",
                }}
              >
                <div
                  style={{
                    fontSize: "22px",
                  }}
                >
                  🎧
                </div>

                <strong
                  style={{
                    display: "block",
                    marginTop: "6px",
                    fontSize: "11px",
                  }}
                >
                  No requests yet
                </strong>

                <p
                  style={{
                    margin: "4px 0 0",
                    color: "#747d91",
                    fontSize: "8px",
                  }}
                >
                  Be the first to request
                  something.
                </p>
              </div>
            )}

            <button
              className="request-song-button"
              style={{
                marginTop: "20px",
              }}
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
                <strong>Request a Song</strong>

                <small>
                  Add your vote to tonight's
                  music
                </small>
              </div>

              <span className="request-arrow">
                ›
              </span>
            </button>

            <div className="venue-footer">
              <button
                onClick={() =>
                  setScreen("venueHome")
                }
              >
                ⌂
              </button>

              <button
                onClick={() =>
                  setScreen("requestMusic")
                }
              >
                ⌕
              </button>

              <button className="footer-active">
                ♫
              </button>

              <button>☰</button>
            </div>
          </div>
        </section>
      </main>
    );
  }

  /*
    =========================
    REQUEST SUCCESS
    =========================
  */

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

            <div className="success-icon">✓</div>

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
                setScreen("mostRequested")
              }
              style={{
                marginTop: "10px",
              }}
            >
              🏆 View Most Requested
            </button>

            <button
              className="install-button"
              onClick={returnHome}
              style={{
                marginTop: "10px",
              }}
            >
              Back to Tipsys
            </button>
          </div>
        </section>
      </main>
    );
  }

  /*
    =========================
    REQUEST FORM
    =========================
  */

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
                  <span>YOUR REQUEST</span>

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

  /*
    =========================
    REQUEST MUSIC
    =========================
  */

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
                Search for the song you want to
                hear tonight.
              </p>
            </div>

            <div className="music-search">
              <span>⌕</span>

              <input
                type="text"
                placeholder="Song or artist..."
                value={search}
                onChange={(event) =>
                  setSearch(event.target.value)
                }
                autoFocus
              />

              {search && (
                <button
                  onClick={() => setSearch("")}
                >
                  ×
                </button>
              )}
            </div>

            <div className="music-source-tabs">
              <button className="source-active">
                All
              </button>

              <button>Popular</button>
              <button>Tonight</button>
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
                filteredSongs.map((song) => (
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
                ))
              ) : (
                <div className="no-results">
                  <span>⌕</span>

                  <h3>No songs found</h3>

                  <p>
                    Try another song title or
                    artist.
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

              <button
                onClick={() =>
                  setScreen("mostRequested")
                }
              >
                ♫
              </button>

              <button>☰</button>
            </div>
          </div>
        </section>
      </main>
    );
  }

  /*
    =========================
    VENUE HOME
    =========================
  */

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

              <button
                className="more-button"
                onClick={() =>
                  setScreen("djDashboard")
                }
                title="DJ Dashboard"
              >
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

                  <h3>How's the track?</h3>
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
                  Search music and send it to
                  the DJ
                </small>
              </div>

              <span className="request-arrow">
                ›
              </span>
            </button>

            <section className="quick-actions-section">
              <div className="section-heading-row">
                <h3>Tonight at Tipsys</h3>

                <button
                  className="text-button"
                  onClick={() =>
                    setScreen("mostRequested")
                  }
                >
                  View All
                </button>
              </div>

              <div className="quick-action-grid">
                <button
                  className="quick-action-card"
                  onClick={() =>
                    setScreen("mostRequested")
                  }
                >
                  <span>🏆</span>

                  <strong>
                    Most Requested
                  </strong>

                  <small>
                    {totalRequests > 0
                      ? `${totalRequests} request${
                          totalRequests === 1
                            ? ""
                            : "s"
                        } tonight`
                      : "See what's hot tonight"}
                  </small>
                </button>

                <button className="quick-action-card">
                  <span>💬</span>

                  <strong>Shoutout</strong>

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

              <button
                onClick={() =>
                  setScreen("mostRequested")
                }
              >
                ♫
              </button>

              <button
                onClick={() =>
                  setScreen("djDashboard")
                }
              >
                ☰
              </button>
            </div>
          </div>
        </section>
      </main>
    );
  }

  /*
    =========================
    VENUES
    =========================
  */

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

              <h2>Find Your Venue</h2>

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

  /*
    =========================
    WELCOME
    =========================
  */

  return (
    <main className="app">
      <section className="phone-shell">
        <div className="glow glow-one"></div>
        <div className="glow glow-two"></div>

        <div className="welcome-content">
          <div className="brand">
            <h1>DJ LIVE</h1>

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