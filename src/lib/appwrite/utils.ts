export const assertResult = <T>(
  value: T | null | undefined,
  message: string
): T => {
  if (!value) {
    throw new Error(message);
  }

  return value;
};

export const parseTags = (tags?: string) =>
  tags?.replace(/ /g, "").split(",").filter(Boolean) || [];
