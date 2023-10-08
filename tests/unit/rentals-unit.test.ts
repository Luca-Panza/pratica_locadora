import { Movie, Rental, User } from "@prisma/client";
import { RentalInput } from "protocols";
import usersRepository from "repositories/users-repository";
import rentalsService from "services/rentals-service";
import { buildUserInput } from "../factories/user-factory";
import rentalsRepository from "repositories/rentals-repository";
import { buildRentalReturn } from "../factories/rental-factory";
import { buildMovieInput } from "../factories/movie-factory";
import moviesRepository from "repositories/movies-repository";
import { notFoundError } from "errors/notfound-error";

beforeEach(() => {
  jest.clearAllMocks();
});

describe("get rentals tests", () => {
  it("should return rentals", async () => {
    jest.spyOn(rentalsRepository, "getRentals").mockResolvedValueOnce([
      { id: 1, closed: false, date: new Date(), endDate: new Date(), userId: 1 },
      { id: 2, closed: false, date: new Date(), endDate: new Date(), userId: 1 },
    ]);

    const rentals = await rentalsService.getRentals();
    expect(rentals).toHaveLength(2);
  });

  it("should return a specific rental", async () => {
    const mockRental: Rental & { movies: Movie[] } = {
      id: 1,
      closed: false,
      date: new Date(),
      endDate: new Date(),
      userId: 1,
      movies: [
        {
          id: 1,
          adultsOnly: true,
          name: "Crazy Adventure",
          rentalId: 1,
        },
      ],
    };
    jest.spyOn(rentalsRepository, "getRentalById").mockResolvedValueOnce(mockRental);
    const rental = await rentalsService.getRentalById(1);
    expect(rental).toEqual(mockRental);
  });

  it("should return notFoundError when specific rental is not found", async () => {
    jest.spyOn(rentalsRepository, "getRentalById").mockResolvedValueOnce(null);
    const promise = rentalsService.getRentalById(1);
    expect(promise).rejects.toEqual(notFoundError("Rental not found."));
  });
});

describe("Create Rental", () => {
  it("should throw an error when user does not exist", async () => {
    jest.spyOn(usersRepository, "getById").mockResolvedValueOnce(undefined);

    const rentalInput: RentalInput = {
      userId: 1,
      moviesId: [1, 2, 3],
    };
    const promise = rentalsService.createRental(rentalInput);
    expect(usersRepository.getById).toBeCalledTimes(1);
    expect(promise).rejects.toEqual({
      name: "NotFoundError",
      message: "User not found.",
    });
  });

  it("should throw an error when user already have a rental", async () => {
    const mockUser: User = { id: 1, ...buildUserInput(true) };
    const mockRental: Rental = buildRentalReturn(mockUser.id, true);

    jest.spyOn(usersRepository, "getById").mockResolvedValueOnce(mockUser);
    jest.spyOn(rentalsRepository, "getRentalsByUserId").mockResolvedValueOnce([mockRental]);

    const rentalInput: RentalInput = {
      userId: 1,
      moviesId: [1, 2, 3],
    };
    const promise = rentalsService.createRental(rentalInput);
    expect(promise).rejects.toEqual({
      name: "PendentRentalError",
      message: "The user already have a rental!",
    });
  });

  it("should throw an error when a minor user wants to rent a adults only movie", async () => {
    const mockUser: User = { id: 1, ...buildUserInput(false) };
    const mockMovie: Movie = { id: 1, rentalId: null, ...buildMovieInput(true) };

    jest.spyOn(usersRepository, "getById").mockResolvedValueOnce(mockUser);
    jest.spyOn(rentalsRepository, "getRentalsByUserId").mockResolvedValueOnce([]);
    jest.spyOn(moviesRepository, "getById").mockResolvedValueOnce(mockMovie);

    const rentalInput: RentalInput = {
      userId: mockUser.id,
      moviesId: [mockMovie.id],
    };

    const promise = rentalsService.createRental(rentalInput);
    expect(promise).rejects.toEqual({
      name: "InsufficientAgeError",
      message: "Cannot see that movie.",
    });
  });

  it("should throw an error when movie does not exist", async () => {
    const mockUser: User = { id: 1, ...buildUserInput(false) };

    jest.spyOn(usersRepository, "getById").mockResolvedValueOnce(mockUser);
    jest.spyOn(rentalsRepository, "getRentalsByUserId").mockResolvedValueOnce([]);
    jest.spyOn(moviesRepository, "getById").mockResolvedValueOnce(null);

    const rentalInput: RentalInput = {
      userId: mockUser.id,
      moviesId: [1],
    };

    const promise = rentalsService.createRental(rentalInput);
    expect(promise).rejects.toEqual({
      name: "NotFoundError",
      message: "Movie not found.",
    });
  });

  it("should throw an error when movie is not available", async () => {
    const mockUser: User = { id: 1, ...buildUserInput(true) };
    const mockMovie: Movie = { id: 1, rentalId: 2, ...buildMovieInput(true) };

    jest.spyOn(usersRepository, "getById").mockResolvedValueOnce(mockUser);
    jest.spyOn(rentalsRepository, "getRentalsByUserId").mockResolvedValueOnce([]);
    jest.spyOn(moviesRepository, "getById").mockResolvedValueOnce(mockMovie);

    const rentalInput: RentalInput = {
      userId: mockUser.id,
      moviesId: [mockMovie.id],
    };

    const promise = rentalsService.createRental(rentalInput);
    expect(promise).rejects.toEqual({
      name: "MovieInRentalError",
      message: "Movie already in a rental.",
    });
  });

  it("should do a rental for a movie", async () => {
    const mockUser: User = { id: 1, ...buildUserInput(true) };
    const mockMovie: Movie = { id: 1, rentalId: null, ...buildMovieInput(true) };

    jest.spyOn(usersRepository, "getById").mockResolvedValueOnce(mockUser);
    jest.spyOn(rentalsRepository, "getRentalsByUserId").mockResolvedValueOnce([]);
    jest.spyOn(moviesRepository, "getById").mockResolvedValueOnce(mockMovie);
    jest.spyOn(rentalsRepository, "createRental").mockResolvedValueOnce(null);

    const rentalInput: RentalInput = {
      userId: mockUser.id,
      moviesId: [mockMovie.id],
    };

    const promise = await rentalsService.createRental(rentalInput);
    expect(promise).toBe(null);
  });
});

describe("finish rentals tests", () => {
  it("should throw an error if rental does not exists", async () => {
    jest.spyOn(rentalsRepository, "getRentalById").mockResolvedValue(null);
    const promise = rentalsService.finishRental(1);
    expect(promise).rejects.toEqual({
      name: "NotFoundError",
      message: "Rental not found.",
    });
  });

  it("should finish a rental", async () => {
    const mockRental: Rental & { movies: Movie[] } = {
      ...buildRentalReturn(1, false),
      movies: [
        {
          id: 1,
          rentalId: 1,
          ...buildMovieInput(true),
        },
      ],
    };
    jest.spyOn(rentalsRepository, "getRentalById").mockResolvedValue(mockRental);
    jest.spyOn(rentalsRepository, "finishRental").mockResolvedValue();
    await rentalsService.finishRental(1);
  });
});
