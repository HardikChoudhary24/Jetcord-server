import { prisma } from "../../clients/db";
import { GraphqlContext } from "../interfaces";
import {Post} from "@prisma/client"
interface CreatePostData {
  content: string;
  mediaURL?: string;
}
const queries = {
  async getAllPosts(parent:any, args:any,contextValue:GraphqlContext){
    if(!contextValue.user) throw new Error("You are not authenticated!");
    return await prisma.post.findMany({orderBy:{createdAt:"desc"}});
  },
};
const mutations = {
  async createPost(
    parent: any,
    { payload }: { payload: CreatePostData },
    contextValue: GraphqlContext
  ) {
    if (!contextValue.user) throw new Error("You are not authenticated!");
    const { content, mediaURL } = payload;
    const post = await prisma.post.create({
      data: {
        content,
        mediaURL,
        author: { connect: { id: contextValue.user.id } },
      },
    });
    return post;
  },
};
const post = {
  async author(parent: Post, args: any, contextValue: GraphqlContext) {
    return await prisma.user.findUnique({ where: { id: parent.authorId } });
  },
};
export const resolvers ={mutations,post,queries}
