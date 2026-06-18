import express from "express";
import router from "./routes/router.js";

const app = express();

app.use(express.json());
app.use("/", router);

// Error handler for invalid JSON payloads
app.use((err, req, res, next) => {
	if (!err) return next();

	// body-parser / express.json sets a SyntaxError with status 400 for invalid JSON
	if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
		return res.status(400).json({ message: 'Invalid JSON payload' });
	}

	// fallback for other body-parser errors
	if (err.type === 'entity.parse.failed') {
		return res.status(400).json({ message: 'Invalid JSON payload' });
	}

	next(err);
});

export default app;