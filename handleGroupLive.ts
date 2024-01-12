import { Server, Socket } from "socket.io";
import { DefaultEventsMap } from "socket.io/dist/typed-events";

type TGroupMap = Record<
  string,
  {
    hostId?: number;
    isLive: boolean;
    participants: number[];
  }
>;

const groupMap: TGroupMap = {};

const checkExist = (groupId: string) => {
  if (!groupMap[groupId])
    groupMap[groupId] = { participants: [], isLive: false };
};

const getGroupState = (groupId: string) => {
  checkExist(groupId);
  return groupMap[groupId];
};
const startLive = (groupId: string, hostId: number) => {
  checkExist(groupId);
  groupMap[groupId].isLive = true;
  groupMap[groupId].hostId = hostId;
};
const offLive = (groupId: string) => {
  checkExist(groupId);
  groupMap[groupId].isLive = false;
  groupMap[groupId].participants = [];
};
const joinLive = (groupId: string, userId: number) => {
  checkExist(groupId);
  if (groupMap[groupId]?.participants.find((p) => p === userId)) return;
  groupMap[groupId]?.participants.push(userId);
};
const leaveLive = (groupId: string, userId: number) => {
  checkExist(groupId);
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
    "subscribe-group",
    (groupId: string, cb: (data: { isLive: boolean }) => void) => {
      currentGroup = "";
      socket.join(groupId);
      const state = getGroupState(groupId);
      cb({ isLive: state.isLive });
    }
  );
  socket.on("unsubscribe-group", (groupId: string) => {
    socket.leave(groupId);
    currentGroup = "";
  });

  socket.on("start-live", (groupId: string, cb: (result: boolean) => void) => {
    startLive(groupId, userId);
    socket.in(groupId).emit("start-live");
    cb(true);
  });
  socket.on("off-live", (groupId: string, cb: (result: boolean) => void) => {
    offLive(groupId);
    socket.to(groupId).emit("off-live");
    io.in(groupId).socketsLeave(`live-${groupId}`);
    cb(true);
  });

  socket.on(
    "join-live",
    (
      groupId: string,
      cb: (payload: { participants?: number[]; hostId?: number }) => void
    ) => {
      socket.join(`live-${groupId}`);
      joinLive(groupId, userId);
      socket.to(`live-${groupId}`).emit("user-join");
      const gState = getGroupState(groupId);
      cb({ participants: gState.participants, hostId: gState.hostId });
    }
  );
  socket.on(
    "leave-live",
    (groupId: string, cb: (participants?: number[]) => void) => {
      const gState = getGroupState(groupId);
      if (gState.hostId === userId) {
        offLive(groupId);
        socket.to(groupId).emit("off-live");
        io.in(groupId).socketsLeave(`live-${groupId}`);
      } else {
        socket.leave(`live-${groupId}`);
        leaveLive(groupId, userId);
        socket.to(`live-${groupId}`).emit("user-leave");
      }
    }
  );
  socket.on("send-live-data", (groupId: string, data: string) => {
    socket.in(`live-${groupId}`).emit("send-live-data", data);
  });
  socket.on("erase-live-data", (groupId: string) => {
    socket.in(`live-${groupId}`).emit("erase-live-data");
  });
  socket.on(
    "trigger-action",
    (groupId: string, cb: (data: boolean) => void) => {
      socket.in(`live-${groupId}`).emit("trigger-action", userId);
      cb(true);
    }
  );
  socket.on(
    "get-live-participants",
    (groupId: string, cb: (participants?: number[]) => void) => {
      cb(getGroupState(groupId).participants);
    }
  );
  return () => {
    if (currentGroup) {
      const gState = getGroupState(currentGroup);
      if (gState.hostId === userId) {
        offLive(currentGroup);
        socket.to(currentGroup).emit("off-live");
        io.in(currentGroup).socketsLeave(`live-${currentGroup}`);
      }
      leaveLive(currentGroup, userId);
    }
  };
};
