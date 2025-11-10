import prisma from "../../prismaClient.js";

const deleteCourse = async (id, date) => {
    const result = await prisma.course.updateMany({
        where: { id, DeletedAt: null },
        data: { DeletedAt: date },
    });

    return result.count === 0 ? null : { id };
};

export default deleteCourse;
