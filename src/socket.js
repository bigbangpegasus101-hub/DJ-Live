import { io } from "socket.io-client";

const socket = io("http://localhost:3001", {
  autoConnect: true,
});

socket.on("connect", () => {
  console.log(
    `DJ Live connected to backend: ${socket.id}`
  );
});

socket.on("disconnect", () => {
  console.log("DJ Live disconnected from backend");
});

export default socket;