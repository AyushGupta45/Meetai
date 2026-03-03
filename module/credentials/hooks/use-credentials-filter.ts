import { DEFAULT_PAGE } from "@/module/meetings/constants";
import { parseAsInteger, useQueryStates } from "nuqs";

export const useCredentialsFilters = () => {
  return useQueryStates({
    page: parseAsInteger
      .withDefault(DEFAULT_PAGE)
      .withOptions({ clearOnDefault: true }),
  });
};
