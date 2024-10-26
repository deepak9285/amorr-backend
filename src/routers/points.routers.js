import { Router } from "express";
import { pointscredited,pointsdebited, pointsredeem } from "../controllers/points.controller.js";

const router = Router();

router.route("/pointscredited").patch(pointscredited);
router.route("/pointsdebited").patch(pointsdebited);
router.route("/pointsredeem").patch(pointsredeem);

export default router;