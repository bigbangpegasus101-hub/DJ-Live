import { io } from "socket.io-client";

const backendUrl =
  import.meta.env.VITE_BACKEND_URL ||
 window.location.origin;

const socket = io(backendUrl, {
  autoConnect: true,
  reconnection: true,
  reconnectionAttempts: Infinity,
  reconnectionDelay: 500,
  reconnectionDelayMax: 5000,
  timeout: 10000,
});

socket.on("connect", () => {
  console.log(`DJ Live connected to backend: ${socket.id}`);
});

socket.on("disconnect", (reason) => {
  console.log(`DJ Live disconnected from backend: ${reason}`);
});

socket.on("connect_error", (error) => {
  console.warn(`DJ Live connection error: ${error.message}`);
});

export default socket;
