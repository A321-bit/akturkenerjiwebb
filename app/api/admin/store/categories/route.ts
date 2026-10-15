import { makeListCreateHandlers } from "@/lib/admin-crud";

export const { GET, POST } = makeListCreateHandlers("store_categories");
