export enum MESSAGE_TYPE {
  FRIEND_REQUEST = "FRIEND_REQUEST", // all data
  FRIEND_ACCEPT = "FRIEND_ACCEPT", // all data
  NOTIFICATION = "NOTIFICATION", // all data noti
  CHAT_MESSAGE = "CHAT_MESSAGE", // {chatID, messageData}
  CHAT_MESSAGE_LAST_SEEN = "CHAT_MESSAGE_LAST_SEEN", // {roomId,userId,lastSeen}
}
