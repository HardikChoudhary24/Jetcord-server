import express from "express";
import { ApolloServer } from "@apollo/server";
import { expressMiddleware } from "@apollo/server/express4";
import { User } from "./user";
import cors from "cors";
import { GraphqlContext } from "./interfaces";
import { decodeJWT } from "../services/jwt";

export const initServer = async () => {
  const app = express();
  const server = new ApolloServer<GraphqlContext>({
    typeDefs: `
            ${User.types}
            type Query{
                ${User.queries}
            }
        `,
    resolvers: {
      Query: {
        ...User.resolvers.queries,
      },
    },
  });
  await server.start();
  app.use([cors(), express.json()]);
  app.use(
    "/graphql",
    expressMiddleware(server, {
      context: async ({ req, res }) => {
        return {
          user: req.headers.authorization
            ? await decodeJWT(req.headers.authorization.split("Bearer ")[1])
            : undefined,
        };
      },
    })
  );
  return app;
};
