const { getCategories, getCategoryById } = require('./categories.service');

exports.getAll = async(_, res) => {
  try {
    const categories = await getCategories();
    res.status(200).json(categories);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch categories.' })
  }
}

exports.getById = async(req, res) => {
  try {
    const category = await getCategoryById(req.params.id);
    res.status(200).json(category);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch category.' })
  }
}
