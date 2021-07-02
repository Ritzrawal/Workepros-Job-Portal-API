module.exports = {
  trimAndLowCase: async (obj) => {
    if (typeof obj === 'object') {
      const tempObj = await Promise.all(
          obj.map(async (ob)=>{
            return ob.trim().toLowerCase();
          }),
      );
      return tempObj;
    }
    if (typeof obj === 'string') {
      console.log('string', obj);
      return obj.trim().toLowerCase();
    }
  },
}
;
