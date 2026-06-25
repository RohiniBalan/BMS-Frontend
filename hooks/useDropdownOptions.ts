"use client";

import { useState, useEffect } from "react";
import { getDropdownOptions, DropdownOptions } from "@/services/optionsService";

const DEFAULT_OPTIONS: DropdownOptions = {
  batteryTypes: [],
  deviceStatuses: [],
  alertSeverities: [],
  alertStatuses: [],
  userRoles: [],
  userStatuses: [],
  assignmentStatuses: [],
};

// Module-level cache so all components share a single fetch across the session.
let cache: DropdownOptions | null = null;
let fetchPromise: Promise<DropdownOptions> | null = null;

export function useDropdownOptions() {
  const [options, setOptions] = useState<DropdownOptions>(cache ?? DEFAULT_OPTIONS);
  const [loading, setLoading] = useState(!cache);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (cache) {
      setOptions(cache);
      setLoading(false);
      return;
    }

    if (!fetchPromise) {
      fetchPromise = getDropdownOptions()
        .then((res) => {
          cache = res.data;
          return res.data;
        })
        .catch((err) => {
          fetchPromise = null;
          throw err;
        });
    }

    fetchPromise
      .then((data) => {
        setOptions(data);
        setLoading(false);
      })
      .catch((err: Error) => {
        setError(err.message || "Failed to load dropdown options");
        setLoading(false);
      });
  }, []);

  return { options, loading, error };
}
