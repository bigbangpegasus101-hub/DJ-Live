process.env.TZ = "America/Chicago";

import "dotenv/config";

import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import cors from "cors";
import fs from "fs";
import path from "path";
import crypto from "crypto";
import { fileURLToPath } from "url";

const app = express();
const httpServer = createServer(app);
const PORT = Number(process.env.PORT) || 3001;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.join(__dirname, "data");
const STATE_FILE = path.join(DATA_DIR, "dj-live-state.json");
const DJ_AUTH_FILE = path.join(DATA_DIR, "dj-live-dj-auth.json");
const djSessions = new Map();

// One-time beta starter passwords. Change them immediately in the DJ Dashboard.
const STARTER_DJ_ACCOUNTS = [
  {
    username: "Zerox4",
    displayName: "DJ 1",
    starterPassword: "Zerox4-Beta-926!",
  },
  {
    username: "KnightLandder",
    displayName: "DJ 2",
    starterPassword: "KnightLandder-Beta-926!",
  },
];

app.use(cors());
app.use(express.json());


let spotifyAccessToken = null;
let spotifyTokenExpiresAt = 0;

async function getSpotifyAccessToken() {
  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error("Spotify credentials are missing from .env.");
  }

  if (spotifyAccessToken && Date.now() < spotifyTokenExpiresAt - 60_000) {
    return spotifyAccessToken;
  }

  const basic = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
  const response = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      Authorization: `Basic ${basic}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Spotify token request failed (${response.status}): ${detail}`);
  }

  const payload = await response.json();
  spotifyAccessToken = payload.access_token;
  spotifyTokenExpiresAt = Date.now() + Number(payload.expires_in || 3600) * 1000;
  return spotifyAccessToken;
}

function mapSpotifyTrack(track) {
  return {
    id: `spotify:${track.id}`,
    spotifyId: track.id,
    spotifyUri: track.uri,
    title: track.name,
    artist: (track.artists || []).map((artist) => artist.name).join(", "),
    album: track.album?.name || "",
    image: track.album?.images?.[1]?.url || track.album?.images?.[0]?.url || null,
    durationMs: track.duration_ms || null,
    explicit: Boolean(track.explicit),
    source: "spotify",
    color: "purple",
  };
}

app.get("/api/spotify/status", (_req, res) => {
  res.json({
    configured: Boolean(
      process.env.SPOTIFY_CLIENT_ID && process.env.SPOTIFY_CLIENT_SECRET
    ),
  });
});

app.get("/api/spotify/search", async (req, res) => {
  const query = String(req.query.q || "").trim();

  if (query.length < 2) {
    return res.json({ tracks: [] });
  }

  try {
    const token = await getSpotifyAccessToken();
    const params = new URLSearchParams({
      q: query,
      type: "track",
      limit: "10",
      offset: "0",
    });

    const response = await fetch(
      `https://api.spotify.com/v1/search?${params.toString()}`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    if (!response.ok) {
      const detail = await response.text();
      throw new Error(`Spotify search failed (${response.status}): ${detail}`);
    }

    const payload = await response.json();
    const tracks = (payload.tracks?.items || []).map(mapSpotifyTrack);
    res.json({ tracks });
  } catch (error) {
    console.error("Spotify search error:", error.message);
    res.status(502).json({
      tracks: [],
      error: "Spotify search is temporarily unavailable.",
    });
  }
});

const io = new Server(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});


function hashPassword(password, salt) {
  return crypto.scryptSync(password, salt, 64).toString("hex");
}

function buildStarterDjAuth() {
  const accounts = STARTER_DJ_ACCOUNTS.map((starter) => {
    const salt = crypto.randomBytes(16).toString("hex");

    return {
      username: starter.username,
      displayName: starter.displayName,
      salt,
      passwordHash: hashPassword(starter.starterPassword, salt),
      passwordChanged: false,
      updatedAt: new Date().toISOString(),
    };
  });

  return { version: 4, accounts };
}

