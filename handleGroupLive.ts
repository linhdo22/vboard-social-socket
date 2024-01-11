import { Server, Socket } from "socket.io";
import { DefaultEventsMap } from "socket.io/dist/typed-events";

type TGroupMap = Record<
  string,
  {
    participants: number[];
  }
>;

const groupMap: TGroupMap = {};

const getParticipants = (groupId: string) => {
  return groupMap[groupId]?.participants;
};

const joinGroup = (groupId: string, userId: number) => {
  if (!groupMap[groupId]) groupMap[groupId] = { participants: [] };
  if (groupMap[groupId]?.participants.find((p) => p === userId)) return;
  groupMap[groupId]?.participants.push(userId);
};
const leaveGroup = (groupId: string, userId: number) => {
  if (!groupMap[groupId]) groupMap[groupId] = { participants: [] };
  groupMap[groupId].participants = groupMap[groupId]?.participants.filter(
    (p) => p !== userId
  );
};

export const handleGroupLive = ({
  io,
  socket,
  userId,
}: {
  io: Server<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, any>;
  socket: Socket<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, any>;
  userId: number;
}) => {
  let currentGroup = "";

  socket.on(
    "join-live",
    (groupId: string, cb: (participants?: number[]) => void) => {
      currentGroup = groupId;
      socket.join(groupId);
      joinGroup(groupId, userId);
      socket.to(groupId).emit("user-join");
      cb(getParticipants(groupId));
    }
  );
  socket.on(
    "leave-live",
    (groupId: string, cb: (participants?: number[]) => void) => {
      currentGroup = "";
      socket.leave(groupId);
      leaveGroup(groupId, userId);
      socket.to(groupId).emit("user-leave");
      cb(getParticipants(groupId));
    }
  );
  socket.on(
    "trigger-action",
    (groupId: string, cb: (data: boolean) => void) => {
      socket.in(groupId).emit("trigger-action", userId);
      cb(true);
    }
  );
  socket.on(
    "get-live-participants",
    (groupId: string, cb: (participants?: number[]) => void) => {
      cb(getParticipants(groupId));
    }
  );
  return () => {
    if (currentGroup) {
      leaveGroup(currentGroup, userId);
    }
  };
};
