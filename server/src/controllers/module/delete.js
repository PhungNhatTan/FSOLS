import moduleModel from "../../models/module/index.js";

const deleteModule = async (req, res, next) => {
    try {
        const { id } = req.params;
        const deletedModule = await moduleModel.remove(Number(id));
        if (!deletedModule) {
            return res.status(404).json({ message: 'Module not found' });
        }
        res.json({ message: 'Module deleted successfully' });
    } catch (err) {
        next(err);
    }
}

export default deleteModule;
