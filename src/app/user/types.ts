export const types = `#graphql
    type User{
        id:ID!
        firstName:String!
        lastName:String
        email:String!
        profileImageURL:String
        userName:String
        posts: [Post]
        following:[User]
        follower:[User]
    }
    type SignInInfo{
        jwtToken:String!
        newUser:Boolean!
    }
`;
