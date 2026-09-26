import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import cors from "cors";

const app = express();
const httpServer = createServer(app);

const PORT = 3001;

app.use(cors());
app.use(express.json());

const io = new Server(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

app.get("/", (req, res) => {
  res.json({
    app: "DJ Live",
    status: "online",
    realtime: "ready",
  });
});

io.on("connection", (socket) => {
  console.log(`DJ Live client connected: ${socket.id}`);

  socket.on("song-request", (request) => {
    console.log("");
    console.log("NEW SONG REQUEST");
    console.log(`Song: ${request.song?.title}`);
    console.log(`Artist: ${request.song?.artist}`);
    console.log(`Requested by: ${request.name}`);

    io.emit("song-request", request);
  });

  socket.on("request-status-update", (request) => {
    console.log("");
    console.log("REQUEST STATUS UPDATE");
    console.log(`Song: ${request.song?.title}`);
    console.log(`Status: ${request.status}`);

    io.emit("request-status-update", request);
  });

  socket.on("requests-batch-update", (requests) => {
    console.log("");
    console.log("REQUESTS BATCH UPDATE");
    console.log(`Requests synced: ${requests.length}`);

    io.emit("requests-batch-update", requests);
  });

  socket.on("disconnect", () => {
    console.log(`DJ Live client disconnected: ${socket.id}`);
  });
});

httpServer.listen(PORT, () => {
  console.log("");
  console.log("=================================");
  console.log("       DJ LIVE BACKEND");
  console.log("=================================");
  console.log(`Server running on port ${PORT}`);
  console.log(`http://localhost:${PORT}`);
  console.log("Realtime server ready.");
  console.log("=================================");
  console.log("");
});