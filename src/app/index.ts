import express from "express";
import { ApolloServer } from "@apollo/server";
import { expressMiddleware } from "@apollo/server/express4";
import { User } from "./user";
import cors from "cors";
import { GraphqlContext } from "./interfaces";
import { decodeJWT } from "../services/jwt";
import { Post } from "./post";

export const initServer = async () => {
  const app = express();
  const server = new ApolloServer<GraphqlContext>({
    typeDefs: `
            ${User.types}
            ${Post.types}
            type Query{
              ${User.queries}
              ${Post.queries}
            }
            type Mutation{
              ${Post.mutations}
            }

        `,
    resolvers: {
      Query: {
        ...User.resolvers.queries,
        ...Post.resolvers.queries
      },
      Mutation:{
        ...Post.resolvers.mutations,
      },
      Post:{
        ...Post.resolvers.post
      },
      User:{
        ...User.resolvers.user
      }
    },
  });
  await server.start();
  app.use([cors(), express.json()]);
  app.use(
    "/graphql",
    expressMiddleware(server, {
      //In context we authorise the request through the JWT token recived and return the user
      context: async ({ req }) => {
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
