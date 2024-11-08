import { Router } from 'express';
import {
    createUserPreference,
    getUserPreference,
    updateUserPreference,
    deleteUserPreference
} from '../controllers/userPreference.controllers.js';

const router = Router();

router.route('/').post(createUserPreference);
router.route('/:id').get(getUserPreference);
router.route('/:id').put(updateUserPreference);
router.route('/:id').delete(deleteUserPreference);

export default router;
