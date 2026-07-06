import { makeItemHandlers } from "@/lib/admin-crud";

const { PUT, DELETE } = makeItemHandlers("testimonials");
export { PUT, DELETE };
