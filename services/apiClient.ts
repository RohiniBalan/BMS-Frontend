const API_BASE = process.env.NEXT_PUBLIC_API;

export const apiFetch = async (url: string, options: RequestInit = {}) => {
  const token = localStorage.getItem("accessToken");
  console.log("TOKEN:", token);

  const res = await fetch(`${API_BASE}${url}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.message || "Unauthorized or API Error");
  }

  return data;
};