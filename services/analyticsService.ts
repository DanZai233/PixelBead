export async function trackVisit(path: string, userAgent: string) {
  try {
    const response = await fetch('/api/analytics', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        path,
        userAgent,
      }),
    });

    if (!response.ok) {
      console.warn('Analytics API returned:', response.status);
    }
  } catch (error) {
    console.warn('Failed to track visit (this is normal in development):', error);
  }
}

export async function getAnalytics() {
  try {
    const response = await fetch('/api/analytics');

    if (!response.ok) {
      console.warn('Analytics API returned:', response.status);
      return null;
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.warn('Failed to get analytics (this is normal in development):', error);
    return null;
  }
}
