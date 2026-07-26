import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { useSession } from "@/session/SessionContext";
import { getMessagesUnread } from "@/api/messages-api";
import { getNotificationsUnread } from "@/api/notifications-api";

// polls unread badges for the navbar; also refreshes on route change so counts feel live
export function useUnreadCounts(): { messages: number; notifications: number } {
  const { state } = useSession();
  const location = useLocation();
  const [messages, setMessages] = useState(0);
  const [notifications, setNotifications] = useState(0);

  useEffect(() => {
    if (state.status !== "signedIn") {
      setMessages(0);
      setNotifications(0);
      return;
    }
    let active = true;
    async function tick() {
      const [m, n] = await Promise.all([getMessagesUnread(), getNotificationsUnread()]);
      if (active) {
        setMessages(m);
        setNotifications(n);
      }
    }
    void tick();
    const timer = window.setInterval(() => void tick(), 15000);
    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, [state.status, location.pathname]);

  return { messages, notifications };
}
