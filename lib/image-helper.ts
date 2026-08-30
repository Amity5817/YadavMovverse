// lib/image-helper.ts
export function getImageUrl(url: any): string {
  if (!url) return "";
  
  // If it's an object with url property
  if (typeof url === 'object' && url.url) {
    return getImageUrl(url.url);
  }
  
  // If it's a string
  if (typeof url === 'string') {
    // If it's already a full URL
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }
    // If it's a relative path
    if (url.startsWith('/')) {
      return `https://h5-api.aoneroom.com${url}`;
    }
    // If it's just a filename
    if (url.length > 0) {
      return `https://h5-api.aoneroom.com/${url}`;
    }
  }
  
  return "";
}

export function extractCover(item: any): string {
  // Try all possible locations
  const cover = 
    item?.cover?.url ||
    item?.cover ||
    item?.poster?.url ||
    item?.poster ||
    item?.image?.url ||
    item?.image ||
    item?.subject?.cover?.url ||
    item?.subject?.cover ||
    item?.subject?.poster?.url ||
    item?.subject?.poster ||
    "";
  
  return getImageUrl(cover);
}