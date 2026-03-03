"use client";

import { useState } from "react";

export function useLoadingState(initialValue = false) {
  const [isLoading, setIsLoading] = useState(initialValue);
  return { isLoading, setIsLoading };
}