function loadDjAuth() {
  fs.mkdirSync(DATA_DIR, { recursive: true });

  if (!fs.existsSync(DJ_AUTH_FILE)) {
    const initial = buildStarterDjAuth();
    fs.writeFileSync(DJ_AUTH_FILE, JSON.stringify(initial, null, 2));
    return initial;
  }

  try {
    const parsed = JSON.parse(fs.readFileSync(DJ_AUTH_FILE, "utf8"));
    if (Array.isArray(parsed.accounts) && parsed.accounts.length === 2) {
      return parsed;
    }
  } catch (error) {
    console.error("Could not read DJ auth file:", error);
  }

  const repaired = buildStarterDjAuth();
  fs.writeFileSync(DJ_AUTH_FILE, JSON.stringify(repaired, null, 2));
  return repaired;
}

let djAuth = loadDjAuth();

function saveDjAuth() {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  const temporaryFile = `${DJ_AUTH_FILE}.tmp`;
  fs.writeFileSync(temporaryFile, JSON.stringify(djAuth, null, 2));
  fs.renameSync(temporaryFile, DJ_AUTH_FILE);
}

function publicDjUser(account) {
  return {
    username: account.username,
    displayName: account.displayName,
    passwordChanged: Boolean(account.passwordChanged),
  };
}

function verifyPassword(account, password) {
  if (!account || typeof password !== "string") return false;

  const supplied = Buffer.from(
    hashPassword(password, account.salt),
    "hex"
  );
  const saved = Buffer.from(account.passwordHash, "hex");

  return (
    supplied.length === saved.length &&
    crypto.timingSafeEqual(supplied, saved)
  );
}

function verifyDjLogin(username, password) {
  // Exact and case-sensitive by design.
  const account = djAuth.accounts.find(
    (candidate) => candidate.username === username
  );

  if (!account || !verifyPassword(account, password)) return null;
  return account;
}

function createDjToken(account) {
  const token = crypto.randomBytes(32).toString("hex");
  djSessions.set(token, {
    username: account.username,
    createdAt: Date.now(),
  });
  return token;
}

function authenticatedDj(token) {
  if (typeof token !== "string") return null;
  const session = djSessions.get(token);
  if (!session) return null;

  return (
    djAuth.accounts.find(
      (account) => account.username === session.username
    ) ?? null
  );
}

function emptySession() {
  return {
    isLive: false,
    sessionId: null,
    startedAt: null,
    endsAt: null,
    endedAt: null,
    endReason: null,
  };
}

function emptyState() {
  return {
    version: 2,
    venueId: "tipsys",
    session: emptySession(),
    requests: [],
    sessionHistory: [],
    updatedAt: new Date().toISOString(),
  };
}

function loadState() {
  try {
    fs.mkdirSync(DATA_DIR, { recursive: true });

    if (!fs.existsSync(STATE_FILE)) {
      const initialState = emptyState();
      fs.writeFileSync(STATE_FILE, JSON.stringify(initialState, null, 2));
      return initialState;
    }

    const parsed = JSON.parse(fs.readFileSync(STATE_FILE, "utf8"));

    return {
      ...emptyState(),
      ...parsed,
      version: 2,
      session: {
        ...emptySession(),
        ...(parsed.session ?? {}),
      },
      requests: Array.isArray(parsed.requests) ? parsed.requests : [],
      sessionHistory: Array.isArray(parsed.sessionHistory)
        ? parsed.sessionHistory
        : [],
    };
  } catch (error) {
    console.error("Could not load DJ Live state:", error);
    return emptyState();
  }
}

let state = loadState();

function saveState() {
  try {
    fs.mkdirSync(DATA_DIR, { recursive: true });
    state.updatedAt = new Date().toISOString();

    const temporaryFile = `${STATE_FILE}.tmp`;
    fs.writeFileSync(temporaryFile, JSON.stringify(state, null, 2));
    fs.renameSync(temporaryFile, STATE_FILE);
  } catch (error) {
    console.error("Could not save DJ Live state:", error);
  }
}

