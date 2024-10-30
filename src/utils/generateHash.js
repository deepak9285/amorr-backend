import md5 from "md5";

const generateHash = async (data) => {
    const hash = await md5(data + new Date().getTime());
    return hash;
  };
  
  export default generateHash;
  