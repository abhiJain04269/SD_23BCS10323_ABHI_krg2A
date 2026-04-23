const validator = require('validator');
const bcrypt = require('bcrypt');

const Validate =async(data)=>{
    console.log(data);
    const mandatory_Fields=["First_Name","Email_Id"];
    const IsHave=mandatory_Fields.every((k)=>Object.keys(data).includes(k));
    if(!IsHave){
        throw new Error("Creditionals are Missing");
    }
    if (!validator.isEmail(data.Email_Id)) {
        throw new Error("Invalid email format");
      }
    
      if (!validator.isStrongPassword(data.Password)) {
        throw new Error("Password is not strong enough");
      }
    
    data.Password=await bcrypt.hash(data.Password,10);
}
module.exports=Validate;