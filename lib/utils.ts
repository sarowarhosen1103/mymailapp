export const truncateText = (text: string | undefined | null, maxLength: number) => {
  if (!text) return text || '';
  return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
};
