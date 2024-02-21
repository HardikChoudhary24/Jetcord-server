import axios from "axios";
import { prisma } from "../../clients/db";
import { generateJWT } from "../../services/jwt";
import { GraphqlContext } from "../interfaces";

type GoogleTokenResult = {
  [key: string]: string;
};

const queries = {
  //verifyGoogleToken takes the oauthToken, extracts the user info and returns a jwtToken
  verifyGoogleToken: async (parent: any, { token }: { token: string }) => {
    const googleOAuthURI = new URL("https://oauth2.googleapis.com/tokeninfo");
    googleOAuthURI.searchParams.set("id_token", token);

    const { data } = await axios.get<GoogleTokenResult>(
      googleOAuthURI.toString(),
      {
        responseType: "json",
      }
    );

    const checkUser = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (!checkUser) {
      await prisma.user.create({
        data: {
          firstName: data.given_name,
          email: data.email,
          lastName: data.family_name,
          profileImageURL: data.picture,
        },
      });
    }

    const user = await prisma.user.findUnique({ where: { email: data.email } });

    const jwtToken = generateJWT(user!);
    return jwtToken;
  },
  getCurrentUser: async (
    parent: any,
    args: any,
    contextValue: GraphqlContext
  ) => {
    const id = contextValue.user?.id;
    if (!id) return null;

    const user = await prisma.user.findUnique({ where: { id } });
    return user;
  },
};

export const resolvers = { queries };
