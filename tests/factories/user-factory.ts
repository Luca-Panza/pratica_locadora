import { faker } from "@faker-js/faker";
import { User } from "@prisma/client";
import prisma from "../../src/database";

type UserInput = Omit<User, "id" | "rentals">;

export async function buildUser(adult = true) {
  const data: UserInput = buildUserInput(adult);
  return await prisma.user.create({ data });
}

export function buildUserInput(adult: boolean) {
  return {
    firstName: faker.person.firstName(),
    lastName: faker.person.lastName(),
    email: faker.internet.email(),
    birthDate: generateBirthdate(adult),
    cpf: faker.internet.ipv4().replace(/\.$/g, ""),
  };
}

function generateBirthdate(adult: boolean) {
  return adult ? faker.date.birthdate({ min: 18, mode: "age" }) : faker.date.birthdate({ min: 10, max: 16, mode: "age" });
}
