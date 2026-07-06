import { makeListCreateHandlers } from "@/lib/admin-crud";

const { GET, POST } = makeListCreateHandlers("testimonials");
export { GET, POST };
