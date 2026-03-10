export async function trackVisit(path: string, userAgent: string) {
  try {
    await fetch('/api/analytics', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        path,
        userAgent,
      }),
    });
  } catch (error) {
    console.error('Failed to track visit:', error);
  }
}

export async function getAnalytics() {
  try {
    const response = await fetch('/api/analytics');
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Failed to get analytics:', error);
    return null;
  }
}
