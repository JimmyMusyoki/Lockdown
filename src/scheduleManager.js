function parseTime(value) {
  const match = /^(\d{2}):(\d{2})$/.exec(String(value || ''));
  if (!match) return null;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (hours > 23 || minutes > 59) return null;
  return hours * 60 + minutes;
}

function dayMatches(schedule, date) {
  const days = Array.isArray(schedule.days) ? schedule.days.map(Number) : [];
  return days.includes(date.getDay());
}

function activeWindow(schedule, date = new Date()) {
  if (!schedule || schedule.enabled === false) return null;
  const start = parseTime(schedule.start);
  const end = parseTime(schedule.end);
  if (start === null || end === null || start === end) return null;
  const current = date.getHours() * 60 + date.getMinutes();
  const overnight = end < start;
  if (!overnight && dayMatches(schedule, date) && current >= start && current < end) {
    return { endDate: new Date(date.getFullYear(), date.getMonth(), date.getDate(), Math.floor(end / 60), end % 60) };
  }
  if (overnight && dayMatches(schedule, date) && current >= start) {
    return { endDate: new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1, Math.floor(end / 60), end % 60) };
  }
  if (overnight) {
    const previous = new Date(date);
    previous.setDate(previous.getDate() - 1);
    if (dayMatches(schedule, previous) && current < end) {
      return { endDate: new Date(date.getFullYear(), date.getMonth(), date.getDate(), Math.floor(end / 60), end % 60) };
    }
  }
  return null;
}

function activeSchedules(schedules, date = new Date()) {
  return (Array.isArray(schedules) ? schedules : []).map((schedule) => ({ schedule, window: activeWindow(schedule, date) })).filter((item) => item.window);
}

module.exports = { parseTime, activeWindow, activeSchedules };
