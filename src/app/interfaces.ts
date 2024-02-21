export interface JWTUser{
    id:string
    firstName:string
    email:string
}

export interface GraphqlContext {
  user?: JWTUser;
}