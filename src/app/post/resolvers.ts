import { prisma } from "../../clients/db";
import { GraphqlContext } from "../interfaces";
import { Post } from "@prisma/client";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
interface CreatePostData {
  content: string;
  mediaURL?: string;
}
const s3 = new S3Client({
  region: "ap-south-1",
  credentials: {
    accessKeyId: process.env.AWS_S3_ACCESS!,
    secretAccessKey: process.env.AWS_S3_SECRET!,
  },
});

const queries = {
  getAllPosts: async (parent: any, args: any, contextValue: GraphqlContext) => {
    if (!contextValue.user) throw new Error("You are not authenticated!");
    return await prisma.post.findMany({ orderBy: { createdAt: "desc" } });
  },
  getSignedURL: async (
    parent: any,
    { imageType }: { imageType: string },
    contextValue: GraphqlContext
  ) => {
    if (!contextValue.user || !contextValue.user.id)
      throw new Error("You are not authenticated!");
    const allowedImageType = ["jpeg", "jpg", "webp", "png", "svg"];
    if (!allowedImageType.includes(imageType.split("image/")[1]))
      throw new Error("File type is not supported");
    const putObjectCommand = new PutObjectCommand({
      Bucket: "jetcord-dev",
      Key: `uploads/${
        contextValue.user.id
      }/posts/${Date.now().toString()}-${imageType}`,
    });
    const signedURL = await getSignedUrl(s3, putObjectCommand);

    return signedURL;
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
export const resolvers = { mutations, post, queries };
