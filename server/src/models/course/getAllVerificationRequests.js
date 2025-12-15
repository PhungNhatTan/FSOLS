import prisma from '../../prismaClient.js';

export default async function getAllVerificationRequests() {
    return await prisma.verificationRequest.findMany({
        include: {
            Course: {
                include: {
                    Category: true,
                    CreatedBy: {
                        select: {
                            AccountId: true,
                            Name: true,
                        },
                    },
                }
            },
            Specialization: true,
            ReviewedBy: {
                select: {
                    Id: true,
                    Username: true,
                    DisplayName: true
                }
            }
        },
        orderBy: {
            CreatedAt: 'desc'
        }
    });
}
