const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../config/db');

const login = async (email, password) => {
    if (!email || !password) {
        throw { status: 400, message: 'Email and password required' };
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
        throw { status: 401, message: 'Invalid credentials' };
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
        throw { status: 401, message: 'Invalid credentials' };
    }

    const token = jwt.sign(
        { id: user.id, email: user.email, role: user.role, name: user.name },
        process.env.JWT_SECRET,
        { expiresIn: '12h' }
    );

    return {
        token,
        user: { id: user.id, name: user.name, email: user.email, role: user.role }
    };
};

const register = async (userData) => {
    const { name, email, password, role, zoneId, cityId, woredaId } = userData;
    if (!name || !email || !password) {
        throw { status: 400, message: 'Name, email, and password required' };
    }

    const hashed = await bcrypt.hash(password, 10);
    try {
        const user = await prisma.user.create({
            data: { name, email, password: hashed, role: role || 'ticketer', zoneId, cityId, woredaId }
        });
        return { id: user.id, name: user.name, email: user.email, role: user.role };
    } catch (err) {
        if (err.code === 'P2002') {
            throw { status: 409, message: 'Email already exists' };
        }
        throw err;
    }
};

const getMe = async (userId) => {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, name: true, email: true, role: true, zoneId: true, cityId: true, woredaId: true }
    });
    return user;
};

module.exports = {
    login,
    register,
    getMe
};
