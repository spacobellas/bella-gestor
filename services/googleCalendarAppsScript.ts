export async function createCalendarEvent(eventData: any) {
  try {
    const response = await fetch("/api/calendar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "create",
        eventData: JSON.stringify(eventData),
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error creating calendar event:", error);
    return { success: false, error: String(error) };
  }
}

export async function updateCalendarEvent(eventId: string, eventData: any) {
  try {
    const response = await fetch("/api/calendar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "update",
        eventId,
        eventData: JSON.stringify(eventData),
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error updating calendar event:", error);
    return { success: false, error: String(error) };
  }
}

export async function deleteCalendarEvent(eventId: string) {
  try {
    const response = await fetch("/api/calendar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "delete", eventId }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error deleting calendar event:", error);
    return { success: false, error: String(error) };
  }
}

export async function listCalendarEvents(timeMin?: string, timeMax?: string) {
  try {
    const payload: any = {
      action: "list",
      timeMin: timeMin || new Date().toISOString(),
    };
    if (timeMax) payload.timeMax = timeMax;

    const response = await fetch("/api/calendar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error listing calendar events:", error);
    return { success: false, error: String(error), events: [] };
  }
}
