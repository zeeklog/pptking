export function prettyObject(msg: any): string {
  if (typeof msg !== "string") {
    try {
      const obj = JSON.stringify(msg, null, "  ");
      if (obj === "{}") {
        return msg.toString();
      }
      return obj;
    } catch (e) {
      return msg.toString();
    }
  }

  return msg;
}

export function trimTopic(topic: string) {
  // Fix an issue where double quotes still show in the Indonesian language
  // This will remove the leading and trailing double quotes, if they exist.
  return topic.replace(/^"+|"+$/g, "");
}
