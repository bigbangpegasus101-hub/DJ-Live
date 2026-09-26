import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import cors from "cors";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const app = express();
const httpServer = createServer(app);
const PORT = Number(process.env.PORT) || 3001;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.join(__dirname, "data");
const STATE_FILE = path.join(DATA_DIR, "dj-live-state.json");

app.use(cors());
app.use(express.json());

const io = new Server(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

function emptyState() {
  return {
    version: 1,
    venueId: "tipsys",
    requests: [],
    updatedAt: new Date().toISOString(),
  };
}

function loadState() {
  try {
    fs.mkdirSync(DATA_DIR, { recursive: true });

    if (!fs.existsSync(STATE_FILE)) {
      const initialState = emptyState();
      fs.writeFileSync(
        STATE_FILE,
        JSON.stringify(initialState, null, 2)
      );
      return initialState;
    }

    const parsed = JSON.parse(fs.readFileSync(STATE_FILE, "utf8"));

    return {
      ...emptyState(),
      ...parsed,
      requests: Array.isArray(parsed.requests)
        ? parsed.requests
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
    fs.writeFileSync(
      temporaryFile,
      JSON.stringify(state, null, 2)
    );
    fs.renameSync(temporaryFile, STATE_FILE);
  } catch (error) {
    console.error("Could not save DJ Live state:", error);
  }
}

function broadcastState() {
  saveState();
  io.emit("server-state", state);
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
      ? {
          ...request,
          queuePosition: positions.get(request.id),
        }
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
            ...queued.map(
              (request) => request.queuePosition ?? 0
            )
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
    const changed = updateRequest(
      requestId,
      (request) => ({
        ...request,
        status: "declined",
        queuePosition: null,
        deck: null,
        loadedAt: null,
      })
    );

    state.requests = normalizeQueue(state.requests);
    return changed;
  }

  if (type === "move") {
    const queue = state.requests
      .filter((request) => request.status === "queued")
      .sort(
        (a, b) =>
          (a.queuePosition ?? 9999) -
          (b.queuePosition ?? 9999)
      );

    const currentIndex = queue.findIndex(
      (request) => request.id === requestId
    );

    if (currentIndex === -1) return false;

    const targetIndex =
      action.direction === "up"
        ? currentIndex - 1
        : currentIndex + 1;

    if (targetIndex < 0 || targetIndex >= queue.length) {
      return false;
    }

    const currentItem = queue[currentIndex];
    const targetItem = queue[targetIndex];

    state.requests = state.requests.map((request) => {
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

        if (
          request.status === "queued" &&
          request.id !== requestId
        ) {
          return {
            ...request,
            queuePosition:
              (request.queuePosition ?? 0) + 1,
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
          queuePosition:
            (request.queuePosition ?? 0) + 1,
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
    requests: state.requests.length,
  });
});

app.get("/api/state", (req, res) => {
  res.json(state);
});

io.on("connection", (socket) => {
  console.log(`DJ Live client connected: ${socket.id}`);
  socket.emit("server-state", state);

  socket.on("state-request", () => {
    socket.emit("server-state", state);
  });

  socket.on("request-create", (request) => {
    if (
      !request?.id ||
      !request?.song?.title ||
      !request?.song?.artist
    ) {
      return;
    }

    const alreadyExists = state.requests.some(
      (existingRequest) =>
        existingRequest.id === request.id
    );

    if (!alreadyExists) {
      state.requests.push({
        ...request,
        guestId:
          typeof request.guestId === "string"
            ? request.guestId.slice(0, 120)
            : null,
        status: "pending",
        queuePosition: null,
        deck: null,
        loadedAt: null,
        playedAt: null,
      });

      console.log("");
      console.log("NEW SONG REQUEST");
      console.log(`Song: ${request.song.title}`);
      console.log(`Artist: ${request.song.artist}`);
      console.log(
        `Requested by: ${request.name || "Guest"}`
      );
    }

    broadcastState();
  });

  socket.on("request-action", (action) => {
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
    console.log(
      `DJ Live client disconnected: ${socket.id}`
    );
  });
});

httpServer.listen(PORT, "0.0.0.0", () => {
  console.log("");
  console.log("=================================");
  console.log("       DJ LIVE BACKEND");
  console.log("=================================");
  console.log(`Server running on port ${PORT}`);
  console.log(`http://localhost:${PORT}`);
  console.log(`Persistent state: ${STATE_FILE}`);
  console.log("Server-authoritative realtime ready.");
  console.log("=================================");
  console.log("");
});