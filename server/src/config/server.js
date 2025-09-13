import dotenv from "dotenv";

dotenv.config();

const PORT = process.env.PORT || 5000;

const JWT_SECRET = (process.env.JWT_SECRET || "").length >= 32
  ? process.env.JWT_SECRET
  : "CHANGE_THIS_TO_A_32+_CHAR_SECRET_1234567890abcd";

const TOKEN_TTL_SEC = Number(process.env.JWT_TTL || 3600);

export { PORT, JWT_SECRET, TOKEN_TTL_SEC };
