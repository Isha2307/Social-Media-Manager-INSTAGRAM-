export const API_BASE_URL = 'http://localhost:3001/api/v1';

/**
 * Initiates the Instagram login flow by redirecting the user to the backend.
 * The backend redirects them to Meta.
 */
export const connectInstagram = () => {
  window.location.href = `${API_BASE_URL}/instagram/auth/login`;
};

/**
 * Publishes a post to the connected Instagram account.
 */
export const publishPost = async (userId: string, mediaUrl: string, mediaType: 'IMAGE' | 'VIDEO', caption?: string) => {
  const response = await fetch(`${API_BASE_URL}/instagram/posts/publish`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      userId,
      mediaUrl,
      mediaType,
      caption,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Failed to publish post');
  }

  return response.json();
};
