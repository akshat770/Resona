const ensureAuth = (req,res,next)=>{
  if(req.user) return next();
  res.status(401).json({ message:'Unauthorized' });
};

module.exports = ensureAuth;
