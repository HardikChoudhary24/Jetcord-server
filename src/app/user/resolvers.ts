import axios from "axios";
import { prisma } from "../../clients/db";
import { generateJWT } from "../../services/jwt";
import { GraphqlContext } from "../interfaces";
import { User } from "@prisma/client";
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
          profileImageURL: data.picture || "",
        },
      });
    }

    const user = await prisma.user.findUnique({ where: { email: data.email } });

    if (user && user?.profileImageURL !== data.picture) {
      await prisma.user.update({
        where: { email: user?.email },
        data: { profileImageURL: data.picture },
      });
      user.profileImageURL = data.picture;
    }
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

const user = {
  async posts(parent: User) {
    console.log(parent);
    return await prisma.post.findMany({ where: { authorId: parent.id } });
  },
};

export const resolvers = { queries, user };
