export function getAuthToken() {
  return localStorage.getItem("auth_token");
}

export function setAuthToken(token: string) {
  localStorage.setItem("auth_token", token);
}

export function clearAuthToken() {
  localStorage.removeItem("auth_token");
}

export async function fetchApi(url: string, options: RequestInit = {}) {
  const token = getAuthToken();
  const headers = new Headers(options.headers || {});
  
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }
  
  if (!headers.has("Content-Type") && options.body && typeof options.body === 'string') {
    headers.set("Content-Type", "application/json");
  }

  const res = await fetch(url, { ...options, headers });
  
  if (res.status === 401) {
    clearAuthToken();
  }

  if (!res.ok) {
    let errorMessage = res.statusText;
    try {
      const errorData = await res.json();
      errorMessage = errorData.message || errorMessage;
    } catch (e) {
      // Ignore parse error
    }
    const error: any = new Error(errorMessage);
    error.response = { data: { message: errorMessage }, status: res.status };
    throw error;
  }

  if (res.status === 204) return null;
  
  return res.json();
}

export const apiClient = {
  get: async (url: string) => {
    const response = await fetchApi(url, { method: 'GET' });
    return { data: response };
  },
  post: async (url: string, data: any) => {
    const response = await fetchApi(url, { 
      method: 'POST',
      body: JSON.stringify(data),
      headers: { 'Content-Type': 'application/json' }
    });
    return { data: response };
  },
  delete: async (url: string) => {
    const response = await fetchApi(url, { method: 'DELETE' });
    return { data: response };
  }
};