function broadcastState() {
  saveState();
  io.emit("server-state", state);
}

function nextTwoAm() {
  const now = new Date();
  const close = new Date(now);
  close.setHours(2, 0, 0, 0);

  if (close <= now) {
    close.setDate(close.getDate() + 1);
  }

  return close;
}

function archiveCurrentSession(reason) {
  if (!state.session?.sessionId) return;

  state.sessionHistory.unshift({
    sessionId: state.session.sessionId,
    venueId: state.venueId,
    startedAt: state.session.startedAt,
    endedAt: new Date().toISOString(),
    endReason: reason,
    requests: state.requests,
  });

  state.sessionHistory = state.sessionHistory.slice(0, 50);
}

function startSession() {
  if (state.session?.isLive) return false;

  // Preserve the previous completed session before clearing the active board.
  if (state.session?.sessionId) {
    archiveCurrentSession(state.session.endReason || "new-session");
  }

  const now = new Date();
  const endsAt = nextTwoAm();

  state.requests = [];
  state.session = {
    isLive: true,
    sessionId: `tipsys-${now.getTime()}`,
    startedAt: now.toISOString(),
    endsAt: endsAt.toISOString(),
    endedAt: null,
    endReason: null,
  };

  return true;
}

function endSession(reason = "manual") {
  if (!state.session?.isLive) return false;

  state.session = {
    ...state.session,
    isLive: false,
    endedAt: new Date().toISOString(),
    endReason: reason,
  };

  return true;
}

function enforceAutomaticClose() {
  if (!state.session?.isLive || !state.session?.endsAt) return;

  const endsAt = new Date(state.session.endsAt);
  if (Number.isNaN(endsAt.getTime())) return;

  if (Date.now() >= endsAt.getTime()) {
    if (endSession("automatic-2am")) {
      console.log("");
      console.log("SESSION AUTO-CLOSED");
      console.log("Tipsys requests closed automatically at 2:00 AM.");
      broadcastState();
    }
  }
}

function normalizeQueue(requests) {
  const queued = requests
    .filter((request) => request.status === "queued")
    .sort(
      (a, b) =>
        (a.queuePosition ?? Number.MAX_SAFE_INTEGER) -
        (b.queuePosition ?? Number.MAX_SAFE_INTEGER)
    );

  const positions = new Map(
    queued.map((request, index) => [request.id, index + 1])
  );

  return requests.map((request) =>
    positions.has(request.id)
      ? { ...request, queuePosition: positions.get(request.id) }
      : request
  );
}

function updateRequest(requestId, updater) {
  let found = false;

  state.requests = state.requests.map((request) => {
    if (request.id !== requestId) return request;
    found = true;
    return updater(request);
  });

  return found;
}


function normalizedSongKey(requestOrSong) {
  const song = requestOrSong?.song ?? requestOrSong ?? {};
  return `${String(song.title || "").trim().toLowerCase()}::${String(
    song.artist || ""
  ).trim().toLowerCase()}`;
}

