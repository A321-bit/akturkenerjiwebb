import { makeListCreateHandlers } from "@/lib/admin-crud";

const { GET, POST } = makeListCreateHandlers("services");
export { GET, POST };
