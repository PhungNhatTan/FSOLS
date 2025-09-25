import moduleModel from "../../models/module/index.js";

/**
 * HTTP POST /api/module
 * Body: { CourseId, OrderNo? }
 */
export default async function create(req, res, next) {
    try {
        const payload = req.body || {};

        // optional server-side sanitization/whitelisting:
        const data = {
            CourseId: payload.CourseId,
            OrderNo: payload.OrderNo,
        };

        const created = await moduleModel.create(data);
        return res.status(201).json(created);
    } catch (err) {
        // if model threw custom status, preserve it
        if (err && err.status) {
            return res.status(err.status).json({ error: err.message })
        };
        return next(err);
    }
}
