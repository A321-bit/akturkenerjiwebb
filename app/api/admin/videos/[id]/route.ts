import { makeItemHandlers } from "@/lib/admin-crud";

const { PUT, DELETE } = makeItemHandlers("site_videos");
export { PUT, DELETE };
