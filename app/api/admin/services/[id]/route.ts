import { makeItemHandlers } from "@/lib/admin-crud";

const { PUT, DELETE } = makeItemHandlers("services");
export { PUT, DELETE };
