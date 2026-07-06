import { makeItemHandlers } from "@/lib/admin-crud";

const { PUT, DELETE } = makeItemHandlers("blog_posts");
export { PUT, DELETE };
