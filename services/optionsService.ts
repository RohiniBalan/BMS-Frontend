import { apiFetch } from "./apiClient";

export interface DropdownOption {
  value: string;
  label: string;
}

export interface DropdownOptions {
  batteryTypes: DropdownOption[];
  deviceStatuses: DropdownOption[];
  alertSeverities: DropdownOption[];
  alertStatuses: DropdownOption[];
  userRoles: DropdownOption[];
  userStatuses: DropdownOption[];
  assignmentStatuses: DropdownOption[];
}

export const getDropdownOptions = (): Promise<{ success: boolean; data: DropdownOptions }> =>
  apiFetch("/options");
