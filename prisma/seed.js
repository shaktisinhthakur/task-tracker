"use strict";
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const prisma = new PrismaClient();
async function main() {
    // Clear existing data
    await prisma.credentialCell.deleteMany();
    await prisma.credentialRow.deleteMany();
    await prisma.credentialColumn.deleteMany();
    await prisma.taskHistory.deleteMany();
    await prisma.task.deleteMany();
    await prisma.employee.deleteMany();
    await prisma.user.deleteMany();
    // Create an initial Admin user
    const adminPasswordHash = await bcrypt.hash('admin123', 10);
    const admin = await prisma.user.create({
        data: {
            name: 'Super Admin',
            email: 'admin@example.com',
            passwordHash: adminPasswordHash,
            role: 'ADMIN',
            mustChangePassword: false,
        },
    });
    // Create an initial User
    const userPasswordHash = await bcrypt.hash('user123', 10);
    const user = await prisma.user.create({
        data: {
            name: 'Regular User',
            email: 'user@example.com',
            passwordHash: userPasswordHash,
            role: 'USER',
            mustChangePassword: false,
        },
    });
    // Create some employees
    const emp1 = await prisma.employee.create({
        data: {
            name: 'Alice Smith',
            designation: 'Software Engineer',
            phone: '1234567890',
            email: 'alice@example.com',
            joinedAt: new Date('2023-01-15'),
        },
    });
    const emp2 = await prisma.employee.create({
        data: {
            name: 'Bob Johnson',
            designation: 'UI/UX Designer',
            phone: '0987654321',
            email: 'bob@example.com',
            joinedAt: new Date('2023-03-22'),
        },
    });
    // Create some tasks
    await prisma.task.create({
        data: {
            title: 'Design Landing Page',
            description: 'Create a responsive and modern landing page.',
            employeeId: emp2.id,
            assignedDate: new Date(),
            deadline: new Date(new Date().setDate(new Date().getDate() + 7)),
            priority: 'HIGH',
            status: 'IN_PROGRESS',
            progress: 40,
        },
    });
    await prisma.task.create({
        data: {
            title: 'Implement Auth API',
            description: 'Setup JWT authentication and user roles.',
            employeeId: emp1.id,
            assignedDate: new Date(),
            deadline: new Date(new Date().setDate(new Date().getDate() + 5)),
            priority: 'HIGH',
            status: 'NOT_STARTED',
            progress: 0,
        },
    });
    console.log('Seed completed!');
}
main()
    .then(async () => {
    await prisma.$disconnect();
})
    .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
});
