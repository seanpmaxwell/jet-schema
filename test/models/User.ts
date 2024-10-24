import schema from '../util/schema'
import { isEmail, isRelKey, isStr, optIsStr } from '../util/validators';


// **** Types ***** //

interface IUser {
  id: number; // pk
  name: string;
  email: string;
  created: Date;
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
  created: Date,
  avatar: schema({
    fileName: isStr,
    data: isStr,
    url: optIsStr,
  }, true, true),
});

console.log(User.new());
