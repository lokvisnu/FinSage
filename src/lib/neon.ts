// src/lib/neon.ts
import { Pool } from '@neondatabase/serverless';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export const query = (text: string, params?: any[]) => pool.query(text, params);
/**
 * Converts a SQL query with '?' placeholders to a format compatible with Neon/Postgres,
 * replacing each '?' with a numbered parameter like $1, $2, etc.
 * @param queryString - The SQL query string with '?' placeholders.
 * @returns The query string with placeholders replaced by $1, $2, etc.
 */
export const convertToNeonCompatibleQuery = (queryString: string): string => {
  // SELECT * FROM users WHERE email = ? => SELECT * FROM users WHERE email = $1
  if(!queryString.includes("?"))
    return queryString
  const queryParts = queryString.split("?");
  let result = "";
  queryParts.forEach((part: string, index: number) => {
    result = `${result}${index ? '$' + index.toString() : ''}${part}`;
  });
  return result;
}
export default pool;
