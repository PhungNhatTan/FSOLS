import prisma from "../../prismaClient.js";

const deleteCourt = async (id) => {
    return prisma.court.delete({
        where: { id }
    });
};

export default deleteCourt;
