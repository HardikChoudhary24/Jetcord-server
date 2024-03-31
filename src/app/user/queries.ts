export const queries = `#graphql
    verifyGoogleToken(token: String!) : SignInInfo
    getCurrentUser:User
    getAllUsername:[String]
    getUserDetails(payload:String!):User
`;
