export interface User{
    id: string;
    name: string;
    email: string;
    phoneNumber: string | null;
    role: "ADMIN" | "USER";
    status: "Active" | "Inactive";
    lastLoginAt: string | null;
    assignedDevices: number;
}