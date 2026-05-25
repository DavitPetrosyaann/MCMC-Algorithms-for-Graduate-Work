import { useCallback, useState } from "react";

export default function useRevealOnInput() {
  const [isMetaVisible, setIsMetaVisible] = useState(false);

  const revealMeta = useCallback(() => {
    setIsMetaVisible(true);
  }, []);

  return { isMetaVisible, revealMeta };
}
