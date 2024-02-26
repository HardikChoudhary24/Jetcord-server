export const types = `#graphql
    type Post{
        id: ID!
        content:String!
        mediaURL:String
        author:User!
    }

    input CreatePostData{
        content:String!
        mediaURL:String
    }
`;
