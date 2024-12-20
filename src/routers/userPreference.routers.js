import { Router } from 'express';
import {
    createUserPreference,
    getUserPreference,
    updateUserPreference,
    deleteUserPreference
} from '../controllers/userPreference.controllers.js';

const router = Router(); 

router.route('/').post(createUserPreference);
router.route('/get').post(getUserPreference);
router.route('/update').post(updateUserPreference);
router.route('/:id').delete(deleteUserPreference);

export default router;
