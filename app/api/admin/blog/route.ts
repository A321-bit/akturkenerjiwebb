import { makeListCreateHandlers } from "@/lib/admin-crud";

const { GET, POST } = makeListCreateHandlers("blog_posts", "published_at");
export { GET, POST };
