import { Server } from "socket.io";

const setupSocketIO = (httpServer) => {
    const io = new Server(httpServer, {
        pingTimeout: 60000,
        cors: {
            origin: ["http://localhost:3000"],
            methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
            credentials: true,
        },
    });

    io.on("connection", (socket) => {
        console.log(`New client connected: ${socket.id}`);
        socket.emit("testEvent", { message: "Socket connection is working!" });

        socket.on("disconnect", () => {
            console.log(`Client disconnected: ${socket.id}`);
        });
    });

    return io;
};

export default setupSocketIO;
