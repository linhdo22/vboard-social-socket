import { createClient } from "redis";
import { handleMessage } from "./handleMessage";

const STREAM_NAME = "socket-queue";

export async function listen() {
  const client = createClient();
  await client.connect();

  let lastId = "$";

  while (true) {
    try {
      const result = await client.xRead(
        {
          key: STREAM_NAME,
          id: lastId,
        },
        { BLOCK: 0 }
      );
      if (result) {
        const messages = result[0].messages;
        lastId = messages[messages.length - 1].id;
        for (let i = 0; i < messages.length; i++) {
          handleMessage(messages[i].message.message);
        }
      }
    } catch (error) {
      console.log(error);
    }
  }
}
