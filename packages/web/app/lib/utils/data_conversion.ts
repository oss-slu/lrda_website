export function formatDateTime(date: any) {
  if (!(date instanceof Date) || isNaN(date.getTime())) {
    return 'Pick a date'; // Handle invalid dates
  }

  const hours = date.getHours();
  const minutes = date.getMinutes();
  const formattedHours = hours % 12 === 0 ? 12 : hours % 12;
  const formattedMinutes = minutes < 10 ? `0${minutes}` : minutes;
  const ampm = hours < 12 ? 'AM' : 'PM';

  return `${date.toDateString()} ${formattedHours}:${formattedMinutes} ${ampm}`;
}

export function format12hourTime(date: any) {
  if (!(date instanceof Date) || isNaN(date.getTime())) {
    return 'Pick a date'; // Handle invalid dates
  }

  const hours = date.getHours();
  const minutes = date.getMinutes();
  const formattedHours = hours % 12 === 0 ? 12 : hours % 12;
  const formattedMinutes = minutes < 10 ? `0${minutes}` : minutes;
  const ampm = hours < 12 ? 'AM' : 'PM';

  return `${formattedHours}:${formattedMinutes} ${ampm}`;
}
