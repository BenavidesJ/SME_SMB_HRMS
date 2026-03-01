import { jest } from "@jest/globals";

export const createHttpMocks = ({ body = {}, user = undefined } = {}) => {
	const req = { body, user };
	const res = {
		status: jest.fn().mockReturnThis(),
		json: jest.fn().mockReturnThis(),
	};
	const next = jest.fn();

	return { req, res, next };
};