function requestEligibility(incomingRequest) {
  const sessionId = state.session?.sessionId;

  if (!state.session?.isLive || !sessionId) {
    return {
      allowed: false,
      message: "Requests are closed until the DJ starts a live session.",
    };
  }

  const key = normalizedSongKey(incomingRequest);
  const sameSong = state.requests.filter(
    (request) =>
      request.sessionId === sessionId &&
      normalizedSongKey(request) === key
  );

  if (
    sameSong.some((request) =>
      ["pending", "queued", "loaded"].includes(request.status)
    )
  ) {
    return {
      allowed: false,
      message: "That song is already pending, queued, or loaded tonight.",
    };
  }

  const lastPlayed = [...sameSong]
    .filter((request) => request.status === "played" && request.playedAt)
    .sort(
      (a, b) =>
        new Date(b.playedAt).getTime() - new Date(a.playedAt).getTime()
    )[0];

  if (lastPlayed) {
    const unlockAt =
      new Date(lastPlayed.playedAt).getTime() + 3 * 60 * 60 * 1000;

    if (Date.now() < unlockAt) {
      return {
        allowed: false,
        message: "That song was already played tonight. It has a 3-hour cooldown.",
      };
    }
  }

  const lastDeclined = [...sameSong]
    .filter((request) => request.status === "declined" && request.declinedAt)
    .sort(
      (a, b) =>
        new Date(b.declinedAt).getTime() -
        new Date(a.declinedAt).getTime()
    )[0];

  if (lastDeclined) {
    const playedAfter = state.requests.filter(
      (request) =>
        request.sessionId === sessionId &&
        request.status === "played" &&
        request.playedAt &&
        new Date(request.playedAt).getTime() >
          new Date(lastDeclined.declinedAt).getTime()
    ).length;

    if (playedAfter < 4) {
      return {
        allowed: false,
        message: `That song was declined. ${
          4 - playedAfter
        } more song(s) must be played before it can be requested again.`,
      };
    }
  }

  return { allowed: true };
}

function handleAction(action) {
  const { type, requestId } = action ?? {};
  if (!type || !requestId) return false;

  if (type === "approve") {
    const queued = state.requests.filter(
      (request) => request.status === "queued"
    );

    const nextPosition =
      queued.length === 0
        ? 1
        : Math.max(
            ...queued.map((request) => request.queuePosition ?? 0)
          ) + 1;

    return updateRequest(requestId, (request) => ({
      ...request,
      status: "queued",
      queuePosition: nextPosition,
      deck: null,
      loadedAt: null,
    }));
  }

  if (type === "decline" || type === "remove") {
    const changed = updateRequest(requestId, (request) => ({
      ...request,
      status: "declined",
      declinedAt: new Date().toISOString(),
      queuePosition: null,
      deck: null,
      loadedAt: null,
    }));

    state.requests = normalizeQueue(state.requests);
    return changed;
  }

  if (type === "move") {
    const queue = state.requests
      .filter((request) => request.status === "queued")
      .sort(
        (a, b) =>
          (a.queuePosition ?? 9999) - (b.queuePosition ?? 9999)
      );

    const currentIndex = queue.findIndex(
      (request) => request.id === requestId
    );

    if (currentIndex === -1) return false;

    const targetIndex =
      action.direction === "up" ? currentIndex - 1 : currentIndex + 1;

    if (targetIndex < 0 || targetIndex >= queue.length) return false;

    const currentItem = queue[currentIndex];
    const targetItem = queue[targetIndex];

    state.requests = state.requests.map((request) => {
      if (request.id === currentItem.id) {
        return { ...request, queuePosition: targetItem.queuePosition };
      }

      if (request.id === targetItem.id) {
        return { ...request, queuePosition: currentItem.queuePosition };
      }

      return request;
    });

    state.requests = normalizeQueue(state.requests);
    return true;
  }

  if (type === "load") {
    const deckNumber = Number(action.deckNumber);
    if (![1, 2].includes(deckNumber)) return false;

    const target = state.requests.find(
      (request) => request.id === requestId
    );
    if (!target) return false;

    const oldDeckRequest = state.requests.find(
      (request) =>
        request.status === "loaded" &&
        request.deck === deckNumber &&
        request.id !== requestId
    );

    if (oldDeckRequest) {
      state.requests = state.requests.map((request) => {
        if (request.id === oldDeckRequest.id) {
          return {
            ...request,
            status: "queued",
            queuePosition: 1,
            deck: null,
            loadedAt: null,
          };
        }

        if (request.status === "queued" && request.id !== requestId) {
          return {
            ...request,
            queuePosition: (request.queuePosition ?? 0) + 1,
          };
        }

        return request;
      });
    }

    updateRequest(requestId, (request) => ({
      ...request,
      status: "loaded",
      queuePosition: null,
      deck: deckNumber,
      loadedAt: new Date().toISOString(),
    }));

    state.requests = normalizeQueue(state.requests);
    return true;
  }

  if (type === "return-to-queue") {
    const target = state.requests.find(
      (request) => request.id === requestId
    );
    if (!target) return false;

    state.requests = state.requests.map((request) => {
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
          queuePosition: (request.queuePosition ?? 0) + 1,
        };
      }

      return request;
    });

    state.requests = normalizeQueue(state.requests);
    return true;
  }

  if (type === "played") {
    return updateRequest(requestId, (request) => ({
      ...request,
      status: "played",
      queuePosition: null,
      playedAt: new Date().toISOString(),
    }));
  }

  return false;
}

