import { makeListCreateHandlers } from "@/lib/admin-crud";

const { GET, POST } = makeListCreateHandlers("project_references");
export { GET, POST };
