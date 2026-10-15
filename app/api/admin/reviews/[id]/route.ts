import { makeItemHandlers } from "@/lib/admin-crud";

// PUT { approved: true|false } ile onay, DELETE ile silme.
const { PUT, DELETE } = makeItemHandlers("product_reviews");
export { PUT, DELETE };