app.get("/", (req, res) => {
  res.json({
    app: "DJ Live",
    status: "online",
    realtime: "ready",
    persistence: "server-file",
    venueId: state.venueId,
    sessionLive: Boolean(state.session?.isLive),
    sessionEndsAt: state.session?.endsAt ?? null,
    requests: state.requests.length,
  });
});

app.get("/api/state", (req, res) => {
  res.json(state);
});


const seratoBridge = {
  lastSeenAt: null,
  lastEvent: null,
};

function normalizeTrackText(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/\b(feat|ft)\.?\b/g, " ")
    .replace(/\([^)]*(remix|edit|mix|version|clean|dirty|explicit)[^)]*\)/g, " ")
    .replace(/\[[^\]]*(remix|edit|mix|version|clean|dirty|explicit)[^\]]*\]/g, " ")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function trackMatchScore(request, incoming) {
  const requestedTitle = normalizeTrackText(request?.song?.title);
  const requestedArtist = normalizeTrackText(request?.song?.artist);
  const incomingTitle = normalizeTrackText(incoming?.title);
  const incomingArtist = normalizeTrackText(incoming?.artist);

  if (!requestedTitle || !incomingTitle) return 0;

  let score = 0;
  if (requestedTitle === incomingTitle) score += 70;
  else if (
    requestedTitle.includes(incomingTitle) ||
    incomingTitle.includes(requestedTitle)
  ) score += 55;

  if (requestedArtist && incomingArtist) {
    if (requestedArtist === incomingArtist) score += 30;
    else if (
      requestedArtist.includes(incomingArtist) ||
      incomingArtist.includes(requestedArtist)
    ) score += 20;
  }

  return score;
}

function applySeratoLoadedTrack({ deck, title, artist }) {
  const deckNumber = Number(deck);
  if (![1, 2].includes(deckNumber) || !title) {
    return { ok: false, message: "Invalid Serato deck event." };
  }

  seratoBridge.lastSeenAt = new Date().toISOString();
  seratoBridge.lastEvent = { deck: deckNumber, title, artist: artist || "" };

  const candidates = state.requests.filter((request) =>
    ["pending", "queued"].includes(request.status)
  );

  const ranked = candidates
    .map((request) => ({
      request,
      score: trackMatchScore(request, { title, artist }),
    }))
    .filter((item) => item.score >= 70)
    .sort((a, b) => b.score - a.score);

  if (ranked.length === 0) {
    return {
      ok: true,
      matched: false,
      message: "Track received from Serato; no matching active request.",
    };
  }

  const match = ranked[0].request;

  // If this requested track was still pending, approve it into the lifecycle.
  if (match.status === "pending") {
    match.status = "queued";
    const queueCount = state.requests.filter(
      (request) => request.status === "queued" && request.id !== match.id
    ).length;
    match.queuePosition = queueCount + 1;
  }

  // Return anything previously loaded on this deck to the front of the queue.
  for (const request of state.requests) {
    if (
      request.id !== match.id &&
      request.status === "loaded" &&
      request.deck === deckNumber
    ) {
      request.status = "queued";
      request.queuePosition = 1;
      request.deck = null;
      request.loadedAt = null;
    }
  }

  match.status = "loaded";
  match.queuePosition = null;
  match.deck = deckNumber;
  match.loadedAt = new Date().toISOString();

  state.requests = normalizeQueue(state.requests);
  saveState();
  broadcastState();

  console.log("");
  console.log("SERATO AUTO-MATCH");
  console.log(`Deck ${deckNumber}: ${title} - ${artist || "Unknown Artist"}`);
  console.log(`Matched request: ${match.song.title} - ${match.song.artist}`);

  return {
    ok: true,
    matched: true,
    requestId: match.id,
    score: ranked[0].score,
  };
}

