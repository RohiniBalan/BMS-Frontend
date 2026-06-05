import { apiFetch } from "./apiClient";

export const getUsers = () =>
  apiFetch("/users");