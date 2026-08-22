/**
 * NYASA API Client
 * Communicates with the FastAPI backend.
 */

import type { VerificationResponse } from '../types/verification';

const API_BASE = '/api/v1';

export async function submitVerification(
  claim: string,
  image?: File | null,
): Promise<VerificationResponse> {
  const formData = new FormData();
  formData.append('claim', claim);
  if (image) {
    formData.append('image', image);
  }

  const response = await fetch(`${API_BASE}/verify`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Verification failed' }));
    throw new Error(error.detail || `HTTP ${response.status}`);
  }

  return response.json();
}

export async function healthCheck(): Promise<{
  status: string;
  gemini_configured: boolean;
  tavily_configured: boolean;
}> {
  const response = await fetch('/health');
  return response.json();
}
