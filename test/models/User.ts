
import schema, { trans } from '../util/schema'
import { isEmail, isNum, isRelKey, isStr, optIsStr } from '../util/validators';


// **** Types ***** //

interface IUser {
  id: number; // pk
  name: string;
  age: number;
  email: string;
  created: Date;
  lastLogin: Date;
  avatar?: IAvatar | null;
}

export interface IAvatar {
  fileName: string;
  data: string;
  url?: string;
}


// **** Setup **** //

const User = schema<IUser>({
  id: isRelKey,
  name: isStr,
  email: isEmail,
  age: isNum,
  created: Date,
  lastLogin: Date,
  avatar: schema({
    fileName: isStr,
    data: isStr,
    url: optIsStr,
  }, true, true),
});

export default User;
