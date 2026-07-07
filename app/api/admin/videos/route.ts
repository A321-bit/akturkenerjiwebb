import { makeListCreateHandlers } from "@/lib/admin-crud";

const { GET, POST } = makeListCreateHandlers("site_videos");
export { GET, POST };
