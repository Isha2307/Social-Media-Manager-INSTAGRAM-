import React, { useState } from 'react';
import { publishPost } from './api-client';

interface Props {
  userId: string; // The ID of the authenticated user in your system
}

export const InstagramPostForm: React.FC<Props> = ({ userId }) => {
  const [caption, setCaption] = useState('');
  const [mediaUrl, setMediaUrl] = useState('');
  const [mediaType, setMediaType] = useState<'IMAGE' | 'VIDEO'>('IMAGE');
  const [status, setStatus] = useState<'IDLE' | 'LOADING' | 'SUCCESS' | 'ERROR'>('IDLE');
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('LOADING');
    try {
      await publishPost(userId, mediaUrl, mediaType, caption);
      setStatus('SUCCESS');
    } catch (error: any) {
      setErrorMessage(error.message);
      setStatus('ERROR');
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px', maxWidth: '500px' }}>
      <h3>Create Instagram Post</h3>
      
      <div>
        <label>Media Type:</label>
        <select value={mediaType} onChange={(e) => setMediaType(e.target.value as 'IMAGE' | 'VIDEO')}>
          <option value="IMAGE">Image</option>
          <option value="VIDEO">Video</option>
        </select>
      </div>

      <div>
        <label>Media URL (Must be a public URL like S3, Cloudinary):</label>
        <input 
          type="url" 
          value={mediaUrl} 
          onChange={(e) => setMediaUrl(e.target.value)} 
          required 
          placeholder="https://example.com/image.jpg"
          style={{ width: '100%', padding: '8px' }}
        />
      </div>

      <div>
        <label>Caption:</label>
        <textarea 
          value={caption} 
          onChange={(e) => setCaption(e.target.value)} 
          placeholder="Write a caption..."
          rows={4}
          style={{ width: '100%', padding: '8px' }}
        />
      </div>

      <button type="submit" disabled={status === 'LOADING'} style={{ padding: '10px', backgroundColor: '#0095f6', color: 'white', border: 'none' }}>
        {status === 'LOADING' ? 'Publishing...' : 'Publish to Instagram'}
      </button>

      {status === 'SUCCESS' && <p style={{ color: 'green' }}>Post published successfully!</p>}
      {status === 'ERROR' && <p style={{ color: 'red' }}>Error: {errorMessage}</p>}
    </form>
  );
};
