import { makeItemHandlers } from "@/lib/admin-crud";

const { PUT, DELETE } = makeItemHandlers("project_references");
export { PUT, DELETE };
