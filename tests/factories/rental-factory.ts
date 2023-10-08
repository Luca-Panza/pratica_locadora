import { faker } from "@faker-js/faker";
import { Rental } from "@prisma/client";
import prisma from "../../src/database";
import { RENTAL_LIMITATIONS } from "../../src/services/rentals-service";

export async function buildRental(userId: number) {
  const data = buildRentalInput(userId);
  return await prisma.rental.create({ data });
}

export function buildRentalInput(userId: number) {
  return {
    userId,
    endDate: new Date(new Date().getDate() + RENTAL_LIMITATIONS.RENTAL_DAYS_LIMIT),
  };
}

export function buildRentalReturn(userId: number, closed = false): Rental {
  const date = new Date();
  return {
    id: faker.number.int({ min: 1, max: 99 }),
    userId,
    closed,
    date,
    endDate: faker.date.future({ refDate: date }),
  };
}

export async function rentMovie(rentalId: number, movieId: number) {
  await prisma.movie.update({
    data: { rentalId },
    where: { id: movieId },
  });
}
