export default async function handler(request, response) {
  response.setHeader('Cache-Control', 'no-store');
  if (request.method !== 'GET') {
    response.setHeader('Allow', 'GET');
    return response.status(405).json({ error: 'Method not allowed' });
  }
  try {
    const upstream = await fetch(
      'https://firststep-india-jobs.wigglyfern512.chatgpt.site/api/health',
      { signal: AbortSignal.timeout(15000) },
    );
    if (!upstream.ok)
      return response.status(502).json({ error: 'Status unavailable' });
    const health = await upstream.json();
    if (typeof health.count !== 'number' || !health.updatedAt)
      return response.status(502).json({ error: 'Invalid status response' });
    return response
      .status(200)
      .json({
        ...health,
        checkedAt: new Date().toISOString(),
        schedule: 'Daily at 07:00 Asia/Kolkata',
        scheduleNote:
          'Configured schedule; this endpoint does not verify scheduler execution.',
      });
  } catch {
    return response
      .status(502)
      .json({ error: 'Could not reach the collection service' });
  }
}
