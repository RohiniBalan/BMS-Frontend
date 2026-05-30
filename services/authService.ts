const AUTH_BASE = process.env.NEXT_PUBLIC_API;

interface SignUpPayload {
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
  phoneNumber: string;
}

export interface AuthResponse {
  message: string;
  success?: boolean;
  user?: {
    id?: string;
    fullName?: string;
    email?: string;
    role?: "ADMIN" | "USER";
  };
}

// REGISTER
export const signup = async (payload: SignUpPayload): Promise<AuthResponse> =>{
    const res = await fetch(`${AUTH_BASE}/auth/register`, {
        method: "POST",
        headers:{
            "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
    });

    const data = await res.json();

    if(!res.ok){
        throw new Error(data.message || "Signup failed");
    }

    return data;
}

// LOGIN
export const login = async (email: string, password: string) =>{
    const res = await fetch(`${AUTH_BASE}/auth/login`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({email, password})
    });

    const data = await res.json();

    if(!res.ok){
        throw new Error(
            data.message || "Login failed"
        )
    }

    // SAVE TOKEN
if (data.data?.accessToken) {
    localStorage.setItem("accessToken", data.data.accessToken);
}
    return data;
}

// FORFOT PASSWORD
export const forgotPassword = (email: string) =>{
    return fetch(`${AUTH_BASE}/auth/forgot-password`,{
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({email})
    })
}

// RESET PASSWORD
export const resetPassword = (token: string,newPassword: string) =>{
    return fetch (`${AUTH_BASE}/auth/reset-password`, {
        "method": "POST",
        "headers": {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({token, password: newPassword})
    }).then((res) => res.json());
}

// GOOGLE AUTHENTICATION
export const googleLogin =
() => {

  window.location.href =
`${AUTH_BASE}/auth/google`;
};

// MICROSOFT AUTHENTICATION
export const microsoftLogin =
() => {

  window.location.href =
`${AUTH_BASE}/auth/microsoft`;

};