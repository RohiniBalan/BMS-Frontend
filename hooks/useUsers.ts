import { useEffect, useState } from "react";
import { getUsers } from "@/services/userService";
import { User } from "@/types/user";

export const useUsers = () => {
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<User[]>([]);

  useEffect(() => {
    const load = async () => {
      try {
        const response = await getUsers();
        setUsers(response.data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  return {
    loading,
    users,
  };
};