// Authenticated receiving endpoint for the Serato companion.
app.post("/api/serato/loaded", (req, res) => {
  const configuredToken = process.env.SERATO_BRIDGE_TOKEN || "";
  const providedToken = req.get("x-serato-bridge-token") || "";

  if (!configuredToken || providedToken !== configuredToken) {
    return res.status(403).json({
      ok: false,
      message: "Serato bridge authentication failed.",
    });
  }

  const result = applySeratoLoadedTrack(req.body || {});
  res.status(result.ok ? 200 : 400).json(result);
});

app.get("/api/serato/status", (_req, res) => {
  res.json({
    lastSeenAt: seratoBridge.lastSeenAt,
    lastEvent: seratoBridge.lastEvent,
  });
});


io.on("connection", (socket) => {
  console.log(`DJ Live client connected: ${socket.id}`);
  socket.emit("server-state", state);

  socket.on("state-request", () => {
    enforceAutomaticClose();
    socket.emit("server-state", state);
  });

  socket.on("dj-login", (credentials) => {
    const account = verifyDjLogin(
      credentials?.username,
      credentials?.password
    );

    if (!account) {
      socket.emit("dj-login-result", {
        ok: false,
        message: "Incorrect DJ username or password.",
      });
      return;
    }

    const token = createDjToken(account);

    socket.emit("dj-login-result", {
      ok: true,
      token,
      user: publicDjUser(account),
    });
  });

  socket.on("dj-auth-check", ({ token } = {}) => {
    const account = authenticatedDj(token);

    socket.emit("dj-auth-status", {
      authenticated: Boolean(account),
      user: account ? publicDjUser(account) : null,
    });
  });

  socket.on("dj-profile-update", (payload) => {
    const account = authenticatedDj(payload?.token);

    if (!account) {
      socket.emit("dj-profile-result", {
        ok: false,
        message: "DJ login required.",
      });
      return;
    }

    const displayName =
      typeof payload?.displayName === "string"
        ? payload.displayName.trim()
        : "";

    if (!displayName || displayName.length > 40) {
      socket.emit("dj-profile-result", {
        ok: false,
        message: "Display name must be 1-40 characters.",
      });
      return;
    }

    account.displayName = displayName;
    account.updatedAt = new Date().toISOString();
    saveDjAuth();

    socket.emit("dj-profile-result", {
      ok: true,
      message: "DJ display name updated.",
      user: publicDjUser(account),
    });
  });

  socket.on("dj-password-change", (payload) => {
    const account = authenticatedDj(payload?.token);

    if (!account) {
      socket.emit("dj-password-result", {
        ok: false,
        message: "DJ login required.",
      });
      return;
    }

    if (!verifyPassword(account, payload?.currentPassword)) {
      socket.emit("dj-password-result", {
        ok: false,
        message: "Current password is incorrect.",
      });
      return;
    }

    const newPassword =
      typeof payload?.newPassword === "string"
        ? payload.newPassword
        : "";

    if (newPassword.length < 8) {
      socket.emit("dj-password-result", {
        ok: false,
        message: "New password must be at least 8 characters.",
      });
      return;
    }

    const salt = crypto.randomBytes(16).toString("hex");
    account.salt = salt;
    account.passwordHash = hashPassword(newPassword, salt);
    account.passwordChanged = true;
    account.updatedAt = new Date().toISOString();
    saveDjAuth();

    // Invalidate all other sessions for this DJ. Current token stays valid.
    for (const [token, session] of djSessions.entries()) {
      if (
        session.username === account.username &&
        token !== payload.token
      ) {
        djSessions.delete(token);
      }
    }

    socket.emit("dj-password-result", {
      ok: true,
      message: "Password changed successfully.",
    });
  });

  socket.on("dj-logout", ({ token } = {}) => {
    if (typeof token === "string") djSessions.delete(token);

    socket.emit("dj-auth-status", {
      authenticated: false,
      user: null,
    });
  });

  socket.on("session-action", (action) => {
    const djUser = authenticatedDj(action?.token);

    if (!djUser) {
      socket.emit("dj-auth-status", {
        authenticated: false,
        user: null,
      });
      return;
    }

    const type = action?.type;
    let changed = false;

    if (type === "start") changed = startSession();
    if (type === "end") changed = endSession("manual");

    if (changed) {
      console.log("");
      console.log("SESSION ACTION");
      console.log(`Type: ${type}`);
      console.log(`Session: ${state.session.sessionId ?? "none"}`);
      broadcastState();
    }
  });

  socket.on("request-create", (request, reply) => {
    enforceAutomaticClose();

    if (!request?.id || !request?.song?.title || !request?.song?.artist) {
      if (typeof reply === "function") {
        reply({ ok: false, message: "That request is missing song information." });
      }
      return;
    }

    const eligibility = requestEligibility(request);
    if (!eligibility.allowed) {
      if (typeof reply === "function") reply({ ok: false, ...eligibility });
      socket.emit("server-state", state);
      return;
    }

    const alreadyExists = state.requests.some(
      (existingRequest) => existingRequest.id === request.id
    );

    if (!alreadyExists) {
      state.requests.push({
        ...request,
        sessionId: state.session.sessionId,
        guestId:
          typeof request.guestId === "string"
            ? request.guestId.slice(0, 120)
            : null,
        status: "pending",
        queuePosition: null,
        deck: null,
        loadedAt: null,
        playedAt: null,
        declinedAt: null,
      });

      console.log("");
      console.log("NEW SONG REQUEST");
      console.log(`Song: ${request.song.title}`);
      console.log(`Artist: ${request.song.artist}`);
      console.log(`Requested by: ${request.name || "Guest"}`);
    }

    broadcastState();
    if (typeof reply === "function") reply({ ok: true });
  });

  socket.on("request-action", (action) => {
    const djUser = authenticatedDj(action?.token);

    if (!djUser) {
      socket.emit("dj-auth-status", {
        authenticated: false,
        user: null,
      });
      return;
    }

    const changed = handleAction(action);

    if (changed) {
      console.log("");
      console.log("REQUEST ACTION");
      console.log(`Type: ${action.type}`);
      console.log(`Request: ${action.requestId}`);
      broadcastState();
    }
  });

  socket.on("disconnect", () => {
    console.log(`DJ Live client disconnected: ${socket.id}`);
  });
});

setInterval(enforceAutomaticClose, 15000);
enforceAutomaticClose();

httpServer.listen(PORT, "0.0.0.0", () => {
  console.log("");
  console.log("=================================");
  console.log("       DJ LIVE BACKEND");
  console.log("=================================");
  console.log(`Server running on port ${PORT}`);
  console.log(`http://localhost:${PORT}`);
  console.log(`Persistent state: ${STATE_FILE}`);
  console.log(`Venue timezone: ${process.env.TZ}`);
  console.log(
    `Tipsys session: ${state.session?.isLive ? "LIVE" : "OFFLINE"}`
  );
  console.log("Server-authoritative realtime ready.");
  console.log("=================================");
  console.log("");
});
