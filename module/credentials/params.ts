import { createLoader, parseAsInteger } from "nuqs/server";
import { DEFAULT_PAGE } from "@/module/meetings/constants";

export const filterSearchParams = {
  page: parseAsInteger
    .withDefault(DEFAULT_PAGE)
    .withOptions({ clearOnDefault: true }),
};

export const loadSearchParams = createLoader(filterSearchParams);
