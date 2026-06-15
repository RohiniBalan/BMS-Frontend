import { apiFetch } from "./apiClient";

export const getUsers = (
  page: number = 1,
  limit: number = 30
) =>
  apiFetch(`/users?page=${page}&limit=${limit}`);