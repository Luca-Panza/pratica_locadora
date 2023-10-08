import { faker } from "@faker-js/faker";
import { Movie } from "@prisma/client";
import prisma from "../../src/database";

type MovieInput = Omit<Movie, "id" | "rentalId">;

export function buildMovie(adultsOnly = false) {
  const data: MovieInput = buildMovieInput(adultsOnly);
  return prisma.movie.create({ data });
}

export function buildMovieInput(adultsOnly: boolean): MovieInput {
  return {
    name: faker.commerce.productName(),
    adultsOnly,
  };
}
