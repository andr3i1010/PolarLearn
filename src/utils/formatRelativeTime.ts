/**
 * Formats a date into a relative time string in Dutch (e.g., "zojuist", "5 minuten geleden", "gisteren")
 */
export function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  // Just now (less than a minute)
  if (diffInSeconds < 60) {
    return 'zojuist';
  }
  
  // Minutes (less than an hour)
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return diffInMinutes === 1 ? '1 minuut geleden' : `${diffInMinutes} minuten geleden`;
  }
  
  // Hours (less than a day)
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return diffInHours === 1 ? '1 uur geleden' : `${diffInHours} uur geleden`;
  }
  
  // Check if it was yesterday
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  if (date.getDate() === yesterday.getDate() && 
      date.getMonth() === yesterday.getMonth() && 
      date.getFullYear() === yesterday.getFullYear()) {
    return 'gisteren';
  }
  
  // Days (less than a week)
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) {
    return diffInDays === 1 ? '1 dag geleden' : `${diffInDays} dagen geleden`;
  }
  
  // Weeks (less than a month)
  const diffInWeeks = Math.floor(diffInDays / 7);
  if (diffInWeeks < 5) {
    return diffInWeeks === 1 ? '1 week geleden' : `${diffInWeeks} weken geleden`;
  }
  
  // Months or longer: format as date
  const options: Intl.DateTimeFormatOptions = { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  };
  return date.toLocaleDateString('nl-NL', options);
}
