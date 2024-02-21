import { User } from "@prisma/client";
import jwt from "jsonwebtoken"
import { JWTUser } from "../app/interfaces";

const JWT_SECRET = "shfks#&@*1223"

export const generateJWT = (user: User) => {
    const payload: JWTUser= {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
    };
    const token = jwt.sign(payload, JWT_SECRET);

    return token;
};

export const decodeJWT = async(token:string)=>{
    try{
        const user = jwt.verify(token, JWT_SECRET);
        return user as JWTUser;
    }catch(err){
        return err
    }
}

