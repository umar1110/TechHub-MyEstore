 const UserRolesEnum = {
    ADMIN: "ADMIN",
    USER: "USER",
  };
  
   const AvailableUserRoles = Object.values(UserRolesEnum);



 const UserLoginType = {
    GOOGLE: "GOOGLE",
    GITHUB: "GITHUB",
    EMAIL_PASSWORD: "EMAIL_PASSWORD",
  };
  
const AvailableSocialLogins = Object.values(UserLoginType);

 const USER_TEMPORARY_TOKEN_EXPIRY = 20 * 60 * 1000; // 20 minutes
module.exports = {
    AvailableSocialLogins,
    UserLoginType,
    AvailableUserRoles,
    UserRolesEnum,
    USER_TEMPORARY_TOKEN_EXPIRY
  };