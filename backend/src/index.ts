import { createApp } from "./app.js";
import { config } from "./config.js";
import { buildImageService } from "./container.js";
import { consoleLogger } from "./utils/logger.js";

const app = createApp({
  imageService: buildImageService(),
  frontendOrigin: config.FRONTEND_ORIGIN,
});

app.listen(config.PORT, () => {
  consoleLogger.info(`Backend listening on http://localhost:${config.PORT}`);
});
