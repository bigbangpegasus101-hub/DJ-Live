 import { useEffect, useState } from "react";
            import "./App.css";
              import socket from "./socket.js";

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

            const STORAGE_KEYS = {
              requests: "djLive.requests.v1",
              crowdVotes: "djLive.crowdVotes.v1",
              selectedReaction: "djLive.selectedReaction.v1",
            };

            const DEFAULT_CROWD_VOTES = {
              fire: 38,
              good: 17,
              meh: 3,
              skip: 1,
            };

            function readStoredValue(key, fallbackValue) {
              try {
                const storedValue = localStorage.getItem(key);

                if (storedValue === null) {
                  return fallbackValue;
                }

                return JSON.parse(storedValue);
              } catch (error) {
                console.warn(`DJ Live could not read ${key} from localStorage.`, error);
                return fallbackValue;
              }
            }

            function writeStoredValue(key, value) {
              try {
                localStorage.setItem(key, JSON.stringify(value));
              } catch (error) {
                console.warn(`DJ Live could not save ${key} to localStorage.`, error);
              }
            }

            function App() {
              const [screen, setScreen] = useState("welcome");
              const [search, setSearch] = useState("");
              const [selectedSong, setSelectedSong] = useState(null);
              const [requestName, setRequestName] = useState("");
              const [requestMessage, setRequestMessage] = useState("");

              const [selectedReaction, setSelectedReaction] = useState(() =>
                readStoredValue(STORAGE_KEYS.selectedReaction, null)
              );

              const [crowdVotes, setCrowdVotes] = useState(() =>
                readStoredValue(STORAGE_KEYS.crowdVotes, DEFAULT_CROWD_VOTES)
              );

              const [requests, setRequests] = useState(() =>
                readStoredValue(STORAGE_KEYS.requests, [])
              );

              useEffect(() => {
                writeStoredValue(STORAGE_KEYS.requests, requests);
              }, [requests]);

              useEffect(() => {
                writeStoredValue(STORAGE_KEYS.crowdVotes, crowdVotes);
              }, [crowdVotes]);

              useEffect(() => {
                writeStoredValue(
                  STORAGE_KEYS.selectedReaction,
                  selectedReaction
                );
              }, [selectedReaction]);
              useEffect(() => {
                function handleRealtimeRequest(incomingRequest) {
                  setRequests((currentRequests) => {
                    const requestAlreadyExists = currentRequests.some(
                      (request) => request.id === incomingRequest.id
                    );

                    if (requestAlreadyExists) {
                      return currentRequests;
                    }

                    return [...currentRequests, incomingRequest];
                  });
                }

                socket.on("song-request", handleRealtimeRequest);

                return () => {
                  socket.off("song-request", handleRealtimeRequest);
                };
              }, []);


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
                      ((crowdVotes.fire + crowdVotes.good) / totalVotes) *
                        100
                    );

              const totalRequests = requests.length;

              const pendingRequests = requests.filter(
                (request) => request.status === "pending"
              );

              const queuedRequests = requests
                .filter((request) => request.status === "queued")
                .sort(
                  (a, b) =>
                    (a.queuePosition ?? 9999) -
                    (b.queuePosition ?? 9999)
                );

              const loadedRequests = requests.filter(
                (request) => request.status === "loaded"
              );

              const playedRequests = requests
                .filter((request) => request.status === "played")
                .sort(
                  (a, b) =>
                    new Date(b.playedAt || 0) -
                    new Date(a.playedAt || 0)
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
                if (!selectedSong) return;

                const newRequest = {
                  id: Date.now() + Math.random(),
                  song: selectedSong,
                  name: requestName.trim() || "Guest",
                  message: requestMessage.trim(),
                  submittedAt: new Date().toISOString(),
                  status: "pending",
                  queuePosition: null,
                  deck: null,
                  loadedAt: null,
                  playedAt: null,
                };

                setRequests((currentRequests) => [
                  ...currentRequests,
                  newRequest,
                ]);

                socket.emit("song-request", newRequest);

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
                if (selectedReaction === reaction) return;

                setCrowdVotes((currentVotes) => {
                  const updatedVotes = { ...currentVotes };

                  if (selectedReaction) {
                    updatedVotes[selectedReaction] = Math.max(
                      0,
                      updatedVotes[selectedReaction] - 1
                    );
                  }

                  updatedVotes[reaction] += 1;

                  return updatedVotes;
                });

                setSelectedReaction(reaction);
              }

              function reactionStyle(reaction) {
                if (selectedReaction !== reaction) return {};

                return {
                  borderColor: "rgba(255, 49, 181, 0.9)",
                  background:
                    "linear-gradient(145deg, rgba(255, 28, 172, 0.20), rgba(80, 34, 180, 0.18))",
                  boxShadow: "0 0 18px rgba(255, 49, 181, 0.20)",
                  transform: "translateY(-2px)",
                };
              }

              function getRankIcon(index) {
                if (index === 0) return "🥇";
                if (index === 1) return "🥈";
                if (index === 2) return "🥉";

                return `#${index + 1}`;
              }

              function normalizeQueue(requestList) {
                const queued = requestList
                  .filter((request) => request.status === "queued")
                  .sort(
                    (a, b) =>
                      (a.queuePosition ?? 9999) -
                      (b.queuePosition ?? 9999)
                  );

                const queuePositions = new Map();

                queued.forEach((request, index) => {
                  queuePositions.set(request.id, index + 1);
                });

                return requestList.map((request) => {
                  if (!queuePositions.has(request.id)) {
                    return request;
                  }

                  return {
                    ...request,
                    queuePosition: queuePositions.get(request.id),
                  };
                });
              }

              function approveRequest(requestId) {
                setRequests((currentRequests) => {
                  const currentQueue = currentRequests.filter(
                    (request) => request.status === "queued"
                  );

                  const nextQueuePosition =
                    currentQueue.length === 0
                      ? 1
                      : Math.max(
                          ...currentQueue.map(
                            (request) => request.queuePosition ?? 0
                          )
                        ) + 1;

                  return currentRequests.map((request) =>
                    request.id === requestId
                      ? {
                          ...request,
                          status: "queued",
                          queuePosition: nextQueuePosition,
                        }
                      : request
                  );
                });
              }

              function declineRequest(requestId) {
                setRequests((currentRequests) =>
                  currentRequests.map((request) =>
                    request.id === requestId
                      ? {
                          ...request,
                          status: "declined",
                          queuePosition: null,
                          deck: null,
                        }
                      : request
                  )
                );
              }

              function moveQueueItem(requestId, direction) {
                setRequests((currentRequests) => {
                  const queue = currentRequests
                    .filter((request) => request.status === "queued")
                    .sort(
                      (a, b) =>
                        (a.queuePosition ?? 9999) -
                        (b.queuePosition ?? 9999)
                    );

                  const currentIndex = queue.findIndex(
                    (request) => request.id === requestId
                  );

                  if (currentIndex === -1) {
                    return currentRequests;
                  }

                  const targetIndex =
                    direction === "up"
                      ? currentIndex - 1
                      : currentIndex + 1;

                  if (
                    targetIndex < 0 ||
                    targetIndex >= queue.length
                  ) {
                    return currentRequests;
                  }

                  const currentItem = queue[currentIndex];
                  const targetItem = queue[targetIndex];

                  const updatedRequests = currentRequests.map(
                    (request) => {
                      if (request.id === currentItem.id) {
                        return {
                          ...request,
                          queuePosition: targetItem.queuePosition,
                        };
                      }

                      if (request.id === targetItem.id) {
                        return {
                          ...request,
                          queuePosition: currentItem.queuePosition,
                        };
                      }

                      return request;
                    }
                  );

                  return normalizeQueue(updatedRequests);
                });
              }

              function removeFromQueue(requestId) {
                setRequests((currentRequests) => {
                  const updatedRequests = currentRequests.map(
                    (request) =>
                      request.id === requestId
                        ? {
                            ...request,
                            status: "declined",
                            queuePosition: null,
                            deck: null,
                          }
                        : request
                  );

                  return normalizeQueue(updatedRequests);
                });
              }

              function loadToDeck(requestId, deckNumber) {
                setRequests((currentRequests) => {
                  /*
                    For V1, one requested track can occupy each deck.
                    If another requested track is already marked loaded
                    on this deck, return it to the front of the queue.
                  */

                  const targetRequest = currentRequests.find(
                    (request) => request.id === requestId
                  );

                  if (!targetRequest) {
                    return currentRequests;
                  }

                  const currentQueue = currentRequests
                    .filter(
                      (request) =>
                        request.status === "queued" &&
                        request.id !== requestId
                    )
                    .sort(
                      (a, b) =>
                        (a.queuePosition ?? 9999) -
                        (b.queuePosition ?? 9999)
                    );

                  let updatedRequests = currentRequests.map(
                    (request) => {
                      if (
                        request.status === "loaded" &&
                        request.deck === deckNumber &&
                        request.id !== requestId
                      ) {
                        return {
                          ...request,
                          status: "queued",
                          queuePosition: 1,
                          deck: null,
                          loadedAt: null,
                        };
                      }

                      if (request.id === requestId) {
                        return {
                          ...request,
                          status: "loaded",
                          queuePosition: null,
                          deck: deckNumber,
                          loadedAt: new Date().toISOString(),
                        };
                      }

                      if (
                        request.status === "queued" &&
                        currentQueue.some(
                          (queuedRequest) =>
                            queuedRequest.id === request.id
                        )
                      ) {
                        return {
                          ...request,
                          queuePosition:
                            (request.queuePosition ?? 0) + 1,
                        };
                      }

                      return request;
                    }
                  );

                  return normalizeQueue(updatedRequests);
                });
              }

              function returnLoadedToQueue(requestId) {
                setRequests((currentRequests) => {
                  const updatedRequests = currentRequests.map(
                    (request) => {
                      if (request.id === requestId) {
                        return {
                          ...request,
                          status: "queued",
                          queuePosition: 1,
                          deck: null,
                          loadedAt: null,
                        };
                      }

                      if (request.status === "queued") {
                        return {
                          ...request,
                          queuePosition:
                            (request.queuePosition ?? 0) + 1,
                        };
                      }

                      return request;
                    }
                  );

                  return normalizeQueue(updatedRequests);
                });
              }

              function markPlayed(requestId) {
                setRequests((currentRequests) =>
                  currentRequests.map((request) =>
                    request.id === requestId
                      ? {
                          ...request,
                          status: "played",
                          queuePosition: null,
                          playedAt: new Date().toISOString(),
                        }
                      : request
                  )
                );
              }

              function formatRequestTime(timestamp) {
                if (!timestamp) return "";

                return new Date(timestamp).toLocaleTimeString([], {
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
                    style={{ alignItems: "flex-start" }}
                  >
                    <section
                      style={{
                        position: "relative",
                        overflow: "hidden",
                        width: "min(1220px, 100%)",
                        minHeight: "760px",
                        padding: "24px",
                        border:
                          "1px solid rgba(255,42,184,0.40)",
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
                              style={{ textAlign: "left" }}
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
                              gap: "10px",
                              alignItems: "center",
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
                              "repeat(auto-fit, minmax(130px,1fr))",
                            gap: "10px",
                            marginBottom: "24px",
                          }}
                        >
                          <DashboardStat
                            number={pendingRequests.length}
                            label="PENDING"
                            color="#ff47bf"
                          />

                          <DashboardStat
                            number={queuedRequests.length}
                            label="QUEUED"
                            color="#58e5bf"
                          />

                          <DashboardStat
                            number={loadedRequests.length}
                            label="LOADED"
                            color="#6cb8ff"
                          />

                          <DashboardStat
                            number={playedRequests.length}
                            label="PLAYED"
                            color="#b68cff"
                          />

                          <DashboardStat
                            number={totalRequests}
                            label="TOTAL"
                            color="#dce0ea"
                          />
                        </div>

                        {loadedRequests.length > 0 && (
                          <section
                            style={{
                              marginBottom: "24px",
                            }}
                          >
                            <p className="eyebrow">
                              SERATO DECK STATE · MANUAL V1
                            </p>

                            <h2
                              style={{
                                margin: "0 0 12px",
                                fontSize: "22px",
                              }}
                            >
                              Loaded Tracks
                            </h2>

                            <div
                              style={{
                                display: "grid",
                                gridTemplateColumns:
                                  "repeat(auto-fit, minmax(260px,1fr))",
                                gap: "10px",
                              }}
                            >
                              {loadedRequests
                                .sort(
                                  (a, b) =>
                                    (a.deck ?? 99) -
                                    (b.deck ?? 99)
                                )
                                .map((request) => (
                                  <div
                                    key={request.id}
                                    style={{
                                      padding: "14px",
                                      border:
                                        "1px solid rgba(108,184,255,0.35)",
                                      borderRadius: "15px",
                                      background:
                                        "linear-gradient(90deg, rgba(40,110,255,0.10), rgba(10,14,25,0.94))",
                                    }}
                                  >
                                    <div
                                      style={{
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent:
                                          "space-between",
                                        gap: "12px",
                                      }}
                                    >
                                      <div
                                        style={{
                                          display: "flex",
                                          alignItems: "center",
                                          gap: "11px",
                                          minWidth: 0,
                                        }}
                                      >
                                        <div
                                          className={`song-art ${request.song.color}`}
                                          style={{
                                            width: "52px",
                                            height: "52px",
                                          }}
                                        >
                                          ♫
                                        </div>

                                        <div
                                          style={{
                                            minWidth: 0,
                                          }}
                                        >
                                          <span
                                            style={{
                                              color: "#6cb8ff",
                                              fontSize: "8px",
                                              fontWeight: 900,
                                              letterSpacing: "1px",
                                            }}
                                          >
                                            LOADED · DECK{" "}
                                            {request.deck}
                                          </span>

                                          <strong
                                            style={{
                                              display: "block",
                                              marginTop: "4px",
                                              fontSize: "12px",
                                            }}
                                          >
                                            {request.song.title}
                                          </strong>

                                          <span
                                            style={{
                                              display: "block",
                                              marginTop: "3px",
                                              color: "#8992a6",
                                              fontSize: "8px",
                                            }}
                                          >
                                            {request.song.artist}
                                          </span>
                                        </div>
                                      </div>
                                    </div>

                                    <div
                                      style={{
                                        display: "grid",
                                        gridTemplateColumns:
                                          "1fr 1fr",
                                        gap: "7px",
                                        marginTop: "12px",
                                      }}
                                    >
                                      <button
                                        onClick={() =>
                                          markPlayed(request.id)
                                        }
                                        style={{
                                          padding: "9px",
                                          border:
                                            "1px solid rgba(88,229,191,0.30)",
                                          borderRadius: "8px",
                                          color: "#58e5bf",
                                          background:
                                            "rgba(88,229,191,0.07)",
                                          fontSize: "8px",
                                          fontWeight: 900,
                                        }}
                                      >
                                        ✓ MARK PLAYED
                                      </button>

                                      <button
                                        onClick={() =>
                                          returnLoadedToQueue(
                                            request.id
                                          )
                                        }
                                        style={{
                                          padding: "9px",
                                          border:
                                            "1px solid rgba(255,255,255,0.10)",
                                          borderRadius: "8px",
                                          color: "#aeb6c8",
                                          background:
                                            "rgba(255,255,255,0.03)",
                                          fontSize: "8px",
                                          fontWeight: 900,
                                        }}
                                      >
                                        ↩ RETURN TO QUEUE
                                      </button>
                                    </div>
                                  </div>
                                ))}
                            </div>
                          </section>
                        )}

                        <div
                          style={{
                            display: "grid",
                            gridTemplateColumns:
                              "repeat(auto-fit, minmax(330px,1fr))",
                            gap: "18px",
                          }}
                        >
                          <section>
                            <DashboardHeading
                              eyebrow="LIVE REQUESTS"
                              title="Incoming Requests"
                              side={`${pendingRequests.length} waiting`}
                            />

                            {pendingRequests.length === 0 ? (
                              <EmptyDashboardCard
                                icon="🎧"
                                title="Requests are clear"
                                text="New customer requests will appear here."
                              />
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
                                    <IncomingRequestCard
                                      key={request.id}
                                      request={request}
                                      onApprove={() =>
                                        approveRequest(request.id)
                                      }
                                      onDecline={() =>
                                        declineRequest(request.id)
                                      }
                                      formatRequestTime={
                                        formatRequestTime
                                      }
                                    />
                                  ))}
                              </div>
                            )}
                          </section>

                          <section>
                            <DashboardHeading
                              eyebrow="APPROVED"
                              title="DJ Queue"
                              side={`${queuedRequests.length} queued`}
                              sideColor="#58e5bf"
                            />

                            {queuedRequests.length === 0 ? (
                              <EmptyDashboardCard
                                icon="♫"
                                title="Queue is empty"
                                text="Approve a request and it will land here."
                              />
                            ) : (
                              <div
                                style={{
                                  display: "grid",
                                  gap: "9px",
                                }}
                              >
                                {queuedRequests.map(
                                  (request, index) => (
                                    <div
                                      key={request.id}
                                      style={{
                                        padding: "11px",
                                        border:
                                          index === 0
                                            ? "1px solid rgba(88,229,191,0.35)"
                                            : "1px solid rgba(255,255,255,0.08)",
                                        borderRadius: "13px",
                                        background:
                                          index === 0
                                            ? "linear-gradient(90deg, rgba(88,229,191,0.08), rgba(10,14,25,0.94))"
                                            : "rgba(10,14,25,0.90)",
                                      }}
                                    >
                                      <div
                                        style={{
                                          display: "grid",
                                          gridTemplateColumns:
                                            "34px 48px minmax(0,1fr)",
                                          gap: "10px",
                                          alignItems: "center",
                                        }}
                                      >
                                        <div
                                          style={{
                                            width: "30px",
                                            height: "30px",
                                            display: "grid",
                                            placeItems: "center",
                                            borderRadius: "50%",
                                            color:
                                              index === 0
                                                ? "#58e5bf"
                                                : "#8992a6",
                                            background:
                                              "rgba(255,255,255,0.05)",
                                            fontSize: "10px",
                                            fontWeight: 900,
                                          }}
                                        >
                                          {index + 1}
                                        </div>

                                        <div
                                          className={`song-art ${request.song.color}`}
                                          style={{
                                            width: "48px",
                                            height: "48px",
                                            fontSize: "18px",
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
                                              gap: "8px",
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
                                                  fontSize: "11px",
                                                }}
                                              >
                                                {request.song.title}
                                              </strong>

                                              <span
                                                style={{
                                                  display: "block",
                                                  marginTop: "3px",
                                                  color: "#7f899d",
                                                  fontSize: "8px",
                                                }}
                                              >
                                                {request.song.artist}
                                              </span>
                                            </div>

                                            {index === 0 && (
                                              <span
                                                style={{
                                                  color: "#58e5bf",
                                                  fontSize: "7px",
                                                  fontWeight: 900,
                                                }}
                                              >
                                                NEXT
                                              </span>
                                            )}
                                          </div>

                                          <div
                                            style={{
                                              marginTop: "7px",
                                              color: "#687185",
                                              fontSize: "8px",
                                            }}
                                          >
                                            Requested by{" "}
                                            {request.name}
                                          </div>
                                        </div>
                                      </div>

                                      <div
                                        style={{
                                          display: "grid",
                                          gridTemplateColumns:
                                            "36px 36px 1fr 1fr 1fr",
                                          gap: "6px",
                                          marginTop: "10px",
                                        }}
                                      >
                                        <QueueButton
                                          disabled={index === 0}
                                          onClick={() =>
                                            moveQueueItem(
                                              request.id,
                                              "up"
                                            )
                                          }
                                        >
                                          ↑
                                        </QueueButton>

                                        <QueueButton
                                          disabled={
                                            index ===
                                            queuedRequests.length - 1
                                          }
                                          onClick={() =>
                                            moveQueueItem(
                                              request.id,
                                              "down"
                                            )
                                          }
                                        >
                                          ↓
                                        </QueueButton>

                                        <QueueButton
                                          blue
                                          onClick={() =>
                                            loadToDeck(
                                              request.id,
                                              1
                                            )
                                          }
                                        >
                                          DECK 1
                                        </QueueButton>

                                        <QueueButton
                                          blue
                                          onClick={() =>
                                            loadToDeck(
                                              request.id,
                                              2
                                            )
                                          }
                                        >
                                          DECK 2
                                        </QueueButton>

                                        <QueueButton
                                          danger
                                          onClick={() =>
                                            removeFromQueue(
                                              request.id
                                            )
                                          }
                                        >
                                          REMOVE
                                        </QueueButton>
                                      </div>
                                    </div>
                                  )
                                )}
                              </div>
                            )}
                          </section>
                        </div>

                        <section
                          style={{
                            marginTop: "24px",
                          }}
                        >
                          <DashboardHeading
                            eyebrow="SESSION HISTORY"
                            title="Played Requests"
                            side={`${playedRequests.length} played`}
                            sideColor="#b68cff"
                          />

                          {playedRequests.length === 0 ? (
                            <div
                              style={{
                                padding: "18px",
                                border:
                                  "1px solid rgba(255,255,255,0.07)",
                                borderRadius: "13px",
                                color: "#747d91",
                                background:
                                  "rgba(10,14,25,0.70)",
                                textAlign: "center",
                                fontSize: "9px",
                              }}
                            >
                              Played requests will appear here.
                            </div>
                          ) : (
                            <div
                              style={{
                                display: "grid",
                                gridTemplateColumns:
                                  "repeat(auto-fit, minmax(220px,1fr))",
                                gap: "8px",
                              }}
                            >
                              {playedRequests.map((request) => (
                                <div
                                  key={request.id}
                                  style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "10px",
                                    padding: "11px",
                                    border:
                                      "1px solid rgba(182,140,255,0.18)",
                                    borderRadius: "12px",
                                    background:
                                      "rgba(10,14,25,0.85)",
                                  }}
                                >
                                  <div
                                    className={`song-art ${request.song.color}`}
                                    style={{
                                      width: "42px",
                                      height: "42px",
                                      fontSize: "16px",
                                    }}
                                  >
                                    ♫
                                  </div>

                                  <div
                                    style={{
                                      minWidth: 0,
                                    }}
                                  >
                                    <strong
                                      style={{
                                        display: "block",
                                        fontSize: "10px",
                                      }}
                                    >
                                      {request.song.title}
                                    </strong>

                                    <span
                                      style={{
                                        display: "block",
                                        marginTop: "3px",
                                        color: "#b68cff",
                                        fontSize: "7px",
                                        fontWeight: 900,
                                      }}
                                    >
                                      PLAYED · DECK {request.deck}
                                    </span>

                                    <span
                                      style={{
                                        display: "block",
                                        marginTop: "3px",
                                        color: "#687185",
                                        fontSize: "7px",
                                      }}
                                    >
                                      {formatRequestTime(
                                        request.playedAt
                                      )}
                                    </span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </section>
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
                            What the crowd wants to hear tonight.
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
                          <DashboardStat
                            number={totalRequests}
                            label="TOTAL REQUESTS"
                            color="#ff43bd"
                          />

                          <DashboardStat
                            number={
                              requestRanking.filter(
                                (item) => item.count > 0
                              ).length
                            }
                            label="SONGS REQUESTED"
                            color="#58e5bf"
                          />
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
                                opacity:
                                  item.count > 0 ? 1 : 0.55,
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
                                }}
                              >
                                <strong
                                  style={{
                                    display: "block",
                                    fontSize: "11px",
                                  }}
                                >
                                  {item.song.title}
                                </strong>

                                <span
                                  style={{
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

                        <button
                          className="request-song-button"
                          style={{ marginTop: "20px" }}
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
                              Add your vote to tonight's music
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

                        <div className="success-icon">
                          ✓
                        </div>

                        <p className="eyebrow">
                          REQUEST SENT
                        </p>

                        <h2>You're in the queue.</h2>

                        <p className="success-copy">
                          Your request was sent to the DJ at
                          Tipsys.
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
                            Requests aren't guaranteed to play.
                            The DJ controls the final queue.
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
                          style={{ marginTop: "10px" }}
                        >
                          🏆 View Most Requested
                        </button>

                        <button
                          className="install-button"
                          onClick={returnHome}
                          style={{ marginTop: "10px" }}
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
                            This request will be sent to the DJ
                            at Tipsys.
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
                              <h3>{selectedSong.title}</h3>
                              <p>{selectedSong.artist}</p>
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
                              <strong>Save this song</strong>

                              <small>
                                Add it to your favorites when
                                signed in.
                              </small>
                            </div>
                          </label>
                        </div>

                        <div className="request-warning">
                          <span>♫</span>

                          <p>
                            Sending a request doesn't guarantee
                            it will be played. Your DJ controls
                            the vibe.
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
                            Search for the song you want to hear
                            tonight.
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
                                Try another song title or artist.
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
                            {[
                              ["fire", "🔥", "Fire"],
                              ["good", "👍", "Good"],
                              ["meh", "😐", "Meh"],
                              ["skip", "⏭", "Skip"],
                            ].map(
                              ([key, emoji, label]) => (
                                <button
                                  key={key}
                                  className="reaction-button"
                                  style={reactionStyle(key)}
                                  onClick={() =>
                                    handleReaction(key)
                                  }
                                >
                                  <span>{emoji}</span>

                                  <small>
                                    {label} ·{" "}
                                    {crowdVotes[key]}
                                  </small>
                                </button>
                              )
                            )}
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
                              Search music and send it to the DJ
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
                              <small>Send a message</small>
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

                          {[
                            ["H", "The Hideout", "1.4 mi", "Bar · Nightlife"],
                            ["B", "Bar 101", "2.1 mi", "Bar · Music"],
                            ["R", "Riverside Pub", "3.5 mi", "Pub · Nightlife"],
                          ].map(
                            ([letter, name, distance, type]) => (
                              <button
                                className="venue-card"
                                key={name}
                              >
                                <div className="venue-image">
                                  {letter}
                                </div>

                                <div className="venue-info">
                                  <h3>{name}</h3>
                                  <p>{distance}</p>

                                  <span className="venue-type">
                                    {type}
                                  </span>
                                </div>

                                <span className="venue-arrow">
                                  ›
                                </span>
                              </button>
                            )
                          )}
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

            /*
              =========================
              COMPONENTS
              =========================
            */

            function DashboardStat({
              number,
              label,
              color,
            }) {
              return (
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
                      color,
                      fontSize: "26px",
                      fontWeight: 900,
                    }}
                  >
                    {number}
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
                    {label}
                  </div>
                </div>
              );
            }

            function DashboardHeading({
              eyebrow,
              title,
              side,
              sideColor = "#747d91",
            }) {
              return (
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
                      {eyebrow}
                    </p>

                    <h2
                      style={{
                        margin: 0,
                        fontSize: "22px",
                      }}
                    >
                      {title}
                    </h2>
                  </div>

                  <span
                    style={{
                      color: sideColor,
                      fontSize: "9px",
                      fontWeight: 800,
                    }}
                  >
                    {side}
                  </span>
                </div>
              );
            }

            function EmptyDashboardCard({
              icon,
              title,
              text,
            }) {
              return (
                <div
                  style={{
                    padding: "50px 20px",
                    border:
                      "1px solid rgba(255,255,255,0.07)",
                    borderRadius: "16px",
                    background: "rgba(10,14,25,0.75)",
                    textAlign: "center",
                  }}
                >
                  <div style={{ fontSize: "34px" }}>
                    {icon}
                  </div>

                  <h3
                    style={{
                      margin: "12px 0 5px",
                      fontSize: "15px",
                    }}
                  >
                    {title}
                  </h3>

                  <p
                    style={{
                      margin: 0,
                      color: "#747d91",
                      fontSize: "10px",
                    }}
                  >
                    {text}
                  </p>
                </div>
              );
            }

            function IncomingRequestCard({
              request,
              onApprove,
              onDecline,
              formatRequestTime,
            }) {
              return (
                <div
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

                  <div style={{ minWidth: 0 }}>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        gap: "10px",
                      }}
                    >
                      <div style={{ minWidth: 0 }}>
                        <strong
                          style={{
                            display: "block",
                            fontSize: "13px",
                          }}
                        >
                          {request.song.title}
                        </strong>

                        <span
                          style={{
                            display: "block",
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

                      <span style={{ color: "#3d4557" }}>
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
                        gridTemplateColumns: "1fr 1fr",
                        gap: "8px",
                        marginTop: "11px",
                      }}
                    >
                      <button
                        onClick={onApprove}
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
                        ✓ APPROVE + QUEUE
                      </button>

                      <button
                        onClick={onDecline}
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
              );
            }

            function QueueButton({
              children,
              onClick,
              disabled = false,
              danger = false,
              blue = false,
            }) {
              let color = "#dce0ea";
              let border =
                "1px solid rgba(255,255,255,0.10)";
              let background =
                "rgba(255,255,255,0.035)";

              if (danger) {
                color = "#ff657d";
                border =
                  "1px solid rgba(255,101,125,0.20)";
                background =
                  "rgba(255,101,125,0.05)";
              }

              if (blue) {
                color = "#6cb8ff";
                border =
                  "1px solid rgba(108,184,255,0.25)";
                background =
                  "rgba(108,184,255,0.06)";
              }

              return (
                <button
                  onClick={onClick}
                  disabled={disabled}
                  style={{
                    minHeight: "30px",
                    padding: "0 6px",
                    border,
                    borderRadius: "8px",
                    color: disabled ? "#41495a" : color,
                    background,
                    opacity: disabled ? 0.5 : 1,
                    fontSize: "7px",
                    fontWeight: 900,
                  }}
                >
                  {children}
                </button>
              );
            }

            export default App;