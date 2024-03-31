import axios from "axios";
import { prisma } from "../../clients/db";
import { generateJWT } from "../../services/jwt";
import { GraphqlContext } from "../interfaces";
import { User } from "@prisma/client";
import { v4 as uuidv4 } from "uuid";
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

    let newUser = false;
    if (!checkUser) {
      await prisma.user.create({
        data: {
          firstName: data.given_name,
          email: data.email,
          lastName: data.family_name,
          profileImageURL: data.picture || "",
          userName: uuidv4(),
        },
      });
      newUser = true;
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
    return { jwtToken, newUser };
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
  getAllUsername: async (
    parent: any,
    args: any,
    contextValue: GraphqlContext
  ) => {
    const users = await prisma.user.findMany();
    return users.map((user) => user.userName);
  },
  getUserDetails: async (parent: any, { payload }: { payload: string }) => {
    const user = await prisma.user.findUnique({ where: { userName: payload } });
    if (user) {
      return user;
    }
    throw new Error("Username not found");
  },
};

const user = {
  async posts(parent: User) {
    return await prisma.post.findMany({ where: { authorId: parent.id } });
  },
  async following(parent: User) {
    const followingData= await prisma.follow.findMany({ where: { followedBy: {id:parent.id} },include:{following:true} });
    return followingData.map(data=>data.following);
  },
  async follower(parent:User){
    const followerData = await prisma.follow.findMany({where:{following:{id:parent.id}},include:{followedBy:true,}});
    return followerData.map((data) => data.followedBy);
  },
};

const mutations = {
  async editUsername(
    parent: any,
    { payload }: { payload: string },
    contextValue: GraphqlContext
  ) {
    const id = contextValue?.user?.id;
    if (!id) throw new Error("You are not authenticated!");

    const user = await prisma.user.update({
      where: { id },
      data: { userName: payload },
    });
  },
  async follow(
    parent: any,
    { userToFollow }: { userToFollow: string },
    contextValue: GraphqlContext
  ) {
    const id = contextValue.user?.id;
    if (!id) throw new Error("You are not authenticated!");
    const userToFollowDetails = await prisma.user.findUnique({
      where: { userName: userToFollow },
    });
    if (userToFollowDetails) {
      await prisma.follow.create({
        data: {
          followedBy: { connect: { id: id } },
          following: { connect: { id: userToFollowDetails.id } },
        },
      });
      return true;
    } else {
      return false;
    }
  },
  async unfollow(
    parent: any,
    { userToUnfollow }: { userToUnfollow: string },
    contextValue: GraphqlContext
  ) {
    const id = contextValue.user?.id;
    if (!id) throw new Error("You are not authenticated!");
    const userToUnfollowDetails = await prisma.user.findUnique({
      where: { userName: userToUnfollow },
    });
    if (userToUnfollowDetails) {
      await prisma.follow.delete({
        where:{followedById_followingId:{followedById:id,followingId:userToUnfollowDetails.id}}
      });
      return true;
    } else {
      return false;
    }
  },
};
export const resolvers = { queries, user, mutations };
