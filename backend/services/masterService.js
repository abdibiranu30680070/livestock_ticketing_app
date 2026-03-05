const prisma = require('../config/db');

const getAllZones = async () => {
    return await prisma.zone.findMany({ orderBy: { name: 'asc' } });
};

const getAllCities = async (zoneId) => {
    return await prisma.city.findMany({
        where: zoneId ? { zoneId: parseInt(zoneId) } : {},
        include: { zone: { select: { name: true } } },
        orderBy: { name: 'asc' }
    });
};

const getAllWoredas = async (cityId) => {
    return await prisma.woreda.findMany({
        where: cityId ? { cityId: parseInt(cityId) } : {},
        include: { city: { select: { name: true } } },
        orderBy: { name: 'asc' }
    });
};

const getAllAnimalTypes = async () => {
    return await prisma.animalType.findMany({ orderBy: { name: 'asc' } });
};

const createAnimalType = async (data) => {
    const { name, taxAmount } = data;
    if (!name || taxAmount === undefined) {
        throw { status: 400, message: 'Name and taxAmount are required' };
    }
    return await prisma.animalType.create({ data: { name, taxAmount: parseFloat(taxAmount) } });
};

const updateAnimalType = async (id, data) => {
    const { name, taxAmount } = data;
    return await prisma.animalType.update({
        where: { id: parseInt(id) },
        data: { name, taxAmount: parseFloat(taxAmount) }
    });
};

const deleteAnimalType = async (id) => {
    await prisma.animalType.delete({ where: { id: parseInt(id) } });
    return { success: true };
};

const getAllUsers = async () => {
    return await prisma.user.findMany({
        select: { id: true, name: true, role: true, woredaId: true },
        orderBy: { name: 'asc' }
    });
};

module.exports = {
    getAllZones,
    getAllCities,
    getAllWoredas,
    getAllAnimalTypes,
    createAnimalType,
    updateAnimalType,
    deleteAnimalType,
    getAllUsers
};
