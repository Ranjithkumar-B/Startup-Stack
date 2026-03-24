import { useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";
import { getAuthToken } from "@/lib/api-client";
import { ws } from "@shared/routes";
import { z } from "zod";

type ActiveStudentEvent = z.infer<typeof ws.receive.student_active>;

export function useSocket() {
  const socketRef = useRef<Socket | null>(null);
  const [activeStudents, setActiveStudents] = useState<ActiveStudentEvent[]>([]);

  useEffect(() => {
    const token = getAuthToken();
    if (!token) return;

    // Connect to /ws namespace
    socketRef.current = io("/", {
      path: "/ws",
      auth: { token },
      transports: ["websocket", "polling"],
    });

    const socket = socketRef.current;

    socket.on("connect", () => {
      console.log("Socket connected");
    });

    socket.on("student_active", (data: any) => {
      try {
        const event = ws.receive.student_active.parse(data);
        setActiveStudents((prev) => {
          // Keep only the most recent event per student
          const filtered = prev.filter((p) => p.studentId !== event.studentId);
          return [event, ...filtered].slice(0, 50); // Keep last 50
        });
      } catch (e) {
        console.error("Invalid socket event format", e);
      }
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const emitStudentAction = (data: z.infer<typeof ws.send.student_action>) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit("student_action", data);
    }
  };

  return { activeStudents, emitStudentAction, socket: socketRef.current };
}
