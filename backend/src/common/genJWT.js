import jwt from 'jsonwebtoken';

export const genJWT = (data) => {
  const token = jwt.sign({ data }, process.env.JWT_SECRET, {
    expiresIn: '12h',
  });
  return token;
};