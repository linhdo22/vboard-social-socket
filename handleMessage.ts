import { io } from ".";
import { MESSAGE_TYPE } from "./constants";

type MessageType = {
  type: MESSAGE_TYPE;
  toUserId: number;
  data: Record<string, any>;
};
export const handleMessage = async (message: string) => {
  try {
    const data: MessageType = JSON.parse(message);
    console.log(data.type, data.toUserId);
    io.to(data.toUserId + "").emit("message", data);
  } catch (error) {
    console.log(error);
  }
};
