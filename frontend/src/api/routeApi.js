const API_BASE_URL = import.meta.env.VITE_ROUTE_API_URL ?? 'http://localhost:5000';

export async function forgeRoute(payload) {
  const response = await fetch(`${API_BASE_URL}/route`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error || 'Failed to forge route');
  }

  return data;
}
